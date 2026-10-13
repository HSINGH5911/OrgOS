"use client";

import React from "react";

export interface SidebarItem {
  label: string;
  icon: string;
  href: string;
}

export interface SidebarProps {
  items: SidebarItem[];
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  isCollapsed = false,
  onToggle,
}) => {
  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white text-slate-800 transition-all duration-300 ease-in-out z-40 flex flex-col border-r border-slate-200 shadow-sm ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 border-b border-slate-200 h-[52px]">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-sm bg-[#1B365D] flex items-center justify-center font-bold text-xs text-white shadow-sm">
              O
            </div>
            <span className="font-bold text-xs tracking-wider text-[#1B365D] uppercase">
              Workspace
            </span>
          </div>
        )}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="p-1.5 rounded-sm bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors ml-auto text-xs text-slate-600"
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? "→" : "←"}
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {items.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors text-xs font-medium group relative ${
              index === 0
                ? "bg-[#1B365D] text-white font-semibold shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span className="text-base min-w-[20px] text-center">{item.icon}</span>
            {!isCollapsed && (
              <span className="whitespace-nowrap truncate">{item.label}</span>
            )}

            {/* Hover Tooltip when collapsed */}
            {isCollapsed && (
              <div className="absolute left-full rounded-sm px-2.5 py-1 ml-2 bg-slate-900 text-xs font-medium text-white invisible opacity-0 -translate-x-2 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 z-50 whitespace-nowrap shadow-md">
                {item.label}
              </div>
            )}
          </a>
        ))}
      </nav>
    </aside>
  );
};