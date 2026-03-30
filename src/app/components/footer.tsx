import Link from "next/link";
import { EmailCapture } from "./email-capture";

export function Footer() {
  return (
    <footer className="border-t border-black/[0.07] bg-[#f8f7f4] dark:border-white/[0.05] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-4xl px-6 py-14 md:py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <Link
              href="/"
              className="font-[family-name:var(--font-playfair)] text-2xl italic font-semibold text-[#0f0f0f] dark:text-[#f0efec]"
            >
              Albis
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400 dark:text-zinc-500">
              News intelligence, not noise.
            </p>
            <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
              Free daily briefing · Zero bias · Unsubscribe anytime
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 md:gap-10 max-sm:gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                Sections
              </p>
              <ul className="mt-4 space-y-2.5">
                <FooterLink href="/">Today</FooterLink>
                <FooterLink href="/world">World</FooterLink>
                <FooterLink href="/politics">Politics</FooterLink>
                <FooterLink href="/business">Business</FooterLink>
                <FooterLink href="/technology">Technology</FooterLink>
                <FooterLink href="/health">Health</FooterLink>
                <FooterLink href="/science">Science</FooterLink>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                Explore
              </p>
              <ul className="mt-4 space-y-2.5">
                <FooterLink href="/trending">Trending</FooterLink>
                <FooterLink href="/about">About</FooterLink>
                <li>
                  <a
                    href="/feed.xml"
                    className="text-sm text-zinc-500 transition-colors hover:text-[#c8922a] dark:text-zinc-400 dark:hover:text-[#c8922a]"
                  >
                    RSS Feed
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                Community
              </p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <a
                    href="https://t.me/albisdaily"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-[#c8922a] dark:text-zinc-400 dark:hover:text-[#c8922a]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    Telegram
                  </a>
                </li>
                <li>
                  <a
                    href="https://x.com/albisdaily"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-[#c8922a] dark:text-zinc-400 dark:hover:text-[#c8922a]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    X (Twitter)
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                Newsletter
              </p>
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                Daily briefing, free forever.
              </p>
              <div className="mt-3">
                <EmailCapture variant="hero" showSocialProof={false} showYesterdayLink={false} source="footer" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-black/[0.06] pt-6 sm:flex-row sm:items-center dark:border-white/[0.05]">
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            &copy; {new Date().getFullYear()} Albis. All rights reserved.
          </p>
          <div className="flex gap-5">
            <Link href="/privacy" className="inline-flex min-h-[44px] items-center text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400">
              Privacy
            </Link>
            <Link href="/terms" className="inline-flex min-h-[44px] items-center text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-zinc-500 transition-colors hover:text-[#c8922a] dark:text-zinc-400 dark:hover:text-[#c8922a]"
      >
        {children}
      </Link>
    </li>
  );
}
