"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { NotificationsMenu } from "./notifications-menu";
import type { User } from "@supabase/supabase-js";

function cleanProfileHandle(value: unknown) {
  const clean = String(value || "").trim().replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 80);
  return clean || null;
}

function profileHrefForUser(user: User | null) {
  if (!user) return "/login";
  const metadata = user.user_metadata || {};
  const handle = cleanProfileHandle(metadata.username) || cleanProfileHandle(metadata.name) || cleanProfileHandle(user.email?.split("@")[0]);
  return handle ? `/u/${encodeURIComponent(handle)}` : "/profile";
}

export function NavAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setMounted(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!mounted) {
    return <div className="flex items-center gap-3 w-[100px]" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <NotificationsMenu />
        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-8 items-center gap-2 rounded-full border border-black/[0.07] bg-white/80 px-3 text-sm text-zinc-600 transition-colors hover:bg-black/[0.04] dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.06]"
            aria-label="User menu"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="hidden sm:inline max-w-[120px] truncate">{user.user_metadata?.username ? `@${user.user_metadata.username}` : user.user_metadata?.name || user.email?.split("@")[0]}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-black/[0.07] bg-white p-2 shadow-lg dark:border-white/[0.07] dark:bg-[#1a1a1a]">
                <div className="border-b border-black/[0.07] px-3 py-2 dark:border-white/[0.07]">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Signed in as</p>
                  <p className="text-sm font-medium text-[#0f0f0f] dark:text-[#f0efec] truncate">
                    {user.email}
                  </p>
                </div>
                <Link
                  href={profileHrefForUser(user)}
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-black/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.04]"
                >
                  Profile
                </Link>
                <Link
                  href="/account"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-black/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.04]"
                >
                  Account settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-black/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.04]"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="text-sm text-zinc-500 transition-colors hover:text-[#0f0f0f] dark:text-zinc-400 dark:hover:text-[#f0efec]"
      >
        Sign in
      </Link>
      <Link
        href="/register"
        className="hidden sm:inline text-sm text-zinc-500 transition-colors hover:text-[#0f0f0f] dark:text-zinc-400 dark:hover:text-[#f0efec]"
      >
        Sign up
      </Link>
      <Link
        href="/create"
        className="rounded-full bg-[#c8922a] px-4 py-1.5 text-sm font-medium text-[#0f0f0f] shadow-[0_2px_8px_rgb(200,146,42,0.3)] transition-all hover:bg-[#b17f24] hover:shadow-[0_3px_10px_rgb(200,146,42,0.4)] dark:shadow-[0_2px_8px_rgb(200,146,42,0.4)]"
      >
        Create
      </Link>
    </div>
  );
}

const BASE_DESKTOP_NAV = [
  { href: "/", label: "Feed" },
  { href: "/read", label: "Read" },
  { href: "/create", label: "Create" },
  { href: "/about", label: "About" },
];

export function NavLinks() {
  const [profileHref, setProfileHref] = useState("/profile");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setProfileHref(profileHrefForUser(user));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setProfileHref(profileHrefForUser(session?.user ?? null));
    });
    return () => subscription.unsubscribe();
  }, []);

  const desktopNav = [...BASE_DESKTOP_NAV, { href: profileHref, label: "Profile" }];

  return (
    <div className="hidden items-center gap-5 lg:flex">
      {desktopNav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="font-[family-name:var(--font-inter)] text-[11px] font-medium tracking-wide uppercase text-zinc-500 dark:text-zinc-400 hover:text-[#0f0f0f] dark:hover:text-[#f0efec] transition-colors"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
