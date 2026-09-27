# Navi voice rehearsal — Russian and English

The active app supports **Russian and English only**, with Russian as default. Choose RU or EN before explicitly starting voice. Unsupported or stale language values fall back to Russian. Navi should offer these two languages if asked to use another. The original `/` interface remains Russian; its voice can use either supported language. `/demo` and `/stage` interfaces support both. Older language recordings and the retired audition guide are historical evidence, not active product capabilities or rehearsal requirements.

Use `/demo` for the buyer story. It has six fictional applications. The availability-clarification metric changes **3→2 of6** after week/month; interviews not booked remain **5 of6**. A spoken hypothetical does not change the touch choice. No real candidate decision, message or appointment is made.

| Test in RU, then EN | Expected behavior |
|---|---|
| Ask how many applications need availability clarification; change to this week and ask again | Short direct answer: three, then two; names the actual metric |
| Ask how many interviews are not booked | Five; distinguishes this from availability clarification |
| Speak with a normal mid-sentence pause | Listens through the pause; no premature reply |
| Interrupt while Navi speaks | Sound/mouth stop promptly; listens, clears queued audio |
| Change an answer during narration | Old facts stop; new answer uses the current revision |
| Ask a playful question, riddle or challenge | Follows the visitor's lead; no forced joke or repeated sales pitch |
| Ask in the other supported language | Switches RU↔EN and keeps it over screen changes |
| Ask for another language | Briefly offers Russian or English in the current supported language |
| Tap the human handoff; close it | Capture/playback end, captions clear, Navi stays quiet |
| Explicitly start again, then reset for next visitor | Fresh conversation only after the tap; reset releases audio and prior visitor state |
| Original `/`: progress through all five questions and result | Same connection, current question context, concise observations during pauses |

Measure actual end-of-speech to first useful audible response, cold explicit-start to first audio, and touch-change to relevant audio **separately**. Do not subtract VAD, connection or playback time from the user's wait. Browser worklet telemetry is stronger than provider packet timing but does not prove sound reached the physical speaker or a listener understood it. Test quiet and representative venue noise separately.

Judge sound/intonation and wording separately. Ordinary concise language is the target, not exaggerated cheerfulness, canned praise, repeated help offers or marketing narration. A prompt can improve delivery and phrasing without removing synthetic timbre. Compare the controlled Marin/Cedar samples linked in `artifacts/voice-latency-20260922/`; keep the configured default until the user selects a preferred alternative. No recording is a prerecorded live-response fallback.

| Listener / date | Language / hardware / noise | Naturalness of sound | Naturalness of wording | Understood first time | Pause / interrupt / touch | Handoff / reset | Changes requested |
|---|---|---|---|---|---|---|---|
| | | | | | | | |
| | | | | | | | |

Human listener scores and venue approval remain blank until observed. Use BOOTH-REHEARSAL.md for product explain-back and qualified-next-step assessment. Technical audio tests do not establish human-quality approval, excitement or conversion.
