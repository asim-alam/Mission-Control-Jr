# Mission Control Jr: challenge assessment and competition roadmap

Prepared 8 November 2026, Asia/Dhaka.

## Assessment status and limits

Updated after the user supplied the actual game directory: `/home/asim/CODE/Mission Control Jr/Mission Control Jr`. This supersedes the initial assessment's missing-source limitation. The pre-expansion findings below are retained as a historical baseline; the current audit and the linked implementation-status record take precedence for present-day behavior.

The complete challenge Details brief was read from the user's attached PDF, including its objectives and optional considerations. The supplied video transcript was reviewed as user-provided reference material; the video could not be independently retrieved. The official challenge URL was found in search, but full-page retrieval failed. The PDF contains the Details tab, not the Resources tab. The datasets below are independently researched recommendations, not a claimed transcription of the official Resources tab.

The original pre-expansion source, state controllers, references, build configuration, and tests were inspected; that baseline had 95 passing tests. After the requested expansion and fixes, the current project has **178 passing tests**, a successful clean-install production build, a packaged archive with CRC checks, and browser checks of all six new mission routes, first-station actions, and active-save recovery. A full Chasing the Sun browser path completed. Hardware ANGLE on an Intel UHD 620 held about 60 fps across all six missions in Standard and Low Effects at the tested viewport; the display paced the sample near 60 Hz, so uncapped throughput and repeated chapter-switch costs remain unmeasured. Human path/age validation remains open. Current evidence is tracked in [`docs/mission-expansion/implementation-status.md`](docs/mission-expansion/implementation-status.md).

The original dependency folder lacked the Linux Rolldown native binding during baseline assessment. The current source build and packaged deployment now include the Sources page, learning objectives, NASA provenance, mission artifacts, and generated models. The build still warns that the shared GLTFLoader chunk exceeds 500 kB; performance measurement and optional code-splitting remain open.

**Current verdict:** strong fit to the challenge concept and a much closer match after expansion. It now has three original Mars missions, three separate Moon missions, the three existing Mars story chapters, and the separate Thirty Sols exercise. It models finite power and consumables, crop stages and harvest supplements, queued Earth replies, radiation exposure and partial shielding, Moon lighting and terrain-blocked communication, and archived NASA-derived context with openly labeled authored gameplay assumptions. This is a qualitative assessment against the challenge brief, not an official score; age-range learning, model calibration, alternative-path balance, and uncapped/resource performance still need validation. The older current-game matrix below records the pre-expansion state and must not be mistaken for this verdict.

## Current audit after the requested expansion

| Challenge area | Present implementation | Remaining evidence gap |
|---|---|---|
| Interactive outpost choices | Nine story chapters across the Mars and Moon campaigns, plus Thirty Sols; key choices change resources, mission state, and debrief. | Full-browser alternative/recovery/replay walkthroughs across every chapter remain open. |
| Power, air, water, and crew safety | Finite budgets and time costs, reserve limits, reduced objective/turnaround branches, water mass conservation, radiation attenuation, and nonlethal training condition in Thirty Sols. | Validate thresholds and two viable strategies in real play; no educational or clinical accuracy claim is made. |
| Food production | Existing crop stages carry from greenhouse work into the Earth-delay chapter; light, water, time, stress, and harvested supplement are modeled. | Review the accelerated crop timing and child comprehension with an educator or domain reviewer. |
| Communication delay | Earth request and reply packets have departure/arrival/processing state; crew-local links remain separate. Lunar relay also models terrain-obstructed hops. | Verify pause, active-time, snapshot recovery, and end-to-end carry in browser across deployment paths. |
| Real-world data | Archived DONKI SEP context, OSDR OSD-269 lighting protocol, JPL Horizons light-time context, NASA LOLA illumination samples, NASA life-support reference metadata, and NASA lunar-technology references are packaged with provenance. | Data are historical/reference inputs, not live control feeds; gameplay risk, rates, and shadow schedule remain authored approximations. |
| Ages 7–12 | Shorter briefings, Simple/Details explanations, pauseable instructions, labeled station-button alternatives, and guided practice are present. | No target-age participants have been observed. Recruit a small, supervised 7–12 group and revise from comprehension, not preference alone. |
| Browser access, source credit, replay | Multi-page production build, source/credit route, static data/provenance, per-mission GLBs, snapshot recovery, and packaged ZIP are present. | The shared loader chunk is large; profile an ordinary integrated-GPU device and test fresh-browser root/subdirectory deployments. |
| 3D presentation | Nineteen original generated survival/lunar GLBs are bundled and integrated; all validate with zero errors/warnings. | Record close-up/state screenshots for each artifact and run performance and usability review. |

