import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  keywords: string[];
  author: string;
  content: string;
  readingTime: string;
  publishedAt: Date;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  keywords: string[];
  author: string;
  readingTime: string;
  publishedAt: Date;
}

const postsDirectory = join(process.cwd(), "src/content/blog");

export function getAllPosts(): BlogPost[] {
  try {
    const fileNames = readdirSync(postsDirectory);
    const allPostsData = fileNames
      .filter((name) => name.endsWith(".mdx"))
      .map((fileName) => {
        const slug = fileName.replace(/\.mdx$/, "");
        const fullPath = join(postsDirectory, fileName);
        const fileContents = readFileSync(fullPath, "utf8");
        const { data, content } = matter(fileContents);

        const readTimeResult = readingTime(content);

        return {
          slug,
          title: data.title,
          description: data.description,
          date: data.date,
          keywords: data.keywords || [],
          author: data.author,
          content,
          readingTime: readTimeResult.text,
          publishedAt: new Date(data.date),
        };
      });

    // Sort posts by date
    return allPostsData.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  } catch {
    return [];
  }
}

export function getPostSlugs(): string[] {
  try {
    const fileNames = readdirSync(postsDirectory);
    return fileNames
      .filter((name) => name.endsWith(".mdx"))
      .map((name) => name.replace(/\.mdx$/, ""));
  } catch {
    return [];
  }
}

export function getPostBySlug(slug: string): BlogPost | null {
  try {
    const fullPath = join(postsDirectory, `${slug}.mdx`);
    const fileContents = readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    const readTimeResult = readingTime(content);

    return {
      slug,
      title: data.title,
      description: data.description,
      date: data.date,
      keywords: data.keywords || [],
      author: data.author,
      content,
      readingTime: readTimeResult.text,
      publishedAt: new Date(data.date),
    };
  } catch {
    return null;
  }
}

export function getPostsMeta(): BlogPostMeta[] {
  try {
    const fileNames = readdirSync(postsDirectory);
    const allPostsData = fileNames
      .filter((name) => name.endsWith(".mdx"))
      .map((fileName) => {
        const slug = fileName.replace(/\.mdx$/, "");
        const fullPath = join(postsDirectory, fileName);
        const fileContents = readFileSync(fullPath, "utf8");
        const { data, content } = matter(fileContents);

        const readTimeResult = readingTime(content);

        return {
          slug,
          title: data.title,
          description: data.description,
          date: data.date,
          keywords: data.keywords || [],
          author: data.author,
          readingTime: readTimeResult.text,
          publishedAt: new Date(data.date),
        };
      });

    // Sort posts by date
    return allPostsData.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  } catch {
    return [];
  }
}