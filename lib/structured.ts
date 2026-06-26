import { z } from "zod";
import { getServerConfig } from "./config";
import { StageError, type GenerationStage } from "./errors";
import { chatCompletion, type ChatMessage } from "./openrouter";

export function stripCodeFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

/** Parse model output as JSON, tolerating code fences and surrounding prose. */
export function parseModelJson(raw: string): unknown {
  const cleaned = stripCodeFences(raw);
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("No JSON object found in model output");
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type StructuredGenerateOptions = {
  stage: GenerationStage;
  system?: string;
  models?: string[];
  maxAttempts?: number;
};

export async function structuredGenerate<T extends z.ZodType>(
  prompt: string,
  schema: T,
  options: StructuredGenerateOptions,
): Promise<z.infer<T>> {
  const config = getServerConfig();
  const maxAttempts = options.maxAttempts ?? config.maxAttempts;
  const models = options.models ?? config.models;

  const messages: ChatMessage[] = [];
  if (options.system) {
    messages.push({ role: "system", content: options.system });
  }
  messages.push({ role: "user", content: prompt });

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const modelIndex = Math.min(attempt, models.length - 1);
    const rotated = [...models.slice(modelIndex), ...models.slice(0, modelIndex)];

    try {
      const { content, model } = await chatCompletion(messages, { models: rotated });
      const json = parseModelJson(content);
      const parsed = schema.parse(json);
      console.info(`[structured] ${options.stage} ok via ${model} attempt ${attempt + 1}`);
      return parsed;
    } catch (error) {
      lastError = error;
      console.warn(`[structured] ${options.stage} attempt ${attempt + 1} failed`, error);
      if (attempt < maxAttempts - 1) {
        // Backoff to ride out transient free-tier rate limits before retrying.
        await delay(2000 * (attempt + 1));
      }
    }
  }

  throw new StageError(options.stage, `Failed after ${maxAttempts} attempts`, lastError);
}
