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

type AnonClient = ReturnType<typeof createClient>;

function createUnavailableClient(): AnonClient {
  const result = Promise.resolve({
    data: null,
    error: { message: "Supabase environment is not configured" },
  });

  const chain = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") return result.then.bind(result);
        if (prop === "catch") return result.catch.bind(result);
        if (prop === "finally") return result.finally.bind(result);
        return () => chain;
      },
    },
  );

  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "from" || prop === "rpc") return () => chain;
        return chain;
      },
    },
  ) as AnonClient;
}

export function createAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return createUnavailableClient();

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
