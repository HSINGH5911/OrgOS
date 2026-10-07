"use client";

import React, { useState } from "react";
import {
  X,
  User,
  Mail,
  Building2,
  GraduationCap,
  Shield,
  ShieldCheck,
  Calendar,
  Copy,
  Check,
  LogOut,
  ExternalLink,
  IdCard,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: SupabaseUser;
  onSignOut: () => void;
  isSigningOut?: boolean;
}

export default function AccountModal({
  isOpen,
  onClose,
  user,
  onSignOut,
  isSigningOut = false,
}: AccountModalProps) {
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen) return null;

  const metadata = user.user_metadata || {};
  const fullName =
    metadata.full_name ||
    metadata.name ||
    user.email?.split("@")[0] ||
    "Member";
  const email = user.email || "No email available";
  const organization = metadata.organization || "Student Organization";
  const university = metadata.university || "Collegiate Campus";
  const role = (metadata.role || "member").toLowerCase();

  // Compute initials for the avatar
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word: string) => word[0].toUpperCase())
    .join("") || "U";

  // Format member since date
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // Clipboard write failed (e.g. browser permission)
    }
  };

  const getRoleBadge = (r: string) => {
    switch (r) {
      case "president":
        return {
          title: "President / Admin",
          classes: "bg-purple-500/15 text-purple-300 border-purple-500/30",
          privilege: "Full Administrative & Vault Control",
        };
      case "officer":
      case "treasurer":
      case "secretary":
        return {
          title: "Executive Officer",
          classes: "bg-sky-500/15 text-sky-300 border-sky-500/30",
          privilege: "Officer Operations & Attendance Access",
        };
      default:
        return {
          title: "Active Member",
          classes: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
          privilege: "Standard Organization Access",
        };
    }
  };

  const roleInfo = getRoleBadge(role);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-account-title"
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-indigo-500/20">
              {initials}
            </div>
            <div>
              <h2
                id="modal-account-title"
                className="text-lg font-bold text-white tracking-tight"
              >
                {fullName}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${roleInfo.classes}`}
                >
                  {roleInfo.title}
                </span>
                <span className="text-xs text-slate-400 truncate max-w-[200px]">
                  {email}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close account modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Organization Details Card */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Organization Affiliation
              </span>
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                Active Member
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <p className="text-[11px] text-slate-400">Organization</p>
                <p className="text-sm font-medium text-slate-200 mt-0.5">
                  {organization}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400">University / Campus</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {university}
                  </p>
                </div>
              </div>

              <div className="sm:col-span-2">
                <p className="text-[11px] text-slate-400">Access Privileges</p>
                <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{roleInfo.privilege}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Account & Security Card */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-800/60">
              <IdCard className="w-3.5 h-3.5" />
              Member Credentials
            </span>

            <div className="space-y-3 pt-1">
              <div>
                <p className="text-[11px] text-slate-400">Registered Email</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-sm text-slate-200 font-mono">
                    {email}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-400">Member ID (UUID)</p>
                  <button
                    onClick={handleCopyId}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
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
                <p className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 mt-1 truncate select-all">
                  {user.id}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Member Since</span>
                </div>
                <span className="text-xs font-medium text-slate-300">
                  {memberSince}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSignOut}
            disabled={isSigningOut}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
