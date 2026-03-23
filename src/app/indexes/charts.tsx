"use client";

import { useState, useMemo, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceArea,
} from "recharts";

// --- Constants ---
const PGI_COLOR = "#c8922a";
const GAI_COLOR = "#c8922a";

const TIER_BANDS = [
  { y1: 0, y2: 2, fill: "#22c55e", pgiLabel: "Global Consensus", gaiLabel: "Global Spotlight" },
  { y1: 2, y2: 4, fill: "#eab308", pgiLabel: "Different Lenses", gaiLabel: "Broad Awareness" },
  { y1: 4, y2: 6, fill: "#f97316", pgiLabel: "Diverging Narratives", gaiLabel: "Selective Visibility" },
  { y1: 6, y2: 8, fill: "#ef4444", pgiLabel: "Competing Realities", gaiLabel: "Information Shadow" },
  { y1: 8, y2: 10, fill: "#71717a", pgiLabel: "Parallel Universes", gaiLabel: "Near Invisible" },
];

type TimeRange = "7D" | "30D" | "90D" | "1Y" | "ALL";

const RANGES: TimeRange[] = ["7D", "30D", "90D", "1Y", "ALL"];

function daysForRange(range: TimeRange): number | null {
  switch (range) {
    case "7D": return 7;
    case "30D": return 30;
    case "90D": return 90;
    case "1Y": return 365;
    case "ALL": return null;
  }
}

function tierName(score: number, type: "pgi" | "gai" = "pgi"): string {
  const idx = Math.min(Math.floor(score / 2), 4);
  const band = TIER_BANDS[idx];
  return type === "pgi" ? band.pgiLabel : band.gaiLabel;
}

