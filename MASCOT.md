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
