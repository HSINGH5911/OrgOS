// Shared Role & Permission Definitions for OrgOS

export type BaseRoleTier = "president" | "treasurer" | "officer" | "event_lead" | "member";

export type PermissionId =
  | "org_settings"
  | "roles_manage"
  | "members_view"
  | "members_manage"
  | "members_invite"
  | "finances_view"
  | "finances_manage"
  | "events_view"
  | "events_manage"
  | "events_checkin"
  | "docs_view"
  | "docs_upload"
  | "transitions_manage"
  | "copilot_query";

export interface PermissionDefinition {
  id: PermissionId;
  category: "Administration" | "Roster & Membership" | "Finances" | "Events & Check-in" | "Knowledge & Continuity";
  name: string;
  description: string;
}

export interface RoleDefinition {
  id: string; // unique slug e.g. "president", "treasurer", "vp_pr"
  name: string; // Display name e.g. "President", "VP of Public Relations"
  overview: string; // Description of scope and duties
  baseTier: BaseRoleTier; // Maps to PostgreSQL enum
  isCustom: boolean;
  color: string;
  badgeVariant: "primary" | "success" | "warning" | "neutral" | "danger";
  permissions: PermissionId[];
  createdAt?: string;
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // Administration
  {
    id: "org_settings",
    category: "Administration",
    name: "Organization Settings",
    description: "Modify chapter metadata, university affiliation, and system branding.",
  },
  {
    id: "roles_manage",
    category: "Administration",
    name: "Role & Permission Management",
    description: "Create and configure custom roles, permission matrices, and security tiers.",
  },

  // Roster & Membership
  {
    id: "members_view",
    category: "Roster & Membership",
    name: "View Member Roster",
    description: "Inspect member directory, contact details, active statuses, and join history.",
  },
  {
    id: "members_manage",
    category: "Roster & Membership",
    name: "Manage Members & Titles",
    description: "Assign roles, set executive titles, update active statuses, or remove members.",
  },
  {
    id: "members_invite",
    category: "Roster & Membership",
    name: "Generate Onboarding Invites",
    description: "Create chapter-specific invite links and share registration keys with students.",
  },

  // Finances
  {
    id: "finances_view",
    category: "Finances",
    name: "View Financial Records",
    description: "Inspect chapter budget spreadsheets, dues balances, and university grant allocations.",
  },
  {
    id: "finances_manage",
    category: "Finances",
    name: "Manage Chapter Ledgers",
    description: "Approve reimbursements, modify financial logs, and coordinate banking access.",
  },

  // Events & Check-in
  {
    id: "events_view",
    category: "Events & Check-in",
    name: "View Events & Meetings",
    description: "Access schedule of upcoming general body meetings, workshops, and banquets.",
  },
  {
    id: "events_manage",
    category: "Events & Check-in",
    name: "Create & Edit Events",
    description: "Schedule chapter meetings, configure RSVP limits, and manage venue logistics.",
  },
  {
    id: "events_checkin",
    category: "Events & Check-in",
    name: "Attendance Check-in Scanner",
    description: "Launch dynamic QR code scanner and record live meeting attendance points.",
  },

  // Knowledge & Continuity
  {
    id: "docs_view",
    category: "Knowledge & Continuity",
    name: "Access Chapter Archives",
    description: "Browse constitution, past meeting minutes, and indexed knowledge assets.",
  },
  {
    id: "docs_upload",
    category: "Knowledge & Continuity",
    name: "Upload Vault Documents",
    description: "Upload agendas, permits, and financial spreadsheets for pgvector AI embedding.",
  },
  {
    id: "transitions_manage",
    category: "Knowledge & Continuity",
    name: "Officer Handover Dossier",
    description: "Maintain annual transition dossiers, bank changeover checklists, and account credentials.",
  },
  {
    id: "copilot_query",
    category: "Knowledge & Continuity",
    name: "Query AI Copilot",
    description: "Ask questions grounded in past institutional memory and historical records.",
  },
];

