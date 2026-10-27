"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  UserPlus,
  Download,
  ShieldCheck,
  Building2,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit3,
  Trash2,
  Copy,
  Check,
  X,
  User,
  Shield,
  Clock,
  Sparkles,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import UserDropdown from "@/components/UserDropdown";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  getRolesForOrg,
  resolveMemberRole,
  RoleDefinition,
  BUILTIN_ROLES,
} from "@/lib/roles";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
}

interface MemberRecord {
  id: string;
  org_id: string;
  user_id: string;
  role: "president" | "treasurer" | "event_lead" | "officer" | "member";
  title: string | null;
  is_active: boolean;
  joined_at: string;
  profiles: Profile | null;
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

export default function MembersPage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Organization & Roster Data
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("member");
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [availableRoles, setAvailableRoles] = useState<RoleDefinition[]>(BUILTIN_ROLES);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Feedback notifications
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modals State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  const [editingMember, setEditingMember] = useState<MemberRecord | null>(null);
  const [editRoleSelection, setEditRoleSelection] = useState<string>("member");
  const [editRole, setEditRole] = useState<MemberRecord["role"]>("member");
  const [editTitle, setEditTitle] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  const [deletingMember, setDeletingMember] = useState<MemberRecord | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const buildFallbackRoster = useCallback((currentUser: SupabaseUser, org: Organization) => {
    const meta = currentUser.user_metadata || {};
    const fallbackMember: MemberRecord = {
      id: "membership-self",
      org_id: org.id,
      user_id: currentUser.id,
      role: (meta.role as any) || "president",
      title: meta.role === "president" ? "President" : "Officer",
      is_active: true,
      joined_at: currentUser.created_at || new Date().toISOString(),
      profiles: {
        id: currentUser.id,
        full_name: meta.full_name || meta.name || currentUser.email?.split("@")[0] || "Officer",
        email: currentUser.email || "officer@studentorg.edu",
        avatar_url: null,
      },
    };
    setMembers([fallbackMember]);
  }, []);

  const loadOrganizationAndMembers = useCallback(async (activeUser: SupabaseUser) => {
    setIsDataLoading(true);
    try {
      const supabase = createClient();

      // Fetch user's membership to determine active organization
      const { data: myMembership, error: membershipError } = await supabase
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

      if (membershipError) {
        console.error("Error fetching user membership:", membershipError);
      }

      let activeOrg: Organization | null = null;
      if (myMembership && myMembership.organizations) {
        const rawOrg = Array.isArray(myMembership.organizations)
          ? myMembership.organizations[0]
          : myMembership.organizations;
        activeOrg = rawOrg as Organization;
        setOrganization(activeOrg);
        setCurrentUserRole(myMembership.role || "member");
      }

      if (activeOrg) {
        setAvailableRoles(getRolesForOrg(activeOrg.id));
        // Fetch all members belonging to this organization
        const { data: roster, error: rosterError } = await supabase
          .from("org_memberships")
          .select(`
            id,
            org_id,
            user_id,
            role,
            title,
            is_active,
            joined_at,
            profiles (
              id,
              full_name,
              email,
              avatar_url
            )
          `)
          .eq("org_id", activeOrg.id)
          .order("joined_at", { ascending: false });

        if (rosterError) {
          console.error("Error fetching roster:", rosterError);
        }

        if (roster && roster.length > 0) {
          // Flatten profiles if supabase returns array
          const parsedRoster: MemberRecord[] = roster.map((item: any) => ({
            ...item,
            profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
          }));
          setMembers(parsedRoster);
        } else {
          // If no roster rows yet, build fallback with current user
          buildFallbackRoster(activeUser, activeOrg);
        }
      } else {
        // No organization found in DB yet -> fallback from user metadata
        const meta = activeUser.user_metadata || {};
        const fallbackOrg: Organization = {
          id: "local-org",
          name: meta.organization || "Student Organization",
          slug: (meta.organization || "student-org").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          university: meta.university || "Collegiate Campus",
        };
        setOrganization(fallbackOrg);
        setCurrentUserRole(meta.role || "president");
        setAvailableRoles(getRolesForOrg(fallbackOrg.id));
        buildFallbackRoster(activeUser, fallbackOrg);
      }
    } catch (err) {
      console.error("Failed to load members:", err);
    } finally {
      setIsDataLoading(false);
    }
  }, [buildFallbackRoster]);

