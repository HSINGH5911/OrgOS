"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import UserDropdown from "@/components/UserDropdown";
import type { User as SupabaseUser } from "@supabase/supabase-js";

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

type CalendarView = "Month" | "Week" | "Day";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("Month");

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const today = new Date();

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const monthLabel = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const selectedDateLabel = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const changeDate = (direction: number) => {
    if (view === "Month") {
      const nextDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + direction,
        1
      );
      setCurrentDate(nextDate);
    } else if (view === "Week") {
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + direction * 7);
      setSelectedDate(nextDate);
      setCurrentDate(nextDate);
    } else {
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + direction);
      setSelectedDate(nextDate);
      setCurrentDate(nextDate);
    }
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    setCurrentDate(date);
  };

  const monthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );

  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  const monthDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });

  const weekStart = new Date(selectedDate);
  weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());

  const weekDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  const displayedDates =
    view === "Month"
      ? monthDays
      : view === "Week"
        ? weekDates
        : [selectedDate];

  const heading =
    view === "Month"
      ? monthLabel
      : view === "Week"
        ? `${weekDates[0].toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })} – ${weekDates[6].toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}`
        : selectedDate.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          });

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 selection:bg-[#1B365D] selection:text-white">
      {user && (
        <Sidebar
          items={navigationItems}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
          activeHref="/calendar"
        />
      )}

      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col transition-all duration-300 ${
          user
            ? isSidebarCollapsed
              ? "pl-16"
              : "pl-64"
            : "pl-0"
        }`}
      >
        {/* Application header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/"
                aria-label="OrgOS home"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1B365D] text-sm font-bold text-white shadow-sm transition hover:bg-[#254775]"
              >
                O
              </Link>

              <div className="flex min-w-0 items-center gap-2">
                <span className="font-bold tracking-tight text-[#1B365D]">
                  OrgOS
                </span>
                <span className="text-slate-300">/</span>
                <span className="truncate text-sm font-medium text-slate-600">
                  Calendar
                </span>
              </div>
            </div>

            <UserDropdown />
          </div>
        </header>

        <main className="mx-auto flex w-full min-w-0 max-w-[1800px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Page heading */}
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Calendar
              </h1>
            </div>

            <button
              type="button"
              onClick={() =>
                alert("Connect this button to your event creation form.")
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1B365D] px-4 text-sm font-medium text-white shadow-sm transition hover:bg-[#254775] focus:outline-none focus:ring-2 focus:ring-[#1B365D] focus:ring-offset-2"
            >
              <Plus size={17} />
              Create event
            </button>
          </section>

          {/* Calendar workspace */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Calendar toolbar */}
            <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#1B365D] sm:flex">
                    <CalendarDays size={22} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                      {heading}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {view === "Month"
                        ? "Monthly overview"
                        : view === "Week"
                          ? "Weekly schedule"
                          : "Daily schedule"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={goToToday}
                    className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Today
                  </button>

                  <div className="flex items-center rounded-lg border border-slate-200">
                    <button
                      type="button"
                      aria-label="Previous period"
                      onClick={() => changeDate(-1)}
                      className="flex h-9 w-9 items-center justify-center rounded-l-lg text-slate-600 transition hover:bg-slate-100"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <div className="h-5 w-px bg-slate-200" />

                    <button
                      type="button"
                      aria-label="Next period"
                      onClick={() => changeDate(1)}
                      className="flex h-9 w-9 items-center justify-center rounded-r-lg text-slate-600 transition hover:bg-slate-100"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* View selector */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                  {(["Month", "Week", "Day"] as CalendarView[]).map(
                    (option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setView(option)}
                        aria-pressed={view === option}
                        className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                          view === option
                            ? "bg-white text-[#1B365D] shadow-sm ring-1 ring-slate-200"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {option}
                      </button>
                    )
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-[#1B365D]" />
                  Today
                  <span className="ml-2 h-2 w-2 rounded-full border border-slate-300 bg-white" />
                  Selected date
                </div>
              </div>
            </div>

            {/* Weekday labels */}
            {view !== "Day" && (
              <div
                className={`grid ${
                  view === "Week" ? "grid-cols-7" : "grid-cols-7"
                } border-b border-slate-200 bg-slate-50/80`}
              >
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs"
                  >
                    {day}
                  </div>
                ))}
              </div>
            )}

            {/* Calendar grid */}
            <div
              className={`grid ${
                view === "Day"
                  ? "grid-cols-1"
                  : "grid-cols-7"
              }`}
            >
              {displayedDates.map((date, index) => {
                const isCurrentMonth =
                  date.getMonth() === currentDate.getMonth() &&
                  date.getFullYear() === currentDate.getFullYear();

                const isSelected = isSameDay(date, selectedDate);
                const isCurrentDay = isSameDay(date, today);

                return (
                  <button
                    key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
                    type="button"
                    onClick={() => selectDate(date)}
                    aria-pressed={isSelected}
                    className={`group relative flex min-w-0 flex-col justify-start border-b border-r border-slate-200 p-1.5 text-left transition-colors focus:z-10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#1B365D] sm:p-2.5 ${
                      view === "Month"
                        ? "min-h-[88px] sm:min-h-[118px] lg:min-h-[140px]"
                        : view === "Week"
                          ? "min-h-[180px] sm:min-h-[250px]"
                          : "min-h-[360px] sm:min-h-[480px]"
                    } ${
                      isSelected
                        ? "bg-blue-50/60"
                        : "bg-white hover:bg-slate-50"
                    } ${
                      view === "Month" && !isCurrentMonth
                        ? "bg-slate-50/70"
                        : ""
                    }`}
                  >
                    <div
                      className={`flex ${
                        view === "Day"
                          ? "items-center gap-3"
                          : "justify-start"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition sm:h-8 sm:w-8 sm:text-sm ${
                          isCurrentDay
                            ? "bg-[#1B365D] font-semibold text-white"
                            : isSelected
                              ? "bg-blue-100 font-semibold text-[#1B365D]"
                              : view === "Month" && !isCurrentMonth
                                ? "text-slate-400"
                                : "text-slate-700 group-hover:bg-slate-100"
                        }`}
                      >
                        {date.getDate()}
                      </span>

                      {view === "Day" && (
                        <div>
                          <p className="font-semibold text-slate-900">
                            {date.toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-sm text-slate-500">
                            {isCurrentDay
                              ? "Today"
                              : "Daily schedule"}
                          </p>
                        </div>
                      )}
                    </div>

                    {view === "Day" ? (
                      <div className="mt-5 border-t border-slate-200">
                        {Array.from({ length: 12 }, (_, hourIndex) => {
                          const hour = hourIndex + 8;

                          return (
                            <div
                              key={hour}
                              className="flex min-h-[46px] border-b border-slate-100"
                            >
                              <div className="w-20 shrink-0 py-2 text-xs text-slate-400">
                                {new Date(
                                  2000,
                                  0,
                                  1,
                                  hour
                                ).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </div>
                              <div className="flex-1 border-l border-slate-100" />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-2">
                        {/* Event labels can be rendered here when event data is connected. */}
                      </div>
                    )}

                    {view === "Month" && isSelected && (
                      <div className="mt-1 hidden text-[10px] font-medium text-[#1B365D] sm:block">
                        Selected
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar footer */}
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Clock3 size={17} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedDateLabel}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    No events to display for this date.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  alert("Connect this button to your event creation form.")
                }
                className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:self-auto"
              >
                <CalendarPlus size={16} />
                Add event
              </button>
            </div>
          </section>

          <p className="text-xs leading-relaxed text-slate-400">
            Select a date to view its schedule. Events will appear here once
            calendar data is connected.
          </p>
        </main>
      </div>
    </div>
  );
}
