# Original quiz: ten browser result-rendering trials

22 September 2026 (Dushanbe). Predeclared 4 normal, 3 delayed, 3 rejected completion saves. All ten original `/` quiz runs passed the unchanged ≤500 ms result-visibility gate: **22.1–29.4 ms**. Four deterministic profiles were checked against their displayed heading and three advice steps.

`runs.json` preserves DOM-observed timestamps, exact synthetic session IDs, save observations and database checks. It is an explicitly transcribed CUA read, not a claimed downloaded browser journal. `temporary-instrumentation.patch` documents the exact temporary measurement and server fault injection; both app files were restored byte-for-byte to their pre-rehearsal backups. No fault injection or QA display remains active.

Input clock: actual final button click event.timeStamp. Visible clock: performance.now after two animation frames after React commit, visible document, heading in viewport and visible ancestors, three advice steps in the DOM. This is DOM-after-render visibility, not physical display photometry, full-chart-animation completion or proof of comprehension. Viewport was 1809×1354.

The 2.5-second delay and HTTP 503 were applied to the REAL authenticated completion PATCH, not a fabricated dependency. Delayed results were observed while saving, then saved. Failed saves left the correct result and explicit retry visible. Three failed sessions remained incomplete in the database. No retry was performed during those failed-save measurement runs. R10 reset visibly returned to welcome; other trials used fresh page navigation.

Only the ten listed synthetic session records were deleted. Existing rows were compared by full-row hashes before/after and preserved exactly: **8 starts / 3 completions / 0 leads**. No contacts, camera, microphone or model calls were used for these rendering trials. The separate voice experiment is archived as non-current evidence elsewhere.

This establishes the local technical rendering gate for `/` under these conditions only. The `/demo` route has no save dependency and was NOT subjected to fake save failures; its 23–29 ms observations remain separate. Ten-person comprehension, native voice review, venue noise, actual booth hardware and conversion gates remain unobserved.

| Run | Condition | Final input ms | Visible result ms | Delta ms | Profile correct | Save |
|---|---|---:|---:|---:|---|---|
| R01 | normal | 37265.000 | 37287.100 | 22.1 | data: yes | saved |
| R02 | normal | 3258.900 | 3286.500 | 27.6 | ai: yes | saved |
| R03 | normal | 3175.700 | 3205.100 | 29.4 | product: yes | saved |
| R04 | normal | 3087.500 | 3113.600 | 26.1 | systems: yes | saved |
| R05 | delay | 2946.900 | 2975.600 | 28.7 | data: yes | saved |
| R06 | delay | 3165.200 | 3190.500 | 25.3 | ai: yes | saved |
| R07 | delay | 3324.600 | 3351.000 | 26.4 | product: yes | saved |
| R08 | failure | 3074.200 | 3101.500 | 27.3 | systems: yes | error |
| R09 | failure | 3134.000 | 3162.800 | 28.8 | data: yes | error |
| R10 | failure | 3303.300 | 3332.300 | 29.0 | ai: yes | error |

Input and visible times in this table are milliseconds relative to each document’s `performance.timeOrigin`; raw JSON includes that origin and derived UTC timestamps.
