"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Today",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    href: "/world",
    label: "World",
    matchPath: "/world",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    href: "/trending",
    label: "Trending",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    href: "/search",
    label: "Search",
    matchPath: "/search",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    href: "/about",
    label: "More",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
      </svg>
    ),
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const lastScrollRef = useRef(0);
  const navRef = useRef<HTMLElement>(null);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentScroll = window.scrollY;
        // Hide/show top nav
        const topNav = document.querySelector(".nav-auto-hide");
        if (topNav) {
          if (currentScroll > lastScrollRef.current && currentScroll > 80) {
            topNav.classList.add("nav-hidden");
          } else {
            topNav.classList.remove("nav-hidden");
          }
        }
        // Hide/show bottom mobile nav
        if (navRef.current) {
          if (currentScroll > lastScrollRef.current && currentScroll > 80) {
            navRef.current.style.transform = "translateY(100%)";
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
    <nav
      ref={navRef}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/[0.07] bg-[#f8f7f4]/95 backdrop-blur-xl transition-transform duration-300 md:hidden dark:border-white/[0.06] dark:bg-[#0f0f0f]/95"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
    >
      <div className="flex items-center justify-around px-2 py-1">
        {NAV_ITEMS.map((item) => {
          const active =
            (item.href === "/" && pathname === "/") ||
            (item.href !== "/" && pathname === item.href) ||
            ("matchPath" in item && item.matchPath && pathname.startsWith(item.matchPath));
          return (
            <Link
              key={item.label}
              href={item.href}
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
      </div>
    </nav>
  );
}
