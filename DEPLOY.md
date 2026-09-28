# Deploying to Vercel

The same code runs in two places:

| | Local stand (`Start Navi.command`) | Vercel |
|---|---|---|
| Framework | vinext (Vite) in Cloudflare's workerd | Next.js (`next build`) |
| Database | Cloudflare D1 in `.wrangler/state` | Postgres (`DATABASE_URL`) |
| Settings | `.dev.vars` | Vercel environment variables |
| Narration voice | Local dev server, disk cache | `/api/voice-lab/speech`, cached in Postgres |
| Live voice `/demo`, `/voices` lab | Available | Local only |

`lib/platform.ts` (Postgres) and `lib/platform.cloudflare.ts` (D1) expose the same small store; `vite.config.ts` picks the
Cloudflare one for the stand. The two databases are separate: the event records stay on the stand.

## Steps

1. **Import the repository** in Vercel (Add New → Project) and deploy. `vercel.json` sets the Next.js build and the
   Frankfurt region (`fra1`, closest to Dushanbe); no other build settings are needed. The pages load at once; saving,
   Prism and `/operator` need the next two steps.
2. **Add a Postgres database**: Project → Storage → Create Database → Neon (or Supabase), region Frankfurt, connected to
   all environments. It adds `DATABASE_URL` / `POSTGRES_URL` automatically. Tables are created on the first request.
3. **Environment variables** (Settings → Environment Variables):
   - `OPERATOR_PIN`: required for `/operator`. Use a long, private code.
   - `ELEVENLABS_API_KEY`: optional. Enables Navi's narration voice. Without it the booth works without sound and shows a
     short «voice not configured» notice beside the header controls when a test starts. Tick **Production** (not only
     Preview), or the public site stays silent.
4. **Redeploy** (Deployments → ⋯ → Redeploy) so the new variables apply, then check the language question, eight
   situations, result, contact form, `/screen` and `/operator`. Narration starts after «Начать демонстрацию» when the
   key is set.
5. **Warm the narration cache** once, before the event:

   ```bash
   node scripts/warm-narration.mjs https://navtech-stand.vercel.app
   ```

   It asks the site for each of the 70 approved lines (RU and EN, about 6,300 characters on the first run) one at a
   time, so every visitor is then served from Postgres with no provider delay. Lines already cached cost nothing; run it
   again after changing `lib/narration-text.ts`. It stops at the first settings error, such as a missing key.
   `node scripts/warm-narration.mjs --list` prints the lines without any request.

To check the voice at any time, the first line of a run reports `cached` or `generated`; a `503 Голос на сайте не
настроен` means the deployment has no `ELEVENLABS_API_KEY`.

## What the hosted site protects

- Narration speaks only the approved lines in `lib/narration-text.ts`, only in the booth voice (Sienna), and each line is
  stored after its first synthesis, even when the visitor moves on mid-line. Simultaneous requests for one line share a
  single synthesis. The total ElevenLabs cost is bounded by that finite set of lines.
- Answers by voice (booth settings, off by default) use the same `ELEVENLABS_API_KEY`: `/api/listen` issues a
  single-use token and the browser streams the microphone straight to ElevenLabs recognition, so no audio passes through
  Vercel. The site needs HTTPS for the microphone, which Vercel provides.
- A failed line (network, provider hiccup) is skipped and the next screen speaks again; only settings problems (no key,
  rejected key, exhausted credits) turn the voice off with the reason. Nothing is retried automatically.
- Voice lab endpoints (key entry, voice lists, auditions) and the Realtime relay do not exist on the hosted site.
- Contacts appear only in `/operator` behind `OPERATOR_PIN`; aggregate endpoints never include them.

## Checking a build locally

```bash
DATABASE_URL=postgres://… npx next build && DATABASE_URL=postgres://… npx next start
```
