"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_META, REGION_LABELS } from "@/lib/scan-types";

interface SearchResult {
  headline: string;
  date: string;
  displayDate: string;
  category: string;
  regions: string[];
  significance: string;
  connection: string;
}

interface SearchBarProps {
  autoFocus?: boolean;
  onActiveChange?: (active: boolean) => void;
}

export function SearchBar({ autoFocus, onActiveChange }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setShowDropdown(false);
      onActiveChange?.(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
      setShowDropdown(true);
      onActiveChange?.(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [onActiveChange]);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      setShowDropdown(false);
      onActiveChange?.(false);
      return;
    }
    debounceRef.current = setTimeout(() => search(value.trim()), 300);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    onActiveChange?.(false);
    inputRef.current?.focus();
  };

  const colorDot: Record<string, string> = {
    blue: "bg-blue-500", violet: "bg-violet-500", cyan: "bg-cyan-500",
    emerald: "bg-emerald-500", amber: "bg-amber-500", rose: "bg-rose-500",
    lime: "bg-lime-500", fuchsia: "bg-fuchsia-500", orange: "bg-orange-500",
    sky: "bg-sky-500", teal: "bg-teal-500", zinc: "bg-zinc-500",
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        {/* Search icon */}
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
          placeholder="Search all scans…"
          className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-10 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500"
        />
        {/* Loading spinner or clear button */}
        {loading ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-600 dark:border-t-zinc-300" />
          </div>
        ) : query ? (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        ) : null}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {results.length === 0 && !loading ? (
            <div className="px-4 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map((r, i) => {
              const meta = CATEGORY_META[r.category] || { label: r.category, color: "zinc" };
              return (
                <button
                  key={`${r.date}-${i}`}
                  onClick={() => {
                    setShowDropdown(false);
                    router.push(`/scan/${r.date}`);
                  }}
                  className="flex w-full flex-col gap-1 border-b border-zinc-100 px-4 py-3 text-left transition-colors hover:bg-zinc-50 last:border-b-0 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">{r.displayDate}</span>
                    <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      <span className={`h-1.5 w-1.5 rounded-full ${colorDot[meta.color] || "bg-zinc-500"}`} />
                      {meta.label}
                    </span>
                    {r.regions.slice(0, 2).map((region) => (
                      <span key={region} className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        {REGION_LABELS[region] || region}
                      </span>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{r.headline}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
