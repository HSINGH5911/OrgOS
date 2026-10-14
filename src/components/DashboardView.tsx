"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Sparkles,
  FileText,
  CalendarCheck,
  ClipboardList,
  Users,
  Search,
  ArrowRight,
  Building2,
  GraduationCap,
  ShieldCheck,
  Shield,
  CheckCircle2,
  Plus,
  Upload,
  Calendar,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface DashboardViewProps {
  user: SupabaseUser;
}

interface MembershipData {
  role: string;
  title: string | null;
  organization: {
    name: string;
    university: string;
    slug: string;
  } | null;
}

export interface ChapterDocument {
  id: string;
  name: string;
  category: string;
  status: "Indexed" | "In Review" | "Processing";
  lastModified: string;
}

export default function DashboardView({ user }: DashboardViewProps) {
  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [documents, setDocuments] = useState<ChapterDocument[]>([]);

  // Fetch the user's organization and role from Supabase
  useEffect(() => {
    async function loadOrgData() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("org_memberships")
          .select(`
            role,
            title,
            organizations (
              name,
              university,
              slug
            )
          `)
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        if (!error && data) {
          const org = Array.isArray(data.organizations)
            ? data.organizations[0]
            : data.organizations;

          setMembership({
            role: data.role,
            title: data.title,
            organization: org as any,
          });
        }
      } catch (err) {
        console.error("Failed to load organization details:", err);
      } finally {
        setLoadingOrg(false);
      }
    }

    loadOrgData();
  }, [user.id]);

  // Fallbacks from metadata
  const fullName =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Officer";
  const orgName =
    membership?.organization?.name ||
    user.user_metadata?.organization ||
    "Student Organization";
  const university =
    membership?.organization?.university ||
    user.user_metadata?.university ||
    "Collegiate Campus";
  const role = membership?.role || user.user_metadata?.role || "member";
  const title =
    membership?.title ||
    (role === "president" ? "President" : role === "officer" ? "Officer" : "Member");

  return (
    <div className="space-y-6">
      {/* 1. Header Greeting & Organization Banner */}
      <section className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="orgos-badge orgos-badge--primary capitalize">
                {title} Workspace
              </span>
              <span className="orgos-badge orgos-badge--success">
                <span className="orgos-badge-dot" />
                Active Chapter
              </span>
            </div>
            <h1 className="orgos-title-h1">Welcome back, {fullName}!</h1>
            <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-800">{orgName}</span>
              <span>•</span>
              <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
              <span>{university}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 orgos-mono px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-sm">
              Academic Year 2026-2027
            </span>
          </div>
        </div>
      </section>

      {/* 2. Quick Action Feature Cards (The 4 Pillars) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: AI Copilot */}
        <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm hover:border-[#1B365D] transition-colors flex flex-col justify-between">
          <div>
            <div className="h-8 w-8 rounded-sm bg-[#EBF1F8] border border-[#C8D8E9] flex items-center justify-center text-[#1B365D] mb-3">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-[#0F172A] mb-1">AI Copilot</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Query historical budgets, venue approvals, and past checklists.
            </p>
          </div>
          <button className="mt-4 orgos-btn orgos-btn--secondary w-full text-xs">
            <span>Query Knowledge</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Document Vault */}
        <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm hover:border-[#1B365D] transition-colors flex flex-col justify-between">
          <div>
            <div className="h-8 w-8 rounded-sm bg-[#EBF1F8] border border-[#C8D8E9] flex items-center justify-center text-[#1B365D] mb-3">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-[#0F172A] mb-1">Document Vault</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Upload past agendas, permits, and post-mortems for AI indexing.
            </p>
          </div>
          <button className="mt-4 orgos-btn orgos-btn--secondary w-full text-xs">
            <span>Upload Documents</span>
            <Upload className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Events & Attendance */}
        <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm hover:border-[#1B365D] transition-colors flex flex-col justify-between">
          <div>
            <div className="h-8 w-8 rounded-sm bg-[#E8F5E9] border border-[#A3D9B5] flex items-center justify-center text-[#0F9D58] mb-3">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-[#0F172A] mb-1">Events & Attendance</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Create meetings and generate instant dynamic QR check-in codes.
            </p>
          </div>
          <button className="mt-4 orgos-btn orgos-btn--secondary w-full text-xs">
            <span>Create Event</span>
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 4: Officer Transition */}
        <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm hover:border-[#1B365D] transition-colors flex flex-col justify-between">
          <div>
            <div className="h-8 w-8 rounded-sm bg-[#FEF3C7] border border-[#FCD34D] flex items-center justify-center text-[#D97706] mb-3">
              <ClipboardList className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-[#0F172A] mb-1">Handover Dossier</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Executive board transition checklists, bank handover, and roles.
            </p>
          </div>
          <button className="mt-4 orgos-btn orgos-btn--secondary w-full text-xs">
            <span>View Checklist</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 3. High-Density Operational Spreadsheet & Activity Panel */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Operational Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="orgos-title-h2">Chapter Knowledge & Operations Archive</h2>
            {documents.length > 0 && (
              <span className="text-xs text-slate-500 orgos-mono">
                {documents.length} {documents.length === 1 ? "document" : "documents"}
              </span>
            )}
          </div>

          {documents.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-sm p-10 text-center flex flex-col items-center justify-center">
              <div className="h-10 w-10 rounded-sm bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                <FileText className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="font-semibold text-sm text-slate-800 mb-1">
                No documents uploaded
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">
                No documents have been uploaded to this chapter archive yet. Upload agendas, permits, or budgets to begin building your AI institutional memory.
              </p>
              <button className="orgos-btn orgos-btn--secondary text-xs flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Document</span>
              </button>
            </div>
          ) : (
            <div className="orgos-table-wrapper">
              <table className="orgos-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Resource / Operation</th>
                    <th>Grounding Status</th>
                    <th>Last Modified</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <span className="orgos-badge orgos-badge--primary">{doc.category}</span>
                      </td>
                      <td className="font-medium text-slate-900">{doc.name}</td>
                      <td>
                        <span className="text-xs text-[#0F9D58] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {doc.status}
                        </span>
                      </td>
                      <td className="text-slate-500 orgos-mono">{doc.lastModified}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Side Panel: Security & Tenancy Info */}
        <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm space-y-4">
          <h2 className="orgos-title-h2">Chapter Metadata</h2>
          
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Your Org Role</span>
              <span className="font-semibold text-slate-800 capitalize">{role}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Assigned Title</span>
              <span className="font-semibold text-slate-800">{title}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Campus</span>
              <span className="font-semibold text-slate-800 truncate max-w-[140px]">{university}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/members"
              className="orgos-btn orgos-btn--secondary w-full text-xs flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#1B365D]" />
                Chapter Roster & Members
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              href="/roles"
              className="orgos-btn orgos-btn--secondary w-full text-xs flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#1B365D]" />
                Roles & Permissions
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              href="/account"
              className="orgos-btn orgos-btn--secondary w-full text-xs text-slate-600"
            >
              <span>Manage Account & Settings</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}