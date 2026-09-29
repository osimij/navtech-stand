# Navi / Нави

Original companion requested by the user for the NavTech exhibition experience.

- Asset: `public/mascot/navi.png`, 1536 × 1024, RGBA PNG; six 512 × 512 cells.
- Tool/mode: built-in image generation, generation (not an edit), one call.
- Frames, row-major: neutral, wave, curious, celebrate, blink, reassuring.
- The mascot is supplemental artwork, not a NavTech logo or a claim of live conversational AI.
- Interactions: tap/keyboard greeting, pointer tilt, local camera motion wave/tilt, neutral answer acknowledgment, confirmed-result celebration, reassuring error state.
- Camera frames stay in memory on the device; no identity recognition, image upload, microphone capture or gesture classification.

## Final generation prompt

Use case: stylized-concept
Asset type: production PNG mascot sprite sheet for an adult technology-forum exhibition web app, displayed as CSS sprite frames at 80–180px.
Primary request: ONE precise 3-column by 2-row sprite sheet, landscape canvas ideally 1536x1024 pixels, six equal 512x512 square cells. There are exactly six poses of the SAME original tasteful minimal friendly 3D companion. Genuine transparent background with alpha, no colored or checkered background.
Subject: small smooth porcelain/cloud-white rounded pebble body, subtle pale sky-blue underside, two large expressive dark navy oval eyes, a tiny simple mouth and two tiny rounded arms. No feet needed. Warm and intelligent, polished and restrained, not toyish. Soft realistic studio shading and subtle self-shadow only.
Composition: Every character centered in its own cell with generous transparent padding on ALL sides. Exact matching character body scale and matching body-center position within each cell. Clean easily readable silhouettes. Whole character including arms wholly inside its cell, never overlap. Keep consistent face, proportions, materials, and lighting in all six poses.
Pose order, left to right, top then bottom:
TOP LEFT: neutral front view with gentle smile.
TOP CENTER: greeting, its right arm raised in a small wave, bright eyes.
TOP RIGHT: attentive and curious, slight head tilt with one arm by its chin.
BOTTOM LEFT: delighted celebration, both arms raised and happy eyes.
BOTTOM CENTER: same as neutral front view, eyes closed in a natural blink.
BOTTOM RIGHT: sympathetic soft expression with slightly lowered brows, calm and reassuring, not sad.
Constraints: only the six characters on real transparency. No text, logos, letters, numbers, watermarks, borders, frames, grid lines, labels, floor plane, ground shadow, scene or background. No robot visor, antenna, OpenAI logo, glowing orb, accessories or extra objects. Identical character preserved across all six cells.

## Update: independent eyes and touch reactions

Previous production asset: `public/mascot/navi-layers.png` (1536×1024 RGBA), edited once with the built-in image-generation tool. Original asset retained for provenance. Runtime clips the generated iris and eyelid pieces independently, using measured bounds rather than assuming perfect generator alignment.

Top-row cells are neutral, wave and celebration bodies with empty sclera. Bottom-row cells contain two pupil pieces, two blink lids, and a spare mouth. Neutral/wave eye centers are (182.5,260) and (331.5,260); celebration centers (178,260), (326,260). Iris crop rectangles in the whole atlas: (117,699,76,98), (326,699,76,98). Blink rectangles: (626,684,108,133), (804,684,108,133). Rendered iris46×59 and lids70×90 in a512px body coordinate system. No generated face detail is recreated as CSS drawing.

### Final edit prompt