  // 1. Authenticate user & load organization context
  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!isMounted) return;
      setUser(user);
      setIsAuthLoading(false);

      if (user) {
        loadOrganizationAndMembers(user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
      if (session?.user) {
        loadOrganizationAndMembers(session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadOrganizationAndMembers]);

  // Determine if the logged-in user can manage members
  const isAdmin = useMemo(() => {
    return ["president", "treasurer", "officer"].includes(currentUserRole.toLowerCase());
  }, [currentUserRole]);

  // Filtered members calculation
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const name = member.profiles?.full_name?.toLowerCase() || "";
      const email = member.profiles?.email?.toLowerCase() || "";
      const title = (member.title || "").toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || name.includes(query) || email.includes(query) || title.includes(query);

      let matchesRole = true;
      if (roleFilter !== "all") {
        if (roleFilter.startsWith("custom:")) {
          const customId = roleFilter.replace("custom:", "");
          const resolved = resolveMemberRole(member, organization?.id);
          matchesRole = resolved.id === customId;
        } else {
          matchesRole = member.role === roleFilter;
        }
      }

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && member.is_active) ||
        (statusFilter === "inactive" && !member.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, searchQuery, roleFilter, statusFilter, organization?.id]);

  // Roster Statistics
  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m.is_active).length;
    const officers = members.filter((m) =>
      ["president", "treasurer", "officer", "event_lead"].includes(m.role)
    ).length;
    const regularMembers = members.filter((m) => m.role === "member").length;
    const activeRate = total > 0 ? Math.round((active / total) * 100) : 100;

    return { total, active, officers, regularMembers, activeRate };
  }, [members]);

  // Copy invitation link
  const handleCopyInviteLink = async () => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const inviteUrl = `${origin}/signup?org=${encodeURIComponent(organization?.slug || "org")}`;
      await navigator.clipboard.writeText(inviteUrl);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Export roster to CSV
  const handleExportCSV = () => {
    if (filteredMembers.length === 0) return;

    const headers = ["Full Name", "Email", "Role", "Title", "Status", "Joined Date"];
    const rows = filteredMembers.map((m) => [
      `"${m.profiles?.full_name || "Unknown"}"`,
      `"${m.profiles?.email || ""}"`,
      `"${m.role}"`,
      `"${m.title || ""}"`,
      m.is_active ? "Active" : "Inactive",
      `"${new Date(m.joined_at).toLocaleDateString()}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${organization?.slug || "org"}_members_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification("success", "Member roster exported to CSV successfully");
  };

  // Open edit modal
  const handleOpenEdit = (member: MemberRecord) => {
    // Refresh available roles in case custom roles were added
    const currentRoles = getRolesForOrg(organization?.id);
    setAvailableRoles(currentRoles);

    setEditingMember(member);
    const resolved = resolveMemberRole(member, organization?.id);
    if (resolved.isCustom) {
      setEditRoleSelection(`custom:${resolved.id}`);
      setEditRole(resolved.baseTier);
      setEditTitle(member.title || resolved.name);
    } else {
      setEditRoleSelection(member.role);
      setEditRole(member.role);
      setEditTitle(member.title || "");
    }
    setEditIsActive(member.is_active);
  };

  // Change role selection in edit modal
  const handleRoleSelectionChange = (newSelection: string) => {
    setEditRoleSelection(newSelection);
    if (newSelection.startsWith("custom:")) {
      const customId = newSelection.replace("custom:", "");
      const customRole = availableRoles.find((r) => r.id === customId);
      if (customRole) {
        setEditRole(customRole.baseTier);
        setEditTitle(customRole.name);
      }
    } else {
      setEditRole(newSelection as MemberRecord["role"]);
    }
  };

  // Submit edit member
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setIsSubmittingAction(true);
    try {
      const supabase = createClient();

      let effectiveRole = editRole;
      let effectiveTitle = editTitle.trim() || null;

      if (editRoleSelection.startsWith("custom:")) {
        const customId = editRoleSelection.replace("custom:", "");
        const customRole = availableRoles.find((r) => r.id === customId);
        if (customRole) {
          effectiveRole = customRole.baseTier;
          if (!effectiveTitle) {
            effectiveTitle = customRole.name;
          }
        }
      }

      const { error } = await supabase
        .from("org_memberships")
        .update({
          role: effectiveRole,
          title: effectiveTitle,
          is_active: editIsActive,
        })
        .eq("id", editingMember.id);

      if (error) throw error;

      // Optimistic update in state
      setMembers((prev) =>
        prev.map((m) =>
          m.id === editingMember.id
            ? { ...m, role: effectiveRole, title: effectiveTitle, is_active: editIsActive }
            : m
        )
      );

      showNotification("success", `Updated role and details for ${editingMember.profiles?.full_name || "member"}`);
      setEditingMember(null);
    } catch (err: any) {
      showNotification("error", err?.message || "Failed to update member.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Remove member
  const handleConfirmDelete = async () => {
    if (!deletingMember) return;

    setIsSubmittingAction(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("org_memberships")
        .delete()
        .eq("id", deletingMember.id);

      if (error) throw error;

      setMembers((prev) => prev.filter((m) => m.id !== deletingMember.id));
      showNotification("success", `Removed ${deletingMember.profiles?.full_name || "member"} from organization`);
      setDeletingMember(null);
    } catch (err: any) {
      showNotification("error", err?.message || "Failed to remove member.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Helper notification toast
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Helper role badge formatting
  const getRoleBadgeClasses = (r: string) => {
    switch (r) {
      case "president":
        return "orgos-badge--primary";
      case "treasurer":
      case "officer":
      case "event_lead":
        return "orgos-badge--warning";
      default:
        return "orgos-badge--success";
    }
  };

  const getRoleTitle = (r: string) => {
    switch (r) {
      case "president":
        return "President";
      case "treasurer":
        return "Treasurer";
      case "event_lead":
        return "Event Lead";
      case "officer":
        return "Officer";
      default:
        return "Member";
    }
  };

  // Loading Screen
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[var(--orgos-bg-app)] text-[var(--orgos-text-primary)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1B365D]" />
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--orgos-bg-app)] text-[var(--orgos-text-primary)] flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full text-center bg-white border border-slate-200 rounded-sm p-8 shadow-sm">
          <div className="h-10 w-10 rounded-sm bg-[#EBF1F8] border border-[#C8D8E9] text-[#1B365D] flex items-center justify-center mx-auto mb-3">
            <Users className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 mb-1.5">Sign In Required</h1>
          <p className="text-xs text-slate-500 mb-6">
            Please log in with your officer or member credentials to view the organization member directory.
          </p>
          <div className="flex gap-2.5 justify-center">
            <Link href="/login" className="orgos-btn orgos-btn--primary">
              Sign In
            </Link>
            <Link href="/" className="orgos-btn orgos-btn--secondary">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--orgos-bg-app)] text-[var(--orgos-text-primary)] selection:bg-[#1B365D] selection:text-white flex">
      {/* 1. Collapsible Sidebar */}
      <Sidebar
        items={navigationItems}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
        activeHref="/members"
      />

      {/* 2. Main Pane */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isSidebarCollapsed ? "pl-16" : "pl-64"
        }`}
      >
        {/* Topbar */}
        <header className="orgos-topbar sticky top-0 z-30">
          <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="h-8 w-8 rounded-sm bg-[#1B365D] flex items-center justify-center font-bold text-sm text-white shadow-sm hover:opacity-90 transition-opacity"
              >
                O
              </Link>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-[#1B365D]">OrgOS</span>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-semibold text-slate-700">Members Directory</span>
              </div>
            </div>

            <UserDropdown />
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 max-w-[1400px] mx-auto px-6 py-8 sm:px-10 w-full flex flex-col justify-start">
          {/* Toast Notification */}
          {notification && (
            <div
              className={`mb-6 p-3.5 rounded-sm text-xs flex items-center justify-between shadow-sm border animate-in fade-in duration-200 ${
                notification.type === "success"
                  ? "bg-[#E8F5E9] border-[#A3D9B5] text-[#0F9D58]"
                  : "bg-[#FEE2E2] border-[#FCA5A5] text-[#DC2626]"
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{notification.message}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="p-1 hover:opacity-75 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Page Banner & Overview */}
          <section className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="orgos-badge orgos-badge--primary">
                    <Building2 className="w-3 h-3" />
                    <span>{organization?.name || "Student Organization"}</span>
                  </span>
                  <span className="orgos-badge orgos-badge--success">
                    <GraduationCap className="w-3 h-3" />
                    <span>{organization?.university || "Campus Chapter"}</span>
                  </span>
                  {isAdmin && (
                    <span className="orgos-badge orgos-badge--warning">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Officer Controls Active</span>
                    </span>
                  )}
                </div>

                <h1 className="orgos-title-h1">Member Directory &amp; Roster</h1>
                <p className="orgos-text-secondary">
                  Manage active student organization members, assign executive roles, and track roster access.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href="/roles"
                  className="orgos-btn orgos-btn--secondary"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Manage Roles</span>
                </Link>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={filteredMembers.length === 0}
                  className="orgos-btn orgos-btn--secondary"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="orgos-btn orgos-btn--primary"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Invite Members</span>
                </button>
              </div>
            </div>
          </section>

          {/* Quick Metrics Cards */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm">
              <span className="orgos-meta-label">Total Roster</span>
              <p className="text-2xl font-bold text-[#1B365D] mt-1">{stats.total}</p>
              <span className="text-[11px] text-slate-500">Registered members</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm">
              <span className="orgos-meta-label">Executive Board</span>
              <p className="text-2xl font-bold text-[#D97706] mt-1">{stats.officers}</p>
              <span className="text-[11px] text-slate-500">Officers &amp; leads</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm">
              <span className="orgos-meta-label">General Members</span>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.regularMembers}</p>
              <span className="text-[11px] text-slate-500">Active students</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm">
              <span className="orgos-meta-label">Active Engagement</span>
              <p className="text-2xl font-bold text-[#0F9D58] mt-1">{stats.activeRate}%</p>
              <span className="text-[11px] text-slate-500">Current status verified</span>
            </div>
          </section>

          {/* Search & Filter Bar */}
          <section className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or title..."
                className="w-full bg-slate-50 border border-slate-200 rounded-sm pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1B365D] focus:ring-1 focus:ring-[#1B365D] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filter:</span>
              </div>

              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-sm px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#1B365D]"
              >
                <option value="all">All Roles</option>
                <optgroup label="System Roles">
                  <option value="president">Presidents</option>
                  <option value="treasurer">Treasurers</option>
                  <option value="officer">Officers</option>
                  <option value="event_lead">Event Leads</option>
                  <option value="member">Members</option>
                </optgroup>
                {availableRoles.filter((r) => r.isCustom).length > 0 && (
                  <optgroup label="Chapter Custom Roles">
                    {availableRoles
                      .filter((r) => r.isCustom)
                      .map((cr) => (
                        <option key={cr.id} value={`custom:${cr.id}`}>
                          {cr.name}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-sm px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#1B365D]"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </section>

          {/* Member Roster Table */}
          <section className="orgos-table-wrapper">
            {isDataLoading ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-[#1B365D] mb-2" />
                <p className="text-xs">Loading member records...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No members match your criteria</p>
                <p className="text-xs text-slate-400 mt-1">Try resetting search filters or invite new members.</p>
              </div>
            ) : (
              <table className="orgos-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Custom Title</th>
                    <th>Status</th>
                    <th>Joined</th>
                    {isAdmin && <th className="text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => {
                    const profile = member.profiles;
                    const fullName = profile?.full_name || "Unknown Member";
                    const email = profile?.email || "No email";
                    const initials =
                      fullName
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((w) => w[0].toUpperCase())
                        .join("") || "M";

                    const joinedDate = member.joined_at
                      ? new Date(member.joined_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Recently";

                    return (
                      <tr key={member.id}>
                        {/* Member Information */}
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-sm bg-[#1B365D] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{fullName}</p>
                              <p className="text-xs text-slate-500 truncate">{email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td>
                          {(() => {
                            const resolvedRole = resolveMemberRole(member, organization?.id);
                            if (resolvedRole.isCustom) {
                              return (
                                <span
                                  className="orgos-badge font-semibold inline-flex items-center gap-1"
                                  style={{
                                    backgroundColor: `${resolvedRole.color}15`,
                                    color: resolvedRole.color,
                                    borderColor: `${resolvedRole.color}40`,
                                  }}
                                >
                                  <Shield className="w-3 h-3" />
                                  {resolvedRole.name}
                                </span>
                              );
                            }
                            return (
                              <span className={`orgos-badge ${getRoleBadgeClasses(member.role)}`}>
                                {resolvedRole.name}
                              </span>
                            );
                          })()}
                        </td>

                        {/* Title */}
                        <td>
                          <span className="text-xs text-slate-700 font-medium">
                            {member.title || "—"}
                          </span>
                        </td>

                        {/* Active Status */}
                        <td>
                          {member.is_active ? (
                            <span className="orgos-badge orgos-badge--success">
                              <span className="orgos-badge-dot" />
                              Active
                            </span>
                          ) : (
                            <span className="orgos-badge bg-slate-100 text-slate-500 border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Joined Date */}
                        <td className="orgos-mono text-xs text-slate-500">{joinedDate}</td>

                        {/* Actions (Admins only) */}
                        {isAdmin && (
                          <td className="text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(member)}
                                className="p-1 rounded-sm text-slate-500 hover:text-[#1B365D] hover:bg-slate-100 transition-colors"
                                title="Edit Role & Title"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {member.user_id !== user.id && (
                                <button
                                  type="button"
                                  onClick={() => setDeletingMember(member)}
                                  className="p-1 rounded-sm text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                                  title="Remove Member"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          {/* Tenancy & Audit Grounding Box */}
          <div className="orgos-grounding-box mt-6">
            <strong>Tenancy &amp; Access Control:</strong> Members are strictly isolated to{" "}
            <code>{organization?.name || "your organization"}</code> via Supabase Row-Level Security. Executive
            officers can edit titles, update roles, and manage transition handovers.
          </div>
        </main>
      </div>

      {/* =========================================================================
          MODALS
         ========================================================================= */}

      {/* 1. Invite Member Modal */}
      {isInviteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsInviteModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white border border-slate-300 rounded-sm shadow-xl p-6 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-sm bg-[#EBF1F8] text-[#1B365D] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Invite Members to Organization</h3>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Share this dedicated signup link with prospective members, committee leads, and newly elected
              officers to join <strong>{organization?.name}</strong>.
            </p>

            {/* Invite Link Box */}
            <div className="mb-4">
              <label className="orgos-meta-label text-slate-600 block mb-1">Organization Invite Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/signup?org=${encodeURIComponent(organization?.slug || "org")}`
                      : ""
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-sm px-3 py-1.5 text-xs text-slate-800 font-mono select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="orgos-btn orgos-btn--primary shrink-0"
                >
                  {inviteCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm text-xs space-y-1.5 mb-5 text-slate-600">
              <p className="font-semibold text-slate-800">How it works:</p>
              <p>• Students create an account and are automatically mapped to {organization?.name}.</p>
              <p>• New signups default to standard Member access until an officer assigns executive permissions.</p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="orgos-btn orgos-btn--secondary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Edit Member Modal */}
      {editingMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setEditingMember(null)}
        >
          <div
            className="w-full max-w-md bg-white border border-slate-300 rounded-sm shadow-xl p-6 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-sm bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  Edit Role &amp; Title: {editingMember.profiles?.full_name}
                </h3>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4">
              {/* Role selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="orgos-meta-label text-slate-600 block">
                    Assigned Organizational Role
                  </label>
                  <Link
                    href="/roles"
                    target="_blank"
                    className="text-[11px] text-[#1B365D] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>+ Add / Manage Roles</span>
                  </Link>
                </div>
                <select
                  value={editRoleSelection}
                  onChange={(e) => handleRoleSelectionChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-sm px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#1B365D]"
                >
                  <optgroup label="System Roles">
                    <option value="member">Active Member (Standard access)</option>
                    <option value="event_lead">Event Lead (Check-in &amp; event management)</option>
                    <option value="officer">Officer (Operational checklists &amp; documents)</option>
                    <option value="treasurer">Treasurer (Ledger &amp; financial tracking)</option>
                    <option value="president">President (Full administration &amp; settings)</option>
                  </optgroup>
                  {availableRoles.filter((r) => r.isCustom).length > 0 && (
                    <optgroup label="Chapter Custom Roles">
                      {availableRoles
                        .filter((r) => r.isCustom)
                        .map((cr) => (
                          <option key={cr.id} value={`custom:${cr.id}`}>
                            {cr.name} ({cr.baseTier} security tier)
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>

                {/* Role overview helper */}
                {(() => {
                  const selectedDef = editRoleSelection.startsWith("custom:")
                    ? availableRoles.find((r) => r.id === editRoleSelection.replace("custom:", ""))
                    : availableRoles.find((r) => r.id === editRoleSelection);
                  if (selectedDef) {
                    return (
                      <p className="text-[11px] text-slate-500 mt-1 italic leading-snug">
                        <strong>Overview:</strong> {selectedDef.overview}
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Custom Title */}
              <div>
                <label className="orgos-meta-label text-slate-600 block mb-1">
                  Custom Title (Optional)
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Vice President, Cultural Chair, Webmaster"
                  className="w-full bg-slate-50 border border-slate-300 rounded-sm px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#1B365D]"
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3 rounded-sm bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-xs font-semibold text-slate-800">Active Membership Status</p>
                  <p className="text-[11px] text-slate-500">Deactivated members lose access to private club records</p>
                </div>
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="h-4 w-4 rounded-sm border-slate-300 text-[#1B365D] focus:ring-[#1B365D]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="orgos-btn orgos-btn--secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="orgos-btn orgos-btn--primary"
                >
                  {isSubmittingAction ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Delete Confirmation Modal */}
      {deletingMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setDeletingMember(null)}
        >
          <div
            className="w-full max-w-sm bg-white border border-slate-300 rounded-sm shadow-xl p-6 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <Trash2 className="w-5 h-5" />
              <h3 className="font-bold text-sm">Remove Member from Organization</h3>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to remove <strong>{deletingMember.profiles?.full_name}</strong> from{" "}
              <strong>{organization?.name}</strong>? They will immediately lose access to all chapter
              records and checklists.
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                className="orgos-btn orgos-btn--secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmittingAction}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-sm transition-colors"
              >
                {isSubmittingAction ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <span>Remove Member</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}