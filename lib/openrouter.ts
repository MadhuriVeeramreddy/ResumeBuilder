import { getServerConfig } from "./config";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenRouterOptions = {
  models?: string[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 45_000;

export async function chatCompletion(
  messages: ChatMessage[],
  options: OpenRouterOptions = {},
): Promise<{ content: string; model: string }> {
  const config = getServerConfig();
  if (!config.apiKey) {
    throw new Error(
      config.provider === "google"
        ? "GOOGLE_API_KEY is not configured"
        : "OPENROUTER_API_KEY is not configured",
    );
  }

  const models = options.models?.length ? options.models : config.models;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let lastError: unknown;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      };
      if (config.provider === "openrouter") {
        headers["HTTP-Referer"] = "http://localhost:3000";
        headers["X-Title"] = "ResumeForge";
      }

      // Send only this single model so a hung/empty model fails over to the next one in our loop.
      const response = await fetch(config.baseUrl, {
        method: "POST",
        signal: controller.signal,
        headers,
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature ?? 0.4,
          max_tokens: options.maxTokens ?? 8192,
          response_format: { type: "json_object" },
        }),
      });

      if (response.status === 404 || response.status === 429 || response.status >= 500) {
        const body = await response.text();
        lastError = new Error(`OpenRouter ${response.status} for model ${model}: ${body.slice(0, 200)}`);
        console.warn(`[openrouter] ${response.status} on ${model}, trying next model`);
        continue;
      }

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`OpenRouter error ${response.status}: ${body.slice(0, 300)}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        model?: string;
      };

      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        lastError = new Error(`Empty response from model ${model}`);
        console.warn(`[openrouter] empty content from ${model}`);
        continue;
      }

      return { content, model: data.model ?? model };
    } catch (error) {
      lastError = error;
      if (error instanceof Error && error.name === "AbortError") {
        console.warn(`[openrouter] timeout after ${timeoutMs}ms on ${model}, trying next model`);
      } else {
        console.warn(`[openrouter] attempt failed for ${model}`, error);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("All OpenRouter models failed");
}
