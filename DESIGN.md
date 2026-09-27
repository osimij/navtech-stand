# NavTech booth: current design direction

The latest user request is an OpenAI-inspired treatment: gradients, less visual weight, and an experience understood at first glance. The result retains NavTech's original mark and product typography while adopting a light, open canvas with a broad blue-to-peach atmospheric background. This supersedes the earlier dark stage and dot-column composition.

## References and interpretation

[OpenAI's public brand guide](https://openai.com/brand/) describes open space, clear hierarchy, and typography combining precision with warmth. The [ChatGPT overview](https://chatgpt.com/overview/) demonstrates a short proposition followed by an immediate entry action. The public guide does not prescribe a gradient recipe; the specific background here is an interpretation of the user's reference. No OpenAI logos, wordmarks, proprietary fonts, or partnership claims are used.

NavTech source references remain the original mark in `public/brand/navtech-logo.png` and the local Speech Kit product foundations at `/Users/user/Documents/ChatGPT/Speech Kit/app/globals.css`.

## Composition

One centered opening: “В чём ваша сила?”, a sentence explaining five questions and a technology-interest profile, one black “Начать игру” button, and an approximate one-minute duration. HR Agent and Prism have brief role descriptions below. The gradient is static, broad and behind the content; no glowing objects, decorative dashboard, gradient lettering, floating cards or animated showcase.

The game, result, and contact form use the same single-column working width. Answers advance with one tap and a brief lock against accidental double taps; back remains available. Scoring is disclosed on demand. Optional company is disclosed on demand. Contact consent is explicit and unchecked. New sessions store purpose as `unspecified` rather than inventing visitor intent. Prism's full analytics and clearly labelled sample data remain on `/screen`; the visitor page has a quiet link to them.

Black text and controls, comfortable touch targets, soft borders and pill primary actions create the hierarchy. The full stylesheet was consolidated instead of adding another theme override layer. Short and narrow viewports retain the primary action and readable answer rows.

## Results and exploration

The result has one takeaway, one short explanation and one product-specific demo request. Detailed scoring is disclosed; tie cases name all leading directions. The contact step visibly preselects the product named in the chosen CTA and allows changes, including career interest. Explicit consent remains unchecked. A request means team follow-up, not automated delivery.

Prism has three touch tabs: profiles, product interest and journey. Each opens one large interactive chart plus a short explanation. Profile selection highlights its share rather than pretending to cross-filter unrelated aggregates. Product shares use contacts as the denominator; journey percentages explicitly name their denominator. These are counts of sessions and results, not unique people. All stored data is included; hourly detail labels the latest nonempty buckets accurately. Real empty data remains empty, with an explicit example-data switch.

## Voice and camera

The user subsequently requested a mascot that interacts with the visitor. Navi is an original porcelain-white companion with a pale blue underside. Its updated transparent atlas separates the body, pupils, eyelids and three mouth shapes. The mouth follows actual audio amplitude and rests during silence. It sits above the welcome title and becomes a small companion beside HR Agent during the game. It does not replace NavTech's mark. No speech bubble, decorative card, or additional main action is introduced.

Navi responds to touch, pointer and keyboard activation throughout the game. Its pupils follow screen coordinates independently; touches take priority for roughly two seconds. A brief answer reaction moves into free space beside the chosen row on wide screens; on portrait screens it stays in the header to avoid covering controls. The camera now runs an explicitly requested local face-position detector: MediaPipe Tasks Vision 1.0.1 in a Worker with self-hosted WASM/model. It locates a nearby face, does not identify people, and never uploads or stores frames. Gaze continues during the game but pauses for settings and hidden tabs. Camera motion remains a fallback for welcome waves. Visual reactions do not shorten the 60-second invitation cooldown.

All quiz choices receive the same acknowledgment; result and saved-contact screens celebrate only after successful API responses. Errors take expression priority. Reduced-motion preferences disable tracking, blink and animated gestures while retaining static expression feedback. The companion does not claim to listen or speak while recordings are unavailable. Asset provenance is in `MASCOT.md`.

Camera and speech setup live in one labelled settings dialog, with a visible speaker control in the header. Video remains local; no microphone or camera-based personality recognition is used. Stationary face presence can now trigger an invitation; sustained absence re-arms the next arrival, with a 60-second minimum interval. Previewing does not consume that interval. Tapping Navi plays an invitation without requiring camera setup.

The macOS preview voices were rejected as robotic and removed. Six new neural RU/EN recordings use native Microsoft Dmitry and Andrew voices; settings label them trial recordings pending the user's listening judgment. They are generated once and served locally. The separate paid generation account remains unused. No browser/system-speech fallback. See VOICE-BRIEF.md.

Reaction pools vary acknowledgment, greeting and idle gestures without immediate repeats. Idle motion has 8.5–15-second pauses and cannot interrupt an active greeting. Result celebration is brief, after which taps work normally. Some answer reactions travel into a safe gutter; others stay local. Reduced motion keeps expressions static and disables gaze, travel, blinking and audio-mouth movement.

## Validation boundary

Source review, type checking, page rendering and production build can run. Direct browser inspection remains blocked by the browser tool's unavailable policy check. Do not claim visual browser comparison, touch testing, or physical camera/audio rehearsal. Design rationale is a judgment, not a measured claim about attraction or conversion.

## Current voice and evidence refinement

Navi has a bounded playground, optional creative conversation starters and varied contextual gestures. The game stays the primary action. The active voice is GPT-Realtime-2.1, with Russian/English selection; the earlier recording notes above are historical. Prism replaces individual-profile prose with aggregate counts, visible data provenance and a disclosure explaining the denominator and limits. See BOOTH-DIRECTION.md for the proposed separate HR proof flow.
