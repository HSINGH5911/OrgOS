"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Send,
  FileText,
  Shield,
  Building2,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderArchive,
  ArrowUpRight,
  BookOpen,
  DollarSign,
  ClipboardList,
  Users,
  X,
  Search,
  Database,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import UserDropdown from "@/components/UserDropdown";
import {
  cleanDocumentSummary,
  getAllowedVisibilitiesForRole,
  parseDocumentVisibility,
} from "@/lib/ai/rbac";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface CopilotCitation {
  documentId: string;
  title: string;
  category: string;
  snippet: string;
  similarity?: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  citations?: CopilotCitation[];
  apiKeyMissing?: boolean;
}

interface VaultDocSummary {
  id: string;
  title: string;
  category: string;
  summary: string;
  visibility: string;
  created_at: string;
}

const navigationItems = [
  { label: "Overview", icon: "📊", href: "/" },
  { label: "Documents", icon: "📁", href: "/documents" },
  { label: "Members", icon: "👥", href: "/members" },
  { label: "Roles", icon: "🛡️", href: "/roles" },
  { label: "Calendar", icon: "📅", href: "/calendar" },
  { label: "AI Copilot", icon: "✨", href: "/copilot" },
  { label: "Transitions", icon: "📋", href: "/transitions" },
  { label: "Account", icon: "⚙️", href: "/account" },
];

const QUICK_PROMPTS = [
  {
    icon: BookOpen,
    category: "Event Archive",
    title: "Past Event Post-Mortem",
    prompt:
      "How did we run our major showcase or banquet last year, and what lessons were learned?",
  },
  {
    icon: DollarSign,
    category: "Budget & Finance",
    title: "Catering & Vendor Breakdown",
    prompt:
      "Summarize our historical event budgets, catering costs, and vendor details from the vault.",
  },
  {
    icon: ClipboardList,
    category: "Operations",
    title: "6-Week Event Checklist",
    prompt:
      "Generate a 6-week preparation checklist for our next major campus event based on our chapter records.",
  },
  {
    icon: Users,
    category: "Continuity",
    title: "Leadership & Key Contacts",
    prompt:
      "Who are our current officers and what key university or vendor contacts do we have on file?",
  },
];

/**
 * Formats inline markdown (`**bold**`, `*italic*`, `` `code` ``, `[Link](url)`) cleanly
 * without displaying raw markdown asterisks or backticks.
 */
