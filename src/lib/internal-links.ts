import { getAllPosts, type BlogPost } from "@/lib/blog";
import { TOPICS, type Topic } from "@/lib/topics";
import { COUNTRIES } from "@/app/perspectives/countries";

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
export function getRelatedPosts(
  tags: string[],
  currentSlug?: string,
  limit = 3
): RelatedPost[] {
  const allPosts = getAllPosts();
  const lowerTags = tags.map((t) => t.toLowerCase());

  const scored = allPosts
    .filter((p) => p.slug !== currentSlug)
    .map((post) => {
      const postTags = post.tags.map((t) => t.toLowerCase());
      const overlap = lowerTags.filter((t) => postTags.includes(t)).length;
      return { post, score: overlap };
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

  // Match topics
  for (const topic of TOPICS) {
    const match = topic.keywords.some((kw) =>
      lowerTags.some((t) => t.includes(kw) || kw.includes(t))
    );
    if (match) {
      links.push({
        href: `/topics/${topic.slug}`,
        label: `${topic.emoji} ${topic.name}`,
        type: "topic",
      });
    }
  }

  // Match countries mentioned in tags
  for (const country of COUNTRIES) {
    const match = lowerTags.some(
      (t) =>
        t.includes(country.name.toLowerCase()) ||
        t.includes(country.slug)
    );
    if (match) {
      links.push({
        href: `/perspectives/${country.slug}`,
        label: `${country.flag} ${country.name}`,
        type: "perspective",
      });
    }
  }

  return links.slice(0, 8);
}

/**
 * Given a topic slug, return blog posts related to that topic.
 */
export function getBlogPostsForTopic(topicSlug: string, limit = 5): RelatedPost[] {
  const topic = TOPICS.find((t) => t.slug === topicSlug);
  if (!topic) return [];

  const allPosts = getAllPosts();
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
