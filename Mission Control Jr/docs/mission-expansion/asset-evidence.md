# Mission and asset evidence collected

Updated 8 November 2026. Screenshots and browser observations are evidence for the specified path only; they are not a substitute for the per-asset acceptance coverage in `03-3D-ASSET-BUILD-SPEC.md`.

## L01: Chasing the Sun

The production build was run in Chrome 157 on an HP laptop with an Intel UHD Graphics 620. WebGL reported `ANGLE (Intel, Mesa Intel(R) UHD Graphics 620 (KBL GT2), OpenGL ES 3.2)`. A complete UI path was played in the browser:

1. Start the separate lunar training assignment and inspect the battery and collector.
2. Compare the two long-term LOLA reference analogs; select the near pad.
3. Attach the cart, transport the collector, deploy the mast, route its 18 m cable, and connect it.
4. Enable the optional survey, advance through the service window, and finish the attempt.

The actual debrief reported a connected collector, 390 W output during the sampled sunlit moment, 164 Wh remaining, 202 Wh served to optional work, and 0 Wh of missed essential power. The run ended as **Power and survey complete**. These are authored exercise results, not NASA forecast values.

| Screenshot | State and action shown |
|---|---|
| `screenshots/mission-expansion-l01-01-active.png` | Opening active scene after the player starts the exercise; collector and cart remain at storage. |
| `screenshots/mission-expansion-l01-02-simple-options.png` | Near-pad choice in Simple mode; the third button reveals the remaining options. |
| `screenshots/mission-expansion-l01-03-panel-deployed.png` | `Deploy collector` rotated the panel toward the modeled low-angle Sun. |
| `screenshots/mission-expansion-l01-04-cable-routed.png` | `Route 18 m cable` added the visible cable path. |
| `screenshots/mission-expansion-l01-05-power-connected.png` | `Connect power` produced 390 W at the sunlit sample time. |
| `screenshots/mission-expansion-l01-06-console-connected.png` | The connected collector fed the power console while optional survey work was enabled. |

Deployment also changes the panel hinge orientation and azimuth; the connected state changes the power console's visible screen/indicator and modeled output. These changes use the same mission state as the action menu. The new screenshots are included in the distributable archive.

## Additional browser checks

- Each of the six new mission routes loaded its briefing and 3D scene. A first station could be reached and its labeled station button opened the corresponding action menu.
- Each new mission saved an active attempt, reloaded, and displayed the saved-training recovery choice. Continuing restored the mission objective and state.
- Simple mode showed two primary choices plus progressive disclosure for longer menus. The expanded menu preserved the remaining options. Unit tests cover the Details mode explanation content and full option list.
- All six new mission scenes rendered on the UHD 620 at a 1280×657 CSS canvas in Standard and Low Effects. Samples were 60.1–60.7 fps in headless Chrome with hardware ANGLE; Chrome’s frame pacing capped the sample near 60 fps, so this establishes target-rate rendering for those sampled scenes, not maximum throughput.

## Still required

- Repeat the asset evidence capture for every asset that requires a distinct interaction state, including both relevant states, action attribution, route/collision reachability, and disposal/re-entry. The six screenshots above document L01 and do not certify the other 18 assets.
- Complete alternative/reduced-objective browser paths for all nine story chapters and verify the existing Mars chapter fixes, save migration, pause/visibility behavior, carry narration, and end navigation.
- Observe real players ages 7–12 and record findings. No child-learning outcome is claimed.
- Run repeated chapter switches while tracking GPU memory/resources, and profile an uncapped device as well as the 60 Hz display used for the current sample.
