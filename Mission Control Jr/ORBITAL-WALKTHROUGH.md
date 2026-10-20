# Arrival at Mars — playable orbital expansion

## Run

Use the existing project folder. If dependencies are already installed, do not run npm ci while Vite is running; Windows can lock its native bundler binding.

```powershell
cd "D:\CODE\Mission Control Jr\Mission Control Jr"
npm.cmd run dev
```

Open the Local address printed by Vite, normally http://127.0.0.1:5173/. Choose Arrival at Mars in the unified Journey. Legacy `/orbit.html` links redirect to `/#orbit`; every playable chapter stays inside the campaign interface.

For a fresh extracted copy, run `npm.cmd ci` once before `npm.cmd run dev`. Use Node 22.12 or later. Stop other servers using that extracted copy before reinstalling dependencies.

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

The production preview normally uses http://127.0.0.1:4173/. Use the port actually printed in the terminal.

## Complete play route

1. Explore the opening Mars/station overview. Drag to orbit, wheel or +/− to zoom. Choose **Begin arrival qualification**, then **Begin approach**.
2. Fly a soft docking approach: W/S change closure speed, A/D translate horizontally, R/F translate vertically, and Space brakes. Start with A for about two seconds and F for about one second to center the initial offsets; use short corrections and the actual readouts. Thrust does not automatically brake when released. Close inside 2 m, hold both offsets inside ±0.35 m, and brake below 0.15 m/s. Press E or **Seal dock**. Excess speed or misalignment at contact rejects the approach. Alternatively, **Assisted approach** uses the same controller and records assistance; any flight key takes manual control.
3. Enter Asteria. The current objective and amber marker identify one console at a time. Move with WASD/arrows and drag to look, or choose **Guide to equipment** for actual collision-checked walking. E or the contextual button interacts within 2.5 m. Movement keys interrupt guidance. V switches first/third person; the camera pulls in at walls and hides the avatar when too close.
4. Reach the observation/mission-control room and accept Elena's assignment. Jin is arriving for his surface rotation; the relay is needed for Outpost Meridian's later work.
5. Inspect communications. The habitat bus is stable, the pointing drive current is high, and the link is intermittent. Select **Pointing-drive branch**. A wrong choice explains the evidence and leaves diagnosis incomplete.
6. At power distribution, isolate **only the antenna branch**. Shutting down healthy habitat power is rejected. Return to communications and reseat the isolated controller. Return to power and restore/test the branch. Meridian acknowledges the local relay.
7. Visit crew quarters to verify the suit/science kit and crew manifest. Visit the transfer console to check pressure and hatch interlocks. These are simplified training checks, not real spacecraft flight procedures.
8. Return to the docking vestibule and board the lander. Validate guidance, then verify propulsion and restraints. Both checks are required before descent.
9. Begin the 16-second time-compressed deorbit/entry/descent camera sequence. Escape pauses; **Skip camera sequence** finishes only this cinematic after all readiness checks.
10. Read the completed arrival qualification. Continue through the story transition into **Before the Storm** (Sol 12), then **Tracks in the Dust** (Sol 16). Surface chapters provide physical repairs, exploration, manual rover driving, terrain decisions, science photography and safe return.

Completed station procedures save automatically when local storage is available. Reload and choose **Resume station checkpoint**; location resets to the safe transfer vestibule while verified procedures remain. Approach attempts restart from a safe approach. The pause menu provides restart and sound mute. No network account or external service is required.

## Controls and accessibility

Details expands the current instruction; Controls opens the flight handbook; Mars atlas gives feature context and model credits. Exploration uses first/third-person views, with an exterior/cockpit option aboard the spacecraft. Zoom is clamped. Menus pause gameplay. Hidden tabs stop simulation time. The descent can be skipped. Seven bundled Elena recordings now provide the orbital briefing and mission updates, with skip, replay, captions, mute and pause/resume. Ambient tones duck under the voice; no vacuum wind is used. Existing surface recordings remain unchanged.

## What is implemented and what comes next

This version delivers an original station exterior with modules, solar wings, radiators, dish and docking collars; a cross-shaped explorable interior with observation room, workstations, bunks and transfer area; the supplied animated astronaut and high-resolution Mars map; spacecraft relative-motion controls, real action gates, save/restart, and a complete arrival mission connected by scene transition to the existing surface game.

The station stays in a local planet-facing orbital frame. Planet size, apparent station distance, flight telemetry and descent duration are illustrative. Movement uses a constrained handrail/deck-assist plane rather than full six-axis microgravity. Landing uses a cinematic transition. Orbital checks have recorded character updates, captions and generated sound effects.

Next expansion, after this chapter: add the surface weather node and actual field-record packet; show its photographs and acknowledgement at the orbital console; add timed relay passes and a short tethered external maintenance route; then consider free microgravity motion or manual landing. Those are future additions, not represented as completed gameplay here. The previous ORBIT-AND-SURFACE-PLAN.md contains the larger relay/science concept; the current arrival brief changes the first chapter to Jin's Sol 11 arrival, preserving the existing surface chronology.

## Research and credits

The procedure/evidence focus draws from [NASA analog missions](https://www.nasa.gov/analog-missions/), [CHAPEA](https://www.nasa.gov/humans-in-space/chapea/about-chapea/), and [NASA crew simulation/EVA training](https://www.nasa.gov/reference/jsc-simulation-modeling/). The surface connection draws on [JPL rover navigation](https://robotics.jpl.nasa.gov/what-we-do/flight-projects/mars-science-laboratory/surface-system-software-and-rover-navigation/) and the [Mars Relay Network](https://science.nasa.gov/mars/mars-relay-network/). Geological context follows [NASA Mars facts](https://science.nasa.gov/mars/facts/). These are design references, not an agency certification or claim that Asteria exists.

Mars model and map: Akshat, [source](https://sketchfab.com/3d-models/mars-9c7bbc64d8c74acfa9ec344c0fc10e1a), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The user supplied the original. Its 4096×2048 diffuse map is recompressed as WebP without resizing; the optimized sphere converts the legacy material to core PBR. See ASSET-REFERENCES.md. Station and shuttle geometry are original procedural work. No additional download is required.
