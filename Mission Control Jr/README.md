# Mission Control Jr. — Mars and Moon Expedition

**Play the Mars and Moon training campaigns at http://127.0.0.1:5173/.** The Mars story now has six chapters, from arrival through an Earth-delay decision. The separate Moon campaign has three lunar-outpost missions. **Thirty Sols** remains an optional command simulation. Each campaign tracks progress separately; chapter practice and the mission sampler let judges explore choices without changing completion. See [the expansion plan](MISSION-EXPANSION-PLAN.md) for mission scripts and [implementation status](docs/mission-expansion/implementation-status.md) for verification evidence and open release gates.

For a fast judging route, choose **Quick demo · 5–7 min** on the first screen to show power, oxygen, shelter and a crew decision. Every chapter remains available from its card. The explanations toggle switches between plain-language and system-number notes without changing simulation values. Mission 2’s debrief can be printed or saved as a PDF from the browser print dialog. NASA learning references are in [Sources and credits](./sources.html) and the complete objectives are in [LEARNING-OBJECTIVES.md](./LEARNING-OBJECTIVES.md).

Mars now dwarfs the station in the orbital view. Seven bundled Commander Elena voice clips provide the arrival briefing and milestone updates, with subtitles, skip, replay, mute, and automatic pause when Journey opens. Surface missions retain their existing recorded voices.

A playable Mars prototype with first-person and third-person views. You are engineer Jin Park: diagnose a
power failure, clean three collectors, recover a rover battery, align the relay,
choose your reserve allocation, then shelter with the four-person crew.
The mission has three endings based on preparation and shelter decisions.

**Chapter 3: Tracks in the Dust** is playable in the unified expedition.
Continue after protecting Meridian in Before the Storm, or choose chapter practice
from Journey. On Sol 16, Jin and Amara prepare Rover Two, plan a traverse, manually drive
to Kestrel Ridge, inspect uncertain soil, complete on-foot field science, and return.
The habitat retains its backup battery; a charged spare powers the rover.
The thirty-sol command simulation is available inside the same Journey interface.

Mission 2 now guides eight stages: briefing, physical readiness, route planning,
two parked station reports, terrain inspection and a deliberate response,
field science, manual return with terminal transfer, and debrief. Follow the
amber active-object marker and current task distance. Arrival alone does not
complete interactive tasks. At the operations terminal, an optional 3D archive
loads the supplied Olympus Mons, Perseverance, Mars rover, and Mars globe reference models
with visible creator/license credits. No extra downloads are needed to play.

Mission 2 controls: WASD/arrows drive or walk; Space brakes; P sets/releases the
parking brake after stopping; E interacts or exits; V switches view; Shift toggles
Eco; M toggles the minimap; T opens Tasks; Help explains controls. Mouse wheel or +/− zooms. Expand the map while parked. To reverse, stop, release S, and press S again.

The HUD shows one compact current objective by default. Open Details for instructions or Tasks for the full checklist. The supplied concept rover is on the east equipment pad; approach to inspect it and switch the display to Perseverance. The Mars globe remains available in the operations terminal's optional reference archive and in the orbital Mars atlas; it is no longer a prop in the surface scene.
All five readiness checks include a real steering/stopping test. Resource units,
terrain response, reserve rules, and scoring are educational game simplifications.
See `MISSION-2-WALKTHROUGH.md` for the complete presentation route and
`MISSION-2-IMPLEMENTATION-PLAN.md` for the combined plan.
The latest gameplay/visual implementation is recorded in `MISSION-2-IMPROVEMENTS.md`;
supplied model provenance and optimizations are documented in `ASSET-REFERENCES.md`.

## Run from Windows Terminal / PowerShell

```powershell
cd "D:\CODE\Mission Control Jr\Mission Control Jr"
npm.cmd run dev
```

Open the URL printed in the terminal, normally http://127.0.0.1:5173/.
Click **Begin expedition**, then start arrival. Stop the server with **Ctrl+C**.
For a fresh extracted copy, run `npm.cmd ci` once while Vite is stopped. You can also run `./RUN-GAME.cmd`
from this directory; it installs dependencies if needed and opens the game.

Use Node.js 20.19+ or 22.12+ (the installed Node 22.14 is supported).
Use `npm` instead of `npm.cmd` on macOS/Linux. After extracting the ZIP,
change into its extracted game folder instead of the path above.
The game runs through a local HTTP server; opening HTML with `file://` does
not resolve development module imports.

## Controls

| Control | Action |
| --- | --- |
| WASD / arrow keys | Walk; cancels guided walking |
| Drag with the left mouse button | Look around |
| Mouse look button | Optional pointer capture |
| V / View button | Switch first person / third person; control the animated astronaut |
| E / nearby object click / action buttons | Interact |
| Location buttons | Walk around obstacles to a station |
| J | Journal with objectives and dialogue history |
| Escape | Pause/resume and release mouse capture |
| Pause / audio | Volume controls, mute, reduced motion, restart |

