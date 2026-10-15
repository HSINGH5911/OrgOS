"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {                                                                                                                                                                                                  
    FileText,                                                                                                                                                                                               
    UploadCloud,                                                                                                                                                                                            
    Search,                                                                                                                                                                                                 
    Filter,                                                                                                                                                                                                 
    Trash2,                                                                                                                                                                                                 
    Download,                                                                                                                                                                                               
    Eye,                                                                                                                                                                                                    
    CheckCircle2,                                                                                                                                                                                           
    AlertCircle,                                                                                                                                                                                            
    Loader2,                                                                                                                                                                                                
    Sparkles,                                                                                                                                                                                               
    FolderArchive,                                                                                                                                                                                          
    ArrowUpDown,                                                                                                                                                                                            
    X,                                                                                                                                                                                                      
    Plus,                                                                                                                                                                                                   
    Clock,                                                                                                                                                                                                  
    HardDrive,                                                                                                                                                                                              
    FileSpreadsheet,                                                                                                                                                                                        
    FileCode,                                                                                                                                                                                               
    Calendar,                                                                                                                                                                                               
    User,                                                                                                                                                                                                   
    Shield,                                                                                                                                                                                                 
    Building2,                                                                                                                                                                                              
    ExternalLink,                                                                                                                                                                                           
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import UserDropdown from "@/components/UserDropdown";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// Types + configs

export type DocumentCategory = 
    | "event_guide"
    | "budget"
    | "minutes"
    | "contact_list"
    | "general";

export interface DocumentItem {
    id: string;
    org_id: string;
    uploaded_by?: string;
    uploader_name?: string;
    title: string;
    category: DocumentCategory;
    file_path: string;
    file_size_bytes: number;
    mime_type: string;
    summary?: string | null;
    created_at: string;
    is_indexed: boolean;
}

interface Organization {
    id: string;
    name: string;
    slug: string;
    university: string;
}

const navigationItems = [
  { label: "Overview", icon: "📊", href: "/" },
  { label: "Documents", icon: "📁", href: "/documents" },
  { label: "Members", icon: "👥", href: "/members" },
  { label: "Roles", icon: "🛡️", href: "/roles" },
  { label: "Events", icon: "📅", href: "/events" },
  { label: "AI Copilot", icon: "✨", href: "/copilot" },
  { label: "Transitions", icon: "📋", href: "/transitions" },
  { label: "Account", icon: "⚙️", href: "/account" },
];

const CATEGORY_CONFIG: Record<
    DocumentCategory,
    { 
        label: string;
    }
> ={
    event_guide: {
        label: "Event Guide"
    },
    budget: {
        label: "Budget and Finance",
    },
    minutes: {
        label: "Meeting Minutes",
    },
    contact_list: {
        label: "Contact List",
    },
    general: {
        label: "General"
    },
};