export const BUILTIN_ROLES: RoleDefinition[] = [
  {
    id: "president",
    name: "President / Co-President",
    overview:
      "Executive authority over chapter administration, university compliance, banking authorizations, officer appointments, and annual officer transitions.",
    baseTier: "president",
    isCustom: false,
    color: "#1B365D",
    badgeVariant: "primary",
    permissions: [
      "org_settings",
      "roles_manage",
      "members_view",
      "members_manage",
      "members_invite",
      "finances_view",
      "finances_manage",
      "events_view",
      "events_manage",
      "events_checkin",
      "docs_view",
      "docs_upload",
      "transitions_manage",
      "copilot_query",
    ],
  },
  {
    id: "treasurer",
    name: "Treasurer / VP Finance",
    overview:
      "Oversees chapter finances, student government allocation requests, dues collection, expenditure reimbursement approval, and financial ledger archives.",
    baseTier: "treasurer",
    isCustom: false,
    color: "#0F9D58",
    badgeVariant: "success",
    permissions: [
      "finances_view",
      "finances_manage",
      "members_view",
      "events_view",
      "docs_view",
      "docs_upload",
      "transitions_manage",
      "copilot_query",
    ],
  },
  {
    id: "officer",
    name: "Officer / Executive Board",
    overview:
      "Core chapter leadership managing operational documentation, event programming, committee coordination, and contributing to continuity dossiers.",
    baseTier: "officer",
    isCustom: false,
    color: "#D97706",
    badgeVariant: "warning",
    permissions: [
      "members_view",
      "events_view",
      "events_manage",
      "events_checkin",
      "docs_view",
      "docs_upload",
      "transitions_manage",
      "copilot_query",
    ],
  },
  {
    id: "event_lead",
    name: "Event Lead / Coordinator",
    overview:
      "Specialized operational role directing meeting agendas, campus space reservations, event promotion, and real-time attendance verification.",
    baseTier: "event_lead",
    isCustom: false,
    color: "#7C3AED",
    badgeVariant: "neutral",
    permissions: [
      "events_view",
      "events_manage",
      "events_checkin",
      "members_view",
      "docs_view",
      "copilot_query",
    ],
  },
  {
    id: "member",
    name: "Active Member",
    overview:
      "General student member with rights to participate in general body meetings, RSVP for workshops, check into events, and access public chapter archives.",
    baseTier: "member",
    isCustom: false,
    color: "#475569",
    badgeVariant: "neutral",
    permissions: ["events_view", "events_checkin", "members_view", "docs_view", "copilot_query"],
  },
];

const STORAGE_KEY_PREFIX = "orgos_custom_roles_";
const DELETED_ROLES_KEY_PREFIX = "orgos_deleted_roles_";

/**
 * Returns all roles (built-in + organization custom roles/overrides),
 * filtering out any deleted roles while ensuring President cannot be deleted.
 */
export function getRolesForOrg(orgId?: string): RoleDefinition[] {
  if (typeof window === "undefined") {
    return BUILTIN_ROLES;
  }

  const orgKey = orgId || "default";
  const customKey = `${STORAGE_KEY_PREFIX}${orgKey}`;
  const deletedKey = `${DELETED_ROLES_KEY_PREFIX}${orgKey}`;

  try {
    // 1. Read deleted roles list (President is always protected)
    const rawDeleted = localStorage.getItem(deletedKey);
    const deletedIds: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
    const activeDeletedIds = new Set(deletedIds.filter((id) => id !== "president"));

    // 2. Read custom/overridden roles
    const rawCustom = localStorage.getItem(customKey);
    const customRoles: RoleDefinition[] = rawCustom ? JSON.parse(rawCustom) : [];
    const customMap = new Map(customRoles.map((r) => [r.id, r]));

    // 3. Start with built-in roles that have not been deleted
    const result: RoleDefinition[] = [];
    for (const builtin of BUILTIN_ROLES) {
      if (builtin.id === "president" || !activeDeletedIds.has(builtin.id)) {
        // If an edited override exists for this built-in role, use it
        if (customMap.has(builtin.id)) {
          result.push(customMap.get(builtin.id)!);
          customMap.delete(builtin.id);
        } else {
          result.push(builtin);
        }
      }
    }

    // 4. Append remaining custom roles that have not been deleted
    customMap.forEach((customRole) => {
      if (!activeDeletedIds.has(customRole.id)) {
        result.push(customRole);
      }
    });

    return result;
  } catch (e) {
    console.error("Error reading roles from storage:", e);
    return BUILTIN_ROLES;
  }
}

