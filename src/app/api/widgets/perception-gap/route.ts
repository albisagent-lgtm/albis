import { getPublicIndexDataset } from '@/lib/growth-tools/public-index-data';

export const revalidate = 3600;

export async function GET() {
  const dataset = await getPublicIndexDataset(20);
  const stories = dataset.pgiStories
    .sort((a, b) => b.pgi - a.pgi)
    .slice(0, 5);
  return Response.json({ generated_at: dataset.generatedAt, stories });
}
