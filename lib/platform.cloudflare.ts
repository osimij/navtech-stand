// Local stand runtime (vinext in Cloudflare's workerd): settings and the D1 database come from the Worker env,
// which Miniflare fills from .dev.vars. vite.config.ts aliases `@/lib/platform` to this file; see platform.ts.
import { env } from "cloudflare:workers";
import type { Store, VoiceCache } from "./platform";

export type { Store, VoiceCache };
export const hosted = false;
export function setting(name: string) {
  const value = (env as unknown as Record<string, unknown>)[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function store(): Store {
  const d1 = env.DB;
  if (!d1) throw Error("Database unavailable");
  return {
    first: (query, ...params) => d1.prepare(query).bind(...params).first(),
    all: async <T,>(query: string, ...params: unknown[]) => (await d1.prepare(query).bind(...params).all<T>()).results,
    async run(query, ...params) { await d1.prepare(query).bind(...params).run(); },
  };
}

// The local dev server answers narration itself (lib/voice-lab-server.ts, with its disk cache).
export const voiceCache: VoiceCache = { get: async () => null, put: async () => {} };