Use case: precise-object-edit
Asset type: production separated-layer PNG atlas for a CSS animated mascot with eyes that move independently.
Input image: edit target and character identity reference. Preserve this original Navi character: porcelain-white smooth rounded pebble body, subtle sky-blue underside, tiny rounded arms, restrained glossy navy eyes, soft studio self-shading, warmth and intelligence appropriate to adults at a technology forum. Slightly smaller dark eye pieces than the reference for a more adult expression.
Primary request: transform the supplied six-pose sheet into ONE precisely aligned separated-layer atlas at 1536x1024 pixels, THREE COLUMNS by TWO ROWS, each cell exactly 512x512 pixels. Genuine transparent alpha background everywhere outside each specified object. No background glow.
Coordinate system: all coordinates below are LOCAL TO EACH 512x512 CELL. All top-row body variants have exactly the same body/head scale and position: body center (256,270), head upright, face straight-on. Eye openings fixed at left center (210,215) and right center (306,215), each white oval opening approximately 58x80px. Generous transparent padding. All poses and parts wholly within their cell.
TOP LEFT cell: original neutral complete white/blue body, small navy eyebrows and gentle tiny smiling mouth, arms down. Eyes must be TWO EMPTY WHITE OVAL SCLERA/recesses, subtle edge definition, absolutely NO dark pupils or irises. These blank eyes will receive separate pupil overlays.
TOP MIDDLE cell: same exactly aligned body and same facial geometry, greeting with right arm raised in small wave; identical TWO EMPTY WHITE OVAL SCLERA at the same fixed positions, no pupils/irises.
TOP RIGHT cell: same exactly aligned body and head, both arms raised for celebration. Small delighted smile, but identical OPEN EMPTY WHITE OVAL SCLERA at the same fixed positions, no pupils/irises, no closed happy eyes.
BOTTOM LEFT cell: ONLY TWO separate dark navy glossy iris+pupil pieces, left centered (210,215), right centered (306,215), each approximately 34x48px. Rich dark navy with restrained soft blue reflection and small white catchlight, matching reference eye material. NO white sclera, eye outline, eyelid, eyebrow, body or other object. Every pixel outside these two tiny iris pieces is TRANSPARENT. This entire cell must overlay any top cell directly with perfect alignment and allow both irises to move a few pixels within the white openings.
BOTTOM MIDDLE cell: ONLY TWO closed blink eyelid pieces at exactly the same fixed eye centers (210,215) and (306,215), each approximately 58x80px in the same white porcelain body material with a subtle natural dark closed-eye curve. These cover the white sclera completely during a blink. NO pupils, irises, eyebrows, body or other objects. All surrounding pixels TRANSPARENT.
BOTTOM RIGHT cell: ONLY ONE tiny soft reassuring curved smile mouth centered at (256,280), no other objects, transparent surroundings.
Critical constraints: exact layer separation and alignment. Top-row bodies contain NO dark irises/pupils. Bottom row contains ONLY isolated face component overlays at natural tiny face scale, never enlarged. Preserve character identity, material and lighting. No text, grid lines, labels, borders, frames, numbers, watermark, logos, floor plane, cast shadows outside objects, backdrop, accessories, antennas or visor. No gray background: actual alpha transparency.

## Update: speech and varied reactions

Current asset: `public/mascot/navi-speaking.png`, 1536×1024 RGBA. One additional image-generation edit removed the baked mouths and supplied three isolated mouth shapes. No mouth was drawn over the existing mouth. Runtime places the new mouth at body coordinate (256,315), with crop rectangles (1085,760,85,28), (1235,750,81,47), and (1374,735,107,70). Eye and eyelid pieces retain their previous measured geometry.

Live Web Audio amplitude chooses closed, softly open and open shapes at about 20 Hz, with smoothing and silence thresholds. A measured clip envelope is the fallback. Pause, end, buffering, error and reduced motion close the mouth. Greeting, answer, result and idle reactions use varied pools; idle movement waits while an interaction is active. The result pose expires after one reaction.

### Final mouth edit prompt

