"use client";

import { useState, useEffect } from "react";

export function NextBriefingCountdown() {
  const [text, setText] = useState("");
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    function update() {
      const now = new Date();
      // Get current NZ time
      const nzStr = now.toLocaleString("en-US", { timeZone: "Pacific/Auckland" });
      const nzNow = new Date(nzStr);
      const nzHour = nzNow.getHours();
      const nzMin = nzNow.getMinutes();

      // Scan times: 7am, 1pm, 7pm NZST
      // "Next briefing" counts to next 7am
      // Between 6:30am-9am: "Today's briefing is live"
      // After 10pm: "Tomorrow's briefing at 7:00am"
      // Otherwise: "Next briefing in X hours"

      if (nzHour >= 6 && nzHour < 9) {
        // Morning window - briefing is live
        setText("Today's briefing is live");
        setIsLive(true);
        return;
      }

      setIsLive(false);

      if (nzHour >= 22) {
        setText("Tomorrow's briefing at 7:00am");
        return;
      }

      // Calculate hours until next 7am
      let hoursUntil: number;
      let minsUntil: number;

      if (nzHour < 7) {
        hoursUntil = 6 - nzHour;
        minsUntil = 60 - nzMin;
        if (minsUntil === 60) {
          minsUntil = 0;
          hoursUntil++;
        }
      } else {
        // After 9am, count to next day's 7am
        hoursUntil = 24 - nzHour + 6;
        minsUntil = 60 - nzMin;
        if (minsUntil === 60) {
          minsUntil = 0;
          hoursUntil++;
        }
      }

      if (hoursUntil > 12) {
        setText(`Next briefing in ${hoursUntil} hours`);
      } else {
        setText(`Next briefing in ${hoursUntil}h ${minsUntil}m`);
      }
    }

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!text) return null;

  return (
    <p className="mt-space-3 flex items-center justify-center gap-space-2 text-xs text-zinc-400 dark:text-zinc-500">
      {isLive && (
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      )}
      {text}
    </p>
  );
}
