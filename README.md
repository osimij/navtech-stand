> **Deploy to Vercel:** see [DEPLOY.md](DEPLOY.md). The hosted site uses Next.js and Postgres; the local stand keeps its own D1 database.

> **Stand transfer (macOS):** Start with [START-HERE.md](START-HERE.md) and double-click `Start Navi.command`. The primary booth uses Sienna and approved scripts; see [NAVI-SCRIPT.md](NAVI-SCRIPT.md). Older voice experiments below are retained as project history.

> Актуальная подача: демонстрация с выбором русского или английского языка для работающих специалистов. Восемь ситуаций → профессиональные роли, рабочие задачи и польза для команды. Без стажировок, первого проекта и оценки квалификации. Основной источник: [CAREER-EXPLORER.md](CAREER-EXPLORER.md); прежние предложения ниже исторические.

> Current direction — 22 September 2026: the main local journey is `/` → eight situational career questions → three practical role matches; `/screen` is current-version anonymous Prism analytics. See [CAREER-EXPLORER.md](CAREER-EXPLORER.md). Earlier five-question and recruitment-demo proposals below are historical alternatives. The 26 September request authorizes a bounded voice comparison; current operation is described below.

# NavTech · HR Agent × Prism — Taj-Tech 2026

Interactive Russian/English booth demo: professional work situations, optional local camera invitations and output-only GPT-Realtime-1.5 narration, consent-based lead capture, and a live Prism dashboard.

## Product scope

- `/`: language selection, eight touch-friendly situations, three role matches, optional contact form, idle reset (120 seconds; 20 seconds after contact success).
- `/demo`: separate RU/EN recruitment sample; clarify one application and see the six-record Prism queue recompute. Optional live Navi follows the actual case, choice and current counts; touch works independently. No production integration or quiz data writes. Human handoff ends voice and pauses mascot/gaze. Optional local camera has separate opt-in settings and cannot start voice. Local sample-plan download and anonymous tab-scoped rehearsal JSON; see `DEMO-CHECKPOINT.md`.
- `/stage`: silent 18-second recruitment story preview, RU/EN, sample labels, large-screen/portrait layouts, pause/replay/manual controls and reduced-motion support. No mic/camera, model calls or visitor telemetry. Actual shared-screen allocation is still to be agreed.
- `/screen`: three exploratory touch views (profiles, product interest, game-to-contact journey), with selectable charts and explanatory numbers. Updates every five seconds with a 12-second request timeout. Counts are sessions/results, not unique visitors. Sample data is separate and labelled on every view.
- `/operator`: contacts and UTF-8 CSV export behind a server-checked operator code. Auto-lock after three minutes.
- Original quiz camera: `getUserMedia`, local face presence with frame-difference fallback, no image upload or recording; video capture never requests a microphone. Only prompts on the welcome screen. One invitation per arrival, after about a second of presence; six seconds of absence re-arms the greeting, with a minimum 60-second interval. Camera needs an operator gesture. Camera arrivals show a text invitation. They do not interrupt an active voice conversation. Tapping Navi gives an output-only screen hint without a microphone.
- Navi mascot: layered artwork with independent pupils, blinks and an audio-driven mouth. Tracks pointer, touch, and face position from local MediaPipe inference. Nonrepeating gesture pools provide waves, bows, nods, peeks, stretches and one-time result celebrations. Some answers get brief travel beside the selected row when there is room; portrait layouts keep it near the header. Idle movement has long varied pauses and yields to interactions. No identity or gesture recognition. Reduced motion disables gaze, mouth animation and travel. Artwork: MASCOT.md.
- D1 stores sessions and leads; session-token hashes protect completion and contact submission. Retries are idempotent. No contacts in aggregate responses.

This is a self-contained demonstration, not an integration with production HR Agent / Prism APIs. The quiz is deterministic and recreational, not a validated employment assessment. No vacancies are fabricated. Contact sending is not automated; the team follows up using the export.

## Development

Requires Node 22.13+ (Node 24 tested). `npm ci`, then `npm run dev`.
Set `OPERATOR_PIN` in ignored `.env` and `.dev.vars` files for local use; configure it as a secret for hosting. `.env.example` documents the settings. For live voice, add `OPENAI_API_KEY` to ignored `.dev.vars` and restart the local server; the account needs GPT-Realtime-1.5 access and API quota. Never commit real secrets.

