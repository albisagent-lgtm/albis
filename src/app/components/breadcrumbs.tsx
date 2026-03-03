import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string; // if omitted, renders as plain text (current page)
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `https://www.albis.news${item.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="mb-space-8">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-400 dark:text-zinc-500">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-zinc-300 dark:text-zinc-600">›</span>}
              {item.href ? (
                <Link href={item.href} className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-zinc-600 dark:text-zinc-300">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
