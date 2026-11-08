# Required 3D artifact construction and integration

## Mandatory instruction to every implementing agent

**Build the 3D artifacts necessary for your mission. Create the editable generator/source, export the actual self-contained GLB files, load them in the playable scene, connect their visible states and interactions to simulation state, and validate them. Do not substitute a written asset list, concept image, empty manifest entry, hidden placeholder, or screenshot for a functioning 3D asset.**

Use the project's existing Three.js procedural generation and `GLTFExporter` workflow as the default. Extend or add generators under `scripts/`; do not require Blender or a commercial tool just to reproduce the game. Preserve existing working models and their creator/license credits. Existing assets may be reused where the hardware is genuinely the same. A material/label change is not a new physical capability.

All proposed hardware is fictional educational equipment informed by NASA concepts; do not label it flight-qualified NASA hardware.

## Shared asset contract

- One world unit is one meter; Y up. Specify forward axis and root origin for every model. Static props sit on the ground at local Y=0; portable objects use a documented grip anchor.
- Export geometry, materials, and textures inside GLB. No required external buffers, remote model URLs, or unbundled fonts.
- Add `asset.extras`/`userData` metadata: project asset ID, creator, license/source, modification statement, dimensions, units, animated-node names, interaction anchors, collision proxy, and authored-versus-derived status.
- Preserve named articulation nodes through optimization. Never merge a valve, hinged hatch, deployable panel, plant stage, or removable cassette into a static batch that prevents its required behavior.
- Use simple box/capsule/circle collision proxies, not dense per-triangle character/rover physics. Provide approach positions with enough room for navigation, camera, and interaction.
- UI and physics share stable object IDs. Picking a visible valve dispatches the same validated action as its keyboard/button alternative. Reject remote interaction and repeated one-shot rewards.
- Keep warning information in text/icons as well as emissive colors. Provide a labeled list/button alternative for each 3D interaction.
- Use original procedural geometry by default. Any third-party asset requires verified provenance and distribution-compatible licensing; do not assume a title containing “NASA” establishes NASA ownership.

## Asset manifest

Create `mission-assets.js` or an equivalent registry with `new URL(..., import.meta.url)` for generated build-tracked files. In runtime/scene modules use the registry, not string guesses. Terrain built at runtime still needs an editable deterministic generator, seed, bounds, and provenance declaration; export a GLB reference/preview where useful.

| Asset ID / suggested GLB | Missions | Must build/reuse | Required visible states / anchors |
|---|---|---|---|
| `shelter-frame.glb` | M04 | Build modular shelter alcove inside reused habitat | `slot_left`, `slot_right`, `slot_roof`, `crew_anchor_1..4`; slots show actual installed modules |
| `water-bag-module.glb` | M04 | Build portable bag/crate; instance it | `grip`, `hose_port`; stowed, carried, installed; stored mass matches ledger |
| `exposure-monitor.glb` | M04 | Build readable device, not a medical dosimeter claim | `screen`, `indicator`; authored exposure trend and source-mode label |
| `experiment-rack.glb` | Storm/M04/M06 | Build shared experimental equipment | powered/unpowered/preserved states; `service_port`, `status_screen` |
| `greenhouse-rack.glb` | M05 | Build pressure-interior rack with removable trays | `tray_a`, `tray_b`, `led_panel`, `valve_a`, `valve_b`, `growth_seedling`, `growth_mature`, `growth_harvested` |
| `irrigation-manifold.glb` | M05 | Build transparent teaching cutaway or clearly routed pipes | `isolation_valve`, `pump`, `return_line`; flow only when actually served |
| `pump-service-module.glb` | M06 | Build isolated low-risk service unit | `power_disconnect`, `cover_hinge`, `pump_cartridge`, `latch`; incorrect order stays interlocked |
| `air-reserve-cylinder.glb` | M06 | Build stand-alone reserve unit or adapt verified existing tank shape | `valve`, `connector`; visible connected/disconnected state and quantity label |
| `message-terminal` | M06/L03 | Reuse terminal geometry, build appropriate screen/controller | queued/sent/processing/reply/reception-blocked indications; no fake Earth reply animation |
| `lunar-habitat.glb` | L01–L03 | Reuse justified habitat modules with lunar exterior, physical radiators and service access | `airlock_anchor`, `power_port`, `comms_port`; no Mars sky/dust-storm effects |
| `polar-solar-mast.glb` | L01 | Build low-Sun collector with deployable geometry | `azimuth_pivot`, `panel_hinge`, `base_anchor`, `cable_port`; current deployment affects output |
| `battery-cart.glb` | L01/L03 | Build cart around reused battery mesh | `wheel_l`, `wheel_r`, `handle`, `power_port`; transport actually costs time |
| `cable-reel.glb` | L01/L03 | Build spool/connector | `reel_axis`, `connector`; deployed cable has route/length/collision policy, not a visual teleport |
| `dust-control-rack.glb` | L02 | Build fictional EDS-inspired test panel and manual-cleaning station | `test_panel`, `electrode_grid`, `cleaning_tool`, `dust_surface`; dust decreases only after successful action |
| `boot-tray.glb` | L02 | Build dirty-zone staging fixture | `boot_zone_l`, `boot_zone_r`, `tool_zone`; dirty equipment remains outside clean cabin |
| `filter-cassette.glb` | L02 | Build removable filter with protected storage | `grip`, `slot`, `latch`; new/installed/spent states; finite inventory |
| `lunar-relay-mast.glb` | L03 | Build portable local repeater | `mast_pivot`, `antenna_pivot`, `battery_port`, `ground_anchor`; raised/lowered/powered/link-ready states |
| `field-probe.glb` | L03 | Build simple bounded-duration science instrument | `sensor_head`, `tripod`, `sample_target`; survey progress visible |
| Terrain patches and horizon silhouettes | L01/L03 | Build distinct lunar terrain; optional coarse-data context mesh | bounds, safe paths, ridge occlusion, declared scale/projection and fictional walkable detail |
| Airlock/interior, astronaut, rover, solar hardware | All as appropriate | Reuse current assets and extend only where needed | preserve existing animated/collision/control anchors; test each reuse |