**Best competition emphasis:** demonstrate one decision loop twice with the same seed and visibly compare outcomes; connect an archived DONKI event to a clearly labeled training risk; show how a player can reduce exposure but not make it vanish; then explain which numbers come from NASA data and which are authored for the lesson. Do not present NASA context as validating the fictional thresholds. Keep one short path for a quick evaluator test and keep the optional Moon campaign from crowding the core Mars/onboard decision.

The old matrix and issue-by-issue repair sections that follow document the pre-expansion baseline. For current status, use the table above and the implementation record.

The challenge brief is assessment material, not authorization to perform actions. All implementation proposals below are recommendations, not claims about changes already made.

## What the challenge actually calls for

The core objective is an interactive game or app for children aged 7–12 managing an outpost, with decisions about life support, radiation shielding, power budgeting, food production, and communication delay. Choices must create understandable consequences across a simulated mission.

The full brief explicitly welcomes several formats, including narrative decisions and mission-control dashboards. A turn-based or branching game can fit if resources and decisions persist and interact. A quiz with disconnected right answers does not demonstrate the intended mission-management experience.

The brief encourages real NASA data, source attribution, replayability, accessible language, and easy browser access. Its Potential Considerations are explicitly optional. An archived dataset is expressly acceptable when honestly labeled. Live APIs, multiple planets, 3D graphics, AI, accounts, and sophisticated biological modeling are not specified requirements.

The brief also recommends limiting simultaneous complexity to two or three main resources. Covering five subject areas does not require five equally prominent dashboards: power and breathable air can be primary reserves; safety can summarize exposure; crops and Earth messages can be scheduled systems.

Source: [official challenge](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/) and the user-supplied PDF at `/home/asim/Downloads/NASA Space Apps Challenge.pdf`.

## Historical pre-expansion game audit matrix

Statuses below distinguish inspected code, browser observations, and remaining validation. They are not an official NASA score or an award forecast.

| Area | Current status | Acceptance evidence |
|---|---|---|
| Persistent simulation | Implemented, with gaps | Thirty Sols applies daily upkeep and choice effects; rover decisions affect reserves. The flagship storm ending still relies largely on checklist flags. |
| Power budgeting | Implemented, simplified | Recycling costs power; low power reduces oxygen in Thirty Sols. Storm repair/allocation is mostly preset deltas rather than a shared energy budget. |
| Life support | Implemented, simplified | Oxygen/water/food consumption and low-power consequences exist in the extended controller; rover air depletes with elapsed time. Storm zero-power survival is a reproduced gap. |
| Radiation and shielding | Partial | Sol 24 shielding choices affect Sol 27; any shelter flag grants zero injury. No exposure accumulation, graded attenuation, or source-driven event. |
| Food production | Partial | Daily food use, greenhouse work, and a delayed fictional fungus outcome exist. No crop-growth, lighting, or harvest model. |
| Communication delay | Narrative only | Route planning displays a 12-minute one-way scenario delay; no Earth request/reply queue or arrival state is present. Local crew radio is correctly a separate interaction. |
| NASA integration | References present; data-driven mechanics absent | Sources and debrief links explain concepts. State rates and scenario events are authored; no DONKI/OSDR/REMS/Horizons input path was found. |
| Scientific validity | Mixed | Mars setting and simplification labels are appropriate. Absolute shelter protection, disappearing shielding water, and outcome rules need revision. |
| Child usability | Partly supported; target-age testing pending | Voices, captions, guided walking, pause and simple/details controls help. Documentation targets 10–14; much task text remains technical. |
| Learning feedback | Implemented, with inaccurate branches | Decision/system/crew/mission debriefs exist. Early-shelter reporting can describe choices never made. |
| Replay | Implemented; comparison missing | Chapter replay and rover checkpoint restoration exist. Thirty Sols uses unseeded randomness and there is no same-event side-by-side outcome comparison. |
| Delivery | Source builds cleanly; packaging fixes needed | 95 tests pass and fresh-copy build succeeds. Sources/credit pages are absent from production; original installed dependencies cannot start on Linux. |

## Historical pre-expansion findings and proposed fixes

### Keep these existing strengths

The game already has a connected Mars campaign, a short demonstration entry, voiced/subtitled characters, first/third-person controls, guided movement, pause/reduced-motion options, mission debriefs, persistence, and rover checkpoint practice. The rover model ties terrain, distance, elapsed time, battery, air, optional sampling, and return reserves together. These are valuable systems-thinking mechanics. The thirty-sol mode already contains the beginning of the requested outpost-management model.

