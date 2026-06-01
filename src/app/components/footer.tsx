import Link from "next/link";
import { EmailCapture } from "./email-capture";

export function Footer() {
  return (
    <footer className="border-t border-black/[0.07] bg-[#f8f7f4] dark:border-white/[0.05] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-14">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div>
            <Link href="/" className="font-[family-name:var(--font-playfair)] text-2xl italic font-semibold text-[#0f0f0f] dark:text-[#f0efec]">Albis</Link>
            <p className="mt-3 text-sm text-zinc-400 dark:text-zinc-500">Useful cards. Calm discussion.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">Albis</p>
              <ul className="mt-4 space-y-2.5">
                <FooterLink href="/">Feed</FooterLink>
                <FooterLink href="/read">Read</FooterLink>
                <FooterLink href="/create">Create</FooterLink>
                <FooterLink href="/profile">Profile</FooterLink>
                <FooterLink href="/about">About</FooterLink>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">Explore</p>
              <ul className="mt-4 space-y-2.5">
                <FooterLink href="/?filter=weather">Weather in Feed</FooterLink>
                <FooterLink href="/signals">Events archive</FooterLink>
                <FooterLink href="/indexes">Indexes</FooterLink>
                <FooterLink href="/company-daily-scan">Companies</FooterLink>
                <FooterLink href="/world">World archive</FooterLink>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">Daily</p>
              <div className="mt-3">
                <EmailCapture variant="hero" showSocialProof={false} showYesterdayLink={false} source="footer" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-black/[0.06] pt-6 sm:flex-row sm:items-center dark:border-white/[0.05]">
          <p className="text-xs text-zinc-400 dark:text-zinc-600">&copy; {new Date().getFullYear()} Albis.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="inline-flex min-h-[44px] items-center text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400">Privacy</Link>
            <Link href="/terms" className="inline-flex min-h-[44px] items-center text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400">Terms</Link>
            <Link href="/disclaimer" className="inline-flex min-h-[44px] items-center text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-zinc-500 transition-colors hover:text-[#c8922a] dark:text-zinc-400 dark:hover:text-[#c8922a]">
        {children}
      </Link>
    </li>
  );
}
