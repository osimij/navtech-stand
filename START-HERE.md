# NavTech stand — macOS

## Start

1. Extract the ZIP completely to a writable folder on the stand Mac (for example, Desktop/NavTech-Stand). Do not run inside the ZIP or from a read-only USB drive.
2. Connect to the internet. Double-click **Start Navi.command**.
3. On first launch it downloads a checksum-verified Node.js 24.19.0 runtime from nodejs.org and installs the locked dependencies. Both Apple Silicon and Intel Macs are supported by the launcher. Allow several minutes and about 2 GB of free space. No Node.js installation or Codex account is required.
4. The browser opens at **http://localhost:5173/**. Keep the terminal window open. Use a current Chrome browser on the stand; choose Russian or English, then start the demonstration.
5. Open **http://localhost:5173/screen** in another browser window and move it to the second monitor. Use the page's fullscreen button.

If macOS blocks the downloaded launcher, inspect it and allow this specific file through macOS's normal Open Anyway flow. Do not disable system security. If the executable bit was lost while transferring: open Terminal, type `bash `, drag **Start Navi.command** into the window, then press Return.

To stop: press **Control+C** in the launcher terminal. To restart: double-click the launcher again. A port-in-use message means another copy is running; close that copy first.

## Included

- Complete app source, lockfile, images, fonts, mascot sprites, local face detector, tests and project documentation.
- Sienna / Eleven v3 as the default scripted voice in both Russian and English.
- The current private `.dev.vars` voice API keys and operator configuration, plus `.env`. No key entry is needed on the stand. This archive is a private operational copy, not a public distribution.
- Saved voice samples and a consistent snapshot of the existing local database. Existing activity is retained; this is not an empty analytics database.
- `NAVI-SCRIPT.md`: the approved Russian/English host script and guardrails.

Platform-specific `node_modules`, build output, development logs and Git history are excluded. The launcher installs dependencies for the receiving Mac. After setup, rerunning the same package reuses that installation.

## Voice and camera

There is no microphone in the primary booth flow. Navi speaks approved lines and responds to screen choices and taps. A browser gesture starts sound. Test speakers and volume before opening the stand. First generation of a new line needs ElevenLabs internet access; cached lines are reused. This package is **not a fully offline voice installation**.

Optional camera tracking is enabled through Booth settings. Grant camera access only if the stand has a camera and you want gaze tracking. The camera stays local; microphone access is not required. Historical `/demo` is a separate conversation experiment; use `/` for the event.

No automatic restart or kiosk OS configuration is installed. Keep the Mac powered, prevent sleep using its normal settings, and keep the browser and launcher running during the event.

## Data and operator

- Operator export: **http://localhost:5173/operator**. The existing operator PIN is retained in private `.dev.vars` / `.env`.
- Database: `.wrangler/state/`. Keep this folder when updating the app; it holds the stand's local data.
- Voice cache: `.sites-runtime/voice-lab/`. Keep it to avoid generating the same lines again.
- Before overwriting or moving a used installation, stop the launcher and make a copy of the entire extracted folder. Do not replace the database with this original snapshot after collecting event data.
- Both screens use the same Mac and local server. Another computer cannot access this loopback-only address.

## Quick Russian instructions

Распакуйте ZIP → подключите интернет → дважды нажмите **Start Navi.command** → дождитесь установки и открытия страницы. Терминал должен оставаться открытым. Выберите язык и начните демонстрацию. Для второго монитора откройте **http://localhost:5173/screen**. Остановка — **Control+C** в терминале. Ключи уже включены; архив предназначен только для вашей команды.
