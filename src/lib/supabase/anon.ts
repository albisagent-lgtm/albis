// Server-side anon Supabase client — read-only public data, no cookies, no session.
//
// Use this for server code paths that read tables governed by an anon SELECT
// RLS policy (e.g. site_snapshot) and MUST NOT be cookie-dependent. The
// cookie-aware client in ./server.ts calls cookies() from next/headers, which
// forces any consuming route into dynamic rendering — that defeats ISR on
// pages like /, /lens, /trending that only need a public read.
//
// Mirrors the shape of ./admin.ts (raw @supabase/supabase-js, no SSR cookie
// glue) but uses the anon key, so RLS is enforced.
//
// Do NOT use for anything that requires a user session (use ./server.ts) or
// for privileged writes (use ./admin.ts).
import { createClient } from "@supabase/supabase-js";

export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
