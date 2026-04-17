import { getAllPosts, getPostUrl } from "@/lib/blog";

export const revalidate = 300;

export async function GET() {
  const allPosts = await getAllPosts();
  const now = new Date();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const recentPosts = allPosts.filter((post) => {
    const postDate = new Date(post.date);
    return !isNaN(postDate.getTime()) && postDate >= fortyEightHoursAgo;
  });

  const urls = recentPosts
    .map((post) => {
      const pubDate = new Date(post.date).toISOString();
      const title = post.title
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

      return `  <url>
    <loc>https://www.albis.news${getPostUrl(post)}</loc>
    <news:news>
      <news:publication>
        <news:name>Albis</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
