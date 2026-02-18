import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
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

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "900"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://albis.news";

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
  openGraph: {
    type: "website",
    locale: "en_US",
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
        alt: "Albis — News intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Albis — The news, understood.",
    description: "News intelligence, not noise.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} min-h-screen bg-[#f8f7f4] font-[family-name:var(--font-geist-sans)] text-[#0f0f0f] antialiased dark:bg-[#0f0f0f] dark:text-[#f0efec]`}
      >
        {/* Navigation */}
        <nav className="sticky top-0 z-50 border-b border-black/[0.07] bg-[#f8f7f4]/90 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#0f0f0f]/90">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
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

        {/* Main content */}
        {children}

        {/* Footer */}
        <Footer />
      </body>
    </html>
  );
}
