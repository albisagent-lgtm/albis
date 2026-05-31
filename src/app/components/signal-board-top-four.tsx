import type { Signal } from "@/lib/signals";
import { inferSignalType, SignalCardV2, type SignalType } from "./signal-card-v2";

const SLOTS: Array<{ type: SignalType; title: string; empty: string }> = [
  { type: "most_covered", title: "Most Covered", empty: "No broad-coverage signal is ready yet." },
  { type: "gap_widening", title: "Gap Widening", empty: "No major framing gap is ready yet." },
  { type: "undercovered", title: "Undercovered", empty: "No undercovered signal is ready yet." },
  { type: "needs_verification", title: "Needs Verification", empty: "No open verification signal is ready yet." },
];

function pickSignals(signals: Signal[]) {
  const remaining = [...signals];
  const picked = new Map<SignalType, Signal>();

  for (const slot of SLOTS) {
    const index = remaining.findIndex((signal) => inferSignalType(signal) === slot.type);
    if (index >= 0) {
      picked.set(slot.type, remaining[index]);
      remaining.splice(index, 1);
    }
  }

  for (const slot of SLOTS) {
    if (picked.has(slot.type)) continue;
    const next = remaining.shift();
    if (next) picked.set(slot.type, next);
  }

  return picked;
}

export function SignalBoardTopFour({ signals }: { signals: Signal[] }) {
  const picked = pickSignals(signals);

  return (
    <section aria-labelledby="top-signals-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.18em] text-[#b58320]">Today&apos;s signal board</p>
          <h2 id="top-signals-heading" className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight md:text-3xl">
            Four ways to see what matters
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Each card explains why it is here: broad coverage, widening perception gap, missing attention, or verification needed.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {SLOTS.map((slot) => {
          const signal = picked.get(slot.type);
          return signal ? (
            <SignalCardV2 key={slot.type} signal={signal} signalType={slot.type} variant="feature" />
          ) : (
            <div key={slot.type} className="rounded-[1.5rem] border border-dashed border-black/[0.1] bg-white/55 p-5 dark:border-white/[0.1] dark:bg-white/[0.025]">
              <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-[#b58320]">{slot.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{slot.empty}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
