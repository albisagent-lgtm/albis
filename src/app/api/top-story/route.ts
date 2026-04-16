import { NextResponse } from "next/server";
import { getSiteSnapshot } from "@/lib/site-snapshot";

export async function GET() {
  try {
    const snapshot = await getSiteSnapshot();

    if (!snapshot.hasScan || snapshot.items.length === 0) {
      return NextResponse.json({ topStory: null }, { status: 200 });
    }

    // Priority: high > medium > low
    const significanceOrder = { high: 3, medium: 2, low: 1 };

    let topStory: (typeof snapshot.items)[number] | null = null;
    let maxSig = 0;

    for (const item of snapshot.items) {
      const sig = significanceOrder[item.significance as keyof typeof significanceOrder] || 0;
      if (sig > maxSig) {
        maxSig = sig;
        topStory = item;
      }
    }

    if (!topStory) {
      return NextResponse.json({ topStory: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        topStory: {
          headline: topStory.headline,
          summary: topStory.connection || "",
          significance: topStory.significance,
          category: topStory.category,
          regions: topStory.regions || [],
          tags: topStory.tags || [],
          scan_date: snapshot.scanDate,
          scan_time: snapshot.scanPeriod,
          url: "/lens",
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (e: unknown) {
    console.error("Top story fetch error:", e);
    return NextResponse.json({ topStory: null }, { status: 200 });
  }
}
