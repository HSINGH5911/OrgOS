"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeSelector from "./ThemeSelector";

export interface SidebarItem {
  label: string;
  href: string;
}

export interface SidebarProps {
  items: SidebarItem[];
  isCollapsed?: boolean;
  onToggle?: () => void;
  activeHref?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  isCollapsed = false,
  onToggle,
  activeHref,
}) => {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[var(--orgos-bg-sidebar)] text-[var(--orgos-text-sidebar)] transition-all duration-300 ease-in-out z-40 flex flex-col border-r border-[var(--orgos-border-light)] ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 border-b border-white/10 h-[52px]">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-sm bg-[#1B365D] border border-white/15 flex items-center justify-center font-bold text-xs text-white shadow-xs">
              O
            </div>
            <span className="font-bold text-xs tracking-wider text-white uppercase">
              Workspace
            </span>
          </div>
        )}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="p-1.5 rounded-sm bg-white/5 hover:bg-white/10 border border-white/10 transition-colors ml-auto text-xs text-[var(--orgos-text-sidebar)] hover:text-white"
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? "→" : "←"}
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {items.map((item, index) => {
          const isActive = activeHref
            ? item.href === activeHref
            : item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

          return (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors text-xs font-medium group relative ${
                isActive
                  ? "bg-[var(--orgos-bg-sidebar-active)] text-white font-semibold border border-white/10 shadow-xs"
                  : "text-[var(--orgos-text-sidebar)] hover:text-white hover:bg-[var(--orgos-bg-sidebar-hover)]"
              }`}
            >
              {!isCollapsed ? (
                <span className="whitespace-nowrap truncate">{item.label}</span>
              ) : (
                <span className="mx-auto font-bold text-[11px] uppercase">
                  {item.label.charAt(0)}
                </span>
              )}

              {/* Hover Tooltip when collapsed */}
              {isCollapsed && (
                <div className="absolute left-full rounded-sm px-2.5 py-1 ml-2 bg-[#0F172A] border border-white/10 text-xs font-medium text-white invisible opacity-0 -translate-x-2 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 z-50 whitespace-nowrap shadow-md">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer: Dark Mode Selector */}
      <div className="p-2.5 border-t border-white/10 flex items-center justify-center">
        {isCollapsed ? (
          <ThemeSelector variant="icon" />
        ) : (
          <div className="w-full space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--orgos-text-sidebar-muted)] px-1 block">
              Theme Mode
            </span>
            <ThemeSelector variant="segmented" />
          </div>
        )}
      </div>
    </aside>
  );
};
