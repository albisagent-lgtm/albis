import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

function getTier(pgi: number) {
  if (pgi <= 2.0) return { name: "Global Consensus", color: "#22c55e", bg: "#052e16" };
  if (pgi <= 4.0) return { name: "Different Lenses", color: "#f59e0b", bg: "#451a03" };
  if (pgi <= 6.0) return { name: "Diverging Narratives", color: "#f97316", bg: "#431407" };
  if (pgi <= 8.0) return { name: "Competing Realities", color: "#ef4444", bg: "#450a0a" };
  return { name: "Parallel Universes", color: "#a1a1aa", bg: "#18181b" };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const pgi = parseFloat(searchParams.get("pgi") || "5.0");
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const stories = searchParams.get("stories") || "";
  const delta = searchParams.get("delta") ? parseFloat(searchParams.get("delta")!) : null;

  const tier = getTier(pgi);
  const position = Math.min(Math.max((pgi / 10) * 100, 5), 95);

  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString("en-NZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const topStories = stories ? stories.split("|").slice(0, 3) : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0f0f0f",
          padding: "50px 60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "26px", fontWeight: 700, color: "#c8922a", letterSpacing: "0.1em" }}>
              ALBIS
            </span>
            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>
              Perception Gap Index
            </span>
          </div>
          <span style={{ fontSize: "15px", color: "rgba(255,255,255,0.4)" }}>
            {formattedDate}
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: "100%", height: "1px", background: "linear-gradient(to right, transparent, #c8922a40, transparent)", marginTop: "20px" }} />

        {/* PGI Score — big and centered */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: tier.color }} />
            <span style={{ fontSize: "120px", fontWeight: 800, color: "#f0efec", letterSpacing: "-0.03em", lineHeight: 1 }}>
              {pgi.toFixed(1)}
            </span>
          </div>

          <span style={{ fontSize: "28px", fontWeight: 600, color: tier.color, marginTop: "8px" }}>
            {tier.name}
          </span>

          {delta !== null && (
            <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.4)", marginTop: "8px" }}>
              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)} from yesterday
            </span>
          )}

          {/* Gauge bar */}
          <div style={{
            display: "flex",
            width: "500px",
            height: "10px",
            borderRadius: "5px",
            marginTop: "24px",
            position: "relative" as const,
            background: "linear-gradient(to right, #22c55e, #f59e0b, #f97316, #ef4444)",
          }}>
            <div style={{
              position: "absolute" as const,
              top: "-5px",
              left: `${position}%`,
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: tier.color,
              border: "3px solid #0f0f0f",
              boxShadow: "0 0 8px rgba(0,0,0,0.5)",
              transform: "translateX(-50%)",
            }} />
          </div>
        </div>

        {/* Top stories */}
        {topStories.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
            <span style={{ fontSize: "11px", color: "#c8922a", letterSpacing: "0.2em", textTransform: "uppercase" as const, fontWeight: 600 }}>
              Top Divergent Stories
            </span>
            {topStories.map((story, i) => (
              <span key={i} style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
                • {story}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "14px", color: "#c8922a", fontWeight: 500 }}>
            albis.news/pgi
          </span>
          <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>
            How differently does the world see the same story?
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
