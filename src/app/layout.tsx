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
    default: "Albis — Global News From Every Region",
    template: "%s | Albis News",
  },
  description:
    "Global news scanned from 60 countries, 7 regions, and 16 languages every day — with private company daily scans for organisations that need the global picture translated into their own risks and decisions.",
  keywords: [
    "global news",
    "world news",
    "news from every region",
    "international news",
    "news analysis",
    "media literacy",
    "news intelligence",
    "company daily briefing",
    "external risk briefing",
    "business news intelligence",
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
    title: "Albis — Global News From Every Region",
    description:
      "Global news scanned from 60 countries, 7 regions, and 16 languages every day — plus private company daily scans.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Albis — Global News From Every Region",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Albis — Global News From Every Region",
    description: "Global news from 60 countries, 7 regions, and 16 languages. Every day — with private company daily scans.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
        <link rel="alternate" type="application/rss+xml" title="Albis News" href="https://www.albis.news/feed.xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-49B2PLPBJP');setTimeout(function(){var s=document.createElement('script');s.src='https://www.googletagmanager.com/gtag/js?id=G-49B2PLPBJP';document.head.appendChild(s)},2500);`,
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
              "@type": "NewsMediaOrganization",
              "@id": "https://www.albis.news/#organization",
              name: "Albis",
              alternateName: "Albis News Intelligence",
              url: "https://www.albis.news",
              logo: {
                "@type": "ImageObject",
                url: "https://www.albis.news/icon-512.png",
                width: 512,
                height: 512,
              },
              description:
                "Albis is a global news intelligence platform that scans media in 16 languages across 60 countries three times daily, measuring narrative divergence using the Perception Gap Index (PGI) and Global Attention Index (GAI).",
              foundingDate: "2026",
              sameAs: [
                "https://twitter.com/AlbisDaily",
                "https://t.me/albisdaily",
              ],
              knowsAbout: [
                "Media framing",
                "News bias",
                "Information warfare",
                "Geopolitics",
                "Media literacy",
                "Perception gap",
                "External risk monitoring",
                "Company intelligence briefings",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "editorial",
                email: "hello@albis.news",
              },
              publishingPrinciples: "https://www.albis.news/methodology",
              ethicsPolicy: "https://www.albis.news/methodology",
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
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${sourceSerif4.variable} ${inter.variable} min-h-screen bg-[#f8f7f4] font-[family-name:var(--font-source-serif)] text-[#0f0f0f] antialiased dark:bg-[#0f0f0f] dark:text-[#f0efec]`}
      >
        {/* Navigation — hides on scroll down, shows on scroll up (mobile) */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-lg focus:bg-[#c8922a] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white">Skip to content</a>
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

        {/* Main content with page transition + mobile nav clearance */}
        <div id="main-content" className="page-transition pb-20 md:pb-0">
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
