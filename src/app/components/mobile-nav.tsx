"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { NotificationsNavLink } from "./notifications-menu";

function cleanProfileHandle(value: unknown) {
  const clean = String(value || "").trim().replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 80);
  return clean || null;
}

function profileHrefFromUser(user: { email?: string; user_metadata?: Record<string, unknown> } | null) {
  if (!user) return "/login";
  const metadata = user.user_metadata || {};
  const handle = cleanProfileHandle(metadata.username) || cleanProfileHandle(metadata.name) || cleanProfileHandle(user.email?.split("@")[0]);
  return handle ? `/u/${encodeURIComponent(handle)}` : "/profile";
}

const NAV_ITEMS = [
  {
    href: "/",
    label: "Feed",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    href: "/read",
    label: "Read",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    href: "/create",
    label: "Create",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

const MORE_LINKS = [
  { href: "/?filter=weather", label: "Weather" },
  { href: "/signals", label: "Events archive" },
  { href: "/indexes", label: "Indexes" },
  { href: "/world", label: "World" },
  { href: "/money", label: "Money" },
  { href: "/tech", label: "Tech" },
  { href: "/climate", label: "Climate" },
  { href: "/life-systems", label: "Life Systems" },
  { href: "/perspectives", label: "Perspectives" },
  { href: "/about", label: "About" },
];

export function MobileNav() {
  const pathname = usePathname();
  const lastScrollRef = useRef(0);
  const navRef = useRef<HTMLElement>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileHref, setProfileHref] = useState("/profile");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setProfileHref(profileHrefFromUser(user)));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setProfileHref(profileHrefFromUser(session?.user ?? null));
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close menu on navigation
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentScroll = window.scrollY;
        const topNav = document.querySelector(".nav-auto-hide");
        if (topNav) {
          if (currentScroll > lastScrollRef.current && currentScroll > 80) {
            topNav.classList.add("nav-hidden");
          } else {
            topNav.classList.remove("nav-hidden");
          }
        }
        if (navRef.current) {
          if (currentScroll > lastScrollRef.current && currentScroll > 80) {
            navRef.current.style.transform = "translateY(100%)";
            setMoreOpen(false);
          } else {
            navRef.current.style.transform = "translateY(0)";
          }
        }
        lastScrollRef.current = currentScroll;
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Backdrop */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* Slide-up "More" panel */}
      <div
        className={`fixed bottom-[56px] left-0 right-0 z-50 transform transition-all duration-200 md:hidden ${
          moreOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
      >
        <div className="mx-3 mb-2 rounded-xl border border-black/[0.07] bg-[#f8f7f4] p-3 shadow-lg dark:border-white/[0.06] dark:bg-[#1a1a1a]">
          <div className="grid grid-cols-3 gap-1">
            {MORE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2.5 text-center text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href) && link.href !== "/"
                    ? "bg-[#c8922a]/10 text-[#c8922a]"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/[0.05]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom nav bar */}
      <nav
        ref={navRef}
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/[0.07] bg-[#f8f7f4]/95 backdrop-blur-xl transition-transform duration-300 md:hidden dark:border-white/[0.06] dark:bg-[#0f0f0f]/95"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
      >
        <div className="flex items-center justify-around px-2 py-1">
          {NAV_ITEMS.map((item) => {
            const href = item.label === "Profile" ? profileHref : item.href;
            const active =
              (href === "/" && pathname === "/") ||
              (href !== "/" && pathname === href);
            return (
              <Link
                key={item.label}
                href={href}
                className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "text-[#c8922a] dark:text-[#c8922a]"
                    : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
          <NotificationsNavLink />
          {/* More button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              moreOpen
                ? "text-[#c8922a]"
                : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
