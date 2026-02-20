import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Albis collects, uses, and protects your personal information under the New Zealand Privacy Act 2020.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <header className="mb-12">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold tracking-tight md:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-zinc-400 dark:text-zinc-500">
          Last updated: 19 February 2026
        </p>
      </header>

      <div className="space-y-10 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        {/* Intro */}
        <section>
          <p>
            Albis (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a
            New Zealand-based news intelligence platform. We take your privacy
            seriously and handle your personal information in accordance with the{" "}
            <strong className="text-zinc-800 dark:text-zinc-200">
              New Zealand Privacy Act 2020
            </strong>
            .
          </p>
          <p className="mt-3">
            This policy explains what we collect, why, and what rights you have.
          </p>
        </section>

        {/* What we collect */}
        <Section title="What we collect">
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>
              <strong className="text-zinc-700 dark:text-zinc-300">
                Email address
              </strong>{" "}
              — when you sign up or subscribe to our digest.
            </li>
            <li>
              <strong className="text-zinc-700 dark:text-zinc-300">
                Browsing preferences
              </strong>{" "}
              — topics, regions, and reading settings you configure within Albis.
            </li>
            <li>
              <strong className="text-zinc-700 dark:text-zinc-300">
                Account data
              </strong>{" "}
              — your subscription tier and onboarding selections.
            </li>
          </ul>
          <p className="mt-3">
            We collect only the minimum information needed to deliver and
            personalise the Albis experience.
          </p>
        </Section>

        {/* What we don't do */}
        <Section title="What we don't do">
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>We do not sell, rent, or share your personal data with third parties.</li>
            <li>We do not track you for advertising purposes.</li>
            <li>We do not build behavioural profiles for ad targeting.</li>
            <li>We do not use your reading history to serve ads.</li>
          </ul>
        </Section>

        {/* Cookies */}
        <Section title="Cookies">
          <p>
            Albis uses minimal cookies. We store a single preference for your
            theme choice (light or dark mode) in your browser&apos;s local
            storage. We do not use tracking cookies, analytics cookies, or
            third-party advertising cookies.
          </p>
        </Section>

        {/* Data storage */}
        <Section title="Data storage &amp; security">
          <p>
            Your data is stored securely using{" "}
            <strong className="text-zinc-700 dark:text-zinc-300">
              Supabase
            </strong>
            , which provides encrypted data storage with infrastructure hosted
            in secure, SOC 2 Type II compliant data centres. We use
            industry-standard security measures to protect your information.
          </p>
        </Section>

        {/* Your rights */}
        <Section title="Your rights">
          <p>
            Under the New Zealand Privacy Act 2020, you have the right to:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>
              <strong className="text-zinc-700 dark:text-zinc-300">
                Access your data
              </strong>{" "}
              — request a copy of the personal information we hold about you.
            </li>
            <li>
              <strong className="text-zinc-700 dark:text-zinc-300">
                Correct your data
              </strong>{" "}
              — ask us to update or correct inaccurate information.
            </li>
            <li>
              <strong className="text-zinc-700 dark:text-zinc-300">
                Delete your account
              </strong>{" "}
              — request complete deletion of your account and associated data.
            </li>
            <li>
              <strong className="text-zinc-700 dark:text-zinc-300">
                Export your data
              </strong>{" "}
              — receive your personal data in a portable format.
            </li>
            <li>
              <strong className="text-zinc-700 dark:text-zinc-300">
                Unsubscribe
              </strong>{" "}
              — opt out of email communications at any time via the unsubscribe
              link in any email, or through your account settings.
            </li>
          </ul>
        </Section>

        {/* Third-party services */}
        <Section title="Third-party services">
          <p>We use the following services to operate Albis:</p>
          <ul className="mt-3 list-inside list-disc space-y-2">
            <li>
              <strong className="text-zinc-700 dark:text-zinc-300">
                Supabase
              </strong>{" "}
              — authentication and database.
            </li>
            <li>
              <strong className="text-zinc-700 dark:text-zinc-300">
                Vercel
              </strong>{" "}
              — hosting and deployment.
            </li>
            <li>
              <strong className="text-zinc-700 dark:text-zinc-300">
                Stripe
              </strong>{" "}
              — payment processing (we never store your card details directly).
            </li>
          </ul>
        </Section>

        {/* Changes */}
        <Section title="Changes to this policy">
          <p>
            We may update this policy from time to time. Significant changes
            will be communicated via email or a notice on our website. Your
            continued use of Albis after changes constitutes acceptance of the
            updated policy.
          </p>
        </Section>

        {/* Contact */}
        <Section title="Contact us">
          <p>
            If you have questions about this policy, want to exercise any of
            your rights, or wish to make a complaint, contact us at:
          </p>
          <p className="mt-3">
            <a
              href="mailto:hello@albis.news"
              className="font-medium text-[#1a3a5c] underline decoration-[#1a3a5c]/30 underline-offset-2 hover:decoration-[#1a3a5c] dark:text-[#7ab0d8] dark:decoration-[#7ab0d8]/30 dark:hover:decoration-[#7ab0d8]"
            >
              hello@albis.news
            </a>
          </p>
          <p className="mt-3 text-sm text-zinc-400 dark:text-zinc-500">
            If you are unsatisfied with our response, you may contact the{" "}
            <strong>Office of the Privacy Commissioner</strong> at{" "}
            <a
              href="https://privacy.org.nz"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-500 dark:decoration-zinc-600 dark:hover:decoration-zinc-400"
            >
              privacy.org.nz
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
