import { notFound } from "next/navigation";
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
    notFound();
  }

  return (
    <ScanDetailClient scan={scan} availableDates={availableDates} />
  );
}
