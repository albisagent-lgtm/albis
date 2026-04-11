"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetConfirmClient() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);

  // Verify there's an active session (user clicked the reset link)
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        // No session — the reset link was invalid or expired
        router.push("/reset-password?error=expired");
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-[90vh] items-center justify-center bg-[#f8f7f4] dark:bg-[#0f0f0f]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#c8922a]" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[90vh] items-center justify-center bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/40 via-transparent to-transparent dark:from-amber-950/10" />

      <div className="animate-fade-in-up relative w-full max-w-sm px-6">
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="font-[family-name:var(--font-playfair)] text-2xl italic font-semibold text-[#0f0f0f] dark:text-[#f0efec]"
          >
            Albis
          </Link>
        </div>

        <div className="rounded-2xl border border-black/[0.07] bg-white p-8 shadow-[0_4px_24px_rgb(0,0,0,0.06)] dark:border-white/[0.07] dark:bg-white/[0.04] dark:shadow-none">
          {success ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                Password updated
              </h1>
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                Your password has been changed successfully.
              </p>
              <Link
                href="/account"
                className="mt-6 inline-flex h-10 items-center rounded-xl px-5 text-sm font-medium text-[#c8922a] hover:underline"
              >
                Go to your account
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                Set new password
              </h1>
              <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                Enter your new password below.
              </p>

              <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    New password
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-xl border border-black/[0.1] bg-[#f8f7f4] px-3.5 text-sm text-[#0f0f0f] placeholder:text-zinc-400 focus:border-[#c8922a] focus:outline-none focus:ring-2 focus:ring-[#c8922a]/15 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-[#f0efec] dark:placeholder:text-zinc-600 dark:focus:border-[#c8922a] dark:focus:ring-[#c8922a]/15"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="Repeat your new password"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 rounded-xl border border-black/[0.1] bg-[#f8f7f4] px-3.5 text-sm text-[#0f0f0f] placeholder:text-zinc-400 focus:border-[#c8922a] focus:outline-none focus:ring-2 focus:ring-[#c8922a]/15 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-[#f0efec] dark:placeholder:text-zinc-600 dark:focus:border-[#c8922a] dark:focus:ring-[#c8922a]/15"
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex h-12 items-center justify-center rounded-xl bg-[#c8922a] text-sm font-semibold text-white shadow-[0_2px_12px_rgb(200,146,42,0.3)] transition-all hover:bg-[#b17f24] disabled:opacity-50"
                >
                  {loading ? "Updating…" : "Set new password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
