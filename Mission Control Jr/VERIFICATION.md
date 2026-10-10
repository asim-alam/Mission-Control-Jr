# Prototype verification — 10 October 2026

- Full automated suite: **37 tests passed**. Covers the original campaign fixes,
  mission prerequisites, rewards, inventory, dialogue responses, pause and timing,
  restart, all three outcomes, GLB loading, exported animation, and navigation.
- After adding airlock and tank collision bounds, the four navigation/player
  checks were rerun and passed. Simulated movement reaches every repair station
  without crossing obstacle boundaries.
- All **13 original GLB files** pass the glTF validator with zero errors. Moving
  equipment retains its named nodes; the crew GLB contains working Idle, Walk,
  and Repair clips. Each file embeds its geometry and materials.
- All **19 OGG dialogue clips** are bundled and readable. FFprobe confirms clip
  durations of 8.20–15.96 seconds, totaling approximately 225.64 seconds.
- Production build succeeds with all three pages, models, textures and audio.
  Asset references are relative so the build can be hosted beneath a directory.
- Browser verification completed the full repair route and the **Meridian holds**
  ending. A second run confirmed crew responses, emergency shelter confirmation,
  the new airlock transition, water inspection, audio/motion controls, and the
  automatic **Everyone made it. Barely.** ending.
- Production gallery reports **Ready** for all six 3D previews and exposes all
  thirteen GLB downloads. The original campaign loads as a separate page.
- No console errors or warnings were reported in the verified production mission
  or gallery. Screenshots are included in `screenshots/`.

Emergency evacuation is covered by the mission-state tests; its full countdown
was not repeated in the browser. No minimum frame rate or mobile support is
claimed. The presentation target is a desktop browser with WebGL.

The build's large-chunk notice refers to the shared Three.js/GLTF loader bundle;
it does not prevent the build or local play.
