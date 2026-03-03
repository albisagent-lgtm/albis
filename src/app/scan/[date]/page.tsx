import { notFound } from "next/navigation";
import Link from "next/link";
import { getScanByDate, getAvailableDates } from "@/lib/scan-parser";
import { ScanDetailClient } from "./scan-detail-client";

interface Props {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { date } = await params;
  return {
    title: `Scan — ${date} | Albis`,
    description: `Full intelligence scan for ${date}`,
  };
}

export default async function ScanDetailPage({ params }: Props) {
  const { date } = await params;

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound();
  }

  const [scan, availableDates] = await Promise.all([
    getScanByDate(date),
    getAvailableDates(),
  ]);

  if (!scan) {
    return <NoScanDataState date={date} />;
  }

  return (
    <ScanDetailClient scan={scan} availableDates={availableDates} />
  );
}

function NoScanDataState({ date }: { date: string }) {
  const formattedDate = new Date(date + "T12:00:00").toLocaleDateString("en-NZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-[60vh] flex items-center justify-center">
      <div className="mx-auto max-w-md px-6 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <path d="M8 14h.01" />
              <path d="M12 14h.01" />
              <path d="M16 14h.01" />
              <path d="M8 18h.01" />
              <path d="M12 18h.01" />
            </svg>
          </div>
        </div>

        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
          No scan data for {formattedDate}
        </h1>
        
        <p className="mt-3 text-zinc-500 dark:text-zinc-400">
          This date doesn&apos;t have scan data yet. Scans run 3× daily and are archived automatically.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/explore"
            className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Browse Archive
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-full border border-zinc-300 bg-white px-8 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
