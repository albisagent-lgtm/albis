import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, type BlogPost } from "@/lib/blog";
import { Breadcrumbs } from "@/app/components/breadcrumbs";

/* ── metadata ─────────────────────────────────────────────── */

const TITLE = "Iran War 2026: Complete Coverage From Every Region";
const DESC =
  "50+ articles tracking the Iran war from every region, every perspective. Military strikes, economic fallout, perception gaps, and the stories nobody else covered.";
const URL = "https://www.albis.news/lens/iran-war-2026";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  openGraph: {
    title: TITLE,
    description: DESC,
    url: URL,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
  },
  alternates: { canonical: URL },
};

/* ── slug-level keyword filter ────────────────────────────── */

const SLUG_KEYWORDS = [
  "iran",
  "hormuz",
  "tehran",
  "dimona",
  "natanz",
  "khamenei",
  "hezbollah",
  "kharg",
];

function matchesIranWar(slug: string): boolean {
  const lower = slug.toLowerCase();
  return SLUG_KEYWORDS.some((kw) => lower.includes(kw));
}

/* ── section categorisation ───────────────────────────────── */

interface Section {
  title: string;
  keywords: string[];
}

const SECTIONS: Section[] = [
  {
    title: "The War",
    keywords: ["strikes", "military", "day-by-day", "day-1", "day-2", "day-3", "day-4", "day-5", "day-6", "day-7", "day-8", "day-9", "day-10", "day-11", "day-12", "day-13", "day-14", "day-15", "day-16", "day-17", "day-18", "day-19", "day-20", "day-21", "day-22", "operation", "retaliation", "missile", "bomb", "strike", "killed", "marines", "submarine", "fog-of-war", "war-crime", "cluster-bomb", "tomahawk", "civilian-death"],
  },
  {
    title: "The Perception Gap",
    keywords: ["pgi", "framing", "divided", "perception", "two-stories", "flip", "five-versions", "five-framings", "both-sides", "war-on-iran-vs", "two-words"],
  },
  {
    title: "Economic Fallout",
    keywords: ["oil", "fuel", "economic", "crisis", "food", "fertilizer", "barrel", "shipping", "supply-chain", "recession", "dow", "market", "sanctions", "sulfur", "desalination", "water-crisis", "lng", "refinery", "pipeline", "cooking-gas", "lpg", "blackout"],
  },
  {
    title: "The Invisible Stories",
    keywords: ["unseen", "invisible", "nobody", "billion-people", "children", "education", "medicine", "hunger", "famine", "school", "52-million", "100-million", "132000"],
  },
  {
    title: "Nuclear Dimension",
    keywords: ["natanz", "dimona", "nuclear"],
  },
  {
    title: "Regional Impact",
    keywords: ["gulf-states", "pakistan", "japan", "asia", "africa", "latin-america", "india", "sri-lanka", "nepal", "bangladesh", "australia", "new-zealand", "philippines", "turkey", "qatar", "kuwait", "saudi", "dubai", "algeria", "europe", "cuba", "south-asia", "east-asia", "southeast-asia"],
  },
  {
    title: "Information Warfare",
    keywords: ["deepfake", "propaganda", "disinformation", "fake-war", "prisonbreak", "ai-deepfake", "coffeegate", "70-million-views"],
  },
  {
    title: "Diplomacy & Power",
    keywords: ["trump", "nato", "ceasefire", "deal", "surrender", "talks", "ultimatum", "netanyahu", "erdogan", "senate", "war-powers", "fcc", "regime-change", "peacemaker"],
  },
  {
    title: "Analysis & Deep Dives",
    keywords: [],
  },
];

function categorise(post: BlogPost): string {
  const haystack = `${post.slug} ${post.title}`.toLowerCase();

  for (const section of SECTIONS) {
    if (section.keywords.length === 0) continue; // skip catch-all
    if (section.keywords.some((kw) => haystack.includes(kw))) {
      return section.title;
    }
  }
  return "Analysis & Deep Dives";
}

/* ── date formatting ──────────────────────────────────────── */

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ── page ─────────────────────────────────────────────────── */

export default function IranWarHub() {
  /* 1. collect matching posts (getAllPosts already filters noindex) */
  const allPosts = getAllPosts();
  const posts = allPosts.filter((p) => matchesIranWar(p.slug));

  /* 2. bucket into sections */
  const buckets: Record<string, BlogPost[]> = {};
  for (const s of SECTIONS) buckets[s.title] = [];
  for (const p of posts) {
    const cat = categorise(p);
    buckets[cat].push(p);
  }
  /* sort each bucket newest-first (already sorted, but be safe) */
  for (const key of Object.keys(buckets)) {
    buckets[key].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  const totalCount = posts.length;

  /* 3. JSON-LD */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: TITLE,
    description: DESC,
    url: URL,
    publisher: {
      "@type": "Organization",
      name: "Albis",
      url: "https://www.albis.news",
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalCount,
      itemListElement: posts.slice(0, 30).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://www.albis.news/lens/${p.slug}`,
        name: p.title,
      })),
    },
  };

  return (
    <main className="bg-[#f8f7f4] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-2xl px-6 py-16 md:py-24">
        {/* breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Lens", href: "/lens" },
            { label: "Iran War 2026" },
          ]}
        />

        {/* headline */}
        <h1 className="font-playfair text-3xl md:text-4xl font-bold text-[#0f0f0f] mb-4 leading-tight">
          {TITLE}
        </h1>

        {/* article count */}
        <p className="text-sm text-[#888] mb-8">
          {totalCount} articles and counting
        </p>

        {/* AI-first summary */}
        <p className="font-source-serif text-[#333] text-lg leading-relaxed mb-12">
          Since February 27, 2026, Albis has tracked the Iran war from every
          region and every perspective — not just the headlines, but the
          perception gaps between them. This page collects every piece of
          coverage we have published: military escalation, nuclear strikes,
          economic shockwaves, information warfare, and the stories about the
          billions of people caught in between that most outlets never told.
        </p>

        {/* section divider */}
        <hr className="border-t border-[#e0ddd8] mb-12" />

        {/* sections */}
        {SECTIONS.map((section) => {
          const items = buckets[section.title];
          if (!items || items.length === 0) return null;
          return (
            <section key={section.title} className="mb-12">
              <h2 className="font-playfair text-xl font-bold text-[#0f0f0f] mb-4">
                {section.title}
              </h2>
              <ul className="space-y-2">
                {items.map((p) => (
                  <li key={p.slug} className="font-source-serif text-[#333]">
                    <Link
                      href={`/lens/${p.slug}`}
                      className="text-[#0f0f0f] hover:text-[#c8922a] transition-colors"
                    >
                      {p.title}
                    </Link>
                    <span className="text-sm text-[#999] ml-2">
                      {fmtDate(p.date)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </article>
    </main>
  );
}
