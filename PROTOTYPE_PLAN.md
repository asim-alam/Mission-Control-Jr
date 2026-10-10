# Mission Control Jr. — Interactive Challenge Prototype

Status: implemented desktop prototype, verified on 10 October 2026. Challenge
brief, judging criteria, and submission deadline have not yet been supplied.
The game, launch instructions, walkthrough and verification notes are in the
nested `Mission Control Jr.` directory.

## Target

A complete 5–8 minute desktop-browser demo with exploration, object interaction,
changing weather, crew dialogue, sound, and a consequence-based ending. Reuse
the existing Three.js project, Mars textures, and three GLB assets.

Keep the thirty-sol campaign available as a separate mode. The demo uses a
short, explicitly compressed mission sequence built around the dust-storm
chapter; its task rules must not interfere with campaign events or resources.

## Story: Before the Storm

The player is engineer Jin Park. Meridian's first major dust front is approaching,
and a failing power system threatens the habitat's oxygen recycler. Commander
Elena Reyes coordinates the response over radio, Amara checks life support,
and Luca reports on crew fatigue and safety.

1. **Briefing:** arrive outside the habitat, hear the commander's radio call,
   learn movement and interaction, and check the habitat terminal.
2. **Diagnosis:** inspect a dusty solar array and restore its output. Power
   returns briefly, but a battery fault reveals that the station cannot sustain
   life support through the storm.
3. **Preparation:** recover a battery from the rover, repair a power connection,
   and choose how to allocate the restored power. Prioritize oxygen reserves
   and shelter, or keep equipment running and accept reduced reserves.
4. **Storm:** visibility falls, wind builds, lighting changes, and resources
   reflect the player's preparation. Return to the habitat and secure the crew.
5. **Resolution:** show a short voiced debrief and a report based on actions:
   fully prepared, barely survived, or emergency evacuation. Include replay.

The storm progresses through explicit mission stages, with a visible compressed
countdown during preparation. Pause the countdown in dialogue and pause menus.
Provide enough time for a first-time player to understand each interaction.

## Direct interaction

Default controls: WASD to walk, mouse to look, E to interact, mouse click for
the same nearby action, J for mission journal, and Escape to pause/release
mouse capture. Provide a short tutorial, a crosshair, target highlight,
interaction distance, and clear unavailable-action messages.

Use collisions for the habitat, rover, rocks, and playable boundary. Interactions
require proximity and an unobstructed target. Avoid letting the player walk
through scenery or activate equipment from across the map.

| Target | Player action | Visible and gameplay result |
| --- | --- | --- |
| Habitat terminal | Read diagnostics and confirm mission tasks | Objective changes; faulty system is identified |
| Solar panels | Hold the cleaning tool over dusty sections | Dust clears visibly; power rises |
| Rover service bay | Inspect and recover a battery | Bay opens; battery disappears into inventory |
| Power junction | Fit the battery and align a simple connector | Lights restore; available power changes |
| Crew member | Talk and choose a response | Subtitled radio/crew dialogue and morale feedback |
| Shelter controls | Allocate reserves and secure the crew | Habitat seals; storm outcome follows preparation |

Every completed task should produce an animation, sound, mission-log entry,
and state change. Prevent repeat collection, repeated rewards, and interaction
during cutscenes or completed missions. Guide the player using nearby world
labels and objective markers, and offer an inspectable journal for missed dialogue.

## Dynamic environment

- Smoothly shift sunlight, sky tint, shadows, and habitat lighting with compressed
  mission time; use a sunset-to-storm transition for the short demo.
- Increase dust, wind, fog, and reduced visibility as the storm approaches.
- Animate equipment: solar-panel tilt, rover mast scanning, rover wheel movement
  during a brief scripted reposition, service-bay opening, and status lights.
- Make repaired, depleted, and damaged equipment look different.
- Have crew turn toward the player; add idle/walk/repair animation if an animated
  character asset is available.
- Use restrained camera movement and a reduced-motion option. Weather and camera
  movement must not obstruct interaction or reading.

Current GLBs are static and merged by material. Re-export moving equipment
parts as named child nodes so doors, wheels, and the mast can animate separately.
The editable model generator allows these changes without new supplied assets.

## Sound and voice

- Add low ambient wind, radio hiss, suit breathing, machinery, footsteps,
  cleaning, repair, door, battery, and warning sounds.
- Give machines positional sound so their volume changes with player distance.
- Let wind, alarm intensity, and ambient music follow mission/weather states.
- Write short dialogue for briefings, crew conversations, discoveries, warnings,
  and endings. Use subtitles with speaker names, skip/replay, and a dialogue queue.
- Prefer bundled recorded WAV/MP3/OGG clips for consistent challenge playback.
  Browser speech synthesis can provide an initial fallback, but available voices
  depend on the device. Subtitles must always work.
- Separate voice, effects, and ambience volume controls, plus master mute.
- Start audio after Begin Mission, lower background volume during dialogue,
  and stop stale voice/audio on restart or scene changes.

## Implementation order

1. Add player movement, collisions, a compact HUD, object highlighting, and one
   complete solar-panel interaction. This establishes direct playability.
2. Add mission-state progression, inventory, rover/power/shelter interactions,
   objective markers, branching outcomes, and restart. This completes the demo.
3. Add world animations, weather transitions, sound, voice, subtitles, and polish.
4. Verify a complete presentation run and package the production build, a short
   README, a control card, and screenshots or a demo recording.

Suggested code responsibilities: `player.js` for movement; `interactions.js` for
targets/actions; `mission.js` for objectives and outcomes; `environment.js` for
weather and scenery animation; `dialogue.js` for dialogue and voice; `audio.js`
for sound; and `outpost.js` for model loading and interactive-part registration.
Keep authoritative resource and task state separate from visual effects.

## Optional assets to supply

No additional assets are required to begin implementation. In order of value:

1. **Animated astronaut GLB:** rigged with idle, walk, and repair clips. This gives
   crew movement a major visual upgrade. A mesh without a rig/animation will not
   provide those motions.
2. **Habitat interior/airlock GLB:** allows a physical shelter interior. Without
   it, use a simple generated interior or an exterior shelter console.
3. **Tools and props:** battery, toolbox, cable connector, oxygen/water tanks,
   radio antenna, and greenhouse equipment.
4. **Audio:** wind, footsteps, machinery, radio effects, and recorded dialogue.

For supplied GLBs, prefer embedded textures, meter-scale dimensions, and
separate moving parts. Include animation clip names and usage/license information.
For audio, WAV, MP3, or OGG files are suitable. Preserve source/license information
for any assets that will appear in the challenge submission.

## Acceptance checks

- A new player can complete the demo with the on-screen instructions alone.
- Nearby world interactions visibly alter equipment and resources.
- Success and emergency outcomes are both reachable and explain their causes.
- Resources, timing, and rewards remain consistent across pause and dialogue.
- Restart resets objectives, inventory, world visuals, audio, and camera state.
- Missing voice or optional assets do not block progress.
- The production build contains the models, textures, and any bundled audio.
- Check performance on the actual presentation computer, tune dust/shadows,
  and keep a reliable replayable demo ready for judging.

## Information needed to tailor scope

Challenge name/brief, judging criteria, submission deadline, and whether the
prototype must run without internet access or on mobile. Until supplied, assume
a desktop browser, English dialogue, and locally bundled project assets.