function tierColor(score: number): string {
  const idx = Math.min(Math.floor(score / 2), 4);
  return TIER_BANDS[idx].fill;
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function filterByRange<T extends { date: string }>(data: T[], range: TimeRange): T[] {
  const days = daysForRange(range);
  if (!days || data.length === 0) return data;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return data.filter((d) => d.date >= cutoffStr);
}

function xAxisInterval(count: number): number {
  if (count <= 10) return 0;
  if (count <= 30) return Math.floor(count / 8);
  if (count <= 90) return Math.floor(count / 10);
  return Math.floor(count / 12);
}

// --- Time range selector ---
function RangeSelector({
  active,
  onChange,
  availableRanges,
}: {
  active: TimeRange;
  onChange: (r: TimeRange) => void;
  availableRanges: TimeRange[];
}) {
  return (
    <div className="flex gap-1">
      {RANGES.map((r) => {
        const available = availableRanges.includes(r);
        return (
          <button
            key={r}
            onClick={() => available && onChange(r)}
            disabled={!available}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              active === r
                ? "bg-[#0f0f0f] text-white dark:bg-white dark:text-[#0f0f0f]"
                : available
                  ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-white/[0.06] dark:text-zinc-400 dark:hover:bg-white/[0.1]"
                  : "cursor-default bg-zinc-50 text-zinc-300 dark:bg-white/[0.02] dark:text-zinc-700"
            }`}
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}

// --- Tier background bands ---
function TierBands() {
  return (
    <>
      {TIER_BANDS.map((band) => (
        <ReferenceArea
          key={band.y1}
          y1={band.y1}
          y2={band.y2}
          fill={band.fill}
          fillOpacity={0.04}
          ifOverflow="extendDomain"
        />
      ))}
    </>
  );
}

// --- Available ranges based on data span ---
function getAvailableRanges(data: { date: string }[]): TimeRange[] {
  if (data.length === 0) return ["7D"];
  const first = new Date(data[0].date + "T00:00:00");
  const last = new Date(data[data.length - 1].date + "T00:00:00");
  const span = (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24);
  const ranges: TimeRange[] = ["7D"];
  if (span >= 14) ranges.push("30D");
  if (span >= 45) ranges.push("90D");
  if (span >= 120) ranges.push("1Y");
  if (span >= 200) ranges.push("ALL");
  return ranges;
}

function bestDefaultRange(data: { date: string }[]): TimeRange {
  const avail = getAvailableRanges(data);
  if (avail.includes("30D")) return "30D";
  return avail[avail.length - 1];
}

// --- Custom tooltip ---
function IndexTooltip({
  active,
  payload,
  label,
  dataKey,
  color,
  indexName,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
  dataKey: string;
  color: string;
  indexName: string;
}) {
  if (!active || !payload || !label) return null;
  const entry = payload.find((p) => p.dataKey === dataKey);
  if (!entry) return null;
  const score = entry.value;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatFullDate(String(label))}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color }}>
        {score.toFixed(2)}
      </p>
      <p className="text-xs font-medium" style={{ color }}>
        {tierName(score)} {indexName}
      </p>
    </div>
  );
}

function DivergenceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload || !label) return null;
  const pgi = payload.find((p) => p.dataKey === "pgi");
  const gai = payload.find((p) => p.dataKey === "gai");

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">{formatFullDate(String(label))}</p>
      {pgi && (
        <div className="flex items-baseline gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: PGI_COLOR }}
          />
          <span className="text-lg font-bold" style={{ color: PGI_COLOR }}>
            {pgi.value.toFixed(2)}
          </span>
          <span className="text-xs text-zinc-400">PGI — {tierName(pgi.value)}</span>
        </div>
      )}
      {gai && (
        <div className="flex items-baseline gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: GAI_COLOR }}
          />
          <span className="text-lg font-bold" style={{ color: GAI_COLOR }}>
            {gai.value.toFixed(2)}
          </span>
          <span className="text-xs text-zinc-400">GAI — {tierName(gai.value, "gai")}</span>
        </div>
      )}
      {pgi && gai && (
        <p className="mt-2 border-t border-zinc-100 pt-2 text-xs text-zinc-400 dark:border-zinc-800">
          Gap: {Math.abs(pgi.value - gai.value).toFixed(2)}
        </p>
      )}
    </div>
  );
}

// --- PGI Full Chart ---
type PgiPoint = { date: string; daily_pgi: number };

export function PgiChart({ data }: { data: PgiPoint[] }) {
  const availableRanges = useMemo(() => getAvailableRanges(data), [data]);
  const [range, setRange] = useState<TimeRange>(() => bestDefaultRange(data));
  const filtered = useMemo(() => filterByRange(data, range), [data, range]);
  const latest = data.length > 0 ? data[data.length - 1] : null;

  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center">
        <p className="text-sm text-zinc-400">No PGI data available yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {latest && (
            <>
              <p className="text-4xl font-bold tracking-tight" style={{ color: tierColor(latest.daily_pgi) }}>
                {latest.daily_pgi.toFixed(2)}
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {tierName(latest.daily_pgi)} — {formatFullDate(latest.date)}
              </p>
            </>
          )}
        </div>
        <RangeSelector active={range} onChange={setRange} availableRanges={availableRanges} />
      </div>
      <div className="h-80 w-full md:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filtered} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="pgiGradFull" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PGI_COLOR} stopOpacity={0.15} />
                <stop offset="100%" stopColor={PGI_COLOR} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <TierBands />
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="currentColor"
              className="text-zinc-100 dark:text-zinc-800"
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              axisLine={false}
              tickLine={false}
              interval={xAxisInterval(filtered.length)}
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              axisLine={false}
              tickLine={false}
              ticks={[0, 2, 4, 6, 8, 10]}
              width={32}
            />
            <Tooltip
              content={
                <IndexTooltip
                  dataKey="daily_pgi"
                  color={PGI_COLOR}
                  indexName="PGI"
                />
              }
            />
            <Area
              type="monotone"
              dataKey="daily_pgi"
              stroke={PGI_COLOR}
              strokeWidth={2}
              fill="url(#pgiGradFull)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: PGI_COLOR }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[10px] text-zinc-400">
        {TIER_BANDS.map((b) => (
          <span key={b.y1} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-6 rounded-sm"
              style={{ backgroundColor: b.fill, opacity: 0.25 }}
            />
            {b.y1}–{b.y2} {b.pgiLabel}
          </span>
        ))}
      </div>
    </div>
  );
}

// --- GAI Full Chart ---
type GaiPoint = { date: string; daily_gai: number };

export function GaiChart({ data }: { data: GaiPoint[] }) {
  const availableRanges = useMemo(() => getAvailableRanges(data), [data]);
  const [range, setRange] = useState<TimeRange>(() => bestDefaultRange(data));
  const filtered = useMemo(() => filterByRange(data, range), [data, range]);
  const latest = data.length > 0 ? data[data.length - 1] : null;

  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Data collection begins today</p>
          <p className="mt-2 text-xs text-zinc-400">
            The Global Attention Index will appear here once data accumulates
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {latest && (
            <>
              <p className="text-4xl font-bold tracking-tight" style={{ color: tierColor(latest.daily_gai) }}>
                {latest.daily_gai.toFixed(2)}
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {tierName(latest.daily_gai, "gai")} — {formatFullDate(latest.date)}
              </p>
            </>
          )}
        </div>
        <RangeSelector active={range} onChange={setRange} availableRanges={availableRanges} />
      </div>
      <div className="h-80 w-full md:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filtered} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="gaiGradFull" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GAI_COLOR} stopOpacity={0.15} />
                <stop offset="100%" stopColor={GAI_COLOR} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <TierBands />
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="currentColor"
              className="text-zinc-100 dark:text-zinc-800"
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              axisLine={false}
              tickLine={false}
              interval={xAxisInterval(filtered.length)}
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              axisLine={false}
              tickLine={false}
              ticks={[0, 2, 4, 6, 8, 10]}
              width={32}
            />
            <Tooltip
              content={
                <IndexTooltip
                  dataKey="daily_gai"
                  color={GAI_COLOR}
                  indexName="GAI"
                />
              }
            />
            <Area
              type="monotone"
              dataKey="daily_gai"
              stroke={GAI_COLOR}
              strokeWidth={2}
              fill="url(#gaiGradFull)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: GAI_COLOR }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[10px] text-zinc-400">
        {TIER_BANDS.map((b) => (
          <span key={b.y1} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-6 rounded-sm"
              style={{ backgroundColor: b.fill, opacity: 0.25 }}
            />
            {b.y1}–{b.y2} {b.gaiLabel}
          </span>
        ))}
      </div>
    </div>
  );
}

// --- Combined Divergence Chart ---
type CombinedPoint = { date: string; pgi?: number; gai?: number };

export function DivergenceChart({
  data,
  hasPgi,
  hasGai,
}: {
  data: CombinedPoint[];
  hasPgi: boolean;
  hasGai: boolean;
}) {
  const availableRanges = useMemo(() => getAvailableRanges(data), [data]);
  const [range, setRange] = useState<TimeRange>(() => bestDefaultRange(data));
  const filtered = useMemo(() => filterByRange(data, range), [data, range]);

  // Build the gap-shaded area data: we render an area between PGI and GAI
  // by providing both values and using a stacked approach with a custom area.
  // Recharts doesn't natively shade between two lines, so we use a trick:
  // render a semi-transparent area for each line and they visually overlap.

  if (!hasPgi && !hasGai) {
    return (
      <div className="flex h-80 items-center justify-center">
        <p className="text-sm text-zinc-400">No index data available yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
            The Divergence
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {hasPgi && hasGai
              ? "PGI and GAI — when lines diverge, information fails differently"
              : hasPgi
                ? "PGI only — GAI data collection has not started"
                : "GAI only — PGI data not yet available"}
          </p>
        </div>
        <RangeSelector active={range} onChange={setRange} availableRanges={availableRanges} />
      </div>
      <div className="h-80 w-full md:h-[28rem]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filtered} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="pgiDivGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PGI_COLOR} stopOpacity={0.12} />
                <stop offset="100%" stopColor={PGI_COLOR} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gaiDivGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GAI_COLOR} stopOpacity={0.12} />
                <stop offset="100%" stopColor={GAI_COLOR} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <TierBands />
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="currentColor"
              className="text-zinc-100 dark:text-zinc-800"
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              axisLine={false}
              tickLine={false}
              interval={xAxisInterval(filtered.length)}
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              axisLine={false}
              tickLine={false}
              ticks={[0, 2, 4, 6, 8, 10]}
              width={32}
            />
            <Tooltip content={<DivergenceTooltip />} />
            {hasPgi && (
              <Area
                type="monotone"
                dataKey="pgi"
                stroke={PGI_COLOR}
                strokeWidth={2}
                fill="url(#pgiDivGrad)"
                dot={false}
                connectNulls
                activeDot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: PGI_COLOR }}
              />
            )}
            {hasGai && (
              <Area
                type="monotone"
                dataKey="gai"
                stroke={GAI_COLOR}
                strokeWidth={2}
                fill="url(#gaiDivGrad)"
                dot={false}
                connectNulls
                activeDot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: GAI_COLOR }}
              />
            )}
            <Legend
              formatter={(value: string) =>
                value === "pgi" ? "Perception Gap (PGI)" : "Attention Gap (GAI)"
              }
              wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
              iconType="line"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[10px] text-zinc-400">
        {TIER_BANDS.map((b) => (
          <span key={b.y1} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-6 rounded-sm"
              style={{ backgroundColor: b.fill, opacity: 0.25 }}
            />
            {b.y1}–{b.y2} {b.pgiLabel}
          </span>
        ))}
      </div>
    </div>
  );
}
