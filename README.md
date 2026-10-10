# Mission Control Jr. — Before the Storm

A playable first-person Mars prototype. You are engineer Jin Park: diagnose a
power failure, clean three collectors, recover a rover battery, align the relay,
choose your reserve allocation, then shelter with the four-person crew.
The mission has three endings based on preparation and shelter decisions.


<img width="1600" height="795" alt="image" src="https://github.com/user-attachments/assets/d2b4c2d9-59ef-4bbe-b375-2852cc0b15b3" />




## Run from Windows Terminal / PowerShell

```powershell
cd "D:\CODE\Mission Control Jr\Mission Control Jr"
npm.cmd ci
npm.cmd run dev
```

Open the URL printed in the terminal, normally http://127.0.0.1:5173/.
Click **Begin Mission**, then **Start EVA**. Stop the server with **Ctrl+C**.
On later runs, use only `npm.cmd run dev`. You can also run `./RUN-GAME.cmd`
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
- Six interactive model previews and all thirteen downloads at `/models.html`.
- A production build in `dist/`, editable model generators and regression tests.

The voices were generated locally with installed Windows speech voices and are
bundled as OGG files. Browser speech synthesis and captions provide a fallback.
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

All thirteen self-contained models are in `assets/models/`. The ten new mission
models are `astronaut-animated`, `rover-dynamic`, `solar-array`, `battery`,
`terminal`, `junction`, `airlock`, `habitat-interior`, `water-tank`, and `eva-tool`.
The original `astronaut`, `habitat`, and `rover` remain included.
The animated suit uses separate moving mesh nodes rather than a skeletal rig.

```powershell
npm.cmd run models
# Or regenerate a selected model:
node scripts/generate-models.js solar-array
```

Geometry and material sources are in `scripts/model-designs.js` and
`scripts/mission-models.js`. Voice text is in `dialogue-lines.json`. To regenerate
voices on Windows, install FFmpeg and run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/generate-voices.ps1
```

Regeneration tools are optional: generated GLBs and voice clips ship with the game.

