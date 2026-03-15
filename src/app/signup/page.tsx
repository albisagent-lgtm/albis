import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import SignupClient from "./signup-client";

export const metadata: Metadata = {
  title: "Subscribe to Albis — Free Daily Global News Briefing",
  description:
    "Get the daily briefing that shows you how the world tells its stories. Free, every morning, no spin.",
  openGraph: {
    title: "Subscribe to Albis",
    description:
      "The daily briefing that shows you how the world tells its stories. Free, every morning.",
    url: "https://www.albis.news/signup",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default async function SignupPage() {
  // Fetch real subscriber count server-side
  let subscriberCount = 0;
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("subscribers")
      .select("*", { count: "exact", head: true });
    subscriberCount = count ?? 0;
  } catch {
    // Fall back to 0 if fetch fails
  }

  return <SignupClient subscriberCount={subscriberCount} />;
}
