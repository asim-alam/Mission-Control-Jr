# Mission 2 improvement plan

The existing mission has working manual driving, cameras, field photography, resources and endings. Its weak points are broad objectives, skippable route work, a terrain report with no decision, immediate docking, sparse landmarks, and orange vertex colors multiplying the Mars ground texture.

## Implementation sequence

1. Make the operational sequence explicit: accept Elena's briefing; collect and fit R2; inspect and repair wheels and camera; check suits and radio at the terminal; perform the real drive/steer/stop test; compare routes and departure reserves.
2. Require two parked reports at named route stations. Each records actual ground, heading and remaining reserves. Arriving alone never completes a report.
3. Stop at a safe observation point before the broken crust. Inspect the evidence, then deliberately select a firm-ground detour or a prudent return. Gate ridge fieldwork on these reports and the decision.
4. Retain genuine on-foot context and scaled photographs, evidence-based description, and optional collection with a return-margin check. Make the next action and its location visible throughout.
5. Return manually, secure the rover, transfer the field record at the outpost terminal, and confirm both crew before the debrief.
6. Copy Mission 1's exact texture/material, tone mapping, light, fog and environment settings. Add clustered shared-geometry geology, landmark silhouettes, equipment stations, legible signs and an active-object marker while keeping corridors clear.
7. Inspect all three supplied GLBs. Integrate suitable optimized reference assets with embedded credits; keep the two-seat Rover Two and label Olympus as a geographic reference rather than local Meridian terrain.
8. Fix landing/footer overlap and responsive HUD layout. Verify action gates, recovery, interruption, resource costs, full controller-driven completion, original mission regressions, production build and browser presentation. Update walkthrough, asset report and distributable ZIP.

No additional downloaded assets or paid services are required. Existing recorded crew voices remain single-channel; new operational instructions use contextual text and event feedback.

## Implemented behavior

The eight-stage flow above is implemented in the existing Mission 2 entry point. Readiness stations have on-foot proximity checks; finding the pin or dust does not verify the repair. Reporting requires a parked rover at the current named station. Science rejects missed reports and an unresolved terrain choice. A claim that the shortest crossing is safe receives corrective feedback and leaves the decision open. Aborting remains available. Docking starts post-drive work; it no longer awards completion. The terminal requires a separate transfer and final crew count.

The task panel displays the current action, its distance and stage, while an amber ring points to its physical location. The minimap retains the selected corridor and travelled path. Guided walking is available for the outpost stations, with immediate manual takeover. Driving remains manual. Cargo, service equipment and the parked rover have simple collision bounds. Camera framing, resource costs, actual driving/braking, checkpoint assistance and the four outcomes remain in place.

## Exact visual restoration

`mars-visuals.js` copies Mission 1's values from `demo.js`: ACES filmic exposure 1.15; background `#c89976`; fog `#b68865` at 45–130 m; hemisphere `#e5edf2` / `#6c4030`, intensity 1.6; sun `#ffeedc`, intensity 2.3, relative position (18,24,12), shadow bias -0.0004; the same `mars-sky.webp` environment at intensity 0.4; and the same sRGB ground texture over white diffuse, roughness 1. Tile scale is the original 160/30 metres. The orange vertex-color multiplication is removed. The fictional route haze modestly shortens the original fog distances only away from home. Terrain relief remains authored rather than a flat plane.

Shared/instanced stone clusters follow the main boulder landmarks and avoid complete route segments. Broad distant landforms, service-area cargo, solar cables and legible signs add context. Large route obstructions were corrected after controller runs exposed clearance problems. Existing habitat, solar arrays, crew, terminal, battery, junction, crewed rover, layered outcrop, scale marker and sample are reused.

## Supplied models and performance

Four supplied reference models are available in the optional draggable archive. The supplied concept rover also occupies a reachable equipment pad; the player can switch that display to Perseverance, which loads on demand. The Mars globe is available from the archive and orbital Mars atlas, not as a physical surface prop. Both the oversized Olympus display and navigation globe were removed from the surface, including the globe's pedestal, sign, and walking collision boundary. The credited archive models remain. The reference viewer pauses the game and disposes resources on close or replacement. See ASSET-REFERENCES.md for provenance and ORBIT-AND-SURFACE-PLAN.md for the orbital expansion.

The original Downloads files are untouched. Optimized derivatives total about 22.1 MB versus 63.8 MB of source files. No extra assets are needed for the prototype. Perseverance remains about 199k triangles; its optional viewer can take longer to load on slow hardware. The Olympus model is illustrative reference terrain, not a validated elevation dataset or Meridian's actual landscape.

## Changed and added files

- Gameplay/state: `mission2.js`, `mission2-demo.js`, `expedition-terrain.js`, `rover-controller.js`.
- Presentation: `mission2.html`, `mission2.css`, new `mars-visuals.js`, `expedition-scenery.js`, `mission2-reference-viewer.js`.
- Assets/provenance: three `assets/models/reference-*.glb`, `reference-assets-report.json`, `ASSET-REFERENCES.md`, `scripts/inspect-reference-assets.mjs`.
- Verification: updated expedition state/drive/asset tests; new progression, station and fixture modules; screenshots and `MISSION-2-VERIFICATION.md`.
- Delivery: updated walkthrough, this implementation record, rebuilt `dist/`, and the source/build ZIP.

Mission 1's `demo.js`, `mission.js`, original asset files and campaign sources were not edited for this update. The existing regression suite remains part of verification.
