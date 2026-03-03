import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global News Perspectives by Country — How the World Reports the News | Albis",
  description:
    "Explore how 195 countries report world news differently. See media framing, coverage patterns, and regional perspectives from every corner of the globe.",
  openGraph: {
    title: "Global News Perspectives by Country | Albis",
    description:
      "Explore how 195 countries report world news differently. See media framing and regional perspectives from every corner of the globe.",
    url: "https://albis.news/perspectives",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://albis.news/perspectives" },
};

export default function PerspectivesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