Plant stages must be modeled and visibly distinct, not just one green rectangle. Dust must visibly affect a panel/visor/rack surface. Water shielding must visibly relocate inventory. Relay line status must agree with physical obstruction. These are educational state visualizations; avoid invisible mechanics that only change a number in a panel.

## Visual direction

Mars retains warm terrain, atmosphere/dust where appropriate, and the Meridian visual identity. Lunar scenes use a dark sky, gray regolith, strong directional sunlight, low solar angles, and long terrain shadows. Do not add wind-driven lunar storms. Avoid exaggerated glowing radiation beams; use an explicitly illustrative exposure overlay if needed.

Make interaction silhouettes recognizable at the child's camera distance. Keep small labels in HTML/UI as accessible text rather than baking unreadable text into textures. A moved shadow or fading plant needs a caption explaining its meaning. Represent hours/days with explicit transitions rather than making lunar Sun motion or plant growth look physically real-time.

## Budgets and generation

Initial engineering budgets, to validate on target hardware:

- Routine interactable prop: aim below 15,000 triangles, 6 materials, and 300 KB untextured GLB. Shared hero modules can exceed this with a measured reason.
- One active new mission: target fewer than 150,000 visible triangles and 150 draw calls before optional effects; profile rather than treating counts as a frame-rate guarantee.
- Reuse/instance bag modules, plants, rocks, electrode strips, and cable supports. Avoid loading the existing dense reference rovers in a mission that does not use them.
- Load campaign/mission bundles on demand. Target at most 8 MB of additional required model/texture transfer per new mission; optional archives do not block entry.
- Prefer 512–1024 px shared texture atlases where textures are needed. Keep transparencies/shadow casters selective. Provide low shadows/effects quality.
- Dispose scene geometry/materials/textures/audio and stop animation loops on chapter change. Test repeated campaign switches for resource growth.

Add generator commands such as `models:survival` and `models:lunar`, consistent with existing scripts. Actual command names must be documented in `package.json`/README before reporting them available. Generators should support selecting one asset and produce a manifest with file size, triangles, draw/material counts, bounds, and validator results.

## Asset acceptance evidence

1. Generator/source and actual GLB are present; running the generator reproduces a loadable file.
2. `gltf-validator` reports zero errors; fix warnings or document each justified warning. Do not erase metadata to hide warnings.
3. Runtime loader can parse the GLB; required animated nodes and anchors exist and are finite.
4. Screenshots show the asset at the interaction location and at least two relevant states; identify which action caused the change.
5. Walking/driving can reach the interaction point without clipping or soft lock; collision/camera remain usable.
6. The actual production build contains the GLB and its credits; fresh-browser playback works offline after required assets load.
7. Record a performance sample with device/browser, viewport, quality, and active assets. A model gallery alone is insufficient integration evidence.

**An agent owning a mission is accountable for obtaining an integrated asset even when a separate asset agent builds the geometry. “Waiting for assets” is a tracked dependency, not permission to mark the mission complete with boxes.**
