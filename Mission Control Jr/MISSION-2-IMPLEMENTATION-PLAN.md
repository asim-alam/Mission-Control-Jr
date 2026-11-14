# Mission 2 implementation plan — Tracks in the Dust

This combines the supplied **Tracks in the Dust** proposal with **The Ground Remembers**. Mission 1 remains the default page; the campaign stays independent. This is a fictional future Mars exercise inspired by the agency sources linked in `MISSION-2-THE-GROUND-REMEMBERS.md`.

## Selected design

- **Title / continuity:** Tracks in the Dust, Sol 16, after the prepared Mission 1 ending. Jin pilots Rover Two; Amara accompanies him. Elena and Luca provide local radio support.
- **Battery:** Use an identified spare charged during recovery. The habitat retains the battery used in Mission 1; no new power emergency or instant charging.
- **Departure:** Collect and install the spare pack, correct a retaining pin and dusty lens, and check the field kit, suits, and radio.
- **Plan:** On boarding, choose a direct, north-wash, or rim corridor and review its terrain, distance, and projected home reserves before driving.
- **Drive:** Manual acceleration, steering, braking, reverse, parking brake, follow/driver-eye views, visible seated crew, map, breadcrumbs, heading, speed, slope, slip, eco mode, and reserve projection.
- **Complication:** Visible suspect ground near Kestrel Ridge. Players may inspect and avoid it; entry can cause recoverable slip. Continued forcing or depleted reserves suspends training, with an explicitly labeled checkpoint retry.
- **Science:** Park, exit as Jin, photograph both rock units and a scaled close view, describe the contact, optionally collect a labeled fragment if reserves permit. No automatic proof of water or life.
- **Return:** Drive back with the revised map. Moderate haze tests instruments without repeating the first storm. Account for both field crew at Meridian.
- **Assessment:** Four outcomes, transparent competency evidence, actual route replay, and actionable feedback. Science is not required for a prudent abort. Declining an optional sample does not reduce completion quality.

## Implementation sequence

1. Implement/test pure terrain, vehicle dynamics, resource forecasting, episode actions, ending gates, and checkpoint logic.
2. Generate/validate a crewed rover derivative, layered outcrop, scale marker, sample GLBs, and mission-specific Kokoro voices. Preserve original assets.
3. Build the connected Three.js scene and responsive accessible HUD, map/planning, readiness, vehicle/foot input, science and debrief.
4. Integrate episode links, a separate Vite entry, run instructions, model generation, and downloadable project packaging.
5. Run existing and new tests, production build, and browser checks covering actual driving, views, pause, science, return, retry, and existing page smoke tests. Fix observed issues before delivery.

## MVP scope and exclusions

Target a practiced **5–8 minute** route; learning/exploration can take longer. Physics and 0–100 resource units are game simplifications. No forced entrapment, full suspension solver, global GPS claim, instant Earth response, racing boost, unsupported guaranteed walk-back, or overnight expedition. All new speech uses its own audio registry with single-speaker playback; missing audio leaves captions functional.

## Delivery

Playable `/mission2.html`, source, generated GLBs/audio, full tests/build results, Windows terminal instructions, walkthrough, and a new ZIP excluding dependencies and temporary work. New episode data uses a separate versioned local-storage key; storage failure cannot prevent play.

## Implemented scope

The separate episode, controller, authored terrain, three routes, map/breadcrumbs,
readiness faults, three rover routes, two rover views, on-foot observation camera, image
thumbnails, optional sample, resource forecasts, four endings, checkpoint practice,
local completion record, and competency debrief are implemented. Four original
GLBs and nineteen episode-specific Kokoro clips are bundled. Mission 1's prepared
ending now offers continuation; the gallery includes all seventeen model downloads.

The practiced traverse uses corridors of approximately 164–235 metres, rather than
the second proposal's 260-metre straight-line destination. Physics are kinematic;
the crewed rover is unpressurized, both suit reserves use the same simplified rate,
and sample work advances eighteen simulated seconds. A detailed cabin, overnight
operations, literal geological instrumentation, and guaranteed walk-back rescue are
outside this prototype. A safe return never invents uncompleted science.

The movement usability fix adds an explicit **Drive Rover Two · board (E)** action,
a visible **Release brake · P** button, on-foot status, and a throttle warning while
parked. Both W and Up Arrow were tested in the browser. Menu focus is cleared before
driving input; Escape is owned once to avoid pausing and immediately unpausing.

Navigation credit scales with up to 100 expedition metres, so a short apron abort
does not receive the same demonstrated-driving credit as the complete traverse.
Ground-reassessment credit requires a recorded observation. All these thresholds
remain transparent game rules, not agency standards.