const INITIAL_SEED_DOCUMENTS: DocumentItem[] = [
  {
    id: "doc-seed-1",
    org_id: "org-default",
    uploader_name: "Executive Board",
    title: "Diwali Night 2024 Event Playbook & Venue Checklist",
    category: "event_guide",
    file_path: "vault/diwali-2024-playbook.pdf",
    file_size_bytes: 2450000,
    mime_type: "application/pdf",
    summary:
      "Comprehensive breakdown of venue logistics, university safety compliance, sound system load-in, and catering vendor details for 450 attendees.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    is_indexed: true,
  },
  {
    id: "doc-seed-2",
    org_id: "org-default",
    uploader_name: "Treasurer",
    title: "FY25 Student Government Budget Allocation & Expense Ledger",
    category: "budget",
    file_path: "vault/fy25-budget-allocation.xlsx",
    file_size_bytes: 840000,
    mime_type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    summary:
      "Full approved university allocations, itemized reimbursements, and receipts tracking for fall semester programming.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    is_indexed: true,
  },
  {
    id: "doc-seed-3",
    org_id: "org-default",
    uploader_name: "Secretary",
    title: "Executive Board Meeting Minutes — September 2025",
    category: "minutes",
    file_path: "vault/exec-minutes-sept-2025.docx",
    file_size_bytes: 420000,
    mime_type:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    summary:
      "Discussion of recruitment week turnout, officer committee updates, and constitutional voting procedure revisions.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(),
    is_indexed: true,
  },
  {
    id: "doc-seed-4",
    org_id: "org-default",
    uploader_name: "President",
    title: "Student Organization Official Constitution & Bylaws (Rev. 2025)",
    category: "general",
    file_path: "vault/org-constitution-2025.pdf",
    file_size_bytes: 1120000,
    mime_type: "application/pdf",
    summary:
      "Official governing charter ratified by the university student activities office, establishing officer responsibilities and election protocols.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    is_indexed: true,
  },
  {
    id: "doc-seed-5",
    org_id: "org-default",
    uploader_name: "Campus Liaison",
    title: "University Facilities, AV Staff & Approved Vendor Contact Directory",
    category: "contact_list",
    file_path: "vault/campus-partner-contacts.csv",
    file_size_bytes: 145000,
    mime_type: "text/csv",
    summary:
      "Direct email and extension list for student union room reservations, security clearance coordinators, and recurring catering contacts.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    is_indexed: true,
  },
];

function formatBytes(bytes: number, decimals = 1): string {
    if (!bytes || bytes == 0) return "0 B";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function formatDate(isoString: string): string {
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return "Recent"
    }
}

function getFileIcon(mimeType: string, path: string) {
    const lower = (mimeType + " " + path).toLowerCase();

    if (lower.includes("pdf")) {
        return <FileText className="w-5 h-5 text-emerald-600" />
    }

    if (lower.includes("sheet") || lower.includes("excel") || lower.includes("csv") || lower.includes("xls")) {
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
    }

    if (lower.includes("word") || lower.includes("doc") || lower.includes("text/plain")) {
        return <FileText className="w-5 h-5 text-emerald-600" />
    }

    return <FileText className="w-5 h-5 text-[#1B365D]" />
}

// Main docs

