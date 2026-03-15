import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import matter from "gray-matter";

export interface TaggedArticle {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  excerpt: string;
}

const contentDir = join(process.cwd(), "content/blog");

export function getArticlesByTag(tag: string, limit = 5): TaggedArticle[] {
  try {
    const files = readdirSync(contentDir).filter((f) => f.endsWith(".md"));
    const articles: TaggedArticle[] = [];

    for (const file of files) {
      const raw = readFileSync(join(contentDir, file), "utf8");
      const { data, content } = matter(raw);
      const tags: string[] = data.tags || [];

      if (tags.some((t: string) => t.toLowerCase() === tag.toLowerCase())) {
        articles.push({
          slug: file.replace(/\.md$/, ""),
          title: data.title || "Untitled",
          description: data.description || "",
          date: data.date || data.publishedAt || "",
          author: data.author || "Albis",
          tags,
          excerpt:
            data.description ||
            content.replace(/^---[\s\S]*?---/, "").trim().slice(0, 160) + "…",
        });
      }
    }

    articles.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return articles.slice(0, limit);
  } catch {
    return [];
  }
}
