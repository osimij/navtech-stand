> Current language scope (22 September 2026): active UI and voice are Russian/English only, default Russian. Older Tajik checks below are historical evidence, not an active capability or outstanding approval requirement. Use `VOICE-REHEARSAL.md` for current rehearsals. The former guide is preserved under `artifacts/retired-language-evidence/TAJIK-AUDITION.md`.

# Recruitment story prototype

22 September 2026 · local only · [Open /demo](http://localhost:5173/demo)

## Initial touch checkpoint (before voice integration)

One fictional support application → clarify interview availability → immediate HR brief and Prism queue insight → optional human process discussion / sample plan download. Six authored records, one meaningful choice with three alternatives, no score or automated candidate decision. Original source facts stay unchanged and inspectable. The visitor can revise their answer and inspect/filter the queue.

| Answer | Clarify | Agree time | Later | Already scheduled | Total |
|---|---:|---:|---:|---:|---:|
| Initial / still unknown | 3 | 1 | 1 | 1 | 6 |
| This week | 2 | 2 | 1 | 1 | 6 |
| Next month | 2 | 1 | 2 | 1 | 6 |

RU/TG/EN text, locally served Inter, touch controls, contextual Navi text hints and reactions. Unknown availability keeps Navi thoughtful. Handoff reveals a focused, scrolled-into-view message; it does not send contact data or book anything. The generated Markdown brief contains source facts, clarification, actual queue counts, next HR action, management question, required data, unassigned human owner, limited pilot scope, a proposed measurement and explicit assumptions/sample labels.

The rehearsal panel contains anonymous tab-local events with origin and sample context, IDs, revisions and raw timings. No remote store or localStorage is used. Max 500 events; export before reload/close. The existing home and `/screen` remain separate; database state was unchanged at 8 starts / 3 completions / 0 leads after prototype testing.

## Verification and artifacts

- Browser: full Russian path, all three choices, repeated selected-answer tap, original evidence, queue filter, local plan/JSON downloads, handoff and clean reset. Tajik intro → unknown result → handoff also exercised; English entry rendered. This is functional localization testing, not a native-language approval.
- With the known development server paused, choosing availability still rendered the combined result. There is no model/save dependency after assets are loaded. The server was resumed afterward.
- One scripted measured run: result visible in **23ms, 25.4ms, 28.2ms** for the three revisions. Two animation frames after commit, document/viewport visibility checks, duration from the click timestamp. This is text/result visibility, not chart-animation completion, model speed, human reading or physical-display latency. Completion requires the Prism insight to be visible. No percentile claim from three observations.
- Browser-downloaded [raw run JSON](artifacts/demo-rehearsal-run.json): 11 events, one start, three changes/results, one first value/completion, one download request and one handoff click. Reset happened after export and was visibly recorded as event 12 at 55,699.3ms. Repeat tapping the same answer did not add a change.
- Browser-downloaded [Russian sample plan](artifacts/sample-pilot-ru.md): sample label, original facts, unknown answer and 3/6 count checked against the rendered result.
- Four focused tests cover every choice/count/source invariant, all nine language/choice briefs, idempotent milestones/revisions/reset cancellation, and separation of visitor engagement from sample records. Combined relevant suite: 18 test units passed, including existing engagement, game-voice context and session persistence.
- Final TypeScript and build passed. Targeted lint passed with the existing mascot sprite `<img>` optimization warning only. Whitespace diff check passed.
- Existing home rendered with its microphone control; `/screen` rendered its original three results and product-interest exploration still worked. No paid audio generation or recording was used for that initial touch-only checkpoint.

Inline screenshots show the intro, joined result and Tajik handoff. No standalone screenshot files were supplied by the browser API. The initial viewport was 1265×720; its first narrow override did not apply. The later voice checkpoint below successfully applied and inspected a narrow viewport. Actual angled-touchscreen/hardware checks remain required.

## Boundaries

This is a deterministic sample story, not a connected production HR-Agent or Prism session. At the initial touch checkpoint `/demo` had no microphone/camera. The current voice extension is documented below; the later optional-camera extension is described below. The home game retains its quiz voice context. Optional mascot label/hint props keep their previous defaults.

The plan download is a local/staff artifact on the kiosk. It is not delivered to a visitor’s phone. Public QR delivery, hosted brief links, email and messaging remain unimplemented. A handoff click is not a qualified next step, and no live conversion claim is made.

Russian/English human listening, ten fresh target-like testers, actual booth hardware/noise, human comprehension/excitement and event-day conversion remain outstanding. The target of a useful outcome in 90 seconds is a rehearsal goal; a fast scripted click-through does not prove it for people.

See [BOOTH-STRATEGY.md](BOOTH-STRATEGY.md) and [BOOTH-REHEARSAL.md](BOOTH-REHEARSAL.md) for the broader proposal, measurement denominators and next validation. The later authorized voice extension stays within this one fictional workflow; no second workflow or production connection has been added.


## Voice checkpoint — 22 September 2026 (before optional camera extension)

Explicit «Поговорить» starts one OpenAI Realtime/Marin PCM conversation through intro, case and result. Server-authored context includes the exact original fictional application, language, phase, actual touch choice, revision, all six computed rows/counts and next action. Touch remains authoritative. Availability clarification and a booked interview are explicitly separate metrics. No arbitrary prompt/contact input enters context. Revised answers cancel old speech, clear captions/queued sound and reject late audio from older revisions. Mouth levels come from played PCM. No demo camera was added at that voice checkpoint; the later camera extension is below. No voice action tools were added.

Human handoff stops microphone/playback and clears the caption; closing it stays silent. Explicit later restart creates a new session. Reset clears the visitor's choice/caption/session; page hide, unmount, errors and ten-minute limit stop capture. Source/count and lifecycle regression tests cover stale callbacks and late packets. The journal includes anonymous voice events with attempts/sequences and timing, never transcripts/contact/audio.

### Real provider evidence, including limitations

All inputs below are **synthetic Tajik audio**, not visitor recordings. The same two WAV fixtures were paced through the local relay at 24 kHz. Playback drain was simulated in these transport probes. Question 1 includes a 600ms inserted pause at 1.860s; no response began while either input was still streaming. This is bounded pause evidence, not proof for longer/native/noisy speech.

| Configuration | Question 1 first packet after input end | Question 2 after choosing week | Observation |
|---|---:|---:|---|
| Initial medium VAD, original prompt | 1.584s | 4.985s | Counts 3 then 2; verbose replies 15.2s/12.8s, opening 13.1s. |
| High VAD, shorter opening/count prompt | 2.188s | 4.284s | Count 3 then **5**. Follow-up wording could mean no booked appointment (5), but did not distinguish that from the displayed availability counter (2). Kept as a mismatched result. |
| Current high VAD, explicit two-metric grounding and non-user greeting | 2.778s | 1.497s | Count 3 then 2 with correct unresolved case IDs HR-01/HR-05; opening 3.45s. No claim that all ambiguity is solved from one response. |

Prompt and settings changed together; these are configurations with identical audio fixtures, **not a clean one-variable comparison**. No median/p95, guaranteed sub-three-second SLA or native-language-quality claim. Current cold relay start → first greeting packet was 3.199s; turn latency excludes initial setup. High VAD is the current speed-oriented choice and needs native/noise/long-pause rehearsal.

Raw reports: [medium](artifacts/demo-voice-20260922.json), [short/high](artifacts/demo-voice-20260922-short-high.json), [current grounded](artifacts/demo-voice-20260922-grounded.json). The historical medium greeting trace mistakenly repeats `first_audio` on its packets; use the earliest (2.841s from probe start), not multiple observations. Later harness traces deduplicate this; raw history was preserved. Spoken-question timings above are separate correctly recorded observations.

Each run changed the context while speech was coming out: received `audio.clear`, observed provider response status `cancelled`, then heard output labelled with revision 3. The current run's fresh-revision packet arrived 3.034s after change; no stale audio after the change or audio after local close was logged. The close marker is the **local relay acknowledgement**, not a measured remote-provider close acknowledgement. Actual speech barge-in during ongoing output remains covered by transport/worklet unit tests; the real run exercised context interruption, plus speech start/stop during ordinary questions.

Historical recording: [Tajik first answer](artifacts/demo-voice-20260922-grounded-output-1.wav) and [follow-up after changing availability](artifacts/demo-voice-20260922-grounded-output-2.wav). Synthetic input fixtures: [question 1](artifacts/demo-voice-20260922-input-1.wav), [question 2](artifacts/demo-voice-20260922-input-2.wav). These are material for a native-speaker audition, not an approved voice performance.

### Browser and build checks

- Final Russian browser run: case → voice → week result → staff handoff → close panel (still off) → explicit voice restart → reset (off, clean intro). Actual played-signal timing from voice tap: **3.011s / 3.076s** including setup. Result appeared in **28.6ms** while voice was connected. Handoff event → local voice-ended UI event was **19.6ms**; not remote provider termination time. Raw visible journal transcribed into [browser run](artifacts/demo-voice-browser-run.json). Reset intentionally ends the old recorder before late lifecycle callbacks can enter another visitor's run.
- Earlier browser run measured 2.764s first played audio, 28.7ms result and roughly 17ms local handoff UI completion; those are earlier observations, not substitutes for the final run above.
- Requested 430×900 override actually applied to the selected tab: document **415×900**, scrollWidth **415** (scrollbar excluded). Intro, case and full stacked result inspected without horizontal overflow; override reset afterward. This closes the earlier failed-override gap. Physical touch reach and venue legibility are untested.
- Final observed browser error log after 22:18:36 UTC was empty. Home retained its voice/start controls; `/screen` still showed three results and zero contacts. No demo scenario data entered live booth analytics. Local preview remains running, nothing deployed.
- **47 relevant test units passed**, TypeScript passed, production build passed. Targeted lint: zero errors, only the existing mascot sprite `img` optimization warning. Existing worklet tests verify actual sample playback and mouth-level callbacks; this is not an acoustic listening judgement.

Current operator materials: [BOOTH-SCRIPT.md](BOOTH-SCRIPT.md), [VOICE-BRIEF.md](VOICE-BRIEF.md), [BOOTH-REHEARSAL.md](BOOTH-REHEARSAL.md). The script includes the invitation, 60–90s beats, exact availability metric, two qualification questions, buyer/nonbuyer close, two-person roles, reset/touch fallback/download truth, and the then-proposed silent 18-second loop, now implemented as described below. Human scorecards include an unprompted HR/Prism explain-back rubric; all human outcome cells remain blank.


## Current stage and optional-camera checkpoint — 22 September 2026

### What changed

[Local `/stage`](http://localhost:5173/stage) is a silent 18-second four-beat preview: HR question (4s), clarification/next recruiter action (5s), Prism availability insight (5s), touchscreen invitation (4s). Persistent sample label; touchscreen invitation in beats 0–2 footer and prominently in beat 3. Exact shared `demoQueue` rules: 3→2 awaiting availability clarification out of 6; five appointments remain unbooked. The six marks derive their state from each case (HR-01 and HR-05 remain unresolved). This is neither a hiring decision nor a sent invitation/booking.

Stage has separate RU/TG/EN operator controls, pause/resume, replay and direct beat selection. Manual mode disables animations; OS reduced-motion preference opens the static Prism result with controls. Hidden documents pause without silently resuming. Original logo/mascot and local Inter are reused. It has no microphone, camera, provider, contact, visitor transcript or telemetry integration. It does not replace `/screen`, route physical displays or occupy a partner’s screen without agreement.

`/demo` now has separate **«Настройки камеры»** with explicit video-only opt-in, explanatory status and visible stop control while active. It reuses the local MediaPipe worker/geometry and mascot face-position API, not the quiz voice wrapper. Pointer/touch wins for 2.2s before face gaze resumes. Presence may elicit one bounded quiet wave on intro, with arrival/cooldown rules, never voice activation. No inference of identity, emotion, age, gender, appearance or personality; no images/positions are persisted or sent to voice/analytics.

An operator-enabled camera can remain on across visitors as stated in settings. Reset clears gaze/arrival, cancels a pending permission request and recreates the face-worker epoch. Late frame/stream callbacks cannot activate a new visitor’s state. Handoff pauses gaze/arrival and disables mascot reactions while voice stops; Navi stays neutral. Hide, disable and unmount stop video capture with explicit restart required. Shared face-worker lifecycle was extracted into a testable controller; the original quiz retains its behavior. Its gaze hold was aligned to the existing 2.2s pointer-return timer.

### Verification and precise limits

- Browser observed all four stage beats, correct labels/counts, pause/resume, manual selection, replay, keyboard Return on pause, and RU/TG/EN switching. Final footer invitation inspected at actual **1920×1080** landscape and **810×1440** portrait; document/scroll width matched at both sizes. The original portrait proof screenshot showed the stacked layout clearly. Viewport overrides were reset afterward. This does not establish legibility at physical viewing distance or resolve “3x5” units/orientation.
- Images were inspected inline using the supported browser API. It exposed image bytes, not a saved screenshot path. A full-page capture and an immediate post-resize capture had browser-rendering artifacts; subsequent stable screenshot/DOM bounds checks were used, rather than treating those images as app clipping. No standalone screenshot files are claimed.
- Actual browser camera activation stayed pending at the host permission layer. Native Codex permission UI is unavailable to the computer-use tool. Cancel returned the UI to camera-off; closing settings, touch case/result, human handoff/neutral mascot and reset all worked, with voice off. **No successful physical-camera or face-detection hardware pass is claimed.**
- Controlled media/worker fixtures cover denied and missing cameras, explicit retry, disable/hide/dispose/reset during pending permission, late stream release, stop during video play, retained operator stream across reset, disconnect cleanup, one frame in flight, paused/handoff result suppression, late bitmap/position rejection and worker disposal. Existing worker fixtures cover mirrored/vertical geometry and absent face; gaze tests cover bounds, smoothing and touch priority. These are simulated media/detectors, not a real face/person trial.
- Browser manual/no-animation mode was exercised. In this IAB, hiding the pane left `document.hidden=false`; actual hidden-document transition and OS reduced-motion events were therefore verified through the same production environment binding with controlled EventTargets. Do not describe that as a native OS/hardware preference test. Onsite hidden-page/reduced-motion behavior still needs confirmation.
- No new paid voice probe was run: this work does not change provider behavior. Stage imports no media/voice integration; browser voice diagnostics remained empty during this check and booth analytics remain separate. Previous real Tajik audio evidence and its slower/mismatched runs remain above.
- **62 relevant test units passed** covering stage, camera, gaze, worker, voice, source/counts, rehearsal and session persistence. TypeScript, targeted lint and production build passed; lint has only the existing mascot image optimization warning, with zero errors. Whitespace checks passed. Home and `/screen` rendered with the original 8 starts / 3 results / 0 leads; camera and voice were left off.

### Overall goal requirement/evidence audit

| Requirement | Concrete evidence now | Still unobserved / external dependency |
|---|---|---|
| Research and choice | Event/product references and observed public HR/Prism mini demos in `BOOTH-STRATEGY.md`; a joined operational sample chosen for organizational buyers | Current real product endpoints/source access and final forum logistics |
| Booth story and staffing | `BOOTH-SCRIPT.md`: invitation, 60–90s beats, two staff roles, qualification/close, working silent stage and camera operations | Partner slot, banner/screen positioning and real queue capacity |
| Implemented demo | `/demo` source-preserving HR brief → exact six-case Prism insight; revised choices, optional conversation/local gaze; original quiz and `/screen` retained | Production backend connection and physical camera/angled-touchscreen validation |
| Conversion/measurement | Result first, optional human handoff, honest local sample brief, anonymous rehearsal events and a precise qualified-next-step definition | No phone delivery, automatic outreach/bookings or measured visitor conversion |
| Technical rehearsal | Unit/build/type/lint checks, browser touch/voice/reset, synthetic Tajik probes, stage dimensions and controlled media lifecycle | Real camera permission/detection, native Tajik listening, venue noise/echo/sightlines |
| Human outcomes | Blank ten-person scorecards and reproducible unprompted HR/Prism explain-back rubric | Real testers, comprehension, excitement, usefulness, agreed next steps and held meetings |

The current local implementation checkpoint is complete when the final checks pass. It is not a claim of forum-ready hardware or validated conversion. Further human/field claims require those observations; no extra unrelated feature is a substitute.


## 22 September: bounded result rehearsal and documentation closeout

The original `/` quiz passed ten actual IAB runs at 1809×1354: four normal completion saves, three with a 2.5-second delay in the real authenticated completion PATCH, three returning synthetic HTTP 503 before its database UPDATE. All results were correct; final input → visible result ranged **22.1–29.4 ms**, meeting the unchanged 10/10 ≤500 ms local technical gate. Measurement used the actual click event.timeStamp and performance.now after two animation frames following React commit, a visible heading/document and three rendered advice steps; it does not establish human comprehension or physical hardware timing. The three delayed trials were observed in `saving` before `saved`; failed trials retained the result/error/retry and remained incomplete in persistence. R10 visibly reset to welcome. Full evidence and the removed instrumentation patch: [ten-run artifact](artifacts/quiz-result-10-run-20260922/README.md).

No `/demo` save failure was fabricated; that route has no persistence dependency. Existing `/demo` 23–29 ms measurements remain route-specific. Original page/API files were restored byte-for-byte from immediate pre-rehearsal backups. Only the ten exact test session IDs were deleted. Full-row hash comparisons preserved the preexisting database exactly: **8 starts / 3 completions / 0 leads**.

The retired `artifacts/retired-language-evidence/TAJIK-AUDITION.md` historically followed the primary `/demo` RU/TG/EN buyer flow, exact 3→2 clarification versus five unbooked metric wording, visitor-led play/pause/interruption, touch revision, silent handoff and explicit restart/reset. It links existing synthetic audio, keeps the slower/mismatched measurements above, and separates historical Russian-interface `/` quiz/contact/success evidence. Human/native reviewer cells remain blank. The operating script/strategy now retain a valid BI-only organizational prospect through the public Prism sample and the same consent/owner/next-action qualification. No new workflow, deployment or outreach was added.

### Non-current voice experiment and restoration

At the start of this bounded task, an older slow-voice user request was mistakenly treated as a new instruction. Exactly **two** extra synthetic provider sessions were made; both closed. Changes to quiz turn prompts, 350 ms scheduling, shared explicit-request/startup behavior, parallel PCM initialization and per-turn diagnostics were **selectively reversed to the pre-turn contents**, including the three new test expectations and the current voice brief. No Git HEAD reset was used; earlier accumulated work is preserved. The experimental source/patch and both raw outputs remain labelled non-current in [the experiment archive](artifacts/non-current-voice-cadence-experiment/README.md). They are not validation of the restored app. No further paid calls were made.

The restored relevant voice suite passed **36/36** tests, covering quiz continuation, language continuity, actual PCM worklet output, interruption/truncation, cleanup and `/demo` revision cancellation. This is a selective restoration check; prior physical/human limitations remain.

Final restoration validation: TypeScript check and targeted lint passed. A fresh production build was generated from the restored sources, replacing the experimental build output. `/`, `/demo`, `/stage`, `/screen` and `/api/live` returned HTTP 200; the home browser preview was restored to `/` with microphone off and no fresh console errors. Existing aggregate API counts remain 8/3/0. Local artifact links resolve.
