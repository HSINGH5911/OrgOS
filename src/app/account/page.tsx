"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Building2,
  GraduationCap,
  ShieldCheck,
  Mail,
  Calendar,
  Copy,
  Check,
  LogOut,
  Loader2,
  User,
  Shield,
  Sparkles,
} from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let isMounted = true;
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (isMounted) {
          setUser(user);
          setIsLoading(false);
        }
      }).catch(() => {
        if (isMounted) setIsLoading(false);
      });
    } catch {
      if (isMounted) setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopyId = async () => {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {}
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full text-center bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <User className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Sign In Required</h1>
          <p className="text-xs text-slate-400 mb-6">
            Please log in to your OrgOS member account to view your profile and organization details.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/login"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const metadata = user.user_metadata || {};
  const fullName =
    metadata.full_name ||
    metadata.name ||
    user.email?.split("@")[0] ||
    "Member";
  const email = user.email || "";
  const organization = metadata.organization || "Student Organization";
  const university = metadata.university || "Collegiate Campus";
  const role = (metadata.role || "member").toLowerCase();

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word: string) => word[0].toUpperCase())
    .join("") || "U";

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative px-6 py-12 selection:bg-indigo-500 selection:text-white">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-indigo-600/20 via-blue-600/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 flex items-center justify-center font-bold text-xl text-white shadow-md shadow-indigo-500/20">
                {initials}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{fullName}</h1>
                <p className="text-xs text-slate-400">{email}</p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl transition-colors disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
            </button>
          </div>

          {/* Details */}
          <div className="p-6 space-y-6">
            <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
              <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Organization & Campus
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-slate-400">Organization Name</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{organization}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Campus / University</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{university}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[11px] text-slate-400">Assigned Role</p>
                  <span className="inline-block mt-1 px-2.5 py-1 text-xs font-bold uppercase rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {role}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
              <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Account Security & Identification
              </h2>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-400">Member ID (UUID)</p>
                    <button
                      onClick={handleCopyId}
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
                    >
                      {copiedId ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy ID</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-slate-300 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 mt-1 select-all truncate">
                    {user.id}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>Member Since</span>
                  </div>
                  <span className="text-xs font-medium text-slate-300">{memberSince}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
