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
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [organization, setOrg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!name || !email || !password || !confirmPassword || !organization.trim()) {
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
            full_name: name,
            organization: organization.trim(),
            role: "member",
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        setSuccessMessage("Account created successfully! Redirecting...");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1500);
      } else if (data.user) {
        setSuccessMessage("Account created! Please check your email to verify your account.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[var(--orgos-bg-app)] text-[var(--orgos-text-primary)] relative px-6 py-12 selection:bg-[#1B365D] selection:text-white">
      {/* Back to Home Link */}
      <div className="w-full max-w-md mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#1B365D] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Card Container */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-sm p-7 sm:p-8 shadow-sm relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="h-9 w-9 mx-auto rounded-sm bg-[#1B365D] flex items-center justify-center font-bold text-lg text-white shadow-sm mb-3">
            O
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#1B365D]">Create an Account</h1>
          <p className="text-xs text-slate-500 mt-1">
            Join your student organization or sign up for OrgOS
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

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                required
                className="w-full bg-white border border-slate-300 rounded-sm pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1B365D] focus:ring-1 focus:ring-[#1B365D] transition-colors"
              />
            </div>
          </div>

          {/* Organization Name */}
          <div>
            <label htmlFor="organization" className="block text-xs font-semibold text-slate-700 mb-1">
              Organization Name
            </label>
            <div className="relative">
              <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="organization"
                type="text"
                value={organization}
                onChange={(e) => setOrg(e.target.value)}
                placeholder="e.g. Robotics Club, Hindu Yuva"
                required
                className="w-full bg-white border border-slate-300 rounded-sm pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1B365D] focus:ring-1 focus:ring-[#1B365D] transition-colors"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@studentorg.edu"
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

          {/* Actions Section */}
          <div className="space-y-2.5 pt-2">
            {/* Primary Action: Create Account */}
            <button
              type="submit"
              disabled={isLoading}
              className="orgos-btn orgos-btn--primary w-full h-10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-2.5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative bg-white px-2.5 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                or starting a new club?
              </div>
            </div>

            {/* Secondary Action: Link directly to /register-org */}
            <Link
              href="/register-org"
              className="orgos-btn orgos-btn--secondary w-full h-10"
            >
              <Building className="w-4 h-4 text-[#1B365D]" />
              <span>Register a New Organization</span>
            </Link>

            <p className="text-[11px] text-center text-slate-500 leading-relaxed px-1">
              If your organization isn&apos;t on OrgOS yet, register it here to invite officers and members.
            </p>
          </div>
        </form>

        {/* Footer Navigation */}
        <div className="mt-5 text-center text-xs text-slate-500">
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
