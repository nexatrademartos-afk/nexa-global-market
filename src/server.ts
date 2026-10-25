
import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (
    request: Request,
    env: unknown,
    ctx: unknown,
  ) => Promise<Response> | Response;
};

const AI_ENV_KEYS = [
  "AI_PROVIDER",
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "ANTHROPIC_API_KEY",
  "CLAUDE_API_KEY",
  "ANTHROPIC_MODEL",
  "AI_API_KEY",
] as const;

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import(
      "@tanstack/react-start/server-entry"
    ).then((m) => (m.default ?? m) as ServerEntry);
  }

  return serverEntryPromise;
}

/**
 * Cloudflare Worker bindings are passed to fetch() through env.
 * The existing AI adapters read process.env, so bridge the server-side
 * AI settings before the request reaches TanStack Start.
 *
 * Never log or return secret values to the browser.
 */
function syncAiEnvironment(env: unknown): void {
  if (!env || typeof env !== "object") return;

  const bindings = env as Record<string, unknown>;

  for (const key of AI_ENV_KEYS) {
    const value = bindings[key];

    if (typeof value === "string" && value.length > 0) {
      process.env[key] = value;
    }
  }
}

async function normalizeCatastrophicSsrResponse(
  response: Response,
): Promise<Response> {
  if (response.status < 500) return response;

  const contentType =
    response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return response;
  }

  const body = await response.clone().text();

  if (!isH3SwallowedErrorBody(body)) {
    return response;
  }

  console.error(
    consumeLastCapturedError() ??
      new Error(`h3 swallowed SSR error: ${body}`),
  );

  return new Response(renderErrorPage(), {
    status: 500,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as {
      unhandled?: unknown;
      message?: unknown;
    };

    return (
      payload.unhandled === true &&
      payload.message === "HTTPError"
    );
  } catch {
    return false;
  }
}

export default {
  async fetch(
    request: Request,
    env: unknown,
    ctx: unknown,
  ): Promise<Response> {
    try {
      syncAiEnvironment(env);

      const handler = await getServerEntry();
      const response = await handler.fetch(
        request,
        env,
        ctx,
      );

      return await normalizeCatastrophicSsrResponse(
        response,
      );
    } catch (error) {
      console.error(error);

      return new Response(renderErrorPage(), {
        status: 500,
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      });
    }
  },
};
