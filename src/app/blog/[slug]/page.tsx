import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getPostBySlug, getPostUrl } from "@/lib/blog";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();
  redirect(getPostUrl(post));
}
