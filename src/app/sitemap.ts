import type { MetadataRoute } from "next";
import { getAllPosts, getPostUrl } from "@/lib/blog";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.albis.news";

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: `${base}/lens`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${base}/archive`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${base}/indexes`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${base}/indexes/pgi`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${base}/indexes/gai`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${base}/indexes/mispriced-attention`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${base}/attention-odds`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${base}/market-attention`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${base}/market-attention/methodology`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${base}/datasets/perception-gap-index`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${base}/tools/undercovered-story-finder`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${base}/what-am-i-missing`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${base}/widgets/perception-gap`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${base}/widgets/perception-gap/embed`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.6 },
    { url: `${base}/methodology`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${base}/media-literacy`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${base}/people`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${base}/feedback`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${base}/corrections`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${base}/disclaimer`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${base}/quiz`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.5 },
    { url: `${base}/feed.xml`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.3 },
  ];

  const allPosts = await getAllPosts();

  const lensPosts: MetadataRoute.Sitemap = allPosts.map((post) => ({
    url: `${base}${getPostUrl(post)}`,
    lastModified: isNaN(new Date(post.date).getTime()) ? new Date() : new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...lensPosts];
}
