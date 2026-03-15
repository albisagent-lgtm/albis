import { NextRequest, NextResponse } from "next/server";
import { getArticlesByTag } from "@/lib/blog/tagged";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const tag = req.nextUrl.searchParams.get("tag") || "";
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "5", 10);

  if (!tag) {
    return NextResponse.json({ articles: [] });
  }

  const articles = getArticlesByTag(tag, limit);
  return NextResponse.json({ articles });
}
