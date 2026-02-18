import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-black/[0.07] bg-[#f8f7f4] dark:border-white/[0.05] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-5xl px-6 py-14 md:py-16">
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
              Pattern-aware news intelligence.
              <br />
              See the world clearly, without the noise.
            </p>
            {/* Tagline accent */}
            <p className="mt-4 text-xs text-[#c8922a]/70 font-medium italic font-[family-name:var(--font-playfair)]">
              &ldquo;The news, understood.&rdquo;
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-14">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                Product
              </p>
              <ul className="mt-4 space-y-2.5">
                <FooterLink href="/">Home</FooterLink>
                <FooterLink href="/briefing">Briefing</FooterLink>
                <FooterLink href="/framing-watch">Framing Watch</FooterLink>
                <FooterLink href="/pricing">Pricing</FooterLink>
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                Company
              </p>
              <ul className="mt-4 space-y-2.5">
                <FooterLink href="/about">About</FooterLink>
                <FooterLink href="/login">Sign in</FooterLink>
                <FooterLink href="/signup">Sign up</FooterLink>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-black/[0.06] pt-6 sm:flex-row sm:items-center dark:border-white/[0.05]">
          <p className="text-xs text-zinc-300 dark:text-zinc-700">
            &copy; {new Date().getFullYear()} Albis. All rights reserved.
          </p>
          <div className="flex gap-5">
            <a href="#" className="text-xs text-zinc-300 hover:text-zinc-500 dark:text-zinc-700 dark:hover:text-zinc-500">
              Privacy
            </a>
            <a href="#" className="text-xs text-zinc-300 hover:text-zinc-500 dark:text-zinc-700 dark:hover:text-zinc-500">
              Terms
            </a>
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
        className="text-sm text-zinc-500 transition-colors hover:text-[#1a3a5c] dark:text-zinc-400 dark:hover:text-[#7ab0d8]"
      >
        {children}
      </Link>
    </li>
  );
}