Generate schema changes with `npm run db:generate`; use Sites build / migration workflow before previewing D1. Initial migration is in `drizzle/`. Do not apply migrations twice to the same local database.

## Checks

`node tests/quiz.test.mjs` checks the current eight-question scoring catalog.
`node tests/api.test.mjs` tests a running **local** server at localhost:5173 using fabricated contacts, and creates `.sites-runtime/qa-cleanup.sql` to remove those exact test sessions. Apply that file only to the local D1 database after each test run.
`node tests/motion.test.mjs` tests local motion sampling with synthetic frames.
`node tests/face-worker.test.mjs` tests the worker message lifecycle and face-position selection using a deterministic detector; it does not validate vision-model accuracy.
`node tests/engagement.test.mjs` covers stationary arrivals, absence/cooldown behavior and nonrepeating reaction pools.
`node tests/invitations.test.mjs` validates installed recordings, durations, levels and mouth envelopes.
`node --test tests/invitation-player.test.mjs` verifies buffering, cancellation, superseded requests, playback failures, amplitude output and cleanup using fake media objects; it does not audition voice quality.
`node --test tests/live.test.mjs` tests readiness, Realtime configuration, key isolation and the archived WebRTC client, including cancellation, microphone cleanup, delegation, transcripts and streamed mouth levels using fake transport/media. No billed sessions are created by these tests.
`npx tsc --noEmit` checks TypeScript. `npm run build` packages the local Worker and assets.

Physical camera/audio rehearsal remains required on the booth hardware. Local browser checks cover the language selector and Prism exploration. WebMCP exposes only aggregate analytics with feature detection.

## Operation

Use extended displays: game on the touchscreen, `/screen` on the other display. Sign in as the owner on the booth device for this private demo. Open the header's booth settings, enable camera, grant camera permission, optionally enable voice, then use fullscreen. Install the OS on-screen keyboard if the touchscreen has no physical keyboard. Keep an internet connection for saving and cross-screen analytics. Contact form errors preserve input for retry; no offline queue is implemented.

Use `/operator` only on the team's device. Export after the event. Prism has a visible “Пример данных” selector; it never changes live records. Test games against the deployed site are real records, so rehearse locally when a clean live tally is needed.

Face position uses the self-hosted MediaPipe Tasks Vision 1.0.1 module runtime and BlazeFace short-range model v1. The approximately 12 MB runtime loads only after camera opt-in and runs in a Worker at most eight times per second, with one frame in flight. It is designed for a face near the screen, around two metres or less. Assets and Apache-2.0 notice are under `public/mediapipe/`. Cold initialization may take several seconds; settings show loading, ready or fallback. If camera or detection is unavailable, touch/pointer interaction and the game remain usable. Video is neither stored nor transmitted. Close settings to activate gaze; physically verify left/right alignment and lighting before the forum.

## Design

The result appears immediately after the last answer, with a practical three-step suggestion and an optional team-process discussion: Data → Prism, AI → HR Agent, other/tied profiles → both. Session creation/completion runs independently; failed saving keeps the result visible and provides an idempotent retry. Contact submission requires successful completion persistence. Unsaved results remain in memory only and do not survive a reload. The selected product is visible and editable in the contact step, for HR Agent, Prism or both. Consent stays unchecked. Tied leaders are named rather than hidden. No result delivery or automatic outreach is promised. See DESIGN.md and AGENTS.md. The local welcome and result have been visually inspected, including a paused-server failure and retry.

`node --test tests/session-sync.test.mjs` covers slow/failed starts, completion retries, deduplication, reset cancellation and canonical-answer validation. `CHECKPOINT-RESULT-FIX.md` records this checkpoint. `BOOTH-STRATEGY.md` and `BOOTH-REHEARSAL.md` document the proposed buyer journey, observed public product mini demos and measurement plan; the narrow `/demo` story and local instrumentation subset are implemented; the broader event-day plan, connected products and human validation remain outstanding.

## Voice casting — 26 September expansion

`/voices` now compares OpenAI, ElevenLabs and Cartesia. Add optional provider keys in the page’s local setup form (saved only to ignored `.dev.vars`, never browser storage or client bundles), then load voices for Russian or English. One explicit click generates one short sample; repeats use a local cache. Three shared lines compare invitation, game reaction and result. Personal “Natural / Robotic” marks and the booth voice are saved independently per language.

