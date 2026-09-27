# Voice latency and delivery — 22 September 2026

Local app only. Active languages: Russian and English. Active configuration remains `gpt-realtime-2.1`, Marin, low reasoning effort, high-eagerness semantic VAD, 24kHz PCM at normal playback speed. No fallback recordings, automatic paid retries or deployment.

## What changed

- Replaced a650ms polling loop plus1800ms conversation wait with one350ms quiet window. Explicit help requests bypass the idle window. Automatic comments still wait for speech and actual playback to finish.
- Cancel a pending screen response when visitor speech starts, including the race where the provider has not assigned a response ID. Late obsolete audio/transcripts cannot play over the visitor. Barge-in still truncates at the actual played sample.
- Use short direct conversational wording; no forced enthusiasm, canned praise, marketing pitch or appended help offer. Quiz comments frame the next decision or react to the previous choice, rather than announcing what is on screen.
- RU/EN only throughout active selectors, dictionaries, validation and prompts; unsupported/stale language values fall back to Russian. Historical third-language evidence is retained separately.
- Added bounded timing events for request, provider response, first packet, first played samples and speech boundaries, without retaining visitor audio/transcripts.

## Actual browser comparison

Same synthetic Russian question and browser AudioWorklet, same model/voice/format/speed. These are individual bounded rehearsals, not distributions or a one-variable benchmark: wording and scheduling both changed, network/provider timing varies.

| User wait | RU before | RU after scheduling/race fix | EN after (no fresh EN baseline) |
|---|---:|---:|---:|
| Explicit cold start → played sound |2.189s|3.094s|2.668s|
| Last captured question signal → played answer1 |1.760s|1.867s|3.306s|
| Same question after selecting week → played answer2 |1.813s|1.920s|3.147s|
| Question interrupting output → played follow-up |1.813s|2.880s|2.240s|
| Explicit help tap → played sound |1.823s|1.135s|1.146s|
| Change to month while speaking → new relevant sound |3.478s|1.608s|1.612s|

**Supported improvement: screen-change and explicit-help latency. Spoken-turn and cold-start latency are not solved.** Final RU VAD waits were0.981/0.960/2.011s; EN2.443/2.188/1.263s. Generation after response creation adds roughly0.56–0.93s in these final traces; packet→played adds0.04–0.08s. There is no large playback prebuffer to remove. Do not promise sub-second conversational replies or generalize these synthetic results to the venue.

Both final language runs said three applications initially and two after week; the month result also correctly retained two awaiting availability clarification. Five unbooked interviews is a different metric. Measured600ms internal pauses remained intact. A screen response was requested before speech detection during answer revision but was cancelled before audible output in the final runs. Barge-in and touch revision cleared playback; final socket-close events were observed.

Raw browser downloads: `before-ru-browser.json`, `after-ru-browser.json`, `after-en-browser.json`. `measurements.json` contains derived components. `response.first_packet` and `response.first_played` diagnostic rows use relative response durations in their `ms` field; the harness's `first.packet` and `first.played` rows use the session clock. Use the latter for end-to-end comparisons. Duplicate event names represent raw transport observation plus the client's bounded diagnostic, not multiple sessions.

## Retained intermediate evidence

- `after-ru-semantic-browser.json`: intermediate result before new request telemetry/exact process restart; context3.742s, no context improvement. The running module version could not be proved. Do not present as final.
- `after-ru-server900-intermediate.json`: restarted relay, server VAD900ms experiment. Context1.557s and help1.152s; spoken2.29–2.88s, cold5.282s including2.783s before local channel-open. It exposed a pending-response overlap during spoken2. Server VAD was rejected and semantic-high restored; the race was fixed separately. The observed overlap was an in-flight screen response, not a reply triggered by the internal pause.
- `baseline.json`: earlier synthetic third-language baseline before the user removed that language. Context export was lost when its temporary tab disappeared; this is incomplete historical evidence, not current language coverage. Its actual internal gap was approximately1.16s (600ms had been inserted into preexisting silence), unlike the current RU/EN fixtures.
- One interrupted Russian baseline session lost its trace during a development reload. Counted below, never claimed as passing evidence.

## Input and playback method

Explicit test buttons feed synthetic WAVs into a `MediaStreamAudioDestinationNode`, through the actual `createLiveVoice`, local relay, real provider and browser output worklet. No physical microphone or visitor recording. Start, incoming speech, VAD, provider creation, packet receipt and nonzero played output are captured. Last input signal is worklet RMS>.009, sampled about every50ms; the file-end clock is retained separately. Hardware output latency was approximately24–25ms. Worklet telemetry proves samples were processed for playback, not that a physical speaker was heard.

`fixture-generation.json` records RU/EN generation. `fixture-pauses.json` records600ms total internal silence after adding240ms(RU) or80ms(EN) to existing gaps. `input-*-original.wav` and `input-*.wav` are synthetic test assets. This is bounded pause evidence, not a guarantee for longer pauses, native accents, noise or echo. Temporary test routes and public fixture copies are removed after verification; archived harness source is non-runtime text.

## Controlled voice auditions

Same exact line per language, same model, low effort, normal speed and delivery direction. The only intended comparison variable is voice. Both provider connections closed successfully. No active default change: Marin remains selected until the user chooses. These are auditions, never prerecorded live replies.

| Language | Marin | Cedar |
|---|---|---|
| Russian |[Listen](audition-marin-ru.wav),8.45s|[Listen](audition-cedar-ru.wav),8.80s|
| English |[Listen](audition-marin-en.wav),5.95s|[Listen](audition-cedar-en.wav),6.55s|

`voice-auditions.json` preserves requested text, actual transcripts and delivery direction. They match exactly. Audio files are reviewable; transcript agreement and valid WAVs are not a human naturalness approval. Human preference, timbre, pronunciation and venue playback remain unscored. See `../../VOICE-REHEARSAL.md`.

## Paid-session ledger for this latency/delivery task

1. Earlier third-language baseline, before removal request; incomplete context trace.
2. One RU/EN fixture-generation connection (two outputs).
3. Interrupted RU baseline, no retained passing trace.
4. Completed RU before baseline.
5. Intermediate RU semantic run before request instrumentation/restart.
6. RU server-VAD900 experiment (rejected).
7. Final RU scheduling/race run.
8. Final EN scheduling/race run.
9. Original-quiz continuity run before the last wording refinement.
10. Marin audition (RU and EN).
11. Cedar audition (RU and EN).
12. Original-quiz follow-up after wording refinement.

No continuous background provider sessions, physical microphone/camera access or database writes were made by this harness. Existing quiz statistics changed from the earlier8 starts/3 results/0 leads to9/4/0 during concurrent use; these unrelated records were preserved. Do not claim the original count stayed unchanged.

## Scope stop
The targeted EN900 comparison was staged but never started: browser control became unavailable, then the user stopped all further voice experiments. No thirteenth provider session was opened. The unmeasured EN setting was reverted to semantic-high and the temporary harness removed. 12 provider sessions total for this task. Final quiz continuity passed all five questions plus result; revised wording still repeated one phrase, so conversational naturalness remains unapproved. The last completed code checks were66 tests passing, typecheck/build passing, and targeted lint with zero errors and one preexisting camera ref-cleanup warning.
