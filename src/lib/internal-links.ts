import { getAllPosts } from "@/lib/blog";
import { TOPICS } from "@/lib/topics";

export interface RelatedPost {
  slug: string;
  title: string;
  description: string;
  date: string;
}

export interface RelatedLink {
  href: string;
  label: string;
  type: "topic" | "perspective" | "blog";
}

/**
 * Given tags/topic, return related blog posts (excluding the current slug).
 */
export async function getRelatedPosts(
  tags: string[],
  currentSlug?: string,
  limit = 5
): Promise<RelatedPost[]> {
  const allPosts = await getAllPosts();
  const lowerTags = tags.map((t) => t.toLowerCase());
  const now = Date.now();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  const scored = allPosts
    .filter((p) => p.slug !== currentSlug)
    .map((post) => {
      const postTags = post.tags.map((t) => t.toLowerCase());
      const overlap = lowerTags.filter((t) => postTags.includes(t)).length;
      const age = now - new Date(post.date).getTime();
      const recencyBonus = age <= SEVEN_DAYS ? 2 : age <= THIRTY_DAYS ? 1 : 0;
      return { post, score: overlap * 2 + recencyBonus };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ post }) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: post.date,
  }));
}

/**
 * Given tags, return related topic and perspective pages.
 */
export function getRelatedPages(tags: string[]): RelatedLink[] {
  const links: RelatedLink[] = [];
  const lowerTags = tags.map((t) => t.toLowerCase());

  for (const topic of TOPICS) {
    const match = topic.keywords.some((kw) =>
      lowerTags.some((t) => t.includes(kw) || kw.includes(t))
    );
    if (match) {
      links.push({
        href: `/lens?topic=${topic.slug}`,
        label: topic.name,
        type: "topic",
      });
    }
  }

  return links.slice(0, 5);
}

/**
 * Given a topic slug, return blog posts related to that topic.
 */
export async function getBlogPostsForTopic(topicSlug: string, limit = 5): Promise<RelatedPost[]> {
  const topic = TOPICS.find((t) => t.slug === topicSlug);
  if (!topic) return [];

  const allPosts = await getAllPosts();
  return allPosts
    .filter((post) => {
      const postTags = post.tags.map((t) => t.toLowerCase());
      return topic.keywords.some((kw) => postTags.some((t) => t.includes(kw)));
    })
    .slice(0, limit)
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      description: post.description,
      date: post.date,
    }));
}
