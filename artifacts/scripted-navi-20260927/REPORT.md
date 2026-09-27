# Scripted Navi — 27 September 2026

User selected Sienna and asked for a bounded, bilingual, output-only host with more mascot expression.

Implemented:
- Sienna / Eleven v3 defaults in Russian and English, independent of historical Realtime preferences. Main narration always enters TTS; it cannot start the conversation engine. Realtime auditions cannot be assigned to the scripted booth.
- Server chooses approved screen/tap scripts only, validates cue/variant and game context, excludes raw instructions and contact fields. No dialogue, microphone, LLM improvisation, automatic voice fallback or automatic paid retries.
- Thirty approved touch lines across five phases and two languages, plus question/result narration. 6.5-second tap cooldown and 12 spoken touch reactions per visitor. Audio/requests cancel on screen changes. Answer selection no longer repeats the old question during the transition.
- Wink, boop, shy, curious and delighted motion; larger welcome/game mascot; subtle speaking movement, actual audio-driven mouth. Reduced motion suppresses movement; hidden/inactive states and cleanup retained.
- Reviewable operator script: NAVI-SCRIPT.md.

Verification:
- 32 targeted tests passed, including all 17 voice-lab tests. Includes injected text, invalid cue rejection, bounded bilingual script, canceled speech, tap cooldown and Sienna-only default routing for narration.
- TypeScript and production build passed. ESLint has zero errors; two existing warnings remain (sprite image and camera cleanup ref).
- Paid account successfully generated Sienna / Eleven v3 welcome samples in Russian (6.88 s) and English (7.36 s).
- Browser primary route showed RU/EN approved captions; English playback drove data-speaking=true and open mouth. Approved English touch caption and wink were also observed together with data-speaking=true. Mute stopped playback. No microphone prompt or conversation UI.

Limit: voice naturalness and speaker acoustics still require listening at the booth. Uncached lines depend on provider generation speed; repeated lines use the local cache. No hosting/deployment change.
