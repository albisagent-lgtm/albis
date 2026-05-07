type EditorialMessage = { role: "system" | "user" | "assistant"; content: string };

type GenerateEditorialJsonInput = {
  messages: EditorialMessage[];
  responseSchema?: unknown;
  modelEnv?: string;
  defaultModel: string;
  temperature?: number;
};

export type EditorialModelProvider = "openclaw-system" | "openai" | "openrouter" | "cloudflare-workers-ai";

export type EditorialModelResult<T> = {
  json: T;
  provider: EditorialModelProvider;
  model: string;
};

function configuredProvider(): string {
  return String(process.env.ALBIS_EDITORIAL_MODEL_PROVIDER || "").trim().toLowerCase();
}

function extractJsonObject(text: string): string {
  const cleaned = String(text || "").trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  if (cleaned.startsWith("{") && cleaned.endsWith("}")) return cleaned;
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) return cleaned.slice(start, end + 1);
  throw new Error("editorial_model_no_json_object");
}

async function getCloudflareAiBinding(): Promise<any | null> {
  try {
    const mod = await import("@opennextjs/cloudflare");
    const context = mod.getCloudflareContext?.({ async: false });
    return (context?.env as any)?.AI || null;
  } catch {
    return null;
  }
}

function getCloudflareRestCredentials(): { accountId: string; token: string } | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
  const token =
    process.env.CLOUDFLARE_API_TOKEN ||
    process.env.CLOUDFLARE_AUTH_TOKEN ||
    process.env.CF_API_TOKEN;
  if (!accountId || !token) return null;
  return { accountId, token };
}

async function callOpenAI<T>(input: GenerateEditorialJsonInput, key: string): Promise<EditorialModelResult<T>> {
  const model = process.env[input.modelEnv || ""] || input.defaultModel;
  const body: any = {
    model,
    temperature: input.temperature ?? 0.4,
    messages: input.messages,
  };
  if (input.responseSchema) {
    body.response_format = { type: "json_schema", json_schema: input.responseSchema };
  } else {
    body.response_format = { type: "json_object" };
  }
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`openai_editorial_${response.status}:${(await response.text()).slice(0, 300)}`);
  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("openai_editorial_empty");
  return { json: JSON.parse(extractJsonObject(content)) as T, provider: "openai", model };
}

async function callOpenRouter<T>(input: GenerateEditorialJsonInput, key: string): Promise<EditorialModelResult<T>> {
  const model = process.env[input.modelEnv || ""] || input.defaultModel;
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      "http-referer": process.env.NEXT_PUBLIC_SITE_URL || "https://www.albis.news",
      "x-title": "Albis Editorial Writer",
    },
    body: JSON.stringify({
      model,
      temperature: input.temperature ?? 0.4,
      response_format: { type: "json_object" },
      messages: input.messages,
    }),
  });
  if (!response.ok) throw new Error(`openrouter_editorial_${response.status}:${(await response.text()).slice(0, 300)}`);
  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("openrouter_editorial_empty");
  return { json: JSON.parse(extractJsonObject(content)) as T, provider: "openrouter", model };
}

function cloudflareResponseFormat(_schema: unknown): unknown {
  // Workers AI support for full JSON Schema varies by model/account. Plain
  // JSON-object mode is the safest portable setting; downstream validation
  // still enforces the required editorial shape before customer delivery.
  return { type: "json_object" };
}

function parseCloudflareAiResult<T>(result: any, model: string): EditorialModelResult<T> {
  const structured = result?.response ?? result?.result ?? result?.output;
  if (structured && typeof structured === "object" && !Array.isArray(structured)) {
    return { json: structured as T, provider: "cloudflare-workers-ai", model };
  }

  const text = typeof result === "string" ? result : result?.response || result?.text || result?.content || "";
  if (!text) throw new Error("cloudflare_workers_ai_editorial_empty");
  return { json: JSON.parse(extractJsonObject(String(text))) as T, provider: "cloudflare-workers-ai", model };
}

async function callCloudflareWorkersAi<T>(input: GenerateEditorialJsonInput, ai: any): Promise<EditorialModelResult<T>> {
  const model = process.env[input.modelEnv || ""] || input.defaultModel || "@cf/meta/llama-3.1-70b-instruct";
  const messages = input.messages.map((message) => ({ role: message.role, content: message.content }));
  const result = await ai.run(model, {
    messages,
    temperature: input.temperature ?? 0.35,
    max_tokens: Number(process.env.ALBIS_EDITORIAL_MAX_TOKENS || 4096),
    response_format: cloudflareResponseFormat(input.responseSchema),
  });
  return parseCloudflareAiResult<T>(result, model);
}