Retain the storm chapter as the central presentation route. The orbital repair/docking and rover science chapters are supporting depth; building more of them will not resolve missing food, radiation, NASA inputs, or communication delay in the short route. The current “Quick demo” button launches storm only, while food and radiation are located in optional Thirty Sols.

### P0: the storm's research trade-off is not mechanically complete

Evidence: [mission.js:66](/home/asim/CODE/Mission%20Control%20Jr/Mission%20Control%20Jr/mission.js:66), [mission.js:21](/home/asim/CODE/Mission%20Control%20Jr/Mission%20Control%20Jr/mission.js:21), and [journey-state.js:13](/home/asim/CODE/Mission%20Control%20Jr/Mission%20Control%20Jr/journey-state.js:13).

Life support sets oxygen to 95 and morale to 84; research sets them to 55 and 75. Both paths have the same power value after the same preparation. There is no research-progress or experiment-preserved field, and the later carry reader ignores the saved allocation. The debrief promises preservation of the experiment, but the controller records no corresponding benefit. Under the current completion rules life support provides the stronger result.

Fix: track experiment/crop progress as a real benefit, give the two allocations different future effects, and carry those effects into a later checkpoint or chapter. Alternatively remove the claim of a meaningful science benefit until it is implemented. Acceptance: replaying the choice changes both a resource cost and a downstream benefit, not just the ending label.

### P0: zero-power state can still earn the strongest storm ending

Evidence: [mission.js:21](/home/asim/CODE/Mission%20Control%20Jr/Mission%20Control%20Jr/mission.js:21) and [mission.js:100](/home/asim/CODE/Mission%20Control%20Jr/Mission%20Control%20Jr/mission.js:100).

A controller probe prepared the life-support path, set power to zero, entered and sealed shelter, advanced five seconds, and reported. The result was `prepared`, with power 0 and oxygen 95. This is a state-injection check of the model's response, not a claim that normal prepared play necessarily reaches zero power. Power depletion does not constrain the protected ending or sealed-habitat oxygen use.

Fix: define which systems lose output at low energy and apply reserve depletion on the shared clock. Evaluate the resulting safety/reserve state at completion. Acceptance: an empty battery cannot imply operating powered life support without an explicitly modeled alternative.

### P1: debrief and cross-chapter facts can disagree with player actions

Evidence: [demo.js:269](/home/asim/CODE/Mission%20Control%20Jr/Mission%20Control%20Jr/demo.js:269), [demo.js:280](/home/asim/CODE/Mission%20Control%20Jr/Mission%20Control%20Jr/demo.js:280), [mission2.js:9](/home/asim/CODE/Mission%20Control%20Jr/Mission%20Control%20Jr/mission2.js:9).

The default inventory flag `battery:false` means “not currently carrying a battery,” but the debrief tests `battery===false` as though it proves recovery/use. Early shelter before battery recovery has `battery:false`, `installed:false`, and `allocation:null`. The debrief can therefore say the rover battery supported the habitat and the experiment received reserve power, even though neither happened. The prepared path also gets reduced-rover-charge wording while its actual next-chapter model starts at the default 100 charge; only survived/evacuated outcomes reduce that charge.

Fix: save explicit facts such as `batteryRecovered`, `batteryInstalled`, and `allocation`, and use one carry schema in both narrative and mechanics. Handle “unallocated” explicitly. Acceptance: early shelter reports no allocation/recovery, and every described carry consequence matches the next mission state.

### P0: communication delay must become an actual scheduled system

Evidence: [mission2-demo.js:83](/home/asim/CODE/Mission%20Control%20Jr/Mission%20Control%20Jr/mission2-demo.js:83) and [mission2.js:8](/home/asim/CODE/Mission%20Control%20Jr/Mission%20Control%20Jr/mission2.js:8).

The 12-minute Earth delay appears in route-planning text. The state has no Earth-message queue, outgoing/return arrival times, or reply-dependent action. Immediate Elena/Amara local radio should remain immediate; the missing mechanic concerns Earth.

Fix: add a queued Earth request and a meaningful local choice before its answer returns. If the delay is 12 minutes one way, a response cannot arrive after only 12 total minutes. Use explicit mission-time compression or a short time skip while resources still update. Acceptance: waiting has a cost, local decisions remain available, and message status changes on the simulation clock.

