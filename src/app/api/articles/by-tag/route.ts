import { NextRequest, NextResponse } from "next/server";
import { getAllPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const tag = req.nextUrl.searchParams.get("tag");
  const limit = Number(req.nextUrl.searchParams.get("limit") || "10");

  if (!tag) {
    return NextResponse.json({ error: "tag parameter required" }, { status: 400 });
  }

  const posts = getAllPosts()
    .filter((p) => p.tags.includes(tag))
    .slice(0, limit)
    .map(({ content, ...rest }) => ({
      ...rest,
      excerpt: content.replace(/^#.*$/gm, "").replace(/\n+/g, " ").trim().slice(0, 150) + "…",
    }));

  return NextResponse.json(posts);
}
