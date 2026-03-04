"use client";

import { useState, useEffect } from "react";

interface Testimonial {
  quote: string;
  name: string;
  country: string;
  flag: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "I used to think I understood the news. Then I saw how 7 regions cover the same story completely differently.",
    name: "Early Reader",
    country: "New Zealand",
    flag: "🇳🇿",
  },
  {
    quote: "The PGI is genius — I never realised how much my news diet was shaped by where I live.",
    name: "Telegram Subscriber",
    country: "India",
    flag: "🇮🇳",
  },
  {
    quote: "Finally, a news source that doesn't pick sides. Albis just shows you what's actually happening across the world.",
    name: "Email Subscriber",
    country: "United States",
    flag: "🇺🇸",
  },
];

export function Testimonials() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const t = TESTIMONIALS[active];

  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="min-h-[120px] flex items-center justify-center">
        <blockquote className="animate-fade-in" key={active}>
          <p className="text-base sm:text-lg font-[family-name:var(--font-source-serif)] italic leading-relaxed text-[#0f0f0f] dark:text-[#f0efec]">
            &ldquo;{t.quote}&rdquo;
          </p>
          <footer className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <span>{t.flag}</span>
            <span>{t.name}</span>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <span>{t.country}</span>
          </footer>
        </blockquote>
      </div>

      {/* Dots */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === active
                ? "w-6 bg-[#c8922a]"
                : "w-1.5 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
            }`}
            aria-label={`Testimonial ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
