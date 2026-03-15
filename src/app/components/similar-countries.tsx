import Link from "next/link";
import { getCountryBySlug } from "@/app/perspectives/countries";
import { getSimilarCountries } from "@/data/country-similarities";

interface Props {
  countrySlug: string;
}

export function SimilarCountries({ countrySlug }: Props) {
  const similar = getSimilarCountries(countrySlug);
  if (similar.length === 0) return null;

  // Resolve full country data for each similar country
  const resolved = similar
    .map((s) => {
      const country = getCountryBySlug(s.slug);
      if (!country) return null;
      return { ...country, reason: s.reason };
    })
    .filter(Boolean) as Array<{ name: string; slug: string; flag: string; region: string; reason: string }>;

  if (resolved.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
        Explore Similar Perspectives
      </h2>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Countries with similar media landscapes, regional ties, or coverage patterns.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {resolved.map((c) => (
          <Link
            key={c.slug}
            href={`/perspectives/${c.slug}`}
            className="group flex items-start gap-3 rounded-xl border border-black/[0.07] p-4 transition-colors hover:border-black/[0.15] hover:bg-zinc-50/50 dark:border-white/[0.06] dark:hover:border-white/[0.12] dark:hover:bg-white/[0.02]"
          >
            <span className="text-2xl leading-none mt-0.5">{c.flag}</span>
            <div className="min-w-0">
              <span className="font-medium text-[#0f0f0f] dark:text-[#f0efec] group-hover:text-[#1a3a5c] dark:group-hover:text-[#7ab0d8] transition-colors">
                {c.name}
              </span>
              <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                {c.reason}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
