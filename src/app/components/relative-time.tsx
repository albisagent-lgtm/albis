"use client";

import { useState, useEffect } from "react";

function getRelativeTime(dateStr: string, prefix: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  
  // If dateStr is YYYY-MM-DD without time, treat as midnight NZ time
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    // Parse as NZ date - approximate by subtracting 13h from UTC
    const nzDate = new Date(dateStr + "T00:00:00+13:00");
    then.setTime(nzDate.getTime());
  }

  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return `${prefix}just now`;
  if (diffMin < 60) return `${prefix}${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHrs < 24) return `${prefix}${diffHrs} hour${diffHrs === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return `${prefix}yesterday`;
  if (diffDays < 7) return `${prefix}${diffDays} days ago`;
  
  return `${prefix}${then.toLocaleDateString("en-NZ", { month: "short", day: "numeric" })}`;
}

export function RelativeTime({
  date,
  prefix = "",
  className = "",
  fallback = null,
}: {
  date: string;
  prefix?: string;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    function update() {
      setText(getRelativeTime(date, prefix));
    }
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [date, prefix]);

  if (!text) return fallback ? <>{fallback}</> : null;
  return <span className={className}>{text}</span>;
}

/**
 * For briefing-specific display:
 * - Today & < 12h: "Published X hours ago"
 * - Today & > 12h: "Published at 7:00am NZDT"
 * - Yesterday: "Yesterday's briefing"
 * - Older: the date
 */
export function BriefingTime({
  date,
  className = "",
  fallback = null,
}: {
  date: string;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    function update() {
      const now = new Date();
      // Get NZ time components
      const nzNow = new Date(now.toLocaleString("en-US", { timeZone: "Pacific/Auckland" }));
      
      let then: Date;
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        then = new Date(date + "T07:00:00+13:00"); // Assume 7am NZ
      } else {
        then = new Date(date);
      }
      const nzThen = new Date(then.toLocaleString("en-US", { timeZone: "Pacific/Auckland" }));

      const diffMs = now.getTime() - then.getTime();
      const diffHrs = Math.floor(diffMs / 3600000);

      const isToday = nzNow.toDateString() === nzThen.toDateString();
      const yesterday = new Date(nzNow);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = yesterday.toDateString() === nzThen.toDateString();

      if (isToday && diffHrs < 12) {
        if (diffHrs < 1) {
          const diffMin = Math.floor(diffMs / 60000);
          setText(`Published ${diffMin} minute${diffMin === 1 ? "" : "s"} ago`);
        } else {
          setText(`Published ${diffHrs} hour${diffHrs === 1 ? "" : "s"} ago`);
        }
      } else if (isToday) {
        const timeStr = nzThen.toLocaleTimeString("en-NZ", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        setText(`Published at ${timeStr} NZDT`);
      } else if (isYesterday) {
        setText("Yesterday's briefing");
      } else {
        setText(nzThen.toLocaleDateString("en-NZ", { month: "short", day: "numeric", year: "numeric" }));
      }
    }
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [date]);

  if (!text) return fallback ? <>{fallback}</> : null;
  return <span className={className}>{text}</span>;
}
