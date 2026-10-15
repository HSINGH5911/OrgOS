"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  Lock,
  Layers,
  Users,
  Check,
  X,
  ExternalLink,
  Info,
  Sparkles,
  Building2,
  GraduationCap,
  Loader2,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import UserDropdown from "@/components/UserDropdown";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  ALL_PERMISSIONS,
  BUILTIN_ROLES,
  RoleDefinition,
  PermissionId,
  BaseRoleTier,
  getRolesForOrg,
  saveCustomRoleForOrg,
  deleteCustomRoleForOrg,
} from "@/lib/roles";

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

const COLOR_PRESETS = [
  { label: "Navy", value: "#1B365D", badge: "primary" as const },
  { label: "Emerald", value: "#0F9D58", badge: "success" as const },
  { label: "Amber", value: "#D97706", badge: "warning" as const },
  { label: "Purple", value: "#7C3AED", badge: "neutral" as const },
  { label: "Blue", value: "#2563EB", badge: "primary" as const },
  { label: "Crimson", value: "#DC2626", badge: "danger" as const },
];

export default function RolesPage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Organization context & current user's role
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("member");

  // Roles list
  const [roles, setRoles] = useState<RoleDefinition[]>(BUILTIN_ROLES);
  const [activeTab, setActiveTab] = useState<"cards" | "matrix">("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "builtin" | "custom">("all");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [deletingRole, setDeletingRole] = useState<RoleDefinition | null>(null);

  // Add/Edit Role Form State
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formOverview, setFormOverview] = useState("");
  const [formBaseTier, setFormBaseTier] = useState<BaseRoleTier>("officer");
  const [formColor, setFormColor] = useState("#1B365D");
  const [formPermissions, setFormPermissions] = useState<PermissionId[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Notification Toast
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load user & organization
  const loadOrgContext = useCallback(async (activeUser: SupabaseUser) => {
    try {
      const supabase = createClient();
      const { data: myMembership } = await supabase
        .from("org_memberships")
        .select(`
          role,
          title,
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

      let activeOrg: Organization | null = null;
      if (myMembership && myMembership.organizations) {
        const rawOrg = Array.isArray(myMembership.organizations)
          ? myMembership.organizations[0]
          : myMembership.organizations;
        activeOrg = rawOrg as Organization;
        setOrganization(activeOrg);
        setCurrentUserRole(myMembership.role || "member");
      } else {
        const meta = activeUser.user_metadata || {};
        activeOrg = {
          id: "local-org",
          name: meta.organization || "Student Organization",
          slug: (meta.organization || "student-org").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          university: meta.university || "Collegiate Campus",
        };
        setOrganization(activeOrg);
        setCurrentUserRole(meta.role || "president");
      }

      // Load all roles for this organization
      const loadedRoles = getRolesForOrg(activeOrg.id);
      setRoles(loadedRoles);
    } catch (err) {
      console.error("Error loading organization roles:", err);
      setRoles(getRolesForOrg());
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!isMounted) return;
      setUser(user);
      setIsAuthLoading(false);
      if (user) {
        loadOrgContext(user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
      if (session?.user) {
        loadOrgContext(session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadOrgContext]);

  // Reload roles from storage
  const refreshRoles = useCallback(() => {
    const orgId = organization?.id || "local-org";
    setRoles(getRolesForOrg(orgId));
  }, [organization?.id]);

  // Is current user allowed to edit roles
  const canManageRoles = useMemo(() => {
    return ["president", "treasurer", "officer"].includes(currentUserRole.toLowerCase());
  }, [currentUserRole]);

  // Filtered Roles
  const filteredRoles = useMemo(() => {
    return roles.filter((r) => {
      const matchesSearch =
        searchQuery === "" ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.overview.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "builtin" && !r.isCustom) ||
        (typeFilter === "custom" && r.isCustom);

      return matchesSearch && matchesType;
    });
  }, [roles, searchQuery, typeFilter]);

  // Open Add Role Modal
  const handleOpenAdd = () => {
    setEditingRole(null);
    setFormName("");
    setFormSlug("");
    setFormOverview("");
    setFormBaseTier("officer");
    setFormColor("#1B365D");
    setFormPermissions([
      "members_view",
      "events_view",
      "events_manage",
      "docs_view",
      "docs_upload",
      "copilot_query",
    ]);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Role Modal
  const handleOpenEdit = (role: RoleDefinition) => {
    if (role.id === "president") {
      showNotification("error", "The President role is the primary chapter authority and cannot be modified.");
      return;
    }
    setEditingRole(role);
    setFormName(role.name);
    setFormSlug(role.id);
    setFormOverview(role.overview);
    setFormBaseTier(role.baseTier);
    setFormColor(role.color || "#1B365D");
    setFormPermissions([...role.permissions]);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Auto-generate slug from name if adding
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormName(val);
    if (!editingRole) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      setFormSlug(generated);
    }
  };

  // Toggle permission in form
  const handleTogglePermission = (permId: PermissionId) => {
    setFormPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  // Select / Deselect all permissions in a category
  const handleToggleCategory = (perms: PermissionId[]) => {
    const allSelected = perms.every((p) => formPermissions.includes(p));
    if (allSelected) {
      setFormPermissions((prev) => prev.filter((p) => !perms.includes(p)));
    } else {
      setFormPermissions((prev) => Array.from(new Set([...prev, ...perms])));
    }
  };

  // Save Role
  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const nameTrimmed = formName.trim();
    const slugTrimmed = formSlug.trim().toLowerCase();

    if (!nameTrimmed) {
      setFormError("Please provide a valid role name.");
      return;
    }

    if (!slugTrimmed) {
      setFormError("Please provide a valid role identifier / slug.");
      return;
    }

    if (slugTrimmed === "president" || editingRole?.id === "president") {
      setFormError("The President role cannot be modified.");
      return;
    }

    // Check slug collision with built-in roles if adding
    if (!editingRole) {
      const exists = roles.some((r) => r.id === slugTrimmed);
      if (exists) {
        setFormError(`A role with identifier "${slugTrimmed}" already exists.`);
        return;
      }
    }

    if (!formOverview.trim()) {
      setFormError("Please enter an overview description for this role.");
      return;
    }

    if (formPermissions.length === 0) {
      setFormError("Please grant at least one permission to this role.");
      return;
    }

    const matchedPreset = COLOR_PRESETS.find((c) => c.value === formColor);
    const badgeVariant = matchedPreset ? matchedPreset.badge : "primary";

    const newRole: RoleDefinition = {
      id: slugTrimmed,
      name: nameTrimmed,
      overview: formOverview.trim(),
      baseTier: formBaseTier,
      isCustom: editingRole ? editingRole.isCustom : true,
      color: formColor,
      badgeVariant,
      permissions: formPermissions,
      createdAt: editingRole?.createdAt || new Date().toISOString(),
    };

    const orgId = organization?.id || "local-org";
    saveCustomRoleForOrg(orgId, newRole);
    refreshRoles();

    setIsAddModalOpen(false);
    showNotification(
      "success",
      editingRole
        ? `Updated role "${nameTrimmed}". Changes will reflect in roster assignment.`
        : `Created custom role "${nameTrimmed}". It is now ready for member assignment!`
    );
  };

  // Confirm delete role
  const handleDeleteRole = () => {
    if (!deletingRole) return;
    if (deletingRole.id === "president") {
      showNotification("error", "The President role cannot be deleted.");
      setDeletingRole(null);
      return;
    }
    const orgId = organization?.id || "local-org";
    deleteCustomRoleForOrg(orgId, deletingRole.id);
    refreshRoles();
    showNotification("success", `Role "${deletingRole.name}" has been deleted.`);
    setDeletingRole(null);
  };

  // Group permissions by category for rendering
  const permissionsByCategory = useMemo(() => {
    const map = new Map<string, typeof ALL_PERMISSIONS>();
    ALL_PERMISSIONS.forEach((p) => {
      const current = map.get(p.category) || [];
      current.push(p);
      map.set(p.category, current);
    });
    return Array.from(map.entries());
  }, []);

  return (
    <div className="min-h-screen bg-[var(--orgos-bg-app)] text-[var(--orgos-text-primary)] selection:bg-[#1B365D] selection:text-white flex">
      {/* 1. Left Sidebar */}
      {user && (
        <Sidebar
          items={navigationItems}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      )}

      {/* 2. Main Content View */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          user ? (isSidebarCollapsed ? "pl-16" : "pl-64") : "pl-0"
        }`}
      >
        {/* Topbar Navigation */}
        <header className="orgos-topbar sticky top-0 z-30">
          <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-sm bg-[#1B365D] flex items-center justify-center font-bold text-sm text-white shadow-sm">
                O
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-[#1B365D]">OrgOS</span>
                <span className="orgos-badge orgos-badge--primary hidden sm:inline-flex">
                  Operations Platform
                </span>
                <span className="text-slate-300 hidden sm:inline">/</span>
                <span className="text-xs font-semibold text-slate-700 hidden sm:inline truncate max-w-[200px]">
                  {organization?.name || "Collegiate Chapter"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-slate-100 border border-slate-200 text-xs text-slate-600">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate max-w-[180px]">
                  {organization?.university || "Collegiate Campus"}
                </span>
              </div>
              <UserDropdown />
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 max-w-[1400px] mx-auto w-full p-4 md:p-6 lg:p-8 space-y-6">
          {/* Notification Toast */}
          {notification && (
            <div
              className={`p-3.5 rounded-sm border flex items-center gap-3 text-xs font-medium animate-in fade-in slide-in-from-top duration-200 ${
                notification.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {notification.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="flex-1">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Header Action Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="orgos-title-h1">Role &amp; Permission Management</h1>
                <span className="orgos-badge orgos-badge--primary">
                  {roles.length} Configured
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                Define organizational access tiers, assign granular operational rights, and establish executive
                board responsibilities for <strong>{organization?.name || "your chapter"}</strong>.
                Custom roles automatically show up in member assignment.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/members"
                className="orgos-btn orgos-btn--secondary text-xs"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Go to Member Roster</span>
              </Link>
              {canManageRoles && (
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="orgos-btn orgos-btn--primary text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Role</span>
                </button>
              )}
            </div>
          </div>

          {/* Operational Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-xs">
              <span className="orgos-meta-label">Total System Roles</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-slate-900">{roles.length}</span>
                <span className="text-[11px] text-slate-500">
                  ({roles.filter((r) => r.isCustom).length} custom)
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-xs">
              <span className="orgos-meta-label">Executive Tiers</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-[#1B365D]">3</span>
                <span className="text-[11px] text-slate-500">Admin Authority</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-xs">
              <span className="orgos-meta-label">Granular Permissions</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-slate-900">{ALL_PERMISSIONS.length}</span>
                <span className="text-[11px] text-[#0F9D58] font-semibold">Security Matrix</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-xs">
              <span className="orgos-meta-label">Tenancy Isolation</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xs font-semibold text-[#0F9D58] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  RLS Enforced
                </span>
              </div>
            </div>
          </div>

          {/* View Toggles & Search Controls */}
          <div className="bg-white border border-slate-200 rounded-sm p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* View Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-sm border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("cards")}
                className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === "cards"
                    ? "bg-white text-[#1B365D] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Role Overviews ({filteredRoles.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("matrix")}
                className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === "matrix"
                    ? "bg-white text-[#1B365D] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Permission Matrix ({ALL_PERMISSIONS.length} Capabilities)</span>
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-1 md:max-w-md justify-end">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search role name, slug, overview..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 focus:outline-none focus:border-[#1B365D]"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-sm px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#1B365D]"
              >
                <option value="all">All Types</option>
                <option value="builtin">System Built-in</option>
                <option value="custom">Chapter Custom</option>
              </select>
            </div>
          </div>

          {/* TAB 1: Roles Directory & Detailed Cards */}
          {activeTab === "cards" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRoles.map((role) => {
                  const permCount = role.permissions.length;
                  const totalPerms = ALL_PERMISSIONS.length;
                  const percent = Math.round((permCount / totalPerms) * 100);

                  return (
                    <div
                      key={role.id}
                      className="bg-white border border-slate-200 rounded-sm p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between"
                    >
                      <div>
                        {/* Role Header */}
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="h-8 w-8 rounded-sm flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0"
                              style={{ backgroundColor: role.color }}
                            >
                              <Shield className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="font-bold text-sm text-slate-900 leading-snug">
                                {role.name}
                              </h3>
                              <span className="orgos-mono text-[11px] text-slate-500 block">
                                id: {role.id}
                              </span>
                            </div>
                          </div>

                          {role.id === "president" ? (
                            <span className="orgos-badge orgos-badge--primary flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              Protected
                            </span>
                          ) : role.isCustom ? (
                            <span className="orgos-badge orgos-badge--warning">Custom</span>
                          ) : (
                            <span className="orgos-badge orgos-badge--neutral">System</span>
                          )}
                        </div>

                        {/* Base Tier & Access Indicator */}
                        <div className="flex items-center gap-2 my-2.5 text-xs">
                          <span className="text-slate-500">DB Security Tier:</span>
                          <span className="font-mono text-[11px] font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded-xs border border-slate-200">
                            {role.baseTier}
                          </span>
                        </div>

                        {/* Overview Description */}
                        <div className="bg-slate-50 border border-slate-200 rounded-sm p-3 mb-3.5">
                          <span className="orgos-meta-label text-slate-500 block mb-1">
                            Role Overview &amp; Duties
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">
                            {role.overview}
                          </p>
                        </div>

                       

                        {/* Permission Sample Pills */}
                        <div className="space-y-1 mb-4">
                          <span className="orgos-meta-label text-slate-500 block">Key Authorities:</span>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.slice(0, 4).map((pId) => {
                              const permDef = ALL_PERMISSIONS.find((p) => p.id === pId);
                              return (
                                <span
                                  key={pId}
                                  className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-xs border border-slate-200 font-medium truncate max-w-[170px]"
                                >
                                  {permDef?.name || pId}
                                </span>
                              );
                            })}
                            {permCount > 4 && (
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-xs border border-slate-200">
                                +{permCount - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab("matrix")}
                          className="text-xs text-[#1B365D] hover:underline font-semibold"
                        >
                          View in Matrix →
                        </button>

                        <div className="flex items-center gap-1.5">
                          {role.id !== "president" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(role)}
                                className="p-1.5 rounded-sm hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
                                title="Edit Role"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingRole(role)}
                                className="p-1.5 rounded-sm hover:bg-red-50 text-red-600 border border-red-200 transition-colors"
                                title="Delete Role"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <span
                              className="text-[11px] text-slate-400 font-mono px-2 py-1 flex items-center gap-1 border border-slate-200 rounded-sm bg-slate-50"
                              title="Primary executive role cannot be edited or deleted"
                            >
                              <Lock className="w-3 h-3 text-slate-400" />
                              Protected
                            </span>
                          )}
                          <Link
                            href={`/members`}
                            className="orgos-btn orgos-btn--secondary text-[11px] px-2 py-1"
                            title="Assign to members in roster"
                          >
                            <span>Assign</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredRoles.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-sm p-12 text-center text-slate-500">
                  <Shield className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold">No roles matched your search.</p>
                  <p className="text-[11px] mt-1 text-slate-400">
                    Try adjusting your search criteria or create a new custom role.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Comprehensive Permission Matrix (Grid) */}
          {activeTab === "matrix" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-sm shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="orgos-title-h2">Chapter Permission Matrix</h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Operational capability mapping across system built-in and chapter-customized roles.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-[#0F9D58] font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Granted
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                      <span className="text-slate-300 font-bold">—</span>
                      Restricted
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-3 font-semibold text-slate-700 min-w-[260px] sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                          System Capability / Permission
                        </th>
                        {roles.map((role) => (
                          <th
                            key={role.id}
                            className="p-3 font-semibold text-slate-900 text-center min-w-[130px] border-r border-slate-200 last:border-r-0"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: role.color }}
                              />
                              <span className="truncate max-w-[120px] font-bold">{role.name}</span>
                              <span className="orgos-mono text-[10px] text-slate-500">
                                {role.isCustom ? "Custom" : "System"}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {permissionsByCategory.map(([category, perms]) => (
                        <React.Fragment key={category}>
                          {/* Category Header Row */}
                          <tr className="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-800 text-[11px]">
                            <td
                              colSpan={roles.length + 1}
                              className="px-3 py-1.5 tracking-wider uppercase text-slate-600 bg-slate-100"
                            >
                              {category}
                            </td>
                          </tr>

                          {/* Permission Rows */}
                          {perms.map((perm) => (
                            <tr
                              key={perm.id}
                              className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
                            >
                              <td className="p-3 sticky left-0 bg-white z-10 border-r border-slate-200">
                                <div className="font-semibold text-slate-900">{perm.name}</div>
                                <div className="text-[11px] text-slate-500 leading-snug">
                                  {perm.description}
                                </div>
                              </td>

                              {roles.map((role) => {
                                const hasPerm = role.permissions.includes(perm.id);
                                return (
                                  <td
                                    key={role.id}
                                    className="p-3 text-center border-r border-slate-200 last:border-r-0 align-middle"
                                  >
                                    {hasPerm ? (
                                      <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-50 text-emerald-600">
                                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                      </div>
                                    ) : (
                                      <span className="text-slate-300 font-bold">—</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Informational Callout */}
              <div className="orgos-grounding-box flex items-start gap-3">
                <Info className="w-4 h-4 text-[#1B365D] shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <strong>Row-Level Security &amp; Custom Role Storage:</strong> Custom roles inherit their
                  database protection tier from Supabase PostgreSQL (e.g. <code>officer</code> or{" "}
                  <code>member</code>) while maintaining unique chapter permissions, titles, and executive
                  oversight in OrgOS.
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 3. Add / Edit Custom Role Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white border border-slate-300 rounded-sm shadow-xl p-6 text-slate-900 my-8 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-sm bg-[#EBF1F8] text-[#1B365D] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {editingRole ? `Edit Role: ${editingRole.name}` : "Create New Custom Chapter Role"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Custom roles immediately show up when assigning titles in the member roster.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Scrollable Form */}
            <form onSubmit={handleSaveRole} className="flex-1 overflow-y-auto py-4 space-y-4">
              {formError && (
                <div className="p-2.5 rounded-sm bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Role Name & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="orgos-meta-label text-slate-700 block mb-1">
                    Role Display Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={handleNameChange}
                    placeholder="e.g. VP of Public Relations, Webmaster"
                    className="w-full bg-slate-50 border border-slate-300 rounded-sm px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#1B365D]"
                    required
                  />
                </div>

                <div>
                  <label className="orgos-meta-label text-slate-700 block mb-1">
                    Unique Identifier / Slug <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    disabled={!!editingRole}
                    placeholder="e.g. vp_pr, webmaster"
                    className="w-full bg-slate-50 border border-slate-300 rounded-sm px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#1B365D] disabled:bg-slate-100 disabled:text-slate-500 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Overview & Scope */}
              <div>
                <label className="orgos-meta-label text-slate-700 block mb-1">
                  Role Overview &amp; Duties <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={formOverview}
                  onChange={(e) => setFormOverview(e.target.value)}
                  rows={3}
                  placeholder="Detail the operational scope, responsibilities, reporting lines, and primary tasks for this role..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-sm px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#1B365D] leading-relaxed"
                  required
                />
              </div>

              {/* Base Tier & Color */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="orgos-meta-label text-slate-700 block mb-1">
                    Underlying Database Tier
                  </label>
                  <select
                    value={formBaseTier}
                    onChange={(e) => setFormBaseTier(e.target.value as BaseRoleTier)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-sm px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#1B365D]"
                  >
                    <option value="officer">Officer (Executive Board access)</option>
                    <option value="event_lead">Event Lead (Check-in &amp; Scheduling)</option>
                    <option value="member">Member (Standard general body access)</option>
                    <option value="treasurer">Treasurer (Ledger &amp; Financial access)</option>
                    <option value="president">President (Full Administrative access)</option>
                  </select>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Maps to Supabase PostgreSQL Row-Level Security policies.
                  </span>
                </div>

                <div>
                  <label className="orgos-meta-label text-slate-700 block mb-1">
                    Role Theme &amp; Badge Accent
                  </label>
                  <div className="flex items-center gap-2 mt-1.5">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setFormColor(c.value)}
                        className={`h-7 w-7 rounded-sm border flex items-center justify-center transition-all ${
                          formColor === c.value
                            ? "ring-2 ring-offset-1 ring-[#1B365D] border-white"
                            : "border-slate-300 hover:scale-105"
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      >
                        {formColor === c.value && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Granular Permissions Checklist */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="orgos-meta-label text-slate-800 block">
                      Granular Permission Privileges ({formPermissions.length} Granted)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Check each operational capability granted to this role.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setFormPermissions(ALL_PERMISSIONS.map((p) => p.id))}
                      className="text-[#1B365D] hover:underline font-semibold"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setFormPermissions([])}
                      className="text-slate-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto p-1">
                  {permissionsByCategory.map(([category, perms]) => {
                    const categoryPermIds = perms.map((p) => p.id);
                    const isAllChecked = categoryPermIds.every((id) =>
                      formPermissions.includes(id)
                    );

                    return (
                      <div
                        key={category}
                        className="bg-slate-50 border border-slate-200 rounded-sm p-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
                          <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                            {category}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleCategory(categoryPermIds)}
                            className="text-[11px] text-[#1B365D] hover:underline"
                          >
                            {isAllChecked ? "Deselect Group" : "Select Group"}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {perms.map((p) => {
                            const isChecked = formPermissions.includes(p.id);
                            return (
                              <label
                                key={p.id}
                                className={`flex items-start gap-2 p-2 rounded-sm border cursor-pointer transition-colors ${
                                  isChecked
                                    ? "bg-white border-[#1B365D]/30 shadow-xs"
                                    : "bg-slate-100/60 border-slate-200 opacity-80"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(p.id)}
                                  className="mt-0.5 h-3.5 w-3.5 rounded-xs border-slate-300 text-[#1B365D] focus:ring-[#1B365D]"
                                />
                                <div>
                                  <div className="text-xs font-semibold text-slate-900 leading-tight">
                                    {p.name}
                                  </div>
                                  <div className="text-[10px] text-slate-500 leading-snug mt-0.5">
                                    {p.description}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-200 shrink-0">
                {editingRole && editingRole.id !== "president" ? (
                  <button 
                    type="button"
                    onClick={() => {
                      const roleToDelete = editingRole;
                      setIsAddModalOpen(false);
                      setDeletingRole(roleToDelete);
                    }}
                    className="orgos-btn orgos-btn--danger text-xs flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Role</span>
                  </button>
                ) : (
                  <div /> 
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="orgos-btn orgos-btn--secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="orgos-btn orgos-btn--primary">
                    {editingRole ? "Save Role Updates" : "Create & Register Role"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Delete Role Confirmation Modal */}
      {deletingRole && deletingRole.id !== "president" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setDeletingRole(null)}
        >
          <div
            className="w-full max-w-sm bg-white border border-slate-300 rounded-sm shadow-xl p-6 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <Trash2 className="w-5 h-5" />
              <h3 className="font-bold text-sm">Delete Role: {deletingRole.name}</h3>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to remove the role <strong>{deletingRole.name}</strong>? Any
              members currently assigned this role will retain standard privileges based on their underlying
              tier ({deletingRole.baseTier}).
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingRole(null)}
                className="orgos-btn orgos-btn--secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRole}
                className="orgos-btn orgos-btn--danger"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}