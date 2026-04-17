import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPostBySlug, getPostsBySection, getPostUrl, getPostSection } from "@/lib/blog";
import { ArticlePage, generateArticleMetadata } from "@/app/components/article-page";

export const revalidate = 300;
export const dynamicParams = true;

const SECTION = "perspectives";

interface Props { params: Promise<{ slug: string }>; }

export async function generateStaticParams() {
  const posts = await getPostsBySection(SECTION);
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return generateArticleMetadata(post);
}

export default async function PerspectivesArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  if (getPostSection(post.category) !== SECTION) redirect(getPostUrl(post));
  return <ArticlePage post={post} />;
}
