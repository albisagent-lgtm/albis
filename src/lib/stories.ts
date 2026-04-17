import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getAllPosts, type BlogPost } from "./blog";

const STORIES_DIR = path.join(process.cwd(), "content", "stories");

export type ClusterStatus = "active" | "developing" | "resolved";

export interface StoryCluster {
  slug: string;
  title: string;
  description: string;
  status: ClusterStatus;
  startDate: string;
  tags: string[];
  regions: string[];
  relatedClusters: string[];
  content: string;
}

export interface StoryClusterWithArticles extends StoryCluster {
  articles: BlogPost[];
  articleCount: number;
  latestArticleDate: string | null;
}

function parseClusterFile(filePath: string): StoryCluster | null {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);
    return {
      slug: data.slug || path.basename(filePath, ".md"),
      title: data.title || "",
      description: data.description || "",
      status: (data.status as ClusterStatus) || "developing",
      startDate: data.startDate || "",
      tags: (data.tags || []).map((t: string) => t.toLowerCase()),
      regions: data.regions || [],
      relatedClusters: data.relatedClusters || [],
      content: content.trim(),
    };
  } catch {
    return null;
  }
}

export function getStoryClusters(): StoryCluster[] {
  if (!fs.existsSync(STORIES_DIR)) return [];
  return fs
    .readdirSync(STORIES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parseClusterFile(path.join(STORIES_DIR, f)))
    .filter(Boolean) as StoryCluster[];
}

export function getCluster(slug: string): StoryCluster | null {
  const filePath = path.join(STORIES_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  return parseClusterFile(filePath);
}

export async function getArticlesForCluster(cluster: StoryCluster): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  const clusterTags = new Set(cluster.tags);
  return posts.filter((post) => {
    const postTags = post.tags.map((t) => t.toLowerCase());
    const overlap = postTags.filter((t) => clusterTags.has(t)).length;
    return overlap >= 2;
  });
}

export function getClustersForArticle(article: BlogPost): StoryCluster[] {
  const clusters = getStoryClusters();
  const articleTags = new Set(article.tags.map((t) => t.toLowerCase()));
  return clusters.filter((cluster) => {
    const overlap = cluster.tags.filter((t) => articleTags.has(t)).length;
    return overlap >= 2;
  });
}

export async function getClusterWithArticles(slug: string): Promise<StoryClusterWithArticles | null> {
  const cluster = getCluster(slug);
  if (!cluster) return null;
  const articles = await getArticlesForCluster(cluster);
  return {
    ...cluster,
    articles,
    articleCount: articles.length,
    latestArticleDate: articles.length > 0 ? articles[0].date : null,
  };
}

export async function getAllClustersWithArticles(): Promise<StoryClusterWithArticles[]> {
  const clusters = getStoryClusters();
  const hydrated = await Promise.all(
    clusters.map(async (cluster) => {
      const articles = await getArticlesForCluster(cluster);
      return {
        ...cluster,
        articles,
        articleCount: articles.length,
        latestArticleDate: articles.length > 0 ? articles[0].date : null,
      };
    })
  );
  return hydrated.sort((a, b) => {
    const dateA = a.latestArticleDate || a.startDate;
    const dateB = b.latestArticleDate || b.startDate;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
}
