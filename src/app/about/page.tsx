import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Albis",
  description:
    "Albis is a global news service that shows how the same events are reported differently around the world.",
};

export default function AboutPage() {
  return (
    <main className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-2xl px-space-6 py-space-16 md:py-space-24">
        {/* Header */}
        <h1 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400">
          About Albis
        </h1>

        {/* Three core paragraphs */}
        <div className="mt-space-12 space-y-space-6 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
          <p>
            Albis is a global news service that shows how the same events are reported differently around the world. We scan sources across seven regions daily and surface the patterns most outlets miss.
          </p>

          <p>
            Most people see the world through a single lens — their local media. Albis exists to widen that view. Not by telling you what to think, but by showing you how others already do.
          </p>

          <p>
            Three daily scans cover every major story. Our Perception Gap Index measures how differently regions frame the same event. Everything is free.
          </p>
        </div>

        {/* Founder section */}
        <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-4">
            The Founder
          </h2>
          
          <p className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Ignatius Romero
          </p>
          <p className="mt-1 font-[family-name:var(--font-source-serif)] text-lg text-zinc-500 dark:text-zinc-400">
            New Zealand
          </p>

          <div className="mt-6 space-y-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            <p>
              Ignatius spent years in community development and cricket coaching before building Albis. He believes that information shapes perception more than most people realize, and that understanding this changes how you see the world.
            </p>
            <p>
              Albis grew from a personal mission: to understand how the world tells its stories — and to help others see the patterns for themselves.
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
          <p className="font-[family-name:var(--font-source-serif)] text-lg text-zinc-700 dark:text-zinc-300">
            Get in touch: <a href="mailto:harry@albis.news" className="text-[#c8922a] hover:underline">harry@albis.news</a>
          </p>
        </div>
      </div>
    </main>
  );
}
