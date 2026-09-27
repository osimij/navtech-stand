# Multi-provider voice lab — 26 September 2026

## Delivered

Three provider tabs, ten model choices, 13 OpenAI mini-TTS voices / 9 documented classic TTS voices / 10 existing Realtime voices. ElevenLabs and Cartesia catalogs load per language after key entry, paginate, show provider native-language metadata and accept an account voice ID. Keys are same-origin/local-only, validated, written atomically with 0600 permissions to ignored .dev.vars and never returned in status or stored in browser storage. Concurrent saves are serialized.

Three fixed RU/EN audition lines; explicit generation only; complete PCM cached by provider, full synthesis request/settings and version. Errors are sanitized and never automatically retried or routed to another provider. The sample index survives reloads. Listening ratings and booth model/voice selections persist separately by language. Existing Realtime recordings remain available.

The booth routes TTS selections to a streaming, output-only PCM client with no microphone API, cancellation and stale-packet rejection, silence/mute cleanup and actual output-level mouth animation. TTS uses curated on-screen situational prompts and deterministic result wording. It does not generate new conversational reasoning. Realtime behavior remains available and historical /demo remains unchanged.

## Evidence

- Official OpenAI, ElevenLabs and Cartesia model, voice and endpoint documentation read. Current OpenAI account lists TTS-1/HD and both mini TTS snapshots.
- Eight new live OpenAI auditions succeeded: RU/EN Fable on TTS-1 HD; Nova on TTS-1; Coral on mini TTS December 2025 and March 2025. All yielded nonempty 24 kHz PCM; cached WAVs. No unsupported claim of pronunciation or naturalness pass. One initial request was interrupted by a development-server reload before any response; it was not counted as a successful sample.
- 54 targeted tests passed: provider requests/key isolation, allowlists, native metadata/pagination, local-origin enforcement, cache reuse, no arbitrary form text, missing keys, sanitized errors/no retry, sample conversion, curated language, odd-byte PCM chunk assembly, mouth output, cancellation/late audio and existing Realtime regression coverage.
- Production build passed. TypeScript passed during implementation; final check recorded separately in turn. Changed-file lint has no errors, with the existing camera cleanup-ref warning.
- Browser: provider/model switching, all thirteen mini-TTS voices and nine classic voices, cached Russian Fable playback, booth selection persisted across tabs, Navi output-only playback and a nonzero mouth frame, mute. No new errors in a fresh booth tab. A hot-reload-era missing-samples error was fixed with empty-result handling and verified on a fresh page.
- Restored the user’s prior Russian Cedar / Realtime-1.5 choice after the test. English choice was not changed. No database session or lead was created by the welcome-screen playback check.

## Not verified

ElevenLabs and Cartesia real generation/catalog access require the user’s keys; only adapters and response fixtures were tested. No physical booth speaker rehearsal or human naturalness ranking. API model/voice access can differ by account. This is local development middleware, not a published service.

Sources:
- https://developers.openai.com/api/docs/guides/text-to-speech
- https://developers.openai.com/api/docs/models/gpt-4o-mini-tts
- https://elevenlabs.io/docs/overview/models
- https://elevenlabs.io/docs/api-reference/text-to-speech/convert
- https://elevenlabs.io/docs/api-reference/voices/search
- https://docs.cartesia.ai/api-reference/tts/bytes
- https://docs.cartesia.ai/api-reference/voices/list
- https://docs.cartesia.ai/build-with-cartesia/tts-models/latest
- https://docs.cartesia.ai/build-with-cartesia/tts-models/older-models
