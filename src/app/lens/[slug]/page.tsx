import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getAllSlugs, getPostBySlug, getPostUrl } from "@/lib/blog";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function LensRedirect({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();
  redirect(getPostUrl(post));
}
