export type LlmProvider = "openrouter" | "google";

const PROVIDER_DEFAULTS: Record<
  LlmProvider,
  { baseUrl: string; model: string; fallbacks: string }
> = {
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    model: "nvidia/nemotron-nano-9b-v2:free",
    fallbacks:
      "openai/gpt-oss-20b:free,google/gemma-4-31b-it:free,qwen/qwen3-next-80b-a3b-instruct:free,nvidia/nemotron-3-super-120b-a12b:free",
  },
  google: {
    // Google's OpenAI-compatible endpoint (works with the OpenAI request shape we already use).
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    model: "gemini-2.5-flash",
    fallbacks: "gemini-2.5-flash-lite",
  },
};

export function getServerConfig() {
  const provider = (process.env.LLM_PROVIDER ?? "openrouter").toLowerCase() as LlmProvider;
  const defaults = PROVIDER_DEFAULTS[provider] ?? PROVIDER_DEFAULTS.openrouter;

  const apiKey =
    provider === "google" ? process.env.GOOGLE_API_KEY : process.env.OPENROUTER_API_KEY;

  const primaryModel = process.env.RESUME_MODEL ?? defaults.model;
  const fallbacks = (process.env.RESUME_FALLBACKS ?? defaults.fallbacks)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const maxAttempts = Number(process.env.GEN_MAX_ATTEMPTS ?? "3");
  const concurrency = Number(process.env.GEN_CONCURRENCY ?? "2");

  return {
    provider,
    baseUrl: defaults.baseUrl,
    apiKey,
    primaryModel,
    fallbacks,
    models: [primaryModel, ...fallbacks.filter((m) => m !== primaryModel)],
    maxAttempts: Number.isFinite(maxAttempts) && maxAttempts > 0 ? maxAttempts : 3,
    concurrency: Number.isFinite(concurrency) && concurrency > 0 ? concurrency : 2,
    hasApiKey: Boolean(apiKey),
  };
}
