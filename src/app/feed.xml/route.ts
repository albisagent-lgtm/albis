import { getAllPosts } from "@/lib/blog";

export async function GET() {
  const posts = getAllPosts();
  const siteUrl = "https://www.albis.news";

  const rssItems = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/lens/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/lens/${post.slug}</guid>
      <description><![CDATA[${post.description || ""}]]></description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      ${post.author ? `<dc:creator><![CDATA[${post.author}]]></dc:creator>` : ""}
    </item>`
    )
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Albis — The Lens</title>
    <link>${siteUrl}</link>
    <description>Global news intelligence. See how the world sees the news — every source, zero spin, one calm reading experience.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${siteUrl}/icon-512.png</url>
      <title>Albis</title>
      <link>${siteUrl}</link>
    </image>
    ${rssItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
