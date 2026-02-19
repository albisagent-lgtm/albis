import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of service for using Albis, the news intelligence platform.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <header className="mb-12">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold tracking-tight md:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-zinc-400 dark:text-zinc-500">
          Last updated: 19 February 2025
        </p>
      </header>

      <div className="space-y-10 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        {/* What Albis is */}
        <Section title="What Albis is">
          <p>
            Albis is a news intelligence platform. We aggregate and analyse news
            from thousands of sources across multiple regions to help you
            understand stories from every angle — without spin, without
            algorithms optimised for engagement, without ads.
          </p>
          <p className="mt-3">
            Albis is not a news publisher. We surface patterns, framing
            differences, and blind spots across the media landscape to give you
            a clearer picture of what&apos;s happening in the world.
          </p>
        </Section>

        {/* Your account */}
        <Section title="Your account">
          <p>
            To access certain features, you need to create an account. You&apos;re
            responsible for keeping your login credentials secure. If you
            suspect unauthorised access, contact us immediately at{" "}
            <a
              href="mailto:hello@albis.news"
              className="font-medium text-[#1a3a5c] underline decoration-[#1a3a5c]/30 underline-offset-2 hover:decoration-[#1a3a5c] dark:text-[#7ab0d8] dark:decoration-[#7ab0d8]/30 dark:hover:decoration-[#7ab0d8]"
            >
              hello@albis.news
            </a>
            .
          </p>
        </Section>

        {/* Acceptable use */}
        <Section title="Acceptable use">
          <p>When using Albis, you agree not to:</p>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>Use automated tools to scrape or bulk-download content.</li>
            <li>Redistribute Albis content commercially without permission.</li>
            <li>Attempt to disrupt, overload, or compromise our systems.</li>
            <li>Impersonate other users or misrepresent your identity.</li>
            <li>Use Albis for any unlawful purpose.</li>
          </ul>
          <p className="mt-3">
            We reserve the right to suspend accounts that violate these terms.
          </p>
        </Section>

        {/* Subscriptions */}
        <Section title="Subscriptions &amp; billing">
          <ul className="mt-1 list-inside list-disc space-y-2">
            <li>
              <strong className="text-zinc-700 dark:text-zinc-300">
                Cancel anytime
              </strong>{" "}
              — you can cancel your subscription at any time from your account
              settings. Your access continues until the end of your current
              billing period.
            </li>
            <li>
              <strong className="text-zinc-700 dark:text-zinc-300">
                Monthly plans
              </strong>{" "}
              — no refunds are issued for partial months after cancellation.
            </li>
            <li>
              <strong className="text-zinc-700 dark:text-zinc-300">
                Annual plans
              </strong>{" "}
              — if you cancel an annual plan, you may receive a pro-rated refund
              for remaining full months at our discretion.
            </li>
            <li>
              <strong className="text-zinc-700 dark:text-zinc-300">
                Price changes
              </strong>{" "}
              — we&apos;ll give you at least 30 days&apos; notice before any
              price increase. Existing billing periods are honoured at the
              original price.
            </li>
          </ul>
        </Section>

        {/* Content & IP */}
        <Section title="Intellectual property">
          <p>
            The Albis platform, including its design, analysis methodology,
            interface, and original written content, is owned by Albis. News
            content we reference remains the property of the original publishers
            — we link to and attribute sources, not republish them.
          </p>
          <p className="mt-3">
            You may share individual insights or briefings for personal,
            non-commercial use with attribution to Albis.
          </p>
        </Section>

        {/* Disclaimer */}
        <Section title="Limitation of liability">
          <p>
            Albis is an informational tool. While we strive for accuracy in our
            analysis and pattern detection:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>
              We do not guarantee the completeness or accuracy of any news
              analysis.
            </li>
            <li>
              Our content is not financial, legal, or professional advice.
            </li>
            <li>
              We are not liable for decisions made based on information
              presented on Albis.
            </li>
            <li>
              Our service is provided &ldquo;as is&rdquo; without warranties of
              any kind, express or implied.
            </li>
          </ul>
          <p className="mt-3">
            To the maximum extent permitted by New Zealand law, Albis&apos;s
            total liability for any claim arising from your use of the service
            shall not exceed the amount you paid us in the 12 months preceding
            the claim.
          </p>
        </Section>

        {/* Changes */}
        <Section title="Changes to these terms">
          <p>
            We may update these terms from time to time. We&apos;ll notify you
            of material changes via email or a prominent notice on the platform.
            Continued use of Albis after changes take effect constitutes
            acceptance of the updated terms.
          </p>
        </Section>

        {/* Governing law */}
        <Section title="Governing law">
          <p>
            These terms are governed by the laws of New Zealand. Any disputes
            will be subject to the exclusive jurisdiction of the New Zealand
            courts.
          </p>
        </Section>

        {/* Contact */}
        <Section title="Questions?">
          <p>
            If anything here is unclear, reach out. We believe in transparency.
          </p>
          <p className="mt-3">
            <a
              href="mailto:hello@albis.news"
              className="font-medium text-[#1a3a5c] underline decoration-[#1a3a5c]/30 underline-offset-2 hover:decoration-[#1a3a5c] dark:text-[#7ab0d8] dark:decoration-[#7ab0d8]/30 dark:hover:decoration-[#7ab0d8]"
            >
              hello@albis.news
            </a>
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
