"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  CalendarCheck,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Users,
  Search,
  MessageSquareText,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import UserDropdown from "@/components/UserDropdown";
import DashboardView from "@/components/DashboardView";
import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const navigationItems = [
  { label: "Overview", icon: "📊", href: "/" },
  { label: "Documents", icon: "📁", href: "#documents" },
  { label: "Events", icon: "📅", href: "#events" },
  { label: "AI Copilot", icon: "✨", href: "#copilot" },
  { label: "Transitions", icon: "📋", href: "#transitions" },
  { label: "Account", icon: "⚙️", href: "/account" },
];

export default function Home() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<"checking" | "connected" | "error">("checking");
  const [statusMessage, setStatusMessage] = useState("");

  // 1. Check Auth Status
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2. Database Health Check
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "connected") {
          setSupabaseStatus("connected");
          setStatusMessage("Live connection to Supabase verified");
        } else {
          setSupabaseStatus("error");
          setStatusMessage("Connection issue");
        }
      })
      .catch(() => {
        setSupabaseStatus("error");
      });
  }, []);

  return (
    <div className="min-h-screen bg-[var(--orgos-bg-app)] text-[var(--orgos-text-primary)] selection:bg-[#1B365D] selection:text-white flex">
      {/* 1. Left Sidebar (renders when user is logged in) */}
      {user && (
        <Sidebar
          items={navigationItems}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      )}

      {/* 2. Main Pane: Header, Main Content, and Footer (smoothly shifts when sidebar toggles) */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          user ? (isSidebarCollapsed ? "pl-16" : "pl-64") : "pl-0"
        }`}
      >
        {/* Topbar Navigation */}
        <header className="orgos-topbar sticky top-0 z-30">
          <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-sm bg-[#1B365D] flex items-center justify-center font-bold text-sm text-white shadow-sm">
                O
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-[#1B365D]">OrgOS</span>
                <span className="orgos-badge orgos-badge--primary hidden sm:inline-flex">
                  Operations Platform
                </span>
              </div>
            </div>

            <UserDropdown />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-[1400px] mx-auto px-6 py-8 sm:px-10 w-full flex flex-col justify-start">
          {isAuthLoading ? (
            // Loading State
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="w-7 h-7 animate-spin text-[#1B365D] mb-3" />
              <p className="text-xs font-medium">Loading workspace...</p>
            </div>
          ) : user ? (
            // Authenticated Dashboard View
            <DashboardView user={user} />
          ) : (
            // Public Landing Page (Utilitarian Operations Style)
            <>
              {/* Hero Section */}
              <section className="text-center max-w-3xl mx-auto mb-14 pt-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#EBF1F8] border border-[#C8D8E9] text-xs font-semibold text-[#1B365D] mb-5">
                  <Sparkles className="w-3.5 h-3.5 text-[#1B365D]" />
                  <span>The Operating System for Collegiate Student Organizations</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1B365D] tracking-tight leading-[1.15] mb-5">
                  Eliminate Leadership <br className="hidden sm:inline" />
                  Transition Amnesia
                </h1>

                <p className="text-sm sm:text-base text-[#475569] leading-relaxed mb-7 max-w-2xl mx-auto">
                  OrgOS unifies fragmented folders, spreadsheets, and ephemeral chats into a centralized operations platform with automated officer handovers and an AI institutional memory archive.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                  <Link
                    href="/register-org"
                    className="orgos-btn orgos-btn--primary w-full sm:w-auto"
                  >
                    <span>Register an Organization</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <div className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-sm bg-white border border-slate-200 text-xs text-slate-600 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#0F9D58] flex-shrink-0" />
                    <span className="font-medium">{statusMessage || "Supabase PostgreSQL Active"}</span>
                  </div>
                </div>
              </section>

              {/* Feature Pillars Grid */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
                {/* Pillar 1 */}
                <div className="p-6 rounded-sm bg-white border border-slate-200 shadow-sm hover:border-[#1B365D] transition-colors">
                  <div className="h-9 w-9 rounded-sm bg-[#EBF1F8] border border-[#C8D8E9] flex items-center justify-center text-[#1B365D] mb-4">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-[#0F172A] mb-1.5">AI Institutional Copilot</h2>
                  <p className="text-xs text-[#475569] leading-relaxed mb-4">
                    Natural language search across past event budgets, reservation permits, and post-mortems:
                  </p>
                  <div className="p-3 rounded-sm bg-slate-50 border border-slate-200 text-xs font-mono text-[#1B365D] flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>&ldquo;Who did we contact for catering last fall?&rdquo;</span>
                  </div>
                </div>

                {/* Pillar 2 */}
                <div className="p-6 rounded-sm bg-white border border-slate-200 shadow-sm hover:border-[#1B365D] transition-colors">
                  <div className="h-9 w-9 rounded-sm bg-[#E8F5E9] border border-[#A3D9B5] flex items-center justify-center text-[#0F9D58] mb-4">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-[#0F172A] mb-1.5">Instant QR Attendance</h2>
                  <p className="text-xs text-[#475569] leading-relaxed mb-4">
                    Fast 3-second check-in at general meetings and club fairs with zero app installation required.
                  </p>
                  <div className="p-3 rounded-sm bg-slate-50 border border-slate-200 text-xs font-mono text-[#0F9D58] flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Real-time roster sync & CSV exports</span>
                  </div>
                </div>

                {/* Pillar 3 */}
                <div className="p-6 rounded-sm bg-white border border-slate-200 shadow-sm hover:border-[#1B365D] transition-colors">
                  <div className="h-9 w-9 rounded-sm bg-[#FEF3C7] border border-[#FCD34D] flex items-center justify-center text-[#D97706] mb-4">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-[#0F172A] mb-1.5">Officer Handover Dossier</h2>
                  <p className="text-xs text-[#475569] leading-relaxed mb-4">
                    Structured checklists for bank authorizations, university registration, and role handoffs.
                  </p>
                  <div className="p-3 rounded-sm bg-slate-50 border border-slate-200 text-xs font-mono text-[#D97706] flex items-center gap-2">
                    <MessageSquareText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>One-click role transfer & alumni archive</span>
                  </div>
                </div>
              </section>

              {/* Grounding Simulation Box */}
              <section className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm mb-12">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-sm text-[#0F172A]">AI RAG Operational Simulator</h3>
                    <p className="text-xs text-slate-500">Query grounded against past club post-mortems and records</p>
                  </div>
                  <span className="orgos-badge orgos-badge--success self-start sm:self-auto">
                    <span className="orgos-badge-dot" />
                    pgvector Grounded
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-sm p-3.5">
                    <p className="orgos-meta-label mb-1 text-[#1B365D]">Incoming Officer Prompt</p>
                    <p className="text-xs text-slate-800">
                      &ldquo;What is our room reservation timeline and who was our university contact for the spring banquet?&rdquo;
                    </p>
                  </div>

                  <div className="orgos-grounding-box">
                    <p className="text-xs font-semibold text-[#0B7C44] uppercase tracking-wider mb-1.5">
                      OrgOS Grounded Response
                    </p>
                    <p className="text-xs text-slate-800 leading-relaxed mb-2.5">
                      Based on the <strong>2025 Event Recap & Budget</strong>, room reservations for the Grand Ballroom must be submitted at least <strong>6 weeks prior</strong> via the Student Activities Center.
                    </p>
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
                      <span className="bg-white px-2 py-0.5 rounded-sm border border-[#A3D9B5]">
                        Document: Event_Guide_2025.pdf (Page 4)
                      </span>
                      <span className="bg-white px-2 py-0.5 rounded-sm border border-[#A3D9B5]">
                        Contact: studentaffairs@university.edu
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white px-6 py-4 sm:px-10 text-xs text-slate-500 z-10">
          <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1B365D]" />
              <span>OrgOS Operations • High-Density Student Organization Management</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/HSINGH5911/OrgOS"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#1B365D] transition-colors flex items-center gap-1"
              >
                <span>GitHub Repository</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}