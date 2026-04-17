import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getAllSlugs, getPostBySlug, getPostUrl } from "@/lib/blog";

export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function LensRedirect({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  redirect(getPostUrl(post));
}
