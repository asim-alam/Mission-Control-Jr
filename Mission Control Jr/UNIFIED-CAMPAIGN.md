# Mission Control Jr. — unified Mars and Moon campaigns

Run `npm run dev` from the game folder and open **http://127.0.0.1:5173/**. The current menu separates a six-chapter Mars story and a three-chapter lunar training assignment. Production uses `npm ci`, `npm test`, `npm run build`, then `npm run preview`. See [the mission expansion plan](MISSION-EXPANSION-PLAN.md) and its [current implementation status](docs/mission-expansion/implementation-status.md).

## Connected story

1. **Arrival at Mars / Sol 11:** Jin docks with Asteria, diagnoses and repairs the relay, checks the field kit and transfer systems, verifies the lander and descends to Meridian.
2. **Before the Storm / Sol 12:** the restored relay carries the warning. Jin restores outpost power and life-support reserves and protects the four-person crew. The fully prepared outcome opens the rover chapter.
3. **Tracks in the Dust / Sol 16:** Jin and Amara prepare and test Rover Two, plan a traverse, make parked reports, inspect uncertain ground, record field science and return the crew and record to the outpost.
4. **A Place to Hide / Sol 18:** move shielding supplies or use the rover cabin while managing water access, power, and modeled exposure.
5. **The Greenhouse Promise / Sols 32–34:** support established crops through power and water trade-offs; harvest is a modest food supplement.
6. **Earth Can’t Answer Yet / Sol 35:** repair locally, conserve while an actual modeled Earth packet travels, or suspend safely.

Debriefs provide the next story transition. Journey pauses the active chapter; Return to active mission resumes it. Cards allow independent practice, which does not award earlier chapters. The registry defines stable routes; static hosts can use `index.html?mission=ID`. Active expansion chapters save versioned controller state locally. Internally, a single isolated scene frame loads one mission at a time and releases its renderer and assets when the chapter changes.

## Separate lunar training assignment

The Moon campaign takes place at fictional Horizon Outpost and has three chapters: **Chasing the Sun** (panel placement versus battery reserve), **Dust at the Door** (equipment handling, filtration, and airlock interlocks), and **Beyond the Ridge** (line of sight, relay setup, and return reserves). Lunar progress and carry are independent of Mars.

**Thirty Sols** is an optional longer-term command simulation with its own timeline.

## Progress

Campaign completion and outcome summaries save locally under `mission-control-jr.journey.v1`; a completed orbital checkpoint is imported when present. Arrival retains verified station procedures through its existing checkpoint. The six expansion chapters retain a versioned active controller snapshot across reloads and offer continue/restart. Orbit retains its independent checkpoint. Storage failures leave gameplay available and explain that persistence is unavailable.

## Mars and station

Mars is now 3,600 scene units across, versus 270 in the previous revision; station dimensions stay the same. Planet position, illustrative orbit, overview camera ranges, stars, atmospheric rim and descent camera were adjusted together. A projected Asteria marker identifies the much smaller station. This remains a composed, illustrative planetary view rather than literal spacecraft-to-planet units.

## Spoken mission briefing

Seven Elena / `af_bella` clips ship in `assets/audio-orbit/`: arrival, docked, brief, relay, lander, descent and touchdown. They use the existing local Kokoro workflow: 24 kHz mono Vorbis, normalized to -18 LUFS, approximately 102 seconds / 746 KB combined. Subtitles are in `dialogue-lines-orbit.json`.

Starting arrival plays the briefing. Briefing replays the last line; the temporary radio panel offers Skip and Replay. Sound on/off controls voice and ambience. A new line stops its predecessor and invalidates old handlers. Journey, mission pause and hidden tabs pause/resume speech. Ambient tones duck under narration. Blocked/unavailable playback displays its state and retains captions. No browser speech fallback or paid service is used.

Optional regeneration: `python scripts/generate-voices-orbit.py` with the installed local toolchain. Gameplay needs only the bundled files.

Movement, zoom and physical interaction controls remain in each chapter’s Controls/Help menu. No extra artifact downloads are needed.

## Verification for this revision

- All 83 automated tests passed, including the existing full physics-driven rover routes, orbital procedure checks, campaign progression/storage cases, and bundled narration checks.
- Production build completed successfully. Vite retains its existing shared Three.js/GLTF loader chunk-size advisory.
- Browser checks covered recorded voice `playing` events in the production build, Journey pause/resume, the saved arrival debrief into the storm transition, storm and rover briefings within the shell, extended simulation loading, and a legacy orbital URL redirecting to the root campaign.
- Production browser error/warning log was empty. This pass checked chapter integration and narration; the entire three-chapter expedition was not manually replayed from scratch.
