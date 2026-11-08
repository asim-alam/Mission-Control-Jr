# Six-mission redesign report (8 November 2026)

This report covers the redesign of the six expansion missions for kids aged 7–12. The text is tuned for ages 7–9, and Cadet is the default level. Each mission has one hands-on 3D loop, two or more strategies that both work, real costs, visible results, mistakes you can undo, and a debrief that compares your tries. Short kid lines are the default; "More details" and "Is this real?" panels give the longer science.

## The missions

| Mission | Hands-on loop | Strategies | Main costs |
|---|---|---|---|
| Solar Shelter (`solar-shelter`) | Carry water and supplies to build a storm shelter before the particle storm arrives | Water wall, rover shelter, or a mix | Time and battery; dose shown on the meter |
| The Greenhouse Promise (`greenhouse`) | Light, water and fix leaks in the grow beds, then harvest | Even beds or focusing on a few beds | Power, water, leaks |
| Waiting for Earth (`earth-delay`) | Find the broken recycler part, ask Earth or fix it yourself while the message is in flight | Ask Earth and wait, or follow the manual | Real Mars light time, air left |
| Chasing the Sun (`lunar-sunlight`) | Tow the solar cart, put the legs down, raise the mast, open the wings and plug in | A tall mast at the near pad, or the sunny ridge | Suit air, cable length, cold hours |
| Dust Busters (`lunar-dust`) | Close the hatch, fill the airlock with air, brush, vacuum or EDS-clean each item, clean the air, then open | Brush, vacuum, or EDS mix | Power, filters, dust in the base, visor scratches |
| Over the Hill (`lunar-relay`) | Drive the rover, set up a relay at the saddle, raise the mast, aim the dish, drill cores and send the data | Relay (live data, 2 cores) or go direct (data waits, 1 core) | Battery that has to get you home, suit air, quiet minutes |

## Sourced facts and game assumptions

- **Sourced:** These values come from archived NASA datasets in `data/normalized.json`, recorded in `02-NASA-SOURCES.md` with checksums:
  - Mars and Moon light times from JPL Horizons
  - the LOLA sunlight fractions near the south pole
  - DONKI storm timing
  - the EDS dust-shield results from Blue Ghost (March 2025)
  - OSDR plant data
- **Made up for the game:** These are game assumptions:
  - battery, power, filter and suit numbers
  - mast heights
  - route costs
  - dust amounts
  - the shape of the terrain (hill heights)

  Each `scenario.js` has a `limitation` string that says this in kid words. It is shown under "Made up for the game" in the sources dialog, and a test checks that it is there.

## Assets

The new GLBs are made by original procedural generators: `npm run models:expansion` (`scripts/generate-expansion-models.mjs` plus `scripts/expansion-models/*`). The older lunar and survival generators are unchanged.

## Verification

- `npm test`: 212 of 212 pass.
  - Each mission has unit tests for its rules: both strategies, interlocks, undo, snapshot round trips and Cadet tuning.
  - The sampler test covers all six missions.
  - The kid-data test checks that every objective has a matching Pip tip.
- `npm run build`: succeeds. Vite still warns about the large GLTFLoader chunk.
- Each mission was played to the end in headless Chromium, and in each run:
  - the debrief opened
  - retry and the compare table worked
  - a mid-mission reload resumed the save

  Screenshots are in `screenshots/expansion-after/` (prefixes `sh-`, `gh-`, `ed-`, `ls-`, `ld-`, `lr-`), with earlier states in `screenshots/expansion-before/`.
- The old chapters, campaign progression and save keys are untouched.
  - The relay mission has a new state id (`over-the-hill-v2`), so old saves from the earlier relay version start fresh instead of loading into broken state.

## Honest limitations

- **No child playtesting:** None was possible. Reading level, controls and difficulty for ages 7–12 are untested with real kids.
- **Headless testing only:** Browser checks ran in headless Chromium at about 1 fps, using scripted movement. Real mouse and keyboard play, touch devices and frame rate on low-end hardware are not checked.
- **Relay mast buttons changed:** They changed from "hold E" to "press E". The hold version never finished in headless tests, and the cause was not found. Pressing works in both the rules and the scene.
- **Simplified science:**
  - Terrain line of sight is a simple height-field check.
  - Sunlight uses the archived LOLA averages, not a live ephemeris.
  - The battery and suit numbers are tuned for fun, not taken from real hardware.
