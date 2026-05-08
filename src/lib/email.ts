import { Resend } from "resend";
import { createAdminClient } from "./supabase/admin";

function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  return new Resend(key);
}

const FROM_ADDRESS = "Albis Daily <harry@albis.news>";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = getResendClient();
  const personalizedHtml = html.replaceAll("{{EMAIL}}", encodeURIComponent(to));
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.albis.news";
  const unsubscribeUrl = `${site}/api/unsubscribe?email=${encodeURIComponent(to)}`;
  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html: personalizedHtml,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
}

export async function getSubscriberEmails(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("subscribers")
    .select("email");

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  return (data || [])
    .map((s: { email: string | null }) => s.email)
    .filter((email): email is string => Boolean(email));
}

/**
 * Get subscribers whose local time is currently within a target hour window.
 * Used for timezone-aware daily digest delivery.
 * E.g., targetHour=7 returns subscribers where it's currently 7:00-7:59am local time.
 */
export async function getSubscriberEmailsByLocalHour(targetHour: number): Promise<string[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("subscribers")
    .select("email, timezone");

  if (error) {
    console.error("Failed to fetch subscribers:", error.message);
    return [];
  }

  if (!data || data.length === 0) return [];

  const now = new Date();
  
  return data
    .filter((sub: { email: string; timezone: string | null }) => {
      const tz = sub.timezone || "UTC";
      try {
        // Get the current hour in the subscriber's timezone
        const localHour = parseInt(
          new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            hour12: false,
            timeZone: tz,
          }).format(now)
        );
        return localHour === targetHour;
      } catch {
        // Invalid timezone, skip
        return false;
      }
    })
    .map((sub: { email: string }) => sub.email);
}

export async function sendBulkEmail({
  subject,
  html,
}: {
  subject: string;
  html: string;
}): Promise<number> {
  const emails = await getSubscriberEmails();
  if (emails.length === 0) return 0;

  // Resend batch API supports up to 100 emails per call
  const batch = emails.map((to) => ({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  }));

  const resend = getResendClient();
  const { error } = await resend.batch.send(batch);
  if (error) throw new Error(`Resend batch error: ${error.message}`);

  return emails.length;
}
