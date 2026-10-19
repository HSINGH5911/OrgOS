"use client";

import React, { useState } from 'react';
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
  { label: "Overview", icon: "📊", href: "/" },
  { label: "Documents", icon: "📁", href: "/documents" },
  { label: "Members", icon: "👥", href: "/members" },
  { label: "Roles", icon: "🛡️", href: "/roles" },
  { label: "Calendar", icon: "📅", href: "/calendar" },
  { label: "AI Copilot", icon: "✨", href: "/copilot" },
  { label: "Transitions", icon: "📋", href: "/transitions" },
  { label: "Account", icon: "⚙️", href: "/account" },
];

export default function Calendar() {
    const router = useRouter();
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<string>("member");
    const [members, setMembers] = useState<MemberRecord[]>([]);
    const [availableRoles, setAvailableRoles] = useState<RoleDefinition[]>(BUILTIN_ROLES);
    const [isDataLoading, setIsDataLoading] = useState(true);

    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const firstdayIndex = new Date(year, month, 1).getDay();

    const prevMonthDays = new Date(year, month, 0).getDate();

    const paddingStart = Array.from(
        { length: firstdayIndex },
        (_, i) => new Date(year, month - 1, prevMonthDays - firstdayIndex + 1 + i)
    );

    const currentDays = Array.from(
        { length: daysInMonth },
        (_, i) => new Date(year, month, i + 1)
    );

    const totalSlotsNeeded = Math.ceil((paddingStart.length + currentDays.length) / 7) * 7;
    const trailingSlotsCount = totalSlotsNeeded - (paddingStart.length + currentDays.length);

    const paddingEnd = Array.from(
        { length: trailingSlotsCount },
        (_, i) => new Date(year, month + 1, 1 + i)
    );

    const allCalendarDays = [...paddingStart, ...currentDays, ...paddingEnd];

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

    const isSameDay = (d1: Date, d2: Date | null) =>
        !!d2 && d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() 
        && d1.getFullYear() === d2.getFullYear();

    const isToday = (date: Date) => isSameDay(date, new Date());

    const monthLabel = currentDate.toLocaleString('default', {month: 'long'});
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="max-w-md mx-auto p-4 bg-white shadow-lg rounded-xl border border-gray-100">
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {monthLabel} <span className="text-gray-400 font-normal">{year}</span>
        </h2>
        <div className="space-x-1">
          <button 
            onClick={handlePrevMonth} 
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 font-bold transition"
          >
            &larr;
          </button>
          <button 
            onClick={handleNextMonth} 
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 font-bold transition"
          >
            &rarr;
          </button>
        </div>
      </div>

      {/* Weekday Names Header */}
      <div className="grid grid-cols-7 gap-1 text-center font-semibold text-gray-500 text-sm mb-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="py-1">{day}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {allCalendarDays.map((date, index) => {
          const isCurrentMonth = date.getMonth() === month;
          const isSelected = isSameDay(date, selectedDate);
          const currentIsToday = isToday(date);

          return (
            <button
              key={index}
              onClick={() => isCurrentMonth && setSelectedDate(date)}
              disabled={!isCurrentMonth}
              className={`
                h-10 w-10 mx-auto flex items-center justify-center rounded-full text-sm font-medium transition-all
                ${!isCurrentMonth ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-indigo-50'}
                ${currentIsToday && !isSelected ? 'border-2 border-indigo-600 text-indigo-600' : ''}
                ${isSelected ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200' : ''}
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>

    )
}