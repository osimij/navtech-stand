# Navi: current live voice operation

22 September 2026. This section is authoritative for the running local app; the historical recordings below are inactive.

## Current runtime

Both `/` and `/demo` use OpenAI `gpt-realtime-2.1`, voice `marin`, low reasoning effort, high-eagerness semantic turn detection and streamed 24 kHz PCM. A local WebSocket relay holds the API key in ignored `.dev.vars`; credentials never enter the browser. Audio starts with the first output packet. The microphone starts only on explicit touch and uses paid API quota. No automatic retry, browser/system voice or prerecorded fallback is enabled.

Choose RU/TG/EN before starting. Navi follows a visitor's requested/spoken language and keeps it across touch transitions. The tone is conversational and brief: answer the actual question, allow a spontaneous playful exchange, leave time to think. No automatic appearance jokes, demographic inference, forced compliments or endless sales narration. Riddles, stories and word association may be requested **in conversation**; the current welcome has no dedicated creative-action buttons. No voice action tools are connected: Navi cannot fill forms, change a touch selection or book a meeting.

| Route | Starting / context | Stopping |
|---|---|---|
| `/` | Tap Navi or the microphone. Trusted quiz questions, choices, answer indices and recomputed result follow all five questions and contact/success. No contact form values enter the model. Camera arrival gives a local text invitation, never a paid voice start. | Manual end, visitor reset, hidden page, settings/language changes, unmount, error or ten-minute limit. |
| `/demo` | Tap «Поговорить». Same session follows intro → fictional HR case → actual selected answer → current six-case Prism counts. Original facts and hypothetical clarification are distinct. Revised answers clear obsolete narration. | Manual end, reset, hidden page, unmount, error, ten-minute limit **or human handoff**. Closing handoff never resumes voice automatically. A new explicit tap starts a fresh session. |

Voice is optional; every touch action and deterministic result remains immediate without it. The `/demo` voice control stays visible through the flow. If audio is suspended, «Включить звук» resumes the existing session. A failure leaves the touch flow usable. `/demo` now has a separate opt-in local camera in camera settings. Position/presence drives gaze and a bounded quiet arrival wave, with touch priority; it never starts or changes voice. Handoff pauses gaze and leaves Navi neutral. Camera disable, hidden page and unmount release capture; reset clears the previous detector epoch while an explicitly enabled operator camera can remain on. No images or face positions enter model context, analytics or storage. The existing home camera remains local position/presence only. `/stage` is entirely silent and never requests camera, microphone or model sessions.

## Context, sound and lifecycle

The relay validates bounded context fields and computes facts from server-owned catalogs. `/demo` receives phase, language, revision and one enumerated choice; no arbitrary browser instructions or fabricated counts. It explicitly distinguishes availability still unknown (3 initially, 2 after week/month) from interviews not yet booked (5). An ambiguous question should name the metric or ask a brief clarification. Voice cannot make the fictional workflow into a production product integration.

Home quiz transitions refresh context without cutting off conversation. On `/`, a brief current-question turn is requested after 350 ms of quiet once generation and actual playback have finished (120 ms touch coalescing if already quiet). Fast touches keep only the latest question; results get a short explanation, and the contact form stays quiet. This is local scheduling time, not a promise of first-audio latency. Explicit Navi taps do not add an idle delay. Brief screen observations wait for a conversational pause; a visitor-led creative exchange suppresses automatic quiz hints. In `/demo`, changing a fact cancels speech about the prior revision, clears playback/caption and suppresses late old packets. A one-time demo opening is a response instruction, not a lingering fake user request.

Actual visitor speech interrupts output; the worklet clears queued sound and truncates the provider conversation at the actual played sample. Faster-than-playback bursts preserve words within a 30-second bound. Mouth motion is driven by **played PCM levels**, closes at silence/stop and respects reduced motion. Stop immediately stops microphone tracks and disconnects playback; the relay closes its provider socket. Local session-close UI timing is not proof of a remote-provider close acknowledgement.

The app retains neither visitor audio nor transcripts. Captions are volatile display only. Bounded local diagnostics store connection/timing metadata; the `/demo` anonymous tab journal stores voice lifecycle/timing, attempt and interruption sequence, never speech content or contact details. Synthetic audition WAVs/transcripts in `artifacts/` are explicitly artificial test material, separate from analytics.

Protocol references: [Realtime conversations](https://developers.openai.com/api/docs/guides/realtime-conversations), [model](https://developers.openai.com/api/docs/models/gpt-realtime-2.1). Uses `session.update`, `input_audio_buffer.append` and `response.output_audio.delta`, not GPT Live session events. The old WebRTC client is inactive.

## Evidence and audition

`DEMO-CHECKPOINT.md` records browser playback, handoff, responsive checks and actual-provider synthetic Tajik runs, including the slower/mismatched configuration. Medium turn detection was tested; the current high setting follows a bounded comparison using the same synthetic audio. Shorter prompt wording also changed, so this is not a one-variable latency experiment. A 600ms pause is only one test case. Longer pauses, accented/native speech, echo and forum noise still need rehearsal. Do not call model access, transcripts or unit tests a native-language quality pass.

Use `BOOTH-SCRIPT.md` for operation and `BOOTH-REHEARSAL.md` for the blank human scorecards. Listen on the actual kiosk speakers with a native Tajik reviewer before claiming the voice is ready for the forum.

## Historical archive — not runtime instructions

Before live conversation, six Edge neural MP3 auditions were generated on 21 September 2026 (`ru-RU-DmitryNeural`, `en-US-AndrewNeural`, rate −3%). Their files and `public/audio/voice-pack.json` remain archival. The rejected macOS system-voice WAVs were removed. Archive playback, camera-triggered MP3 invitations, envelope fallback and one-shot speech that stops when the game begins are **not active behavior**. Do not restore them or use the old scripts as current booth guidance.

Historical tooling: [edge-tts](https://github.com/rany2/edge-tts). These clips were local auditions, not approved production assets or evidence of redistribution clearance. The separate ElevenLabs account was not used. Speech Kit source references informed styling/transcription research; the current voice integration is OpenAI Realtime.
