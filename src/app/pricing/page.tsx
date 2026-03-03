import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Albis is free while we're in early access. Sign up for the daily briefing — it's on us.",
  openGraph: {
    title: "Pricing | Albis",
    description: "Albis is free while we're in early access. Sign up for the daily briefing — it's on us.",
  },
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-2xl px-6 py-20 md:py-32">
        <div className="text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#c8922a]/20 to-[#c8922a]/10">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#c8922a]"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1 className="mb-4 font-[family-name:var(--font-playfair)] text-4xl font-bold text-[#0f0f0f] md:text-5xl dark:text-[#f0efec]">
            Albis is free while we&rsquo;re in early access
          </h1>

          {/* Subheading */}
          <p className="mb-8 text-lg text-zinc-600 dark:text-zinc-400">
            Sign up for the daily briefing &mdash; it&rsquo;s on us.
          </p>

          {/* CTA */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-[#1a3a5c] px-8 py-3 text-base font-medium text-white shadow-[0_2px_8px_rgb(26,58,92,0.3)] transition-all hover:bg-[#243f66] hover:shadow-[0_3px_10px_rgb(26,58,92,0.4)] dark:shadow-[0_2px_8px_rgb(26,58,92,0.4)]"
            >
              Get started free
            </Link>
            <Link
              href="/briefing"
              className="inline-flex items-center justify-center rounded-full border border-black/[0.08] bg-transparent px-8 py-3 text-base font-medium text-[#0f0f0f] transition-colors hover:bg-black/[0.04] dark:border-white/[0.08] dark:text-[#f0efec] dark:hover:bg-white/[0.04]"
            >
              See the briefing
            </Link>
          </div>

          {/* Note */}
          <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-500">
            We&rsquo;ll introduce paid plans later. For now, enjoy the full experience at no cost.
          </p>
        </div>
      </div>
    </main>
  );
}
