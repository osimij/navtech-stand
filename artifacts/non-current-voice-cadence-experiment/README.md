# Non-current voice cadence experiment

This experiment was performed after mistakenly treating an older slow-voice user message as the current delegated task. It was outside the active no-new-paid-calls rehearsal scope. Exactly two synthetic Realtime sessions were started; both finished and closed. No visitor microphone or database writes were involved. No further provider calls were made.

The runtime changes have been selectively reversed to the pre-turn code using the actual edit history, not Git HEAD. The patch is baseline → experimental code; archived source files and the manual probe describe NON-CURRENT behavior. Do not run the script automatically.

Raw outputs remain in ../quiz-voice-continuity-20260922.json and ../quiz-voice-continuity-short-20260922.json. They are not validation of the restored app. The first experimental run had 1.166–1.907 s screen-to-first-signal and 3.103 s cold greeting; the tighter-prompt experiment had 1.178–2.045 s screen-to-first-signal and 2.891 s cold greeting. These are provider/relay measurements with simulated playback, not browser speaker latency or native-language quality.

Archived source/script files use `.txt` suffixes so they cannot enter app compilation or an automatic test discovery run. The two probe outputs were preserved unchanged.
