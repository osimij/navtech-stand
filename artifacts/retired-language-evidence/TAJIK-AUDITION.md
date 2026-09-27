Historical guide, retired after the user limited the active app to Russian and English. Old relative links describe the original project-root document location.

# Navi: Tajik listening and interaction audition

22 September 2026 · operator guide · human review still required

The primary buyer demonstration is [local `/demo`](http://localhost:5173/demo), with **RU / TG / EN interface and voice selection**, `gpt-realtime-2.1`, Marin, low reasoning effort, high-eagerness semantic turn detection and streamed 24 kHz PCM. Choose TG before explicitly tapping «Поговорить». Touch works without voice; camera is a separate optional local control and never starts a paid conversation. Use the actual booth speaker/microphone for the human audition.

## Listen to existing synthetic evidence first

These files contain synthetic test material, not visitor recordings or a native-speaker approval:

- [First synthetic Tajik question](artifacts/demo-voice-20260922-input-1.wav): includes a 600 ms mid-sentence pause at 1.860 s. The tested turn was not prematurely answered during that pause.
- [Second synthetic question](artifacts/demo-voice-20260922-input-2.wav): ambiguous wording about an undefined time; useful for checking what metric Navi understands.
- [Current-context Tajik answer: three](artifacts/demo-voice-20260922-grounded-output-1.wav): before availability clarification, three of the six sample applications need it.
- [Current-context Tajik answer: two](artifacts/demo-voice-20260922-grounded-output-2.wav): after the week choice, two still need clarification, HR01 and HR05.

The sample is **six fictional applications**. «Ждут уточнения доступности» means the `clarify` stage: **3 → 2 of 6** after week/month. «Интервью ещё не назначено» means **5 of 6**, unchanged across the choices. Availability is not an appointment booking. If a question could mean either, Navi should briefly distinguish or clarify the metric rather than silently guess. «Пока не уточнили» leaves the clarification count at three.

The medium-eagerness probe had first-packet waits of 1.584 s and 4.985 s and verbose replies. The short/high-eagerness run measured 2.188 s and 4.284 s and gave **five** for an ambiguous question where the displayed metric was **two**. The grounded run measured 2.778 s and 1.497 s, returning three then two with the correct case IDs; its cold greeting took 3.199 s to first packet. Settings and prompts changed together, so this is not a controlled comparison establishing causation. These are synthetic relay/provider timings with simulated playback, not human experience or booth-speaker latency. Preserve all observations in [DEMO-CHECKPOINT.md](DEMO-CHECKPOINT.md), including the slower and mismatched runs.

The existing `/demo` browser voice journal separately recorded 3.011/3.076 s tap-to-first-played-audio. It is transcribed visible JSON, not a verified downloaded journal: [browser evidence](artifacts/demo-voice-browser-run.json). Do not merge its timing clock with input-end-to-provider-packet measurements.

## Five-minute operator-led listening pass

Use a fluent Tajik listener. Start in quiet, then repeat under representative venue noise. Ask the listener to correct these test phrases if needed and judge the actual audio, not captions alone. Start on a fresh `/demo` intro; choose TG and explicitly enable voice.

| Try | Expected behavior |
|---|---|
| «Салом, ман мехоҳам ба тоҷикӣ суҳбат кунам.» | Brief natural Tajik reply; no automatic Russian switch. |
| Open the fictional application; ask what needs clarification. | Uses the original application facts. No candidate ranking, invented production connection or real hiring decision. |
| Ask how many applications await **availability clarification**. | Names the metric and three of six before a touch choice. |
| Tap «На этой неделе» and ask the same count again. | Current count is two of six; original facts remain inspectable. Does not say an interview was booked. |
| Ask how many interviews are **not booked**, then use an ambiguous “no time yet” phrase. | Five unbooked; distinguishes that measure from availability clarification, or asks which one is meant. |
| Begin a normal sentence, pause naturally mid-sentence, then continue. | Does not jump in prematurely. The earlier 600 ms synthetic observation is not a guarantee for longer pauses, accents or venue noise. |
| Visitor asks «Ба ман як чистон гӯед.» and says «Ҷавобашро ҳоло нагӯед.» | One playful riddle, waits for the guess, follows the visitor-led exchange without forced sales narration. |
| Interrupt: «Як лаҳза, кӯтоҳтар гӯед.» | Queued sound and mouth stop promptly; listens and gives a shorter response. |
| Change week → month → unknown while Navi is talking. | Old narration stops; current touch choice and exact current metric govern the next answer. Voice cannot change a choice itself. |
| Explicitly switch to Russian, then back to Tajik, and continue touching the sample. | Spoken language follows the request and remains stable across screen changes. |
| Tap «Разобрать задачу моей команды», then close the handoff panel. | Microphone/playback stop, captions clear, Navi stays neutral and silent. Closing the panel does not restart voice. |
| Explicitly tap «Поговорить» after handoff; later tap «Начать заново». | Explicit restart creates a fresh conversation. Reset stops capture/playback and clears prior visitor choice/caption; another visitor requires a new explicit voice tap. |

Record actual request, understood on first attempt, word choice, pronunciation/stress, Russian/Persian substitution, response delay, interruption and any staff rescue. Keep a specific awkward phrase as feedback rather than declaring the whole language supported or unsupported.

| Reviewer / date | Quiet or noise / hardware | Naturalness | Understanding | Pause / interruption | Touch revision | Handoff silent / explicit restart | Approval / corrections |
|---|---|---|---|---|---|---|---|
| | | | | | | | |
| | | | | | | | |

Human acceptance requires a fluent listener comfortable presenting this voice publicly, ordinary spoken Tajik understood on the real hardware, short responsive exchanges, reliable interruption and safe visitor reset. These cells remain blank until observed. No comprehension, excitement or conversion pass is implied by the technical probes.

## Historical original-quiz evidence — `/` only

The original `/` alternative has a **Russian interface** and a separate RU/TG/EN voice selector in its header. Its one voice connection carries welcome → five quiz questions → result → optional contact → success, without sharing contact form values. This is historical quiz evidence; it is not the primary `/demo` buyer route and `/demo` has no contact/success flow.

An earlier authorized provider probe streamed synthetic Tajik audio: «Ман мехоҳам маълумотро таҳлил кунам. Prism чист? Лутфан, ба тоҷикӣ ҷавоб диҳед.» It received a Tajik Prism explanation and kept Tajik through the quiz phases. The account accepted the model/configuration. First audio was 1.395 s after input; cold greeting 3.220 s, greeting duration 3.5 s; result/success context turns 2.622/3.513 s including the intended pause. The historical output is `.sites-runtime/tajik-prism-audition.wav`. Initial long greeting/token-ceiling observations are historical tuning evidence, not native approval.

A later, mistaken out-of-scope quiz cadence experiment made two extra synthetic provider calls in this documentation/rehearsal task. Its runtime changes were selectively reversed; both outputs and the exact experiment patch are retained under [non-current experiment](artifacts/non-current-voice-cadence-experiment/README.md). Those measurements do **not** validate the restored app or supersede the current `/demo` audition. No further paid calls were made.
