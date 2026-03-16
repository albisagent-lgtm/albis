import type { Metadata } from "next";
import { QuizClient } from "./quiz-client";

export const metadata: Metadata = {
  title: "Perspective Check — Can You Tell Where a Headline Comes From?",
  description:
    "Same story, different headline. Test your media awareness by guessing which world region wrote each headline. 5 rounds, 7 regions — how well do you really read the news?",
  keywords: [
    "perspective check quiz",
    "headline quiz",
    "media framing quiz",
    "news bias quiz",
    "media literacy",
    "regional news framing",
    "albis news quiz",
  ],
  openGraph: {
    title: "I took the Perspective Check — can you beat my score?",
    description:
      "Same story, different headline. Test your media awareness by guessing which world region wrote each headline.",
    url: "https://www.albis.news/quiz",
    images: [
      {
        url: "/og-quiz.png",
        width: 1200,
        height: 630,
        alt: "Albis Perspective Check — Can you tell where a headline comes from?",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Perspective Check — Can You Spot Regional News Framing?",
    description:
      "Same story, different headline. 5 rounds, 7 regions. Test your media awareness.",
    images: ["/og-quiz.png"],
  },
  alternates: {
    canonical: "https://www.albis.news/quiz",
  },
};

export default function QuizPage() {
  return <QuizClient />;
}
