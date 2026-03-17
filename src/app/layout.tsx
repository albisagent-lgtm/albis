import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Playfair_Display,
  Source_Serif_4,
  Inter,
} from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "./components/theme-toggle";
import { NavAuth, NavLinks } from "./components/nav-auth";
import { MobileNav } from "./components/mobile-nav";
import { Footer } from "./components/footer";
import { BreakingNewsBanner } from "./components/breaking-news-banner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "900"],
  display: "swap",
});

const sourceSerif4 = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.albis.news";

export const metadata: Metadata = {
  title: {
    default: "Albis — The news, understood.",
    template: "%s | Albis",
  },
  description:
    "News intelligence, not noise. Albis gives you the full picture — every source, zero spin, one calm reading experience built for the curious mind.",
  keywords: [
    "news intelligence",
    "pattern detection",
    "framing analysis",
    "global news",
    "personalised briefing",
    "media literacy",
    "anti-doomscroll",
  ],
  authors: [{ name: "Albis" }],
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_NZ",
    url: siteUrl,
    siteName: "Albis",
    title: "Albis — The news, understood.",
    description:
      "News intelligence, not noise. The full picture, every story, zero spin.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Albis — News intelligence, not noise",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Albis — The news, understood.",
    description: "News intelligence, not noise. See the world clearly.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Albis",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="application/rss+xml" title="Albis — The Lens" href="https://www.albis.news/feed.xml" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-49B2PLPBJP" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-49B2PLPBJP');`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem("albis-theme");if(t==="dark"){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Albis",
              url: "https://www.albis.news",
              logo: "https://www.albis.news/icon-512.png",
              description:
                "News intelligence, not noise. Albis gives you the full picture — every source, zero spin, one calm reading experience.",
              contactPoint: {
                "@type": "ContactPoint",
                email: "hello@albis.news",
                contactType: "customer support",
              },
              sameAs: [
                "https://t.me/albisdaily",
                "https://twitter.com/AlbisDaily",
                "https://www.instagram.com/albisnews",
                "https://www.tiktok.com/@albis181",
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Albis",
              url: "https://www.albis.news",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://www.albis.news/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${sourceSerif4.variable} ${inter.variable} min-h-screen bg-[#f8f7f4] font-[family-name:var(--font-inter)] text-[#0f0f0f] antialiased dark:bg-[#0f0f0f] dark:text-[#f0efec]`}
      >
        {/* Breaking News Banner — above everything */}
        <BreakingNewsBanner />

        {/* Navigation — hides on scroll down, shows on scroll up (mobile) */}
        <nav className="nav-auto-hide sticky top-0 z-50 border-b border-black/[0.07] bg-[#f8f7f4]/90 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#0f0f0f]/90">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
            <div className="flex items-center gap-8">
              {/* Logo — editorial serif italic */}
              <Link
                href="/"
                className="font-[family-name:var(--font-playfair)] text-xl italic font-semibold tracking-tight text-[#0f0f0f] hover:opacity-80 dark:text-[#f0efec]"
              >
                Albis
              </Link>
              <NavLinks />
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <NavAuth />
            </div>
          </div>
        </nav>

        {/* Main content with page transition */}
        <div className="page-transition">
          {children}
        </div>

        {/* Footer */}
        <Footer />

        {/* Mobile bottom navigation */}
        <MobileNav />
      </body>
    </html>
  );
}
