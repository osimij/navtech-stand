# Output-only bilingual Navi — 26 September 2026

## Implemented

Primary `/`: explicit Russian/English choice before start or voice activation, translated questions/schematics/results, one output-only GPT-Realtime-1.5 session across touch stages. No microphone acquisition or input PCM. Model uses the selected language; screen changes cancel obsolete narration and clear playback/captions. Existing optional local face gaze remains separate. Voice off/reset/hide/settings cleanup remains active.

`/voices`: all ten Realtime voices, identical cached RU/EN clips, shared audio player, independent persistent selection for each language. Default Marin; documented Marin/Cedar shortlist, no unsupported naturalness winner. Historical `/demo` retains its microphone mode.

## Verification

- 55 quiz/session/voice/context tests passed, including no-microphone narration, chosen voice/language, rejection of input audio, cancellation and late-packet suppression.
- TypeScript and production build passed. Changed-file lint has no errors; existing camera cleanup-ref warning remains. Whole-repository lint remains blocked by pre-existing archived/generated-file errors and the operator home-link rule.
- Browser: language required, English full eight-question flow to professional results, voice begins without microphone permission, next-screen generation on same session, mute, next-visitor language reset. Live diagnostics confirm played PCM: first output about 2.4s after connecting, about 0.56s after response start. This is one observed run, not a latency guarantee.
- Browser: cached Marin Russian and Cedar English both advance the native audio player without error. All ten cards available per language. RU Cedar selection did not change EN Marin; restored both to Marin after verification. No browser error logs in primary flow.
- One synthetic session (3b600a86-d660-48bb-b0d0-8dec64d90046) completed with answers [1,1,2,3,0,1,2,3] and was removed using exact ID/time/answer guards. All 18 baseline sessions and 0 leads remained hash-identical. No contact submitted.

## Audition integrity and limits

Final manifest contains 20 completed WAV samples. Every normalized provider transcript equals the requested line; durations 7.2–10.3s. The first batch responded to the quoted line rather than reading it; 8 initial attempts also exhausted their smaller output limit. Those 28 attempts were excluded from delivered samples and recorded in invalid-first-auditions.json. A corrected explicit reading instruction was verified on Cedar RU, then the remaining 19 were generated. Total audition attempts: 48, plus one live browser narration session. No further automatic retries were run.

The delivered twenty clips are the corrected set. Playback does not create a provider session. Transcript integrity, stream playback and duration do not establish accent, warmth or least-robotic quality. Human listening on the actual booth speakers remains unverified; no physical camera rehearsal was done this turn.
