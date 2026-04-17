"use client";

import { useMemo, useRef, useState } from "react";
import type { TaxonomyOption } from "@/lib/onboarding-taxonomy";

// ---------------------------------------------------------------------------
// TaxonomyCombobox — W3C combobox pattern for themes/watchlist/supply chain
//
// Three visual zones:
//   1. Recommended (selected) — chips for the bundle + any user additions from
//      the catalog. Click × to remove.
//   2. Additional — ghost chips for sector-suggested items not yet selected.
//      Click to add. Labelled "Additional for your sector".
//   3. Browse / search — combobox input; typing filters all catalog items
//      (bundle + additional + rest of catalog). Select a result to add it.
//   4. Custom input — tag-style field at the bottom; user types a tag not in
//      the catalog, press Enter to add. Labelled "Custom (may not score if
//      not in scan data)".
//
// All selected values (whether catalog or custom) end up in the `value`
// string[] prop, which is what the form persists to the DB.
// ---------------------------------------------------------------------------

export interface TaxonomyComboboxProps {
  label: string;
  helpText?: string;
  value: string[]; // selected values (canonical lowercase)
  onChange: (next: string[]) => void;
  catalog: TaxonomyOption[];
  bundleValues?: string[]; // recommended items (pre-selected)
  additionalValues?: string[]; // sector-suggested but not pre-selected
  max: number;
  allowCustom?: boolean;
  customPlaceholder?: string;
}

