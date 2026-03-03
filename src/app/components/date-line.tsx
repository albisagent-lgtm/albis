"use client";

import { useEffect, useState } from "react";

export function DateLine() {
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString("en-NZ", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    setDateStr(formatted);
  }, []);

  if (!dateStr) return null;

  return (
    <div className="mx-auto max-w-6xl px-space-6 pt-space-4 pb-0">
      <p className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400">
        {dateStr}
      </p>
    </div>
  );
}
