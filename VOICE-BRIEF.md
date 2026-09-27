> Current expansion: `/voices` supports three providers and ten model choices. Its “Use on booth” selection overrides the Realtime default independently for RU/EN. TTS uses curated screen-context copy; Realtime remains generative. Keys can be added locally on the page. No microphone. See README “Voice casting” and `artifacts/voice-lab-20260926/REPORT.md` for current scope and verified limits. The initial Realtime-only description below is retained as the earlier checkpoint.

# Navi voice operation — 26 September 2026

The primary booth is a touch interaction with output-only AI narration. There is no microphone and no spoken conversation. A visitor first chooses Russian or English. Start begins narration in that language; the same session follows all eight questions, the computed professional-role result and optional product-contact screen. Tapping Navi asks for a current-screen hint. The model reacts to validated selections, not inferred traits or unseen surroundings.

## Model and voices

Active model: `gpt-realtime-1.5`, no reasoning parameter. Output: streamed 24 kHz PCM through the local WebSocket relay. Ten voices: Alloy, Ash, Ballad, Coral, Echo, Sage, Shimmer, Verse, Marin, Cedar. Default: Marin. OpenAI recommends Marin/Cedar for quality; this is not a Russian/English naturalness ranking.

Open `/voices` to compare twenty cached clips with the same text per language. Playback creates no generation requests. Select a voice independently for Russian and English; the browser saves it and uses it on the next narration start. The booth settings also expose this selection. Fable, Nova and Onyx belong to the separate TTS API, not this Realtime model.

The user explicitly requested these auditions. All final clips completed and their normalized transcripts match the intended lines. Initial conversational/incomplete trials were excluded; the report records them. No claim of a human listening pass is made. Rehearse the shortlist on the actual speakers before choosing the final booth voice.

## Lifecycle and privacy

The primary client never requests microphone capture or transmits input audio. Server turn detection is disabled; a narration session rejects input-audio messages. Camera is optional local face-position/presence tracking only. No video or face positions go to OpenAI, analytics or storage. Camera arrival can animate/invite locally but never starts paid generation.

Screen changes cancel obsolete speech and clear queued sound/captions. Narration is brief and leaves time for touch choices. Actual played audio levels drive the mouth. Reset, hide, settings changes, unmount, error and ten minutes stop the session. Voice-off remains visible. No automatic paid reconnect or fallback. Form values are excluded from model context. The app stores no visitor audio/transcripts; captions are volatile and diagnostics contain only bounded timing/state events.

The API key remains server-side in ignored `.dev.vars`. `npm run dev` runs app port 5173 and the loopback-only voice relay on 5174. Voice requires internet/API quota; the touch game and immediate local result do not depend on generation.

## Historical alternatives

`/demo` retains its explicitly enabled microphone conversation and independent optional local camera. Human handoff stops it. `/stage` is silent. The old WebRTC client and MP3 packs are inactive archives, never an automatic fallback for the primary game.

Verification: `tests/live.test.mjs`, `tests/live-pcm.test.mjs`, `tests/live-game.test.mjs`, `tests/live-demo.test.mjs`. Mock tests verify protocol/lifecycle, not pronunciation. See `artifacts/narration-20260926/REPORT.md` for this change’s evidence.

References: [Realtime conversations and voices](https://developers.openai.com/api/docs/guides/realtime-conversations), [GPT-Realtime-1.5](https://developers.openai.com/api/docs/models/gpt-realtime-1.5).
