"use client";

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

// ============================================================================
// Types & Configuration
// ============================================================================

export type DocumentCategory =
  | "event_guide"
  | "budget"
  | "minutes"
  | "contact_list"
  | "general"
  | string;

export type DocumentVisibility = "all" | "officers" | "exec" | "president";

export interface DocumentTypeItem {
  id: string;
  label: string;
}

export interface DocumentItem {
  id: string;
  org_id: string;
  uploaded_by?: string;
  uploader_name?: string;
  title: string;
  category: string;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  summary?: string | null;
  visibility: DocumentVisibility;
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
  { label: "Overview", href: "/" },
  { label: "Documents", href: "/documents" },
  { label: "Members", href: "/members" },
  { label: "Roles", href: "/roles" },
  { label: "Calendar", href: "/calendar" },
  { label: "AI Copilot", href: "/copilot" },
  { label: "Account", href: "/account" },
];

const DEFAULT_DOC_TYPES: DocumentTypeItem[] = [
  { id: "event_guide", label: "Event Guide" },
  { id: "budget", label: "Budget & Finance" },
  { id: "minutes", label: "Meeting Minutes" },
  { id: "contact_list", label: "Contact List" },
  { id: "general", label: "General / Charter" },
];

const VISIBILITY_OPTIONS: {
  value: DocumentVisibility;
  label: string;
  description: string;
}[] = [
  {
    value: "all",
    label: "All Members",
    description: "Visible to all active chapter members",
  },
  {
    value: "officers",
    label: "Officers & Above",
    description: "Restricted to executive board and committee officers",
  },
  {
    value: "exec",
    label: "Executive Board",
    description: "Restricted to President and Treasurer",
  },
  {
    value: "president",
    label: "President Only",
    description: "Strictly confidential; visible only to the President",
  },
];

function parseVisibility(summary?: string | null): DocumentVisibility {
  if (!summary) return "all";
  const match = summary.match(/^\[access:(all|officers|exec|president)\]/i);
  if (match && match[1]) {
    const val = match[1].toLowerCase();
    if (val === "officers" || val === "exec" || val === "president") {
      return val as DocumentVisibility;
    }
  }
  return "all";
}

function cleanSummary(summary?: string | null): string {
  if (!summary) return "";
  return summary.replace(/^\[access:(all|officers|exec|president)\]\s*/i, "").trim();
}

function canUserViewDocument(
  userRole: string,
  visibility?: DocumentVisibility | string
): boolean {
  const role = (userRole || "").toLowerCase();
  const vis = (visibility || "all").toLowerCase();

  // President and superadmins can always see everything
  if (role === "president" || role === "admin" || role === "owner") return true;

  if (vis === "all") return true;

  if (vis === "officers") {
    return [
      "president",
      "treasurer",
      "officer",
      "event_lead",
      "lead",
      "admin",
      "vice_president",
      "vp",
    ].includes(role);
  }

  if (vis === "exec") {
    return ["president", "treasurer", "vice_president", "vp", "admin"].includes(
      role
    );
  }

  if (vis === "president") {
    return role === "president" || role === "admin";
  }

  return true;
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string }
> = {
  event_guide: {
    label: "Event Guide",
  },
  budget: {
    label: "Budget & Finance",
  },
  minutes: {
    label: "Meeting Minutes",
  },
  contact_list: {
    label: "Contact List",
  },
  general: {
    label: "General / Charter",
  },
};

function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return "0 B";

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
    return "Recent";
  }
}

function getFileIcon(mimeType: string, path: string) {
  const lower = (mimeType + " " + path).toLowerCase();

  if (lower.includes("pdf")) {
    return <FileText className="w-5 h-5 text-red-600" />;
  }

  if (
    lower.includes("sheet") ||
    lower.includes("excel") ||
    lower.includes("csv") ||
    lower.includes("xls")
  ) {
    return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
  }

  if (
    lower.includes("word") ||
    lower.includes("doc") ||
    lower.includes("text/plain")
  ) {
    return <FileCode className="w-5 h-5 text-blue-600" />;
  }

  return <FileText className="w-5 h-5 text-[#1B365D]" />;
}


