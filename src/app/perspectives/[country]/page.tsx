import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { COUNTRIES, getCountryBySlug } from "../countries";
import { EmailCapture } from "@/app/components/email-capture";
import { TOPICS } from "@/lib/topics";
import { getRecentScanItems, getTodayScan } from "@/lib/scan-parser";
import { CountryPerspectiveClient } from "./country-client";
import { Breadcrumbs } from "@/app/components/breadcrumbs";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ country: string }>;
}

export function generateStaticParams() {
  return COUNTRIES.map((c) => ({ country: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country: slug } = await params;
  const country = getCountryBySlug(slug);
  if (!country) return {};
  const url = `https://albis.news/perspectives/${slug}`;
  return {
    title: `${country.name} News Perspectives — How ${country.name} Reports World News | Albis`,
    description: `Discover how ${country.name} media frames world events differently. Compare ${country.name} news coverage with perspectives from other regions using Albis.`,
    openGraph: {
      title: `${country.name} News Perspectives | Albis`,
      description: `How does ${country.name} media report world news? See framing patterns, coverage gaps, and regional perspectives.`,
      url,
      type: "website",
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
    alternates: { canonical: url },
  };
}

export default async function CountryPerspectivePage({ params }: Props) {
  const { country: slug } = await params;
  const country = getCountryBySlug(slug);
  if (!country) notFound();

  // Fetch today's scan for "Today's Stories"
  const todayScan = await getTodayScan();

  // Fetch recent scan data for historical analysis
  const { items: allItems } = await getRecentScanItems(30);

  // Get related countries from the same region (excluding current)
  const regionCountries = COUNTRIES.filter(
    (c) => c.region === country.region && c.slug !== country.slug
  ).slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${country.name} News Perspectives`,
    description: `How ${country.name} media frames world events differently compared to other regions.`,
    url: `https://albis.news/perspectives/${slug}`,
    publisher: {
      "@type": "Organization",
      name: "Albis",
      url: "https://albis.news",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="mx-auto max-w-3xl px-space-6 py-space-16 md:py-space-24">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Perspectives", href: "/perspectives" },
            { label: country.region },
            { label: country.name },
          ]}
        />

        {/* Header */}
        <header className="mb-12">
          <div className="text-center">
            <div className="text-5xl mb-space-4">{country.flag}</div>
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold">
              {country.name}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">{country.region}</p>
          </div>
        </header>

        {/* Dynamic scan data (includes Today's Stories) */}
        <CountryPerspectiveClient
          country={{ name: country.name, flag: country.flag, region: country.region, slug: country.slug }}
          todayScan={todayScan}
          allItems={allItems}
        />

        {/* Email capture CTA — always shown */}
        <div className="mt-space-12 rounded-2xl border border-black/[0.07] bg-white p-space-8 text-center dark:border-white/[0.06] dark:bg-white/[0.02]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1a3a5c]/10 dark:bg-[#7ab0d8]/10">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#1a3a5c] dark:text-[#7ab0d8]"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold">
            Get {country.name} perspectives in your inbox
          </h2>
          <p className="mx-auto mt-3 max-w-md text-zinc-500 dark:text-zinc-400">
            Subscribe to get daily briefings with coverage from {country.name} and {country.region}.
          </p>
          <div className="mt-6">
            <EmailCapture variant="hero" />
          </div>
        </div>

        {/* What to Expect */}
        <section className="mt-12">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
            What you&apos;ll find here
          </h2>
          <div className="mt-6 grid gap-space-4 sm:grid-cols-2">
            {[
              {
                title: "Coverage Patterns",
                desc: `How ${country.name} media prioritizes different global stories compared to other regions.`,
              },
              {
                title: "Framing Analysis",
                desc: `The lenses ${country.name} outlets use — security, economic, cultural, humanitarian — and how they differ.`,
              },
              {
                title: "Blind Spots",
                desc: `Stories that get significant coverage elsewhere but are underreported in ${country.name} media.`,
              },
              {
                title: "Regional Context",
                desc: `How ${country.name}'s media perspective relates to broader ${country.region} coverage patterns.`,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-black/[0.07] p-space-6 dark:border-white/[0.06]"
              >
                <h3 className="font-medium text-[#0f0f0f] dark:text-[#f0efec]">{item.title}</h3>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Countries */}
        {regionCountries.length > 0 && (
          <section className="mt-12">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
              More from {country.region}
            </h2>
            <div className="mt-4 flex flex-wrap gap-space-2">
              {regionCountries.map((c) => (
                <Link
                  key={c.slug}
                  href={`/perspectives/${c.slug}`}
                  className="flex items-center gap-2 rounded-lg border border-black/[0.07] px-3 py-2 text-sm transition-colors hover:border-black/[0.15] dark:border-white/[0.06] dark:hover:border-white/[0.12]"
                >
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related Topics */}
        <section className="mt-12">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
            Explore Topics
          </h2>
          <div className="mt-4 flex flex-wrap gap-space-2">
            {TOPICS.slice(0, 8).map((t) => (
              <Link
                key={t.slug}
                href={`/topics/${t.slug}`}
                className="flex items-center gap-2 rounded-lg border border-black/[0.07] px-3 py-2 text-sm transition-colors hover:border-black/[0.15] dark:border-white/[0.06] dark:hover:border-white/[0.12]"
              >
                <span>{t.emoji}</span>
                <span>{t.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="mt-16 rounded-2xl border border-black/[0.07] bg-[#f8f7f4] p-space-8 text-center dark:border-white/[0.07] dark:bg-white/[0.03]">
          <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
            See the full picture
          </h3>
          <p className="mx-auto mt-3 max-w-md text-zinc-500 dark:text-zinc-400">
            Albis scans thousands of sources across 7 regions daily &mdash; so you don&apos;t have to. Try
            it free.
          </p>
          <div className="mt-6">
            <EmailCapture variant="hero" />
          </div>
        </div>

        {/* Back link */}
        <div className="mt-space-12 text-center">
          <Link
            href="/perspectives"
            className="text-sm font-medium text-[#1a3a5c] hover:underline dark:text-[#7ab0d8]"
          >
            &larr; All countries
          </Link>
        </div>
      </main>
    </>
  );
}
