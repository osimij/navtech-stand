// Hosted narration (Vercel). The local stand never reaches this route: its dev server answers /api/voice-lab/*
// first (lib/voice-lab-server.ts). Same contract as there: approved lines only, raw 24 kHz PCM streamed back.
// A public URL gets two extra guards. Only the booth narrator voice is accepted, and each line is cached in the
// database after its first synthesis, so the total provider cost is bounded by the finite set of approved lines.
// `node scripts/warm-narration.mjs <site URL>` synthesizes every approved line once, so visitors only get cached audio.
import { after } from "next/server";
import { setting, voiceCache } from "@/lib/platform";
import { body, json, sameOrigin } from "@/lib/server";
import { createGameGuide } from "@/lib/live-game";
import { questions, profiles, scoreAnswers, interestLabels } from "@/lib/quiz";
import { narrationText } from "@/lib/narration-text";
import { parseVoiceSelection, siennaNarrator } from "@/lib/voice-catalog";
import { speechRequest, providerFailure } from "@/lib/voice-provider";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const guide = createGameGuide({ questions, profiles, scoreAnswers, interestLabels });
// Lines being synthesized by this instance. A second request for the same line waits for it instead of paying twice.
const inflight = new Map<string, Promise<Uint8Array | null>>();

async function digest(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}
function pcm(audio: BodyInit, text: string, cache: "hit" | "miss") {
  return new Response(audio, { headers: { "Content-Type": "application/octet-stream", "Cache-Control": "no-store", "X-Navi-Text": encodeURIComponent(text), "X-Navi-Cache": cache } });
}

export async function POST(request: Request) {
  if (!request.headers.get("origin") || !sameOrigin(request)) return json({ error: "Запрос отклонён / Request rejected." }, 403);
  let data;
  try { data = await body(request); } catch { return json({ error: "Invalid request." }, 400); }
  const language = data?.language === "en" ? "en" : data?.language === "ru" ? "ru" : null;
  const selection = parseVoiceSelection(data?.selection);
  if (!language || !selection) return json({ error: "Invalid voice selection." }, 400);
  if (selection.model !== siennaNarrator.model || selection.voice !== siennaNarrator.voice)
    return json({ error: language === "en" ? "Only the booth narrator voice is available on this site." : "На сайте доступен только голос стенда." }, 403);
  const game = guide.parse(data.game), cue = data.cue ?? "screen", variant = data.variant ?? 0;
  if (!game || !["screen", "tap"].includes(cue) || !Number.isInteger(variant) || variant < 0 || variant > 2) return json({ error: "Invalid narration cue." }, 400);

  const text = narrationText(game, language, cue, variant);
  const key = setting("ELEVENLABS_API_KEY") || "";
  const provider = speechRequest(selection, language, text, key);
  // Same cache identity as the local voice lab: settings, text and voice all take part.
  const id = await digest(JSON.stringify({ v: 2, provider: "elevenlabs", url: provider.url, body: provider.init.body }));
  try {
    const cached = await voiceCache.get(id);
    if (cached) return pcm(cached as Uint8Array<ArrayBuffer>, text, "hit");
  } catch { /* A cache outage should not silence the booth; synthesize instead. */ }
  if (!key) return json({ error: language === "en" ? "Narration is not configured on this site." : "Голос на сайте не настроен." }, 503);
  const running = inflight.get(id);
  if (running) {
    const audio = await running;
    return audio ? pcm(audio as Uint8Array<ArrayBuffer>, text, "hit") : json({ error: "Не удалось получить звук. / Could not generate audio." }, 502);
  }

  let finish!: (audio: Uint8Array | null) => void;
  inflight.set(id, new Promise(resolve => { finish = audio => { inflight.delete(id); resolve(audio); }; }));
  let upstream: Response;
  try {
    upstream = await fetch(provider.url, { ...provider.init, signal: AbortSignal.timeout(45000) });
  } catch {
    finish(null);
    return json({ error: "Не удалось получить звук. / Could not generate audio." }, 502);
  }
  if (!upstream.ok || !upstream.body || upstream.headers.get("Content-Type")?.includes("json")) {
    finish(null);
    return json(await providerFailure(upstream, language), 502);
  }

  // Stream to the visitor as it arrives; keep a copy and store the whole line once it is complete and valid.
  // Reading continues after the visitor moves on (the fetch is aborted mid-line), and `after` keeps the function
  // alive until the line is stored, so an interrupted line is still paid for only once.
  let visitor = null as ReadableStreamDefaultController<Uint8Array> | null;
  const stream = new ReadableStream<Uint8Array>({ start(controller) { visitor = controller; }, cancel() { visitor = null; } });
  const reader = upstream.body.getReader();
  const synthesis = (async () => {
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 1440000) throw Error("audio_too_long");
        chunks.push(value);
        try { visitor?.enqueue(value); } catch { visitor = null; }
      }
      if (!size || size % 2) throw Error("invalid_pcm");
      const whole = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { whole.set(chunk, offset); offset += chunk.length; }
      await voiceCache.put(id, whole).catch(() => {});
      try { visitor?.close(); } catch { /* The visitor already left. */ }
      return whole;
    } catch (error) {
      try { visitor?.error(error); } catch { /* The visitor already left. */ }
      return null;
    }
  })().then(finish);
  after(synthesis);
  return pcm(stream, text, "miss");
}