Use case: precise-object-edit
Asset type: production transparent layered mascot sprite atlas for independent speech mouth animation.
Input image role: exact edit target. Preserve its 1536x1024 pixel canvas and 3-column by 2-row arrangement of 512x512 cells.
Primary request: make ONLY TWO targeted changes. First REMOVE the baked-in mouth from each of the THREE top-row white/blue mascot bodies, seamlessly restoring matching smooth porcelain skin where each mouth was. Second REPLACE the single isolated mouth in the bottom-right cell with THREE isolated mouth sprite pieces.
Preserve everything else: all three body's outlines, poses, shape, scale, position, tiny arms, white material, blue underside, shading, eyebrows and EMPTY white eye sclera. Keep the bottom-left pair of navy iris/pupil pieces and bottom-middle pair of closed white eyelids unchanged in geometry, size, position and appearance. Preserve genuine alpha transparency around every existing and new object, no opaque background.
Critical alignment invariants: top neutral/wave local eye centers remain approximately (182.5,260) and (331.5,260); top celebration local eye centers remain approximately (178,260) and (326,260). Do not move these. All top bodies must have blank porcelain skin without ANY mouth at local position around (256,315); no smile, line, dimple or dark detail there.
Bottom-right cell ONLY: three distinct mouth sprites placed horizontally well apart. Coordinates are LOCAL to this 512x512 bottom-right cell:
1. Center (100,260): a small navy CLOSED gentle curved smile, approximately 72x18 pixels.
2. Center (256,260): a small SOFTLY OPEN speaking mouth, navy outline and dark interior with a subtle red tongue, approximately 72x35 pixels.
3. Center (412,260): a wider OPEN mouth for a vowel sound, navy outline and dark interior with a subtle red tongue, approximately 72x64 pixels.
Match the original Navi mouth's tasteful tiny rounded 3D look and restrained material. Each mouth is completely separate on genuine alpha transparency. No white skin rectangle or patch around mouths. No extra facial pieces, teeth, objects, labels, text, grid lines, borders, backdrop, floor or shadows outside the pieces.
Output ONE atlas only. Maintain original image dimensions. Change only the removed top mouths and the three bottom-right mouth sprites; everything else stays fixed.

## Play and conversation

The welcome gives Navi a dedicated play area. Riddle, shared story and word-association actions trigger different physical reactions (ponder, swoop, shuffle), while sparse idle gestures avoid repeating immediately. Gaze and amplitude-driven mouth animation remain independent. Creative conversation can continue while the visitor moves through the touch game. Reduced motion still disables animation.

## Update 29 September: one living 3D companion

The visitor journey (`/`) no longer places a separate sprite on each screen. Navi is one real-time 3D character, rebuilt as geometry from the approved sheet above (`public/mascot/navi.png`): gumdrop porcelain body widest in its lower third, sky-blue underside, glossy navy eyes with twin catchlights, fine arched brows, a small mouth and mitten arms. No new image generation was used; the sprite atlas remains the fallback and the `/demo` and `/stage` mascot.

- `lib/navi-model.ts` (three.js, loaded lazily): lathe body; eyes built like a character-animation eye: a procedural eyeball (pupil that dilates with interest, radial iris fibres, collarette, lower blue glow, dark limbal ring, shaded sclera) with the iris set behind a clear cornea for parallax; a wet tear film over the whole visible eye reflecting a small studio built only for the eyes (a graded rounded softbox up right where the key light is, a fill strip low left, a dim room), with Fresnel falloff, a rounder virtual curvature so reflections stay compact, and dimming under the upper lid, so catchlights are crisp photographed shapes that hold their place while the iris moves beneath them; upper and lower lids with a fine lash line that blink, wink and follow the gaze down, a lid contact shadow on the ball and soft socket shading on the skin; closed-eye arcs for joy, brows and a live mouth strip laid onto the real body surface, teardrop arms on shoulder pivots, soft contact shadow, studio environment light. The rim light samples the page's `.ambient-glow` colour, so on a result Navi is lit by the role's hue.
- `lib/navi-rig.ts` (pure, tested): damped springs per channel with stability-safe substeps, moods, a gesture library (wave, hello, goodbye, nod, pleased, pop, delight, wink, boop, shy, curious, peek, lean, stretch, celebrate with one full turn, rise, bow, ponder, swoop, shuffle, takeoff, land), breathing and hovering, blinks (occasionally double, sometimes with a large shift of gaze), fixational eye movement, eyes leading and the body following, speech driven by actual output level.
- `lib/navi-direction.ts` (pure, tested): hop arcs and easing between seats, screen-point gaze, saccadic reading fixations.
- `app/navi.tsx`: `NaviStage` draws the one character on a fixed layer; each screen renders a `NaviSeat` (in-flow, focusable tap target). Changing seats is a hop: a crouch, an arc, a landing. Navi reads each new question line by line and then looks at the answers, watches the answer or field under the pointer or focus, looks at the chosen answer, follows the local face position when the camera is on, glances around when idle and otherwise keeps eye contact. The first question waits a beat so Navi arrives before it rises in. Arriving on the result, Navi lands and celebrates; returning to the welcome for a new visitor, it waves. The `MascotHandle` contract (reset, play, notice, trackFace, reactTo, speak) is unchanged.
- Reduced motion: a still, finished expression that snaps to each seat, no gaze or gestures. Without WebGL (or on context loss) seats render the original sprite mascot with its full behaviour.

