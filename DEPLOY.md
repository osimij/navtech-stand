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
     short «voice not configured» notice beside the header controls when a test starts.
4. **Redeploy** (Deployments → ⋯ → Redeploy) so the new variables apply, then check the language question, eight
   situations, result, contact form, `/screen` and `/operator`. Narration starts after «Начать демонстрацию» when the
   key is set.

## What the hosted site protects

- Narration speaks only the approved lines in `lib/narration-text.ts`, only in the booth voice (Sienna), and each line is
  stored after its first synthesis. The total ElevenLabs cost is bounded by that finite set of lines.
- Voice lab endpoints (key entry, voice lists, auditions) and the Realtime relay do not exist on the hosted site.
- Contacts appear only in `/operator` behind `OPERATOR_PIN`; aggregate endpoints never include them.

## Checking a build locally

```bash
DATABASE_URL=postgres://… npx next build && DATABASE_URL=postgres://… npx next start
```
