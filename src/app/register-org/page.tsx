"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  Building,
  GraduationCap,
} from "lucide-react";
import ThemeSelector from "@/components/ThemeSelector";

export default function RegisterOrgPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [university, setUniversity] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!orgName.trim() || !university.trim() || !name.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name.trim(),
            organization: orgName.trim(),
            university: university.trim(),
            is_new_org: true,
            role: "president",
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        setSuccessMessage("Organization and admin account created successfully! Redirecting...");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1500);
      } else if (data.user) {
        setSuccessMessage("Organization registered! Please check your email to verify your account.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to register organization. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[var(--orgos-bg-app)] text-[var(--orgos-text-primary)] relative px-6 py-12 selection:bg-[#1B365D] selection:text-white">
      {/* Top Bar: Back to Sign Up + Theme Selector */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          href="/signup"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#1B365D] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign Up</span>
        </Link>
        <ThemeSelector />
      </div>

      {/* Card Container */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-sm p-7 sm:p-8 shadow-sm relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="h-9 w-9 mx-auto rounded-sm bg-[#1B365D] flex items-center justify-center text-white shadow-sm mb-3">
            <Building className="w-4 h-4" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#1B365D]">Register a New Organization</h1>
          <p className="text-xs text-slate-500 mt-1">
            Establish your club workspace on OrgOS for seamless officer transitions
          </p>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-5 p-3 rounded-sm bg-[#FEE2E2] border border-[#FCA5A5] text-[#DC2626] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3 rounded-sm bg-[#E8F5E9] border border-[#A3D9B5] text-[#0F9D58] text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#0F9D58]" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Organization Name */}
          <div>
            <label htmlFor="orgName" className="block text-xs font-semibold text-slate-700 mb-1">
              Organization Name
            </label>
            <div className="relative">
              <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="orgName"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Robotics Club"
                required
                className="w-full bg-white border border-slate-300 rounded-sm pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1B365D] focus:ring-1 focus:ring-[#1B365D] transition-colors"
              />
            </div>
          </div>

          {/* University / College */}
          <div>
            <label htmlFor="university" className="block text-xs font-semibold text-slate-700 mb-1">
              University / Campus
            </label>
            <div className="relative">
              <GraduationCap className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="university"
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="e.g. UT Austin, UC Berkeley"
                required
                className="w-full bg-white border border-slate-300 rounded-sm pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1B365D] focus:ring-1 focus:ring-[#1B365D] transition-colors"
              />
            </div>
          </div>

          {/* Primary Officer Name */}
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-slate-700 mb-1">
              Primary Officer / President Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="w-full bg-white border border-slate-300 rounded-sm pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1B365D] focus:ring-1 focus:ring-[#1B365D] transition-colors"
              />
            </div>
          </div>

          {/* Officer Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
              Official Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="president@studentorg.edu"
                required
                className="w-full bg-white border border-slate-300 rounded-sm pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1B365D] focus:ring-1 focus:ring-[#1B365D] transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                className="w-full bg-white border border-slate-300 rounded-sm pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1B365D] focus:ring-1 focus:ring-[#1B365D] transition-colors"
              />
            </div>
            {password && password.length > 0 && password.length < 8 && (
              <p className="text-[11px] text-[#D97706] mt-1 font-medium">Must be at least 8 characters</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                className={`w-full bg-white border rounded-sm pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors ${
                  confirmPassword && password !== confirmPassword
                    ? "border-[#FCA5A5] focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]"
                    : "border-slate-300 focus:border-[#1B365D] focus:ring-1 focus:ring-[#1B365D]"
                }`}
              />
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-[11px] text-[#DC2626] mt-1 font-medium">Passwords do not match</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="orgos-btn orgos-btn--primary w-full h-10 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering Organization...</span>
              </>
            ) : (
              <>
                <Building className="w-4 h-4" />
                <span>Register Organization</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="mt-5 text-center text-xs text-slate-500 space-y-1">
          <p>
            Joining an existing club?{" "}
            <Link href="/signup" className="font-semibold text-[#1B365D] hover:underline">
              Sign up as member
            </Link>
          </p>
          <p>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#1B365D] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
