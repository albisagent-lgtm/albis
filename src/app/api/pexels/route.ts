import { NextRequest, NextResponse } from "next/server";

const cache = new Map<string, { url: string; photographer: string; alt: string; expires: number }>();
const ONE_HOUR = 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "Missing ?q= parameter" }, { status: 400 });
  }

  const key = q.toLowerCase().trim();
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json({ url: cached.url, photographer: cached.photographer, alt: cached.alt });
  }

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Pexels API key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=1&size=large`,
      { headers: { Authorization: apiKey } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Pexels API error" }, { status: 502 });
    }

    const data = await res.json();
    const photo = data.photos?.[0];

    if (!photo) {
      return NextResponse.json({ error: "No photos found" }, { status: 404 });
    }

    const result = {
      url: photo.src.large2x || photo.src.large || photo.src.original,
      photographer: photo.photographer || "Unknown",
      alt: photo.alt || q,
    };

    cache.set(key, { ...result, expires: Date.now() + ONE_HOUR });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch from Pexels" }, { status: 502 });
  }
}
