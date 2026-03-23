"use client";

import { EmailCapture } from "./email-capture";

export function BlogCTA() {
  return (
    <div className="mt-16 border-t border-black/[0.07] pt-12 dark:border-white/[0.06]">
      {/* Email capture section */}
      <div className="rounded-2xl border border-black/[0.07] bg-[#f2f0eb] p-8 text-center dark:border-white/[0.06] dark:bg-[#111111] md:p-10">
        <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] md:text-3xl">
          Get the daily briefing — free
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 md:text-base">
          Join thousands of curious minds who get Albis delivered every morning. See the world's stories from all perspectives, not just one.
        </p>
        
        <div className="mt-8">
          <EmailCapture variant="hero" source="blog-cta" />
        </div>

        <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
          Free daily intelligence • 7 global perspectives • Cancel anytime
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400 dark:text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            No data selling
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            No algorithmic manipulation
          </span>
        </div>
      </div>
    </div>
  );
}