### P0/P1: improve food and shielding with bounded, transparent models

Evidence: [story.js:44](/home/asim/CODE/Mission%20Control%20Jr/Mission%20Control%20Jr/story.js:44), [story.js:56](/home/asim/CODE/Mission%20Control%20Jr/Mission%20Control%20Jr/story.js:56), and [main.js:251](/home/asim/CODE/Mission%20Control%20Jr/Mission%20Control%20Jr/main.js:251).

Greenhouse work grants 8 food and costs 3 water without a lighting/power or growth-stage model. The fungus storyline has delayed consequences, which is useful, but it is fictional and not an OSDR-grounded crop simulation. Shield construction subtracts 15 water as if the water disappears; every shelter flag then eliminates all modeled radiation injury. The reported “dosimeters stay in safe ranges” claim is unsupported by a dose model.

Fix: add an established crop's next-harvest progress, energy/water costs, and an explicitly accelerated timeline. Treat shielding water as moved or temporarily unavailable, with a persistent mass inventory. Use graded exposure reduction or clearly named qualitative exposure categories. Replace absolute safety claims with bounded model descriptions.

### P1: the production Sources page is missing

Evidence: [vite.config.js:29](/home/asim/CODE/Mission%20Control%20Jr/Mission%20Control%20Jr/vite.config.js:29), [sources.html:3](/home/asim/CODE/Mission%20Control%20Jr/Mission%20Control%20Jr/sources.html:3).

The campaign links to `sources.html`, but Vite's multi-page inputs omit it. Neither the supplied `dist` nor a clean production build contains that page, `ASSET-REFERENCES.md`, or `LEARNING-OBJECTIVES.md`. A plain static server returned HTTP 404 for all three paths. Hosts with catch-all rewrites may show the game instead, which still does not provide the intended references.

Fix: include the source page in the build and publish the credit/objective content as HTML or copied static documents. Acceptance: a freshly built static deployment serves the actual reference content and every credit link resolves.

### P1: update audience assumptions and validate them

Evidence: [LEARNING-OBJECTIVES.md:3](/home/asim/CODE/Mission%20Control%20Jr/Mission%20Control%20Jr/LEARNING-OBJECTIVES.md:3), [campaign.html:17](/home/asim/CODE/Mission%20Control%20Jr/Mission%20Control%20Jr/campaign.html:17).

The learning document explicitly targets approximately 10–14 and says the official brief has no precise age range. The new brief specifies 7–12. Simple/details currently changes selected debrief explanations rather than providing a fully distinct low-reading-load mission. Seven resources, four crew HP/fatigue displays, and procedural controls create a substantial learning burden.

Fix: correct the brief interpretation and stale challenge link, then simplify the flagship path with three main status displays, shorter instructions, and progressive disclosure. Preserve the existing voices/captions/pause/guided navigation. Child comprehension remains unmeasured until a target-age test is run.

### P1: strengthen replay and balance verification

Existing tests verify important controller and navigation behavior but do not validate the scientific calibration or child learning. Thirty Sols uses unseeded `Math.random()` for accidents and crew selection, so two replays cannot cleanly isolate a changed decision. Its log is truncated to six entries, and the ending takes only a subset of those entries, limiting a complete decision review.

Fix: add seeded scenarios and a durable decision history, then run representative full-mission strategies to check resource balance and reachable outcomes. Preserve the useful rover checkpoint implementation. Acceptance: a same-seed replay compares actual outcomes and key early decisions remain in the final review.

## Revised implementation order for this game

1. Repair production reference packaging and action-accurate debriefs. These are small, directly verifiable fixes.
2. Fix the flagship storm model: a finite power budget, air consequences, and a real research/crop benefit.
3. Import one archived DONKI scenario with provenance; add a separate radiation/shelter choice without conflating a dust storm with a particle event.
4. Add a queued Earth request/reply with resource consequences while waiting.
5. Bring an established-crop checkpoint into the short judging route, informed by OSD-269 and transparent game assumptions.
6. Add same-seed replay, preserve decision history, and verify representative strategies.
7. Run target-age playtests, fix observed confusion, then prepare the presentation and submission.

The broad roadmap below remains a design reference. Treat its mechanic descriptions as acceptance targets to strengthen the existing implementation; several foundations are already present and do not need rebuilding. The highest-priority data connection is DONKI → a real event-driven decision. The next is life-support reference assumptions → the existing upkeep rules, followed by crop timing and communication geometry. More decorative reference models are a lower priority.

### How to calculate readiness after access is available

