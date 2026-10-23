import type { Complete } from "./llm-interpreter";

/**
 * The one way the product calls a model (ADR 0009): OpenRouter's chat completions endpoint, one
 * pinned model per job. Pure: the key and `fetch` are passed in, so only the server module that
 * wires them ever holds the key, and the tests pass a recorded response instead of the network.
 */

/** One pinned model per job (ADR 0009 point 2). Changing one is a contract change. */
export const AI_MODELS = {
  chat: "anthropic/claude-sonnet-5.5",
  instant: "inception/mercury-3",
  interpret: "anthropic/claude-sonnet-5.5",
  see: "google/gemini-4-argon",
  "logo-vector": "anthropic/claude-opus-5.5",
  "logo-image": "google/gemini-nano-banana-2.1",
} as const;
export type AiJob = keyof typeof AI_MODELS;

export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/** The part of `fetch` this module uses, so the engine needs no DOM or Node types. */
export type FetchLike = (
  url: string,
  init: { method: "POST"; headers: Record<string, string>; body: string; signal?: unknown },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export interface OpenRouterOptions {
  apiKey: string;
  model: string;
  fetch: FetchLike;
  /** An abort signal from the caller, which sets the timeout and then falls back (ADR 0009 point 3). */
  signal?: () => unknown;
  maxTokens?: number;
}

/** The request body for one structured call. Zero retention and no training on every request. */
export function openRouterBody(model: string, request: Parameters<Complete>[0], maxTokens: number) {
  return {
    model,
    messages: [
      { role: "system", content: request.system },
      { role: "user", content: request.user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: request.schemaName, strict: true, schema: request.schema },
    },
    temperature: 0,
    max_tokens: maxTokens,
    // No fallback to another model or to an endpoint that keeps data (ADR 0009 points 3 and 4).
    provider: {
      zdr: true,
      data_collection: "deny",
      require_parameters: true,
      allow_fallbacks: false,
    },
  };
}

/** A `Complete` that calls OpenRouter. Throws on any failure; it never retries with other settings. */
export function openRouterComplete(options: OpenRouterOptions): Complete {
  return async (request) => {
    const response = await options.fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "ORIVILO",
      },
      body: JSON.stringify(openRouterBody(options.model, request, options.maxTokens ?? 2000)),
      ...(options.signal ? { signal: options.signal() } : {}),
    });
    if (!response.ok) throw new Error(`OpenRouter answered ${response.status}.`);
    const body = (await response.json()) as {
      model?: unknown;
      choices?: { message?: { content?: unknown } }[];
    };
    // OpenRouter names the model that answered (sometimes with a dated suffix); another model is refused.
    if (typeof body.model !== "string" || !body.model.startsWith(options.model)) {
      throw new Error("OpenRouter answered with another model.");
    }
    const content = body.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("OpenRouter returned no text.");
    return content;
  };
}
