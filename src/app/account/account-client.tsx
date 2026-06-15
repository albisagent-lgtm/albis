"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserAvatar } from "@/app/components/user-avatar";
import { trackLaunchAttributionEvent } from "@/app/components/analytics-events";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Profile {
  name: string | null;
  role: string | null;
  created_at: string | null;
  stripe_customer_id: string | null;
  subscription_status: string | null;
  subscription_tier: string | null;
  subscription_period_end: string | null;
}

export default function AccountClient() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const router = useRouter();

  // Profile editing
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState("");

  // Password editing
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Verification
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      const { data } = await supabase
        .from("profiles")
        .select("name, role, created_at, stripe_customer_id, subscription_status, subscription_tier, subscription_period_end, is_test_account, trial_end_at")
        .eq("id", user.id)
        .single();

      setProfile(data);
      setName(data?.name || String(user.user_metadata?.name || ""));
      setUsername(String(user.user_metadata?.username || "").replace(/^@+/, ""));
      setBio(String(user.user_metadata?.bio || ""));
      setAvatarUrl(String(user.user_metadata?.avatar_url || ""));
      setLoading(false);
      trackLaunchAttributionEvent("account_view", {
        has_username: Boolean(user.user_metadata?.username),
        has_bio: Boolean(user.user_metadata?.bio),
      });
    });
  }, [router]);

  async function handleAvatarUpload(file: File | null) {
    if (!file) return;
    setNameError("");
    setNameSuccess(false);
    setAvatarUploading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.avatarUrl) {
        setNameError(data.error || "Profile picture upload failed.");
        return;
      }
      setAvatarUrl(data.avatarUrl);
      setNameSuccess(true);
      router.refresh();
      setTimeout(() => setNameSuccess(false), 3000);
    } catch {
      setNameError("Profile picture upload failed. Please try again.");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleNameSave() {
    if (!user) return;
    const cleanUsername = username.trim().replace(/^@+/, "").toLowerCase();
    if (cleanUsername && !/^[a-z0-9_]{3,24}$/.test(cleanUsername)) {
      setNameError("Username must be 3–24 characters and use only letters, numbers, or underscores.");
      return;
    }
    setNameSaving(true);
    setNameError("");
    setNameSuccess(false);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ name: name.trim() })
        .eq("id", user.id);

      if (error) {
        setNameError(error.message);
      } else {
        setNameSuccess(true);
        // Also update user metadata so nav/profile cards show updated public account details.
        await supabase.auth.updateUser({ data: { name: name.trim(), username: cleanUsername || null, bio: bio.trim() || null, avatar_url: avatarUrl.trim() || null } });
        setTimeout(() => setNameSuccess(false), 3000);
      }
    } catch {
      setNameError("Failed to save. Please try again.");
    } finally {
      setNameSaving(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess(true);
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(false), 3000);
      }
    } catch {
      setPasswordError("Failed to update password. Please try again.");
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleResendVerification() {
    if (!user?.email) return;
    setResending(true);
    try {
      const supabase = createClient();
      await supabase.auth.resend({ type: "signup", email: user.email });
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch {
      // ignore
    } finally {
      setResending(false);
    }
  }

  async function handleManage() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // ignore
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#c8922a]" />
      </main>
    );
  }

  const isVerified = user?.email_confirmed_at != null;
  const hasSubscription = profile?.subscription_status === "active" || profile?.subscription_status === "trialing";
  const tierLabel = profile?.subscription_tier
    ? profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1)
    : null;
  const periodEnd = profile?.subscription_period_end
    ? new Date(profile.subscription_period_end).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
  const publicHandle = username.trim().replace(/^@+/, "").toLowerCase();
  const publicProfileHref = publicHandle ? `/u/${encodeURIComponent(publicHandle)}` : null;
  const profileSteps = [
    { label: "Add a public handle", done: Boolean(publicHandle) },
    { label: "Add a recognisable name", done: Boolean(name.trim()) },
    { label: "Add a short public bio", done: Boolean(bio.trim()) },
  ];
  const completedProfileSteps = profileSteps.filter((step) => step.done).length;

  const cardClass = "rounded-2xl border border-black/[0.07] bg-white p-7 dark:border-white/[0.07] dark:bg-white/[0.03]";
  const sectionHeader = "text-sm font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500";
  const inputClass = "h-11 w-full rounded-xl border border-black/[0.1] bg-[#f8f7f4] px-3.5 text-sm text-[#0f0f0f] placeholder:text-zinc-400 focus:border-[#c8922a] focus:outline-none focus:ring-2 focus:ring-[#c8922a]/15 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-[#f0efec] dark:placeholder:text-zinc-600 dark:focus:border-[#c8922a] dark:focus:ring-[#c8922a]/15";
  const textareaClass = "min-h-24 w-full rounded-xl border border-black/[0.1] bg-[#f8f7f4] px-3.5 py-3 text-sm text-[#0f0f0f] placeholder:text-zinc-400 focus:border-[#c8922a] focus:outline-none focus:ring-2 focus:ring-[#c8922a]/15 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-[#f0efec] dark:placeholder:text-zinc-600 dark:focus:border-[#c8922a] dark:focus:ring-[#c8922a]/15";
  const btnPrimary = "inline-flex h-10 items-center justify-center rounded-full bg-[#c8922a] px-6 text-sm font-medium text-white hover:bg-[#c8922a]/90 disabled:opacity-60";
  const successMsg = "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400";
  const errorMsg = "rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400";

  return (
    <main className="bg-[#f8f7f4] dark:bg-[#0f0f0f] min-h-screen">
      <section className="mx-auto max-w-xl px-6 py-20">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
          Account
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Manage your profile and account settings.
        </p>

        <div className="mt-10 space-y-6">
          {/* Email verification warning */}
          {!isVerified && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="flex items-start gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Email not verified
                  </p>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                    Please check your inbox for a verification link, or resend it below.
                  </p>
                  <button
                    onClick={handleResendVerification}
                    disabled={resending || resendSuccess}
                    className="mt-3 text-sm font-medium text-amber-800 underline hover:no-underline disabled:opacity-60 dark:text-amber-300"
                  >
                    {resendSuccess ? "Verification email sent" : resending ? "Sending…" : "Resend verification email"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Profile section */}
          <div className={cardClass}>
            <h2 className={sectionHeader}>Profile</h2>
            <div className="mt-5 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Username
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/^@+/, ""))}
                    placeholder="readername"
                    minLength={3}
                    maxLength={24}
                    pattern="[A-Za-z0-9_]{3,24}"
                    className={`${inputClass} pl-7`}
                  />
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  This is the public handle shown on cards, posts, and conversations.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Profile picture
                </label>
                <div className="flex items-center gap-4">
                  <UserAvatar name={name || username || user?.email || "Albis user"} imageUrl={avatarUrl} size="lg" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-black/[0.10] bg-white px-5 text-sm font-medium text-[#111] hover:border-[#c8922a]/50 dark:border-white/[0.10] dark:bg-white/[0.04] dark:text-[#f0efec]">
                      {avatarUploading ? "Uploading…" : "Upload image"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="sr-only"
                        disabled={avatarUploading}
                        onChange={(e) => void handleAvatarUpload(e.target.files?.[0] || null)}
                      />
                    </label>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      JPG, PNG, WebP, or GIF under 4MB.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Public bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 280))}
                  placeholder="A short note about what you share or follow on Albis."
                  maxLength={280}
                  className={textareaClass}
                />
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {280 - bio.length} characters left. New cards can carry this profile context.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Email address
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className={`${inputClass} opacity-60 cursor-not-allowed`}
                />
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Contact support to change your email address.
                </p>
              </div>
              {nameError && <div className={errorMsg}>{nameError}</div>}
              {nameSuccess && <div className={successMsg}>Profile updated.</div>}
              <button
                onClick={handleNameSave}
                disabled={
                  nameSaving ||
                  avatarUploading ||
                  (name.trim() === (profile?.name || String(user?.user_metadata?.name || "")) &&
                    username.trim().replace(/^@+/, "").toLowerCase() === String(user?.user_metadata?.username || "") &&
                    bio.trim() === String(user?.user_metadata?.bio || "") &&
                    avatarUrl.trim() === String(user?.user_metadata?.avatar_url || ""))
                }
                className={btnPrimary}
              >
                {nameSaving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>

          {/* Public profile cue */}
          <div className={cardClass}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className={sectionHeader}>Public profile</h2>
                <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                  Help people recognise, follow, and return to your Albis posts. Only your public handle, name, bio, picture, and contributions appear here.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[#f8f7f4] px-3 py-1 text-xs font-semibold text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-300">
                {completedProfileSteps}/3 ready
              </span>
            </div>
            <div className="mt-5 space-y-2">
              {profileSteps.map((step) => (
                <div key={step.label} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <span className={step.done ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-300 dark:text-zinc-600"}>
                    {step.done ? "✓" : "○"}
                  </span>
                  <span>{step.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {publicProfileHref ? (
                <Link href={publicProfileHref} className={btnPrimary}>
                  View public profile
                </Link>
              ) : (
                <span className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-100 px-5 text-sm font-medium text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-300">
                  Choose a handle to unlock your profile link
                </span>
              )}
              <Link href="/people" className="inline-flex h-10 items-center justify-center rounded-full border border-black/[0.10] px-5 text-sm font-medium text-[#111] hover:border-[#c8922a]/50 dark:border-white/[0.10] dark:text-[#f0efec]">
                Find people to follow
              </Link>
            </div>
          </div>

          {/* Password section */}
          <div className={cardClass}>
            <h2 className={sectionHeader}>Password</h2>
            <form onSubmit={handlePasswordSave} className="mt-5 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  minLength={8}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Repeat your new password"
                  minLength={8}
                  className={inputClass}
                />
              </div>
              {passwordError && <div className={errorMsg}>{passwordError}</div>}
              {passwordSuccess && <div className={successMsg}>Password updated.</div>}
              <button
                type="submit"
                disabled={passwordSaving || !newPassword}
                className={btnPrimary}
              >
                {passwordSaving ? "Updating…" : "Update password"}
              </button>
            </form>
          </div>

          {/* Account status section */}
          <div className={cardClass}>
            <h2 className={sectionHeader}>Account status</h2>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Email verification</span>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Unverified
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Plan</span>
                <span className="text-sm font-medium text-[#0f0f0f] dark:text-[#f0efec]">
                  {tierLabel || (profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : "Free")}
                </span>
              </div>
              {memberSince && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Member since</span>
                  <span className="text-sm text-[#0f0f0f] dark:text-[#f0efec]">{memberSince}</span>
                </div>
              )}
            </div>
          </div>

          {/* Subscription section */}
          <div className={cardClass}>
            <h2 className={sectionHeader}>Subscription</h2>

            {hasSubscription ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {profile?.subscription_status === "trialing" ? "Trial" : "Active"}
                  </span>
                  <span className="text-sm font-medium text-[#0f0f0f] dark:text-[#f0efec]">
                    {tierLabel} plan
                  </span>
                </div>

                {periodEnd && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {profile?.subscription_status === "trialing"
                      ? `Trial ends ${periodEnd}`
                      : `Renews ${periodEnd}`}
                  </p>
                )}

                <button
                  onClick={handleManage}
                  disabled={portalLoading}
                  className={btnPrimary}
                >
                  {portalLoading ? "Loading…" : "Manage subscription"}
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    Free plan
                  </span>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  More features coming soon. For now, enjoy Albis completely free.
                </p>
                <Link
                  href="/archive"
                  className={btnPrimary}
                >
                  View today&apos;s briefing
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
