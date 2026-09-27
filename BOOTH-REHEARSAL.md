> Current direction — 22 September 2026: the main local journey is `/` → eight situational career questions → three practical role matches; `/screen` is current-version anonymous Prism analytics. See [CAREER-EXPLORER.md](CAREER-EXPLORER.md). Earlier five-question and recruitment-demo proposals below are historical alternatives. Paid voice experiments are stopped.

# NavTech booth: rehearsal and measurement workbook

22 September 2026 · manual working scorecards · one local rendering gate measured; human gates remain proposed

This workbook accompanies [BOOTH-STRATEGY.md](BOOTH-STRATEGY.md). Public NavTech mini demos were inspected; a production HR-Agent → Prism connection remains **unimplemented**. A separate local `/demo` now implements one sample recruitment journey and a subset of tab-local rehearsal events; the broader event-day instrumentation below remains proposed. The existing local quiz stores sessions/results and consented contact requests; those records do not measure result visibility or buyer qualification.

## Implemented rehearsal prototype

Open [localhost:5173/demo](http://localhost:5173/demo). Default origin is staff rehearsal; the staff panel allows visitor or automated-test origin only before a run. Every scenario record remains sample data. The journal lives only in this tab, is capped at 500 events, and must be exported before closing/reloading. It sends nothing to the existing quiz session/lead APIs.

Implemented events: `demo_started`, `case_changed`, `first_value_visible`, `result_visible`, `demo_completed`, `brief_download_requested`, `handoff_clicked`, `session_reset`. Meaningful answer selections have revisions; repeat taps on the same answer do not add a change. Start, first value, completion and handoff intent count once per session; a brief request counts once per result revision. Reset ends the old recorder and cancels pending visibility callbacks. Download events record a request, not successful delivery to another person. The source context is always sample; real visitor engagement can be marked live independently of scenario data.

Visibility uses two animation frames after React commit, a visible-document check and viewport bounds. Result timing runs from the click event timestamp to the first visible result heading; it does not wait for chart animation completion or imply the content was understood. Completion requires the Prism insight to enter the viewport. This is browser instrumentation, not a physical pixel measurement.

A scripted Russian run at 2026-09-21 21:46:38 UTC (22 September locally) produced result visibility at 23, 25.4 and 28.2ms for week/month/unknown. First useful result and visible Prism insight occurred 4,132.5ms after start; this includes the scripted pause, not human reading. The JSON has 11 events, one completion and one handoff click. A repeated selected-answer tap produced no extra event. A later reset was observed as event 12 at 55,699.3ms, after that download. Raw browser-downloaded evidence: [demo-rehearsal-run.json](artifacts/demo-rehearsal-run.json); sample plan: [sample-pilot-ru.md](artifacts/sample-pilot-ru.md).

No ten-person gates, Russian/English voice review, booth hardware/audio rehearsal, comprehension, excitement or conversion outcomes have been measured. Initial screenshot inspection used 1265×720. The later voice checkpoint successfully exercised a requested 430×900 viewport with actual document width 415px (scrollbar excluded), height 900px, and no horizontal overflow; intro, case and stacked result were inspected. This is not actual booth-hardware validation.

Voice events now implemented: `voice_requested`, `voice_ready`, `voice_first_audio`, `voice_interrupted`, `voice_stop_requested`, `voice_ended`, `voice_failed`. Attempt IDs deduplicate lifecycle callbacks; interruption sequences remain distinct. First-audio duration is explicit voice tap → first non-silent played PCM signal, including setup; it is not spoken-input-end latency. Provider probe timings measure input end → first received packet with simulated playback, separately. A recorder begins at the first demo/voice interaction; if voice starts before the demo, subtract the `demo_started` event elapsed time when calculating start-to-result. No transcript/audio/contact fields are recorded. See `DEMO-CHECKPOINT.md` for raw evidence and known limitations.

## Outcome and definitions

Primary event outcome: **qualified agreed next steps with relevant organizations per staffed booth hour**. Also report staff-person hours so two-person staffing is not confused with one-person productivity. Later outcomes are meetings actually held and pilot-scoping opportunities, not just contacts collected.

Qualified conversation = relevant organization + self-described role/influence + concrete workflow/problem + interest in exploring fit. Qualified agreed next step adds consent + named owner + specific agreed action/date/time or agreed scheduling process. Deduplicate follow-ups by organization/contact with consent in protected staff records. Anonymous app sessions are not unique people.

“Wow” and enjoyment support the outcome; they do not substitute for product understanding or buying intent. No conversion benchmark or expected lead count was established by the research cited in the strategy.

## Before rehearsal

- Confirm the actual HR example/source and whether it is sample, replay or connected live work. Public mini-demo controls alone do not establish an API integration.
- Agree the partner’s screen allocation. Verify what “3x5” means, screen orientation, sound limits, real touch height/reach, standing sightlines, cable routing and space for the expert conversation.
- Assign host and expert roles; confirm breaks and coverage. Prepare approved synthetic cases and reset to a fresh visitor.
- Native speakers review RU/EN copy and voice. Test quiet and separately representative venue noise. Do not infer a native-quality pass from a technical audio probe.
- Verify no contacts/private speech on the shared screen; no contact fields/audio/transcripts in aggregate events. Confirm microphone start/stop and camera processing behavior.
- Have a labelled touch-only/sample fallback that still gives a useful result. Never conceal that a replay is prerecorded or that example data is synthetic.

## Rehearsal design

Recruit 10 fresh target-like testers, including relevant Russian and English speaking coverage. This is exploratory, not statistical proof. Let them approach, start and proceed with minimal help; record any staff rescue. Ask them to explain each product in their own words before prompting.

Compare the current quiz baseline and proposed operational workflow with fresh/alternated testers, or counterbalance order if reusing participants. Record order. Small samples reveal comprehension and friction; do not claim causal conversion lift.

Ask: “What did each product do?”, “What would you use this for?” and “What surprised you?” With opt-in permission, capture brief verbatim feedback. Never invent endorsements. A 4/5 helpfulness/excitement target can guide iteration but is not the sales outcome.

### Consistent comprehension rubric

Before coaching, ask exactly: **«Своими словами: что здесь сделал HR-Agent и что показал Prism?»** Accept natural wording; do not demand the brand name. Record the actual answer and any help before marking either product.

- **HR pass:** describes handling one application/case, plus a concrete next HR action (for example, clarifying availability then agreeing an interview time). “AI in HR” or remembering the name alone does not pass.
- **Prism pass:** describes combining cases to show where the team's attention/action is needed (for example, which applications still await availability clarification). “A dashboard” or remembering the name alone does not pass.
- Mark **unprompted pass**, **pass after help**, or **not demonstrated** separately for each product. Only unprompted passes count toward the proposed 8/10 gate. Record exactly what help was given; never silently convert a coached answer into an unprompted pass.

| Tester | Actual HR explain-back | Actual Prism explain-back | Help / coaching given | HR rubric and reason | Prism rubric and reason |
|---|---|---|---|---|---|
| T01 | | | | | |
| T02 | | | | | |
| T03 | | | | | |
| T04 | | | | | |
| T05 | | | | | |
| T06 | | | | | |
| T07 | | | | | |
| T08 | | | | | |
| T09 | | | | | |
| T10 | | | | | |

### Proposed acceptance gates

| Check | Proposed gate | Evidence to record |
|---|---|---|
| Product understanding | At least 8/10 explain each product without prompting | Actual explain-back, pass/fail reason |
| Useful outcome | At least 8/10 reach it in ≤90s without staff UI rescue | Raw start/result times, interventions |
| Deterministic result rendering | 10/10 visible ≤0.5s after final input, including delayed/failed saving | Per-run input/visible timestamps; normal/delay/failure mode |
| Truth and privacy | Zero sample/live confusion, personal data on big screen, false saved/booked claims | Observations and failure details |
| Voice | First response audio target ≤3s, quiet and noisy conditions separately | Raw timings, median/worst; p95 only with an adequate sample and stated method |
| Interruption and exit | Speech interrupts; stop/reset/handoff ends capture and playback; closing handoff stays silent; no next-visitor leakage | Pass/fail for each control |
| Subjective experience | Initial helpfulness/excitement target 4/5 | Individual scores and optional verbatim feedback |

The original `/` quiz has now passed the **10/10 local technical rendering gate**, with the predeclared four normal, three delayed and three failed completion saves: **22.1–29.4 ms**. The actual final click event timestamp was compared with DOM-visible result heading time after two animation frames; three advice steps were present. This is not a physical pixel or comprehension measurement. The delayed real PATCH waited 2.5 seconds; the failed real PATCH returned HTTP 503 after session authorization. Results were correct across all four profiles. Save errors remained visible and did not hide results. Temporary instrumentation was removed; only the ten exact synthetic records were deleted, and full-row hashes confirmed the original **8 starts / 3 completions / 0 leads** unchanged.

Raw per-run input/visible timestamps, terminal save states, session IDs, correctness and injection details: [ten-run evidence](artifacts/quiz-result-10-run-20260922/README.md), [JSON](artifacts/quiz-result-10-run-20260922/runs.json). The `/demo` route has **no save dependency**; its separate 23–29 ms observations were not subjected to invented save failures. The ten-person, native-language, venue-noise, actual-hardware and conversion gates remain unobserved; all human scorecards below remain blank.

### Manual tester scorecard

Use anonymous IDs here. Keep any volunteered contact details in a separate consented record.

| Tester | Language | Variant/order | Scenario | First value seconds | Complete seconds | Staff rescues | HR understood? | Prism understood? | Voice first audio seconds / noise | Useful /5 | Exciting /5 | Confusion/failure | Next change |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| T01 | | | | | | | | | | | | | |
| T02 | | | | | | | | | | | | | |
| T03 | | | | | | | | | | | | | |
| T04 | | | | | | | | | | | | | |
| T05 | | | | | | | | | | | | | |
| T06 | | | | | | | | | | | | | |
| T07 | | | | | | | | | | | | | |
| T08 | | | | | | | | | | | | | |
| T09 | | | | | | | | | | | | | |
| T10 | | | | | | | | | | | | | |

For each timing run record: `run ID | condition | final input timestamp | result visible timestamp | delta ms | save state | result correct | reset safe`. Test delayed start, delayed completion, failed save, retry, double-tap, invalid contact, rejected contact save, back navigation, interruption and reset during pending work. A local result may remain available while contact saving fails; show those states honestly. Reload currently loses an unsaved in-memory result—do not imply an offline durable queue exists.

## Event-day funnel

Choose passing **groups or persons** as the manual traffic unit before sampling; record the choice and never silently mix them. Use fixed windows and the same unit for stops. Camera detections are not traffic identities. Prefer actual same-window denominators; label any extrapolation explicitly.

| Stage | Definition | Source |
|---|---|---|
| Passing traffic | Chosen unit crosses the agreed observation line during a fixed window | Manual sampled tally |
| Stop | Same unit pauses to attend to NavTech under an agreed observer rule | Manual tally |
| Demo start | Explicit start of an anonymous app visit | Proposed app event |
| First value visible | Useful output actually rendered, not just generated/saved | Proposed app event |
| Demo complete | Planned case-to-insight journey completed | Proposed app event |
| Business use case | Visitor states a concrete organizational task | Staff-confirmed record |
| Expert handoff | Host introduces the visitor to expert for that task | Staff-confirmed record |
| Qualified next step | Definition above, with consent and owner | Protected staff/CRM record |
| Meeting held / pilot scoping | Meeting actually occurred / scoped exploration started | Subsequent manual CRM/operator status |

Rates: stop rate = stopped units / passing units; start rate = stopped units that started / stopped units; completion rate = completed sessions / started sessions; handoff rate = completed sessions with handoff / completed sessions; next-step rate = qualified handoffs with agreed next step / qualified handoffs. Record additional overall next steps/completed sessions only if linkage and deduplication are valid. One group may contain several app sessions: do not divide sessions by stopped groups and call it a person conversion rate. Track group-to-start manually when traffic units are groups.

Use `N/A` when a denominator is zero or not measured; state the denominator and window beside every percentage. Count session milestones once. Remove sample/test activity from live conversion metrics.

### Window scorecard

| Date/time window | Traffic unit | Pass | Stop | Stopped units starting | App starts | First value | Complete | Business cases | Handoffs | Qualified handoffs | Qualified agreed steps | Booth hours / staff-person hours | Variant / disruptions |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | | | | | |
| | | | | | | | | | | | | | |
| | | | | | | | | | | | | | |

Begin with one fixed traffic window as the local baseline. Change one opener or CTA variable at a time and compare reasonably similar windows, recording noise, crowds, breaks and partner-stage activity. Do not forecast total leads from unobserved traffic.

Interpretation: few stops → message/sightline; starts but few completions → interaction friction; completion without understanding → weak product proof; understanding without a next step → relevance/offer. These are diagnostic hypotheses to investigate, not automatic causal conclusions.

### Protected follow-up register template

`Record ID | organization | self-described role | confirmed task | consent reference | owner | agreed next action | date/time or scheduling agreement | requested/booked/held status | brief delivered | pilot scope status`

Keep contacts outside public analytics. End-of-day staff review reconciles duplicates and ownership. Proposed follow-up target is within one business day with the agreed summary/artifact. This workbook does not send messages or create calendar bookings.

## Event-day instrumentation specification — partially implemented locally

Common fields: `event_id` (UUID), `anonymous_session_id`, timestamp (UTC), scenario, language, UI variant, event type, optional duration_ms, and `data_mode` (`live`, `sample`, `test`) describing the event provenance. Also record `scenario_data_mode` (`live`, `sample`) and `event_origin` (`visitor`, `staff_rehearsal`, `automated_test`). A real visitor interacting with a sample case creates live engagement events with sample scenario data. Invented scenario records remain sample events and never enter the live engagement funnel or represent real HR activity. Staff rehearsals and automated runs are test events. This separation allows real engagement to be measured without promoting example HR records into real business data.

Never put audio, transcripts, contact details, names or free-form HR content in aggregate events. Store consent/contact independently under appropriate access control. Use bounded enumerated reasons and topic IDs, not raw provider errors containing prompts.

| Event | Exact trigger | Extra bounded fields |
|---|---|---|
| `demo_started` | Accepted explicit start, once per visit | scenario if already selected |
| `scenario_selected` | Visitor confirms workflow | scenario enum |
| `case_changed` | Accepted meaningful input change | field ID / change ordinal, no free text |
| `first_value_visible` | First useful output committed and visibly rendered | elapsed since start; result revision |
| `result_visible` | Deterministic result rendered after final input | duration since final input; revision; save-independent |
| `insight_explored` | Visitor intentionally changes metric/period or opens evidence | metric/period/evidence ID |
| `demo_completed` | Required case output and linked insight have been shown | elapsed since start |
| `demo_failed` / `demo_timeout` | User-visible failure/timeout | bounded stage and reason |
| `session_reset` | Manual/idle reset accepted | reason; last stage |
| `save_succeeded` / `save_failed` | Persistence attempt returns | attempt number; stage, never substitute for visibility |
| `expert_handoff` | Staff confirms actual handoff | protected reference ID only if authorized |
| `qualified_next_step_agreed` | Staff confirms qualification, consent, owner and action | protected record reference; no contact fields |

The `/demo` local subset described above is implemented; remote persistence, qualified-next-step records, error/reset-reason reporting and event-day aggregation below are not.

Implementation semantics: unique event IDs and server uniqueness for retry idempotency; accepted double taps produce one transition/event; retries reuse the logical milestone identity and do not add completions. A reset creates a new anonymous session, aborts pending old work, and cannot attribute late events to the next visitor. Preserve revision identity for meaningful case changes. Separate network receipt timestamp from event occurrence time. Define retention and access with the operator before adding storage.

Record actual visibility after the UI commits (and, for timing, its next rendered frame), not on a successful save or AI completion callback. Establish and document clock/timing method. Mark rehearsals and automated runs, then exclude them from event-day conversion. Existing quiz records have no complete implementation of these new fields/events; do not retroactively label them measured buyer funnel data.

## Decision at rehearsal end

Record what passed, raw timing ranges, critical failures, and the smallest next revision. Fix any truth/privacy/reset failure before use. If product understanding or useful outcome misses the proposed gate, revise that step and retest with fresh participants. Do not present the strategy as validated because build/unit tests pass.

Operator words and exact sample metric terminology: `BOOTH-SCRIPT.md`. “Awaiting availability clarification” is distinct from “interview not booked”; count understanding must identify the metric. Human cells stay blank until real observed explain-back, scores and interventions exist.
