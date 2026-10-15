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
      <div className="min-h-screen bg-[var(--orgos-bg-app)] text-[var(--orgos-text-primary)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1B365D]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--orgos-bg-app)] text-[var(--orgos-text-primary)] flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full text-center bg-white border border-slate-200 rounded-sm p-8 shadow-sm">
          <div className="h-10 w-10 rounded-sm bg-[#EBF1F8] border border-[#C8D8E9] text-[#1B365D] flex items-center justify-center mx-auto mb-3">
            <User className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 mb-1.5">Sign In Required</h1>
          <p className="text-xs text-slate-500 mb-6">
            Please log in to your OrgOS member account to view your profile and organization details.
          </p>
          <div className="flex gap-2.5 justify-center">
            <Link
              href="/login"
              className="orgos-btn orgos-btn--primary"
            >
              Sign In
            </Link>
            <Link
              href="/"
              className="orgos-btn orgos-btn--secondary"
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

  const getRoleBadgeClasses = (r: string) => {
    switch (r) {
      case "president":
        return "orgos-badge--primary";
      case "officer":
      case "treasurer":
      case "secretary":
        return "orgos-badge--warning";
      default:
        return "orgos-badge--success";
    }
  };

  return (
    <div className="min-h-screen bg-[var(--orgos-bg-app)] text-[var(--orgos-text-primary)] relative px-6 py-12 selection:bg-[#1B365D] selection:text-white">
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#1B365D] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-sm bg-[#1B365D] flex items-center justify-center font-bold text-lg text-white shadow-sm">
                {initials}
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">{fullName}</h1>
                <p className="text-xs text-slate-500">{email}</p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 hover:text-red-800 hover:bg-red-50 border border-red-200 rounded-sm transition-colors disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
            </button>
          </div>

          {/* Details */}
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-sm bg-slate-50 border border-slate-200 space-y-3">
              <h2 className="orgos-meta-label text-[#1B365D] flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                Organization &amp; Campus
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <p className="text-[11px] text-slate-500 font-medium">Organization Name</p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{organization}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 font-medium">Campus / University</p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{university}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[11px] text-slate-500 font-medium">Assigned Role</p>
                  <span className={`inline-flex orgos-badge mt-1 ${getRoleBadgeClasses(role)}`}>
                    {role}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-sm bg-slate-50 border border-slate-200 space-y-3">
              <h2 className="orgos-meta-label text-[#1B365D] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0F9D58]" />
                Account Security &amp; Identification
              </h2>

              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-500 font-medium">Member ID (UUID)</p>
                    <button
                      onClick={handleCopyId}
                      className="inline-flex items-center gap-1 text-[11px] text-[#1B365D] hover:underline"
                    >
                      {copiedId ? (
                        <>
                          <Check className="w-3 h-3 text-[#0F9D58]" />
                          <span className="text-[#0F9D58] font-medium">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy ID</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-slate-700 bg-white px-3 py-2 rounded-sm border border-slate-200 mt-1 select-all truncate">
                    {user.id}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Member Since</span>
                  </div>
                  <span className="text-xs font-medium text-slate-800">{memberSince}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