Use this internal prioritization score, not an official NASA rubric or probability of winning:

| Criterion | Weight |
|---|---:|
| Coupled trade-offs and persistent consequences | 25 |
| Power | 10 |
| Life support | 10 |
| Radiation/shielding | 10 |
| Food | 5 |
| Communication delay | 5 |
| Traceable NASA inputs | 10 |
| Age-appropriate usability | 10 |
| Replay | 5 |
| Technical reliability | 5 |
| Learning feedback | 5 |
| **Total** | **100** |

For each criterion assign 0 = absent, 1 = visible but superficial, 2 = working with weaknesses, 3 = demonstrably working and explained. No aggregate percentage is assigned in this review: child usability and complete-playthrough validation remain pending. Weighted score = sum(weight × level / 3). Leave unknown criteria unknown; never turn lack of access into a zero or a passing score. Report evidence coverage alongside any eventual score.

## Recommended product direction

Retain the current game's setting and technology if they already support an outpost simulation. If no setting has been committed, Mars is a useful default because atmospheric conditions and long communication delays create clear decisions. Do not spend the short build window implementing a second world.

Target a five-to-eight-minute mission with one outpost, three main status displays, three or four significant decisions, and a replayable debrief. These are proposed design targets, not NASA requirements.

Suggested pitch: **Mission Control Jr turns NASA observations into outpost decisions children can replay, so they can see why protecting one resource can put another under pressure.**

### The distinctive feature: replay the same decision

After a mission, let the player return to one decision with the same initial state and event sequence. Compare the actual outcomes side by side: energy remaining, air reserve, exposure category, and crop progress. Explain one causal difference in a sentence. This is a more defensible learning demonstration than a generic points total or a fact quiz.

Keep NASA observations separate from the educational model. A replay can prove that choices changed the simulation; it does not prove the simulation predicts an actual crew's health.

## Mechanic specification and priority backlog

### P0: one coherent, explainable mission

**P0-1. Establish the simulation state and clock.** Use a single update function for resource changes and actions. Store mission time, energy, oxygen reserve, crew location, crop progress, food reserve, pending messages, and event state. Prevent resource creation from repeated clicks or inconsistent updates. Support pause and restart. Use fixed scenario inputs or seeded randomness for reproducible replay.

Acceptance: identical starting state, actions, and seed reproduce the same outcome; every subsystem uses the same mission clock.

**P0-2. Make power and life support interact.** Allocate limited power among essential air systems, crop lighting, heaters, and optional activity. Provide a simple preview such as “Air reserve will fall faster” before committing. Turning off an oxygen generator should normally draw down existing reserves over time, rather than instantly removing breathable air. CO2 removal can be simplified, but explain that “life support” contains more than oxygen production.

Acceptance: a player can conserve energy now and observe a related air-reserve cost later. A no-action or default policy also consumes time and resources.

**P0-3. Add a NASA-informed radiation event.** A real archived DONKI record can prompt an educational shelter decision. Moving indoors reduces the model's exposure increment but interrupts outside work. Reinforcing shielding costs installation effort, materials, or energy; passive shielding should not mysteriously consume power every turn merely to exist.

Acceptance: shelter and continue-work paths produce different exposure and mission-progress outcomes, with the real source record accessible in the event details. Label the risk conversion as a simplified model.

**P0-4. Make food a future consequence.** Begin with packaged reserves and an already growing crop, or use explicit time skips. Reduced lighting or irrigation slows progress and affects later harvest. Avoid pretending new lettuce feeds a crew after a few minutes of mission time.

Acceptance: changing crop support produces a visible difference at a later scheduled checkpoint. A single missed light cycle need not destroy the entire crop.

**P0-5. Make communication delay affect a choice.** Queue an Earth request with outgoing delay, assumed response time, and return delay. Show both message status and time until advice arrives. The child decides whether to wait, perform a local procedure, or use reserve resources. Waiting must still advance the outpost's consumption.

Acceptance: advice cannot appear instantly; the game remains interactive while it travels. Explain the difference between one-way travel time and a complete request/reply cycle.

**P0-6. Explain consequences at the moment they matter.** Show a brief preview, then a visible update, then a plain-language causal sentence. Example: “You kept the crop lights on. The plants kept growing, but the battery now has less energy for the cold period.” Distinguish forecasts from guaranteed outcomes.

Acceptance: the debrief cites at least one actual action and one measured simulated consequence, rather than showing a generic success paragraph.