export function TaxonomyCombobox({
  label,
  helpText,
  value,
  onChange,
  catalog,
  bundleValues = [],
  additionalValues = [],
  max,
  allowCustom = true,
  customPlaceholder = "Add custom tag",
}: TaxonomyComboboxProps) {
  const [search, setSearch] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const valueSet = useMemo(() => new Set(value), [value]);
  const bundleSet = useMemo(() => new Set(bundleValues), [bundleValues]);
  const additionalSet = useMemo(() => new Set(additionalValues), [additionalValues]);

  // Lookup helpers
  const optionByValue = useMemo(() => {
    const m = new Map<string, TaxonomyOption>();
    for (const o of catalog) m.set(o.value, o);
    return m;
  }, [catalog]);

  // What's currently selected, in display order: bundle first, then additional, then custom/other
  const selectedOptions = useMemo(() => {
    const inBundle = value.filter((v) => bundleSet.has(v));
    const inAdditional = value.filter((v) => additionalSet.has(v) && !bundleSet.has(v));
    const others = value.filter((v) => !bundleSet.has(v) && !additionalSet.has(v));
    return { inBundle, inAdditional, others };
  }, [value, bundleSet, additionalSet]);

  // Additional items from the sector bundle that the user hasn't selected yet
  const unselectedAdditional = useMemo(() => {
    return additionalValues
      .filter((v) => !valueSet.has(v))
      .map((v) => optionByValue.get(v))
      .filter((o): o is TaxonomyOption => Boolean(o));
  }, [additionalValues, valueSet, optionByValue]);

  // Filtered catalog for the search dropdown
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return catalog
      .filter((o) => !valueSet.has(o.value))
      .filter((o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.includes(q) ||
        o.scanTags.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 20);
  }, [search, catalog, valueSet]);

  const atLimit = value.length >= max;

  function addValue(v: string) {
    if (valueSet.has(v)) return;
    if (value.length >= max) return;
    onChange([...value, v]);
  }

  function removeValue(v: string) {
    onChange(value.filter((x) => x !== v));
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
      setShowDropdown(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[highlightedIndex]) {
      e.preventDefault();
      addValue(filtered[highlightedIndex].value);
      setSearch("");
      setHighlightedIndex(0);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  function handleCustomKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && customInput.trim()) {
      e.preventDefault();
      const clean = customInput.trim().toLowerCase().replace(/\s+/g, "-");
      if (!valueSet.has(clean) && value.length < max) {
        addValue(clean);
        setCustomInput("");
      }
    }
  }

  // Styling
  const chipBase =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors";
  const recommendedChip =
    `${chipBase} border border-[#c8922a]/30 bg-[#c8922a]/10 text-[#c8922a] hover:bg-[#c8922a]/20`;
  const customChip =
    `${chipBase} border border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300`;
  const additionalChip =
    `${chipBase} border border-dashed border-zinc-400/50 bg-transparent text-zinc-500 hover:border-[#c8922a]/50 hover:text-[#c8922a] dark:border-zinc-600/50 dark:text-zinc-500 cursor-pointer`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {label}
        </label>
        <span className={`text-xs ${atLimit ? "text-amber-600 dark:text-amber-400 font-medium" : "text-zinc-400 dark:text-zinc-600"}`}>
          {value.length}/{max}
        </span>
      </div>
      {helpText && (
        <p className="-mt-1 text-xs text-zinc-400 dark:text-zinc-500">{helpText}</p>
      )}

      {/* Selected items */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.inBundle.concat(selectedOptions.inAdditional).map((v) => {
            const opt = optionByValue.get(v);
            const isBundle = bundleSet.has(v);
            const label = opt?.label ?? v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => removeValue(v)}
                className={recommendedChip}
                title={isBundle ? "Recommended for your sector" : "Sector-relevant"}
              >
                <span>{label}</span>
                {opt?.gap && <span className="text-amber-500" title="May not score — gap in scan data">⚠</span>}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            );
          })}
          {selectedOptions.others.map((v) => {
            const opt = optionByValue.get(v);
            const label = opt?.label ?? v; // custom tags use the raw value
            return (
              <button
                key={v}
                type="button"
                onClick={() => removeValue(v)}
                className={customChip}
                title={opt ? "Selected" : "Custom tag"}
              >
                <span>{label}</span>
                {!opt && <span className="text-[10px] text-zinc-400">custom</span>}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            );
          })}
        </div>
      )}

      {/* Additional (sector-suggested, not yet selected) */}
      {unselectedAdditional.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
            Additional options for your sector
          </p>
          <div className="flex flex-wrap gap-1.5">
            {unselectedAdditional.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => addValue(o.value)}
                disabled={atLimit}
                className={`${additionalChip} ${atLimit ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <span className="text-[#c8922a]">+</span>
                <span>{o.label}</span>
                {o.gap && <span className="text-amber-500">⚠</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search / browse */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowDropdown(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          onKeyDown={handleSearchKeyDown}
          disabled={atLimit}
          placeholder={atLimit ? "Limit reached — remove one to add more" : "Browse all options…"}
          className="h-10 w-full rounded-xl border border-black/[0.1] bg-[#f8f7f4] px-3.5 text-sm text-[#0f0f0f] placeholder:text-zinc-400 focus:border-[#c8922a] focus:outline-none focus:ring-2 focus:ring-[#c8922a]/15 disabled:opacity-60 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-[#f0efec] dark:placeholder:text-zinc-600"
        />
        {showDropdown && filtered.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-black/[0.07] bg-white py-1 shadow-lg dark:border-white/[0.07] dark:bg-[#1a1a1a]">
            {filtered.map((o, i) => (
              <button
                key={o.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  addValue(o.value);
                  setSearch("");
                  setHighlightedIndex(0);
                  inputRef.current?.focus();
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                  i === highlightedIndex
                    ? "bg-[#c8922a]/10 text-[#0f0f0f] dark:text-[#f0efec]"
                    : "text-zinc-600 hover:bg-black/[0.03] dark:text-zinc-300 dark:hover:bg-white/[0.03]"
                }`}
              >
                <span className="flex items-center gap-2">
                  {o.label}
                  {o.gap && <span className="text-amber-500 text-xs" title="May not score">⚠</span>}
                </span>
                {o.category && (
                  <span className="text-[10px] text-zinc-400">{o.category}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Custom input */}
      {allowCustom && !atLimit && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={handleCustomKeyDown}
            placeholder={customPlaceholder}
            className="h-9 flex-1 rounded-lg border border-dashed border-black/[0.1] bg-transparent px-3 text-xs text-[#0f0f0f] placeholder:text-zinc-400 focus:border-[#c8922a] focus:outline-none dark:border-white/[0.1] dark:text-[#f0efec] dark:placeholder:text-zinc-600"
          />
          <span className="shrink-0 text-[10px] text-zinc-400 dark:text-zinc-600">
            Custom · may not score
          </span>
        </div>
      )}
    </div>
  );
}
