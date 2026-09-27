# Voice lab repair — 27 September 2026

The screenshot voice resolves to Sienna - Conversational, ElevenLabs ID oGZR5g7rlFABaB1ZfWkI. A bounded direct request reproduced HTTP 402, detail.code paid_plan_required: the account is free and library voices require a paid plan. Read-only subscription check showed unused credits; this was not credit exhaustion.

Changes:
- Parse only allowlisted provider error codes; show actionable Russian or English errors without forwarding upstream messages/secrets.
- Include all ElevenLabs account voices in both languages. Native-accent filtering previously hid standard multilingual voices from Russian.
- Identify standard voices and native accents separately. Show RU/EN saved-sample indicators; require successful generation in the selected language before assigning a booth voice.
- Fix cache collision: ElevenLabs voice ID is in the URL, not the request body. Version 2 cache includes URL and body. Old ambiguous ElevenLabs sample entries are excluded. No automatic fallback or retry.

Verification:
- 12 voice-lab tests passed, including cross-voice cache isolation, per-language payment errors, and key/message sanitization.
- TypeScript, changed-file ESLint and production build passed.
- Roger / Multilingual v2 generated valid PCM/WAV in RU (7.85 s) and EN (6.46 s) with the corrected cache. Browser playback time advanced without media errors in both languages.
- Browser reproduced the clear Russian paid-plan restriction for Sienna; assignment remained disabled. RU/EN interface switching and sample readiness checked.
- Preserved booth settings: Russian Cedar / Realtime-1.5, English Marin / Realtime-1.5. No microphone, visitor records, paid plan changes or deployment.

Naturalness is not established by these checks; the samples are available for listening. Screenshot: bilingual-samples.png.
