// Hosted runtime (Vercel, `next build && next start`): settings from process.env, data in Postgres.
// The local stand runs on vinext inside Cloudflare's workerd with D1 instead: vite.config.ts replaces this module
// with platform.cloudflare.ts there. Both expose the same small surface, so routes and SQL are shared. Queries use
// `?` placeholders and SQL that SQLite and Postgres both accept.
import postgres from "postgres";

export type Store = {
  first<T>(query: string, ...params: unknown[]): Promise<T | null>;
  all<T>(query: string, ...params: unknown[]): Promise<T[]>;
  run(query: string, ...params: unknown[]): Promise<void>;
};
export type VoiceCache = { get(id: string): Promise<Uint8Array | null>; put(id: string, pcm: Uint8Array): Promise<void> };

export const hosted = true;
export function setting(name: string) {
  return process.env[name]?.trim() || undefined;
}

// The same tables as drizzle/0000 (D1), plus a cache that keeps each generated narration line so it is paid for once.
const schema = [
  "CREATE TABLE IF NOT EXISTS sessions (id text PRIMARY KEY, token_hash text NOT NULL, intent text NOT NULL, started_at text NOT NULL, completed_at text, profile text, answers text, quiz_version text NOT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_sessions_completed_at ON sessions (completed_at)",
  "CREATE TABLE IF NOT EXISTS leads (id text PRIMARY KEY, session_id text NOT NULL UNIQUE REFERENCES sessions(id), name text NOT NULL, company text, contact text NOT NULL, interest text NOT NULL, consent_version text NOT NULL, consented_at text NOT NULL)",
  "CREATE TABLE IF NOT EXISTS voice_cache (id text PRIMARY KEY, pcm bytea NOT NULL, created_at text NOT NULL)",
];

let client: postgres.Sql | undefined;
let ready: Promise<postgres.Sql> | undefined;
function connect() {
  const url = setting("DATABASE_URL") || setting("POSTGRES_URL");
  if (!url) throw Error("DATABASE_URL is not set");
  // One connection per function instance; `prepare: false` keeps it compatible with transaction-mode poolers.
  // Counts come back as bigint, which the routes expect as plain numbers.
  client ??= postgres(url, {
    max: 1, prepare: false, idle_timeout: 20, connect_timeout: 10, onnotice: () => {},
    types: { count: { to: 20, from: [20], serialize: (value: number) => String(value), parse: (value: string) => Number(value) } },
  });
  // Create the tables once per instance. The advisory lock stops parallel cold starts from racing each other.
  ready ??= client.begin(async tx => {
    await tx`SELECT pg_advisory_xact_lock(7342019)`;
    for (const statement of schema) await tx.unsafe(statement);
  }).then(() => client!, error => { ready = undefined; throw error; });
  return ready;
}
const numbered = (query: string) => { let index = 0; return query.replace(/\?/g, () => `$${++index}`); };
async function rows<T>(query: string, params: unknown[]) {
  const sql = await connect();
  return await sql.unsafe(numbered(query), params as postgres.ParameterOrJSON<never>[]) as unknown as T[];
}

export function store(): Store {
  return {
    async first<T>(query: string, ...params: unknown[]) { return (await rows<T>(query, params))[0] ?? null; },
    all: <T,>(query: string, ...params: unknown[]) => rows<T>(query, params),
    async run(query: string, ...params: unknown[]) { await rows(query, params); },
  };
}

export const voiceCache: VoiceCache = {
  async get(id) {
    const [row] = await rows<{ pcm: Uint8Array }>("SELECT pcm FROM voice_cache WHERE id = ?", [id]);
    return row ? new Uint8Array(row.pcm) : null;
  },
  async put(id, pcm) {
    await rows("INSERT INTO voice_cache (id, pcm, created_at) VALUES (?, ?, ?) ON CONFLICT (id) DO NOTHING", [id, pcm, new Date().toISOString()]);
  },
};
