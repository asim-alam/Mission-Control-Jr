# Tracks in the Dust — Play and present Mission 2

## Run

```powershell
cd "D:\CODE\Mission Control Jr\Mission Control Jr"
npm.cmd run dev
```

Use the actual Local URL printed by Vite. Select **Mission 2 · Tracks in the Dust**,
or append `/mission2.html` to that URL. If dependencies are not installed, run
`npm.cmd ci` first, with the previous dev server stopped. Do not reinstall
dependencies while Vite is using its native binding.

For a production check: `npm.cmd run build`, then `npm.cmd run preview`.
Use the printed preview URL and `/mission2.html`.

## Recommended demonstration

1. **Begin expedition**, read Elena's briefing, and accept the mission. This uses
   the prepared Mission 1 ending as canon. It is Sol 16. Jin and Amara travel;
   Elena and Luca support them from Meridian. The HUD names the current action
   and its range, with an amber marker at the relevant station.
2. Walk to the R2 supply rack, collect the spare, then carry it to the rover's
   battery bay and latch it. The habitat keeps its backup. At the highlighted wheel
   station, inspect then secure the discovered pin. At the mast, inspect then clean
   the lens. At the operations terminal, verify the kit, suits and local radio.
   **Walk to highlighted station** offers guided walking at the outpost; WASD or
   arrows take over immediately. Equipment actions require proximity on foot.
   The terminal also offers an optional rotatable **3D Mars reference archive**
   containing all three supplied models, with source/creator/license credits.
3. Click **Drive Rover Two · board (E)**. The route picker opens as soon as you
   board. Choose a path before driving; there is no test-drive step. North Wash is
   the gentler route for a first trip. Follow the selected orange beacons and map bearing.
4. Drive manually with WASD/arrows. W accelerates; S brakes before reversing.
   Release and reapply S after stopping to reverse. V shows the driver-eye view;
   V again shows both suited astronauts in third person. Shift enables Eco.
5. Stop and set P at **both named report stations**, then explicitly transmit each
   report. Arrival alone never completes the task. Read the actual ground, heading
   and forecast reserves in the feedback/journal. Missed reports remain required.
   At the marked observation point, inspect the uncertain ground, then open the
   terrain response review. A shortest-line claim receives corrective feedback.
   Choose the surveyed firm perimeter or abort and return. The wash/direct route
   uses the west perimeter; the rim route uses an east detour around the boulders.
   The revised bearing guides the vehicle. The hazard is avoidable. If entered, stop adding throttle;
   a shallow edge allows a checked low-speed retreat. Continued forcing can
   suspend training. A checkpoint retry is clearly labeled as assisted practice.
6. Reach the Kestrel parking area. Stop, set P, select **Park · start field science**,
   and exit. Amara remains at the rover. Walk to the scale marker in front of the
   outcrop. Walking is intentionally slower than driving.
7. Use **Frame context image**. Drag to place both units inside the field-camera
   box and capture. Walk closer (within 12 m) for **Frame contact + scale**.
   Its lens is narrower. Include the contact and scale; adjust your aim and capture.
   Camera captures produce real scene thumbnails for the debrief.
8. Write the evidence-based description: dark unit below pale layers; boundary
   mapped; formation uncertain. Appearance alone does not prove water or life.
9. Review the optional fragment. Collection requires standing within 4 m of its
    marker and sufficient forecast reserves. It costs 18 simulated seconds and
    one charge unit. A complete observation record needs no physical sample.
    You can close the review, approach the marker, and reopen it.
10. Choose **Return**, reboard, and follow the homeward wash shown on the map.
    The route approaches the apron around the habitat. Read distance, bearing,
    and local map coordinates. Drive the vehicle yourself; there is no autopilot.
11. At Meridian, stop, set P, and **Secure Rover Two at Meridian**. This begins
    post-drive work. Exit, walk to the operations terminal, **Transfer expedition
    record**, then **Confirm both crew · debrief**. Review the actual path,
    competencies, reserves, photographs and science record. Answer the reflection
    question or practice from the last safe checkpoint.

For a live voice-over, set **Pause / audio → voice volume** to zero. Music/motor
effects can remain low. Captions and the journal stay available. Menus pause the
simulation. Losing window focus also pauses the expedition and clears held keys.
The game automatically reduces render quality if sustained slow frames are detected.

## Outcomes

- **Tracks home:** Required observation record complete; both crew returned;
  at least 20 battery and suit training units remain. The fragment is optional.
- **A prudent return:** Safe return with margin, but science incomplete. A justified
  abort is supported rather than punished as an astronaut failure.
- **Home, with a lesson:** Return completed below the planned reserve margin.
- **Stop. Understand. Try again:** Budget depleted or training immobilization;
  review and retry a safe checkpoint. No unsupported instant rescue is claimed.

Completion summaries are stored separately from the campaign. Saving is optional;
restricted/corrupt local storage cannot prevent play. Mission 3 is identified as
planned. Physics, simplified resource units, and assessment are original game rules,
not agency validation or real Mars operational limits.

Navigation credit grows with demonstrated driving, reaching its full allowance
after 100 expedition metres. An immediate abort cannot earn full navigation credit
from a few metres on the apron. Ground-reassessment credit requires a recorded
terrain observation. Safe return and incomplete science remain separate results.
