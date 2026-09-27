# Immediate-result checkpoint

22 September 2026 · local only · http://localhost:5173/

## Implemented

- Quiz start and final result no longer wait for database requests. The final answer renders the locally computed result immediately; voice does not gate it.
- A separate persistence controller reuses credentials, deduplicates pending calls, validates canonical saved answers, retries explicitly and aborts on visitor reset. A save failure leaves the result visible with a retry action.
- The result includes a bounded, practical three-step suggestion based on the existing deterministic profile/tie. Supporting scoring and actual-answer evidence stay in a disclosure. This is not an AI-generated expert plan or validated hiring assessment.
- One welcome headline and start action; removed creative-action button row and canned quiz hints. Optional conversational creativity remains in the voice integration.
- Optional follow-up offers discussion of one team process. Contact save waits for completed-session persistence, preserves fields on failure and never claims a meeting is booked. Consent remains unchecked by default. Old visitor completion cannot update the next visitor.
- Voice captions no longer displace the main result. Correct initial success countdown is 20 seconds.

## Verification

- TypeScript: passed. Targeted ESLint for page, advice and persistence modules: passed.
- Build: passed (Vinext still reports some app routes as statically unclassified; no build failure).
- 37 regression units passed: session persistence, all 1,024 quiz combinations, game context/continuous voice session, PCM playback/interrupt handling, previous voice client and engagement behavior. Simulated voice tests create no paid sessions.
- Browser: completed all five answers with microphone off. Paused the known local development server before the final answer. Result and practical advice appeared while the request could not complete. After the 12-second timeout, the result stayed visible with an explicit save-retry action. Resumed the server, retried, and observed the saved result count increase exactly once.
- Browser → API → local database: invalid contact produced an error; correcting synthetic contact succeeded. Confirmed exact session, `[0,0,0,0,0]`, Data profile, Prism topic and consent version in the saved row. Removed only the two checkpoint sessions and synthetic lead afterward; prior state restored to 8 starts, 3 completions, 0 leads.
- Inline browser screenshots captured the visible result, HR-Agent public onboarding panel and Prism quarter/conversion panel. The browser API did not supply standalone image paths; no filesystem screenshot artifact is claimed.

The failure test establishes that rendering is independent of saving; it is not a precise render-time benchmark. No ten-person human rehearsal, new voice audition, camera evaluation or measured conversion study was performed at this checkpoint. Reload still loses an unsaved in-memory result. No production deployment was made.

## Reference inspection and planning

Exercised HR-Agent and Prism mini demos at https://navtech.tj/#products without submitting a contact form. Their public showcase source confirms authored candidate batches, period data and animated sample stories. Detailed observed behavior and limitations are in `BOOTH-STRATEGY.md`. Employee FAQ readiness is user-confirmed, but an interactive FAQ answer was not exposed in the tested HR mini-demo controls.

`BOOTH-STRATEGY.md` contains the buyer-focused case-to-insight recommendation, two-staff operation, conversion definition and cited evidence. `BOOTH-REHEARSAL.md` contains manual scorecards, denominators, proposed gates and a proposed event schema. These are plans, not implemented instrumentation or validated performance.

## Deliberately deferred at the requested checkpoint

No major new HR journey, text-model endpoint, production HR-Agent/Prism connection, generated pilot brief, automated outreach or new analytics event store. The parent task owns the next buyer-oriented implementation decision after reviewing the actual product references and agreeing the approved cases/integration access.