Interactions require proximity and a clear path to the object. Stay near a
collector while its cleaning brush runs. Menus pause mission time. After
diagnostics, you have six minutes before the dust front arrives automatically;
allocating reserves starts the storm earlier so a presentation can finish quickly.
The relay target is **1 / 2 / 3**. Prioritize life support for the strongest ending.
Inside the habitat, seal the airlock at the console, then transmit your status.
The status report also completes automatically if you wait inside.

## Included

- Dynamic dust, wind, lighting, solar tracking, rover docking and mast movement.
- Animated crew, conversation choices, inventory, resource consequences,
  working airlock, habitat interior and water shielding.
- Nineteen bundled English voice clips, subtitles, skip/replay, positional machine
  hum, footsteps, brush/repair/door sounds, breathing and a subtle synthesized pad.
- Original thirty-sol campaign at `/campaign.html`.
- Eight interactive model previews and all seventeen downloads at `/models.html`.
- Mission 2 includes four new original GLBs and nineteen separate Kokoro voices,
  manual rover controls, terrain/slip, route maps, a field camera, optional sample,
  four outcomes, checkpoint practice, and a competency debrief.
- A production build in `dist/`, editable model generators and regression tests.

The third-person camera follows Jin, pulls forward around equipment and habitat
walls, and supports the same movement, guided routes, repairs, and interactions.
Switching views preserves your position and mission progress. Drag to turn the
camera; WASD moves relative to its direction. The suit animates walking and repair.

The bundled voices were generated locally with Kokoro-82M voices and normalized
to 24 kHz OGG files. Captions continue if an audio clip cannot play.
No API keys or online services are needed during play. This prototype targets a
desktop browser with WebGL and keyboard/mouse controls.

## Build and verify

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

Preview normally opens at http://127.0.0.1:4173/. The production build includes
all models, textures, fonts/styles and audio. After an initial dependency install,
development and preview can run offline. Deploy the contents of `dist/` to an
HTTP static host; asset paths also support hosting beneath a directory.

## Editable assets

All seventeen self-contained models are in `assets/models/`. The ten Mission 1
models are `astronaut-animated`, `rover-dynamic`, `solar-array`, `battery`,
`terminal`, `junction`, `airlock`, `habitat-interior`, `water-tank`, and `eva-tool`.
The original `astronaut`, `habitat`, and `rover` remain included.
The animated suit uses separate moving mesh nodes rather than a skeletal rig.

```powershell
npm.cmd run models
# Or regenerate a selected model:
node scripts/generate-models.js solar-array
# Regenerate the four Mission 2 models and validate them:
npm.cmd run models:mission2
# Regenerate Mission 2 voices with the installed local Kokoro toolchain:
python scripts/generate-voices-m2.py
```

Geometry and material sources are in `scripts/model-designs.js` and
`scripts/mission-models.js`. Voice text is in `dialogue-lines.json`. To regenerate
the premium local voices, install Python, FFmpeg and the Kokoro dependencies,
then render the WAV staging clips:

```powershell
python -m pip install --user kokoro==0.7.4 soundfile transformers spacy phonemizer num2words
python scripts/generate-voices-kokoro.py --output assets/audio-kokoro
Get-ChildItem assets/audio-kokoro -Filter '*.wav' | ForEach-Object {
  $out = [System.IO.Path]::ChangeExtension($_.FullName, '.ogg')
  ffmpeg -hide_banner -loglevel error -y -i $_.FullName -af 'loudnorm=I=-16:TP=-1.5:LRA=7' -ar 24000 -c:a libvorbis -q:a 6 $out
}
Get-ChildItem assets/audio-kokoro -Filter '*.ogg' | Copy-Item -Destination assets/audio -Force
```

The older `scripts/generate-voices.ps1` remains available as a Windows SAPI
fallback. Regeneration tools are optional: generated GLBs and voice clips ship
with the game.


### Mars and Moon expansion

Run `npm ci`, `npm test`, then `npm run dev` to play locally; `npm run build` creates the static `dist/` build. If an existing `node_modules` was copied from another platform and the native Vite binding fails, run `npm ci` on the target platform. The campaign menu offers six Mars story missions, three separate lunar training missions and the Thirty Sols exercise. Direct static-host links can use `index.html?mission=lunar-sunlight` (and the other stable IDs in `mission-registry.js`); relative paths support deployment below a subdirectory.

Rebuild original expansion models with `npm run models:survival` and `npm run models:lunar`, and regenerate the normalized archived inputs with `npm run data:normalize`. Source records and assumptions are bundled under `public/data/` and copied into the production build. The mission numbers and physical constants are simplified educational models; see the Sources & Credits page for actual NASA context and limits.
