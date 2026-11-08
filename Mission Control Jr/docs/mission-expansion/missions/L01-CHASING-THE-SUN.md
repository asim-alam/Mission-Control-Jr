# L01 — Chasing the Sun

ID `lunar-sunlight`; Moon chapter 01; fictional Horizon Outpost near the lunar south pole. Target 6–8 minutes. This opens a separate lunar training campaign, not a continuation that relocates Mars supplies.

## Learning goal and NASA basis

Teach that low-angle sunlight, terrain shadows, battery capacity, cable reach, and work time interact. Use S07 lunar illumination/LOLA products and S09 environment material; S08 Diviner is optional temperature context. These sources support physical constraints and site comparison, not a guaranteed exact forecast for a fictional camp.

Start with two or three real, documented coarse site-patch summaries in a reference overlay. Place the playable base on explicitly authored local terrain. A long-term illumination percentage is labeled “long-term model average,” never “tomorrow's sunlight.” The short scenario shadow schedule is authored unless a properly validated dated horizon calculation is delivered.

## Scene / required artifacts

Build and integrate a lunar habitat variant, `polar-solar-mast.glb`, `battery-cart.glb`, `cable-reel.glb`, and a deterministic terrain/ridge patch. Reuse astronauts and suitable existing battery/airlock geometry. Use a dark sky, low Sun, gray regolith, long shadows, and readable edge markers. No wind, airborne dust storm, or orange Mars fog.

Place three physical collector stations: **near pad**, **ridge pad**, and **reserve-only shelter**. The ridge route must be traversable with the cart and have a measurable cable path, not just straight-line distance through a wall. Optional thermal context must not imply exterior surface temperature equals cabin temperature.

Primary indicators: battery energy, served essential power, next shadow interval. Air reserve is shown if essential loads are interrupted.

## State / authored scenario

Fields: `collectorLocation`, `collectorDeployment`, `cableRoute`, `cableLengthUsed`, `batteryCartLocation`, `siteExposureFactor`, `shadowIntervals`, `essentialLoadPolicy`, `optionalScienceProgress`, `crewWorkSeconds`.

Use an accelerated two-hour service window with an explicitly labeled jump through a later low-light interval. Agents choose final energy/load values after balancing. Required constraints: the near pad needs less setup but has a longer authored interruption; the ridge pad requires more work/cable but offers a better modeled generation window; the reserve-only plan can finish a reduced-objective exercise by shutting down optional work. Battery cannot supply all optional loads through every interval without planning.

Site comparison uses a verified S07 product value as a contextual/average-exposure modifier. Exact event times and equipment power remain authored. Transport and deployment advance the same simulation clock as resource use.

## Mission script

| Beat | Trigger / action | Original dialogue / copy | Consequence |
|---|---|---|---|
| 1: Arrive | Campaign entry | Elena: “Welcome to Horizon, our lunar training outpost. Here, a nearby ridge can hide the Sun.” | Explain separate assignment; establish Moon-specific visuals |
| 2: Inspect | Look at collector shadow and battery | Jin: “The panels are working now. The battery must cover the time when they are shaded.” | Start forecast with real energy units and simple labels |
| 3: Compare sites | Use terrain table/reference overlay | Elena: “This NASA map summarizes illumination over a long period. Our short practice schedule is shown separately.” | Distinguish source product and authored event timeline |
| 4: Choose plan | Select near/ridge/reserve-only policy | Jin: “The ridge needs more cable and setup. The near pad is quicker, but shaded for longer.” | Commit work order with visible forecast and cost |
| 5: Execute | Cart move, mast deploy, cable connect | Elena: “Keep the return path clear. A deployed panel only helps if the cable reaches the outpost.” | Charge time; generate power only when configured, connected, and illuminated |
| 6: Shadow arrives | Scheduled interval | Luca: “The battery is carrying the habitat. Which optional load can wait?” | Show real discharge; allow load shedding and reconsideration |
| 7: Check future margin | Forecast after the interval | Jin: “We can finish the survey or keep a larger reserve for the next shadow.” | Second consequential choice, not a forced maximum-science reward |
| 8: Review | Service window ends / prudent finish | Elena: “Your location, cable, and power plan worked together. Let's see the reserve.” | Result based on served loads, reserve, and optional progress |

## Branches and actions

**Near pad plus conservation:** lower setup cost; more optional work paused during shadow. **Ridge pad:** greater setup/cable cost; more generation potential. **Reserve-only reduced exercise:** no relocation, less science, deliberate load reduction. At least the first two must be viable after tuning; the third must remain a clear prudent option when available.

Actions: `inspectPower`, `compareSites`, `choosePad`, `attachCart`, `transportCollector`, `deployMast`, `routeCable`, `connectPower`, `setLoadPolicy`, `advanceInterval`, `finishService`. Validate available cable length and route, not only a boolean connected flag. Repeated deployment cannot multiply generation. Reorienting a panel cannot overcome a blocked horizon.

State flow: `brief → survey → plan → relocate/deploy-or-conserve → shadow-interval → verify → debrief`. Work can be interrupted by a shadow; do not freeze power while the cart animation runs.

## Endings and replay

- **Continuous essentials, survey completed:** “Your setup and reserve kept the habitat supplied while science continued.”
- **Power protected, survey shortened:** “You paused optional work to keep energy for the shadow.”
- **Safe reduced exercise:** “You stayed with stored energy and ended early. The relocation remains for another session.”
- **Training power limit:** “Essential power lost its planned margin. Compare setup time and the shadow interval.”

Show generation/consumption/storage across the actual timeline, chosen source patch, cable/work cost, and optional progress. Replay pad choice with the same timeline. Return energy reserve and hardware location to L02 through an explicit Moon carry schema.

## Acceptance tests

Moon starts without Mars supplies; panel output depends on connection/deployment/illumination; cable limit enforced; energy integration includes transport; two viable plans; average map values never labeled as hourly observations; shadow animation agrees with the declared authored schedule; pause/save/restart and campaign navigation work. Provide browser proof of the actual mast, cart, deployed cable, shadow transition, and resulting battery change.
