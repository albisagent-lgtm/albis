import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const id = searchParams.get("id");

  if (!email && !id) {
    return new NextResponse("Missing email or id parameter", { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    // Try to update subscribed column; if that fails, delete the row
    let query = supabase.from("subscribers");
    if (email) {
      const { error: updateError } = await query
        .update({ subscribed: false })
        .eq("email", email.toLowerCase().trim());

      // If subscribed column doesn't exist, delete instead
      if (updateError) {
        await supabase
          .from("subscribers")
          .delete()
          .eq("email", email.toLowerCase().trim());
      }
    } else if (id) {
      const { error: updateError } = await supabase
        .from("subscribers")
        .update({ subscribed: false })
        .eq("id", id);

      if (updateError) {
        await supabase.from("subscribers").delete().eq("id", id);
      }
    }
  } catch (err) {
    console.error("Unsubscribe error:", err);
  }

  // Always redirect to the unsubscribe page
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://albis-app.vercel.app";
  return NextResponse.redirect(`${baseUrl}/unsubscribe`);
}
