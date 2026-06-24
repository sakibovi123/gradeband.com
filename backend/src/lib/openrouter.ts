import { z } from "zod";
import { env, requireEnv } from "./env.js";
import { logger } from "./logger.js";
import { ApiError } from "./http.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

interface ChatOpts<T> {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  model?: string;
  temperature?: number;
  /** Used only for logging/diagnostics. */
  label?: string;
}

type Message = { role: "system" | "user" | "assistant"; content: string };

async function callOpenRouter(model: string, messages: Message[], temperature: number) {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireEnv.openRouterKey()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": env.WEB_ORIGIN,
      "X-Title": "IELTS Mock Platform",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    logger.error("OpenRouter request failed", { status: res.status, model });
    // Never surface provider internals/keys to clients.
    throw new ApiError(502, "The AI service is temporarily unavailable. Please try again.", {
      expose: true,
      details: env.NODE_ENV === "development" ? text.slice(0, 500) : undefined,
    });
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new ApiError(502, "Empty response from the AI service.", { expose: true });
  return content;
}

function extractJson(raw: string): unknown {
  // Strip markdown fences if the model wrapped the JSON.
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned);
}

/**
 * Calls an OpenRouter chat model forcing JSON output, parses and validates the
 * result with the given Zod schema. On parse/validation failure, retries once
 * with an explicit "return valid JSON only" reminder, then surfaces a clean
 * error. The model never sees secrets; callers never see provider internals.
 */
export async function chatJson<T>(opts: ChatOpts<T>): Promise<T> {
  const model = opts.model || env.OPENROUTER_DEFAULT_MODEL;
  const temperature = opts.temperature ?? 0.7;
  const baseMessages: Message[] = [
    { role: "system", content: opts.system },
    { role: "user", content: opts.user },
  ];

  for (let attempt = 0; attempt < 2; attempt++) {
    const messages =
      attempt === 0
        ? baseMessages
        : [
            ...baseMessages,
            {
              role: "user" as const,
              content:
                "Your previous response was not valid JSON matching the schema. Respond with ONLY a single valid JSON object, no prose, no markdown fences.",
            },
          ];

    let raw: string;
    try {
      raw = await callOpenRouter(model, messages, temperature);
    } catch (err) {
      if (err instanceof ApiError && err.status === 502 && attempt === 0) continue;
      throw err;
    }

    try {
      const parsed = extractJson(raw);
      return opts.schema.parse(parsed);
    } catch (err) {
      logger.warn("LLM JSON validation failed", {
        label: opts.label,
        attempt,
        message: (err as Error)?.message?.slice(0, 300),
      });
      if (attempt === 1) {
        throw new ApiError(
          502,
          "The AI returned an unexpected format. Please try generating again.",
          { expose: true },
        );
      }
    }
  }
  // Unreachable.
  throw new ApiError(502, "AI generation failed.", { expose: true });
}
