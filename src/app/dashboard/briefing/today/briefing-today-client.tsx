"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  BriefingRenderer,
  BriefingPending,
  BriefingEmpty,
  type BriefingContent,
} from "@/app/components/briefing-renderer";
import type { CompanyBriefingGenerationOutput } from "@/lib/company-scan/types";

export default function BriefingTodayClient() {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<
    BriefingContent | CompanyBriefingGenerationOutput | null
  >(null);
  const [status, setStatus] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [briefingDate, setBriefingDate] = useState<string | null>(null);
  const [hasSourceTrail, setHasSourceTrail] = useState(false);

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
      setCompanyId(profile.id);

      // Get most recent daily scan
      const { data: briefing } = await supabase
        .from("company_briefings")
        .select("status, briefing_date, briefing_content")
        .eq("company_profile_id", profile.id)
        .order("briefing_date", { ascending: false })
        .limit(1)
        .single();

      if (briefing) {
        setStatus(briefing.status);
        setBriefingDate(briefing.briefing_date);
        if (
          (briefing.status === "generated" ||
            briefing.status === "delivered") &&
          briefing.briefing_content
        ) {
          const briefingContent = briefing.briefing_content as
            | BriefingContent
            | CompanyBriefingGenerationOutput;
          setContent(briefingContent);
          setHasSourceTrail(
            Boolean(
              (
                briefingContent as CompanyBriefingGenerationOutput & {
                  evidence_document?: unknown;
                }
              ).evidence_document,
            ),
          );
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
      {hasSourceTrail && companyId && briefingDate ? (
        <Link
          href={`/dashboard/company/${companyId}/briefings/${briefingDate}/evidence`}
          className="mb-4 inline-flex rounded-full border border-[#ead7ad] bg-[#fff8e8] px-4 py-2 text-sm font-semibold text-[#8a6018] transition hover:bg-[#fff2d0]"
        >
          View source trail →
        </Link>
      ) : null}
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