/**
 * Saves or updates a role for an organization.
 * President role cannot be modified.
 */
export function saveCustomRoleForOrg(orgId: string, role: RoleDefinition): void {
  if (typeof window === "undefined") return;
  // Guard: President cannot be edited
  if (role.id === "president") return;

  const orgKey = orgId || "default";
  const customKey = `${STORAGE_KEY_PREFIX}${orgKey}`;
  const deletedKey = `${DELETED_ROLES_KEY_PREFIX}${orgKey}`;

  try {
    // If this role was previously in the deleted list, resurrect it
    const rawDeleted = localStorage.getItem(deletedKey);
    if (rawDeleted) {
      const deleted: string[] = JSON.parse(rawDeleted);
      const updated = deleted.filter((id) => id !== role.id);
      localStorage.setItem(deletedKey, JSON.stringify(updated));
    }

    // Save/update in custom list
    const raw = localStorage.getItem(customKey);
    let list: RoleDefinition[] = raw ? JSON.parse(raw) : [];

    const existingIndex = list.findIndex((r) => r.id === role.id);
    if (existingIndex >= 0) {
      list[existingIndex] = { ...role };
    } else {
      list.push({ ...role, createdAt: role.createdAt || new Date().toISOString() });
    }

    localStorage.setItem(customKey, JSON.stringify(list));
  } catch (e) {
    console.error("Error saving role:", e);
  }
}

/**
 * Deletes a role for an organization.
 * President role cannot be deleted.
 */
export function deleteCustomRoleForOrg(orgId: string, roleId: string): void {
  if (typeof window === "undefined") return;
  // Guard: President cannot be deleted
  if (roleId === "president") return;

  const orgKey = orgId || "default";
  const customKey = `${STORAGE_KEY_PREFIX}${orgKey}`;
  const deletedKey = `${DELETED_ROLES_KEY_PREFIX}${orgKey}`;

  try {
    // 1. Remove from custom roles if present
    const rawCustom = localStorage.getItem(customKey);
    if (rawCustom) {
      const list: RoleDefinition[] = JSON.parse(rawCustom);
      const updated = list.filter((r) => r.id !== roleId);
      localStorage.setItem(customKey, JSON.stringify(updated));
    }

    // 2. Add to deleted roles list to suppress built-in roles
    const rawDeleted = localStorage.getItem(deletedKey);
    const deletedList: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
    if (!deletedList.includes(roleId)) {
      deletedList.push(roleId);
      localStorage.setItem(deletedKey, JSON.stringify(deletedList));
    }
  } catch (e) {
    console.error("Error deleting role:", e);
  }
}

/**
 * Resolves the role definition for a member record.
 * Checks custom roles by title or id first, then falls back to built-in roles.
 */
export function resolveMemberRole(
  member: { role: string; title?: string | null },
  orgId?: string
): RoleDefinition {
  const allRoles = getRolesForOrg(orgId);

  // 1. If title matches a custom role name or id
  if (member.title) {
    const titleMatch = allRoles.find(
      (r) =>
        r.name.toLowerCase() === member.title?.trim().toLowerCase() ||
        r.id.toLowerCase() === member.title?.trim().toLowerCase()
    );
    if (titleMatch) return titleMatch;
  }

  // 2. Direct id match
  const idMatch = allRoles.find((r) => r.id === member.role);
  if (idMatch) return idMatch;

  // 3. Fallback to member
  return (
    BUILTIN_ROLES.find((r) => r.id === "member") || {
      id: "member",
      name: "Member",
      overview: "Standard membership",
      baseTier: "member",
      isCustom: false,
      color: "#475569",
      badgeVariant: "neutral",
      permissions: ["members_view", "events_view"],
    }
  );
}
