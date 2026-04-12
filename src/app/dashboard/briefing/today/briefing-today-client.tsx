"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BriefingRenderer,
  BriefingPending,
  BriefingEmpty,
  type BriefingContent,
} from "@/app/components/briefing-renderer";

export default function BriefingTodayClient() {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<BriefingContent | null>(null);
  const [status, setStatus] = useState<string | null>(null);

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

      // Get most recent briefing
      const { data: briefing } = await supabase
        .from("company_briefings")
        .select("status, briefing_content")
        .eq("company_profile_id", profile.id)
        .order("briefing_date", { ascending: false })
        .limit(1)
        .single();

      if (briefing) {
        setStatus(briefing.status);
        if (
          (briefing.status === "generated" || briefing.status === "delivered") &&
          briefing.briefing_content
        ) {
          setContent(briefing.briefing_content as BriefingContent);
        }
      }

      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#c8922a]" />
      </main>
    );
  }

  const cardClass =
    "rounded-2xl border border-black/[0.07] bg-white p-7 md:p-10 dark:border-white/[0.07] dark:bg-white/[0.03]";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className={cardClass}>
        {content ? (
          <BriefingRenderer content={content} />
        ) : status && status !== "failed" ? (
          <BriefingPending />
        ) : (
          <BriefingEmpty />
        )}
      </div>
    </main>
  );
}
