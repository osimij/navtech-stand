// Single-use tokens for spoken answers (opt-in in booth settings). The browser streams microphone audio straight to
// ElevenLabs realtime recognition with this token, so the API key stays here and no audio passes through the site.
// A token works for one connection and expires after 15 minutes. Runs the same on the stand and on Vercel.
import { setting } from "@/lib/platform";
import { json, sameOrigin } from "@/lib/server";

export const dynamic = "force-dynamic";

// A light brake for a public URL: a booth needs about one token per visitor, not dozens a minute.
const issued: number[] = [];

export async function POST(request: Request) {
  if (!request.headers.get("origin") || !sameOrigin(request)) return json({ error: "Запрос отклонён / Request rejected." }, 403);
  const key = setting("ELEVENLABS_API_KEY");
  if (!key) return json({ error: "Распознавание речи не настроено. / Speech recognition is not configured." }, 503);
  const now = Date.now();
  while (issued.length && now - issued[0] > 60000) issued.shift();
  if (issued.length >= 20) return json({ error: "Слишком много запросов, попробуйте через минуту. / Too many requests." }, 429);
  issued.push(now);
  try {
    const response = await fetch("https://api.elevenlabs.io/v1/single-use-token/realtime_scribe", { method: "POST", headers: { "xi-api-key": key }, signal: AbortSignal.timeout(10000) });
    const data = await response.json().catch(() => ({})) as { token?: unknown };
    if (response.ok && typeof data.token === "string") return json({ token: data.token });
  } catch { /* Reported below without provider details. */ }
  return json({ error: "Не удалось включить распознавание речи. / Could not start speech recognition." }, 502);
}
