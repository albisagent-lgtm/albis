import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800/50">
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
            >
              albis
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400 dark:text-zinc-500">
              Pattern-aware news intelligence. See the world clearly, without
              the noise.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                Product
              </p>
              <ul className="mt-3 space-y-2">
                <FooterLink href="/">Home</FooterLink>
                <FooterLink href="/pricing">Pricing</FooterLink>
                <FooterLink href="/login">Login</FooterLink>
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                Company
              </p>
              <ul className="mt-3 space-y-2">
                <FooterLink href="/about">About</FooterLink>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-zinc-200 pt-6 dark:border-zinc-800/50">
          <p className="text-xs text-zinc-300 dark:text-zinc-700">
            &copy; {new Date().getFullYear()} Albis. All rights reserved.
          </p>
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
        className="text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        {children}
      </Link>
    </li>
  );
}
