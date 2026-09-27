# Local full-flow verification · 23 September 2026

Story: the Russian professional-audience HR Agent demonstration proceeds from eight situational choices to immediate role matches, optional consent-based product contact and anonymous Prism aggregates.

## Outcome

Local development server restarted (old server had no listener) and left running at http://localhost:5173/; Prism at http://localhost:5173/screen. Final HTTP 200 and listeners on 5173/5174 confirmed. No product code changes, deployment, new testing infrastructure or provider sessions.

## Observed browser checks

- Separate test tabs used; existing visitor tabs were not operated or reset.
- Invitation → all eight questions → immediate three-role result passed. Back preserved the earlier answer; changing it continued normally. Four question cards and Back fit the available approximately 1280×720 viewport.
- Click and Enter changed selected roles and displayed matching work, supporting answers, professional tasks and team value. Readable result hierarchy; no beginner training/first-project blocks. A revised answer returned immediately to the result with a three-way tie explanation.
- Revision updated the same database ID and retained its first completion time; no extra start/completion. All 32 answer buckets and eight role counts matched the expected original and revised contributions, including the third-place tie rule.
- Optional contact defaulted to both products. Dropdown contained HR Agent, Prism and both products only. Submission was disabled without consent. Invalid contact produced the Russian format error. Exact tagged synthetic contact was saved with consent version and correct session linkage; no outreach occurs in this endpoint.
- Success automatically returned to the invitation after its 20-second countdown. Separate fresh start/manual End also reset to invitation.
- Settings were Russian, without a language selector; microphone and camera were off. Fullscreen entry and exit worked.
- Prism displayed the synthetic completion, revised answer counts with denominator four, role counts, small-cohort label, and four historical completions separately. After cleanup it returned to the real denominator three.
- Browser error logs were empty for both tested tabs. Server responses were healthy; deliberate validation/access failures returned expected 400/401/403 responses. Existing Vinext dependency-optimization warning remains.

## Automated checks

- 66 existing tests passed: quiz/scoring, career statistics, session synchronization, Russian live context, mocked voice/PCM, camera/face lifecycle, mascot gaze/motion, engagement and invitations.
- Existing API integration test passed (idempotency, revision, invalid answers/token/origin, consent, anonymous stats and route health). It cleaned its own exact synthetic ID.
- TypeScript passed. Focused lint passed with zero errors and two warnings: existing camera cleanup-ref and standard shared-logo img advisory.
- Production build passed; existing Vinext static route-classification notice remains.
- Slow/failed save, retry, serialization and reset cancellation verified through existing synchronization tests; result rendering is local and precedes persistence in the page. No new browser network-failure harness was introduced, so delayed/failing-save display was not separately fault-injected in this browser run.

## Data preservation

Fresh baseline: 15 sessions, zero leads; six current starts/three completions and nine historical starts/four completions. Exact owned UI IDs are recorded in synthetic-ui.json and synthetic-reset.json; successful contact also has the unique QA tag and example.invalid address. Only those IDs and the exact tagged lead were deleted. Final full-row hashes of all baseline records matched; no missing/changed records and no unrelated new records. Final totals equal baseline. No temporary interception or application instrumentation was used.

## Remaining live checks

Actual microphone speech, provider latency/audio quality, camera face detection and physical touchscreen/booth acoustics require an explicit user-started try. No microphone/camera input or paid voice session was initiated. The 120-second in-game idle warning was reviewed in code but not waited through; actual 20-second success idle reset and manual reset were observed. No additional device-size matrix was run.

Normal invitation tab retained with microphone and camera off. Work finished.