**P0-7. Package a reliable demo.** Bundle the chosen archived inputs. Make the game usable without an account. Add restart and a clearly labeled, reproducible demonstration scenario. Label sources as archived or recently fetched, with observation and retrieval dates. If a live fetch fails, visibly use the archived scenario.

Acceptance: the mission still works after the initial load without a successful NASA API request.

### P1: evidence that the design works for children

- Introduce one decision first, then add the next system. Explain “sol,” “radiation,” and “reserve” in context.
- Use icons plus text, readable touch targets, keyboard access, and status indicators that do not rely only on red/green color.
- Prefer optional timed pressure; provide pause or untimed mode for new readers.
- Run a small formative test with target-age children through parents or teachers. Keep anonymous notes and aggregate results.
- Add same-scenario replay and an outcome comparison after the core loop works.
- If the team can review both versions properly, English/Bangla instructions could help local classroom access. Translation is optional and follows a functioning core mission.

### P2: only after the core is demonstrated

Live space-weather mode, more missions, deeper radiation datasets, teacher controls, a second planet, or additional visual effects. Avoid making multiplayer, accounts, a chatbot, or raw omics analysis prerequisites for the main mission.

## NASA sources to use, in implementation order

These sources serve different purposes. Event catalogs, environmental measurements, biological studies, and engineering reference assumptions should not be presented as interchangeable datasets.

