import { getPublicIndexDataset } from '@/lib/growth-tools/public-index-data';

export const revalidate = 3600;

export default async function PerceptionGapEmbedPage() {
  const dataset = await getPublicIndexDataset(20);
  const stories = dataset.pgiStories.sort((a, b) => b.pgi - a.pgi).slice(0, 5);

  return (
    <main style={{ margin: 0, background: '#f8f7f4', color: '#111', fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif' }}>
      <div style={{ padding: 18, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: '#c8922a', textTransform: 'uppercase' }}>Albis Perception Gap</div>
            <h1 style={{ fontSize: 22, lineHeight: 1.15, margin: '6px 0 0', fontFamily: 'Georgia,serif' }}>Highest divergence today</h1>
          </div>
          <a href="https://www.albis.news/indexes" target="_blank" rel="noreferrer" style={{ color: '#c8922a', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Data by Albis</a>
        </div>
        <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
          {stories.length ? stories.map((story) => (
            <a key={`${story.scanDate}-${story.headline}`} href="https://www.albis.news/datasets/perception-gap-index" target="_blank" rel="noreferrer" style={{ display: 'block', color: 'inherit', textDecoration: 'none', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 650, lineHeight: 1.35 }}>{story.headline}</div>
                <div style={{ minWidth: 38, textAlign: 'center', color: '#c8922a', fontWeight: 800 }}>{story.pgi.toFixed(1)}</div>
              </div>
            </a>
          )) : <p style={{ color: '#666', fontSize: 14 }}>Widget data is being prepared.</p>}
        </div>
        <p style={{ margin: '14px 0 0', fontSize: 11, lineHeight: 1.45, color: '#666' }}>Directional framing-divergence signal. Not a truth score or endorsement.</p>
      </div>
    </main>
  );
}
