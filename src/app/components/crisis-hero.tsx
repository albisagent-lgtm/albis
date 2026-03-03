"use client";

import Link from "next/link";
import { EmailCapture } from "./email-capture";

interface CrisisHeroProps {
  headline: string;
  url: string | null;
  mode?: "breaking" | "top-story";
}

export function CrisisHero({ headline, url, mode = "breaking" }: CrisisHeroProps) {
  const isBreaking = mode === "breaking";
  
  return (
    <section className={`relative flex flex-col justify-center min-h-[50svh] ${
      isBreaking 
        ? "bg-[#0f0f0f] border-b border-red-900/20" 
        : "bg-[#f8f7f4] dark:bg-[#0f0f0f] border-b border-[#c8922a]/10"
    }`}>
      <div className="pointer-events-none absolute inset-0 bg-subtle-grid opacity-30" />
      <div className={`pointer-events-none absolute -top-24 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full blur-3xl ${
        isBreaking ? "bg-red-900/10" : "bg-[#c8922a]/10"
      }`} />
      
      <div className="relative mx-auto w-full max-w-4xl px-space-6 py-space-16 md:py-space-24">
        <div className="text-center space-y-space-6">
          {/* Label with optional pulsing dot */}
          <div className="flex items-center justify-center gap-space-3">
            {isBreaking && (
              <span className="relative flex h-3 w-3 flex-shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
            )}
            <span className={`font-semibold tracking-[0.3em] uppercase text-sm md:text-base ${
              isBreaking ? "text-red-400" : "text-[#c8922a]"
            }`}>
              {isBreaking ? "Breaking News" : "Top Story"}
            </span>
          </div>

          {/* Big bold headline */}
          <h1 className={`animate-fade-in-up font-[family-name:var(--font-playfair)] text-3xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight px-4 ${
            isBreaking ? "text-[#f0efec]" : "text-[#0f0f0f] dark:text-[#f0efec]"
          }`}>
            {headline}
          </h1>

          {/* Read full coverage link */}
          {url && (
            <div className="animate-fade-in-up delay-100">
              <Link
                href={url}
                className="inline-flex items-center gap-2 text-base md:text-lg font-medium text-[#c8922a] hover:text-[#d4a23a] transition-colors font-[family-name:var(--font-source-serif)]"
              >
                Read full coverage &rarr;
              </Link>
            </div>
          )}

          {/* Compact email capture */}
          <div className="animate-fade-in-up delay-200 pt-space-6 max-w-lg mx-auto">
            <p className={`text-sm mb-space-3 font-[family-name:var(--font-source-serif)] ${
              isBreaking ? "text-zinc-400" : "text-zinc-500 dark:text-zinc-400"
            }`}>
              {isBreaking 
                ? "Get breaking news alerts delivered to your inbox"
                : "Get the daily briefing delivered to your inbox"
              }
            </p>
            <EmailCapture variant="hero" />
          </div>
        </div>
      </div>
    </section>
  );
}