async function callCloudflareWorkersAiRest<T>(input: GenerateEditorialJsonInput, creds: { accountId: string; token: string }): Promise<EditorialModelResult<T>> {
  const model = process.env[input.modelEnv || ""] || input.defaultModel || "@cf/meta/llama-3.1-8b-instruct-fp8";
  const messages = input.messages.map((message) => ({ role: message.role, content: message.content }));
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${creds.accountId}/ai/run/${model}`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${creds.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messages,
        temperature: input.temperature ?? 0.35,
        max_tokens: Number(process.env.ALBIS_EDITORIAL_MAX_TOKENS || 4096),
        response_format: cloudflareResponseFormat(input.responseSchema),
      }),
    },
  );
  const body = await response.json().catch(async () => ({ raw: await response.text().catch(() => "") }));
  if (!response.ok || body?.success === false) {
    throw new Error(`cloudflare_workers_ai_editorial_${response.status}:${JSON.stringify(body).slice(0, 300)}`);
  }
  return parseCloudflareAiResult<T>(body?.result ?? body, model);
}

function messagesToOpenClawPrompt(messages: EditorialMessage[], responseSchema?: unknown): string {
  const body = messages
    .map((message) => `${message.role.toUpperCase()}:\n${message.content}`)
    .join("\n\n---\n\n");
  const schemaHint = responseSchema
    ? `\n\nReturn valid JSON only. Required shape: {overview:string, source_note:string, observations:string[2-4], topics: exactly 7 objects with cluster_id, topic_label, headline, paragraphs:string[2-3], source_ids:string[2-5], perception_gap:{view, where_the_split_appears, why_it_matters, score}}. No markdown.`
    : "\n\nReturn valid JSON only.";
  return `${body}${schemaHint}`;
}

async function callOpenClawSystemModel<T>(input: GenerateEditorialJsonInput): Promise<EditorialModelResult<T>> {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);
  const prompt = messagesToOpenClawPrompt(input.messages, input.responseSchema);
  const model = process.env[input.modelEnv || ""] || process.env.OPENCLAW_MODEL || "gateway-default";
  const args = ["capability", "model", "run", "--gateway", "--json", "--prompt", prompt];
  if (process.env[input.modelEnv || ""] || process.env.OPENCLAW_MODEL) {
    args.splice(4, 0, "--model", model);
  }
  const { stdout } = await execFileAsync("openclaw", args, {
    timeout: Number(process.env.ALBIS_EDITORIAL_MODEL_TIMEOUT_MS || 600000),
    maxBuffer: Number(process.env.ALBIS_EDITORIAL_MODEL_MAX_BUFFER || 20 * 1024 * 1024),
  });
  const result = JSON.parse(String(stdout || "{}"));
  const text = result?.outputs?.[0]?.text || result?.text || "";
  if (!text) throw new Error("openclaw_system_editorial_empty");
  return {
    json: JSON.parse(extractJsonObject(text)) as T,
    provider: "openclaw-system",
    model: result?.model || model,
  };
}

export async function generateEditorialJson<T>(input: GenerateEditorialJsonInput): Promise<EditorialModelResult<T>> {
  const provider = configuredProvider();
  const openAiKey = process.env.OPENAI_API_KEY || process.env.ALBIS_OPENAI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.ALBIS_OPENROUTER_API_KEY;
  const cloudflareAi = await getCloudflareAiBinding();
  const cloudflareRest = getCloudflareRestCredentials();

  if (["openclaw", "openclaw-system", "system", "system-model"].includes(provider)) {
    return callOpenClawSystemModel<T>(input);
  }
  if (provider === "cloudflare" || provider === "cloudflare-workers-ai") {
    if (cloudflareAi) return callCloudflareWorkersAi<T>(input, cloudflareAi);
    if (cloudflareRest) return callCloudflareWorkersAiRest<T>(input, cloudflareRest);
    throw new Error("Cloudflare Workers AI is not configured for this runtime.");
  }
  if (provider === "openrouter") {
    if (!openRouterKey) throw new Error("OPENROUTER_API_KEY or ALBIS_OPENROUTER_API_KEY is not configured");
    return callOpenRouter<T>(input, openRouterKey);
  }
  if (provider === "openai") {
    if (!openAiKey) throw new Error("OPENAI_API_KEY or ALBIS_OPENAI_API_KEY is not configured");
    return callOpenAI<T>(input, openAiKey);
  }

  // Default for local Albis pipeline jobs: use the same OpenClaw system model
  // path that powers agent runs, then fall back to explicitly configured API
  // providers only if a future environment chooses them.
  try {
    return await callOpenClawSystemModel<T>(input);
  } catch (error) {
    if (cloudflareAi) return callCloudflareWorkersAi<T>(input, cloudflareAi);
    if (cloudflareRest) return callCloudflareWorkersAiRest<T>(input, cloudflareRest);
    if (openAiKey) return callOpenAI<T>(input, openAiKey);
    if (openRouterKey) return callOpenRouter<T>(input, openRouterKey);
    throw error;
  }
}

export function editorialModelConfiguredHint(): string {
  return "the local OpenClaw/system model path, or an explicitly configured fallback provider";
}
