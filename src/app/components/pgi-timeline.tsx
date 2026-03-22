"use client";

import { useState, useRef, useCallback, useMemo } from "react";

interface PgiTimelineProps {
  data: Array<{ date: string; pgi: number }>;
  title?: string;
  height?: number;
}

function getTierColor(pgi: number): string {
  if (pgi < 4) return "#10b981"; // emerald-500
  if (pgi < 6) return "#f59e0b"; // amber-500
  if (pgi < 8) return "#f97316"; // orange-500
  return "#ef4444"; // red-500
}

function getTierName(pgi: number): string {
  if (pgi <= 2) return "Global Consensus";
  if (pgi <= 4) return "Different Lenses";
  if (pgi <= 6) return "Diverging Narratives";
  if (pgi <= 8) return "Competing Realities";
  return "Parallel Universes";
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function PgiTimeline({
  data,
  title,
  height = 200,
}: PgiTimelineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Layout constants
  const paddingLeft = 32;
  const paddingRight = 12;
  const paddingTop = 16;
  const paddingBottom = 32;

  const sorted = useMemo(
    () => [...data].sort((a, b) => a.date.localeCompare(b.date)),
    [data]
  );

  // Compute trend
  const currentPgi = sorted.length > 0 ? sorted[sorted.length - 1].pgi : null;
  const sevenDaysAgo =
    sorted.length > 7 ? sorted[sorted.length - 8].pgi : sorted[0]?.pgi ?? null;
  const delta =
    currentPgi !== null && sevenDaysAgo !== null
      ? currentPgi - sevenDaysAgo
      : null;

  // Y scale: 0–10
  const yMin = 0;
  const yMax = 10;
  const chartWidth = 100; // percentage-based, we'll use viewBox

  const viewBoxWidth = 600;
  const chartInnerW = viewBoxWidth - paddingLeft - paddingRight;
  const chartInnerH = height - paddingTop - paddingBottom;

  const toX = useCallback(
    (i: number) => {
      if (sorted.length <= 1) return paddingLeft + chartInnerW / 2;
      return paddingLeft + (i / (sorted.length - 1)) * chartInnerW;
    },
    [sorted.length, chartInnerW]
  );

  const toY = useCallback(
    (pgi: number) => {
      const ratio = (pgi - yMin) / (yMax - yMin);
      return paddingTop + chartInnerH * (1 - ratio);
    },
    [chartInnerH]
  );

  // Build path
  const linePath = useMemo(() => {
    if (sorted.length === 0) return "";
    return sorted
      .map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(d.pgi).toFixed(1)}`)
      .join(" ");
  }, [sorted, toX, toY]);

  // Area path (fill under line)
  const areaPath = useMemo(() => {
    if (sorted.length === 0) return "";
    const bottom = toY(yMin);
    const first = `M ${toX(0).toFixed(1)} ${bottom}`;
    const lineUp = sorted
      .map((d, i) => `L ${toX(i).toFixed(1)} ${toY(d.pgi).toFixed(1)}`)
      .join(" ");
    const close = `L ${toX(sorted.length - 1).toFixed(1)} ${bottom} Z`;
    return `${first} ${lineUp} ${close}`;
  }, [sorted, toX, toY]);

  // Gradient stops for the line (colour by tier at each Y position)
  const gradientStops = useMemo(() => {
    const stops = [
      { offset: "0%", color: "#ef4444" },    // top (10) = red
      { offset: "20%", color: "#ef4444" },   // 8
      { offset: "40%", color: "#f97316" },   // 6
      { offset: "60%", color: "#f59e0b" },   // 4
      { offset: "100%", color: "#10b981" },  // 0 = emerald
    ];
    return stops;
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current || sorted.length === 0) return;
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const svgX = (mouseX / rect.width) * viewBoxWidth;

      // Find closest data point
      let closest = 0;
      let minDist = Infinity;
      for (let i = 0; i < sorted.length; i++) {
        const dist = Math.abs(toX(i) - svgX);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      }
      setHoveredIndex(closest);
    },
    [sorted, toX]
  );

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-black/[0.06] bg-white/80 p-6 dark:border-white/[0.06] dark:bg-white/[0.03]">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          No PGI data available yet.
        </p>
      </div>
    );
  }

  const gridYValues = [2, 4, 6, 8, 10];
  const midlineY = toY(5);

  return (
    <div className="rounded-xl border border-black/[0.06] bg-white/80 dark:border-white/[0.06] dark:bg-white/[0.03]">
      {title && (
        <div className="px-5 pt-4 pb-1">
          <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-[#c8922a]">
            {title}
          </h3>
        </div>
      )}

      <div className="px-3 pt-2 pb-1">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewBoxWidth} ${height}`}
          className="w-full"
          style={{ height: `${height}px` }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
          role="img"
          aria-label={`PGI trend chart showing ${sorted.length} data points`}
        >
          <defs>
            {/* Vertical gradient for the stroke (top=10/red, bottom=0/green) */}
            <linearGradient id="pgi-line-gradient" x1="0" y1="0" x2="0" y2="1">
              {gradientStops.map((s, i) => (
                <stop key={i} offset={s.offset} stopColor={s.color} />
              ))}
            </linearGradient>
            {/* Area fill gradient */}
            <linearGradient id="pgi-area-gradient" x1="0" y1="0" x2="0" y2="1">
              {gradientStops.map((s, i) => (
                <stop
                  key={i}
                  offset={s.offset}
                  stopColor={s.color}
                  stopOpacity={i === 0 ? 0.08 : 0.02}
                />
              ))}
            </linearGradient>
          </defs>

          {/* Background bands */}
          <rect
            x={paddingLeft}
            y={toY(10)}
            width={chartInnerW}
            height={toY(8) - toY(10)}
            fill="#ef4444"
            opacity={0.025}
          />
          <rect
            x={paddingLeft}
            y={toY(8)}
            width={chartInnerW}
            height={toY(6) - toY(8)}
            fill="#f97316"
            opacity={0.025}
          />
          <rect
            x={paddingLeft}
            y={toY(6)}
            width={chartInnerW}
            height={toY(4) - toY(6)}
            fill="#f59e0b"
            opacity={0.025}
          />
          <rect
            x={paddingLeft}
            y={toY(4)}
            width={chartInnerW}
            height={toY(0) - toY(4)}
            fill="#10b981"
            opacity={0.025}
          />

          {/* Gridlines */}
          {gridYValues.map((v) => (
            <g key={v}>
              <line
                x1={paddingLeft}
                y1={toY(v)}
                x2={paddingLeft + chartInnerW}
                y2={toY(v)}
                stroke="currentColor"
                className="text-zinc-200 dark:text-zinc-800"
                strokeWidth={0.5}
              />
              <text
                x={paddingLeft - 6}
                y={toY(v) + 3}
                textAnchor="end"
                className="fill-zinc-400 dark:fill-zinc-600"
                fontSize={9}
                fontFamily="system-ui, sans-serif"
              >
                {v}
              </text>
            </g>
          ))}

          {/* Midpoint dashed line at PGI 5 */}
          <line
            x1={paddingLeft}
            y1={midlineY}
            x2={paddingLeft + chartInnerW}
            y2={midlineY}
            stroke="currentColor"
            className="text-zinc-300 dark:text-zinc-700"
            strokeWidth={0.8}
            strokeDasharray="4 3"
          />

          {/* Area fill */}
          <path d={areaPath} fill="url(#pgi-area-gradient)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#pgi-line-gradient)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data point dots */}
          {sorted.map((d, i) => (
            <circle
              key={i}
              cx={toX(i)}
              cy={toY(d.pgi)}
              r={hoveredIndex === i ? 4.5 : 2.5}
              fill={getTierColor(d.pgi)}
              className="transition-all duration-100"
              stroke={hoveredIndex === i ? "white" : "none"}
              strokeWidth={hoveredIndex === i ? 1.5 : 0}
            />
          ))}

          {/* X-axis date labels (every 5th) */}
          {sorted.map((d, i) => {
            const showLabel =
              i === 0 ||
              i === sorted.length - 1 ||
              (sorted.length > 10 ? i % 5 === 0 : i % 2 === 0);
            if (!showLabel) return null;
            return (
              <text
                key={`label-${i}`}
                x={toX(i)}
                y={height - 6}
                textAnchor="middle"
                className="fill-zinc-400 dark:fill-zinc-600"
                fontSize={8}
                fontFamily="system-ui, sans-serif"
              >
                {formatDateLabel(d.date)}
              </text>
            );
          })}

          {/* Hover tooltip */}
          {hoveredIndex !== null && sorted[hoveredIndex] && (() => {
            const d = sorted[hoveredIndex];
            const cx = toX(hoveredIndex);
            const cy = toY(d.pgi);
            const tooltipW = 100;
            const tooltipH = 36;
            // Keep tooltip within bounds
            let tx = cx - tooltipW / 2;
            if (tx < paddingLeft) tx = paddingLeft;
            if (tx + tooltipW > viewBoxWidth - paddingRight)
              tx = viewBoxWidth - paddingRight - tooltipW;
            const ty = cy - tooltipH - 10;

            return (
              <g>
                {/* Vertical guide */}
                <line
                  x1={cx}
                  y1={paddingTop}
                  x2={cx}
                  y2={height - paddingBottom}
                  stroke="currentColor"
                  className="text-zinc-300 dark:text-zinc-700"
                  strokeWidth={0.5}
                  strokeDasharray="2 2"
                />
                {/* Tooltip bg */}
                <rect
                  x={tx}
                  y={ty < paddingTop ? cy + 10 : ty}
                  width={tooltipW}
                  height={tooltipH}
                  rx={6}
                  className="fill-zinc-900 dark:fill-zinc-100"
                  opacity={0.92}
                />
                {/* Tooltip date */}
                <text
                  x={tx + tooltipW / 2}
                  y={(ty < paddingTop ? cy + 10 : ty) + 14}
                  textAnchor="middle"
                  className="fill-zinc-300 dark:fill-zinc-600"
                  fontSize={9}
                  fontFamily="system-ui, sans-serif"
                >
                  {formatDateLabel(d.date)}
                </text>
                {/* Tooltip score */}
                <text
                  x={tx + tooltipW / 2}
                  y={(ty < paddingTop ? cy + 10 : ty) + 28}
                  textAnchor="middle"
                  className="fill-white dark:fill-zinc-900"
                  fontSize={13}
                  fontWeight="bold"
                  fontFamily="system-ui, sans-serif"
                >
                  PGI {d.pgi.toFixed(1)}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Stats below chart */}
      {currentPgi !== null && (
        <div className="flex items-baseline gap-3 px-5 pb-4 pt-1">
          <span className="font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">
            {currentPgi.toFixed(1)}
          </span>
          {delta !== null && (
            <span
              className="text-sm font-medium"
              style={{ color: delta >= 0 ? "#ef4444" : "#10b981" }}
            >
              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}
              <span className="ml-1 text-xs text-zinc-400 dark:text-zinc-500 font-normal">
                vs 7d ago
              </span>
            </span>
          )}
          <span className="text-sm text-zinc-400 dark:text-zinc-500">
            {getTierName(currentPgi)}
          </span>
        </div>
      )}
    </div>
  );
}
