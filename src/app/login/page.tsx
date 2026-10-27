"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Lock, Mail, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import ThemeSelector from "@/components/ThemeSelector";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!email || !password) {
      setError("Please fill in both email and password.");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data.session) {
        setSuccessMessage("Signed in successfully! Redirecting...");
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[var(--orgos-bg-app)] text-[var(--orgos-text-primary)] relative px-6 py-12 selection:bg-[#1B365D] selection:text-white">
      {/* Top Bar: Back to Home + Theme Selector */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#1B365D] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <ThemeSelector />
      </div>

      {/* Card Container */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-sm p-7 sm:p-8 shadow-sm relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="h-9 w-9 mx-auto rounded-sm bg-[#1B365D] flex items-center justify-center font-bold text-lg text-white shadow-sm mb-3">
            O
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#1B365D]">Sign In to OrgOS</h1>
          <p className="text-xs text-slate-500 mt-1">
            Enter your credentials to access your organization workspace
          </p>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-5 p-3 rounded-sm bg-[#FEE2E2] border border-[#FCA5A5] text-[#DC2626] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3 rounded-sm bg-[#E8F5E9] border border-[#A3D9B5] text-[#0F9D58] text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#0F9D58]" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@studentorg.edu"
                required
                className="w-full bg-white border border-slate-300 rounded-sm pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1B365D] focus:ring-1 focus:ring-[#1B365D] transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white border border-slate-300 rounded-sm pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1B365D] focus:ring-1 focus:ring-[#1B365D] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="orgos-btn orgos-btn--primary w-full h-10 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500">
          <p>
            Don&apos;t have an account yet?{" "}
            <Link href="/signup" className="font-semibold text-[#1B365D] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
