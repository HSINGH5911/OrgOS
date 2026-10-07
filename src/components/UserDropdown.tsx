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
      <div className="flex items-center gap-3">
        <div className="h-9 w-20 bg-slate-900 border border-slate-800 rounded-lg animate-pulse" />
        <div className="h-9 w-20 bg-slate-900 border border-slate-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  // Not logged in -> Show Log In & Sign Up buttons
  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-200 bg-slate-900 
          border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white hover:border-slate-700 transition-colors shadow-sm"
        >
          Log In
        </Link>

        <Link
          href="/signup"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 
          hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all font-semibold"
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
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "officer":
      case "treasurer":
      case "secretary":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
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
          className={`flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border transition-all ${
            isOpen
              ? "bg-slate-800 border-indigo-500/50 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/30"
              : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
          }`}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {/* Avatar with Status indicator */}
          <div className="relative">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center font-bold text-xs text-white shadow-sm">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950" />
          </div>

          {/* User & Org info on larger screens */}
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-200 leading-tight max-w-[120px] truncate">
              {fullName}
            </span>
            <span className="text-[10px] text-slate-400 leading-tight max-w-[120px] truncate">
              {organization}
            </span>
          </div>

          {/* Role badge */}
          <span
            className={`hidden md:inline-block px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border ${getRoleBadgeClasses(
              role
            )}`}
          >
            {roleTitle}
          </span>

          {/* Dropdown arrow */}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-indigo-400" : ""
            }`}
          />
        </button>

        {/* Dropdown Popover */}
        {isOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/60 p-2 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
            role="menu"
            aria-orientation="vertical"
          >
            {/* User Profile Header in Menu */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-2">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-md shadow-indigo-500/20">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-white truncate">
                      {fullName}
                    </p>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.2 rounded border font-semibold ${getRoleBadgeClasses(
                        role
                      )}`}
                    >
                      {roleTitle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{email}</p>
                </div>
              </div>

              {/* Organization affiliation badge */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5 truncate">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate text-slate-300 font-medium">
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
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left group"
                role="menuitem"
              >
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-200 group-hover:text-white font-medium">
                    Account Details
                  </p>
                  <p className="text-[10px] text-slate-500">
                    View member profile & org role
                  </p>
                </div>
              </button>

              <Link
                href="/register-org"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left group"
                role="menuitem"
              >
                <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 transition-colors">
                  <PlusCircle className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-200 group-hover:text-white font-medium">
                    Register New Org
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Create another student club
                  </p>
                </div>
              </Link>
            </div>

            {/* Divider */}
            <div className="my-1.5 border-t border-slate-800/80" />

            {/* Sign Out Action */}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left disabled:opacity-50"
              role="menuitem"
            >
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
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
