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
          classes: "orgos-badge--primary",
          privilege: "Full Administrative & Vault Control",
        };
      case "officer":
      case "treasurer":
      case "secretary":
        return {
          title: "Executive Officer",
          classes: "orgos-badge--warning",
          privilege: "Officer Operations & Attendance Access",
        };
      default:
        return {
          title: "Active Member",
          classes: "orgos-badge--success",
          privilege: "Standard Organization Access",
        };
    }
  };

  const roleInfo = getRoleBadge(role);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-account-title"
    >
      <div
        className="w-full max-w-lg bg-white border border-slate-300 rounded-sm shadow-xl overflow-hidden relative text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative px-6 pt-5 pb-4 border-b border-slate-200 flex items-start justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-sm bg-[#1B365D] flex items-center justify-center font-bold text-sm text-white">
              {initials}
            </div>
            <div>
              <h2
                id="modal-account-title"
                className="text-base font-bold text-slate-900 tracking-tight"
              >
                {fullName}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`orgos-badge ${roleInfo.classes}`}
                >
                  {roleInfo.title}
                </span>
                <span className="text-xs text-slate-500 truncate max-w-[200px]">
                  {email}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close account modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Organization Details Card */}
          <div className="p-4 rounded-sm bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="orgos-meta-label text-[#1B365D] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Organization Affiliation
              </span>
              <span className="orgos-badge orgos-badge--success">
                <span className="orgos-badge-dot" />
                Active Member
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Organization</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  {organization}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-500 font-medium">University / Campus</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {university}
                  </p>
                </div>
              </div>

              <div className="sm:col-span-2">
                <p className="text-[11px] text-slate-500 font-medium">Access Privileges</p>
                <p className="text-xs text-slate-700 mt-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0F9D58] shrink-0" />
                  <span>{roleInfo.privilege}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Account & Security Card */}
          <div className="p-4 rounded-sm bg-slate-50 border border-slate-200 space-y-3">
            <span className="orgos-meta-label text-[#1B365D] flex items-center gap-1.5 pb-2 border-b border-slate-200">
              <IdCard className="w-3.5 h-3.5" />
              Member Credentials
            </span>

            <div className="space-y-3 pt-1">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Registered Email</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs font-mono text-slate-800">
                    {email}
                  </span>
                </div>
              </div>

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
                <p className="text-xs font-mono text-slate-700 bg-white px-2.5 py-1.5 rounded-sm border border-slate-200 mt-1 truncate select-all">
                  {user.id}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Member Since</span>
                </div>
                <span className="text-xs font-medium text-slate-800">
                  {memberSince}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSignOut}
            disabled={isSigningOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 hover:text-red-800 hover:bg-red-50 border border-red-200 rounded-sm transition-colors disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="orgos-btn orgos-btn--secondary"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
