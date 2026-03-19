import type { Metadata } from "next";
import { FramingLabForm } from "./framing-lab-form";

export const metadata: Metadata = {
  title: "Framing Lab — Help Us Find Hidden Stories",
  description:
    "Spotted a story being reported very differently around the world? Tell us. The Framing Lab is where readers help Albis find the stories that slip through the cracks.",
};

export default function FramingLabPage() {
  return (
    <main className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-2xl px-space-6 py-space-16 md:py-space-24">
        {/* Header */}
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-semibold leading-tight tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">
          The Framing Lab
        </h1>
        <p className="mt-space-3 font-[family-name:var(--font-source-serif)] text-lg text-zinc-500 dark:text-zinc-400">
          Spotted a story being reported very differently around the world? Tell us.
        </p>

        {/* Explanation */}
        <div className="mt-space-12 space-y-space-4 font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          <p>
            Our scan engine covers 60+ countries in 9 languages — but we cannot catch everything.
          </p>
          <p>
            If you noticed a story getting completely different treatment in different regions — a protest ignored by Western media, a conflict framed opposite ways, a health crisis invisible to your country — we want to know.
          </p>
          <p>
            The best tips come from people with local knowledge. You live somewhere. You read local news. That is an edge we do not have.
          </p>
        </div>

        {/* Form */}
        <div className="mt-space-16 border-t border-black/5 pt-space-12 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-[#c8922a] mb-space-8">
            Submit a tip
          </h2>
          <FramingLabForm />
        </div>
      </div>
    </main>
  );
}
