import { Resend } from "resend";
import { createAdminClient } from "./supabase/admin";

const resend = new Resend(process.env.RESEND_API_KEY);

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
  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
}

export async function getSubscriberEmails(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("subscribers")
    .select("email")
    .eq("subscribed", true);

  if (error) {
    console.error("Failed to fetch subscribers:", error.message);
    // Fallback: try without the subscribed filter (column might not exist yet)
    const { data: allData, error: allError } = await supabase
      .from("subscribers")
      .select("email");
    if (allError) throw new Error(`Supabase error: ${allError.message}`);
    return (allData || []).map((s: { email: string }) => s.email);
  }

  return (data || []).map((s: { email: string }) => s.email);
}

/**
 * Get subscribers whose local time is currently within a target hour window.
 * Used for timezone-aware daily digest delivery.
 * E.g., targetHour=7 returns subscribers where it's currently 7:00-7:59am local time.
 */
export async function getSubscriberEmailsByLocalHour(targetHour: number): Promise<string[]> {
  const supabase = createAdminClient();

  // Prefer the subscribed=true filter; fall back if the column doesn't exist
  // (matches the pattern used by getSubscriberEmails).
  let data: { email: string; timezone: string | null }[] | null = null;
  const filtered = await supabase
    .from("subscribers")
    .select("email, timezone")
    .eq("subscribed", true);

  if (filtered.error) {
    const fallback = await supabase.from("subscribers").select("email, timezone");
    if (fallback.error) {
      console.error("Failed to fetch subscribers:", fallback.error.message);
      return [];
    }
    data = fallback.data;
  } else {
    data = filtered.data;
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

  const { error } = await resend.batch.send(batch);
  if (error) throw new Error(`Resend batch error: ${error.message}`);

  return emails.length;
}
