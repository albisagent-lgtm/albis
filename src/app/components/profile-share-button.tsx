"use client";

import { useState } from "react";

type Props = {
  handle: string;
  displayName: string;
  className?: string;
};

export function ProfileShareButton({ handle, displayName, className }: Props) {
  const [copied, setCopied] = useState(false);

  async function shareProfile() {
    const cleanHandle = handle.replace(/^@+/, "");
    const path = `/u/${encodeURIComponent(cleanHandle)}`;
    const url = typeof window !== "undefined" ? new URL(path, window.location.origin).toString() : path;
    const text = `${displayName} on Albis`;

    try {
      if (navigator.share) {
        await navigator.share({ title: text, text: `Follow ${displayName}'s public Albis profile.`, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Share sheets can be cancelled; leave the button in its normal state.
    }
  }

  return (
    <button type="button" onClick={shareProfile} className={className} aria-live="polite">
      {copied ? "Copied" : "Share profile"}
    </button>
  );
}
