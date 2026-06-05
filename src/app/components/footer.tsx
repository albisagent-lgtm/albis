import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-black/[0.07] bg-[#f8f7f4] dark:border-white/[0.05] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-6xl px-6 py-8 md:py-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <Link href="/" className="font-[family-name:var(--font-playfair)] text-2xl italic font-semibold text-[#0f0f0f] dark:text-[#f0efec]">Albis</Link>
            <p className="mt-2 max-w-sm text-sm text-zinc-400 dark:text-zinc-500">News intelligence, not noise.</p>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-2 font-[family-name:var(--font-inter)] text-sm" aria-label="Footer navigation">
            <FooterLink href="/">Feed</FooterLink>
            <FooterLink href="/read">Read</FooterLink>
            <FooterLink href="/create">Create</FooterLink>
            <FooterLink href="/signals">Signals</FooterLink>
            <FooterLink href="/indexes">Indexes</FooterLink>
            <FooterLink href="/about">About</FooterLink>
          </nav>
        </div>

        <div className="mt-7 flex flex-col items-start justify-between gap-4 border-t border-black/[0.06] pt-5 sm:flex-row sm:items-center dark:border-white/[0.05]">
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
    <Link href={href} className="text-zinc-500 transition-colors hover:text-[#c8922a] dark:text-zinc-400 dark:hover:text-[#c8922a]">
      {children}
    </Link>
  );
}
