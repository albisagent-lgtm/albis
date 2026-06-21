"use client";

import Link from "next/link";

const BASE_DESKTOP_NAV = [
  { href: "/", label: "Today" },
  { href: "/read", label: "Read" },
  { href: "/life-systems", label: "Life Systems" },
  { href: "/indexes", label: "Indexes" },
  { href: "/compare", label: "Compare" },
  { href: "/about", label: "About" },
];

export function NavAuth() {
  return (
    <Link
      href="/read"
      className="rounded-full bg-[#1a3a5c] px-4 py-1.5 text-sm font-medium text-white shadow-[0_2px_8px_rgb(26,58,92,0.25)] transition-all hover:bg-[#243f66]"
    >
      Read latest
    </Link>
  );
}

export function NavLinks() {
  return (
    <div className="hidden items-center gap-5 lg:flex">
      {BASE_DESKTOP_NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="font-[family-name:var(--font-inter)] text-[11px] font-medium tracking-wide uppercase text-zinc-500 transition-colors hover:text-[#0f0f0f] dark:text-zinc-400 dark:hover:text-[#f0efec]"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
