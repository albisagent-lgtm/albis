import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "./components/theme-toggle";
import { NavAuth, NavLinks } from "./components/nav-auth";
import { Footer } from "./components/footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://albis.news";

export const metadata: Metadata = {
  title: {
    default: "Albis — Your Personal News Agent",
    template: "%s | Albis",
  },
  description:
    "Pattern-aware news intelligence. Albis scans the globe daily and surfaces the patterns that matter — without the noise, doom-scrolling, or spin.",
  keywords: [
    "news intelligence",
    "pattern detection",
    "framing analysis",
    "global news",
    "personalised briefing",
    "media literacy",
  ],
  authors: [{ name: "Albis" }],
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Albis",
    title: "Albis — Your Personal News Agent",
    description:
      "Pattern-aware news intelligence. Scans the globe daily and surfaces the patterns that matter — without the noise.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Albis — Pattern-aware news intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Albis — Your Personal News Agent",
    description:
      "Pattern-aware news intelligence. Scans the globe daily and surfaces the patterns that matter — without the noise.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem("albis-theme");if(t==="light"){document.documentElement.classList.remove("dark")}else{document.documentElement.classList.add("dark")}}catch(e){}`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-stone-50 font-[family-name:var(--font-geist-sans)] text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100`}
      >
        {/* Navigation */}
        <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-stone-50/80 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/80">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
            <div className="flex items-center gap-8">
              <Link
                href="/"
                className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
              >
                albis
              </Link>
              <NavLinks />
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <NavAuth />
            </div>
          </div>
        </nav>

        {/* Main content */}
        {children}

        {/* Footer */}
        <Footer />
      </body>
    </html>
  );
}