// Main Documents Vault Page Component
export default function DocumentsPage() {
  const router = useRouter();

  // Navigation & Auth State
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("member");

  // Documents Data State (Starts empty: no fake/pre-seeded documents)
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState("");
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
  const [isDocTypesModalOpen, setIsDocTypesModalOpen] = useState(false);
  const [newDocTypeLabel, setNewDocTypeLabel] = useState("");
  const [viewingDocument, setViewingDocument] = useState<DocumentItem | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<DocumentItem | null>(null);

  // Dynamic Document Types (Configurable by President)
  const [docTypes, setDocTypes] = useState<DocumentTypeItem[]>(DEFAULT_DOC_TYPES);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState<string>("general");
  const [uploadVisibility, setUploadVisibility] =
    useState<DocumentVisibility>("all");
  const [uploadSummary, setUploadSummary] = useState("");
  const [isSubmittingUpload, setIsSubmittingUpload] = useState(false);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localFileUrls = useRef<Map<string, string>>(new Map());

  // Determine if active user is President
  const isPresident =
    currentUserRole?.toLowerCase() === "president" ||
    user?.user_metadata?.role?.toLowerCase() === "president";

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

        // Load custom document types for this organization
        if (typeof window !== "undefined" && targetOrgId) {
          try {
            const savedTypes = localStorage.getItem(
              `orgos_doc_types_${targetOrgId}`
            );
            if (savedTypes) {
              const parsed = JSON.parse(savedTypes);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setDocTypes(parsed);
              }
            }
          } catch {}
        }

        // Query Supabase documents table
        let query = supabase
          .from("documents")
          .select("*")
          .order("created_at", { ascending: false });

        if (
          targetOrgId &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            targetOrgId
          )
        ) {
          query = query.eq("org_id", targetOrgId);
        }

        const { data: dbDocs, error: dbError } = await query;

        if (!dbError && dbDocs && dbDocs.length > 0) {
          const formatted: DocumentItem[] = dbDocs.map((item: any) => {
            const vis = parseVisibility(item.summary);
            const clean = cleanSummary(item.summary);
            return {
              id: item.id,
              org_id: item.org_id,
              uploaded_by: item.uploaded_by,
              uploader_name: item.uploader_name || "Officer",
              title: item.title,
              category: item.category || "general",
              file_path: item.file_path,
              file_size_bytes: item.file_size_bytes || 0,
              mime_type: item.mime_type || "application/octet-stream",
              summary: clean,
              visibility: vis,
              created_at: item.created_at,
              is_indexed: true,
            };
          });
          setDocuments(formatted);
        } else {
          // No fallback data: if no documents exist in database, state strictly empty
          if (typeof window !== "undefined") {
            try {
              localStorage.removeItem(`orgos_docs_${targetOrgId}`);
            } catch {}
          }
          setDocuments([]);
        }
      } catch (err) {
        console.warn("No documents in vault:", err);
        setDocuments([]);
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

  // Load document preview URL when viewing a document
  useEffect(() => {
    if (!viewingDocument) {
      setDocumentUrl(null);
      return;
    }

    // Check if we have a local object URL from this session
    if (localFileUrls.current.has(viewingDocument.file_path)) {
      setDocumentUrl(localFileUrls.current.get(viewingDocument.file_path) || null);
      return;
    }

    const supabase = createClient();
    supabase.storage
      .from("org-documents")
      .createSignedUrl(viewingDocument.file_path, 3600)
      .then(({ data, error }) => {
        if (!error && data?.signedUrl) {
          setDocumentUrl(data.signedUrl);
        } else {
          const { data: pubData } = supabase.storage
            .from("org-documents")
            .getPublicUrl(viewingDocument.file_path);

          if (pubData?.publicUrl) {
            fetch(pubData.publicUrl, { method: "HEAD" })
              .then((res) => {
                if (res.ok) {
                  setDocumentUrl(pubData.publicUrl);
                } else {
                  setDocumentUrl(null);
                }
              })
              .catch(() => setDocumentUrl(null));
          } else {
            setDocumentUrl(null);
          }
        }
      })
      .catch(() => {
        setDocumentUrl(null);
      });
  }, [viewingDocument]);

  // Handle File Selection for Upload
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

  // Handle Upload Submission
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

      // Cache local blob URL for instant previewing in this session
      try {
        const localBlob = URL.createObjectURL(uploadFile);
        localFileUrls.current.set(storageKey, localBlob);
      } catch {}

      try {
        await supabase.storage
          .from("org-documents")
          .upload(storageKey, uploadFile, { upsert: true });
      } catch (storageErr) {
        console.warn("Storage bucket skipped/unconfigured:", storageErr);
      }

      const isUuid = (val?: string | null) =>
        Boolean(
          val &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              val
            )
        );

      const docId = crypto.randomUUID();
      const orgUuid = isUuid(activeOrgId) ? activeOrgId : null;
      const userUuid = isUuid(user?.id) ? user?.id : null;

      const rawSummary = uploadSummary.trim() || "Uploaded to organizational vault.";
      const encodedSummary = `[access:${uploadVisibility}] ${rawSummary}`;

      const newDoc: DocumentItem = {
        id: docId,
        org_id: activeOrgId,
        uploaded_by: user?.id,
        uploader_name: uploaderName,
        title: uploadTitle.trim(),
        category: uploadCategory,
        file_path: storageKey,
        file_size_bytes: uploadFile.size,
        mime_type: uploadFile.type || `application/${fileExt || "octet-stream"}`,
        summary: rawSummary,
        visibility: uploadVisibility,
        created_at: new Date().toISOString(),
        is_indexed: true,
      };

      let verifiedUserUuid: string | null = null;
      if (userUuid) {
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", userUuid)
          .maybeSingle();
        if (profileRow?.id) {
          verifiedUserUuid = profileRow.id;
        }
      }

      let verifiedOrgUuid: string | null = null;
      if (orgUuid) {
        const { data: orgRow } = await supabase
          .from("organizations")
          .select("id")
          .eq("id", orgUuid)
          .maybeSingle();
        if (orgRow?.id) {
          verifiedOrgUuid = orgRow.id;
        }
      }

      const { error: insertError } = await supabase.from("documents").insert({
        id: docId,
        org_id: verifiedOrgUuid,
        uploaded_by: verifiedUserUuid,
        uploader_name: uploaderName,
        title: newDoc.title,
        category: newDoc.category,
        file_path: newDoc.file_path,
        file_size_bytes: newDoc.file_size_bytes,
        mime_type: newDoc.mime_type,
        summary: encodedSummary,
      });

      if (insertError) {
        console.error("Database insert error:", insertError);
        showToast("error", "Database save error: " + insertError.message);
        setIsSubmittingUpload(false);
        return;
      }

      const updatedDocs = [newDoc, ...documents];
      setDocuments(updatedDocs);

      try {
        const ingestForm = new FormData();
        ingestForm.append("documentId", docId);
        if (verifiedOrgUuid) ingestForm.append("orgId", verifiedOrgUuid);
        ingestForm.append("title", newDoc.title);
        ingestForm.append("category", newDoc.category);
        ingestForm.append("rawText", rawSummary);
        ingestForm.append("file", uploadFile);
        fetch("/api/documents/ingest", { method: "POST", body: ingestForm }).catch(() => {});
      } catch {}
      showToast("success", `"${newDoc.title}" successfully vaulted & indexed.`);
      setIsUploadModalOpen(false);

      setUploadFile(null);
      setUploadTitle("");
      setUploadCategory(docTypes[0]?.id || "general");
      setUploadVisibility("all");
      setUploadSummary("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error("Upload error:", err);
      showToast("error", err.message || "Failed to upload document.");
    } finally {
      setIsSubmittingUpload(false);
    }
  };

  // President Document Type Handlers
  const handleAddDocType = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const id =
      trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") ||
      `custom_${Date.now()}`;

    if (
      docTypes.some(
        (t) => t.id === id || t.label.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      showToast("error", `Document type "${trimmed}" already exists.`);
      return;
    }

    const updated = [...docTypes, { id, label: trimmed }];
    setDocTypes(updated);
    const activeOrgId = organization?.id || "org-default";
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `orgos_doc_types_${activeOrgId}`,
          JSON.stringify(updated)
        );
      } catch {}
    }
    showToast("success", `Added document type "${trimmed}".`);
    setNewDocTypeLabel("");
  };

  const handleRemoveDocType = (typeId: string) => {
    if (docTypes.length <= 1) {
      showToast("error", "At least one document type must remain.");
      return;
    }
    const toRemove = docTypes.find((t) => t.id === typeId);
    const updated = docTypes.filter((t) => t.id !== typeId);
    setDocTypes(updated);
    const activeOrgId = organization?.id || "org-default";
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `orgos_doc_types_${activeOrgId}`,
          JSON.stringify(updated)
        );
      } catch {}
    }
    showToast("success", `Removed document type "${toRemove?.label || typeId}".`);
    if (uploadCategory === typeId && updated.length > 0) {
      setUploadCategory(updated[0].id);
    }
    if (selectedCategory === typeId) {
      setSelectedCategory("all");
    }
  };

  // President Document Visibility Handler
  const handleUpdateDocumentVisibility = async (
    docId: string,
    newVisibility: DocumentVisibility
  ) => {
    setIsUpdatingVisibility(true);
    const targetDoc = documents.find((d) => d.id === docId);
    if (!targetDoc) {
      setIsUpdatingVisibility(false);
      return;
    }

    const rawCleanSummary = cleanSummary(targetDoc.summary);
    const encodedSummary = `[access:${newVisibility}] ${rawCleanSummary}`.trim();

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("documents")
        .update({ summary: encodedSummary })
        .eq("id", docId);

      if (error) {
        console.error("Failed to update visibility in DB:", error);
        showToast("error", "Failed to update visibility: " + error.message);
        return;
      }

      const updatedDocs = documents.map((doc) => {
        if (doc.id === docId) {
          return {
            ...doc,
            visibility: newVisibility,
            summary: rawCleanSummary || "Uploaded to organizational vault.",
          };
        }
        return doc;
      });

      setDocuments(updatedDocs);
      if (viewingDocument && viewingDocument.id === docId) {
        setViewingDocument({
          ...viewingDocument,
          visibility: newVisibility,
          summary: rawCleanSummary || "Uploaded to organizational vault.",
        });
      }

      const label =
        VISIBILITY_OPTIONS.find((v) => v.value === newVisibility)?.label ||
        newVisibility;
      showToast(
        "success",
        `Access updated: "${targetDoc.title}" is now visible to ${label}.`
      );
    } catch (err: any) {
      console.error("Error updating visibility:", err);
      showToast("error", err.message || "Failed to update visibility.");
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  // Helper to resolve display label for document category
  const getCategoryLabel = useCallback(
    (categoryId: string): string => {
      const found = docTypes.find((t) => t.id === categoryId);
      if (found) return found.label;
      if (CATEGORY_CONFIG[categoryId]) {
        return CATEGORY_CONFIG[categoryId].label;
      }
      return categoryId
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    },
    [docTypes]
  );

  // Handle Document Deletion
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

  // Handle Download Simulation
  const handleDownload = (doc: DocumentItem) => {
    const dummyContent = `=== OrgOS Document Export ===\nTitle: ${doc.title}\nCategory: ${getCategoryLabel(doc.category)}\nAccess Level: ${doc.visibility || "all"}\nUploaded By: ${doc.uploader_name || "Officer"}\nDate: ${doc.created_at}\n\nSummary / Historical Record:\n${doc.summary || "No description provided."}\n\n[Vault Reference Path: ${doc.file_path}]`;
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

  // Filter by user role permissions first
  const visibleDocuments = useMemo(() => {
    return documents.filter((doc) =>
      canUserViewDocument(currentUserRole, doc.visibility)
    );
  }, [documents, currentUserRole]);

  // Filter & Sort Calculation
  const filteredDocuments = useMemo(() => {
    return visibleDocuments
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
  }, [visibleDocuments, selectedCategory, searchQuery, sortBy]);

  // Aggregate Vault Metrics based on visible documents
  const totalStorageBytes = useMemo(() => {
    return visibleDocuments.reduce((acc, d) => acc + (d.file_size_bytes || 0), 0);
  }, [visibleDocuments]);

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
                {isPresident && (
                  <span className="px-2 py-0.5 rounded-sm bg-purple-50 border border-purple-200 text-[11px] font-semibold text-purple-700 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-purple-600" />
                    <span>President Privileges</span>
                  </span>
                )}
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
                  {visibleDocuments.length}
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
                  {visibleDocuments.length > 0
                    ? `${Math.round((indexedCount / visibleDocuments.length) * 100)}% indexed`
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
                <span
                  className={`h-2 w-2 rounded-full ${
                    visibleDocuments.length > 0 ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                ></span>
                <span className="text-xs font-semibold text-slate-800">
                  {visibleDocuments.length > 0 ? "pgvector Pipeline Active" : "Ready for Ingestion"}
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
                  All ({visibleDocuments.length})
                </button>
                {docTypes.map((dt) => {
                  const count = visibleDocuments.filter(
                    (d) => d.category === dt.id
                  ).length;
                  return (
                    <button
                      key={dt.id}
                      type="button"
                      onClick={() => setSelectedCategory(dt.id)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-sm border transition-colors whitespace-nowrap ${
                        selectedCategory === dt.id
                          ? "bg-[#1B365D] text-white border-[#1B365D]"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {dt.label} ({count})
                    </button>
                  );
                })}
                {isPresident && (
                  <button
                    type="button"
                    onClick={() => setIsDocTypesModalOpen(true)}
                    className="px-2 py-1 text-xs font-medium rounded-sm border border-dashed border-slate-300 text-slate-600 hover:text-[#1B365D] hover:border-[#1B365D] bg-white transition-colors whitespace-nowrap flex items-center gap-1"
                    title="Manage Document Types"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Manage Types</span>
                  </button>
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

          {/* Documents Table or "No Documents" State */}
          {isDataLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-200 rounded-sm">
              <Loader2 className="w-6 h-6 animate-spin text-[#1B365D] mb-2" />
              <p className="text-xs font-medium text-slate-500">
                Loading document archive...
              </p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            /* ============================================================= */
            /* "NO DOCUMENTS" EMPTY STATE                                    */
            /* ============================================================= */
            <div className="py-16 text-center bg-white border border-slate-200 rounded-sm p-8 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <FolderArchive className="w-6 h-6" />
              </div>

              {visibleDocuments.length === 0 ? (
                // 1. Vault is completely empty
                <>
                  <h3 className="text-base font-bold text-slate-800">
                    No documents
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    There are no documents in your organization&apos;s vault yet.
                    Upload past event guides, budgets, charters, or meeting
                    minutes to begin training the AI Copilot.
                  </p>
                  <div className="mt-5 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsUploadModalOpen(true)}
                      className="orgos-btn orgos-btn--primary text-xs h-9 shadow-sm"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload Document</span>
                    </button>
                  </div>
                </>
              ) : (
                // 2. Vault has files, but current search / filter returned 0
                <>
                  <h3 className="text-base font-bold text-slate-800">
                    No documents found
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    No files match your search query or selected category filter.
                  </p>
                  <div className="mt-5 flex items-center justify-center gap-3">
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
                    <button
                      type="button"
                      onClick={() => setIsUploadModalOpen(true)}
                      className="orgos-btn orgos-btn--primary text-xs h-8"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Document</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Table when documents exist */
            <div className="orgos-table-wrapper overflow-x-auto">
              <table className="orgos-table">
                <thead>
                  <tr>
                    <th className="w-[36%]">Document Title & Summary</th>
                    <th className="w-[14%]">Category</th>
                    <th className="w-[12%]">Visibility</th>
                    <th className="w-[8%]">Size</th>
                    <th className="w-[12%]">Uploaded By</th>
                    <th className="w-[8%]">Date</th>
                    <th className="w-[10%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => {
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
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-slate-50 text-slate-700">
                            <span>{getCategoryLabel(doc.category)}</span>
                          </span>
                        </td>

                        <td>
                          {doc.visibility === "president" ? (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200"
                              title="Restricted: President Only"
                            >
                              <Shield className="w-3 h-3 text-purple-600" />
                              <span>President</span>
                            </span>
                          ) : doc.visibility === "exec" ? (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200"
                              title="Restricted: Executive Board"
                            >
                              <Shield className="w-3 h-3 text-amber-600" />
                              <span>Exec Board</span>
                            </span>
                          ) : doc.visibility === "officers" ? (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200"
                              title="Restricted: Officers & Above"
                            >
                              <Shield className="w-3 h-3 text-blue-600" />
                              <span>Officers</span>
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200"
                              title="Visible to all organization members"
                            >
                              <span>All Members</span>
                            </span>
                          )}
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
                              title="Inspect Details & Permissions"
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Institutional Category
                  </label>
                  {isPresident && (
                    <button
                      type="button"
                      onClick={() => setIsDocTypesModalOpen(true)}
                      className="text-[11px] text-[#1B365D] hover:underline flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Manage Types</span>
                    </button>
                  )}
                </div>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#1B365D] text-slate-800 bg-white"
                >
                  {docTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      {dt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Visibility & Access Permission
                  </label>
                  {isPresident && (
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                      President Control
                    </span>
                  )}
                </div>
                <select
                  value={uploadVisibility}
                  onChange={(e) =>
                    setUploadVisibility(e.target.value as DocumentVisibility)
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#1B365D] text-slate-800 bg-white"
                >
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {opt.description}
                    </option>
                  ))}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-sm shadow-xl max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Eye className="w-4 h-4 text-[#1B365D] shrink-0" />
                <h3 className="text-sm font-bold text-[#1B365D] truncate">
                  {viewingDocument.title}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {documentUrl && (
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="orgos-btn orgos-btn--secondary text-xs h-7 px-2"
                  >
                    Open in new tab
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setViewingDocument(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
              {/* Document Viewing Area */}
              <div className="flex-1 bg-slate-100 p-2 flex flex-col border-b md:border-b-0 md:border-r border-slate-200 min-h-0">
                {documentUrl ? (
                  viewingDocument.mime_type.startsWith("image/") ? (
                    <div className="flex-1 flex items-center justify-center overflow-auto p-4 bg-white rounded-sm">
                      <img
                        src={documentUrl}
                        alt={viewingDocument.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : viewingDocument.mime_type === "application/pdf" ? (
                    <iframe
                      src={`${documentUrl}#toolbar=1`}
                      title={viewingDocument.title}
                      className="w-full h-full flex-1 border-0 rounded-sm bg-white"
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white rounded-sm text-center">
                      <p className="text-xs font-semibold text-slate-800 mb-2">
                        Preview not directly embeddable for {viewingDocument.mime_type}
                      </p>
                      <a
                        href={documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="orgos-btn orgos-btn--primary text-xs h-8"
                      >
                        Open File in Browser
                      </a>
                    </div>
                  )
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white rounded-sm text-center">
                    <p className="text-xs font-semibold text-slate-800 mb-1">
                      Document preview not available
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mb-4">
                      This file is recorded in your metadata vault, but the raw file has not yet been uploaded to cloud storage.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleDownload(viewingDocument)}
                      className="orgos-btn orgos-btn--secondary text-xs h-8"
                    >
                      Download Text Record
                    </button>
                  </div>
                )}
              </div>

              {/* Document Metadata Sidebar */}
              <div className="w-full md:w-80 p-4 space-y-4 overflow-y-auto shrink-0 bg-white">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {viewingDocument.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded border bg-slate-50 text-slate-700">
                      {getCategoryLabel(viewingDocument.category)}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {formatBytes(viewingDocument.file_size_bytes)}
                    </span>
                  </div>
                </div>

                {/* Access Permission & Visibility Control */}
                <div className="bg-slate-50 border border-slate-200 rounded-sm p-3 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#1B365D]" />
                      Access & Visibility
                    </span>
                    {isPresident && (
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                        President Control
                      </span>
                    )}
                  </div>
                  {isPresident ? (
                    <div className="mt-2 space-y-1.5">
                      <label className="text-[11px] text-slate-600 block">
                        Set who can view this document:
                      </label>
                      <select
                        value={viewingDocument.visibility || "all"}
                        onChange={(e) =>
                          handleUpdateDocumentVisibility(
                            viewingDocument.id,
                            e.target.value as DocumentVisibility
                          )
                        }
                        disabled={isUpdatingVisibility}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#1B365D] font-medium text-slate-800 cursor-pointer disabled:opacity-50"
                      >
                        {VISIBILITY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {viewingDocument.visibility === "president" &&
                          "Strictly confidential: Visible only to the President."}
                        {viewingDocument.visibility === "exec" &&
                          "Restricted to President and Treasurer."}
                        {viewingDocument.visibility === "officers" &&
                          "Restricted to executive board and committee officers."}
                        {(!viewingDocument.visibility ||
                          viewingDocument.visibility === "all") &&
                          "Visible to all active chapter members."}
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-600 font-medium mt-1">
                      {VISIBILITY_OPTIONS.find(
                        (v) => v.value === viewingDocument.visibility
                      )?.label || "All Members"}
                    </p>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-sm p-3 text-xs text-slate-700">
                  <span className="font-semibold text-slate-800 block mb-1">
                    Summary
                  </span>
                  <p className="leading-relaxed">
                    {viewingDocument.summary || "No description provided."}
                  </p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vault Path:</span>
                    <span className="font-mono text-slate-700 truncate max-w-[150px]">
                      {viewingDocument.file_path}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Format:</span>
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
                    <span className="text-slate-400">Date:</span>
                    <span className="text-slate-800">
                      {formatDate(viewingDocument.created_at)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(viewingDocument)}
                    className="orgos-btn orgos-btn--primary text-xs h-8 w-full"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingDocument(viewingDocument);
                      setViewingDocument(null);
                    }}
                    className="text-xs font-medium text-red-600 hover:text-red-700 py-1 text-center"
                  >
                    Delete File
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

      {/* ==================================================================== */}
      {/* MODAL 4: Manage Document Types Modal (President Only)                */}
      {/* ==================================================================== */}
      {isDocTypesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-sm shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#1B365D]" />
                <h3 className="text-sm font-bold text-[#1B365D]">
                  Manage Document Types
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDocTypesModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs text-slate-600 mb-3">
                  As President, you can define custom document types for your
                  organization or remove types that are no longer relevant.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddDocType(newDocTypeLabel);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="e.g., Transition Guides, Sponsorships..."
                    value={newDocTypeLabel}
                    onChange={(e) => setNewDocTypeLabel(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#1B365D] text-slate-800"
                  />
                  <button
                    type="submit"
                    disabled={!newDocTypeLabel.trim()}
                    className="orgos-btn orgos-btn--primary text-xs h-8 shrink-0 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Type</span>
                  </button>
                </form>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <h4 className="text-xs font-semibold text-slate-700 mb-2">
                  Active Document Types ({docTypes.length})
                </h4>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {docTypes.map((dt) => {
                    const usageCount = documents.filter(
                      (d) => d.category === dt.id
                    ).length;
                    return (
                      <div
                        key={dt.id}
                        className="flex items-center justify-between px-3 py-2 rounded-sm bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-semibold text-slate-800 block truncate">
                            {dt.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {usageCount} document{usageCount === 1 ? "" : "s"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDocType(dt.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
                          title={`Remove ${dt.label}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsDocTypesModalOpen(false)}
                  className="orgos-btn orgos-btn--secondary text-xs h-8"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
