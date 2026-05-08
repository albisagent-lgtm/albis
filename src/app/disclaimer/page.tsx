import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer — Albis",
  description:
    "Important disclaimer for Albis public briefings, Company Daily Scan, indexes, and analysis.",
};

export default function DisclaimerPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <header className="mb-12">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold tracking-tight md:text-4xl">
          Disclaimer
        </h1>
        <p className="mt-3 text-sm text-zinc-400 dark:text-zinc-500">
          Last updated: 8 May 2026
        </p>
      </header>

      <div className="space-y-10 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        <section>
          <p>
            Albis provides public news briefings, indexes, analysis, and private Company Daily Scan briefings for informational purposes only. We aim to make global information easier to understand, but Albis should not be treated as a substitute for professional advice or independent judgement.
          </p>
        </section>

        <Section title="Informational only">
          <p>
            Albis content is not legal, financial, investment, tax, medical, security, compliance, or other professional advice. You should consult qualified professionals before making decisions that require professional judgement.
          </p>
        </Section>

        <Section title="No guarantee of completeness or accuracy">
          <p>
            We work to produce careful, source-backed analysis, but news and open-source information can be incomplete, delayed, disputed, mistranslated, or wrong. We do not guarantee that Albis will identify every relevant event, risk, opportunity, source, jurisdiction, or narrative shift.
          </p>
        </Section>

        <Section title="Company Daily Scan">
          <p>
            Company Daily Scan is designed to help organisations monitor external signals across news, regions, sectors, source frames, and watchlists. It is an intelligence aid, not a decision-making authority. Customers remain responsible for verifying information and deciding what action, if any, to take.
          </p>
        </Section>

        <Section title="Indexes and scores">
          <p>
            Albis indexes, including the Perception Gap Index and Global Attention Index, are analytical tools based on available source coverage and methodology choices. They are indicators, not definitive measurements of truth, public opinion, risk, or importance.
          </p>
        </Section>

        <Section title="External sources and links">
          <p>
            Albis references and links to external sources. We do not control those sources and are not responsible for their content, availability, accuracy, or policies. Source links are provided for context and verification.
          </p>
        </Section>

        <Section title="Your responsibility">
          <p>
            You are responsible for how you use Albis. Do not rely solely on Albis for decisions that may affect legal obligations, finances, operations, safety, reputation, employment, compliance, or other significant matters.
          </p>
        </Section>

        <Section title="Questions">
          <p>
            If you have questions about this disclaimer, contact us at{" "}
            <a
              href="mailto:hello@albis.news"
              className="font-medium text-[#c8922a] underline decoration-[#c8922a]/30 underline-offset-2 hover:decoration-[#c8922a]"
            >
              hello@albis.news
            </a>
            .
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
