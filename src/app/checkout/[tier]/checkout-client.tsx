"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TIERS, PURCHASABLE_TIERS } from "@/lib/subscription-tiers";

export default function CheckoutClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tierSlug = params.tier as string;
  const billing =
    searchParams.get("billing") === "annual" ? "annual" : "monthly";

  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");

  const tier = TIERS[tierSlug];
  const isPurchasable = (PURCHASABLE_TIERS as readonly string[]).includes(
    tierSlug,
  );

  useEffect(() => {
    if (!tier || !isPurchasable) {
      setError("Invalid plan selected.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push(
          `/register?redirect=/checkout/${tierSlug}?billing=${billing}`,
        );
        return;
      }

      setLoading(false);

      // Auto-redirect to Stripe checkout
      setRedirecting(true);
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tier: tierSlug,
            billing,
          }),
        });

        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          setError(data.error || "Failed to create checkout session.");
          setRedirecting(false);
        }
      } catch {
        setError("Something went wrong. Please try again.");
        setRedirecting(false);
      }
    });
  }, [tier, isPurchasable, tierSlug, billing, router]);

  if (loading || redirecting) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center bg-[#f8f7f4] dark:bg-[#0f0f0f]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#c8922a]" />
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          {redirecting
            ? `Redirecting to checkout for ${tier?.label || ""}...`
            : "Checking your account..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center bg-[#f8f7f4] dark:bg-[#0f0f0f]">
        <div className="mx-auto max-w-sm text-center">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-4 dark:border-amber-900/50 dark:bg-amber-950/30">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              {error}
            </p>
          </div>
          <Link
            href="/pricing"
            className="mt-4 inline-block text-sm font-medium text-[#c8922a] hover:underline"
          >
            Back to pricing
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
