"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  Tag,
  AlertCircle,
  Loader2,
  CalendarPlus,
  Repeat,
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

const EVENT_CATEGORIES = [
  "General Body Meeting",
  "Executive Board",
  "Social / Mixer",
  "Workshop / Speaker",
  "Fundraiser",
  "Community Service",
  "Other",
];

type RepeatFrequency = "daily" | "weekly" | "biweekly" | "monthly";

const REPEAT_FREQUENCIES: { value: RepeatFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 Weeks" },
  { value: "monthly", label: "Monthly" },
];

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateOccurrenceDates(
  startDateStr: string,
  endDateStr: string,
  frequency: RepeatFrequency
): string[] {
  const [sYear, sMonth, sDay] = startDateStr.split("-").map(Number);
  const [eYear, eMonth, eDay] = endDateStr.split("-").map(Number);

  const current = new Date(sYear, sMonth - 1, sDay);
  const end = new Date(eYear, eMonth - 1, eDay);

  const dates: string[] = [];
  const maxOccurrences = 365;

  while (current <= end && dates.length < maxOccurrences) {
    dates.push(formatDateString(current));

    if (frequency === "daily") {
      current.setDate(current.getDate() + 1);
    } else if (frequency === "weekly") {
      current.setDate(current.getDate() + 7);
    } else if (frequency === "biweekly") {
      current.setDate(current.getDate() + 14);
    } else if (frequency === "monthly") {
      current.setMonth(current.getMonth() + 1);
    }
  }

  return dates;
}

