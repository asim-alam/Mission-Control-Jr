# Mission Control Jr. · Base Boss mission redesign

13 November 2026 · Design decision for the browser game

## How I’d rate the current mission at age 12

**4/10 as a game I’d choose to keep playing.** The rover and the moment you step out onto Mars would get me to try it. By the second delivery I’d be asking, “Did I make a decision, or did I just go where the map told me?” That is an adult’s design judgment from the intended player’s perspective. The observations come from reviewing the current build and playing the opening through the valve installation in Chrome in the previous pass.

The first quest has the beginnings of a good dilemma. The rough shortcut gets the valve to Verdant before the grow lights pause. The smooth bypass preserves more rover charge and delays the harvest. After delivery, though, the game recommends Forge. Both routes leave too little charge to reach Forge, even using the cheapest route. Recharge fills the battery at the cost of six mission minutes, so the battery difference between the two plans disappears. The long route’s harvest can also be made ready with a separate wait button. The outcome largely becomes a sequence of stops and confirmations.

| Opening route, from the standard 78% start | Cache to Verdant | Charge at Verdant after both legs |
| --- | --- | --- |
| Service cut | 140 game metres, 9.35 mission minutes, 40.62 percentage points | 23.0% |
| Wash bypass | 200 game metres, 13.37 mission minutes, 30.92 percentage points | 32.7% |

The cache-to-Verdant light window is about 10.96 mission minutes. The least battery-intensive Verdant-to-Forge route costs about 65.7 percentage points plus the 8% assisted-drive reserve. These are values calculated from the game at the marked stops. The metre scale and battery costs are authored. [Route and power rules](<Mission Control Jr/missions/base-boss/region.js:157>) · [Harvest rules](<Mission Control Jr/missions/base-boss/progress.js:65>) · [Recharge action](<Mission Control Jr/missions/base-boss/play.js:269>)

**Decision.** Remove battery depletion, forced charging stops, and towing as a routine part of the story mission. The rover comes back to a ready state for another sortie. Keep route choices where players can see what they gain, such as reaching a sensor before the stand-down or staying on a marked road. If a future expedition introduces rover range, preview the round trip in ordinary language and give the player a clear turn-back point before leaving.

## What the real proposals give us

