import type { Metadata } from "next";
import { QuizClient } from "./quiz-client";

export const metadata: Metadata = {
  title: "How Healthy Is Your News Diet? Take the Free Quiz — Albis",
  description:
    "Find out if you're stuck in a filter bubble. This 2-minute quiz reveals how balanced your information diet really is. Free, instant results.",
  keywords: [
    "information diet quiz",
    "news bias quiz",
    "filter bubble test",
    "media literacy quiz",
    "how biased is my news",
  ],
  openGraph: {
    title: "How Healthy Is Your News Diet? Take the Free Quiz — Albis",
    description:
      "Find out if you're stuck in a filter bubble. This 2-minute quiz reveals how balanced your information diet really is. Free, instant results.",
    url: "https://www.albis.news/quiz",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  alternates: {
    canonical: "https://www.albis.news/quiz",
  },
};

export default function QuizPage() {
  return <QuizClient />;
}