export default function EventFormPage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(getTodayDateString);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState(EVENT_CATEGORIES[0]);
  const [description, setDescription] = useState("");

  const [repeats, setRepeats] = useState(false);
  const [repeatFrequency, setRepeatFrequency] =
    useState<RepeatFrequency>("weekly");
  const [repeatUntil, setRepeatUntil] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const dateParam = params.get("date");
      if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        setDate(dateParam);
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  const formatTimeLabel = (time24: string) => {
    if (!time24) return "";
    const [hourStr, minuteStr] = time24.split(":");
    const hourNum = parseInt(hourStr, 10);
    if (isNaN(hourNum)) return time24;
    const period = hourNum >= 12 ? "PM" : "AM";
    const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
    return `${hour12}:${minuteStr} ${period}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!title.trim()) {
      setError("Please enter an event title.");
      return;
    }

    if (!date) {
      setError("Please select a date for the event.");
      return;
    }

    if (startTime && endTime && startTime > endTime) {
      setError("End time must be after the start time.");
      return;
    }

    if (repeats) {
      if (!repeatUntil) {
        setError("Please select a date for when the repeating event ends.");
        return;
      }
      if (repeatUntil < date) {
        setError("The repeat end date must be on or after the event start date.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const timeRange = startTime
        ? endTime
          ? `${formatTimeLabel(startTime)} – ${formatTimeLabel(endTime)}`
          : formatTimeLabel(startTime)
        : undefined;

      const occurrenceDates = repeats
        ? generateOccurrenceDates(date, repeatUntil, repeatFrequency)
        : [date];

      const seriesId = repeats ? crypto.randomUUID() : undefined;
      const createdAt = new Date().toISOString();

      const newEvents = occurrenceDates.map((occurrenceDate) => ({
        id: crypto.randomUUID(),
        seriesId,
        title: title.trim(),
        date: occurrenceDate,
        startTime,
        endTime,
        time: timeRange,
        location: location.trim() || undefined,
        category,
        description: description.trim() || undefined,
        repeats,
        repeatFrequency: repeats ? repeatFrequency : undefined,
        repeatUntil: repeats ? repeatUntil : undefined,
        createdAt,
      }));

      if (typeof window !== "undefined") {
        const rawExisting = localStorage.getItem("orgos_events");
        const existing = rawExisting ? JSON.parse(rawExisting) : [];
        const updated = Array.isArray(existing)
          ? [...existing, ...newEvents]
          : [...newEvents];
        localStorage.setItem("orgos_events", JSON.stringify(updated));
      }

      setSuccessMessage(
        repeats && newEvents.length > 1
          ? `Scheduled ${newEvents.length} repeating events! Redirecting to calendar...`
          : "Event scheduled! Redirecting to calendar..."
      );
      setTimeout(() => {
        router.push("/calendar");
      }, 900);
    } catch (err: any) {
      setError(err?.message || "Failed to save event. Please try again.");
      setIsSubmitting(false);
    }
  };

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
          user ? (isSidebarCollapsed ? "pl-16" : "pl-64") : "pl-0"
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
                <Link
                  href="/calendar"
                  className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
                >
                  Calendar
                </Link>
                <span className="text-slate-300">/</span>
                <span className="truncate text-sm font-medium text-slate-800">
                  Create Event
                </span>
              </div>
            </div>

            <UserDropdown />
          </div>
        </header>

        <main className="mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Page heading */}
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <Link
                href="/calendar"
                className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-[#1B365D]"
              >
                <ArrowLeft size={14} />
                Back to Calendar
              </Link>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Create Event
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Schedule a new chapter meeting, workshop, or activity.
              </p>
            </div>
          </section>

          {/* Form Card */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#1B365D]">
                <CalendarPlus size={20} />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight text-slate-900">
                  Event Details
                </h2>
                <p className="text-xs text-slate-500">
                  Fill out the information below to add this event to the calendar.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-6">
              {error && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-700">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Event Title */}
              <div>
                <label
                  htmlFor="event-title"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Event Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="event-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., General Body Meeting #3"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#1B365D] focus:outline-none focus:ring-1 focus:ring-[#1B365D]"
                />
              </div>

              {/* Date & Category */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="event-date"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CalendarDays
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="event-date"
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3.5 text-sm text-slate-900 transition focus:border-[#1B365D] focus:outline-none focus:ring-1 focus:ring-[#1B365D]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="event-category"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Category
                  </label>
                  <div className="relative">
                    <Tag
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      id="event-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3.5 text-sm text-slate-900 transition focus:border-[#1B365D] focus:outline-none focus:ring-1 focus:ring-[#1B365D]"
                    >
                      {EVENT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Repeats Checkbox & Conditional Fields */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                <label
                  htmlFor="event-repeats"
                  className="inline-flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-800 select-none"
                >
                  <input
                    id="event-repeats"
                    type="checkbox"
                    checked={repeats}
                    onChange={(e) => setRepeats(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#1B365D] focus:ring-[#1B365D]"
                  />
                  <Repeat size={15} className="text-[#1B365D]" />
                  <span>Repeats?</span>
                </label>

                {repeats && (
                  <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="event-repeat-frequency"
                        className="mb-1.5 block text-xs font-semibold text-slate-700"
                      >
                        How often? <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Repeat
                          size={16}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <select
                          id="event-repeat-frequency"
                          value={repeatFrequency}
                          onChange={(e) =>
                            setRepeatFrequency(
                              e.target.value as RepeatFrequency
                            )
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3.5 text-sm text-slate-900 transition focus:border-[#1B365D] focus:outline-none focus:ring-1 focus:ring-[#1B365D]"
                        >
                          {REPEAT_FREQUENCIES.map((freq) => (
                            <option key={freq.value} value={freq.value}>
                              {freq.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="event-repeat-until"
                        className="mb-1.5 block text-xs font-semibold text-slate-700"
                      >
                        Repeat until <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <CalendarDays
                          size={16}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          id="event-repeat-until"
                          type="date"
                          required={repeats}
                          min={date}
                          value={repeatUntil}
                          onChange={(e) => setRepeatUntil(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3.5 text-sm text-slate-900 transition focus:border-[#1B365D] focus:outline-none focus:ring-1 focus:ring-[#1B365D]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Start & End Time */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="event-start-time"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Start Time
                  </label>
                  <div className="relative">
                    <Clock3
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="event-start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3.5 text-sm text-slate-900 transition focus:border-[#1B365D] focus:outline-none focus:ring-1 focus:ring-[#1B365D]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="event-end-time"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    End Time
                  </label>
                  <div className="relative">
                    <Clock3
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="event-end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3.5 text-sm text-slate-900 transition focus:border-[#1B365D] focus:outline-none focus:ring-1 focus:ring-[#1B365D]"
                    />
                  </div>
                </div>
              </div>

              {/* Location / Venue */}
              <div>
                <label
                  htmlFor="event-location"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Location / Room
                </label>
                <div className="relative">
                  <MapPin
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="event-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Student Union Room 2.104 or Zoom"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#1B365D] focus:outline-none focus:ring-1 focus:ring-[#1B365D]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="event-description"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Description & Notes
                </label>
                <div className="relative">
                  <FileText
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-3 text-slate-400"
                  />
                  <textarea
                    id="event-description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add agenda items, speaker details, or preparation notes..."
                    className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#1B365D] focus:outline-none focus:ring-1 focus:ring-[#1B365D]"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                <Link
                  href="/calendar"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1B365D] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#254775] focus:outline-none focus:ring-2 focus:ring-[#1B365D] focus:ring-offset-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CalendarPlus size={16} />
                      Save Event
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
