import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const MAX_AVATAR_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extensionForType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

function cleanHandle(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Sign in to update your profile picture." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Use a JPG, PNG, WebP, or GIF image." }, { status: 400 });
    }

    if (file.size > MAX_AVATAR_BYTES) {
      return NextResponse.json({ error: "Use an image under 4MB." }, { status: 400 });
    }

    const admin = createAdminClient();
    const bucketName = "avatars";
    const ext = extensionForType(file.type);
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;

    const { error: bucketError } = await admin.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: MAX_AVATAR_BYTES,
      allowedMimeTypes: [...ALLOWED_TYPES],
    });

    if (bucketError && !/already exists/i.test(bucketError.message)) {
      return NextResponse.json({ error: bucketError.message }, { status: 500 });
    }

    const { error: uploadError } = await admin.storage.from(bucketName).upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: true,
    });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = admin.storage.from(bucketName).getPublicUrl(path);
    const avatarUrl = publicUrlData.publicUrl;
    const metadata = user.user_metadata || {};
    const username = cleanHandle(metadata.username || user.email?.split("@")[0]);
    const displayName = String(metadata.name || username || user.email?.split("@")[0] || "Reader").trim();

    const { error: updateUserError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        avatar_url: avatarUrl,
      },
    });

    if (updateUserError) {
      return NextResponse.json({ error: updateUserError.message }, { status: 500 });
    }

    // Keep already-published public cards visually in sync. The table stores
    // author details in JSON metadata so older cards need a light refresh.
    const authorNames = [...new Set([username ? `@${username}` : null, username || null, displayName || null].filter(Boolean))] as string[];
    const authoredRows: Array<{ id: string; metadata: Record<string, unknown> | null }> = [];

    const byId = await admin
      .from("albis_live_signals")
      .select("id, metadata")
      .eq("metadata->>author_id", user.id)
      .limit(200);
    if (!byId.error) authoredRows.push(...((byId.data || []) as Array<{ id: string; metadata: Record<string, unknown> | null }>));

    if (authorNames.length) {
      const byName = await admin
        .from("albis_live_signals")
        .select("id, metadata")
        .in("metadata->>author_name", authorNames)
        .limit(200);
      if (!byName.error) authoredRows.push(...((byName.data || []) as Array<{ id: string; metadata: Record<string, unknown> | null }>));
    }

    const seen = new Set<string>();
    for (const row of authoredRows) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      await admin
        .from("albis_live_signals")
        .update({
          metadata: {
            ...(row.metadata || {}),
            author_id: user.id,
            author_avatar_url: avatarUrl,
            author_display_name: displayName,
            author_name: username ? `@${username}` : row.metadata?.author_name || displayName,
          },
        })
        .eq("id", row.id);
    }

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error("[profile/avatar] upload failed", error);
    return NextResponse.json({ error: "Profile picture upload failed." }, { status: 500 });
  }
}
