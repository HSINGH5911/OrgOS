"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  CalendarCheck,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Database,
  AlertCircle,
  ExternalLink,
  Users,
  Search,
  MessageSquareText,
} from "lucide-react";
import Link from "next/link";
import UserDropdown from "@/components/UserDropdown";

export default function Home() {
  const [supabaseStatus, setSupabaseStatus] = useState<"checking" | "connected" | "error">("checking");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.status === "connected") {
          setSupabaseStatus("connected");
          setStatusMessage("Live connection to Supabase PostgreSQL verified");
        } else {
          setSupabaseStatus("error");
          setStatusMessage(data.message || data.error || "Connection issue");
        }
      })
      .catch((err) => {
        setSupabaseStatus("error");
        setStatusMessage(err.message || "Failed to reach health endpoint");
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--orgos-bg-app)] text-[var(--orgos-text-primary)] selection:bg-[#1B365D] selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 px-6 sm:px-12 h-14 flex items-center">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-sm bg-[#1B365D] flex items-center justify-center font-bold text-base text-white shadow-sm">
              O
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-[#1B365D]">OrgOS</span>
              <span className="orgos-badge orgos-badge--primary hidden sm:inline-flex">
                MVP Preview
              </span>
            </div>
          </div>

          <UserDropdown />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 sm:px-12 w-full flex flex-col justify-center">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto mb-14 pt-2">
          <div className="orgos-badge orgos-badge--primary mb-4 inline-flex">
            <span className="orgos-badge-dot" />
            <span>The Operating System for Collegiate Student Organizations</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold text-[#1B365D] tracking-tight leading-[1.15] mb-4">
            Eliminate Leadership Transition Amnesia
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 max-w-2xl mx-auto">
            OrgOS unifies messy Google Drives, scattered spreadsheets, and ephemeral chats into a single intelligent platform with automated officer handovers and historical AI search.
          </p>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <a
              href="#pillars"
              className="orgos-btn orgos-btn--primary w-full sm:w-auto"
            >
              <span>Explore Platform Pillars</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <div className="orgos-badge orgos-badge--success py-2 px-3 text-xs font-medium w-full sm:w-auto justify-center">
              <span className="orgos-badge-dot" />
              <span>{statusMessage || "Supabase PostgreSQL connected"}</span>
            </div>
          </div>
        </section>

        {/* Feature Pillars Grid */}
        <section id="pillars" className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {/* Pillar 1: AI Historical Memory */}
          <div className="p-5 rounded-sm bg-white border border-slate-200 shadow-sm hover:border-[#1B365D] transition-colors">
            <div className="h-8 w-8 rounded-sm bg-[#EBF1F8] border border-[#C8D8E9] flex items-center justify-center text-[#1B365D] mb-3">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 mb-1.5">AI Historical Memory</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Query past event budgets, reservation permits, and post-mortems instantly:
            </p>
            <div className="p-2.5 rounded-sm bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>&ldquo;Who did we contact for catering last fall?&rdquo;</span>
            </div>
          </div>

          {/* Pillar 2: QR Event Attendance */}
          <div className="p-5 rounded-sm bg-white border border-slate-200 shadow-sm hover:border-[#0F9D58] transition-colors">
            <div className="h-8 w-8 rounded-sm bg-[#E8F5E9] border border-[#A3D9B5] flex items-center justify-center text-[#0F9D58] mb-3">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 mb-1.5">Instant QR Attendance</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Fast 3-second check-in at meetings and fests without requiring students to download any app.
            </p>
            <div className="p-2.5 rounded-sm bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>Real-time check-in roster &amp; CSV exports</span>
            </div>
          </div>

          {/* Pillar 3: Officer Transition Suite */}
          <div className="p-5 rounded-sm bg-white border border-slate-200 shadow-sm hover:border-[#D97706] transition-colors">
            <div className="h-8 w-8 rounded-sm bg-[#FEF3C7] border border-[#FCD34D] flex items-center justify-center text-[#D97706] mb-3">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 mb-1.5">Officer Transition Suite</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Structured handover checklists for bank cards, university compliance, and role dossiers.
            </p>
            <div className="p-2.5 rounded-sm bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 flex items-center gap-2">
              <MessageSquareText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>One-click role transfer &amp; alumni archive</span>
            </div>
          </div>
        </section>

        {/* Interactive Preview Card with Grounding Box & Spreadsheet Table Pattern */}
        <section className="rounded-sm border border-slate-200 bg-white p-6 sm:p-7 shadow-sm mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200">
            <div>
              <h3 className="font-semibold text-base text-slate-900">Incoming Officer Copilot Simulator</h3>
              <p className="text-xs text-slate-500">Previewing grounded retrieval and operational records from historical files</p>
            </div>
            <span className="orgos-badge orgos-badge--success self-start sm:self-auto">
              <span className="orgos-badge-dot" />
              RAG Pipeline Verified
            </span>
          </div>

          <div className="space-y-4">
            {/* Incoming officer query prompt */}
            <div className="bg-slate-50 border border-slate-200 rounded-sm p-3.5">
              <p className="orgos-meta-label text-[#1B365D] mb-1">Incoming Officer Query</p>
              <p className="text-xs text-slate-800">
                &ldquo;What is our venue reservation timeline and who was our university contact for the spring showcase?&rdquo;
              </p>
            </div>

            {/* OrgOS Grounding Callout Component */}
            <div className="orgos-grounding-box">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F9D58] uppercase tracking-wider mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Historical Citation</span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed mb-2.5">
                Based on the <strong>2025 Event Recap &amp; Budget</strong>, room reservations for the Grand Ballroom must be submitted at least <strong>6 weeks prior</strong> via Student Activities.
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
                <span className="bg-white px-2 py-0.5 rounded-sm border border-[#A3D9B5]">Source: Event_Guide_2025.pdf (Page 4)</span>
                <span className="bg-white px-2 py-0.5 rounded-sm border border-[#A3D9B5]">Contact: studentaffairs@university.edu</span>
              </div>
            </div>

            {/* High-Density Spreadsheet Table Pattern */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="orgos-meta-label">Associated Ledger Records (Spring Showcase 2025)</span>
                <span className="text-[11px] text-slate-500 font-mono">3 records reconciled</span>
              </div>
              <div className="orgos-table-wrapper">
                <table className="orgos-table">
                  <thead>
                    <tr>
                      <th>Line Item / Vendor</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-medium text-slate-800">Grand Ballroom Deposit (Student Union)</td>
                      <td><span className="orgos-badge orgos-badge--primary">Venue</span></td>
                      <td className="orgos-mono font-medium">$500.00</td>
                      <td><span className="orgos-badge orgos-badge--success"><span className="orgos-badge-dot" />Reconciled</span></td>
                    </tr>
                    <tr>
                      <td className="font-medium text-slate-800">Campus Chai &amp; Samosa Catering</td>
                      <td><span className="orgos-badge orgos-badge--primary">Food</span></td>
                      <td className="orgos-mono font-medium">$345.50</td>
                      <td><span className="orgos-badge orgos-badge--success"><span className="orgos-badge-dot" />Reconciled</span></td>
                    </tr>
                    <tr>
                      <td className="font-medium text-slate-800">Microphone &amp; Lighting Audio Kit</td>
                      <td><span className="orgos-badge orgos-badge--primary">AV Equipment</span></td>
                      <td className="orgos-mono font-medium">$120.00</td>
                      <td><span className="orgos-badge orgos-badge--warning"><span className="orgos-badge-dot" />Audit Pending</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-4 sm:px-12 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1B365D]" />
            <span>OrgOS Operations • High-Density Platform for Student Organizations</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/HSINGH5911/OrgOS"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 transition-colors flex items-center gap-1 font-medium"
            >
              <span>GitHub Repository</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
