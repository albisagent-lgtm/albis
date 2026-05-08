import { getPublicIndexDataset, toCsv } from '@/lib/growth-tools/public-index-data';

export const revalidate = 3600;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get('format') || 'json';
  const dataset = await getPublicIndexDataset(100);
  const rows = dataset.pgiStories.map((story) => ({
    scan_date: story.scanDate,
    story_headline: story.headline,
    story_pgi: story.pgi,
  }));

  if (format === 'csv') {
    return new Response(toCsv(rows), {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="albis-perception-gap-index.csv"',
      },
    });
  }

  return Response.json({
    name: 'Albis Perception Gap Index story scores',
    generated_at: dataset.generatedAt,
    license: 'Attribution requested. Do not imply Albis endorsement.',
    methodology_url: 'https://www.albis.news/methodology',
    rows,
  });
}
