import type { Metadata } from "next";
import { EmailCapture } from "../../components/email-capture";

interface PageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: "Join Albis — Recommended by a friend",
    description: "Get the world's news from 7 regions, every morning. Free daily briefing with zero bias.",
  };
}

export default async function ReferralPage({ params }: PageProps) {
  const { code } = await params;

  return (
    <main className="min-h-[80vh] flex items-center justify-center bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        {/* Personalised touch */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#c8922a]/10 px-4 py-1.5 text-sm font-medium text-[#c8922a]">
          Recommended by a friend
        </div>

        <h1 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-semibold leading-tight text-[#0f0f0f] dark:text-[#f0efec]">
          The world&apos;s news.<br />All perspectives. 5&nbsp;minutes.
        </h1>

        <p className="mt-4 text-base text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
          See how 7 regions cover the same story — free daily briefing with zero&nbsp;bias.
        </p>

        <div className="mt-8">
          <EmailCapture variant="hero" showSocialProof={true} showYesterdayLink={true} />
        </div>

        {/* Store referral code in client */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem('albis_ref', '${code.replace(/[^a-z0-9]/gi, "")}');
              }
            `,
          }}
        />
      </div>
    </main>
  );
}
