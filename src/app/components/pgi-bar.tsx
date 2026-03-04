import Link from "next/link";

interface PgiBarProps {
  pgi: number;
  delta: number | null;
  date: string;
}

function getPgiTier(pgi: number) {
  if (pgi <= 2.0) return { name: "Global Consensus", color: "bg-emerald-500", emoji: "🟢" };
  if (pgi <= 4.0) return { name: "Different Lenses", color: "bg-amber-500", emoji: "🟡" };
  if (pgi <= 6.0) return { name: "Diverging Narratives", color: "bg-orange-500", emoji: "🟠" };
  if (pgi <= 8.0) return { name: "Competing Realities", color: "bg-red-500", emoji: "🔴" };
  return { name: "Parallel Universes", color: "bg-zinc-900", emoji: "⚫" };
}

export function PgiBar({ pgi, delta, date }: PgiBarProps) {
  const tier = getPgiTier(pgi);
  const position = Math.min(Math.max((pgi / 10) * 100, 5), 95);

  return (
    <Link
      href="/indexes"
      aria-label={`Perception Gap Index: ${pgi.toFixed(1)} — ${tier.name}. View details.`}
      className="group flex items-center gap-4 rounded-xl border border-black/[0.06] bg-white/80 px-5 py-3.5 transition-all hover:border-[#c8922a]/30 hover:shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03]"
    >
      {/* PGI number */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className={`h-2.5 w-2.5 rounded-full ${tier.color}`} aria-hidden="true" />
        <span className="font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">
          {pgi.toFixed(1)}
        </span>
      </div>

      {/* Bar visualisation */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-[#c8922a] tracking-wide uppercase">
            Perception Gap Index
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {tier.name}
            {delta !== null && (
              <span className="ml-1.5">
                {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}
              </span>
            )}
          </span>
        </div>
        {/* 4-stop gradient via inline style (Tailwind only supports one via-) */}
        <div
          className="relative h-1.5 w-full rounded-full"
          style={{
            background: "linear-gradient(to right, #6ee7b7, #fcd34d, #fdba74, #fca5a5)",
          }}
          aria-hidden="true"
        >
          <div
            className={`absolute top-1/2 h-3.5 w-3.5 rounded-full ${tier.color} ring-2 ring-white dark:ring-[#0f0f0f] shadow-sm transition-all`}
            style={{ left: `${position}%`, transform: "translate(-50%, -50%)" }}
          />
        </div>
      </div>

      {/* Arrow */}
      <span className="text-zinc-300 dark:text-zinc-600 group-hover:text-[#c8922a] transition-colors shrink-0" aria-hidden="true">
        →
      </span>
    </Link>
  );
}
