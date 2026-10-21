export type DocumentVisibility = "all" | "officers" | "exec" | "president";

/**
 * Returns the array of document visibility tiers that a given organizational role is allowed to read.
 * Matches the visibility check in `src/app/documents/page.tsx`.
 */
export function getAllowedVisibilitiesForRole(
  userRole?: string | null
): DocumentVisibility[] {
  const role = (userRole || "member").toLowerCase().trim();

  if (role === "president" || role === "admin" || role === "owner") {
    return ["all", "officers", "exec", "president"];
  }

  if (
    role === "treasurer" ||
    role === "vice_president" ||
    role === "vp"
  ) {
    return ["all", "officers", "exec"];
  }

  if (
    role === "officer" ||
    role === "event_lead" ||
    role === "lead"
  ) {
    return ["all", "officers"];
  }

  return ["all"];
}

/**
 * Parses `[access:all|officers|exec|president]` prefix from a document summary field.
 */
export function parseDocumentVisibility(
  summary?: string | null,
  explicitVisibility?: string | null
): DocumentVisibility {
  if (
    explicitVisibility === "officers" ||
    explicitVisibility === "exec" ||
    explicitVisibility === "president" ||
    explicitVisibility === "all"
  ) {
    return explicitVisibility;
  }

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

export function cleanDocumentSummary(summary?: string | null): string {
  if (!summary) return "";
  return summary
    .replace(/^\[access:(all|officers|exec|president)\]\s*/i, "")
    .trim();
}
