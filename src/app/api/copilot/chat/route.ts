import { NextRequest, NextResponse } from "next/server";
import { embed, generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import {
  copilotChatModel,
  copilotEmbeddingModel,
  isGeminiApiKeyConfigured,
} from "@/lib/ai/config";
import {
  cleanDocumentSummary,
  getAllowedVisibilitiesForRole,
  parseDocumentVisibility,
} from "@/lib/ai/rbac";

export interface CopilotCitation {
  documentId: string;
  title: string;
  category: string;
  snippet: string;
  similarity?: number;
}

interface ChatMessageInput {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const messages: ChatMessageInput[] = Array.isArray(body.messages)
      ? body.messages
      : [];
    const clientEvents = Array.isArray(body.events) ? body.events : [];

    const lastUserMessage =
      [...messages].reverse().find((m) => m.role === "user")?.content?.trim() ||
      "";

    if (!lastUserMessage) {
      return NextResponse.json(
        { error: "Please provide a question." },
        { status: 400 }
      );
    }

    // 1. Resolve User's Organization & Role
    const { data: membership } = await supabase
      .from("org_memberships")
      .select(
        `
        role,
        title,
        org_id,
        organizations (
          id,
          name,
          slug,
          university
        )
      `
      )
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    const rawOrg = membership?.organizations
      ? Array.isArray(membership.organizations)
        ? membership.organizations[0]
        : membership.organizations
      : null;

    const orgId: string | null = membership?.org_id || null;
    const orgName: string =
      (rawOrg as any)?.name ||
      user.user_metadata?.organization ||
      "Student Organization";
    const university: string =
      (rawOrg as any)?.university ||
      user.user_metadata?.university ||
      "University Campus";
    const userRole: string =
      membership?.role || user.user_metadata?.role || "member";
    const userTitle: string =
      membership?.title ||
      (userRole === "president"
        ? "President"
        : userRole === "treasurer"
        ? "Treasurer"
        : "Officer");

    const allowedVisibilities = getAllowedVisibilitiesForRole(userRole);

    // 2. Fetch Accessible Vault Documents (for metadata context & hybrid fallback)
    let docQuery = supabase
      .from("documents")
      .select("id, title, category, summary, created_at, uploader_name")
      .order("created_at", { ascending: false });

    if (orgId) {
      docQuery = docQuery.eq("org_id", orgId);
    }

    const { data: allOrgDocs } = await docQuery;

    const accessibleDocs = (allOrgDocs || []).filter((doc: any) => {
      const vis = parseDocumentVisibility(doc.summary, doc.visibility);
      return allowedVisibilities.includes(vis);
    });

    // 3. Fetch Active Organization Roster for live leadership context
    let rosterSummary = "";
    if (orgId) {
      const { data: rosterRows } = await supabase
        .from("org_memberships")
        .select(
          `
          role,
          title,
          profiles (
            full_name,
            email
          )
        `
        )
        .eq("org_id", orgId)
        .eq("is_active", true)
        .limit(30);

      if (rosterRows && rosterRows.length > 0) {
        rosterSummary = rosterRows
          .map((r: any) => {
            const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
            return `- ${p?.full_name || "Member"} (${r.title || r.role}, ${
              p?.email || "no email"
            })`;
          })
          .join("\n");
      }
    }

    // 4. Retrieve Relevant Document Chunks (Vector Search + Keyword Fallback)
    const citations: CopilotCitation[] = [];
    let retrievedContextBlocks: string[] = [];

    if (isGeminiApiKeyConfigured()) {
      try {
        const { embedding } = await embed({
          model: copilotEmbeddingModel,
          value: lastUserMessage,
        });

        const { data: vectorMatches, error: rpcError } = await supabase.rpc(
          "match_org_document_chunks",
          {
            query_embedding: embedding,
            filter_org_id: orgId,
            allowed_visibilities: allowedVisibilities,
            match_threshold: 0.25,
            match_count: 6,
          }
        );

        if (!rpcError && Array.isArray(vectorMatches) && vectorMatches.length > 0) {
          for (const match of vectorMatches) {
            retrievedContextBlocks.push(
              `[Source Document: "${match.document_title}" | Category: ${match.document_category} | Relevance: ${Math.round(
                (match.similarity || 0) * 100
              )}%]\n${match.content}`
            );

            if (!citations.some((c) => c.documentId === match.document_id)) {
              citations.push({
                documentId: match.document_id,
                title: match.document_title,
                category: match.document_category,
                snippet: String(match.content || "")
                  .replace(/^\[Document:.*?\]\n/, "")
                  .slice(0, 220),
                similarity: match.similarity,
              });
            }
          }
        }
      } catch (vecErr) {
        console.warn("Vector search fallback triggered:", vecErr);
      }
    }

    // Hybrid Keyword Fallback over accessible documents (if vector chunks aren't populated yet)
    if (retrievedContextBlocks.length === 0 && accessibleDocs.length > 0) {
      const queryWords = lastUserMessage
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length > 2);

      const scoredDocs = accessibleDocs
        .map((doc: any) => {
          const cleanSum = cleanDocumentSummary(doc.summary);
          const haystack = `${doc.title} ${doc.category} ${cleanSum}`.toLowerCase();
          const score = queryWords.reduce(
            (acc, word) => (haystack.includes(word) ? acc + 1 : acc),
            0
          );
          return { doc, cleanSum, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      for (const item of scoredDocs) {
        retrievedContextBlocks.push(
          `[Vault Document: "${item.doc.title}" | Category: ${item.doc.category} | Uploaded by: ${
            item.doc.uploader_name || "Officer"
          }]\nSummary/Notes: ${item.cleanSum || "Uploaded to organizational vault."}`
        );

        if (!citations.some((c) => c.documentId === item.doc.id)) {
          citations.push({
            documentId: item.doc.id,
            title: item.doc.title,
            category: item.doc.category,
            snippet: item.cleanSum || "Indexed in organizational document vault.",
          });
        }
      }
    }

    // Format upcoming calendar events if provided
    const eventsContext =
      clientEvents.length > 0
        ? clientEvents
            .slice(0, 10)
            .map(
              (ev: any) =>
                `- ${ev.title} on ${ev.date}${ev.time ? ` at ${ev.time}` : ""}${
                  ev.location ? ` (${ev.location})` : ""
                }: ${ev.description || ""}`
            )
            .join("\n")
        : "No upcoming events currently scheduled in local calendar.";

    // 5. Handle Placeholder API Key Gracefully
    if (!isGeminiApiKeyConfigured()) {
      const vaultList =
        accessibleDocs.length > 0
          ? accessibleDocs
              .slice(0, 5)
              .map(
                (d: any) =>
                  `• **${d.title}** (${d.category}) — *${cleanDocumentSummary(
                    d.summary
                  )}*`
              )
              .join("\n")
          : "• *No documents uploaded to your chapter vault yet.*";

      return NextResponse.json({
        role: "assistant",
        apiKeyMissing: true,
        content: `### ⚙️ Google Gemini API Key Placeholder Detected

Your AI Copilot pipeline, RBAC permissions (**${userTitle}** — allowed tiers: \`${allowedVisibilities.join(
          ", "
        )}\`), and Vault Retrieval are wired up and ready!

To activate live **Gemini 2.5 Flash** responses and **pgvector** embeddings:
1. Create a free API key at **[Google AI Studio](https://aistudio.google.com/apikey)**.
2. Open your \`.env.local\` file and replace the placeholder:
   \`\`\`env
   GOOGLE_GENERATIVE_AI_API_KEY=your_actual_api_key_here
   \`\`\`
3. Restart your dev server (\`npm run dev\`).

---
#### 📁 Accessible Vault Documents Found for **${orgName}** (${accessibleDocs.length}):
${vaultList}`,
        citations,
      });
    }

    // 6. Generate Grounded Response with Gemini 2.5 Flash
    const systemPrompt = `You are the AI Chief of Staff and Historical Archivist for "${orgName}" at ${university}.
You are assisting ${user.user_metadata?.full_name || user.email} (Role: ${userTitle}, Access Tiers: ${allowedVisibilities.join(", ")}).

Your mission:
1. Answer questions about past events, budgets, vendor contacts, university reservation rules, officer transitions, and chapter operations using the Organization's Document Vault context below.
2. Always cite the exact document title in brackets like [Source: Document Title] when referencing information from a document.
3. If the user asks for a checklist, timeline, handover guide, or announcement email, generate a clear, structured, actionable markdown template tailored to ${orgName}.
4. If a specific detail is not yet in the uploaded documents, clearly state that it is not in the current Vault records and provide helpful collegiate best-practice recommendations.

=== RETRIEVED VAULT DOCUMENTS (${retrievedContextBlocks.length} matches) ===
${
  retrievedContextBlocks.length > 0
    ? retrievedContextBlocks.join("\n\n---\n\n")
    : "No documents have been uploaded to the chapter vault yet."
}

=== ACTIVE CHAPTER ROSTER ===
${rosterSummary || "No roster records found."}

=== UPCOMING CHAPTER CALENDAR EVENTS ===
${eventsContext}`;

    const result = await generateText({
      model: copilotChatModel,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: 0.3,
    });

    return NextResponse.json({
      role: "assistant",
      content: result.text,
      citations,
    });
  } catch (err: any) {
    console.error("Copilot chat error:", err);
    return NextResponse.json(
      {
        error:
          err?.message ||
          "An error occurred while communicating with the AI Copilot.",
      },
      { status: 500 }
    );
  }
}