| Priority | Source | Inputs to extract | Gameplay use | Boundary |
|---|---|---|---|---|
| First | [DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/) | Verified SEP/FLR/CME records, timestamps, linked records, instrument/location metadata | Archived solar-event scenario and shelter decision | A solar flare class or catalog entry alone is not a crew dose measurement or a site-specific forecast. |
| First | [Life Support Baseline Values and Assumptions Document, 2022](https://ntrs.nasa.gov/citations/20210024855) | Selected crew consumption and engineering assumptions, with table/page and units | Reference oxygen/food/water budgets and explainable reserve depletion | A technical reference, not a live telemetry feed or a complete outpost model. |
| Second, Mars | [Curiosity REMS archive](https://atmos.nmsu.edu/data_and_services/atmospheres_data/MARS/curiosity/rems.html) | Calibrated temperature/pressure samples, sol, local time, units, quality flags | Cold-period heater demand and site conditions | Gale Crater measurements are not global Mars weather. Pressure is not a direct solar-panel-output measurement. |
| Second | [JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) | Earth-to-target light-time for an explicit date and observer/target pair | Delayed Earth advice | Model-derived ephemeris output; reply time also includes a return leg and response processing. |
| Second | [OSDR OSD-269](https://osdr.nasa.gov/bio/repo/data/studies/OSD-269) | Lettuce cultivation protocol, lighting schedule, harvest timing, study provenance | Crop-growth assumptions and “real science behind this choice” details | An ISS crop study, not a measured Mars yield model or complete crew diet. |
| Optional, Mars | [MSL RAD Level 2](https://data.nasa.gov/dataset/mars-science-laboratory-msl-radiation-assessment-detector-rad-level-2-observation-dosimetr) | Quality-filtered dose-rate products, detector definitions, time and units | A richer archived radiation-environment scenario | Detector absorbed dose and human effective dose are not interchangeable; shielding conversions need an explicit model. |
| Alternative, Moon | [LRO Diviner archive](https://pds-geosciences.wustl.edu/missions/lro/diviner.htm) | Selected calibrated/derived surface-temperature products with location and coverage | Thermal environment and heater-budget scenarios | Surface temperature is not cabin air temperature; Diviner is not a direct solar-panel-output dataset. |

Minimal practical package: DONKI + the life-support reference + one setting-specific environment excerpt. Add a small Horizons table and OSD-269 study metadata as scoped supporting inputs. Only add RAD if the team can explain its quantities correctly. Meaningful use of a few sources is preferable to a long unused source list.

The REMS archive documents calibrated data and quality considerations. OSD-269 includes a 16-hour-light/8-hour-dark protocol and initial harvests around 33 days in some experiments; use study conditions to motivate the model, not to assert identical performance on another world. The [Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html) identifies observer quantity 21 as one-way down-leg light-time in minutes.

### DONKI endpoint note

NASA CCMC's [September 2026 migration announcement](https://ccmc.gsfc.nasa.gov/news/major-updates/) identifies the new public base as `https://ccmc.gsfc.nasa.gov/DONKI-API/get/...`. Consult the [current API reference](https://ccmc.gsfc.nasa.gov/DONKI/api/) rather than copying an older kauai host example.

Documented-pattern request candidates for integration testing:

```text
https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP?startDate=2024-05-01&endDate=2024-05-31
https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate=2024-05-10&endDate=2024-05-11
```

These payload requests could not be retrieved through this session's browsing tools. They are not asserted to have been successfully tested or to contain a particular event. Verify schema, response, date-window limits, source links, and browser access before adopting them. A failed query must not be silently interpreted as “no radiation hazard.”

### Data preparation contract

1. Select actual records and retain the original response or source file.
2. Record source URL, dataset/study/event identifier, version, observation dates, retrieval date, location, units, and quality flags.
3. Convert units once in an import step; reject invalid or missing observations rather than converting them into zero.
4. Store a small normalized scenario alongside the raw excerpt and a transformation note.
5. Keep source observations, derived quantities, and game-balancing constants separate.
6. Show a child-friendly source badge and a judge-readable “How we used this” explanation.
7. Label composite scenarios when different sources cover different dates or places. Do not imply unrelated observations describe one historical mission.

Suggested new-project structure, to adapt after the actual code is available:

```text
data/raw/                  selected original source excerpts
data/scenarios/            small normalized mission inputs
data/provenance.json       identifiers, versions, units, dates, URLs
simulation/                update logic, actions, event scheduling
docs/science-model.md      equations, assumptions, limitations
docs/validation.md         scenario checks and anonymous playtest findings
```

This is a proposal; none of these game/data directories has been created by this assessment.

## Scientific checks that matter to this challenge

- **Do not copy the transcript's lunar dust-storm example literally.** The Moon lacks a substantial atmosphere and does not have wind-driven weather. Lunar dust can still cause contamination and equipment problems. Use a Mars dust scenario or a correctly described lunar mechanism. [NASA explanation](https://www.nasa.gov/general/is-there-weather-on-the-moon-we-asked-a-nasa-scientist-episode-34/)
- **Do not equate flare strength with dose.** Preserve event type, location, and uncertainty. If an event drives a fictional outpost hazard, label the mapping as an educational approximation. Do not call it an astronaut radiation forecast.
- **Keep power and stored energy distinct.** Power is a rate; battery energy changes over a time interval. Use watts/kilowatts and watt-hours/kilowatt-hours consistently, or clearly label normalized game units.
- **Treat exposure as accumulated.** Taking shelter changes future exposure; it does not erase exposure already accumulated.
- **Use believable plant time.** Start with established crops, or show explicit jumps between mission periods. Crop outcomes need not dominate an emergency lasting a few minutes.
- **Use one coherent time scale.** A sol, simulated minute, real second, and decision turn are different. State any compression. Do not make crops grow through days while messages advance only seconds unless that transition is intentionally modeled.
- **Make communication physically meaningful.** Mars delays vary with geometry. A round-trip request cannot be modeled as a single one-way light-time. [NASA communication overview](https://www.nasa.gov/missions/tech-demonstration/space-communications-7-things-you-need-to-know/)

## Build and preparation roadmap

The official [2026 event page](https://www.spaceappschallenge.org/2026/) lists November 14–15, with project submission opening November 14 at 09:00 and closing November 15 at 23:59 local time. Confirm your registered event's actual schedule, judging time, and submission timezone. Do not assume an event elsewhere follows Dhaka time.

Because a current game already exists, confirm the applicable event policy on pre-existing work before relying on it for eligibility. This review did not verify that policy; it does not assert the game is eligible or ineligible. Preserve an honest baseline and describe existing versus event-period contributions.

### November 8–13: preparation

| When | Work | Deliverable |
|---|---|---|
| Nov 8 | Use this completed source audit; confirm event rules and choose the flagged mechanics to address | Evidence-based current audit and baseline |
| Nov 9 | Choose one setting and write a small causal model | Resource dependency sketch and explicit units/time |
| Nov 10 | Research/select NASA records and define transformations | Provenance plan and scenario specification |
| Nov 11 | Review choices, language, and reading load with a teacher or parent | Short onboarding and event-copy drafts |
| Nov 12 | Define acceptance scenarios, demo path, and team responsibilities | Test plan and reproducible-demo specification |
| Nov 13 | Check tools, deployment prerequisites, submission fields, and allowed preparation | Ready environment and scoped backlog |

Schedule implementation in accordance with the verified event rules. Preparation here is not a claim that pre-event submission development is permitted.

### Event build sequence

| Milestone | Work | Exit condition |
|---|---|---|
| Opening block | Validate baseline and implement the smallest shared resource model | A power choice changes a later life-support state |
| First development block | Add one sourced event, shelter/work trade-off, and traceability | Real record → explicit model → playable consequence |
| Second development block | Add crop checkpoint and delayed advice | All objective areas have meaningful, understandable behavior |
| End of day one | Integrate one complete mission and deployment | Fresh-browser mission completes and restarts |
| Day two, early | Formative playtests and model/reliability fixes | Observed confusion and major defects addressed |
| Day two, middle | Replay comparison, debrief, source documentation | Judges can inspect both the learning claim and the data path |
| Final work block | Freeze scope; record demo; verify project-page links and submission | Reviewed submission completed before the actual event deadline |

Reserve a substantial final block for validation and submission. The published opening/closing times should not be treated as 48 usable coding hours. If behind, reduce mission count and visual scope before removing meaningful consequences or provenance.

### Suggested responsibilities

For one person, complete these sequentially: simulation, NASA inputs, interface/learning, verification, presentation. For a team, assign clear ownership of each while agreeing on one state schema. Avoid several people independently inventing resource rules.

## Validation and evidence

### Technical and scientific acceptance scenarios

1. Same seed and decisions reproduce the same state history.
2. A battery deficit limits powered activity; repeated clicks cannot manufacture reserves.
3. Prioritizing a subsystem has an observable opportunity cost elsewhere.
4. Sheltering reduces subsequent simulated exposure but delays work.
5. Crop-support choices change a later checkpoint, not an arbitrary instant score.
6. Requests and responses respect the mission clock and stated message-travel model.
7. A failed API request loads a labeled archived scenario and leaves the game playable.
8. Every used NASA input has an identifier, units, source, and documented transformation.
9. Reset clears pending events/messages and returns the intended starting state.
10. Keyboard/touch input, small screens, and a fresh session can complete the main path.

These are proposed acceptance checks for the upgraded game. The specific completed checks are recorded in the assessment and findings above.

### Small formative playtest

Aim for five to eight children spanning the target range if practical, with a parent or teacher coordinating. This is an initial usability exercise, not a statistically validated educational study.

Observe whether the child can start with minimal help, identify a trade-off, notice the later consequence, and choose a different strategy on replay. Ask “What did you gain, and what did it cost?” rather than only “Did you like it?” Record anonymous counts and the exact wording of confusing instructions. Report the actual sample and results without inflating them.

Suggested internal goals: most testers finish a short mission; at least four of five can explain one observed trade-off; no recurring navigation blocker remains. These are team targets, not established results or official judging thresholds.

Keep children out of identifiable submission footage. The [2026 participant terms](https://www.spaceappschallenge.org/legal/) restrict recognizable names, voices, and likenesses of under-18s in submissions and require source/license documentation. Screen capture plus adult narration avoids needing child footage to demonstrate the product.

## Competition presentation

An official [2026 local-event page](https://www.spaceappschallenge.org/2026/local-events/ajmer/) describes impact, creativity, validity, relevance, and presentation. Use those as useful preparation dimensions, not a verified global percentage weighting. The current global judging guide was not retrieved in this review.

| Dimension | Evidence to present |
|---|---|
| Impact | Actual target-age usability findings and a plausible classroom use |
| Creativity | Same-event replay that makes resource trade-offs visible |
| Validity | Explicit state rules, coherent science, source provenance, and working deployment |
| Relevance | A short demonstration mapping choices to the challenge's mission constraints |
| Presentation | One clear decision and consequence before architecture detail |

### Adaptable three-minute demonstration

- 0:00–0:20: State the learning problem and introduce the child commander.
- 0:20–1:05: Play one consequential choice; make the competing needs visible.
- 1:05–1:35: Advance to the outcome; replay the choice with the same scenario.
- 1:35–2:05: Show the real NASA source record and the exact model input it changes.
- 2:05–2:35: Present actual anonymous playtest findings and one improvement they prompted.
- 2:35–3:00: State what works, what is simplified, and the next realistic extension.

Three minutes is a suggested structure; use the actual event's presentation limit.

### Submission package

- Playable link, tested from a fresh browser.
- Public source and appropriate license/documentation.
- Short product description identifying the audience and learning outcome.
- Source list, provenance, and an explanation of each NASA source's gameplay role.
- Science-model note separating observations, derived values, and balancing assumptions.
- Working demo recording and a reproducible scenario.
- Honest validation notes and known limitations.

No roadmap can guarantee an award. The strongest controllable result is a reliable mission in which a child can explain a real resource trade-off, and a judge can trace that mechanic back to NASA evidence.
