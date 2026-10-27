import { NextRequest, NextResponse } from "next/server";
import { embedMany } from "ai";
import { createClient } from "@/lib/supabase/server";
import {
  copilotEmbeddingModel,
  isGeminiApiKeyConfigured,
} from "@/lib/ai/config";
import { chunkDocumentText } from "@/lib/ai/chunker";
import { extractTextFromBuffer } from "@/lib/ai/parser";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    let documentId = "";
    let orgId: string | null = null;
    let title = "Document";
    let category = "general";
    let rawText = "";
    let fileBuffer: ArrayBuffer | null = null;
    let mimeType = "application/octet-stream";
    let fileName = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      documentId = String(formData.get("documentId") || "");
      orgId = formData.get("orgId") ? String(formData.get("orgId")) : null;
      title = String(formData.get("title") || "Document");
      category = String(formData.get("category") || "general");
      rawText = String(formData.get("rawText") || "");

      const uploadedFile = formData.get("file");
      if (uploadedFile && typeof uploadedFile === "object" && "arrayBuffer" in uploadedFile) {
        const f = uploadedFile as File;
        fileBuffer = await f.arrayBuffer();
        mimeType = f.type || mimeType;
        fileName = f.name || title;
      }
    } else {
      const body = await req.json();
      documentId = body.documentId || "";
      orgId = body.orgId || null;
      title = body.title || "Document";
      category = body.category || "general";
      rawText = body.rawText || "";
    }

    if (!documentId) {
      return NextResponse.json(
        { error: "Missing documentId" },
        { status: 400 }
      );
    }

    // Fetch document metadata from database if available
    const { data: docRow } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .maybeSingle();

    if (docRow) {
      title = docRow.title || title;
      category = docRow.category || category;
      orgId = docRow.org_id || orgId;
      mimeType = docRow.mime_type || mimeType;
      fileName = docRow.file_path || fileName;

      // Download file from Supabase Storage if buffer wasn't sent directly
      if (!fileBuffer && !rawText && docRow.file_path) {
        const { data: blobData, error: storageErr } = await supabase.storage
          .from("org-documents")
          .download(docRow.file_path);

        if (!storageErr && blobData) {
          fileBuffer = await blobData.arrayBuffer();
        }
      }
    }

    // Extract text from binary buffer if needed
    if (!rawText && fileBuffer) {
      rawText = await extractTextFromBuffer(fileBuffer, mimeType, fileName);
    }

    // Fallback to document summary if file had no extractable body text
    if (!rawText.trim() && docRow?.summary) {
      rawText = docRow.summary;
    }

    if (!rawText.trim()) {
      return NextResponse.json({
        success: true,
        indexed: false,
        chunksCount: 0,
        message: "No extractable text found in document.",
      });
    }

    const chunks = chunkDocumentText(rawText, {
      title,
      category,
      chunkSize: 1800,
      chunkOverlap: 300,
    });

    if (chunks.length === 0) {
      return NextResponse.json({
        success: true,
        indexed: false,
        chunksCount: 0,
      });
    }

    // Check if GOOGLE_GENERATIVE_AI_API_KEY is configured (not placeholder)
    if (!isGeminiApiKeyConfigured()) {
      return NextResponse.json({
        success: true,
        indexed: false,
        chunksCount: chunks.length,
        extractedPreview: rawText.slice(0, 300),
        message:
          "Text extracted and chunked. Set GOOGLE_GENERATIVE_AI_API_KEY in .env.local to generate pgvector embeddings.",
      });
    }

    // Batch generate 768-dim embeddings using Gemini text-embedding-004
    const { embeddings } = await embedMany({
      model: copilotEmbeddingModel,
      values: chunks.map((c) => c.content),
    });

    // Clear old chunks for this document if re-indexing
    await supabase
      .from("document_chunks")
      .delete()
      .eq("document_id", documentId);

    const isUuid = (val?: string | null) =>
      Boolean(
        val &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            val
          )
      );

    const rowsToInsert = chunks.map((chunk, idx) => ({
      document_id: documentId,
      org_id: isUuid(orgId) ? orgId : null,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      embedding: embeddings[idx],
      metadata: chunk.metadata,
    }));

    const { error: insertError } = await supabase
      .from("document_chunks")
      .insert(rowsToInsert);

    if (insertError) {
      console.warn("document_chunks insert warning:", insertError.message);
      return NextResponse.json({
        success: false,
        indexed: false,
        chunksCount: chunks.length,
        error: insertError.message,
      });
    }

    return NextResponse.json({
      success: true,
      indexed: true,
      chunksCount: rowsToInsert.length,
    });
  } catch (err: any) {
    console.error("Ingestion error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to ingest document" },
      { status: 500 }
    );
  }
}
