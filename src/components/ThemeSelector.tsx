"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sun, Moon, Monitor, Check, ChevronDown } from "lucide-react";
import { useTheme, ThemeMode } from "./ThemeProvider";

interface ThemeSelectorProps {
  variant?: "dropdown" | "segmented" | "icon";
  className?: string;
}

const THEME_OPTIONS: {
  value: ThemeMode;
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: "light",
    label: "Light",
    description: "High-contrast daylight workspace",
    Icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Low-glare night operations mode",
    Icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Sync with OS display preference",
    Icon: Monitor,
  },
];

export default function ThemeSelector({
  variant = "dropdown",
  className = "",
}: ThemeSelectorProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // 1. Segmented Control Variant (great for menus, modals, settings pages)
  if (variant === "segmented") {
    return (
      <div
        className={`inline-flex items-center p-1 rounded-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full ${className}`}
        role="radiogroup"
        aria-label="Theme mode selector"
      >
        {THEME_OPTIONS.map(({ value, label, Icon }) => {
          const isActive = theme === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setTheme(value)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-sm text-xs font-medium transition-all ${
                isActive
                  ? "bg-white dark:bg-slate-900 text-[#1B365D] dark:text-blue-400 shadow-xs font-semibold border border-slate-200/80 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // 2. Icon-Only Quick Cycle/Toggle Variant (great for collapsed sidebar)
  if (variant === "icon") {
    const nextMode: ThemeMode =
      theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    const CurrentIcon =
      theme === "system" ? Monitor : resolvedTheme === "dark" ? Moon : Sun;

    return (
      <button
        type="button"
        onClick={() => setTheme(nextMode)}
        title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)} (click to switch to ${nextMode})`}
        aria-label={`Current theme: ${theme}. Switch to ${nextMode} mode`}
        className={`p-2 rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center ${className}`}
      >
        <CurrentIcon className="w-4 h-4" />
      </button>
    );
  }

  // 3. Dropdown Selector Variant (default for Topbar)
  const activeOption =
    THEME_OPTIONS.find((opt) => opt.value === theme) || THEME_OPTIONS[0];
  const ActiveIcon =
    theme === "system"
      ? Monitor
      : resolvedTheme === "dark"
      ? Moon
      : Sun;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 h-9 px-2.5 rounded-sm border text-xs font-medium transition-colors ${
          isOpen
            ? "bg-slate-50 dark:bg-slate-800 border-[#1B365D] dark:border-blue-400 ring-1 ring-[#1B365D] dark:ring-blue-400 text-slate-900 dark:text-slate-100"
            : "bg-white dark:bg-slate-800/90 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
        }`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select display theme"
        title="Change theme (Light / Dark / System)"
      >
        <ActiveIcon
          className={`w-3.5 h-3.5 ${
            resolvedTheme === "dark"
              ? "text-blue-400"
              : "text-[#1B365D]"
          }`}
        />
        <span className="hidden sm:inline">{activeOption.label}</span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1.5 w-56 rounded-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg p-1.5 z-50"
          role="listbox"
          aria-label="Theme options"
        >
          <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Appearance Mode
            </span>
          </div>

          <div className="space-y-0.5">
            {THEME_OPTIONS.map(({ value, label, description, Icon }) => {
              const isSelected = theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setTheme(value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-left text-xs transition-colors ${
                    isSelected
                      ? "bg-[#EBF1F8] dark:bg-slate-800 text-[#1B365D] dark:text-blue-400 font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-sm border ${
                      isSelected
                        ? "bg-white dark:bg-slate-900 border-[#C8D8E9] dark:border-slate-700 text-[#1B365D] dark:text-blue-400"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate">{label}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#1B365D] dark:text-blue-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal truncate">
                      {description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
