# Pitch video: build progress (checkpoint 2026-11-13)

## Decisions (from the user)
- Script: `SCRIPT.md` (cinematic, 4 acts, "Real ↔ Game" montage at ~2:00). Hard limit 240 s; target 3:55.
- **New opening:** an original cinematic montage that borrows the style of the reference "Cinematic Documentary Intro" (`source/ref/ref-sheet.jpg`):
  - ~1 s cuts, Dutch-tilted angles, a warm rust/amber duotone grade with grain and vignette.
  - A glitch/slice reveal of a bold, condensed, all-caps title on a solid rust field.
  - Then the film slowly builds into the Opportunity story and follows the script. **No copied footage.**
- **Voice:** Ava (`en-US-AvaNeural`, rate −8%) via edge-tts 7.3.1, installed in a scratchpad venv. The system edge-tts 7.2.8 gets HTTP 403.
  - The 21 lines are in `film/assets/vo/sNN.mp3` with `.srt` timing; the text is in `film/vo_lines.json`.
- **Music:** AShamaluev "Cinematic Documentary" → `film/assets/music/score-ashamaluev-cinematic-documentary.wav` (4:01).
  - The user chose it. Its license is free only for YouTube Shorts, so the user must get the video license before submitting. Credit it on the end card.
  - The user would like even better music. HeyGen catalog retrieval needs the `heygen` CLI. Auto mode blocked running its installer, so the user must install it themselves: `curl -fsSL https://static.heygen.ai/cli/install.sh | bash`. HeyGen OAuth sign-in is already done.
- NatGeo footage is not used (copyrighted).

## Assets
- NASA footage (17 clips, 1080p): `source/nasa/` (Opportunity farewell, 2018 Mars Reports, Perseverance landing, Jezero flyover, SDO flare, ISS Veggie, Artemis I/II, lunar south pole, spacewalk, DSN tour, dust devils, Sounds of Mars).
- Game capture:
  - The tools are in `capture/`:
    - `rec.mjs`: headless Chrome on the Intel GPU via `--use-angle=vulkan`.
    - `lib.mjs`: the mission shell, HUD hiding and a frame-by-frame camera rig.
    - `exp.mjs`: the newer-mission shots.
    - `bb.mjs`: the Base Boss shots.
  - The output goes to `film/assets/game/*.mp4` (30 fps, 1080p).
  - The dev server must be running: `npm run dev` → http://127.0.0.1:5173.
- Shots:
  - Base Boss: `bb-outpost-push`, `bb-outpost-low`, `bb-basin-crane`, `bb-rover-track`, `bb-rover-wheels`, `bb-dawn-rise`.
  - Newer missions: `ex-shelter-refuge`, `ex-shelter-wall`, `ex-shelter-event`, `ex-greenhouse-beds`, `ex-greenhouse-close`, `ex-earth-delay`, `ex-moon-mast`, `ex-moon-airlock`, `ex-moon-relay`.
  - `test-shelter.mp4` is a leftover test file and can be deleted.

## ⚠️ Temporary change to revert after capture
- `missions/base-boss/world.js`: a one-line `window.__camOverride` hook marked `CAPTURE-HOOK`. Revert it with `git checkout -- "Mission Control Jr/missions/base-boss/world.js"`.
- Two tracked GLBs showed as modified during this session: `lunar-relay-mast.glb` and `shelter-frame.glb`. The cause is unknown and the size is unchanged. Check them before committing.

## Still to do
1. Still to record:
   - Title-screen B-roll from Before the Storm, Arrival at Mars and Tracks in the Dust (screencast with the UI hidden).
   - UI moments: homepage and mission map, the greenhouse "Share the light" decision dialog, the Sources page, and the shelter debrief report.
2. Change the VO for shot 16, so the decision matches the greenhouse dialog: "Full light for the salad, or save the battery for tonight?"
3. Build the HyperFrames project in `film/`:
   - Intro montage, titles and team cards.
   - Grade the NASA clips with `media-treatment`.
   - The match-cut montage, the score with ducking, and the battery-pulse SFX.
4. `check`, `snapshot --review`, then open the preview for the user, then render.

## Update — film built (2026-11-13)
- `film/build.mjs` generates `film/index.html` (235 s): intro montage + glitch title, 4 acts, REAL↔GAME montage, VO (Ava), music with ducking, end card with credits. Re-run `node build.mjs` after edits.
- `hyperframes check`: 0 errors (warnings are only "split into sub-compositions" and team cards ~0.1 s under the reading floor).
- Render → `pitch-video/before-the-storm-v1.mp4`.
- Base Boss capture hook reverted; title-screen backdrops recorded black, so they're unused and deleted. Shelter debrief recording failed, so shelter/greenhouse shots are used there instead.
- Still open: the AShamaluev video licence; team confirmation of "more languages"; the two GLB modifications.
