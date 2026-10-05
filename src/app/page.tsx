"use client";

import { useState, useEffect } from "react";
import { Sparkles, CalendarCheck, BookOpen, ArrowRight, ShieldCheck, CheckCircle2, Database, AlertCircle } from "lucide-react";

export default function Home() {
  const [clickCount, setClickCount] = useState(0);
  const [supabaseStatus, setSupabaseStatus] = useState<"checking" | "connected" | "error">("checking");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "connected") {
          setSupabaseStatus("connected");
          setStatusMessage("Connected to Supabase PostgreSQL");
        } else {
          setSupabaseStatus("error");
          setStatusMessage(data.message || data.error || "Connection issue");
        }
      })
      .catch((err) => {
        setSupabaseStatus("error");
        setStatusMessage(err.message);
      });
  }, []);

  return (
    <main className="min-h-screen flex flex-col justify-between p-6 sm:p-12 lg:p-24 relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-indigo-500/25">
            O
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight">OrgOS</h1>
            <p className="text-xs text-slate-400">Campus Organization OS</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Supabase status badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-medium">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            {supabaseStatus === "checking" && (
              <span className="text-amber-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                Connecting Supabase...
              </span>
            )}
            {supabaseStatus === "connected" && (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Supabase Connected
              </span>
            )}
            {supabaseStatus === "error" && (
              <span className="text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Supabase Error
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Cloudflare Pages Ready
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="my-auto py-12 z-10 max-w-3xl">
        

        <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight sm:leading-none mb-6">
          The Operating System for <span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">Student Organizations</span>
        </h2>

        <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-2xl">
          Say goodbye to leadership transition amnesia, lost Google Drives, and messy spreadsheets. OrgOS preserves institutional knowledge, automates officer handovers, and powers seamless event check-ins.
        </p>

        {/* Interactive Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setClickCount((prev) => prev + 1)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white font-medium shadow-lg shadow-indigo-600/30"
          >
            <span>Interactive Test: {clickCount} {clickCount === 1 ? "click" : "clicks"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 border border-slate-800 px-4 py-3 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{statusMessage || "Supabase + Next.js App Router verified"}</span>
          </div>
        </div>
      </div>

      {/* Feature Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 z-10 my-8">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">AI Historical Memory</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Chat with past event recaps, budgets, and post-mortems to answer &ldquo;How did we run Diwali last year?&rdquo;
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">QR Event Check-In</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Instant 3-second attendance check-in on student phones with no app install required.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3">
            <BookOpen className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">Officer Transition Suite</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Pre-built handover checklists for bank cards, university compliance, and role dossiers.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4 z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Built for college leaders</span>
        </div>
        <div>
          <span>Local development: </span>
          <code className="text-indigo-400 bg-slate-900 px-2 py-1 rounded border border-slate-800 font-mono">http://localhost:3000</code>
        </div>
      </footer>
    </main>
  );
}
