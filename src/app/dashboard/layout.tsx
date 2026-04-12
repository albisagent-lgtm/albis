"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Today" },
  { href: "/dashboard/briefings", label: "Archive" },
  { href: "/dashboard/profile", label: "Company Profile" },
  { href: "/dashboard/subscription", label: "Subscription" },
  { href: "/account", label: "Account" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login?redirect=/dashboard");
        return;
      }

      // Check for company profile
      const { data: profile } = await supabase
        .from("company_profiles")
        .select("company_name, onboarding_completed")
        .eq("owner_id", user.id)
        .single();

      if (!profile?.onboarding_completed) {
        router.push("/onboarding/company");
        return;
      }

      setCompanyName(profile.company_name || "");
      setChecking(false);
    });
  }, [router]);

  if (checking) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#f8f7f4] dark:bg-[#0f0f0f]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#c8922a]" />
      </main>
    );
  }

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      {/* Dashboard header */}
      <div className="border-b border-black/[0.07] bg-white/80 backdrop-blur-sm dark:border-white/[0.07] dark:bg-[#0f0f0f]/80">
        <div className="mx-auto max-w-4xl px-6">
          {/* Company name */}
          <div className="flex items-baseline justify-between pt-6 pb-4">
            <div>
              <Link
                href="/dashboard"
                className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]"
              >
                {companyName}
              </Link>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#c8922a]">
                Intelligence Dashboard
              </p>
            </div>
            <Link
              href="/"
              className="text-xs text-zinc-400 transition-colors hover:text-[#0f0f0f] dark:text-zinc-600 dark:hover:text-[#f0efec]"
            >
              albis.news
            </Link>
          </div>

          {/* Nav tabs */}
          <nav className="-mb-px flex gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "border-[#c8922a] text-[#0f0f0f] dark:text-[#f0efec]"
                    : "border-transparent text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}
