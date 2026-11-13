# Mission Control Jr. science and gameplay roadmap

Research and working-tree audit dated 13 November 2026. The Mars and Moon outposts are fictional. Real mission histories, observations, calculated ephemerides, and authored training rules have different evidentiary roles.

## How to use this roadmap

Start with the existing-game audit and dataset table to understand what is already available. Use the mission briefs for feature planning, the data contracts for implementation, and the release checks for verification. Proposed durations, equations, scoring criteria and effort estimates are design decisions for this prototype.

| Deliverable | Where to find it |
| --- | --- |
| A. Existing Game Audit | [Current architecture and missions](#a-existing-game-audit) |
| B. Space Mission Research | [Space mission reference catalog](#b-space-mission-reference-catalog) |
| C. Dataset Evaluation | [Ranked datasets](#c-ranked-dataset-evaluation-and-mapping), [mission-specific links](#mission-by-mission-datasets-and-resource-links) and [data preparation](#i-data-preparation-and-scientific-model-contracts) |
| D. Mission Redesign Blueprint | [Design overview](#d-mission-redesign-blueprint) and [14 detailed implementation briefs](#h-detailed-mission-implementation-briefs) |
| E. Game Progression Architecture | [Career and carry](#e-astronaut-career-and-carry) and [competencies and learning evaluation](#j-progression-accessibility-and-learning-evaluation) |
| F. Technical Integration Architecture | [Integration strategy](#f-technical-integration) and [scientific model contracts](#i-data-preparation-and-scientific-model-contracts) |
| G. Prioritized Implementation Roadmap | [Phases and estimates](#g-prioritized-implementation-and-validation) and [next delivery packages](#k-delivery-packages-and-release-checks) |

**Current delivery status.** Eleven playable experiences were audited, and three additional missions are proposed. The first implementation added provenance for the Base Boss radiation reference and preserved independently prepared records during normalization. The previous verification run passed 241 tests and the production build, with two Base Boss paths checked in Chrome. Those results describe that implementation run. Full campaign walkthroughs, prefixed deployment acceptance and target-age playtesting remain open.

**First product milestone.** A child completes one outpost scenario, sees how a choice changes a later reserve, and explains the cost of choosing differently. Base Boss provides the shortest existing route to testing that outcome. Its next scientific improvement is explicit accounting for wastewater and recovery losses.

## A. Existing game audit

This is a static multipage Vite application with JavaScript modules and Three.js. `mission-registry.js` describes the routed chapters, `mission-routes.js` resolves clean paths and legacy links, and `journey-state.js` migrates browser saves and tracks campaigns, attempts, success, mastery, and carry. The newer mission folders use scenario, state, action, scene and UI modules on a shared controller/runtime. Storm, rover and Thirty Sols use earlier implementations. Base Boss has separate regional progress and a three-decision resource drill. The existing save keys, desktop keyboard/mouse controls, 3D scenes, generated GLBs, Pip, subtitles and recorded or browser voices can support the redesign. Cadet increases margins and uses simpler resource presentation. Explorer offers tighter margins. Simple and Details copy are a separate control. Direct routes and practice give judges access to later content.

| Route and current activity | What the player learns | Gap seen in the current code |
| --- | --- | --- |
| `/orbit` · Arrival at Mars. Rendezvous, troubleshoot a radio fault, manage loads, and choose a landing plan. | Troubleshooting under power and time limits. | Fictional vehicles and descent model need a visible link to real test-and-verify procedures. No flight data listed in the registry. |
| `/storm` · Before the Storm. Diagnose the fault, clean collectors, recover rover power, align relay, allocate reserves and seal shelter. Three endings. | Dust reduces solar generation. Stored energy and air matter before a storm. | The measured input is a rover electrical output series. The habitat transformation is useful but needs visible units and context alongside the allocation result. |
| `/rover` · Tracks in the Dust. Check steering and braking, select a route, drive, stop and report, inspect terrain, take field observations and return. | Route scouting, slip, communications, energy for return and field records. | Jezero elevation shapes the scene. Hazard patches and traction are authored. The debrief should make it clear why the same measured slope can have different traction. |
| `/solar-shelter` · A Place to Hide. Move shielding, preserve airflow and seat the crew before the event. | Shield placement, limited labor and residual exposure. | GOES near Earth supplies event context. Mars onset, geometry and dose points are authored. Add a Mars observation separately and show what it constrains. |
| `/greenhouse` · The Greenhouse Promise. Allocate light and water, diagnose a leak and airflow fault, harvest greens. | A crop needs several systems working together, and a hardware readout can be misleading. | OSD-269 supports the 16:8 schedule and a Veggie anomaly. Mars water, yield and growth are authored. Make packed food and growth lead time explicit in the outcome. |
| `/earth-delay` · Message to Earth. Send a message, diagnose a recycler and choose when to repair it. | Travel time changes which decisions a crew must make locally. | Already has a real Horizons-derived delay and a packet lifecycle. One date and a symmetric approximation understate how geometry changes the trade-off. |
| `/lunar-sunlight` · Chasing the Sun. Tow and raise a mast, route the cable, track the Sun and serve loads. | Site, mast height, shadows and storage affect continuity. | Long-term LOLA samples are reference context. The fictional 18-day shadow schedule is independent. A second playable site profile would make the distinction tangible. |
| `/lunar-dust` · Dust Busters. Brush or use an electrostatic rack, filter air and observe airlock interlocks. | Contamination control takes time and power. | Blue Ghost demonstrated dust removal on equipment surfaces. The rack, suit procedure and cleaning rates are authored. Equipment surfaces and the suit should have distinct feedback. |
| `/lunar-relay` · Over the Hill. Carry a relay, deploy it, drill a core, send a report and return. | Terrain blocks links and field work costs battery and time. | Ridge geometry is authored. The player should compare a blocked direct path with a plausible relay path using the same elevation profile. |
| `/base-boss` · Be the Base Boss. Drive between bases, deliver supplies, and run a Verdant drill covering air, water, power, food, exposure and an Earth reply. | Combines scheduling, supply chains and competition for the same reserves. | Regional travel currently advances time without a battery meter. The drill models battery separately. The radiation reference now comes from a provenance-linked summary and scales to a fixed 100-point baseline. Recycler output currently has no wastewater input stock. |
| `/campaign` · Thirty Sols. Allocate and sustain resources across seeded events and review choices. | Small shortfalls compound over a long expedition. | Useful as repeat practice. Its larger HUD and independent rules make it a weaker first experience for ages 7–9. |

Baseline on Node 22.22.1 was 236 passing tests out of 238. At the initial baseline, the Base Boss region test imported a removed battery reserve and asserted previous route power behavior. The HUD test expected an old Vite middleware function name. Both checks were subsequently updated to the current behavior. These were present before the first science change. The previous release report documents some browser walkthroughs. Current full campaign browser acceptance and target-age learning outcomes still need direct verification.

## B. Space mission reference catalog

Targets are the dates stated by the linked organizations as of the audit. Where program pages disagree, use the newer dated release or independent government status report and show a date only when useful to the exercise.

| Program and organization | Status and timeline | Objective, hardware and operational challenge | Public reference and gameplay |
| --- | --- | --- | --- |
| ISS · NASA, Roscosmos, ESA, JAXA, CSA | Operational. Continuous crewed occupation began in 2000. | Crew maintain ECLSS, exercise, operate research racks and handle visits and resupply. | Build an orbital maintenance shift around life-support loads, exercise and experiment time. [Expeditions](https://www.nasa.gov/international-space-station/expedition-missions/), [Water recovery milestone](https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/). |
| Artemis I and II · NASA and partners including ESA and CSA | I completed in 2022. II launched 1 April and returned 10 April 2026. | SLS and Orion flight tests. Artemis II verified crewed systems and lunar flyby operations before splashdown. | Use the timeline and mission kit to teach system checks and communications. [Artemis program](https://www.nasa.gov/humans-in-space/artemis/), [Artemis II](https://www.nasa.gov/mission/artemis-ii/), [Press kit](https://www.nasa.gov/artemis-ii-press-kit/). |
| Artemis III, IV and V · NASA and commercial lander partners | In development or planned. NASA lists III for 2027, IV for 2028 and V for 2028. | III evaluates Orion–lander operations in Earth orbit. IV is the planned first crewed lunar landing of Artemis, with a south-polar stay. V is a subsequent landing. | Reuse the orbit chapter for interface tests and the lunar campaign for power, dust and traverse planning. [23 Oct 2026 Artemis III update](https://www.nasa.gov/missions/artemis/nasas-artemis-iii-mission-to-test-future-moon-lander-operations/), [Artemis IV](https://www.nasa.gov/mission/artemis-iv/), [Launch schedule](https://www.nasa.gov/event-type/launch-schedule/). |
| Gateway · NASA, ESA, CSA, JAXA and UAE partners | Development paused in its current form under the revised 2026 campaign. Older pages retain prior Artemis assignments. | PPE and HALO were meant to provide power, propulsion and habitation in lunar orbit. Long periods without crew drive autonomy. | Label an uncrewed maintenance variant a historical architecture concept. [NASA OIG June memo](https://oig.nasa.gov/wp-content/uploads/2026/06/interim-memo-ml-26-002-nasas-management-of-programs-and-projects-after-mission-termination-artemis-campaign-systems.pdf), [GAO assessment](https://files.gao.gov/reports/GAO-26-108556/index.html). |
| Moon Base and CLPS · NASA and providers including Firefly, Blue Origin and Intuitive Machines | Robotic delivery program active. Permanent habitation is a later phased objective. Blue Ghost Mission 1 operated in March 2025. | Deliver science and infrastructure, test dust mitigation, support site surveys, mobility and later habitation. | Explain the progression from robotic site surveys to crew logistics. [Moon Base phases](https://www.nasa.gov/moonbase-phases/), [Blue Ghost EDS](https://www.nasa.gov/blogs/missions/2025/03/04/blue-ghost-begins-surface-operations-captures-descent-video-sunrise/). |
| Commercial stations · Axiom, Starlab, Blue Origin and Vast among developers | Development and procurement. NASA opened an industry solicitation on 9 October 2026. | Validate habitable modules, docking, quiet equipment, air and water loops and sustained service. | Station design exercise with maintainability, quiet sleep and life-support power. [NASA commercial destinations](https://www.nasa.gov/humans-in-space/commercial-space/low-earth-orbit-economy/commercial-destinations-in-low-earth-orbit/), [October solicitation](https://www.nasa.gov/news-release/nasa-seeks-us-industry-plans-for-commercial-space-stations/). |
| Curiosity and Perseverance · NASA/JPL | Operational. Surface operations began in 2012 and 2021 respectively. | Curiosity studies habitability with instruments including RAD. Perseverance investigates ancient environments, caches samples and uses autonomous navigation. | Pair detector data, Mars imagery and elevation with route or shelter choices. [Curiosity](https://science.nasa.gov/mission/msl-curiosity/), [Perseverance](https://science.nasa.gov/mission/mars-2020-perseverance/), [PDS MSL](https://pds-geosciences.wustl.edu/missions/msl/index.htm). |
| Mars Sample Return · NASA/ESA | Previous joint architecture entered closeout. GAO reports the project had begun closing before assessment of alternatives finished. | Retrieval lander, ascent vehicle, orbital capture and sample containment posed linked challenges. Perseverance sample caching remains a distinct real activity. | Teach sample custody in a concept exercise with no promised return date. [GAO assessment](https://files.gao.gov/reports/GAO-26-108556/index.html#gao-26-108556). |
| ESCAPADE · NASA, UC Berkeley and partners | In flight after November 2026 Earth flybys. Mars arrival targeted for September 2027. | Twin probes compare solar wind and atmospheric response at distinct positions. | Compare two stations' measurements and choose a downlink priority. [NASA 9 Nov update](https://science.nasa.gov/science-research/heliophysics/nasas-escapade-completes-powered-earth-flybys-now-en-route-to-mars/). |
| Rosalind Franklin · ESA with NASA support | In development with a 2028 launch target. | Drill beneath the Martian surface to investigate preserved material and look for evidence relevant to past life. | Make drilling depth compete with rover energy and sample handling time. [ESA mission](https://www.esa.int/missions/about-us/directorates/human-and-robotic-exploration/mars/exomars/rosalind-franklin-rover). |
| Martian Moons eXploration · JAXA and partners | Launched 20 October 2026. In flight toward the Mars system. | Survey the moons and sample Phobos. Very low gravity complicates touchdown, mobility and sampling. | Compare controlled contact and free drift. [JAXA launch result listing](https://global.jaxa.jp/index.html), [ESA launch record](https://www.esa.int/media/about-us/directorates/science/space-science/mmx-lifts-off-to-mars-s-moon-phobos). |
| Chandrayaan-3 and Chandrayaan-4 · ISRO | 3's lander and rover surface mission completed in 2023. 4 is approved and in development. | Demonstrate landing and surface science, then develop lunar sampling, ascent and sample return capabilities. | Give players a power-limited surface science shift and a sample custody extension. [ISRO Chandrayaan-3](https://www.isro.gov.in/Chandrayaan3_Details.html), [Chandrayaan-4 approval](https://www.isro.gov.in/ISRO_EN/UnionCabinetApprovesIndiasMission.html). |
| Crewed Mars and CHAPEA · NASA | CHAPEA is a ground analog. A crewed Mars landing and habitat remain planning concepts. | Long isolation, degraded resources, local repair, delayed communications and habitat maintenance. | Use bounded stressors, crew time and system redundancy in Base Boss. [CHAPEA](https://www.nasa.gov/humans-in-space/chapea/about-chapea/), [NASA destinations](https://www.nasa.gov/humans-in-space/destinations/). |
| Webb · NASA, ESA, CSA | Operational after the December 2021 launch. | Infrared observing depends on sunshield orientation, scheduling and instrument capabilities. | Schedule an observing window with power and pointing constraints. [Webb](https://science.nasa.gov/mission/webb/), [MAST archive](https://archive.stsci.edu/missions-and-data/jwst). |
| DART and Hera · NASA and ESA | DART completed its impact in 2022. Hera is operating near Didymos and Dimorphos in November 2026. | DART changed Dimorphos's orbit. Hera and its companion spacecraft characterize the system and impact outcome. | Compare before/after evidence and plan reconnaissance under limited downlink. [DART](https://science.nasa.gov/planetary-defense-dart/), [ESA 12 Nov update](https://www.esa.int/articles/about-us/directorates/operations/space-safety/hera/hera-spies-a-half-hidden-asteroid-moonlet). |
| OSIRIS-REx and NEO Surveyor · NASA | Bennu samples returned in 2023. NEO Surveyor is in development. | One mission sampled a small body. The other uses infrared observations to find and characterize near-Earth objects. | Select a sample site or decide where follow-up observations most reduce uncertainty. [OSIRIS-REx](https://science.nasa.gov/mission/osiris-rex/), [NEO Surveyor](https://science.nasa.gov/mission/neo-surveyor/). |
| MOXIE · NASA/JPL | Completed Mars technology demonstration on Perseverance. | Made oxygen from atmospheric CO₂. Scaling production, storage and power is a distinct engineering challenge. | Choose between producing oxygen now and drawing from stored tanks during low power. [MOXIE](https://www.nasa.gov/space-technology-mission-directorate/tdm/mars-oxygen-in-situ-resource-utilization-experiment-moxie/). |

## C. Ranked dataset evaluation and mapping

| Priority and data | Extractable fields, format and cadence | Game integration and scientific limit |
| --- | --- | --- |
| 1 · Curiosity RAD / NASA JPL | June 2024 article reports a May 20 event and 8,100 µGy at the rover location. PDS provides instrument products and labels; inspect actual dose columns, integration intervals and quality flags before deriving a time series. Archive products follow releases. | Base Boss and Solar Shelter. Use a dated event summary now. A future PDS profile can drive relative intensity over time. Instrument/location absorbed dose is different from crew dose equivalent and shield performance. [Event report](https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/), [RAD archive locator](https://arcnav.psi.edu/urn%3Anasa%3Apds%3Acontext%3Ainstrument%3Arad.msl), [RAD RDR specification](https://pds-ppi.igpp.ucla.edu/data/MSL-M-RAD-3-RDR-V1.0/DOCUMENT/RAD_RDR_SIS.PDF). |
| 2 · JPL Horizons | Observer quantity 21, UTC epoch, target/observer IDs, ephemeris and one-way light minutes. Text/JSON API, computed on request. Parse marked ephemeris rows and pin epochs. | Earth Delay, Base Boss and Over the Hill. Existing Mars value 11.01438304 min and Moon value 0.02254982 min at the bundled epoch. Double for an approximate symmetric round trip, then add explicit processing and link waits. [API contract](https://ssd.jpl.nasa.gov/doc/horizons.html). |
| 3 · Jezero HiRISE DTM / Mars Trek | Stereo elevations, grid resolution, projection, datum and no-data labels from the DTM. Trek WMTS provides tiled layers and capabilities. Crop and resample the elevation product offline. Historical imagery is released per product. | Rover and Base Boss. Derive grade from elevation; overlay fictional pads and traction classes. Display the site and any edits. WMTS imagery pixels do not replace an elevation raster. [Jezero DTM](https://hirise.lpl.arizona.edu/dtm/ESP_023524_1985), [Trek services](https://trek.nasa.gov/tiles/). |
| 4 · Opportunity solar energy | Sol and watt-hours per sol, sparse historical samples. Repository uses team values reported in archived Planetary Society updates. JPL separately documents the decline and operations. Interpolate as a normalized fraction and record time compression. | Before the Storm and Base Boss. The profile changes available solar power. Rover electrical output is specific to its hardware and conditions. [NASA/JPL report](https://www.jpl.nasa.gov/news/opportunity-hunkers-down-during-dust-storm/), [Archived series source](https://www.planetary.org/articles/06-mer-update-planet-encircling-dust-cloud). |
| 5 · NASA CCMC DONKI | Event-driven JSON. SEP ID, onset, instruments and links; FLR times and class; CME analysis speed, half-angle and direction when available; GST Kp, shock timestamps/location, notifications and event links. Handle missing estimates, versions and instrument location. | Solar Shelter and communications exercises. Select scenario family and preserve event chronology. Earth Kp, flare class or a CME estimate cannot supply a Mars crew dose or arrival guarantee. NASA moved the public base to `https://ccmc.gsfc.nasa.gov/DONKI-API/get/…` on 30 Sep 2026. [Migration notice](https://ccmc.gsfc.nasa.gov/news/major-updates/), [API documentation](https://ccmc.gsfc.nasa.gov/DONKI/api/). |
| 6 · OSDR OSD-269 / Veggie | Study accession, specimen, cultivar, flight/ground group, growth protocol, light-dark hours, photon flux and spectral settings, plus linked assay files. Study-specific metadata and versioned files. Normalize the protocol and retain units. | Greenhouse and Base Boss. The 16:8 schedule and observed equipment anomaly are practical. Controlled ISS/ground observations do not calibrate Mars yield, food safety or fan repair. [OSD-269](https://osdr.nasa.gov/bio/repo/data/studies/OSD-269), [2020 study](https://doi.org/10.3389/fpls.2020.00199), [NASA API catalog](https://api.nasa.gov/). |
| 7 · NASA RadLab | `instrument_id`, `timestamp`, `absorbed_dose_rate` in µGy/h, `dose_equivalent_rate` in µSv/h, flux and ISS coordinates where available. Instrument-dependent telemetry; select one instrument and date window, keep missing readings and integrate only supported intervals. | Optional ISS Dosimeter Lab. Compare variation across one orbit or matched instruments with documented context. Instrument responses, locations and environments differ. Keep ISS traces out of Mars dose models. [RadLab API](https://visualization.osdr.nasa.gov/radlab/gui/data-api/), [Instrument overview](https://visualization.osdr.nasa.gov/radlab/gui/overview/). |
| 8 · Lunar LOLA and EDS | LOLA uses 60 m raster samples and an 18.6-year average illumination fraction in the bundled product. EDS supplies qualitative surfaces and observed dust clearing. Static archived products. | Chasing the Sun and Dust Busters. Use raster patches for site comparison. Compute a separate illustrative shadow sequence. EDS supports an equipment demonstration with authored costs. [LOLA](https://pgda.gsfc.nasa.gov/products/69), [Blue Ghost EDS](https://www.nasa.gov/blogs/missions/2025/03/04/blue-ghost-begins-surface-operations-captures-descent-video-sunrise/). |
| 9 · ECLSS and CSA agriculture | ECLSS subsystem roles and NASA's demonstrated 98% water recovery milestone, plus CSA controlled-environment resource and classroom materials. Documents and reference articles. | Use mass conservation and loop delays. Compare water, energy, labor and fresh-food output. The 98% milestone is system-specific. Keep a separate wastewater stock and author the game loop rate. [ECLSS](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/), [Recovery milestone](https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/), [CSA toolkit](https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/). |
| 10 · NASA image catalogs and APOD | APOD daily editorial metadata includes date, title, media type, URL and copyright when provided. The legacy Mars Rover Photos catalog lists camera, sol and image URL, but a dependable working legacy API was not established in this audit. NASA raw image pages and PDS offer camera products and labels. Publication is product-dependent. | Use curated local mission images for evidence comparison and keep attribution. APOD is useful for optional context; use mission-specific PDS products for terrain or timed observations. [NASA API catalog](https://api.nasa.gov/), [Legacy photo catalog](https://data.nasa.gov/dataset/mars-rover-photos-api), [NASA raw images](https://science.nasa.gov/solar-system/multimedia/what-are-raw-images/). |

### Human research suitability

- **Bone, nutrition and muscle.** Smith et al. report DXA measures, diet records and differences between resistance equipment cohorts. NASA muscle research reports strength and aerobic outcomes around flight. Use published groups and task-time constraints in an orbital shift. Cohort sizes, hardware and diet complicate attribution. No individual trajectory or partial-gravity extrapolation is needed. [Bone study, 2012](https://pubmed.ncbi.nlm.nih.gov/22549960/), [Muscle research, 2024](https://ntrs.nasa.gov/api/citations/20240000934/downloads/SpacePhys%20_IWS%20HRP%20poster_2024_final.pdf).
- **Sleep and circadian timing.** Published observational work includes sleep duration and circadian alignment measures. Use a schedule exercise where repeated interruptions reduce planned rest, with authored outcomes and no medication mechanic. [Sleep study, 2014](https://pubmed.ncbi.nlm.nih.gov/25127232/), [Circadian study, 2017](https://pubmed.ncbi.nlm.nih.gov/28725719/).
- **Immune changes and adaptation.** The NASA Twins Study has longitudinal multi-system measurements for one flight subject and one ground twin. NASA immune research describes repeated biomarker sampling. Use these to teach comparison, baseline and uncertainty in an optional exhibit. No biomarker-to-health score is justified by these sources. [Twins Study, 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC7580864/), [NASA immune research](https://www.nasa.gov/missions/station/scientists-probe-how-long-term-spaceflight-alters-immunity/).
- **Biological effects of radiation.** Keep physical detector readings as environmental evidence and illustrate exposure reduction with clearly authored points. An ISS plant or detector record cannot establish a personal injury threshold or a Mars shelter factor. [NASA radiation protection research](https://www.nasa.gov/science-research/heliophysics/real-martians-how-to-protect-astronauts-from-space-radiation-on-mars/), [RadLab overview](https://visualization.osdr.nasa.gov/radlab/gui/overview/).

OSDR searches are discovery tools. Before introducing a new study as a mechanic, open its file manifest, confirm the cohort, unit, timescale and access, and record which public aggregate was used. This audit verified the bundled OSD-269 metadata. The human-study candidates above were evaluated from public publications and agency summaries. Participant-level availability and reuse were not established.

## D. Mission redesign blueprint

Cadet briefings use three primary signals and one visible consequence per choice. Explorer can inspect units, source date, conversion and remaining reserve. Each mission ends with a decision comparison against the same starting conditions.

1. **Arrival at Mars · systems and landing · introductory.** Artemis III-style checks inform the briefing. Keep the station, radio repair rack and landing cockpit. Give the player a preflight checklist, an injected bus or amplifier fault, then a manual landing-site choice between terrain and communications. Use `Wh = W × hours` for allocations and HiRISE-derived slope categories where a real patch is shown. Author loads and descent thresholds. Debrief which test isolated the fault and what was deferred to protect the cabin. Validate success with a repaired link and minimum essential reserve.
2. **Before the Storm · outpost power · introductory.** Reuse collectors, rover battery, airlock, timed event and crew endings. Forecast the normalized Opportunity decline; diagnose, clean, allocate and shelter. Resolve generator energy, battery charge and essential demand once per step. Run optional science only from delivered power. Compare the air reserve and uncompleted research across two plans. The learner can explain why a charged battery before the dust front matters. Archive sol and raw Wh/sol with the normalized series.
3. **Tracks in the Dust · rover and field science · intermediate.** Use the existing route planner, manual rover, parked reports and sample custody. Derive grade from the DTM's spacing; combine grade with authored surface classes for traction and Wh per metre. Present two tracks, a post-inspection reroute and a return reserve. Store images and notes with location and show why the outbound route must leave energy to return. Export only the needed terrain window and record flattening.
4. **A Place to Hide · radiation and emergency · intermediate.** Reuse the refuge model, seat choice and airflow interlock. Brief a warning window, stage shielding, recall the crew, then compare seat outcomes. Keep Earth DONKI event attribution separate from the May 20 Mars RAD observation. Apply an illustrative exposure profile multiplied by each seat's modeled transmission and exposure time. Display training points and the dated external reference separately. Compare quicker shelter entry against more material placed. Success means the crew is inside with airflow and the result shows the effect of placement.
5. **The Greenhouse Promise · agriculture · intermediate.** Reuse trays, lights, watering, leak and fan checks. Use the OSD-269 photoperiod as the plan and the fan anomaly as a diagnostic cue. Advance an already-growing crop only when light and water are served. Keep energy, water and labor costs explicit and carry a packed-food option. If the crop misses a window, compare a delayed harvest with reserve exhaustion. The learner can identify why light alone does not feed the crew. Author crop stress, growth and yield.
6. **Message to Earth · local repair · intermediate.** Keep the recycler, drone/inspection route and packet queue. Brief a failed pump with a known water reserve, let the player ask, test or do both, then show departures and arrivals. Pin two Horizons epochs with different delays. Apply `reply = departure + outbound + Earth work + inbound`, with separate waiting for link availability. Test restore and pause mid-packet. Compare water consumed while waiting and cost of a local check. The learner can explain why a reply cannot arrive on demand.
7. **Chasing the Sun · lunar site planning · introductory.** Use the mast, towing, cable and shadow scene. Compare a quick near pad and a slower ridge setup. The LOLA fractions are long-term site context. A modeled sun path and terrain horizon control the short gameplay window. Spend suit time and cable length to reduce shadow periods, then compare energy served. Store time-series power with the choice record. The learner can explain why average sunshine and continuous power differ.
8. **Dust Busters · airlock and maintenance · introductory.** Use physical brush, rack, filters and interlocks. Compare time spent brushing with rack energy and filter load. Track dust on equipment, cabin and filter separately and gate airlock opening on the teaching rules. Apply the Blue Ghost reference to equipment surfaces. The learner can explain why removing dust before entry saves indoor work.
9. **Over the Hill · communications and survey · intermediate.** Keep the rover, relay and drill. Draw a straight path over the terrain and test whether terrain rises into it. Ask the player to choose a mast site, send a timestamped report, then return with the core or skip it to preserve a reserve. Horizons supplies light-time context and the local ridge is authored. The learner can distinguish a blocked path from a delayed reply.
10. **Be the Base Boss · campaign capstone · advanced.** Start with the existing regional jobs and Verdant drill. Deliver a recycler part and record the arrival window, run the linked dust, solar-particle and Earth-reply decisions, and use delivered parts to select a deterministic starting condition for the drill. Maintain separate clean, waste and shield stocks; reclaim only available wastewater. The drill remains an explicit planning exercise with air and power reserves. Teach the opportunity cost of each decision through a same-scenario replay with one changed choice. A three-choice result should visibly account for air, harvest and exposure.
11. **Thirty Sols · long-duration elective · advanced.** Keep the seeded scheduler, decisions and review. Reuse the capstone's source-linked resource assumptions where the units match. Group six resources into crew, power and supplies for Cadet. Show which event consumed a reserve and which later decision it constrained. Use optional science and delayed crops to reward sustainable plans. Test complete, recovery and repeat attempts with the same seed.
12. **New · Station Shift · orbital operations · introductory.** Use ISS ECLSS, published sleep/exercise research and the existing orbital rack and controller. Schedule repair, an exercise slot, a protected sleep window and an optional experiment. Reveal an unexpected power restriction. Simulate a shared crew-time budget and essential versus optional loads, with aggregate research offered in the debrief. A later RadLab task can compare two measured intervals at one instrument. The learner can explain how scheduled maintenance and rest protect future operations. No clinical model or individual records are required.
13. **New · Survey Before You Land · lunar robotics · intermediate.** Draw on CLPS, Chandrayaan and LOLA. Use lunar rover, map, relay and sample interactions. Survey two candidate sites, put a relay where it can see the lander and base, decide which small image and terrain products to downlink, then recommend a site. Use measured elevation where an appropriate public tile exists and authored battery and bandwidth budgets. The learner can justify a landing-site recommendation based on several constraints.
14. **New · Oxygen on a Short Power Budget · Mars logistics · advanced.** Use MOXIE's demonstrated production principle and reuse the Base Boss allocation and storage interactions. First test a converter with excess power, then choose between an oxygen production cycle and time-critical science as sunlight declines. Cap the modeled production by available energy, time and storage headroom. Include a tank draw and a safe fallback. The learner can explain why a proven small demonstration leaves production and storage engineering to solve.

### Mission-by-mission datasets and resource links

**Bundled** means the checkout already contains a usable input or reference. **Candidate** means the source is available for a future integration and may need a small export or manual transcription. Keep the product ID, units, observation date or epoch, and source link with any exported data.

| Mission | Dataset or downloadable product | Reference and what to use |
| --- | --- | --- |
| **Arrival at Mars** | **Candidate.** Crop the [HiRISE Jezero DTM](https://hirise.lpl.arizona.edu/dtm/ESP_023524_1985) around two candidate landing pads. Keep pixel spacing, relative elevations and slopes. | Use the slope and terrain map to compare landing options. The [NASA terrain-relative navigation overview](https://science.nasa.gov/science-research/science-enabling-technology/technology-highlights/terrain-relative-navigation-landing-between-the-hazards/) explains how Perseverance avoided mapped hazards. The [Artemis II press kit](https://www.nasa.gov/artemis-ii-press-kit/) provides examples of staged crew and vehicle checks. Keep the fictional lander's limits as game values. |
| **Before the Storm** | **Bundled.** [Opportunity solar-output series](Mission%20Control%20Jr/data/opportunity-2018.js) contains the small historical set used in play. The [2018 mission update](https://www.planetary.org/articles/06-mer-update-planet-encircling-dust-cloud) and [later update](https://www.planetary.org/articles/06-mer-update-opportunity-dust-storm-sleep) provide the reported sol and Wh/sol values. | Use the measured decline to shape available power over the preparation window. Retain the original rover units and show the time compression. [NASA/JPL Opportunity storm report](https://www.jpl.nasa.gov/news/opportunity-hunkers-down-during-dust-storm/). |
| **Tracks in the Dust** | **Bundled.** [Jezero terrain module](Mission%20Control%20Jr/data/jezero-terrain.js) and [extraction script](Mission%20Control%20Jr/scripts/fetch-jezero-dtm.py) use [HiRISE product DTEEC_023524_1985_023379_1985_U01](https://hirise.lpl.arizona.edu/dtm/ESP_023524_1985). **Candidate.** [Perseverance raw images](https://mars.nasa.gov/mars2020/multimedia/raw-images/) and [Mars Trek WMTS imagery](https://trek.nasa.gov/tiles/). | Compute route grade from the DTM. Save the camera and sol for any comparison image. Use NASA's [Perseverance driving explainer](https://science.nasa.gov/resource/how-perseverance-drives-on-mars/) to explain terrain checks. Route hazards and traction coefficients are authored. |
| **A Place to Hide** | **Bundled.** [DONKI SEP snapshot](Mission%20Control%20Jr/public/data/raw/donki-sep-2024-05.json) contains event `2024-05-10T13:35:00-SEP-001`. Keep its time and GOES instrument. **Candidate for this chapter.** Use the separate [May 20 Curiosity event summary](Mission%20Control%20Jr/public/data/raw/curiosity-rad-2024-05-20.json) already bundled for Base Boss. | Use the near-Earth SEP record as warning context and the separate Mars RAD record as a dated measurement reference. The game supplies exposure points and shield factors. [DONKI API](https://ccmc.gsfc.nasa.gov/DONKI/api/), [Curiosity event report](https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/), [NASA radiation protection concepts](https://www.nasa.gov/science-research/heliophysics/real-martians-how-to-protect-astronauts-from-space-radiation-on-mars/). |
| **The Greenhouse Promise** | **Bundled.** [OSD-269 metadata](Mission%20Control%20Jr/public/data/raw/osdr-osd-269.json) includes the ISS Veggie growth protocol. The [OSDR study page](https://osdr.nasa.gov/bio/repo/data/studies/OSD-269) exposes study metadata and linked files. Start with cultivar, flight or ground group, and 16 hours light to 8 dark. | Use the light schedule and the documented fan anomaly for crop planning and diagnostics. Author the Mars growth and yield values. [Veggie study](https://doi.org/10.3389/fpls.2020.00199), [CSA food production toolkit](https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/). |
| **Message to Earth** | **Bundled.** [Mars–Earth Horizons output](Mission%20Control%20Jr/public/data/raw/horizons-mars-earth-2026-11.txt). To make another scenario, request an observer ephemeris with target `499`, center `500@399`, and quantity `21`. Extract the UTC epoch and one-way down-leg light time in minutes. [JPL Horizons API](https://ssd.jpl.nasa.gov/doc/horizons.html). | Use the light time in the message queue and budget Earth processing separately. The [NASA ECLSS overview](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/) provides the water-recovery subsystem context. |
| **Chasing the Sun** | **Bundled.** [LOLA patch manifest](Mission%20Control%20Jr/public/data/raw/lunar-illumination/patches.json) identifies three sample windows and the scale factor. [NASA LOLA polar illumination product](https://pgda.gsfc.nasa.gov/products/69). | Compare long-term sunlight availability between sites, then model a separate short shadow sequence for gameplay. Use [NASA Moon Base phases](https://www.nasa.gov/moonbase-phases/) for site and infrastructure context. |
| **Dust Busters** | **Bundled reference.** [Blue Ghost surface operations](https://www.nasa.gov/blogs/missions/2025/03/04/blue-ghost-begins-surface-operations-captures-descent-video-sunrise/) identifies glass and thermal radiator surfaces used in the dust-shield demonstration. [EDS payload thermal design report](https://ntrs.nasa.gov/citations/20250005380) gives hardware context. | Use the demonstrated surfaces for equipment inspection and cleaning feedback. The game supplies suit-cleaning rates and filter costs. [NASA celestial dust risk](https://www.nasa.gov/directorates/esdmd/hhp/risk-of-adverse-health-performance-effects-of-celestial-dust-exposure/). |
| **Over the Hill** | **Bundled.** [Moon–Earth Horizons output](Mission%20Control%20Jr/public/data/raw/horizons-moon-earth-2026-11.txt), using target `301`, center `500@399`, and quantity `21`. **Candidate.** Crop an elevation profile from the [LRO PDS archive](https://pds-geosciences.wustl.edu/missions/lro/default.htm). | Compare direct and relay paths over the same ridge profile. Use the ephemeris for Earth travel time and the ridge for line-of-sight availability. [NASA Glenn lunar surface propagation](https://www.nasa.gov/glenn/glenn-expertise-space-exploration/scan/lunar-surface-propagation/). |
| **Be the Base Boss** | **Bundled.** [Opportunity solar series](Mission%20Control%20Jr/data/opportunity-2018.js), [Curiosity RAD event summary](Mission%20Control%20Jr/public/data/raw/curiosity-rad-2024-05-20.json), and [normalized Horizons and OSD-269 inputs](Mission%20Control%20Jr/data/normalized.json). | Map the solar curve to forecast power, the Mars event to a training exposure baseline, the light time to a reply window, and the Veggie protocol to crop context. [NASA ECLSS overview](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/), [NASA water-recovery milestone](https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/). |
| **Thirty Sols** | **Candidate.** Reuse the [bundled solar, ephemeris and crop inputs](Mission%20Control%20Jr/public/data/provenance.json) after mapping each into the campaign's units. For a second weather scenario, the [Mars 2020 MEDA bundle](https://pds.nasa.gov/ds-view/pds/viewBundle.jsp?identifier=urn%3Anasa%3Apds%3Amars2020_meda&version=1.0) supplies labeled instrument products. | Start with one scenario per seed and record the original observation separately from the turn-based resource changes. Use the [NASA life-support baseline](https://ntrs.nasa.gov/citations/20210024855) to identify relevant flows before choosing training budgets. |
| **Station Shift** · proposed | **Candidate.** Select one ISS instrument and short time window in the [RadLab API](https://visualization.osdr.nasa.gov/radlab/gui/data-api/). Export `instrument_id`, `timestamp`, and `absorbed_dose_rate` in µGy/h. Use [published astronaut sleep aggregates](https://pmc.ncbi.nlm.nih.gov/articles/PMC4188436/) for schedule context. | Compare readings over time and teach how maintenance, research and exercise compete for crew time. Keep the measured series separate from the authored schedule outcomes. [NASA astronaut exercise](https://www.nasa.gov/missions/station/iss-research/astronaut-exercise/), [NASA ECLSS overview](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/). |
| **Survey Before You Land** · proposed | **Candidate.** Export two small site windows from [LRO elevation products](https://science.nasa.gov/mission/lro/data-products/) and select matching imagery from the [LROC PDS archive](https://lroc.im-ldi.com/data/). Keep resolution, coordinates, and no-data flags. Add [LOLA illumination](https://pgda.gsfc.nasa.gov/products/69) for site context. | Compare slope, shadow and relay visibility, then decide what evidence to send before recommending a site. [NASA Moon Base phases](https://www.nasa.gov/moonbase-phases/), [ISRO Chandrayaan-3](https://www.isro.gov.in/Chandrayaan3_Details.html). |
| **Oxygen on a Short Power Budget** · proposed | **Candidate.** The [NASA/JPL MOXIE results](https://www.jpl.nasa.gov/news/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/) provide mission totals and the reported peak rate. Pair those with the [MEDA instrument archive](https://pds-geosciences.wustl.edu/missions/mars2020/) only if the exercise needs a dated atmospheric reference. | Use the demonstration figures to explain scale. Set game-specific energy cost, tank capacity and oxygen demand, and show how stored oxygen bridges a power shortfall. [NASA MOXIE overview](https://www.nasa.gov/space-technology-mission-directorate/tdm/mars-oxygen-in-situ-resource-utilization-experiment-moxie/). |

The [provenance registry](Mission%20Control%20Jr/public/data/provenance.json) links bundled records to their missions and documents their transformations. The [model assumptions](Mission%20Control%20Jr/public/data/model-assumptions.json) document authored values. Run `npm run data:normalize` from the game directory to regenerate the shared inputs after updating their source records.

## E. Astronaut career and carry

1. **Cadet training.** Station Shift introduces controls, diagnosis, time and essential loads. A badge records an explained choice and safe stop.
2. **Lunar field operations.** Sunlight → Dust → Relay → optional Survey. Site selection teaches power first. Dust gives equipment maintenance a cost. Relay then adds navigation, interrupted links and optional science.
3. **Mars field operations.** Arrival → Storm → Rover → Shelter → Greenhouse → Earth Delay. Reuse diagnosis and reserves, add a return budget, then introduce exposure, crop lead time and delayed help.
4. **Command.** Base Boss makes earlier trade-offs compete for shared resources. Thirty Sols extends that exercise. Oxygen on a Short Power Budget fits after the first successful command run.

Use prerequisite competencies for suggested story progression while keeping chapter practice and the judge sampler accessible. Preserve separate outcome and mastery records. Reuse existing authored carry only where later scenes consume it. New carry should be a small bounded advantage, such as a charged spare or one packed supplement. Safe recovery should always offer a viable later starting state. Practice must never write career carry. A debrief should name the skill, the player's evidence and one alternate decision worth trying.

## F. Technical integration

Keep the Vite build fully playable with bundled data. Use the existing normalization script and `public/data` registry as the ingest boundary. Each compact source record should contain provider, URL, record ID, date/version, reference location, units, retrieval or publication date, archive path/checksum when applicable, transformation and limitation. Keep source units through normalization and convert at the scenario boundary. Scenario saves should pin the input version and seed so older attempts remain reproducible.

For refreshes, use a developer-run or scheduled build job with allowlisted endpoints and bounded date windows. DONKI can be checked daily for a future optional historical scenario pack. Refresh Horizons only when creating dated scenarios and poll study or PDS versions at release preparation. If the keyed NASA gateway is needed, read the credential only in the ingest process from a configured environment secret. Never use a `VITE_` secret, place a credential in a URL that gets published, or log upstream authorization. NASA Open APIs lists default limits of 1,000 requests/hour per registered key and lower DEMO_KEY limits. Read quota headers, respect 429/Retry-After, retry transient errors with backoff and retain the last valid archive if parsing or validation fails. Keyless CCMC, Horizons and RadLab avoid a game-runtime credential. [NASA Open APIs](https://api.nasa.gov/), [CCMC migration](https://ccmc.gsfc.nasa.gov/news/major-updates/).

Reuse `servePower`, `moveWater`, the exposure integrator, message queue, seeded replay and existing 3D controllers. Keep physics and resource rules in pure modules. Validate power, water and inventory invariants, fixed-seed replay, alternate outcomes, pause/reload, URL prefix deployment and evidence links. Limit new raster downloads to product windows. Compute grade and sight lines offline or when selecting the map, and keep WebGL detail and datasets bounded to ordinary hardware. Snapshot first, build and test, then publish one consistent static bundle. A failed refresh leaves the working scenario available with its archive date visible.

## G. Prioritized implementation and validation

Effort estimates are developer time for one person familiar with the repo. Playtest recruitment lead time is separate.

| Phase and priority | Work | Impact / complexity | Dependencies, data and effort |
| --- | --- | --- | --- |
| 1 · P0 · implemented | Restore the baseline checks and put the Mars radiation event in the common provenance pipeline. Connect current storm, rover and capstone sources to their actual consumers. | High / low | Existing routes, Base Boss, JPL event summary and archived data. 0.5–1.5 days. |
| 1 · P0 | Walk through a 5–7 minute route with two meaningfully different outcomes. Check source links, reserve deltas, replay and the age modes. | High / medium | Existing quick demo and capstone. 1–2 days. |
| 2 · P1 | Add two dated Horizons scenarios and a small RadLab instrument trace. Show observation time, location and units. | High / medium | Horizons and RadLab docs, versioned saves. 2–4 days. |
| 2 · P1 | Add a second cropped DTM route and a lunar illumination comparison. Expose terrain edits and replay conditions. | High / medium | Jezero HiRISE, LOLA, rover planner. 3–5 days. |
| 3 · P1 | Connect regional jobs to the Verdant drill and implement a conserved clean/waste/shield water loop. | High / medium | Base Boss, ECLSS reference, replay and saves. 4–7 days. |
| 3 · P1 | Build Station Shift and introduce competency-based suggested progression. | High / medium | Orbit runtime and human research summaries. 4–7 days. |
| 4 · P2 | Add Survey Before You Land and a validated, small Mars RAD intensity profile. | Medium / high | Lunar data product selection, PDS RAD preprocessing, route UI. 1–2 weeks. |
| 5 · P2 | Add oxygen-production and optional planetary-defense or telescope exercises after the core career is validated. | Medium / high | MOXIE documentation, DART/Hera or Webb archives, reusable controllers. 2–4 weeks. |

For acceptance, run the automated suite and a production build, then smoke-test direct chapter links and practice navigation under both a root and a directory prefix. Complete two Base Boss plans from the same initial conditions and compare final reserves. Use the existing playtest kit with both age bands. Ask each player to predict what will happen, make the choice and explain the observed consequence in their own words. Record where the controls or explanation failed before tuning the underlying science.

### First implementation and verification

- Base Boss now reads the Curiosity event summary from the normalized archive. The source record gives the instrument, location, dates, unit, source URL, checksum and conversion. The drill and Sources page identify its outdoor and shelter values as training points.
- Data normalization retains the independently prepared Jezero, Opportunity and Veggie anomaly records. Registry-to-provenance checks cover every chapter that declares a source.
- The route test now checks time, roughness, arrival, cargo and old-save compatibility for the current regional design. The navigation test follows the current middleware name. All 241 tests and the production build passed. Vite reported its large-chunk warning for GLTFLoader.
- All 14 game and Sources URLs returned HTTP 200 at the preview root. In Chrome, Base Boss showed the source and produced both a ready and a delayed harvest on replay. Complete browser walkthroughs, prefixed deployment acceptance and player observation remain open.

## H. Detailed mission implementation briefs

These briefs expand the redesign in section D into reviewable increments. Session lengths, difficulty, resource margins and scoring suggestions below are design targets. The existing source table provides the scientific references for each brief.

### Arrival at Mars

**Role and learning objective.** The player is the systems engineer aboard a fictional Mars arrival vehicle. They must isolate a fault, protect essential loads and explain the evidence behind a landing choice. Suggested first-play duration is 8–12 minutes.

**Sequence and choices.** Inspect the briefing and load panel, reproduce the radio symptom, choose a diagnostic test, isolate the failed component, verify the repaired link, then compare landing sites. Add an optional instrument task that consumes the same energy available to the radio. A wrong diagnosis spends test energy and time, then provides another clue. A guided reset returns to the last working configuration.

**Variables and feedback.** Track battery Wh, load W, elapsed mission seconds, diagnostic evidence and landing-site criteria. Show the last test result beside the component it concerns. The pre-landing debrief names the evidence used and the optional work deferred. A later DTM-backed site selection can use measured slope while retaining authored vehicle limits.

**Reuse and increment.** Extend `missions/orbit/scenario.js`, `actions.js`, `state.js` and the existing UI and landing cockpit. Add a source-backed landing comparison only after the repair sequence works with two injected faults. Keep orbit navigation and surface descent as clearly identified stages with their own reference frames.

**Acceptance.** The same fault and choices reproduce the same result. A repair succeeds only after the verification step. Optional work consumes delivered energy. A saved attempt resumes with its fault and diagnostic evidence intact.

### Before the Storm

**Role and learning objective.** An outpost engineer must keep essential systems operating through declining solar generation. The player predicts which optional task will reduce the later reserve. Suggested duration is 6–10 minutes.

**Sequence and choices.** Read the power trend, inspect equipment, clean panels or recover a spare, decide between research and reserve, then bring the crew inside. Make each action's energy or time cost visible before confirmation. A dust warning advances the forecast even if the player pursues optional work.

**Variables and feedback.** Preserve original Wh/sol samples in the evidence view. Interpolate a normalized curve for the fictional array. Track generated, served, stored and spilled energy separately. Show a forecast and the actual reserve at storm arrival so the player can test their prediction.

**Reuse and increment.** Use `mission.js`, `demo.js`, `data/opportunity-2018.js` and the existing airlock and crew outcomes. Add a debrief chart for the preparation interval and a replay button that keeps the same forecast.

**Acceptance.** A lower-generation input changes available power under identical actions. Research receives credit only while powered. The ending identifies the actual installed battery and sheltered crew. Every successful plan spends time, energy or an optional science opportunity.

### Tracks in the Dust

**Role and learning objective.** A rover operator balances an interesting field target with the ability to return. The learner explains how slope, surface uncertainty and remaining route length affect a decision. Suggested duration is 10–15 minutes.

**Sequence and choices.** Perform readiness checks, plan a traverse, drive to a parked observation point, inspect an uncertain patch, choose a route, collect evidence and return. Offer a shorter rough route and a longer predictable route. After inspection, allow a reduced science objective that preserves a credible return margin.

**Variables and feedback.** Use DTM elevations and horizontal spacing to derive grade. Track route distance, authored rolling resistance, wheel slip, battery and sample custody. Keep predictions uncertain where surface properties are unknown. Identify the terrain edits around the habitat in the source view.

**Reuse and increment.** Extend `mission2.js`, `rover-controller.js`, `expedition-terrain.js` and the existing field camera. Add return-energy estimates to the existing route choice and compare predicted with actual consumption at debrief.

**Acceptance.** Traversing a longer version of the same surface costs more energy under equivalent driving. A steeper DTM patch changes the grade calculation. The player can choose a shorter science objective and still complete a safe return. Carrying the sample and transferring it are distinct recorded actions.

### A Place to Hide

**Role and learning objective.** A crew member prepares a refuge while balancing work time, material placement and ventilation. The learner explains how shelter timing and coverage affect cumulative exposure. Suggested duration is 8–12 minutes.

**Sequence and choices.** Inspect a warning and the refuge, select vulnerable surfaces, place supplies, check airflow, call the crew and watch the event. Give the player enough information to weigh one more placement against earlier entry. A blocked vent prompts a physical rearrangement.

**Variables and feedback.** Track work minutes, inventory location, vent clearance, seat occupancy and cumulative training exposure. Preserve the source instrument and location beside any real observation. A future archive-driven profile can alter the timing of higher and lower intensity intervals after its timestamps and units are verified.

**Reuse and increment.** Extend `missions/solar-shelter/` and `simulation/exposure.js`. First add a replay comparing identical seat placement with different entry times. Then evaluate a small RAD trace as an additional input.

**Acceptance.** Moving a container changes its location once. An earlier entry reduces accumulated exposure under the same event and shelter. Exposure remains above zero. The same shield arrangement can produce different outcomes when the event profile changes.

### The Greenhouse Promise

**Role and learning objective.** A crop specialist must deliver a fresh supplement while protecting the habitat's essential supplies. The learner identifies which missing input prevented growth. Suggested duration is 8–12 minutes with explicit time compression.

**Sequence and choices.** Inspect an already-growing crop, allocate a light and watering window, diagnose the hose and airflow, then choose a harvest or delayed-harvest plan. Show packed-food supplies alongside the greenhouse objective. Offer a real choice between immediate repair and continued operation with a reduced crop target.

**Variables and feedback.** Keep the OSD-269 photoperiod as the documented protocol. Track delivered light, water, equipment state, growth progress, stress and harvested stock. Plant response and compressed growth rates remain authored. Fan status and actual airflow should provide independently observable clues.

**Reuse and increment.** Extend `missions/greenhouse/`, `simulation/crops.js` and existing crop carry. Add a causal debrief showing the periods in which a limiting input interrupted growth.

**Acceptance.** A powered light without available water cannot advance a fully supported growth interval. Harvest is credited once. A delayed crop can recover through later supported periods. A replay changes one allocation while preserving the starting crop and fault.

### Message to Earth

**Role and learning objective.** The crew's repair lead chooses what can be checked locally while assistance travels between planets. The learner distinguishes outbound travel, Earth work and return travel. Suggested duration is 8–10 minutes.

**Sequence and choices.** Inspect the recycler fault and reserve, send a concise report, perform local tests, then decide whether to replace a part before the answer arrives. A delayed or blocked local link becomes a visible queue state. Receiving the answer provides a testable instruction and a result to compare with the player's diagnosis.

**Variables and feedback.** Track the chosen ephemeris epoch, outbound and return durations, processing delay, packet state, remaining water and test costs. Display both story minutes and the clearly labeled compressed wait. Pause freezes the mission clock consistently.

**Reuse and increment.** Extend `missions/earth-delay/` and `simulation/messages.js`. Add a second dated ephemeris input and a comparison in which an identical local action sequence reaches a different reserve before the reply.

**Acceptance.** A reply cannot be used before arrival. Link loss queues or blocks receipt according to the packet state. Reload preserves departure and arrival times. The debrief identifies water consumed while waiting and the actual benefit of the local test.

### Chasing the Sun

**Role and learning objective.** An outpost power engineer chooses where and how to deploy a solar mast. The learner explains the trade between setup time and reliable generation. Suggested duration is 8–12 minutes.

**Sequence and choices.** Compare two site cards, tow the mast, choose height, connect the cable and select the essential or science load schedule. A modeled shadow interval tests the chosen arrangement. Battery use remains visible during the shadow.

**Variables and feedback.** Separate the published long-term illumination fraction from the authored mission-time visibility function. Track mast height, cable reach, suit time, generation, storage and unmet demand. Show the longest continuous shortfall alongside total generation.

**Reuse and increment.** Extend `missions/lunar-sunlight/` and the existing Moon ground scene. Add a second deterministic shadow profile and record its identifier in the attempt.

**Acceptance.** A site with more total generation can still require storage during a long shadow. Raising the mast spends work time and affects the modeled horizon. A disconnected cable supplies zero power to the base. The debrief identifies both served loads and unmet demand.

### Dust Busters

**Role and learning objective.** An airlock technician limits dust carried into the habitat. The learner explains where the dust went and what the cleaning process cost. Suggested duration is 6–8 minutes.

**Sequence and choices.** Inspect dusty equipment, select brushing, vacuuming or the equipment rack, check the filter, then cycle the airlock. A nearly full filter makes cleanup order matter. The player can repeat an inspection after each action.

**Variables and feedback.** Track dust on each surface, captured dust, cabin transfer, filter capacity, electrical energy and work time. Show removal and redistribution with distinct visual states. Each cleaning method needs a cost and a supported equipment surface.

**Reuse and increment.** Extend `missions/lunar-dust/` and its existing interlocks. Add a compact before/after inventory that explains the result.

**Acceptance.** An action transfers or captures a bounded amount of dust. A full filter affects the next operation. An airlock interruption can be recovered safely. Evidence text identifies the demonstrated EDS surface and the authored cleaning parameters.

### Over the Hill

**Role and learning objective.** A field operator restores a usable relay link before collecting a core. The learner explains whether a missing report is waiting for a path or for signal travel. Suggested duration is 8–12 minutes.

**Sequence and choices.** Survey the blocked path, carry a relay to one of two sites, deploy and test it, decide how much field science to attempt, then return. The high site costs extra travel. The nearer site may leave part of the work area out of view.

**Variables and feedback.** Track relay coordinates and height, terrain profile, line-of-sight result, power, work duration and packet timestamps. A terrain cross-section can show the obstruction and the selected antenna heights.

**Reuse and increment.** Extend `missions/lunar-relay/` and shared message logic. Add an explicit link test before reporting success and a relay battery contribution to the return decision.

**Acceptance.** Moving the relay can change path availability under the same terrain. Sending queues a report while blocked. A completed core remains in custody through return. Safe return with reduced science has a clear debrief.

### Be the Base Boss

**Role and learning objective.** The player coordinates supplies and repairs across the region, then budgets Verdant's reserves. The learner connects one earlier delivery or allocation to a later constraint. Suggested duration is 12–20 minutes, with a 5–7 minute drill option.

**Sequence and choices.** Accept the valve delivery, choose a route, restore water service and enter the drill with a recorded starting condition. The drill progresses through reduced solar power, refuge preparation and delayed Earth support. Debrief the entire causal chain and replay one changed choice.

**Variables and feedback.** Regional travel currently advances mission time. The drill has its own battery, air, clean water, shielding water and crop counters. The proposed bridge should pass an explicit delivery result into a fresh drill. Add wastewater availability, capacity overflow and recovery losses before claiming closed-loop water accounting.

**Reuse and increment.** Extend `missions/base-boss/progress.js`, `outpost-drill.js` and `drill-panel.js`. Keep the current independent drill available for practice while adding a campaign entry that consumes the saved delivery result.

**Acceptance.** Earlier and later delivery can alter the drill's starting resources without creating an unwinnable state. Wastewater is debited when reclaimed. Moving water into shielding preserves inventory. Debrief explanations reconcile with the final balances and the selected sequence.

### Thirty Sols

**Role and learning objective.** A mission commander plans for repeated shortfalls and deferred rewards. The learner identifies the earlier decision that created a later reserve or shortage. Suggested duration is 15–25 minutes with save and resume.

**Sequence and choices.** Choose an initial plan, allocate each sol, handle seeded events, revise priorities and review the whole mission. Introduce one additional system only after its earlier dependency is visible. Preserve reduced-objective recovery.

**Variables and feedback.** Track the existing resources and event history, then expose their causes through three compact groups for Cadet. Crop lead time and equipment maintenance should extend over several turns. Show upcoming commitments so the child can plan beyond the current sol.

**Reuse and increment.** Extend `main.js`, `outpost.js`, `simulation/decisions.js` and `simulation/decision-review.js`. Map each imported data series explicitly to the campaign's turn duration.

**Acceptance.** Replaying one seed reproduces the event order. The full review includes early decisions. An interrupted session resumes on the same turn. Optional science can improve the record only after its required resources are paid.

### Station Shift — proposed

**Role and learning objective.** A junior ISS systems operator schedules research around maintenance, exercise and protected rest. The learner explains one scheduling conflict using task duration and dependencies. Suggested duration is 8–12 minutes.

**Sequence and choices.** Inspect the shift plan, allocate crew time, fix a rack fault, recover the schedule and compare completed work. An optional dosimeter activity asks the player to select and explain a measured interval. Introduce only one unexpected event in the first scenario.

**Variables and feedback.** Use task durations, available crew minutes, essential power and completion prerequisites. Research on rest and exercise informs the schedule's purpose. Gameplay performance consequences use authored labels and bounded task effects.

**Reuse and increment.** Use the orbit scene and shared controller, adding a schedule panel and task dependency state. Begin with fixed tasks before incorporating the small RadLab series.

**Acceptance.** A crew member cannot perform overlapping tasks. A failed prerequisite prevents its dependent task. The player can recover by postponing optional work. The debrief identifies the protected activity and the sacrificed research opportunity.

### Survey Before You Land — proposed

**Role and learning objective.** A robotic scout recommends a lunar landing site using terrain, sunlight and link access. The learner supports a recommendation with at least two observations. Suggested duration is 10–15 minutes.

**Sequence and choices.** Study an overview, select a survey path, collect two site observations, establish a relay and choose which evidence to transmit. A bandwidth or battery limit forces prioritization. Compare the recommendation with the survey evidence.

**Variables and feedback.** Preserve map projection and elevation spacing, and calculate slope and a geometric radio path. Track survey energy, information collected and downlink size. Use long-term illumination as one site attribute and label the simplified short-term model.

**Reuse and increment.** Reuse the lunar rover, relay, maps and sample interactions. Add a small site comparison panel and evidence checklist.

**Acceptance.** Every displayed slope can be traced to its source cells. No-data regions are visibly unknown. A recommendation records both supporting observations and an unresolved limitation. Every site has at least one consequential drawback.

### Oxygen on a Short Power Budget — proposed

**Role and learning objective.** A Mars resource engineer balances oxygen production, storage and other electrical loads. The learner explains why production rate alone does not determine crew endurance. Suggested duration is 8–12 minutes.

**Sequence and choices.** Check tank capacity, run a converter test, observe a falling power forecast, then choose between further production and time-critical science. A full tank or reduced power changes the next useful action. End with a reserve comparison.

**Variables and feedback.** Track oxygen mass, fictional production rate, warm-up energy, operating energy, storage capacity and consumption. MOXIE's published output provides scale context. Future habitat capacity, storage and demand need their own assumptions.

**Reuse and increment.** Extend the shared resource calculations and Base Boss allocation panel with an oxygen ledger. Add the production hardware interaction only after the budget model has two understandable outcomes.

**Acceptance.** Production stops at the tank's available capacity. Startup costs are paid once per restart. An unpowered converter produces zero oxygen. The debrief accounts for generated, consumed and remaining oxygen. [MOXIE mission results, 6 September 2023](https://www.jpl.nasa.gov/news/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/).

## I. Data preparation and scientific model contracts

### Evidence levels in the interface

| Evidence basis | Example already relevant to this game | What the player can infer |
| --- | --- | --- |
| Direct observation | A dated instrument reading with units and location | The instrument recorded this value under those conditions. |
| Derived value | Horizons light time or slope from a DTM | The result follows from a named calculation and its inputs. |
| Published reference | A Veggie protocol or EDS demonstration report | This procedure or observation informs the mission design. |
| Authored training model | A shelter transmission factor or compressed crop rate | This is a chosen rule used to make the consequence playable. |

A source link establishes provenance. Demonstrating that data drives gameplay also requires a specific variable and an observable change in an outcome. For example, the Horizons delay changes when the reply is usable. The current 8,100 µGy summary fixes a 100-point baseline in Base Boss. Testing a second radiation scenario requires a separately specified intensity or time profile and a consistent mapping.

### Small, usable extraction packages

| Source | Preparation steps | Small first deliverable | Check before integration |
| --- | --- | --- | --- |
| Horizons | Request the selected target, observer, epoch range and quantity 21. Parse between the ephemeris markers and preserve the header. Convert minutes to seconds once. | Two dated rows for Earth–Mars and one Earth–Moon row, with complete request parameters. | Confirm target, observer, UTC epoch, units and positive finite light time. Record the symmetric return-leg approximation. |
| DONKI | Query a narrow historical interval, select one event ID, retain linked events and analysis revisions. Preserve instrument and observing location. | One event chain with onset timestamps and a source URL per event. | Missing values remain unknown. A revised analysis retains its version. Earth and Mars locations remain explicit. |
| OSDR | Open the study metadata and file manifest. Select the growth-protocol fields and a small published aggregate or table. | The OSD-269 light schedule and a clearly cited equipment-anomaly note. | Confirm specimen, flight/ground group, unit, protocol and paper association. Treat sample counts and study limitations as part of the record. |
| HiRISE / LRO | Read the label, projection and no-data value. Crop a bounded window, retain horizontal scale, then produce a rendering grid and separate edited terrain. | One route patch with a small metadata JSON and an edit mask. | Preserve metre scale. Exclude no-data cells from slope calculation. Record smoothing and any vertical exaggeration. |
| RadLab | Select one instrument with coverage in a short interval. Export timestamps, rate and instrument metadata. Preserve gaps. | One short ISS trace with a valid-data mask. | Check rate units and cadence before integration. Define how gaps appear and exclude unsupported intervals from cumulative totals. |
| Curiosity RAD | Open the PDS PPI reduced-data archive and its software interface specification. Select a bounded surface interval and inspect its detached labels. | A documented candidate series with detector, dose/rate distinction, time bins and quality handling. | Establish a verified parser and time coverage before using the series. The current article-derived event total remains the implemented reference. |
| MEDA | Choose the particular sensor product from its manifest and read the associated label. Retain time, unit, quality flags and sensor location. | One short environmental series relevant to a specific mission question. | Atmospheric temperature, opacity and solar output require different interpretations. Select the actual variable needed by the mechanic. |

The RAD reduced-data documentation identifies the archive format and product interpretation. The Horizons manual defines quantity 21 as one-way down-leg light time. [RAD RDR specification](https://pds-ppi.igpp.ucla.edu/data/MSL-M-RAD-3-RDR-V1.0/DOCUMENT/RAD_RDR_SIS.PDF), [Curiosity RAD archive locator](https://arcnav.psi.edu/urn%3Anasa%3Apds%3Acontext%3Ainstrument%3Arad.msl), [Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html), [RadLab API](https://visualization.osdr.nasa.gov/radlab/gui/data-api/).

### Proposed calculations and units

The equations below define the proposed teaching models. Hardware efficiencies, reserve thresholds and coefficients must be attached to scenario assumptions before implementation.

| System | Calculation or invariant | Modeling boundary |
| --- | --- | --- |
| Electrical energy | Generated Wh = generation W × elapsed hours. Available energy = initial battery + generated energy. Allocate served energy in priority order. Closing battery + served energy + spilled energy = available energy. | The existing helper assumes ideal storage and aggregates within a step. Use steps that resolve generation changes and include charge/discharge limits if they become part of a mission. |
| Water | Clean + wastewater + shielding + plant-held water + explicit loss remains balanced after transfers and imports. Recovered clean water = processed wastewater × recovery fraction. | Debit wastewater before adding recovered clean water. Track capacity overflow explicitly. The existing Base Boss drill adds fixed recycler output without tracking wastewater availability. |
| Oxygen | Closing oxygen = initial + produced + imported − consumed − vented. Bound production by energy, run time and tank headroom. | Keep scenario demand and production assumptions visible. Account for water consumed if the chosen system uses electrolysis. |
| Message timing | Earliest arrival = departure + outbound travel + processing + inbound travel. Delivery can wait for an available receiving link. | Surface routing, contact windows and asymmetric legs can be added separately. Compressed display time uses a single explicit scale. |
| Terrain | Slope angle = atan(vertical change / horizontal distance). Route grade follows local samples along the traverse. | Elevation constrains geometry. Wheel interaction additionally requires a surface model and vehicle assumptions. |
| Crop progression | Supported growth increment = elapsed growth fraction × minimum(light support, water support), with both supports bounded between zero and one. | This reproduces a simple limiting-input lesson. Nutrient, temperature and species responses require additional models and evidence. |
| Training exposure | Increment = authored hazard rate × transmission factor × elapsed mission time. | Choose dimensionless training units for fictional shields. Integrate physical detector rates only in a separate measurement view with consistent physical units. |
| Geometric radio path | Compare sampled terrain height against the straight segment connecting antenna tops. | Terrain intersection is one cause of blockage. Full RF performance also depends on diffraction, antenna gains, frequency and power. |

**Worked power example.** A fictional battery holds 12 Wh. A 30 W array runs for ten minutes and adds 5 Wh. Essential equipment uses 40 W during that interval and consumes about 6.67 Wh. A 20 W grow light consumes another 3.33 Wh, leaving 7 Wh. Deferring the light leaves about 10.33 Wh and delays the crop's supported period. The difference follows from the shared power budget.

**Worked light-time example.** The bundled Earth–Mars value is 11.01438304 minutes one way at its specified epoch. With symmetric legs and immediate Earth processing, the reply takes about 22.03 mission minutes after departure. If one real second represents one mission minute, the displayed wait is about 22.03 seconds. That compression factor is an interface choice and must be shown consistently.

### Proposed source record additions

Extend the current provenance representation only where a consumer needs the new fields. A compact scenario input should reference a stable source ID, source version, observation interval or epoch, original unit, location, transformation version and normalized file hash. Record publication and retrieval dates separately. Attach the game-specific scale and its purpose to the scenario.

For a manually transcribed article summary, identify the transcription method and retain the article URL and date. Its local checksum verifies the stored summary. Archiving the source document would provide a separate check of the original material. For an API response, hash the original response and keep the selected normalized fields alongside it.

### Failure and refresh behavior

| Condition | Desired behavior |
| --- | --- |
| Network unavailable or upstream rate limited | Play the bundled scenario and retain its archive date. Retry refreshes outside the active attempt. |
| Empty response or missing required field | Reject the candidate input and show the reason in the developer refresh report. |
| Upstream units or product version change | Require an explicit parser update and regenerate the derived fixture. |
| A trace contains a gap | Show a gap, and calculate totals only for the intervals the data supports. |
| A new scenario pack arrives during play | Keep the active attempt pinned to its existing scenario and data version. |
| A source link moves | Update the locator while retaining the original record ID and archive hash. |
| Browser storage fails | Keep play available and show a short save-status message. |

## J. Progression, accessibility and learning evaluation

### Competencies and evidence of learning

| Competency | First practice | Later transfer | Evidence in the debrief |
| --- | --- | --- | --- |
| Preserve an essential reserve | Arrival and Storm | Base Boss and Thirty Sols | The player names the optional task deferred and the reserve it protected. |
| Diagnose before replacing | Arrival | Greenhouse and Earth Delay | A recorded test result supports the selected repair. |
| Plan the return | Rover | Lunar Relay and Survey | The player leaves a credible return margin or reduces the field objective. |
| Manage exposure over time | Solar Shelter | Base Boss | The player compares entry time and shield placement under the same event. |
| Respect production lead time | Greenhouse | Thirty Sols | The player plans stored supplies while waiting for a crop. |
| Act with delayed support | Earth Delay | Base Boss | Local work and Earth messages have distinct timing and costs. |
| Explain uncertainty | Rover and Survey | Advanced mission selection | The player identifies one unknown and a useful next observation. |

Use successful explanations and recorded actions together. A lucky result alone gives weak evidence of understanding. Existing completion, success and mastery fields can support these distinctions after their meanings are documented consistently across the missions.

### Age and access targets

For Cadet, show a single current objective, a small number of choices and resource status expressed with words, icons and values. Explorer can inspect prediction error, remaining minutes and units. Every consequence should appear beside the affected object or resource. Audio should be replayable with matching captions. Color should be accompanied by a label or shape.

Keep menu pauses, the mission clock and message timing consistent. Avoid requiring fast reading while a critical countdown continues. Retain reduced effects and reduced motion options. Check keyboard reachability, focus after a dialog closes and text at a narrow viewport. The current desktop movement controls need separate validation before mobile play is claimed.

### Formative playtest plan

Use the existing playtest kit for a small initial round covering both age bands. Ask each participant to predict a consequence, make a choice and explain the result without coaching. Record the task, choice, assistance, completion time and exact confusing wording. A second run should change one decision under the same conditions.

Suggested internal targets are that most participants can find the active objective, complete one meaningful choice without adult intervention and explain one resource trade-off afterward. These are product acceptance targets. A small formative sample supports usability revisions and does not establish a general educational effect.

## K. Delivery packages and release checks

### Next three implementation packages

| Package | Scope and affected components | Dependencies and estimate | Reviewable completion |
| --- | --- | --- | --- |
| 1. Explain the current capstone | Add decision-linked reserve deltas and a repeatable comparison in Base Boss. Check source wording and seed/version display in its debrief. | Existing drill and provenance. 1–2 developer days. | Two different plans from the same starting state produce correctly explained balances. |
| 2. Make the water loop conserved | Add bounded wastewater and loss accounting in the drill, then connect the regional valve result to a campaign entry state. | Shared resource helpers, Base Boss progress and save compatibility. 3–5 days. | All water transfers reconcile, repeat actions are harmless, and earlier saved progress can still enter a valid mission. |
| 3. Make another real input change a decision | Add a second Horizons scenario to Earth Delay and compare the cost of waiting under the same fault. | A verified small ephemeris export and versioned attempt state. 2–3 days. | Distinct source epochs produce distinct reply times and explainable resource outcomes. |

These packages refine the phase estimates in section G and overlap with those tasks. Their effort should not be added a second time to the overall roadmap.

### Release evidence checklist

| Area | Evidence to collect | Completion condition |
| --- | --- | --- |
| Data influence | Same seed/actions with two valid inputs | At least one meaningful mission variable or outcome changes as specified. |
| Scientific attribution | Source view for each integrated input | Instrument or study, date, units, transformation and limitation match the archived record. |
| Conservation | Decision log and opening/closing ledgers | Generation, transfers, consumption and losses reconcile within a defined numerical tolerance. |
| Replay and saves | Active reload, completed replay and practice run | The same seed and data version resume consistently, with practice kept out of career records. |
| Alternate strategies | Successful, reduced-objective and recovery runs | Each has truthful feedback and an accessible next action. |
| Production routes | Root and prefixed deployment | Direct mission entry, navigation, assets and source links load correctly. |
| Accessibility | Keyboard, captions, reduced effects and narrow viewport | Controls remain reachable and essential information remains readable. |
| Learning | Observed prediction, choice and explanation | Findings identify which trade-offs children understand and which need revision. |

### Remaining research decisions

A Mars RAD time series still needs a verified extraction, supported interval and parser. Human-study candidates need an explicit choice of public aggregate and a clear connection to a gameplay question. New terrain patches need a map location and a documented edit policy. The intended length of a classroom session should determine how many missions run before a break.

The next implementation decision should follow the first observed capstone playtest. If children cannot explain the water-versus-growth choice, revise that choice and its feedback before adding more resource systems. If they understand the drill but cannot connect it to their regional delivery, prioritize the campaign-to-drill bridge.