| Source and status | What it describes | What to build from it |
| --- | --- | --- |
| **NASA Moon to Mars Architecture**, program planning, and **HEOMD-415**, a reference scenario | NASA selected fission as the primary surface power technology for initial crewed Mars missions. The reference scenario explores surface logistics and crew traverses, including the role of a pressurized rover. These documents support a staged expedition. [Architecture library](https://www.nasa.gov/architecture-definition/) · [Surface power decision](https://www.nasa.gov/wp-content/uploads/2024/12/acr24-mars-surface-power-decision.pdf) · [Surface operations reference](https://ntrs.nasa.gov/citations/20220000589) | Meridian is a compact, steady-powered hub. Auxiliary solar and a portable reserve supply a few remote loads. Use the existing rover for local jobs. A pressurized exploration rover can be a separate vehicle in a later expedition. |
| **SpaceX Mission: Mars**, company proposal | SpaceX describes early crews surveying resources, preparing landing surfaces, setting up power, and building habitats. It presents Starship as the transport for crew and cargo in a much larger settlement vision. [SpaceX Mission: Mars](https://www.spacex.com/mars) | Give the cargo pad a clear purpose. The landed shipment contains tools and modules the player can see installed. Borrow the cargo-first sequence and make the growth of the settlement visible. |
| **The Mars Society’s Mars Direct**, independent mission proposal | The design sends an uncrewed return vehicle ahead and proposes producing its propellant from local resources before sending people. [Original Mars Direct paper](https://www.marspapers.org/paper/Zubrin_1991.pdf) | Make “prove the equipment works before the next crew depends on it” an unlock condition. A future mission can commission a local resource pilot before expanding the base. |
| **NASA CHAPEA Mars Dune Alpha**, Earth analog, and **NASA Langley Mars Ice Home**, design concept | CHAPEA tests crew operations in an Earth habitat with dedicated work and living spaces. Ice Home proposes a transportable inflatable torus surrounded by water ice. [CHAPEA habitat](https://www.nasa.gov/humans-in-space/chapea/habitat/) · [Mars Ice Home](https://www.nasa.gov/centers-and-facilities/langley/nasalangley100-sojourning-to-mars/) | Use CHAPEA for room layout and Ice Home for Pathfinder’s distinct low, rounded silhouette and layered shield cutaway. The game’s small refuge is an adaptation of the concept. |
| **ESA MELiSSA**, research and pilot plant, and **NASA ISS water recovery**, demonstrated hardware | MELiSSA studies recovery of food, water, and oxygen in a closed loop. The ISS water recovery system provides an operational reference for reclaiming water. [ESA closed loop concept](https://www.esa.int/Enabling_Support/Space_Engineering_Technology/Melissa/Closed_Loop_Concept) · [ESA pilot plant](https://www.esa.int/articles/melissa-external-laboratory-pilot-plant) · [NASA ISS water recovery](https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/) | Build Verdant as a pressure module with grow racks, pipes, a clear water tank and a service bay. Show the water loop and lights respond to power. Packed food and stored water give the crew time to recover. |

## Recommended mission · First Night at Meridian

Your crew is getting ready to open its first outpost beyond the main habitat. You have one portable power pack. Where you connect it decides where the crew sleeps, what science gets done, and whether there’s a fresh meal at handover.

Dust has reduced auxiliary solar output. Meridian’s main systems are running on firm power. A **separate** space weather notice means the field crew must move inside before a scheduled stand-down. Pathfinder has an installed radiation shield, but its ventilation and checks need backup power before it can host the crew. Verdant needs that same pack for a full shift to run the water recycler and keep a crop already near harvest on schedule.

| When | What the player does | What they see |
| --- | --- | --- |
| **First 20 seconds** | Look out from the airlock. Reyes points to the two sites. Walk to the rover and board. | One useful line of radio dialogue and two recognizable buildings. No need to open the map to understand the problem. |
| **First minute** | Inspect the pack in the rover bay. Use the mission table or steering display to choose which site gets it. | Two plain-language options, each with an effect on the crew and tomorrow’s supplies. |
| **Next two minutes** | Drive or use assisted travel. Step out and connect the pack to the matching socket. Confirm the crew’s plan on the radio. | A lit cable trace, fan noise or grow lights, and crew who move or respond. The docking action commits the decision for that shift. |
| **Handover** | Check the crew, review the result, and choose the next recovery job. | A changed habitat, a fresh or delayed harvest, one log entry about what the crew gained and one about what it gave up. |

### The first real decision

| Power destination | What you gain | What you give up |
| --- | --- | --- |
| **Pathfinder refuge** | Run the ventilation, verify the shielded room, and shelter the field crew nearby. Their saved travel time can preserve a scheduled sensor observation **before** the outdoor stand-down. | Verdant switches to stored water. Its fresh harvest slips to a later shift, and the crew uses packed meals. |
| **Verdant water loop** | Run the recycler and keep the crop on schedule. The crew keeps its stored water for the next shift and has a tray of fresh greens at handover. | Recall the field crew early to Meridian’s existing shielded room. Their sensor observation is postponed. |

In both branches, a crew member confirms the assigned refuge. In the first scenario, both plans can work. If the player misses a commissioning check, Reyes calls the field team back to Meridian while there’s still time. The player keeps the expedition and loses the optional field observation. At handover, advance one simulated shift and show the effects side by side with the pre-shift plan. A second scenario starts with low stored water and enough notice for an early recall. The same equipment and map now favor a different plan. Compare the two runs by asking which resource made the difference.

**Radio script**

- **Reyes** — “We have one spare power pack. Pathfinder needs it for the shelter fans. Verdant needs it for water and tomorrow’s greens. Where should it go?”
- **Luca** — “Our shield is already in place. Once the fans and checks pass, we can stay here. If you need the pack at Verdant, tell us now and we’ll head back.”
- **Amara** — “I’ve got a tank of spare water and packed meals. We can wait a shift if the field team needs you.”
- **Noor** — “I sent the plan to Earth. Their reply will take about 22 mission minutes. I’ll bring it up when it arrives.”
- **Handover, Pathfinder branch** — “Everyone’s inside. We got the sensor reading. Verdant used a water reserve, so tomorrow’s first job is getting the recycler back online.”
- **Handover, Verdant branch** — “Everyone made it back to Meridian. Water’s flowing and the greens are ready. We’ll finish the survey on a clear shift.”

Keep the Earth reply moving while the player works. The game already has a bundled JPL Horizons calculation of about 11 minutes one way for its chosen date. Noor uses a local procedure to confirm the immediate plan. The later reply can give a forecast update that informs the next shift. [NASA communications delay paper](https://www.nasa.gov/wp-content/uploads/2024/01/mars-communications-disruption-and-delay.pdf) · [Bundled light time](<Mission Control Jr/data/normalized.json:13>)

## What the world should look like and how it grows

- **Meridian** has two connected pressure modules with a readable airlock, a warm crew room, and a map wall. A separate fission power installation feeds the hub. Let players trace the power line from the overlook.
- **Pathfinder** has a low ring or berm with a cutaway showing shield layers, a short pressure vestibule, a fan grille and an occupied shelter indicator. The pack powers the fans and checks. The shield itself is passive.
- **Verdant** has an insulated pressure shell with an inspection window into lit grow racks. Place the recycler, water tank and grow lights along one visible route so a child can follow what their power pack changed.
- **Forge** has a gantry and equipment yard. **Landing Cache** is an uncrewed cargo pad, and **Kestrel** is marked by its ridge mast. In a later chapter, Forge installs a second power pack and connector from the cargo pad. The upgrade opens a new decision about which facility gets the next expansion.

The larger RPG should grow by commissioning working facilities. A relay upgrade lets the player dispatch remotely. A stocked shelter makes a longer traverse possible. A resource survey later unlocks a pilot plant. JPL’s SWIM map can teach players to read where ice is likely on a separate future landing-site survey. Perseverance’s MOXIE can inspire a small oxygen demonstration. Label Meridian’s site and its survey results as fictional. [NASA/JPL SWIM map](https://www.jpl.nasa.gov/images/pia26045-swim-map-shows-subsurface-water-ice-on-mars/) · [NASA/JPL MOXIE results](https://www.jpl.nasa.gov/news/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/)

## What I’d build first

Build the two branches in one **five-to-seven-minute browser mission**, using the existing region, rover, and walking controls. Add one working socket at each destination, one clear world change per branch, and a replay option at the handover. Keep the opening HUD to the pack’s destination, stored water, and crew shelter status. Make the trade-off available through keyboard, touch, and assisted travel.

Use two short source cards after the relevant decisions. One shows Mars Climate Sounder’s 2018 dust record and explains what less sunlight did to solar generation. The other shows Curiosity’s May 2024 radiation observation and explains why the crew went indoors. The records are from different events. The combined story, deadline, pack capacity, crop schedule and water use are game rules. The source cards should sit next to the outcomes they explain. [JPL 2018 dust observations](https://www.jpl.nasa.gov/images/pia22737-mars-climate-sounder-studies-2018-dust-storm/) · [JPL 2024 solar storm observations](https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/)

Put the prototype in front of children in both age bands from the challenge. Watch for an unaided first decision and ask **“If you sent the pack to the other base, what would happen?”** after the ending. A player should be able to name the gain and the cost in their own words. That is the clearest demonstration for judges that life support, power, shielding, food and radio delay are part of the game. The challenge brief used for this review is the supplied copy. [Challenge text](</home/asim/.codex/attachments/26bb303a-5cb7-4ba8-80a9-bc80b0bb4b8a/Pasted text.txt>) · [Space Apps challenge page](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/)
