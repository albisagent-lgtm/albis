"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  BriefingRenderer,
  type BriefingContent,
} from "@/app/components/briefing-renderer";

export default function BriefingDateClient() {
  const params = useParams();
  const dateParam = params.date as string;
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<BriefingContent | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("company_profiles")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!profile) return;

      const { data: briefing } = await supabase
        .from("company_briefings")
        .select("briefing_content, status")
        .eq("company_profile_id", profile.id)
        .eq("briefing_date", dateParam)
        .single();

      if (
        briefing &&
        (briefing.status === "generated" || briefing.status === "delivered") &&
        briefing.briefing_content
      ) {
        setContent(briefing.briefing_content as BriefingContent);
      } else {
        setNotFound(true);
      }

      setLoading(false);
    });
  }, [dateParam]);

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#c8922a]" />
      </main>
    );
  }

  const cardClass =
    "rounded-2xl border border-black/[0.07] bg-white p-7 md:p-10 dark:border-white/[0.07] dark:bg-white/[0.03]";

  if (notFound) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className={cardClass}>
          <div className="py-12 text-center">
            <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
              Briefing not found
            </h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              No briefing was found for {dateParam}.
            </p>
            <Link
              href="/dashboard/briefings"
              className="mt-4 inline-block text-sm font-medium text-[#c8922a] hover:underline"
            >
              View all briefings
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/dashboard/briefings"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-[#0f0f0f] dark:text-zinc-500 dark:hover:text-[#f0efec]"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        All briefings
      </Link>
      <div className={cardClass}>
        {content && <BriefingRenderer content={content} />}
      </div>
    </main>
  );
}
