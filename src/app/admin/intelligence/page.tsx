"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function isAdmin(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("albis-admin") === "true";
  } catch {
    return false;
  }
}

export default function AdminIntelligencePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isAdmin()) {
      router.replace("/");
      return;
    }
    setMounted(true);
  }, [router]);

  if (!mounted) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">Loading&hellip;</div>
      </main>
    );
  }

  const commands = "npm run intelligence:wiki:status\nnpm run intelligence:wiki:ingest-latest\nnpm run intelligence:wiki:view";

  return (
    <main className="min-h-[80vh]">
      <div className="mx-auto max-w-3xl px-6 py-12 md:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-600">
          Admin / Internal
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight text-[#0f0f0f] dark:text-[#f0efec] md:text-4xl">
          Albis Intelligence
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Private compiled knowledge layer for scans, comments, community signals,
          PGI/GAI patterns, product learnings, editorial lessons, and SEO experiments.
        </p>

        <section className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">V0 status</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            <li><strong className="text-zinc-900 dark:text-zinc-100">Wiki:</strong> installed as private markdown at <code>albis-intelligence/</code>.</li>
            <li><strong className="text-zinc-900 dark:text-zinc-100">Viewer:</strong> markdown-first for now; this page is the private admin entry point.</li>
            <li><strong className="text-zinc-900 dark:text-zinc-100">Public exposure:</strong> none by default. Public pages should be promoted manually after review.</li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Local commands</h2>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-zinc-950 p-4 text-xs text-zinc-100"><code>{commands}</code></pre>
          <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            For now, open the folder locally in Obsidian, VS Code, or Cursor. A richer
            searchable admin browser can be added once the markdown wiki proves useful.
          </p>
        </section>

        <div className="mt-8 flex gap-3 text-sm">
          <Link href="/admin" className="rounded-full border border-zinc-300 px-4 py-2 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900">
            Back to admin
          </Link>
          <Link href="/" className="rounded-full bg-zinc-950 px-4 py-2 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white">
            Back to Albis
          </Link>
        </div>
      </div>
    </main>
  );
}
