"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  ChevronDown,
  User,
  Building2,
  GraduationCap,
  LogOut,
  Sparkles,
  ExternalLink,
  PlusCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import AccountModal from "./AccountModal";

export default function UserDropdown() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load auth user and subscribe to state changes
  useEffect(() => {
    let isMounted = true;

    try {
      const supabase = createClient();

      supabase.auth
        .getUser()
        .then(({ data: { user } }) => {
          if (isMounted) {
            setUser(user);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setIsLoading(false);
        });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (isMounted) {
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    } catch {
      if (isMounted) setIsLoading(false);
    }
  }, []);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
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

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      setIsOpen(false);
      setIsAccountModalOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Sign out error", err);
    } finally {
      setIsSigningOut(false);
    }
  };

  // While checking auth status, render a smooth skeleton/placeholder
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-9 w-16 bg-slate-200 rounded-sm animate-pulse" />
        <div className="h-9 w-16 bg-slate-200 rounded-sm animate-pulse" />
      </div>
    );
  }

  // Not logged in -> Show Log In & Sign Up buttons
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="orgos-btn orgos-btn--secondary"
        >
          Log In
        </Link>

        <Link
          href="/signup"
          className="orgos-btn orgos-btn--primary"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  // Logged in -> User dropdown details
  const metadata = user.user_metadata || {};
  const fullName =
    metadata.full_name ||
    metadata.name ||
    user.email?.split("@")[0] ||
    "Member";
  const email = user.email || "";
  const organization = metadata.organization || "Student Org";
  const university = metadata.university;
  const role = (metadata.role || "member").toLowerCase();

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word: string) => word[0].toUpperCase())
    .join("") || "U";

  const getRoleBadgeClasses = (r: string) => {
    switch (r) {
      case "president":
        return "orgos-badge--primary";
      case "officer":
      case "treasurer":
      case "secretary":
        return "orgos-badge--warning";
      default:
        return "orgos-badge--success";
    }
  };

  const roleTitle =
    role === "president"
      ? "President"
      : role === "officer"
      ? "Officer"
      : "Member";

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Dropdown Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1 rounded-sm border transition-colors ${
            isOpen
              ? "bg-slate-50 border-[#1B365D] ring-1 ring-[#1B365D]"
              : "bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50"
          }`}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {/* Avatar with Status indicator */}
          <div className="relative">
            <div className="h-7 w-7 rounded-sm bg-[#1B365D] flex items-center justify-center font-bold text-xs text-white">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#0F9D58] rounded-full border border-white" />
          </div>

          {/* User & Org info on larger screens */}
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-900 leading-tight max-w-[120px] truncate">
              {fullName}
            </span>
            <span className="text-[10px] text-slate-500 leading-tight max-w-[120px] truncate">
              {organization}
            </span>
          </div>

          {/* Role badge */}
          <span
            className={`hidden md:inline-flex orgos-badge ${getRoleBadgeClasses(
              role
            )}`}
          >
            {roleTitle}
          </span>

          {/* Dropdown arrow */}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[#1B365D]" : ""
            }`}
          />
        </button>

        {/* Dropdown Popover */}
        {isOpen && (
          <div
            className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 rounded-sm bg-white border border-slate-200 shadow-md p-2 z-50 text-slate-900"
            role="menu"
            aria-orientation="vertical"
          >
            {/* User Profile Header in Menu */}
            <div className="p-3 rounded-sm bg-slate-50 border border-slate-200 mb-2">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-sm bg-[#1B365D] flex items-center justify-center font-bold text-xs text-white shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {fullName}
                    </p>
                    <span
                      className={`orgos-badge ${getRoleBadgeClasses(role)}`}
                    >
                      {roleTitle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{email}</p>
                </div>
              </div>

              {/* Organization affiliation badge */}
              <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1.5 truncate">
                  <Building2 className="w-3.5 h-3.5 text-[#1B365D] shrink-0" />
                  <span className="truncate text-slate-800 font-medium">
                    {organization}
                  </span>
                </div>
                {university && (
                  <span className="text-[10px] text-slate-500 truncate ml-2">
                    {university}
                  </span>
                )}
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsAccountModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors text-left group"
                role="menuitem"
              >
                <div className="p-1 rounded-sm bg-[#EBF1F8] text-[#1B365D]">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-900 font-medium">
                    Account Details
                  </p>
                  <p className="text-[10px] text-slate-500">
                    View member profile &amp; org role
                  </p>
                </div>
              </button>

              <Link
                href="/register-org"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors text-left group"
                role="menuitem"
              >
                <div className="p-1 rounded-sm bg-[#FEF3C7] text-[#D97706]">
                  <PlusCircle className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-900 font-medium">
                    Register New Org
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Create another student club
                  </p>
                </div>
              </Link>
            </div>

            {/* Divider */}
            <div className="my-1.5 border-t border-slate-200" />

            {/* Sign Out Action */}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-medium text-red-700 hover:text-red-800 hover:bg-red-50 transition-colors text-left disabled:opacity-50"
              role="menuitem"
            >
              <div className="p-1 rounded-sm bg-red-100 text-red-700">
                {isSigningOut ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
              </div>
              <span className="font-semibold">
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Account Details Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        user={user}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
      />
    </>
  );
}
