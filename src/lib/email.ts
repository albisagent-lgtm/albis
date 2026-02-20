import { Resend } from "resend";
import { createAdminClient } from "./supabase/admin";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = "Albis <onboarding@resend.dev>";

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
