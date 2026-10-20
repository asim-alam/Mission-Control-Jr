# The Meridian Expedition — unified playable campaign

Run `npm.cmd run dev` from the game folder and open **http://127.0.0.1:5173/**. Install with `npm.cmd ci` first only for a fresh extracted copy, while Vite is stopped. Production uses `npm.cmd run build`, then `npm.cmd run preview` and the printed local address.

## Connected story

1. **Arrival at Mars / Sol 11:** Jin docks with Asteria, diagnoses and repairs the relay, checks the field kit and transfer systems, verifies the lander and descends to Meridian.
2. **Before the Storm / Sol 12:** the restored relay carries the warning. Jin restores outpost power and life-support reserves and protects the four-person crew. The fully prepared outcome opens the rover chapter.
3. **Tracks in the Dust / Sol 16:** Jin and Amara prepare and test Rover Two, plan a traverse, make parked reports, inspect uncertain ground, record field science and return the crew and record to the outpost.
4. **Thirty Sols / extended command simulation:** optional longer term decision training through the same campaign interface. Its separate simulated timeline is an extended exercise.

Debriefs provide the next story transition. Journey pauses the active chapter; Return to active mission resumes it. Cards also allow independent practice, which does not award earlier chapters. All chapters use the same root URL with chapter hashes. Legacy HTML addresses redirect into the campaign. Internally, a single isolated scene frame loads one existing mission at a time, preserving their render/input code and stopping the old scene and audio when the chapter changes.

## Progress

Campaign completion and outcome summaries save locally under `mission-control-jr.journey.v1`; a completed orbital checkpoint is imported when present. Arrival retains verified station procedures through its existing checkpoint. Surface scenes begin at their chapter entry after a page reload. While a chapter remains open, Journey preserves its live state. Storage failures leave the game playable with session-only campaign progress.

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
