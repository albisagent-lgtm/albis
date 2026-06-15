"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { captureLaunchAttribution, getLaunchAttribution, getLaunchAttributionSearch, trackLaunchAttributionEvent } from "@/app/components/analytics-events";

export default function RegisterClient() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [hasLaunchAttribution, setHasLaunchAttribution] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push("/account");
      } else {
        const attribution = captureLaunchAttribution();
        setHasLaunchAttribution(Boolean(attribution?.utm_source || attribution?.utm_campaign || attribution?.utm_content || attribution?.ref));
        setCheckingAuth(false);
      }
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const name = (form.get("name") as string).trim();
    const username = (form.get("username") as string).trim().replace(/^@+/, "").toLowerCase();
    const email = (form.get("email") as string).trim();
    const password = form.get("password") as string;
    const confirmPassword = form.get("confirmPassword") as string;

    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (username && !/^[a-z0-9_]{3,24}$/.test(username)) {
      setError("Username must be 3–24 characters and use only letters, numbers, or underscores.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const attribution = captureLaunchAttribution() || getLaunchAttribution();
      const attributionSearch = getLaunchAttributionSearch();
      const nextPath = `/account${attributionSearch}`;
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            username: username || null,
            launch_utm_source: attribution?.utm_source || null,
            launch_utm_medium: attribution?.utm_medium || null,
            launch_utm_campaign: attribution?.utm_campaign || null,
            launch_utm_content: attribution?.utm_content || null,
            launch_ref: attribution?.ref || null,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // If user already exists and is confirmed, Supabase returns a user with
      // identities = []. Let the user know.
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError("An account with this email already exists. Please sign in instead.");
        setLoading(false);
        return;
      }

      // Update the profile with the name (trigger may have already done this,
      // but ensure it's set)
      if (data.user) {
        const adminSupabase = createClient();
        await adminSupabase
          .from("profiles")
          .update({ name })
          .eq("id", data.user.id);
      }

      trackLaunchAttributionEvent("register_success", {
        has_username: Boolean(username),
        has_launch_context: Boolean(attribution),
      });

      setSuccess(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-[90vh] items-center justify-center bg-[#f8f7f4] dark:bg-[#0f0f0f]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#c8922a]" />
      </div>
    );
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
          {success ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                Check your email
              </h1>
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                We&apos;ve sent a verification link to your email address. Click the link to activate your account.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex h-10 items-center rounded-xl px-5 text-sm font-medium text-[#c8922a] hover:underline"
              >
                Go to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                Become a founding tester
              </h1>
              <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                Save what you find, follow people, and help shape Albis early.
              </p>
              <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                Free. No spam.
              </p>
              {hasLaunchAttribution && (
                <p className="mt-3 rounded-xl border border-[#c8922a]/20 bg-[#c8922a]/10 px-3 py-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                  We remember how you found Albis for launch learning only — never on your public profile.
                </p>
              )}

              <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Full name
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Your name"
                    className="h-11 rounded-xl border border-black/[0.1] bg-[#f8f7f4] px-3.5 text-sm text-[#0f0f0f] placeholder:text-zinc-400 focus:border-[#c8922a] focus:outline-none focus:ring-2 focus:ring-[#c8922a]/15 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-[#f0efec] dark:placeholder:text-zinc-600 dark:focus:border-[#c8922a] dark:focus:ring-[#c8922a]/15"
                  />
                </div>

                {/* Username */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Username <span className="font-normal text-zinc-400">optional</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400">@</span>
                    <input
                      name="username"
                      type="text"
                      autoComplete="username"
                      placeholder="readername"
                      minLength={3}
                      maxLength={24}
                      pattern="[A-Za-z0-9_]{3,24}"
                      className="h-11 w-full rounded-xl border border-black/[0.1] bg-[#f8f7f4] pl-7 pr-3.5 text-sm text-[#0f0f0f] placeholder:text-zinc-400 focus:border-[#c8922a] focus:outline-none focus:ring-2 focus:ring-[#c8922a]/15 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-[#f0efec] dark:placeholder:text-zinc-600 dark:focus:border-[#c8922a] dark:focus:ring-[#c8922a]/15"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    Used on your public profile if you choose one.
                  </p>
                </div>

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
                    className="h-11 rounded-xl border border-black/[0.1] bg-[#f8f7f4] px-3.5 text-sm text-[#0f0f0f] placeholder:text-zinc-400 focus:border-[#c8922a] focus:outline-none focus:ring-2 focus:ring-[#c8922a]/15 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-[#f0efec] dark:placeholder:text-zinc-600 dark:focus:border-[#c8922a] dark:focus:ring-[#c8922a]/15"
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    minLength={8}
                    className="h-11 rounded-xl border border-black/[0.1] bg-[#f8f7f4] px-3.5 text-sm text-[#0f0f0f] placeholder:text-zinc-400 focus:border-[#c8922a] focus:outline-none focus:ring-2 focus:ring-[#c8922a]/15 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-[#f0efec] dark:placeholder:text-zinc-600 dark:focus:border-[#c8922a] dark:focus:ring-[#c8922a]/15"
                  />
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Confirm password
                  </label>
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    minLength={8}
                    className="h-11 rounded-xl border border-black/[0.1] bg-[#f8f7f4] px-3.5 text-sm text-[#0f0f0f] placeholder:text-zinc-400 focus:border-[#c8922a] focus:outline-none focus:ring-2 focus:ring-[#c8922a]/15 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-[#f0efec] dark:placeholder:text-zinc-600 dark:focus:border-[#c8922a] dark:focus:ring-[#c8922a]/15"
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
                  className="mt-2 flex h-12 items-center justify-center rounded-xl bg-[#c8922a] text-sm font-semibold text-white shadow-[0_2px_12px_rgb(200,146,42,0.3)] transition-all hover:bg-[#b17f24] hover:shadow-[0_4px_16px_rgb(200,146,42,0.4)] disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating account…
                    </span>
                  ) : (
                    "Join as tester"
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Switch to login */}
        {!success && (
          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#c8922a] hover:underline dark:text-[#c8922a]"
            >
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
