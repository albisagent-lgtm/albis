import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const REGION_FLAGS: Record<string, string> = {
  "western-world": "🌎",
  "east-se-asia": "🌏",
  "south-asia": "🇮🇳",
  "middle-east": "🕌",
  africa: "🌍",
  "eastern-europe": "🇪🇺",
  "latin-americas": "🌎",
  us: "🇺🇸",
  uk: "🇬🇧",
  china: "🇨🇳",
  russia: "🇷🇺",
  europe: "🇪🇺",
};

const REGION_LABELS: Record<string, string> = {
  "western-world": "Western World",
  "east-se-asia": "East & SE Asia",
  "south-asia": "South Asia",
  "middle-east": "Middle East",
  africa: "Africa",
  "eastern-europe": "Eastern Europe",
  "latin-americas": "Latin America",
  us: "United States",
  uk: "United Kingdom",
  china: "China",
  russia: "Russia",
  europe: "Europe",
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") || "Today's Global Story";
  const regions = searchParams.get("regions")?.split(",").filter(Boolean) || [
    "western-world",
    "east-se-asia",
    "middle-east",
  ];
  const date = searchParams.get("date") || new Date().toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const displayRegions = regions.slice(0, 4);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0f0f0f",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "28px",
              fontWeight: 700,
              color: "#c8922a",
              letterSpacing: "0.1em",
            }}
          >
            ALBIS ✨
          </div>
          <div
            style={{
              fontSize: "16px",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            {date}
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: "100%",
            height: "1px",
            background: "linear-gradient(to right, transparent, #c8922a40, transparent)",
            marginTop: "24px",
            marginBottom: "32px",
          }}
        />

        {/* Headline */}
        <div
          style={{
            fontSize: title.length > 60 ? "36px" : "44px",
            fontWeight: 700,
            color: "#f0efec",
            lineHeight: 1.2,
            maxWidth: "900px",
          }}
        >
          {title}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1, display: "flex" }} />

        {/* Region cards */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {displayRegions.map((region) => (
            <div
              key={region}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                padding: "14px 20px",
              }}
            >
              <span style={{ fontSize: "24px" }}>
                {REGION_FLAGS[region] || "🌐"}
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.8)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {REGION_LABELS[region] || region}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              color: "#c8922a",
              fontWeight: 500,
            }}
          >
            See all perspectives at albis.news
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            One event. Multiple perspectives.
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
