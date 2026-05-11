import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { EmailCapture } from "@/app/components/email-capture";

export const metadata: Metadata = {
  title: "Daily Briefings Archive — Albis",
  description:
    "Browse past daily briefings from Albis. See how the world's news was reported every day.",
  openGraph: {
    title: "Daily Briefings Archive — Albis",
    description:
      "Browse past daily briefings. See how the world's news was reported every day.",
    url: "https://www.albis.news/archive",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://www.albis.news/archive" },
};

interface Briefing {
  id: string;
  date: string;
  title: string;
  summary: string | null;
  mood: string | null;
  pgi_score: number | null;
  story_count: number | null;
}

async function getBriefings(): Promise<Briefing[]> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return [];

    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase
      .from("briefings")
      .select("id, date, title, summary, mood, pgi_score, story_count")
      .order("date", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Briefings fetch error:", error);
      return [];
    }

    return (data as Briefing[]) || [];
  } catch {
    return [];
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const revalidate = 300;

export default async function ArchivePage() {
  const briefings = await getBriefings();

  return (
    <main className="px-space-6 py-space-16 md:py-space-24">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <p className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400">
          Daily Briefings
        </p>
        <p className="text-lg font-[family-name:var(--font-source-serif)] text-zinc-500 dark:text-zinc-400 mt-space-2">
          What lands in your inbox every morning.
        </p>

        {/* Briefing list */}
        {briefings.length > 0 ? (
          <div className="mt-space-12">
            {briefings.map((b) => (
              <Link
                key={b.id}
                href={`/archive/${b.date}`}
                className="block py-space-6 border-b border-black/5 dark:border-white/5 group"
              >
                <h2 className="font-[family-name:var(--font-playfair)] text-xl md:text-2xl font-semibold leading-snug group-hover:text-[#c8922a] transition-colors">
                  {formatDate(b.date)}
                  {b.title && (
                    <span className="text-zinc-600 dark:text-zinc-400 font-normal">
                      {" "}
                      — {b.title}
                    </span>
                  )}
                </h2>
                <p className="text-sm text-zinc-400 mt-space-2">
                  {[
                    b.mood,
                    b.story_count != null
                      ? `${b.story_count} stories`
                      : null,
                    b.pgi_score != null ? `PGI: ${b.pgi_score}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-space-16 text-center">
            <p className="font-[family-name:var(--font-source-serif)] text-lg text-zinc-500 dark:text-zinc-400">
              Briefings archive coming soon.
            </p>
            <p className="text-sm text-zinc-400 mt-space-2">
              Subscribe to get the daily briefing in your inbox.
            </p>
          </div>
        )}

        {/* Email capture */}
        <div className="mt-space-16 pt-space-12 border-t border-black/5 dark:border-white/5">
          <EmailCapture source="archive" />
        </div>
      </div>
    </main>
  );
}