## Update 29 September: the toqi

At the user's request, the 3D Navi wears a Tajik toqi: the four-cornered black-and-white skullcap of northern Tajikistan (toqii chusti). Reference: a Tajik tubeteika on Wikimedia Commons (`Tajik_Tubeteika-2.jpg`) and the chusti pattern: four quilted panels, a white bodom (almond) on each, and a band of arches over small peppers (kalampir).

- `lib/navi-toqi.ts` builds it procedurally, fitted to the body profile. The band hugs the head at `TOQI_RIM` (above the highest brow) and squares off as it rises. Four panels, flat faces front, back and sides, meet at a softly domed apex. A rolled hem finishes the edge.
- The embroidery is drawn once in canvas: raised chain stitch and French knots in warm silk white on black cotton with fine quilting channels. Each panel carries a bodom drawn as a tapered brush stroke (round belly, curled tail) with a sprig of loops, a zigzag and a small flower; the four panels form the traditional pinwheel. The band has a hem line, four arches per face with three peppers beneath each, and a knot where the arches meet.
- Budget for the booth's low-end display: one mesh (about 4.8k triangles), one material and two 512px textures (colour; relief and roughness packed in R and G). No extra render passes or environment maps.
- It is parented to the body, so it hops, squashes, bows and spins with Navi. The porcelain darkens softly just under the rim so the cap sits on the head. The page's rim light touches only its outermost edge, so the cloth stays black on a role-coloured result.
- The sprite fallback (no WebGL) and the historical `/demo` and `/stage` sprite do not wear it.

## Update 29 September: smooth on the booth's low-power panel

The booth screen is a 32" Android touch panel (model 320DSM-AT) running Chrome, with a weak mobile GPU and little memory. On it Navi jumped at start-up and moved unevenly. Causes and fixes:

- The spring that keeps Navi on its seat was integrated numerically and became unstable once frames took 50 ms or more (start-up, a busy screen change), so Navi jumped around its seat or flew off. It is now an exact critically damped spring (`follow` in `lib/navi-direction.ts`), smooth at any frame rate. A hop advances at most 1/15 s per frame, so a hitch slows the arc a touch instead of teleporting Navi along it, and the rig keeps real time down to 10 fps.
- Navi is built after the first screen has its fonts and a quiet moment, and it appears only once every shader is linked (`warm()`, parallel compilation where Chrome allows) and the geometry is uploaded. The first visible frames no longer stall on compilation. A software-only WebGL fails on purpose and falls back to the sprite.
- Rendering tiers (`lib/navi-quality.ts`). **Lite** applies automatically on Android, on 4 or fewer cores or 4 GB or less of memory, and on mobile or software GPUs (Mali, Adreno, PowerVR and similar). It keeps the same character and look but drops the clear-coat layer (the base is made a little glossier; the sheen, the eyes' studio and the toqi stay), uses 128px light maps instead of 256px, and draws Navi at no more than 700px instead of up to 1200px. Full stays as it was on capable machines.
- A frame governor watches frame intervals. If frames keep missing, it steps Navi's resolution down (×0.85, ×0.72, ×0.6), then draws the character every other frame (a steady 30 fps; hops still move at the display rate). After a clean stretch it steps back up; a step up that fails is not tried again. A full-tier device that struggles switches to lite, with the lite shaders linked in the background first. Navi is not drawn at all while hidden.
- Page effects in lite: the edge glow holds still (its slow drift repainted the whole screen every frame); entrances rise without a blur filter; sheets dim the page instead of blurring it. On every tier, the glow's soft white centre is a box shadow painted once, where a blur filter was recomputed every frame. Face detection runs 5 times a second instead of 8. The idle countdown no longer re-renders the page every second.
- Operator switches, typed once in the device's address bar and remembered there: `?navi=lite`, `?navi=full` or `?navi=auto` (the default, which clears the choice); `?perf=1` shows a small readout (tier, page fps, Navi draws per second, resolution scale, buffer size, page size and display scale, Chrome version), and `?perf=0` hides it.

