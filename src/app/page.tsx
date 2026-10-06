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
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-indigo-600/15 via-blue-600/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4 sm:px-12">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center font-black text-lg text-white shadow-md shadow-indigo-500/20">
              O
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white">OrgOS</span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                MVP Preview
              </span>
            </div>
          </div>

        
        <div className="flex items-center gap-4">
          {/* Login button */}
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-200 bg-slate-900 
            border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white hover:border-slate-700 transition-colors shadow-sm"
            >
              Log In
            </Link>

            {/* Sign Up button*/}
            <Link
            href="/signup"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-200 bg-slate-900 
            border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white hover:border-slate-700 transition-colors shadow-sm"
            >
              Sign Up
            </Link>
        </div>


        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 sm:px-12 w-full flex flex-col justify-center">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto mb-16 pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-xs font-medium text-indigo-300 mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>The Operating System for Collegiate Student Organizations</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
            Eliminate Leadership{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
              Transition Amnesia
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-2xl mx-auto">
            OrgOS unifies messy Google Drives, scattered spreadsheets, and ephemeral chats into a single intelligent platform with automated officer handovers and historical AI search.
          </p>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <a
              href="#pillars"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white font-semibold shadow-lg shadow-indigo-600/30 text-sm"
            >
              <span>Explore Platform Pillars</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <div className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{statusMessage || "Next.js App Router + Supabase active"}</span>
            </div>
          </div>
        </section>

        {/* Feature Pillars Grid */}
        <section id="pillars" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Pillar 1: AI Historical Memory */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-indigo-500/40 transition-all group backdrop-blur-sm">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:bg-indigo-500/20 transition-all">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">AI Historical Memory</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Query past event budgets, reservation permits, and post-mortems instantly:
            </p>
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs font-mono text-indigo-300 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span>&ldquo;Who did we contact for catering last fall?&rdquo;</span>
            </div>
          </div>

          {/* Pillar 2: QR Event Attendance */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-emerald-500/40 transition-all group backdrop-blur-sm">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:bg-emerald-500/20 transition-all">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Instant QR Attendance</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Fast 3-second check-in at meetings and fests without requiring students to download any app.
            </p>
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs font-mono text-emerald-300 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span>Real-time check-in roster & CSV exports</span>
            </div>
          </div>

          {/* Pillar 3: Officer Transition Suite */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-sky-500/40 transition-all group backdrop-blur-sm">
            <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4 group-hover:bg-sky-500/20 transition-all">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Officer Transition Suite</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Structured handover checklists for bank cards, university compliance, and role dossiers.
            </p>
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs font-mono text-sky-300 flex items-center gap-2">
              <MessageSquareText className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span>One-click role transfer & alumni archive</span>
            </div>
          </div>
        </section>

        {/* Interactive Interactive Preview Card */}
        <section className="rounded-2xl border border-slate-800/80 bg-slate-900/30 p-6 sm:p-8 backdrop-blur-sm mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-white">Incoming Officer Copilot Simulator</h3>
              <p className="text-xs text-slate-400">Previewing how OrgOS answers queries from historical documents</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              RAG Pipeline Ready
            </span>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Incoming Officer</p>
              <p className="text-sm text-slate-200">
                &ldquo;What is our venue reservation timeline and who was our university contact for the spring showcase?&rdquo;
              </p>
            </div>

            <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-xl p-4">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">OrgOS Historical Copilot</p>
              <p className="text-sm text-slate-300 leading-relaxed mb-3">
                Based on the <span className="text-indigo-300 underline underline-offset-2">2025 Event Recap & Budget</span>, room reservations for the Grand Ballroom must be submitted at least <strong>6 weeks prior</strong> via Student Activities.
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Source: Event_Guide_2025.pdf (Page 4)</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Contact: studentaffairs@university.edu</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 px-6 py-6 sm:px-12 text-xs text-slate-500 z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>OrgOS • Built for collegiate organizations</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/HSINGH5911/OrgOS"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-300 transition-colors flex items-center gap-1"
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