Models: OpenAI TTS-1, TTS-1 HD, GPT-4o mini TTS snapshots March/December 2025 and existing Realtime-1.5; ElevenLabs Multilingual v2, v3 and Flash v2.5; Cartesia Sonic 3 / 3.6. OpenAI has 13 TTS voices in the mini family, 9 documented voices in the classic family, and 10 Realtime voices. Actual account/model/voice availability is checked on generation; unsupported combinations show an error with no fallback or retry.

“Use on booth” also changes the primary game. TTS reads curated short screen-context lines and recomputed role results; Realtime keeps its generative reactions. Both remain output-only with played PCM driving the mouth, cancellation on screen changes, visible mute and normal lifecycle cleanup. No visitor audio, video or contact fields are sent. External keys are not needed for the eight cached new OpenAI auditions or twenty existing Realtime samples. Newly generated samples are kept in ignored `.sites-runtime/voice-lab`.

Provider-native language badges are metadata, not a listening verdict. No provider has been declared the least robotic without a human comparison. Start with native-language ElevenLabs Multilingual v2 and Cartesia Sonic 3.6, and compare OpenAI Fable/Nova/Onyx across families. See `artifacts/voice-lab-20260926/REPORT.md`. These local endpoints are a development-server feature, not a hosted deployment.

## Current voice — 26 September 2026

The main `/` journey is output-only. First choose Russian or English; Start begins a single GPT-Realtime-1.5 session which narrates the eight touch questions and result in that language. No microphone permission or input audio is requested. Tapping Navi gives a hint for the current screen. Screen changes cancel obsolete speech. Camera position/presence is optional, processed locally and never sent to OpenAI.

The header provides a voice-off control. Reset, page hide, settings changes, errors, unmount and the ten-minute limit close the session; there is no paid automatic reconnect or fallback voice. Actual played PCM drives Navi’s mouth. Form values never enter voice context. Local diagnostics at `/api/live/diagnostics` contain bounded connection/timing metadata, not audio, credentials or captions.

`/voices` offers the ten Realtime voices (Alloy, Ash, Ballad, Coral, Echo, Sage, Shimmer, Verse, Marin, Cedar), each with an identical Russian and English audition. These twenty cached WAV files require no microphone or new generation. A voice is saved separately for each language on this device and applies on the next narration start. Default: Marin. OpenAI recommends Marin/Cedar for quality; a native listening rehearsal is still needed to choose the most natural delivery. See `VOICE-BRIEF.md` and `artifacts/narration-20260926/REPORT.md`.

`npm run dev` starts the app on 5173 and a loopback-only PCM relay on 5174. The relay holds the ignored `.dev.vars` API key, validates voice/context, and fixes the model and 24 kHz format. Sessions consume API quota. The primary flow works by touch even when voice is unavailable. `/demo` remains a separate historical opt-in microphone conversation; `/stage` stays silent.

`node --test tests/live.test.mjs tests/live-pcm.test.mjs tests/live-game.test.mjs tests/live-demo.test.mjs` verifies output-only capture isolation, language/voice configuration, cancellation, streaming/mouth levels, lifecycle cleanup and compatibility with the historical demo. These tests do not create paid sessions.

Recruitment voice and operator guidance: `VOICE-BRIEF.md`, `BOOTH-SCRIPT.md` and the current voice addendum in `DEMO-CHECKPOINT.md`. `/demo` camera is optional/local and sends neither images nor contact data to the voice model. Camera remains opt-in, can stay on between visitors, and stops on hide/disable/unmount; reset invalidates old detector work. Its tab journal includes anonymous voice lifecycle/timing events, not transcripts. `node --test tests/live-demo.test.mjs tests/hiring-demo.test.mjs` covers source/count validation, revised-context cancellation and rehearsal isolation.

Stage/camera checks: `node --test tests/stage-loop.test.mjs tests/local-camera.test.mjs tests/mascot-gaze.test.mjs tests/face-worker.test.mjs tests/motion.test.mjs`. Controlled fixtures verify cleanup, stale-result rejection, touch priority and hidden/reduced-motion handling; they do not replace a physical webcam or venue test. See the stage/camera addendum in `DEMO-CHECKPOINT.md`.