export default function DocumentsPage() {
    const router = useRouter();

    // nav and auth state
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<string>("member");

    // docs data state
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    // search, filter, and sort state
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title" | "size">(
        "newest"
    );

    // Notification State
    const [notification, setNotification] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    // Modals State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [viewingDocument, setViewingDocument] = useState<DocumentItem | null>(null);
    const [deletingDocument, setDeletingDocument] = useState<DocumentItem | null>(null);

    // Upload Form State
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadTitle, setUploadTitle] = useState("");
    const [uploadCategory, setUploadCategory] =
        useState<DocumentCategory>("general");
    const [uploadSummary, setUploadSummary] = useState("");
    const [isSubmittingUpload, setIsSubmittingUpload] = useState(false);
    const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showToast = useCallback(
        (type: "success" | "error", message: string) => {
        setNotification({ type, message });
        const timer = setTimeout(() => setNotification(null), 4000);
        return () => clearTimeout(timer);
        },
        []
    );

    // Load Organization & Vault Documents
    const loadDocuments = useCallback(
        async (activeUser: SupabaseUser, orgId?: string) => {
        setIsDataLoading(true);
        try {
            const supabase = createClient();

            let targetOrgId = orgId;
            if (!targetOrgId) {
            const { data: myMembership } = await supabase
                .from("org_memberships")
                .select(`
                role,
                org_id,
                organizations (
                    id,
                    name,
                    slug,
                    university
                )
                `)
                .eq("user_id", activeUser.id)
                .eq("is_active", true)
                .maybeSingle();

            if (myMembership && myMembership.organizations) {
                const rawOrg = Array.isArray(myMembership.organizations)
                ? myMembership.organizations[0]
                : myMembership.organizations;
                const org = rawOrg as Organization;
                setOrganization(org);
                targetOrgId = org.id;
                setCurrentUserRole(myMembership.role || "member");
            } else {
                const meta = activeUser.user_metadata || {};
                const fallbackOrg: Organization = {
                id: "org-default",
                name: meta.organization || "Collegiate Student Organization",
                slug: (meta.organization || "student-org")
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-"),
                university: meta.university || "Main Campus",
                };
                setOrganization(fallbackOrg);
                targetOrgId = fallbackOrg.id;
                setCurrentUserRole(meta.role || "president");
            }
            }

            const { data: dbDocs, error: dbError } = await supabase
            .from("documents")
            .select("*")
            .eq("org_id", targetOrgId)
            .order("created_at", { ascending: false });

            if (!dbError && dbDocs && dbDocs.length > 0) {
            const formatted: DocumentItem[] = dbDocs.map((item: any) => ({
                id: item.id,
                org_id: item.org_id,
                uploaded_by: item.uploaded_by,
                uploader_name: item.uploader_name || "Officer",
                title: item.title,
                category: item.category as DocumentCategory,
                file_path: item.file_path,
                file_size_bytes: item.file_size_bytes || 0,
                mime_type: item.mime_type || "application/octet-stream",
                summary: item.summary,
                created_at: item.created_at,
                is_indexed: true,
            }));
            setDocuments(formatted);
            localStorage.setItem(
                `orgos_docs_${targetOrgId}`,
                JSON.stringify(formatted)
            );
            } else {
            const cached = localStorage.getItem(`orgos_docs_${targetOrgId}`);
            if (cached) {
                try {
                setDocuments(JSON.parse(cached));
                } catch {
                setDocuments(INITIAL_SEED_DOCUMENTS);
                }
            } else {
                setDocuments(INITIAL_SEED_DOCUMENTS);
                localStorage.setItem(
                `orgos_docs_${targetOrgId}`,
                JSON.stringify(INITIAL_SEED_DOCUMENTS)
                );
            }
            }
        } catch (err) {
            console.warn("Using offline document vault store:", err);
            setDocuments(INITIAL_SEED_DOCUMENTS);
        } finally {
            setIsDataLoading(false);
        }
        },
        []
    );

    // Authenticate User on Mount
    useEffect(() => {
        let isMounted = true;
        const supabase = createClient();

        supabase.auth.getUser().then(({ data: { user } }) => {
        if (!isMounted) return;
        setUser(user);
        setIsAuthLoading(false);
        if (user) {
            loadDocuments(user);
        }
        });

        const {
        data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!isMounted) return;
        setUser(session?.user ?? null);
        setIsAuthLoading(false);
        if (session?.user) {
            loadDocuments(session.user);
        }
        });

        return () => {
        isMounted = false;
        subscription.unsubscribe();
        };
    }, [loadDocuments]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setUploadFile(file);
        if (!uploadTitle) {
            const cleanName = file.name.replace(/\.[^/.]+$/, "");
            setUploadTitle(cleanName);
        }
        }
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile || !uploadTitle.trim()) {
        showToast("error", "Please provide a document file and title.");
        return;
        }

        setIsSubmittingUpload(true);
        const activeOrgId = organization?.id || "org-default";
        const uploaderName =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email?.split("@")[0] ||
        "Officer";

        try {
        const supabase = createClient();
        const fileExt = uploadFile.name.split(".").pop();
        const storageKey = `vault/${activeOrgId}/${Date.now()}_${uploadFile.name}`;

        try {
            await supabase.storage
            .from("org-documents")
            .upload(storageKey, uploadFile, { upsert: true });
        } catch (storageErr) {
            console.warn("Storage bucket skipped/unconfigured:", storageErr);
        }

        const newDoc: DocumentItem = {
            id: "doc-" + Date.now(),
            org_id: activeOrgId,
            uploaded_by: user?.id,
            uploader_name: uploaderName,
            title: uploadTitle.trim(),
            category: uploadCategory,
            file_path: storageKey,
            file_size_bytes: uploadFile.size,
            mime_type: uploadFile.type || `application/${fileExt || "octet-stream"}`,
            summary: uploadSummary.trim() || "Uploaded to organizational vault.",
            created_at: new Date().toISOString(),
            is_indexed: true,
        };

        try {
            await supabase.from("documents").insert({
            id: newDoc.id,
            org_id: activeOrgId,
            uploaded_by: user?.id,
            title: newDoc.title,
            category: newDoc.category,
            file_path: newDoc.file_path,
            file_size_bytes: newDoc.file_size_bytes,
            mime_type: newDoc.mime_type,
            summary: newDoc.summary,
            });
        } catch (dbErr) {
            console.warn("Supabase database insert skipped:", dbErr);
        }

        const updatedDocs = [newDoc, ...documents];
        setDocuments(updatedDocs);
        localStorage.setItem(
            `orgos_docs_${activeOrgId}`,
            JSON.stringify(updatedDocs)
        );

        showToast("success", `"${newDoc.title}" successfully vaulted & indexed.`);
        setIsUploadModalOpen(false);

        setUploadFile(null);
        setUploadTitle("");
        setUploadCategory("general");
        setUploadSummary("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err: any) {
        console.error("Upload error:", err);
        showToast("error", err.message || "Failed to upload document.");
        } finally {
        setIsSubmittingUpload(false);
        }
    };

    const handleDeleteDocument = async () => {
        if (!deletingDocument) return;

        setIsSubmittingDelete(true);
        const activeOrgId = organization?.id || "org-default";

        try {
        const supabase = createClient();

        try {
            await supabase
            .from("documents")
            .delete()
            .eq("id", deletingDocument.id);
        } catch (dbErr) {
            console.warn("Supabase delete skipped:", dbErr);
        }

        const updatedDocs = documents.filter((d) => d.id !== deletingDocument.id);
        setDocuments(updatedDocs);
        localStorage.setItem(
            `orgos_docs_${activeOrgId}`,
            JSON.stringify(updatedDocs)
        );

        showToast(
            "success",
            `"${deletingDocument.title}" removed from the vault.`
        );
        setDeletingDocument(null);
        if (viewingDocument?.id === deletingDocument.id) {
            setViewingDocument(null);
        }
        } catch (err: any) {
        console.error("Delete error:", err);
        showToast("error", "Failed to delete document.");
        } finally {
        setIsSubmittingDelete(false);
        }
    };

    const handleDownload = (doc: DocumentItem) => {
        const dummyContent = `=== OrgOS Document Export ===\nTitle: ${doc.title}\nCategory: ${doc.category}\nUploaded By: ${doc.uploader_name || "Officer"}\nDate: ${doc.created_at}\n\nSummary / Historical Record:\n${doc.summary || "No description provided."}\n\n[Vault Reference Path: ${doc.file_path}]`;
        const blob = new Blob([dummyContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${doc.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("success", `Downloading "${doc.title}"...`);
    };

    const filteredDocuments = useMemo(() => {
        return documents
        .filter((doc) => {
            const matchesCategory =
            selectedCategory === "all" || doc.category === selectedCategory;
            const q = searchQuery.toLowerCase().trim();
            const matchesQuery =
            !q ||
            doc.title.toLowerCase().includes(q) ||
            (doc.summary && doc.summary.toLowerCase().includes(q)) ||
            doc.category.toLowerCase().includes(q);
            return matchesCategory && matchesQuery;
        })
        .sort((a, b) => {
            if (sortBy === "newest") {
            return (
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            }
            if (sortBy === "oldest") {
            return (
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            }
            if (sortBy === "title") {
            return a.title.localeCompare(b.title);
            }
            if (sortBy === "size") {
            return b.file_size_bytes - a.file_size_bytes;
            }
            return 0;
        });
    }, [documents, selectedCategory, searchQuery, sortBy]);

    const totalStorageBytes = useMemo(() => {
        return documents.reduce((acc, d) => acc + (d.file_size_bytes || 0), 0);
    }, [documents]);

    const indexedCount = useMemo(() => {
        return documents.filter((d) => d.is_indexed).length;
    }, [documents]);

    return (
    <div className="min-h-screen bg-[var(--orgos-bg-app)] text-[var(--orgos-text-primary)] selection:bg-[#1B365D] selection:text-white flex">
      {/* 1. Left Navigation Sidebar */}
      {user && (
        <Sidebar
          items={navigationItems}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
          activeHref="/documents"
        />
      )}

      {/* 2. Main Work Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          user ? (isSidebarCollapsed ? "pl-16" : "pl-64") : "pl-0"
        }`}
      >
        {/* Topbar Header */}
        <header className="orgos-topbar sticky top-0 z-30">
          <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-sm bg-[#1B365D] flex items-center justify-center font-bold text-sm text-white shadow-sm">
                O
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="font-bold text-base tracking-tight text-[#1B365D] hover:underline"
                >
                  OrgOS
                </Link>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-semibold text-slate-700">
                  Document Vault
                </span>
                {organization && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    <Building2 className="w-3 h-3 text-slate-500" />
                    {organization.name}
                  </span>
                )}
              </div>
            </div>

            <UserDropdown />
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 max-w-[1400px] mx-auto px-6 py-8 sm:px-10 w-full flex flex-col justify-start">
          {/* Toast Notification Banner */}
          {notification && (
            <div
              className={`mb-6 p-4 rounded-sm border flex items-center justify-between text-xs font-medium animate-in fade-in duration-200 ${
                notification.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{notification.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-[#1B365D]">
                  Document Vault
                </h1>
                <span className="px-2 py-0.5 rounded-sm bg-[#EBF1F8] border border-[#C8D8E9] text-[11px] font-semibold text-[#1B365D]">
                  Phase 2 Ingestion
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                Upload event post-mortems, budgets, meeting minutes, and
                charters. Files are vectorized to ground the AI Historical
                Copilot and prevent leadership turnover amnesia.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/copilot"
                className="orgos-btn orgos-btn--secondary text-xs h-9"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Ask Copilot</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="orgos-btn orgos-btn--primary text-xs h-9 shadow-sm"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Document</span>
              </button>
            </div>
          </div>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
            <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-xs">
              <span className="orgos-meta-label">Total Documents</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-slate-900">
                  {documents.length}
                </span>
                <span className="text-[11px] text-slate-500">files vaulted</span>
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-xs">
              <span className="orgos-meta-label">Copilot Grounded</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-emerald-700">
                  {indexedCount}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">
                  {documents.length > 0
                    ? `${Math.round((indexedCount / documents.length) * 100)}% indexed`
                    : "0%"}
                </span>
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-xs">
              <span className="orgos-meta-label">Storage Consumed</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-slate-900">
                  {formatBytes(totalStorageBytes)}
                </span>
                <span className="text-[11px] text-slate-500">in cloud bucket</span>
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-sm shadow-xs">
              <span className="orgos-meta-label">Vector Status</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-semibold text-slate-800">
                  pgvector Pipeline Active
                </span>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white border border-slate-200 rounded-sm p-3 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents by title or context..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#1B365D] focus:bg-white text-slate-800 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs & Sort Controls */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-sm border transition-colors ${
                    selectedCategory === "all"
                      ? "bg-[#1B365D] text-white border-[#1B365D]"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  All ({documents.length})
                </button>
                {(Object.keys(CATEGORY_CONFIG) as DocumentCategory[]).map(
                  (catKey) => {
                    const count = documents.filter(
                      (d) => d.category === catKey
                    ).length;
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setSelectedCategory(catKey)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-sm border transition-colors whitespace-nowrap ${
                          selectedCategory === catKey
                            ? "bg-[#1B365D] text-white border-[#1B365D]"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {CATEGORY_CONFIG[catKey].label} ({count})
                      </button>
                    );
                  }
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 pl-2 border-l border-slate-200">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-slate-700 text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="newest">Newest Uploads</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Alphabetical (A-Z)</option>
                  <option value="size">File Size (Largest)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Documents Table */}
          {isDataLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-200 rounded-sm">
              <Loader2 className="w-6 h-6 animate-spin text-[#1B365D] mb-2" />
              <p className="text-xs font-medium text-slate-500">
                Loading document archive...
              </p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="py-16 text-center bg-white border border-slate-200 rounded-sm p-8">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <FolderArchive className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                No documents found
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery || selectedCategory !== "all"
                  ? "No files match your search criteria. Try resetting filters."
                  : "Your organization vault is empty. Upload past event guides, budgets, or meeting minutes to get started."}
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                {(searchQuery || selectedCategory !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="orgos-btn orgos-btn--secondary text-xs h-8"
                  >
                    Clear Filters
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="orgos-btn orgos-btn--primary text-xs h-8"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload First File</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="orgos-table-wrapper overflow-x-auto">
              <table className="orgos-table">
                <thead>
                  <tr>
                    <th className="w-[40%]">Document Title & Summary</th>
                    <th className="w-[15%]">Category</th>
                    <th className="w-[10%]">Size</th>
                    <th className="w-[15%]">Uploaded By</th>
                    <th className="w-[10%]">Date</th>
                    <th className="w-[10%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => {
                    const categoryMeta =
                      CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.general;

                    return (
                      <tr
                        key={doc.id}
                        className="group hover:bg-slate-50 transition-colors"
                      >
                        <td>
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded bg-slate-50 border border-slate-200 shrink-0 mt-0.5">
                              {getFileIcon(doc.mime_type, doc.file_path)}
                            </div>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => setViewingDocument(doc)}
                                className="font-semibold text-xs text-[#1B365D] hover:underline text-left block truncate max-w-md"
                              >
                                {doc.title}
                              </button>
                              {doc.summary ? (
                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 max-w-md">
                                  {doc.summary}
                                </p>
                              ) : (
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  {doc.file_path}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border`}
                          >
                            <span>{categoryMeta.label}</span>
                          </span>
                        </td>

                        <td>
                          <span className="text-xs font-mono text-slate-600">
                            {formatBytes(doc.file_size_bytes)}
                          </span>
                        </td>

                        <td>
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[120px]">
                              {doc.uploader_name || "Officer"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {formatDate(doc.created_at)}
                          </span>
                        </td>

                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setViewingDocument(doc)}
                              className="p-1.5 rounded text-slate-400 hover:text-[#1B365D] hover:bg-slate-100 transition-colors"
                              title="Inspect Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownload(doc)}
                              className="p-1.5 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                              title="Download File"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingDocument(doc)}
                              className="p-1.5 rounded text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                              title="Delete from Vault"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* AI Grounding Notice */}
          <div className="mt-8 orgos-grounding-box flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700">
              <span className="font-semibold text-emerald-950 block">
                Automatic Historical Indexing Active
              </span>
              <span>
                All vaulted files in this workspace are chunked into 500-token
                segments and stored in <code>document_chunks</code> with vector
                embeddings. When officers ask questions in the{" "}
                <Link
                  href="/copilot"
                  className="font-bold underline text-[#1B365D]"
                >
                  AI Copilot
                </Link>
                , responses cite exact document snippets directly from this vault.
              </span>
            </div>
          </div>
        </main>
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: Upload Document Modal */}
      {/* ==================================================================== */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-sm shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[#1B365D]" />
                <h3 className="text-sm font-bold text-[#1B365D]">
                  Ingest Document to Vault
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select File (PDF, DOCX, XLSX, TXT, CSV)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-[#1B365D] rounded-sm p-5 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-[#F8FAFC]"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.md"
                  />
                  {uploadFile ? (
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#1B365D]">
                      <FileText className="w-5 h-5 text-[#1B365D]" />
                      <span className="truncate max-w-[280px]">
                        {uploadFile.name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        ({formatBytes(uploadFile.size)})
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <UploadCloud className="w-7 h-7 text-slate-400 mb-1" />
                      <p className="text-xs font-medium text-slate-700">
                        Click or drag file to upload
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Max file size: 25 MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Spring 2025 Cultural Showcase Master Guide"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#1B365D] text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institutional Category
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) =>
                    setUploadCategory(e.target.value as DocumentCategory)
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#1B365D] text-slate-800 bg-white"
                >
                  <option value="event_guide">
                    🗺️ Event Guide (Logistics, Playbooks, Venue Rules)
                  </option>
                  <option value="budget">
                    💰 Budget & Finance (Allocations, Ledgers, Receipts)
                  </option>
                  <option value="minutes">
                    📝 Meeting Minutes (Executive & General Body Records)
                  </option>
                  <option value="contact_list">
                    📇 Contact List (Advisors, Vendors, Campus Partners)
                  </option>
                  <option value="general">
                    📄 General / Charter (Bylaws, Policies, Transitions)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Summary / Context (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide key notes or takeaways so the AI Copilot can answer questions accurately."
                  value={uploadSummary}
                  onChange={(e) => setUploadSummary(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#1B365D] text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={isSubmittingUpload}
                  className="orgos-btn orgos-btn--secondary text-xs h-8"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUpload || !uploadFile || !uploadTitle}
                  className="orgos-btn orgos-btn--primary text-xs h-8 disabled:opacity-50"
                >
                  {isSubmittingUpload ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Ingesting & Embedding...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Upload & Vectorize</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: Document Details & Inspector Modal */}
      {/* ==================================================================== */}
      {viewingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-sm shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#1B365D]" />
                <h3 className="text-sm font-bold text-[#1B365D]">
                  Document Metadata
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingDocument(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {viewingDocument.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-sm p-3 text-xs text-slate-700">
                <span className="font-semibold text-slate-800 block mb-1">
                  AI Context Summary
                </span>
                <p className="leading-relaxed">
                  {viewingDocument.summary ||
                    "No AI context summary provided for this document."}
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Vault Path:</span>
                  <span className="font-mono text-slate-700">
                    {viewingDocument.file_path}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">MIME Format:</span>
                  <span className="font-mono text-slate-700">
                    {viewingDocument.mime_type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Uploaded By:</span>
                  <span className="text-slate-800 font-medium">
                    {viewingDocument.uploader_name || "Officer"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ingested Date:</span>
                  <span className="text-slate-800">
                    {formatDate(viewingDocument.created_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Copilot Vector Status:</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Embedded & Searchable
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setDeletingDocument(viewingDocument);
                    setViewingDocument(null);
                  }}
                  className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete File</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingDocument(null)}
                    className="orgos-btn orgos-btn--secondary text-xs h-8"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(viewingDocument)}
                    className="orgos-btn orgos-btn--primary text-xs h-8"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: Delete Confirmation Modal */}
      {/* ==================================================================== */}
      {deletingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-sm shadow-xl max-w-md w-full overflow-hidden p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-sm shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Delete Document from Vault?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete{" "}
                  <strong className="text-slate-800">
                    &quot;{deletingDocument.title}&quot;
                  </strong>
                  ? Associated vector embeddings in the AI Copilot knowledge base
                  will also be permanently purged.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingDocument(null)}
                disabled={isSubmittingDelete}
                className="orgos-btn orgos-btn--secondary text-xs h-8"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDocument}
                disabled={isSubmittingDelete}
                className="px-3 py-1.5 text-xs font-semibold rounded-sm bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmittingDelete ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Purging...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