function renderInlineFormatted(text: string): React.ReactNode[] {
  const tokenRegex =
    /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*\n]+\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded-sm bg-slate-100 border border-slate-200 font-mono text-[11px] text-[#1B365D]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#1B365D] underline hover:opacity-80"
        >
          {linkMatch[1]}
        </a>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={idx} className="italic text-slate-700">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

/**
 * Cleanly formats multi-line markdown responses (headings, bullet lists, numbered steps, code blocks, dividers).
 */
function FormattedCopilotMessage({ content }: { content: string }) {
  const segments = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2.5 text-xs leading-relaxed text-slate-800">
      {segments.map((seg, sIdx) => {
        if (seg.startsWith("```") && seg.endsWith("```")) {
          const lines = seg.slice(3, -3).trim().split("\n");
          const firstLine = lines[0]?.trim() || "";
          const codeBody =
            /^[a-z0-9_-]+$/i.test(firstLine) && lines.length > 1
              ? lines.slice(1).join("\n")
              : lines.join("\n");

          return (
            <pre
              key={sIdx}
              className="p-3 rounded-sm bg-slate-50 border border-slate-200 font-mono text-[11px] text-[#1B365D] overflow-x-auto"
            >
              <code>{codeBody}</code>
            </pre>
          );
        }

        const lines = seg.split("\n");
        return (
          <div key={sIdx} className="space-y-1.5">
            {lines.map((rawLine, lIdx) => {
              const line = rawLine.trim();
              if (!line) {
                return <div key={lIdx} className="h-1" />;
              }
              if (line === "---") {
                return (
                  <hr
                    key={lIdx}
                    className="border-t border-slate-200 my-2.5"
                  />
                );
              }
              if (line.startsWith("### ")) {
                return (
                  <h4
                    key={lIdx}
                    className="text-sm font-bold text-[#1B365D] pt-1"
                  >
                    {renderInlineFormatted(line.slice(4))}
                  </h4>
                );
              }
              if (line.startsWith("#### ")) {
                return (
                  <h5
                    key={lIdx}
                    className="text-xs font-bold uppercase tracking-wider text-slate-700 pt-1"
                  >
                    {renderInlineFormatted(line.slice(5))}
                  </h5>
                );
              }
              if (line.startsWith("## ")) {
                return (
                  <h3
                    key={lIdx}
                    className="text-sm font-bold text-[#1B365D] pt-1"
                  >
                    {renderInlineFormatted(line.slice(3))}
                  </h3>
                );
              }
              if (
                line.startsWith("- ") ||
                line.startsWith("* ") ||
                line.startsWith("• ")
              ) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-1">
                    <span className="text-[#1B365D] font-bold mt-0.5">•</span>
                    <span className="flex-1">
                      {renderInlineFormatted(line.slice(2))}
                    </span>
                  </div>
                );
              }
              const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
              if (numMatch) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-1">
                    <span className="font-mono font-semibold text-[#1B365D] shrink-0">
                      {numMatch[1]}.
                    </span>
                    <span className="flex-1">
                      {renderInlineFormatted(numMatch[2])}
                    </span>
                  </div>
                );
              }

              return (
                <p key={lIdx} className="leading-relaxed">
                  {renderInlineFormatted(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function CopilotPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string>("Student Organization");
  const [university, setUniversity] = useState<string>("Collegiate Campus");
  const [userRole, setUserRole] = useState<string>("member");
  const [userTitle, setUserTitle] = useState<string>("Member");

  const [accessibleDocs, setAccessibleDocs] = useState<VaultDocSummary[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [isReindexing, setIsReindexing] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const allowedVisibilities = getAllowedVisibilitiesForRole(userRole);
  const isPresident = userRole.toLowerCase() === "president";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0 || isSending) {
      scrollToBottom();
    }
  }, [messages, isSending]);

  const loadContext = useCallback(async (activeUser: SupabaseUser) => {
    setIsLoadingDocs(true);
    try {
      const supabase = createClient();
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
        .eq("user_id", activeUser.id)
        .eq("is_active", true)
        .maybeSingle();

      let currentOrgId: string | null = null;
      let resolvedRole = activeUser.user_metadata?.role || "member";

      if (membership) {
        currentOrgId = membership.org_id;
        resolvedRole = membership.role || resolvedRole;
        setOrgId(membership.org_id);
        setUserRole(resolvedRole);
        setUserTitle(
          membership.title ||
            (resolvedRole === "president"
              ? "President"
              : resolvedRole === "treasurer"
              ? "Treasurer"
              : "Officer")
        );

        const rawOrg = Array.isArray(membership.organizations)
          ? membership.organizations[0]
          : membership.organizations;
        if (rawOrg) {
          setOrgName((rawOrg as any).name || "Student Organization");
          setUniversity((rawOrg as any).university || "Collegiate Campus");
        }
      } else {
        const meta = activeUser.user_metadata || {};
        setOrgName(meta.organization || "Student Organization");
        setUniversity(meta.university || "Collegiate Campus");
        setUserRole(resolvedRole);
        setUserTitle(resolvedRole === "president" ? "President" : "Officer");
      }

      const allowed = getAllowedVisibilitiesForRole(resolvedRole);

      let docQuery = supabase
        .from("documents")
        .select("id, title, category, summary, created_at")
        .order("created_at", { ascending: false });

      if (currentOrgId) {
        docQuery = docQuery.eq("org_id", currentOrgId);
      }

      const { data: dbDocs } = await docQuery;
      if (dbDocs) {
        const filtered: VaultDocSummary[] = dbDocs
          .map((d: any) => {
            const vis = parseDocumentVisibility(d.summary, d.visibility);
            return {
              id: d.id,
              title: d.title,
              category: d.category || "general",
              summary: cleanDocumentSummary(d.summary),
              visibility: vis,
              created_at: d.created_at,
            };
          })
          .filter((d) => allowed.includes(d.visibility as any));
        setAccessibleDocs(filtered);
      }
    } catch (err) {
      console.warn("Error loading Copilot context:", err);
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      setIsAuthLoading(false);
      if (u) {
        loadContext(u);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsAuthLoading(false);
      if (u) {
        loadContext(u);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadContext]);

  const handleSendMessage = async (promptText?: string) => {
    const question = (promptText ?? input).trim();
    if (!question || isSending) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (!promptText) {
      setInput("");
    }
    setIsSending(true);

    try {
      let localEvents: any[] = [];
      if (typeof window !== "undefined") {
        try {
          const rawEvents = localStorage.getItem("orgos_events");
          if (rawEvents) {
            localEvents = JSON.parse(rawEvents);
          }
        } catch {}
      }

      const res = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          events: localEvents,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate Copilot response.");
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.content || "No response received.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        citations: data.citations || [],
        apiKeyMissing: Boolean(data.apiKeyMissing),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `**Connection Error**: ${
          err?.message || "Unable to reach the AI Copilot service."
        }`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleReindexAll = async () => {
    if (accessibleDocs.length === 0 || isReindexing) return;
    setIsReindexing(true);
    setNotification(null);

    try {
      let indexedCount = 0;
      let missingKey = false;

      for (const doc of accessibleDocs) {
        const res = await fetch("/api/documents/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId: doc.id,
            orgId,
            title: doc.title,
            category: doc.category,
          }),
        });
        const data = await res.json();
        if (data.indexed) {
          indexedCount++;
        } else if (data.message?.includes("GOOGLE_GENERATIVE_AI_API_KEY")) {
          missingKey = true;
        }
      }

      if (missingKey) {
        setNotification({
          type: "error",
          message:
            "Text extracted from Vault documents! Add your GOOGLE_GENERATIVE_AI_API_KEY in .env.local to store pgvector embeddings.",
        });
      } else {
        setNotification({
          type: "success",
          message: `Successfully indexed ${indexedCount} of ${accessibleDocs.length} accessible Vault documents into pgvector.`,
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err?.message || "Failed to re-index documents.",
      });
    } finally {
      setIsReindexing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--orgos-bg-app)] text-[var(--orgos-text-primary)] selection:bg-[#1B365D] selection:text-white flex">
      {/* 1. Left Navigation Sidebar */}
      {user && (
        <Sidebar
          items={navigationItems}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
          activeHref="/copilot"
        />
      )}

      {/* 2. Main Work Area (Matches Documents & Roles Layout) */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          user ? (isSidebarCollapsed ? "pl-16" : "pl-64") : "pl-0"
        }`}
      >
        {/* Topbar Header */}
        <header className="orgos-topbar sticky top-0 z-30">
          <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-sm bg-[#1B365D] flex items-center justify-center font-bold text-sm text-white shadow-sm">
                O
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="font-bold text-base tracking-tight text-[#1B365D] hover:underline"
                >
                  OrgOS
                </Link>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-semibold text-slate-700">
                  AI Copilot
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  <Building2 className="w-3 h-3 text-slate-500" />
                  {orgName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-slate-100 border border-slate-200 text-xs text-slate-600">
                <Shield className="w-3.5 h-3.5 text-[#1B365D]" />
                <span className="capitalize">{userTitle} Workspace</span>
              </div>
              <UserDropdown />
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 max-w-[1400px] mx-auto px-6 py-8 sm:px-10 w-full flex flex-col justify-start">
          {isAuthLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="w-7 h-7 animate-spin text-[#1B365D] mb-3" />
              <p className="text-xs font-medium">Loading AI Copilot...</p>
            </div>
          ) : (
            <>
              {/* Toast Notification Banner */}
              {notification && (
                <div
                  className={`mb-6 p-4 rounded-sm border flex items-center justify-between text-xs font-medium animate-in fade-in duration-200 ${
                    notification.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-amber-50 border-amber-200 text-amber-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {notification.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span>{notification.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotification(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Section Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold tracking-tight text-[#1B365D]">
                      AI Institutional Copilot
                    </h1>
                    <span className="orgos-badge orgos-badge--primary">
                      Phase 3 RAG Engine
                    </span>
                    <span className="orgos-badge orgos-badge--success">
                      <span className="orgos-badge-dot" />
                      pgvector Grounded
                    </span>
                    {isPresident && (
                      <span className="px-2 py-0.5 rounded-sm bg-purple-50 border border-purple-200 text-[11px] font-semibold text-purple-700 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-purple-600" />
                        <span>Full Vault Clearance</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                    Query historical event budgets, venue reservation timelines,
                    vendor contacts, and officer handover records for{" "}
                    <strong>{orgName}</strong> ({university}).
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleReindexAll}
                    disabled={isReindexing || accessibleDocs.length === 0}
                    className="orgos-btn orgos-btn--secondary text-xs h-9 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        isReindexing ? "animate-spin" : ""
                      }`}
                    />
                    <span>
                      {isReindexing ? "Indexing..." : "Sync Embeddings"}
                    </span>
                  </button>
                  <Link
                    href="/documents"
                    className="orgos-btn orgos-btn--primary text-xs h-9 shadow-sm"
                  >
                    <FolderArchive className="w-4 h-4" />
                    <span>Document Vault</span>
                  </Link>
                </div>
              </div>

              {/* 4-Column Metric Bar (Matches Document Vault) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
                <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-xs">
                  <span className="orgos-meta-label">Grounded Sources</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-bold text-slate-900">
                      {accessibleDocs.length}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      accessible files
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-xs">
                  <span className="orgos-meta-label">RBAC Clearance</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-bold text-[#1B365D] capitalize">
                      {userRole}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {allowedVisibilities.length} tiers enabled
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-xs">
                  <span className="orgos-meta-label">Inference Engine</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-sm font-bold text-emerald-700 orgos-mono">
                      gemini-2.5-flash
                    </span>
                    <span className="text-[11px] text-emerald-600">Free Tier</span>
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-xs">
                  <span className="orgos-meta-label">Vector Index</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-sm font-bold text-slate-900 orgos-mono">
                      text-embedding-004
                    </span>
                    <span className="text-[11px] text-slate-500">768 dims</span>
                  </div>
                </div>
              </div>

              {/* Main 3-Column Operational Split */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left 2 Columns: Chat & Query Console */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col">
                  {/* Console Header */}
                  <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#1B365D]" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Chapter Knowledge Query Console
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      {messages.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setMessages([])}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 px-2 py-1 rounded-sm border border-slate-200 bg-white transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Reset Thread</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Conversation Area */}
                  <div className="p-5 min-h-[420px] max-h-[580px] overflow-y-auto space-y-5">
                    {messages.length === 0 ? (
                      <div className="space-y-6 py-2">
                        {/* Intro Callout */}
                        <div className="orgos-grounding-box">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B7C44]">
                              Institutional Memory Ready
                            </span>
                            <span className="text-[11px] text-slate-600">
                              Visibility: {allowedVisibilities.join(", ")}
                            </span>
                          </div>
                          <p className="text-xs text-slate-800 leading-relaxed font-sans">
                            Select a starter prompt below or ask any question
                            about <strong>{orgName}</strong>&apos;s uploaded
                            documents, event budgets, officer roles, or
                            handover procedures.
                          </p>
                        </div>

                        {/* Quick Prompt Cards Grid */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="orgos-meta-label">
                              Quick Officer Prompts
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Click to run query
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {QUICK_PROMPTS.map((item, idx) => {
                              const IconComp = item.icon;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleSendMessage(item.prompt)}
                                  className="text-left p-4 rounded-sm bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#1B365D] transition-all group flex flex-col justify-between shadow-xs"
                                >
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="orgos-badge orgos-badge--primary">
                                        <IconComp className="w-3 h-3" />
                                        {item.category}
                                      </span>
                                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1B365D]" />
                                    </div>
                                    <h3 className="font-bold text-xs text-slate-900 mb-1">
                                      {item.title}
                                    </h3>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                      &ldquo;{item.prompt}&rdquo;
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={
                              msg.role === "user"
                                ? "bg-slate-50 border border-slate-200 rounded-sm p-4"
                                : "bg-white border border-slate-200 rounded-sm p-4 shadow-xs"
                            }
                          >
                            {/* Message Header */}
                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                {msg.role === "user" ? (
                                  <span className="orgos-badge orgos-badge--neutral">
                                    Officer Query
                                  </span>
                                ) : (
                                  <span className="orgos-badge orgos-badge--primary">
                                    <Sparkles className="w-3 h-3" />
                                    OrgOS Grounded Response
                                  </span>
                                )}
                                <span className="text-[11px] font-semibold text-slate-700">
                                  {msg.role === "user"
                                    ? user?.user_metadata?.full_name || "You"
                                    : `${orgName} Archivist`}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 orgos-mono">
                                {msg.timestamp}
                              </span>
                            </div>

                            {/* Formatted Message Body */}
                            <FormattedCopilotMessage content={msg.content} />

                            {/* Source Citations Bar */}
                            {msg.citations && msg.citations.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-slate-100">
                                <span className="orgos-meta-label block mb-2">
                                  Cited Vault Sources ({msg.citations.length})
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {msg.citations.map((cit, i) => (
                                    <Link
                                      key={i}
                                      href="/documents"
                                      title={cit.snippet}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#EBF1F8] hover:bg-[#dce6f2] text-[#1B365D] border border-[#C8D8E9] text-[11px] font-medium transition-colors"
                                    >
                                      <FileText className="w-3 h-3 shrink-0" />
                                      <span>{cit.title}</span>
                                      {typeof cit.similarity === "number" && (
                                        <span className="orgos-mono text-[10px] text-slate-500">
                                          {Math.round(cit.similarity * 100)}%
                                        </span>
                                      )}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        {isSending && (
                          <div className="p-4 rounded-sm bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs text-slate-600">
                            <Loader2 className="w-4 h-4 animate-spin text-[#1B365D]" />
                            <span>
                              Searching chapter vault chunks and synthesizing
                              response...
                            </span>
                          </div>
                        )}

                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Prompt Input Footer */}
                  <div className="p-4 border-t border-slate-200 bg-slate-50">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="flex items-center gap-2"
                    >
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder={`Ask about ${orgName}'s past events, budgets, vendors, or checklists...`}
                          disabled={isSending}
                          className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-300 rounded-sm focus:outline-none focus:border-[#1B365D] text-slate-900"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!input.trim() || isSending}
                        className="orgos-btn orgos-btn--primary text-xs disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Query Copilot</span>
                      </button>
                    </form>
                  </div>
                </div>

                {/* Right 1 Column: Grounded Vault Context & RBAC Panel */}
                <div className="space-y-4">
                  {/* Card 1: Accessible Vault Documents */}
                  <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-[#1B365D]" />
                        <h2 className="orgos-title-h2">Indexed Vault Scope</h2>
                      </div>
                      <span className="orgos-badge orgos-badge--primary">
                        {accessibleDocs.length} Files
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      The Copilot only retrieves chunks from documents matching
                      your role clearance:
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {allowedVisibilities.map((tier) => (
                        <span
                          key={tier}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 capitalize"
                        >
                          <Lock className="w-2.5 h-2.5 text-slate-500" />
                          {tier}
                        </span>
                      ))}
                    </div>

                    {isLoadingDocs ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        Loading chapter documents...
                      </div>
                    ) : accessibleDocs.length === 0 ? (
                      <div className="border border-dashed border-slate-300 rounded-sm p-5 text-center space-y-2 bg-slate-50">
                        <FileText className="w-5 h-5 text-slate-400 mx-auto" />
                        <p className="text-xs font-semibold text-slate-800">
                          No Documents in Vault
                        </p>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Upload event guides, budgets, or meeting minutes in
                          the Document Vault so the Copilot can cite them.
                        </p>
                        <Link
                          href="/documents"
                          className="orgos-btn orgos-btn--secondary text-xs w-full mt-2"
                        >
                          <FolderArchive className="w-3.5 h-3.5" />
                          <span>Go to Document Vault</span>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                        {accessibleDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className="p-3 rounded-sm border border-slate-200 bg-slate-50 hover:border-slate-300 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <FileText className="w-3.5 h-3.5 text-[#1B365D] shrink-0" />
                                <span className="text-xs font-semibold text-slate-900 truncate">
                                  {doc.title}
                                </span>
                              </div>
                              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm bg-white border border-slate-200 text-slate-600 shrink-0">
                                {doc.visibility}
                              </span>
                            </div>
                            {doc.summary && (
                              <p className="text-[11px] text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                                {doc.summary}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card 2: API Key Setup Status */}
                  <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Environment Configuration
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Set your free Google AI Studio key in{" "}
                      <code className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded-sm font-mono text-[11px]">
                        .env.local
                      </code>{" "}
                      to enable live Gemini 2.5 Flash synthesis:
                    </p>
                    <div className="p-2.5 rounded-sm bg-slate-50 border border-slate-200 font-mono text-[11px] text-[#1B365D] break-all">
                      GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
