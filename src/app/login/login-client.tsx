"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setLocalUser, getPreferences } from "@/lib/preferences";

export default function LoginClient() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    if (!email || !password) {
      setError("Please enter your email and password.");
      setLoading(false);
      return;
    }

    setLocalUser({ email, createdAt: new Date().toISOString() });
    const prefs = getPreferences();
    router.push(prefs.onboardingComplete ? "/briefing" : "/onboarding");
  }

  return (
    <div className="relative flex min-h-[90vh] items-center justify-center bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/40 via-transparent to-transparent dark:from-amber-950/10" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/25 to-transparent" />

      <div className="animate-fade-in-up relative w-full max-w-sm px-6">
        {/* Logo mark */}
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="font-[family-name:var(--font-playfair)] text-2xl italic font-semibold text-[#0f0f0f] dark:text-[#f0efec]"
          >
            Albis
          </Link>
          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            News intelligence, not noise.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-black/[0.07] bg-white p-8 shadow-[0_4px_24px_rgb(0,0,0,0.06)] dark:border-white/[0.07] dark:bg-white/[0.04] dark:shadow-none">
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to your Albis account.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Email address
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="h-11 rounded-xl border border-black/[0.1] bg-[#f8f7f4] px-3.5 text-sm text-[#0f0f0f] placeholder:text-zinc-400 focus:border-[#1a3a5c] focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/15 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-[#f0efec] dark:placeholder:text-zinc-600 dark:focus:border-[#4a7baa] dark:focus:ring-[#4a7baa]/15"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs text-[#c8922a] hover:underline"
                >
                  Forgot?
                </a>
              </div>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Your password"
                className="h-11 rounded-xl border border-black/[0.1] bg-[#f8f7f4] px-3.5 text-sm text-[#0f0f0f] placeholder:text-zinc-400 focus:border-[#1a3a5c] focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/15 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-[#f0efec] dark:placeholder:text-zinc-600 dark:focus:border-[#4a7baa] dark:focus:ring-[#4a7baa]/15"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-12 items-center justify-center rounded-xl bg-[#1a3a5c] text-sm font-semibold text-white shadow-[0_2px_12px_rgb(26,58,92,0.3)] transition-all hover:bg-[#243f66] hover:shadow-[0_4px_16px_rgb(26,58,92,0.4)] disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        {/* Switch */}
        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No account?{" "}
          <Link
            href="/signup"
            className="font-medium text-[#1a3a5c] hover:underline dark:text-[#7ab0d8]"
          >
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
