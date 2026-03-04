import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function getTier(pgi: number) {
  if (pgi <= 2.0) return { name: "Global Consensus", color: "#22c55e" };
  if (pgi <= 4.0) return { name: "Different Lenses", color: "#f59e0b" };
  if (pgi <= 6.0) return { name: "Diverging Narratives", color: "#f97316" };
  if (pgi <= 8.0) return { name: "Competing Realities", color: "#ef4444" };
  return { name: "Parallel Universes", color: "#71717a" };
}

async function getLatestPGI() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("pgi_daily")
      .select("date, daily_pgi")
      .order("date", { ascending: false })
      .limit(2);

    if (!data || data.length === 0) return null;
    const latest = { date: data[0].date, pgi: Number(data[0].daily_pgi) };
    const previous = data.length > 1 ? Number(data[1].daily_pgi) : null;
    const delta = previous !== null ? latest.pgi - previous : null;
    return { ...latest, delta };
  } catch {
    return null;
  }
}

export default async function EmbedPgiPage() {
  const pgiData = await getLatestPGI();

  if (!pgiData) {
    return (
      <div style={{ padding: "20px", fontFamily: "system-ui, sans-serif", color: "#71717a" }}>
        PGI data unavailable
      </div>
    );
  }

  const tier = getTier(pgiData.pgi);
  const position = Math.min(Math.max((pgiData.pgi / 10) * 100, 5), 95);

  const formattedDate = new Date(pgiData.date + "T00:00:00").toLocaleDateString("en-NZ", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: system-ui, -apple-system, sans-serif; background: #fafaf9; }
          a { text-decoration: none; color: inherit; }
        `}</style>
      </head>
      <body>
        <a
          href={`https://www.albis.news/indexes/pgi`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            padding: "20px 24px",
            borderRadius: "12px",
            border: "1px solid rgba(0,0,0,0.06)",
            background: "white",
            maxWidth: "400px",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "#c8922a" }}>
              Perception Gap Index
            </span>
            <span style={{ fontSize: "11px", color: "#a1a1aa" }}>
              {formattedDate}
            </span>
          </div>

          {/* Score */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: tier.color }} />
            <span style={{ fontSize: "36px", fontWeight: 800, color: "#0f0f0f", letterSpacing: "-0.02em", lineHeight: 1 }}>
              {pgiData.pgi.toFixed(1)}
            </span>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: tier.color }}>
                {tier.name}
              </div>
              {pgiData.delta !== null && (
                <div style={{ fontSize: "11px", color: "#a1a1aa" }}>
                  {pgiData.delta >= 0 ? "▲" : "▼"} {Math.abs(pgiData.delta).toFixed(1)} from yesterday
                </div>
              )}
            </div>
          </div>

          {/* Gauge */}
          <div style={{
            position: "relative" as const,
            height: "6px",
            borderRadius: "3px",
            background: "linear-gradient(to right, #86efac, #fcd34d, #fdba74, #fca5a5)",
            marginBottom: "12px",
          }}>
            <div style={{
              position: "absolute" as const,
              top: "50%",
              left: `${position}%`,
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              backgroundColor: tier.color,
              border: "2px solid white",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              transform: "translate(-50%, -50%)",
            }} />
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "10px", color: "#c8922a", fontWeight: 500 }}>
              Powered by Albis
            </span>
            <span style={{ fontSize: "10px", color: "#d4d4d8" }}>
              albis.news
            </span>
          </div>
        </a>
      </body>
    </html>
  );
}
