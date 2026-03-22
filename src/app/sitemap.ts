import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { TOPICS } from "@/lib/topics";
import { COUNTRIES } from "@/app/perspectives/countries";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.albis.news";

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: `${base}/lens`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${base}/perspectives`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${base}/topics`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${base}/briefing`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${base}/quiz`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${base}/archive`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${base}/blind-spots`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${base}/perception-gap`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${base}/perception-gap/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${base}/indexes/pgi`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${base}/feed.xml`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.3 },
    { url: `${base}/what-is-perception-gap-index`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${base}/what-is-global-attention-index`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${base}/indexes/gai`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${base}/methodology`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${base}/live`, lastModified: new Date(), changeFrequency: "hourly" as const, priority: 0.8 },
  ];

  const allPosts = getAllPosts();
  
  // Include both /lens/ and /blog/ routes for all posts
  const lensPosts: MetadataRoute.Sitemap = allPosts.map((post) => ({
    url: `${base}/lens/${post.slug}`,
    lastModified: isNaN(new Date(post.date).getTime()) ? new Date() : new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const topicPages: MetadataRoute.Sitemap = TOPICS.map((topic) => ({
    url: `${base}/topics/${topic.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const perspectivePages: MetadataRoute.Sitemap = COUNTRIES.map((country) => ({
    url: `${base}/perspectives/${country.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...lensPosts, ...topicPages, ...perspectivePages];
}
