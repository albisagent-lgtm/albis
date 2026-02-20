import type { Metadata } from "next";
import { getFramingItems, getFramingNotes, REGION_LABELS, CATEGORY_META } from "@/lib/scan-parser";
import { FramingWatchClient } from "./framing-watch-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Framing Watch",
  description: "Same event, different story. See how regional coverage diverges — what gets emphasised, what gets omitted, and why.",
};

export default async function FramingWatchPage() {
  const items = await getFramingItems();
  const notes = await getFramingNotes();

  return (
    <FramingWatchClient
      items={items}
      notes={notes}
      regionLabels={REGION_LABELS}
      categoryMeta={CATEGORY_META}
    />
  );
}
