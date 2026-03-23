"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

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
        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-black/[0.06] hover:text-[#0f0f0f] dark:hover:bg-white/[0.06] dark:hover:text-[#f0efec]"
            aria-label="User menu"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
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
                  href="/settings"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-black/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.04]"
                >
                  Settings
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
        href="/signup"
        className="rounded-full bg-[#c8922a] px-4 py-1.5 text-sm font-medium text-[#0f0f0f] shadow-[0_2px_8px_rgb(200,146,42,0.3)] transition-all hover:bg-[#b17f24] hover:shadow-[0_3px_10px_rgb(200,146,42,0.4)] dark:shadow-[0_2px_8px_rgb(200,146,42,0.4)]"
      >
        Subscribe
      </Link>
    </div>
  );
}

export function NavLinks() {
  return (
    <div className="hidden items-center gap-6 sm:flex">
      <Link
        href="/lens"
        className="text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
      >
        The Lens
      </Link>
      <Link
        href="/indexes"
        className="text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
      >
        Indexes
      </Link>
      <Link
        href="/about"
        className="text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
      >
        About
      </Link>
    </div>
  );
}
