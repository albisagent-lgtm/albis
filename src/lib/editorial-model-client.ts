type EditorialMessage = { role: "system" | "user" | "assistant"; content: string };

type GenerateEditorialJsonInput = {
  messages: EditorialMessage[];
  responseSchema?: unknown;
  modelEnv?: string;
  defaultModel: string;
  temperature?: number;
};

export type EditorialModelProvider = "openai" | "openrouter" | "cloudflare-workers-ai";

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

async function callCloudflareWorkersAi<T>(input: GenerateEditorialJsonInput, ai: any): Promise<EditorialModelResult<T>> {
  const model = process.env[input.modelEnv || ""] || input.defaultModel || "@cf/meta/llama-3.1-70b-instruct";
  const messages = input.messages.map((message) => ({ role: message.role, content: message.content }));
  const result = await ai.run(model, {
    messages,
    temperature: input.temperature ?? 0.35,
    max_tokens: Number(process.env.ALBIS_EDITORIAL_MAX_TOKENS || 4096),
  });
  const text = typeof result === "string" ? result : result?.response || result?.text || result?.content || "";
  if (!text) throw new Error("cloudflare_workers_ai_editorial_empty");
  return { json: JSON.parse(extractJsonObject(text)) as T, provider: "cloudflare-workers-ai", model };
}

export async function generateEditorialJson<T>(input: GenerateEditorialJsonInput): Promise<EditorialModelResult<T>> {
  const provider = configuredProvider();
  const openAiKey = process.env.OPENAI_API_KEY || process.env.ALBIS_OPENAI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.ALBIS_OPENROUTER_API_KEY;
  const cloudflareAi = await getCloudflareAiBinding();

  if (provider === "cloudflare" || provider === "cloudflare-workers-ai") {
    if (!cloudflareAi) throw new Error("Cloudflare Workers AI binding `AI` is not configured");
    return callCloudflareWorkersAi<T>(input, cloudflareAi);
  }
  if (provider === "openrouter") {
    if (!openRouterKey) throw new Error("OPENROUTER_API_KEY or ALBIS_OPENROUTER_API_KEY is not configured");
    return callOpenRouter<T>(input, openRouterKey);
  }
  if (provider === "openai") {
    if (!openAiKey) throw new Error("OPENAI_API_KEY or ALBIS_OPENAI_API_KEY is not configured");
    return callOpenAI<T>(input, openAiKey);
  }

  if (cloudflareAi) return callCloudflareWorkersAi<T>(input, cloudflareAi);
  if (openAiKey) return callOpenAI<T>(input, openAiKey);
  if (openRouterKey) return callOpenRouter<T>(input, openRouterKey);

  throw new Error("No editorial model provider is configured. Add Cloudflare Workers AI binding `AI`, or set OPENAI_API_KEY/ALBIS_OPENAI_API_KEY, or set OPENROUTER_API_KEY/ALBIS_OPENROUTER_API_KEY.");
}

export function editorialModelConfiguredHint(): string {
  return "Cloudflare Workers AI binding `AI`, OPENAI_API_KEY/ALBIS_OPENAI_API_KEY, or OPENROUTER_API_KEY/ALBIS_OPENROUTER_API_KEY";
}
