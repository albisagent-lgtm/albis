import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.albis.news";

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: `${base}/lens`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${base}/archive`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${base}/indexes`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${base}/indexes/pgi`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${base}/indexes/gai`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${base}/methodology`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${base}/quiz`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.5 },
    { url: `${base}/feed.xml`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.3 },
  ];

  const allPosts = getAllPosts();

  const lensPosts: MetadataRoute.Sitemap = allPosts.map((post) => ({
    url: `${base}/lens/${post.slug}`,
    lastModified: isNaN(new Date(post.date).getTime()) ? new Date() : new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...lensPosts];
}
