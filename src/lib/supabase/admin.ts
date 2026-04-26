import { createClient } from "@supabase/supabase-js";

type AdminClient = ReturnType<typeof createClient>;

function createUnavailableClient(): AdminClient {
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
    }
  );

  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "from" || prop === "rpc") return () => chain;
        return chain;
      },
    }
  ) as AdminClient;
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return createUnavailableClient();

  return createClient(url, serviceKey);
}
