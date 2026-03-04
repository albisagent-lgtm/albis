"use client";

import { useState } from "react";

// Legacy ShareIcon used by explore-client
export function ShareIcon({ headline }: { headline: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const slug = headline.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80);
    const url = `${typeof window !== "undefined" ? window.location.origin : "https://albis.news"}/compare?story=${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
    }
  };

  return (
    <button
      onClick={handleShare}
      title={copied ? "Copied!" : "Share this story"}
      className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      )}
    </button>
  );
}

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  compact?: boolean;
}

export function ShareButtons({ url, title, description, compact = false }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description || "");

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const redditUrl = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
  const whatsappUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const btnClass = compact
    ? "inline-flex items-center justify-center h-8 w-8 rounded-lg border border-black/[0.06] text-xs transition-colors hover:border-[#c8922a]/30 hover:text-[#c8922a] dark:border-white/[0.06]"
    : "inline-flex items-center gap-2 rounded-lg border border-black/[0.06] px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-[#c8922a]/30 hover:text-[#c8922a] dark:border-white/[0.06] dark:text-zinc-400";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!compact && (
        <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mr-1">Share:</span>
      )}
      <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className={btnClass} aria-label="Share on X/Twitter">
        {compact ? "𝕏" : "𝕏 Post"}
      </a>
      <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className={btnClass} aria-label="Share on LinkedIn">
        {compact ? "in" : "LinkedIn"}
      </a>
      <a href={redditUrl} target="_blank" rel="noopener noreferrer" className={btnClass} aria-label="Share on Reddit">
        {compact ? "↗" : "Reddit"}
      </a>
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={btnClass} aria-label="Share on WhatsApp">
        {compact ? "💬" : "WhatsApp"}
      </a>
      <button onClick={copyLink} className={btnClass} aria-label="Copy link">
        {copied ? (compact ? "✓" : "Copied!") : (compact ? "🔗" : "Copy link")}
      </button>
    </div>
  );
}

interface EmbedCodeProps {
  src: string;
  width?: number;
  height?: number;
}

export function EmbedCode({ src, width = 400, height = 200 }: EmbedCodeProps) {
  const [copied, setCopied] = useState(false);
  const code = `<iframe src="${src}" width="${width}" height="${height}" style="border:none;border-radius:12px;" loading="lazy"></iframe>`;

  async function copyEmbed() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="rounded-lg border border-black/[0.06] bg-zinc-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Embed this widget</span>
        <button
          onClick={copyEmbed}
          className="text-xs font-medium text-[#c8922a] hover:text-[#c8922a]/80 transition-colors"
        >
          {copied ? "Copied!" : "Copy code"}
        </button>
      </div>
      <pre className="text-[11px] text-zinc-400 dark:text-zinc-500 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
        {code}
      </pre>
    </div>
  );
}
