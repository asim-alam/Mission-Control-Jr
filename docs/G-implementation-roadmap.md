# Deliverable G: Prioritized Implementation Roadmap
## Junior Astronaut Mission Trainer (Mission Control Jr.)

**Document Version:** 2.0.0  
**Architect:** Technical Integration Lead (@architect)  
**Date:** 13 November 2026  
**Status:** Approved for Execution  
**Execution Context:** Static Web Application (Vite 8.3.4, Three.js 0.186.1, ES Modules, `node --test`)  

---

## Roadmap Executive Summary & Phasing Strategy

This roadmap details a 5-phase engineering plan to evolve *Mission Control Jr.* from a solid prototype with passing unit tests into an exemplary, standards-aligned, scientifically validated educational spaceflight simulator for ages 7–12.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PHASE 1: QUICK WINS & BASELINE (P0)                           │
│  Duration: 1.5 - 2 Weeks · Effort: ~7 Person-Days · Focus: Normalization, Integrity & CI        │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  • P1.1: Mars Radiation Integration into Common Normalization Pipeline                          │
│  • P1.2: End-to-End Automated Test Baseline & Regression Harness Enforcement                    │
│  • P1.3: Cadet vs. Explorer Difficulty Tuning & Visual Reserve Scaffolding                      │
│  • P1.4: Provenance Registry Completeness & Interactive Sources Portal                          │
│  • P1.5: Deterministic 5-7 Minute Golden Path Demo with Branching Outcomes                      │
└───────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 2: HIGH-VALUE SCIENTIFIC INTEGRATIONS (P1)                      │
│  Duration: 3 - 4 Weeks · Effort: ~15 Person-Days · Focus: Ephemerides, Terrain & Telemetry     │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  • P2.1: Multi-Epoch JPL Horizons Communication Delay Simulator                                 │
│  • P2.2: Second HiRISE Jezero Crater Traverse & Dynamic Slope Traction Model                    │
│  • P2.3: Lunar Polar Illumination Dual-Site Comparative Module (LOLA 60m)                       │
│  • P2.4: ISS RadLab Telemetry Mini-Lab & Real-Time Dosimeter Comparison                         │
│  • P2.5: Opportunity Dust Storm Time-Compression & Power Curve Normalization                   │
└───────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 3: MAJOR MISSION REDESIGNS (P1)                                 │
│  Duration: 5 - 6 Weeks · Effort: ~25 Person-Days · Focus: Modern Shared Controllers & New Labs  │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  • P3.1: Legacy Controller Refactoring (Migrate storm.js & mission2.js to missions/shared/)     │
│  • P3.2: Closed-Loop ECLSS Mass Balance & Water Recovery in Base Boss                           │
│  • P3.3: "Station Shift" - New Orbital ECLSS & Circadian Rest Schedule Mission                  │
│  • P3.4: Cross-Mission Career Progression & Non-Punitive Carryover Balancing                    │
│  • P3.5: Mobile / Tablet Touch Interaction & Kid-Friendly Usability Hardening                   │
└───────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                     PHASE 4: ADVANCED SIMULATIONS & INTERACTIVE ENVIRONMENTS (P2)               │
│  Duration: 6 - 8 Weeks · Effort: ~35 Person-Days · Focus: CLPS Robotics, Shaders & Long Runs    │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  • P4.1: "Survey Before You Land" - Lunar CLPS Robotic Precursor Mission                        │
│  • P4.2: Dynamic 3D Solar Panel Dust Deposition & Clearing Shader System                        │
│  • P4.3: Real-Time Procedural Voice Synthesis Scaffolding for Pip Robot                         │
│  • P4.4: In-Browser PWA Offline Service Worker & Zero-Install Classroom Distribution            │
│  • P4.5: Longitudinal Multi-Sol Outpost Expedition Engine (Thirty Sols + MEDA Weather)         │
└───────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 5: LONG-TERM EXPANSION & OPEN SCIENCE (P2)                        │
│  Duration: 8 - 12 Weeks · Effort: ~50 Person-Days · Focus: ISRU, Deep Space & Open Platform     │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│  • P5.1: "Oxygen on a Short Power Budget" - Mars MOXIE ISRU Production Module                   │
│  • P5.2: Planetary Defense Reconnaissance (DART Impact Characterization & Hera)                │
│  • P5.3: Deep Space Infrared Observatory Scheduling (JWST Thermal & Pointing Lab)               │
│  • P5.4: Multi-Terminal Classroom Flight Director LAN Mode (Local BroadcastChannel)             │
│  • P5.5: Open NASA Ingest Studio & Educator Mission Customization Toolkit                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Essential Improvements & Quick Wins (P0)

*Objective: Resolve immediate architectural gaps, unify scientific provenance under a single build pipeline, enforce regression testing, and polish learner difficulty tuning.*

### Task 1.1: Mars Radiation Integration into Common Normalization Pipeline
- **Priority:** P0 (Highest)
- **Estimated Effort:** 1.5 Days
- **Implementation Complexity:** Low
- **Expected Impact:**
  - *Learning:* Clarifies that Mars surface radiation is fundamentally different from near-Earth space weather.
  - *Engagement:* Learners see real Curiosity rover observations on Mars directly in their tactical briefings.
  - *Scientific Accuracy:* Unifies the 8,100 µGy Curiosity RAD May 20, 2024 event summary into `scripts/normalize-nasa-data.mjs` instead of keeping hardcoded constants in the Base Boss controller.
- **Dependencies:** None.
- **Required Datasets:** `public/data/raw/curiosity-rad-2024-05-20.json` (Curiosity RAD event record, NASA JPL news summary).
- **Affected Existing Code Components:**
  - `scripts/normalize-nasa-data.mjs`: Add Curiosity RAD validation and metadata compilation.
  - `public/data/normalized.json` & `data/normalized.json`: Include `curiosityRad` in generated output.
  - `public/data/provenance.json`: Register `curiosity-rad-2024-05-20` with checksum and transforms.
  - `missions/base-boss/controller.js`: Consume `normalized.json.curiosityRad` instead of local literals.
  - `missions/solar-shelter/scenario.js`: Display Mars RAD as candidate comparison data alongside DONKI.
- **Acceptance Criteria & Verification:**
  - Running `npm run data:normalize` generates valid `curiosityRad` fields in both JSON locations.
  - `test/provenance-verification.test.js` validates that `curiosity-rad-2024-05-20` matches registered SHA-256 and has basisKind `'reference'`.
  - Base Boss scenario initializes outdoor radiation hazard dynamically from normalized data.

---

### Task 1.2: End-to-End Automated Test Baseline & Regression Harness Enforcement
- **Priority:** P0
- **Estimated Effort:** 1.5 Days
- **Implementation Complexity:** Medium
- **Expected Impact:**
  - *Learning:* Prevents broken mission paths or unfulfillable objectives from reaching students.
  - *Engagement:* Guarantees smooth chapter transitions without script crashes.
  - *Scientific Accuracy:* Validates that resource equations and conversion factors do not drift during updates.
- **Dependencies:** Task 1.1.
- **Required Datasets:** None.
- **Affected Existing Code Components:**
  - `test/orbit-arrival.test.js`: Update middleware function references and station routing.
  - `test/base-boss.test.js`: Ensure regional route tests match current battery and cargo models.
  - `package.json`: Configure pre-push or pre-build test hooks (`"test": "node --test"`).
  - `scripts/verify-missions.mjs`: Audit complete headless walkthroughs of all 11 missions.
- **Acceptance Criteria & Verification:**
  - Running `npm test` executes all 241+ unit tests with 0 failures, 0 skipped, in $< 4.0\text{ seconds}$.
  - Running `npm run build` succeeds with zero errors, emitting clean static bundles to `dist/`.
  - All 14 HTML routes return HTTP 200 in preview server tests.

---

### Task 1.3: Dual Difficulty Tuning Audit (Cadet vs. Explorer Modes)
- **Priority:** P0
- **Estimated Effort:** 1.5 Days
- **Implementation Complexity:** Medium
- **Expected Impact:**
  - *Learning:* 7–9 year olds (Cadet) focus on cause-and-effect concepts without math panic; 10–12 year olds (Explorer) master physical units (Wh, W, µGy, kg, minutes).
  - *Engagement:* Prevents early frustration for younger kids while offering deep tactical crunch for older kids.
  - *Scientific Accuracy:* Explorer mode uses 1:1 physical numbers and tighter margins; Cadet mode uses safety multipliers.
- **Dependencies:** Task 1.2.
- **Required Datasets:** `public/data/model-assumptions.json`.
- **Affected Existing Code Components:**
  - `simulation/difficulty.js`: Review `CADET_TUNING` overrides across all 11 missions.
  - `simulation/learning.js`: Verify progressive disclosure prompts (`learningPrompt`).
  - `missions/shared/hud.js`: Ensure `reserveText()` formats visual dials + percentage words for Cadets and exact units for Explorers.
  - `test/difficulty.test.js`: Verify that Cadet mode applies multipliers without corrupting base scenarios.
- **Acceptance Criteria & Verification:**
  - Toggling between Cadet and Explorer in the Settings modal changes HUD displays across all missions in real-time.
  - Cadet receives $\ge 30\%$ extended safety margin on battery drain, water reserve, and shelter warnings.
  - Automated tests confirm Explorer mode leaves authored scenario values completely unmodified.

---

### Task 1.4: Provenance Registry Completeness & Sources Page Interactive Inspector
- **Priority:** P0
- **Estimated Effort:** 1.0 Day
- **Implementation Complexity:** Low
- **Expected Impact:**
  - *Learning:* Teaches students the scientific method: distinguishing between raw observations, derived models, and game rules.
  - *Engagement:* Gives students and teachers an in-game "NASA Detective" portal to inspect where mission data came from.
  - *Scientific Accuracy:* Full compliance with NASA Open Data attribution guidelines and educational review standards.
- **Dependencies:** Task 1.1.
- **Required Datasets:** `public/data/provenance.json`, `public/data/model-assumptions.json`.
- **Affected Existing Code Components:**
  - `sources.html`: Enrich layout with interactive cards displaying source ID, agency, SHA-256 digest, and limitations.
  - `simulation/provenance.js`: Ensure `validateSource()` checks all fields strictly.
  - `missions/shared/hud.js`: Add a subtle "Science Source" info badge on HUD instrument panels that deep-links directly to the corresponding source entry.
- **Acceptance Criteria & Verification:**
  - Every mission route in `mission-registry.js` with non-empty `sourceIds` maps 100% to registered entries in `provenance.json`.
  - The `/sources` page passes HTML validation and renders correctly without external CSS/JS dependencies.
  - Clicking a source link opens the verifiable agency publication or PDS archive in a safe target tab.

---

### Task 1.5: Deterministic 5–7 Minute Golden Path Demo with Branching Outcomes
- **Priority:** P0
- **Estimated Effort:** 1.5 Days
- **Implementation Complexity:** Medium
- **Expected Impact:**
  - *Learning:* Demonstrates that planning choices have tangible, immediate operational consequences.
  - *Engagement:* Provides judges, teachers, and first-time students an engaging, rapid-play demonstration route.
  - *Scientific Accuracy:* Proves replay determinism: the exact same choices yield identical reserve deltas every single time.
- **Dependencies:** Tasks 1.2, 1.3.
- **Required Datasets:** Bundled normalized datasets (`data/normalized.json`).
- **Affected Existing Code Components:**
  - `sampler.html` / `simulation/sampler.js`: Refactor mini-game sampler into a structured 5-minute showcase.
  - `missions/base-boss/`: Provide two pre-seeded initial conditions demonstrating a "Sustainable Plan" vs. an "Unprepared Crisis".
  - `test/sampler.test.js`: Add automated validation for the quick demo path.
- **Acceptance Criteria & Verification:**
  - Playthrough completes in 5 to 7 minutes of active play.
  - Branch A (protective layout) results in ready crew and green battery (>20%); Branch B (rushed layout) triggers warning alarms and degraded crew condition.
  - Two consecutive runs with identical choices result in 100% bit-exact final resource counts.

---

## Phase 2: High-Value Scientific Data Integrations (P1)

*Objective: Infuse missions with deeper real-world space agency data, multi-epoch planetary ephemerides, high-resolution terrain tiles, and authentic space station dosimetry.*

### Task 2.1: Multi-Epoch JPL Horizons Communication Delay Simulator
- **Priority:** P1
- **Estimated Effort:** 3.0 Days
- **Implementation Complexity:** Medium
- **Expected Impact:**
  - *Learning:* Teaches orbital mechanics and planetary geometry: why sending a message to Mars can take 4 minutes at opposition (close approach) versus 24 minutes at solar conjunction (far side of the Sun).
  - *Engagement:* Students must plan autonomous repairs when Earth is on the far side of the Sun, or enjoy rapid ground control assistance during close approach.
  - *Scientific Accuracy:* Replaces single static light-time constant with real multi-epoch JPL Horizons DE441 ephemeris curves.
- **Dependencies:** Phase 1 complete.
- **Required Datasets:**
  - JPL Horizons Ephemeris API (`ssd.jpl.nasa.gov/api/horizons.api`): Target `499` (Mars), Observer `500@399` (Earth), Quantity `21` (One-Way Down-Leg Light Time).
  - Epochs: 2026-Nov-14 (Opposition approach: ~11.0 min), 2027-Aug-01 (Conjunction approach: ~21.8 min), and Lunar Earth-Moon (0.0225 min / 1.35 sec).
- **Affected Existing Code Components:**
  - `scripts/normalize-nasa-data.mjs`: Parse multi-epoch Horizons files into `marsLightTimeProfiles`.
  - `public/data/raw/horizons-mars-earth-multi-epoch.txt`: New archived raw query response.
  - `missions/earth-delay/scenario.js`: Add epoch selector or mission-date progression that scales round-trip delay.
  - `missions/base-boss/controller.js`: Link communication turn delays to active mission Sol and orbital geometry.
- **Acceptance Criteria & Verification:**
  - Ingest script extracts and hashes multi-epoch rows with full validation.
  - Mission 6 (*Message to Earth*) allows switching between "Close Approach" (11 min) and "Far Alignment" (22 min).
  - Packet travel times match Horizons Quantity 21 down to millisecond precision.

---

### Task 2.2: Second HiRISE Jezero Crater Traverse & Dynamic Slope Traction Model
- **Priority:** P1
- **Estimated Effort:** 4.0 Days
- **Implementation Complexity:** Medium
- **Expected Impact:**
  - *Learning:* Real planetary geology: distinguishes between smooth delta sediments (high traction, low slope) and steep boulder-strewn crater rims (low traction, high roll resistance).
  - *Engagement:* Rover driving feels tactile and strategic; taking the direct route risks stalling on loose sand dunes.
  - *Scientific Accuracy:* Derived from actual MRO HiRISE 1m/pixel stereo terrain models (`ESP_023524_1985`).
- **Dependencies:** Task 1.1.
- **Required Datasets:**
  - HiRISE Jezero DTM `DTEEC_023524_1985_023379_1985_U01` (University of Arizona / NASA PDS).
  - Cropped sub-window at Jezero Delta Front (Lines 1500–1740, Samples 2000–2210).
- **Affected Existing Code Components:**
  - `scripts/fetch-jezero-dtm.py`: Add command-line arguments to fetch and export secondary crater window (`jezero-delta.js`).
  - `data/jezero-terrain.js`: Support multi-map terrain selection with discrete elevation headers.
  - `missions/rover/` & `mission2.js`: Integrate terrain slope $\Delta z / \Delta d$ directly into rover battery drain equations.
- **Acceptance Criteria & Verification:**
  - Python fetch script uses HTTP Range Requests to download $< 25\text{ MB}$ of PDS data to generate the new window.
  - Rover telemetry displays instantaneous grade percentage and dynamic wheel slip.
  - Steep climbs consume up to $2.5\times$ more watt-hours per meter than level traverses.

---

### Task 2.3: Lunar Polar Illumination Dual-Site Comparative Module (LOLA 60m)
- **Priority:** P1
- **Estimated Effort:** 3.5 Days
- **Implementation Complexity:** Medium
- **Expected Impact:**
  - *Learning:* Explains why the Artemis program and future Moon bases target the Lunar South Pole: "Peaks of Eternal Light" provide near-continuous solar energy while deep craters remain in permanent shadow (craters of eternal darkness holding water ice).
  - *Engagement:* Students scout and place solar towers and cables across contrasting polar terrains.
  - *Scientific Accuracy:* Uses 18.6-year average solar visibility rasters from NASA Lunar Reconnaissance Orbiter (LRO) LOLA data product `AVGVISIB_85S_060M_201608`.
- **Dependencies:** Task 1.1.
- **Required Datasets:**
  - LRO LOLA South Polar Illumination Product (NASA GSFC / PDS Geosciences).
  - Window A: Shackleton Crater Rim (High illumination: ~0.84 fraction).
  - Window B: Connecting Ridge / Floor Depression (Low illumination: ~0.26 fraction).
- **Affected Existing Code Components:**
  - `public/data/raw/lunar-illumination/patches.json`: Register two verified 5×5 pixel windows with SHA-256 digests.
  - `scripts/normalize-nasa-data.mjs`: Compute mean fractions and scale factors for both candidate sites.
  - `missions/lunar-sunlight/scenario.js`: Offer two landing site options with distinct solar availability and shadow frequencies.
- **Acceptance Criteria & Verification:**
  - Shackleton site requires shorter battery storage buffers; valley floor site requires extensive battery banks or long power cable runs to elevated rims.
  - Ingest pipeline enforces digital number bounds $[0, 25000]$ and 0.00004 scaling.

---

### Task 2.4: ISS RadLab Telemetry Integration (Space Station Dosimetry Lab)
- **Priority:** P1
- **Estimated Effort:** 3.5 Days
- **Implementation Complexity:** Medium
- **Expected Impact:**
  - *Learning:* Students learn how radiation levels fluctuate in Low Earth Orbit (LEO) as the International Space Station passes through the South Atlantic Anomaly (SAA) versus polar cusps.
  - *Engagement:* An interactive "Dosimeter Lab" mini-game where students inspect real radiation detectors on the ISS.
  - *Scientific Accuracy:* Direct integration of NASA RadLab dosimeter telemetry (`absorbed_dose_rate` in µGy/h).
- **Dependencies:** Task 1.4.
- **Required Datasets:**
  - NASA OSDR RadLab API (`visualization.osdr.nasa.gov/radlab/gui/data-api/`).
  - Instrument: ISS Radiation Environment Monitor (REM) or Liulin-5.
  - Sample Time Window: 24-hour orbit trace covering SAA passes.
- **Affected Existing Code Components:**
  - `scripts/fetch-radlab-data.mjs`: New developer-time script querying the RadLab API and archiving to `public/data/raw/radlab-iss-2024.json`.
  - `scripts/normalize-nasa-data.mjs`: Normalize absorbed dose rates and orbit timestamps into compact game arrays.
  - `missions/orbit/` / `missions/shared/`: Integrate dosimeter telemetry readout into the orbital arrival checklist.
- **Acceptance Criteria & Verification:**
  - Raw JSON contains valid instrument IDs, UTC timestamps, and µGy/h readings.
  - The in-game dosimeter graph spikes accurately during modeled passes through the South Atlantic Anomaly.

---

### Task 2.5: Opportunity Dust Storm Time-Compression & Power Curve Normalization
- **Priority:** P1
- **Estimated Effort:** 2.0 Days
- **Implementation Complexity:** Low
- **Expected Impact:**
  - *Learning:* Teaches the exponential decline of atmospheric solar flux during global Martian dust storms (tau optical depth).
  - *Engagement:* A dramatic countdown where available generator power drops in real-time, forcing urgent triage.
  - *Scientific Accuracy:* Preserves original sol-by-sol watt-hour measurements from the MER Opportunity June 2018 event, with transparent documentation of time-compression.
- **Dependencies:** Task 1.1.
- **Required Datasets:** `data/opportunity-2018.js` (Planetary Society / JPL MER team telemetry).
- **Affected Existing Code Components:**
  - `data/opportunity-2018.js`: Add explicit JSDoc and metadata documenting the 5-day real decline compressed into a 9-minute game sequence.
  - `missions/storm/`: Ensure the storm solar curve uses the normalized series with units clearly indicated in Explorer mode.
  - `public/data/model-assumptions.json`: Explicitly record the time compression factor ($800\times$).
- **Acceptance Criteria & Verification:**
  - Solar generation curve accurately reflects Opportunity's decline from 645 Wh down to 22 Wh.
  - HUD displays a clear "Time-Compressed Simulation" tag with real Sol indicators.

---

## Phase 3: Major Mission Redesigns & Architectural Unification (P1)

*Objective: Modernize legacy standalone mission code into the shared modular engine, introduce closed-loop life support (ECLSS), build the new "Station Shift" orbital mission, and balance career carryover.*

### Task 3.1: Legacy Controller Refactoring (`storm.js` & `mission2.js` Migration)
- **Priority:** P1
- **Estimated Effort:** 6.0 Days
- **Implementation Complexity:** High
- **Expected Impact:**
  - *Learning:* Standardizes interaction patterns (inspection, tool use, diagnosis) across all 11 missions.
  - *Engagement:* Eliminates confusing UI inconsistencies and controls discrepancies between older and newer chapters.
  - *Scientific Accuracy:* Connects legacy missions to the unified `simulation/resources.js` and `simulation/clock.js` engines.
- **Dependencies:** Phase 1 complete.
- **Required Datasets:** None.
- **Affected Existing Code Components:**
  - `storm.html` & `demo.js`: Refactor into `missions/storm/` using `missions/shared/controller.js`.
  - `mission2.html` & `mission2.js`: Refactor into `missions/rover/` using `missions/shared/controller.js`.
  - `missions/shared/runtime.js` & `missions/shared/engine.js`: Ensure shared support for driving and rover camera nodes.
- **Acceptance Criteria & Verification:**
  - All missions run on the unified `missions/shared/` controller architecture.
  - No legacy global event listeners or unmanaged animation frames remain.
  - All existing mission 2 and storm tests pass without regressions.

---

### Task 3.2: Closed-Loop ECLSS Mass Balance & Water Recovery in Base Boss
- **Priority:** P1
- **Estimated Effort:** 5.0 Days
- **Implementation Complexity:** High
- **Expected Impact:**
  - *Learning:* Teaches Environmental Control and Life Support Systems (ECLSS) principles: recycling water, purifying humidity condensate, and managing graywater loops.
  - *Engagement:* Players manage a living ecosystem where watering crops generates transpiration moisture that life-support systems reclaim.
  - *Scientific Accuracy:* Inspired by NASA's demonstrated 98% water recovery milestone achieved aboard the ISS in 2023.
- **Dependencies:** Task 3.1.
- **Required Datasets:** NASA ECLSS Technical Reports (NASA/TP-2015-218570/REV2, BVAD Baseline Guidelines).
- **Affected Existing Code Components:**
  - `simulation/resources.js`: Enhance `moveWater()` to support multi-tank systems: `cleanWaterKg`, `wasteWaterKg`, and `reclaimedWaterKg`.
  - `missions/base-boss/controller.js`: Implement water recycling loops with realistic efficiency factors ($90\% - 98\%$) and pump power requirements.
  - `missions/greenhouse/`: Link plant transpiration to cabin humidity and atmospheric water extraction.
- **Acceptance Criteria & Verification:**
  - Total water mass ($M_{\text{clean}} + M_{\text{waste}} + M_{\text{biomass}} + M_{\text{shield}}$) is conserved within $1\times 10^{-6}\text{ kg}$ across all simulation cycles.
  - Running water purification consumes electrical power and recovers up to 98% of graywater.

---

### Task 3.3: "Station Shift" - New Orbital Systems & Human Research Mission
- **Priority:** P1
- **Estimated Effort:** 6.0 Days
- **Implementation Complexity:** High
- **Expected Impact:**
  - *Learning:* Teaches the realities of human spaceflight: astronauts spend hours every day maintaining life support, exercising to prevent bone/muscle loss, and adhering to strict circadian sleep hygiene.
  - *Engagement:* A fast-paced, high-stakes shift aboard an orbital station where unexpected hardware alarms disrupt daily schedules.
  - *Scientific Accuracy:* Incorporates published NASA Human Research Program (HRP) data on bone density, muscle atrophy, and circadian rhythms.
- **Dependencies:** Task 3.1, Task 2.4.
- **Required Datasets:**
  - NASA HRP Space Physiology Research (Bone loss DXA studies, Smith et al. 2012).
  - Published ISS Astronaut Sleep & Circadian Alignment Data (Barger et al. 2014).
- **Affected Existing Code Components:**
  - `mission-registry.js`: Register new mission `{id: 'station-shift', path: 'station-shift', campaign: 'mars', order: 0}`.
  - `missions/station-shift/`: Create scenario, state, action, scene, and UI modules.
  - `scripts/generate-models.js`: Add procedural models for exercise treadmill (T2/COLBERT style) and sleeping quarters.
  - `public/data/provenance.json`: Register NASA HRP citations.
- **Acceptance Criteria & Verification:**
  - Mission guides students through scheduling 3 crew members across ECLSS maintenance, resistance exercise, and sleep.
  - Skipping maintenance causes equipment breakdown; skipping sleep causes human error rate penalties.
  - Full automated scenario test suite verifies completion conditions and badge awards.

---

### Task 3.4: Cross-Mission Career Progression & Non-Punitive Carryover Balancing
- **Priority:** P1
- **Estimated Effort:** 3.5 Days
- **Implementation Complexity:** Medium
- **Expected Impact:**
  - *Learning:* Encourages long-term systems thinking: actions taken in Sol 12 ripple forward to Sol 35.
  - *Engagement:* Creates a sense of persistent ownership over the expedition without locking players into unwinnable fail-states.
  - *Scientific Accuracy:* Models realistic mission logistics where supply margins and equipment health carry forward.
- **Dependencies:** Task 1.2, Task 3.1.
- **Required Datasets:** None.
- **Affected Existing Code Components:**
  - `journey-state.js`: Enhance `readMissionCarry()` and `finishChapter()` to pass structured, bounded carry assets (e.g., extra spare valve, 15% battery reserve bonus).
  - `simulation/difficulty.js`: Ensure carryover bonuses are purely beneficial (tactical advantage) and that poor previous performance defaults to standard baseline rather than crippling the player.
  - `test/journey-state.test.js`: Add rigorous tests verifying that corrupted or missing carry data gracefully falls back to default scenarios.
- **Acceptance Criteria & Verification:**
  - Successfully sheltering rover during the storm awards a charged spare battery in the next outpost mission.
  - Failing a previous mission never renders subsequent missions unplayable.
  - Direct chapter selection (judge/teacher sampler) functions cleanly with zero prior carry state.

---

### Task 3.5: Mobile / Tablet Touch Interaction & Kid-Friendly Usability Hardening
- **Priority:** P1
- **Estimated Effort:** 4.0 Days
- **Implementation Complexity:** Medium
- **Expected Impact:**
  - *Learning:* Enables seamless use in 1:1 iPad and touchscreen Chromebook classrooms.
  - *Engagement:* Tactile, direct manipulation of switches, dials, and rover steering wheels.
  - *Scientific Accuracy:* Uncompromised simulation fidelity across varying screen aspect ratios.
- **Dependencies:** Phase 1 complete.
- **Required Datasets:** None.
- **Affected Existing Code Components:**
  - `missions/shared/picking.js`: Add multi-touch drag suppression and virtual touch joystick support for 3D exploration.
  - `hud-redesign.css` & `kid-theme.css`: Enforce minimum $48\times 48\text{px}$ touch target sizes for all interactive buttons and dials.
  - `missions/shared/hud.js`: Adapt layout dynamically for 4:3, 16:10, and 16:9 mobile viewports.
- **Acceptance Criteria & Verification:**
  - All missions are 100% playable without a physical keyboard or mouse.
  - Virtual joystick and touch-to-interact allow full rover navigation and tool manipulation.
  - Tested and verified on simulated touch devices in Chrome DevTools and real iPad/Android tablets.

---

## Phase 4: Advanced Simulations & Interactive Environments (P2)

*Objective: Deliver cutting-edge visual and procedural enhancements, lunar CLPS robotic exploration, dynamic shaders, audio synthesis, and offline PWA distribution.*

### Task 4.1: "Survey Before You Land" - Lunar CLPS Robotic Precursor Mission
- **Priority:** P2
- **Estimated Effort:** 7.0 Days
- **Implementation Complexity:** High
- **Expected Impact:**
  - *Learning:* Teaches the strategic progression of planetary exploration: robotic probes scout landing sites, verify terrain safety, and deploy communication relays years before human crews arrive.
  - *Engagement:* Students control a commercial lunar lander (CLPS-style, like Firefly Blue Ghost or Intuitive Machines Nova-C) to scout candidate sites for Artemis base camps.
  - *Scientific Accuracy:* Grounded in NASA Commercial Lunar Payload Services (CLPS) operations and LRO landing site surveys.
- **Dependencies:** Phase 2 complete.
- **Required Datasets:**
  - LRO NAC (Narrow Angle Camera) High-Resolution Imagery of South Pole sites.
  - LRO LOLA Elevation Profiles for rim slopes.
- **Affected Existing Code Components:**
  - `mission-registry.js`: Add `{id: 'lunar-survey', path: 'lunar-survey', campaign: 'moon', order: 0}`.
  - `missions/lunar-survey/`: New mission directory with terrain scanning and site rating mechanics.
  - `scripts/generate-lunar-models.js`: Add CLPS lander model and deployable micro-probes.
- **Acceptance Criteria & Verification:**
  - Students evaluate two candidate lunar landing sites based on slope ($\le 8^\circ$), permanent shadow access, and Earth line-of-sight.
  - Automated mission test suite validates completion criteria.

---

### Task 4.2: Dynamic 3D Solar Panel Dust Deposition & Clearing Shader System
- **Priority:** P2
- **Estimated Effort:** 5.0 Days
- **Implementation Complexity:** High
- **Expected Impact:**
  - *Learning:* Visually connects the scientific data curve (Opportunity's dropping power) with the physical reality of Martian dust accumulation.
  - *Engagement:* Stunning visual feedback as blowing red dust settles on gleaming blue solar cells, and clearing tools wipe it clean.
  - *Scientific Accuracy:* Dust accumulation rates and optical obscuration match Mars exploration findings.
- **Dependencies:** Task 3.1.
- **Required Datasets:** NASA Mars Exploration Rover (MER) dust accumulation and cleaning event photojournal records.
- **Affected Existing Code Components:**
  - Three.js Custom Shader Material (`missions/shared/shaders/dustShader.js`): Blend base solar panel texture with procedural dust noise based on `dustCoverage` uniform.
  - `missions/storm/` & `missions/lunar-dust/`: Bind simulation `dustMassKg` directly to the 3D shader uniforms.
- **Acceptance Criteria & Verification:**
  - Solar panels visually turn dusty red as storm progresses.
  - Cleaning actions dynamically update the shader uniform, restoring specular highlights and blue crystalline appearance.
  - Shader compiles cleanly across WebGL 1.0 and 2.0 without dropping frame rates below 60 FPS on integrated GPUs.

---

### Task 4.3: Real-Time Procedural Voice Synthesis Scaffolding for Pip Robot
- **Priority:** P2
- **Estimated Effort:** 4.0 Days
- **Implementation Complexity:** Medium
- **Expected Impact:**
  - *Learning:* Supports emergent readers (ages 7–8) and auditory learners by speaking mission objectives and scientific hints aloud.
  - *Engagement:* Brings Pip the robot companion to life with a friendly, responsive voice.
  - *Scientific Accuracy:* Provides accessible audio descriptions of complex space data.
- **Dependencies:** Task 1.3.
- **Required Datasets:** Scripted dialogue manifests (`scripts/generate-voices-*.py`).
- **Affected Existing Code Components:**
  - `journey.js` & `missions/shared/hud.js`: Integrate Web Speech API (`window.speechSynthesis`) as an intelligent fallback when pre-rendered OGG voice clips are absent.
  - `settings-dialog`: Add Speech Volume, Voice Pitch, and "Read Aloud" toggle controls.
- **Acceptance Criteria & Verification:**
  - Clicking Pip's speech bubble plays the recorded high-quality OGG clip or speaks via browser synthesis within 150ms.
  - Full caption text remains on screen to ensure complete accessibility for hearing-impaired students.

---

### Task 4.4: In-Browser PWA Offline Service Worker & Zero-Install Classroom Distribution
- **Priority:** P2
- **Estimated Effort:** 4.0 Days
- **Implementation Complexity:** Medium
- **Expected Impact:**
  - *Learning:* Eliminates downtime caused by classroom network drops during school lab sessions.
  - *Engagement:* Installable as a standalone desktop app on Chromebooks, Windows, and Mac with a dedicated launch icon.
  - *Scientific Accuracy:* Guarantees that students always run the exact validated data bundle.
- **Dependencies:** Deliverable F architecture implementation.
- **Required Datasets:** None.
- **Affected Existing Code Components:**
  - `vite.config.js`: Integrate `vite-plugin-pwa` or custom zero-dependency Service Worker build script.
  - `sw.js`: Implement Cache-First offline caching strategy described in Deliverable F Section 8.
  - `manifest.webmanifest`: Configure app icons, theme colors (`#1a103c`), orientation, and display mode (`standalone`).
- **Acceptance Criteria & Verification:**
  - Disconnecting internet completely and reloading the page serves the full application without errors.
  - Lighthouse PWA audit scores $\ge 95/100$.

---

### Task 4.5: Longitudinal Multi-Sol Outpost Expedition Engine (Thirty Sols + MEDA Weather)
- **Priority:** P2
- **Estimated Effort:** 6.0 Days
- **Implementation Complexity:** High
- **Expected Impact:**
  - *Learning:* Teaches seasonal cycles, long-term resource management, and resilience over extended expeditions.
  - *Engagement:* A deep "survival mode" for advanced students and classrooms running week-long space mission simulations.
  - *Scientific Accuracy:* Incorporates daily pressure, temperature, and atmospheric tau readings from Perseverance's MEDA instrument (Mars Environmental Dynamics Analyzer).
- **Dependencies:** Task 3.2, Task 2.5.
- **Required Datasets:**
  - Mars 2020 MEDA PDS Archive (`urn:nasa:pds:mars2020_meda`).
  - Sample window: 30 consecutive sols of surface pressure, wind, and optical depth.
- **Affected Existing Code Components:**
  - `campaign.html` & `outpost.js`: Modernize Thirty Sols turn-based engine to consume real MEDA daily weather records.
  - `public/data/raw/meda-30-sols.json`: New archived raw weather bundle.
  - `simulation/decision-review.js`: Provide multi-sol graph summaries of battery, air, water, and food trends.
- **Acceptance Criteria & Verification:**
  - Weather variations across the 30 sols reflect real diurnal atmospheric cycles measured by Perseverance in Jezero Crater.
  - Decision review clearly indicates which early resource allocation prevented a late-expedition shortfall.

---

## Phase 5: Long-Term Expansion & Open Science Platform (P2)

*Objective: Extend the simulator beyond current mission bounds into cutting-edge space technology: Mars ISRU oxygen generation, planetary defense, deep-space telescopes, and collaborative classroom networks.*

### Task 5.1: "Oxygen on a Short Power Budget" - Mars MOXIE ISRU Module
- **Priority:** P2
- **Estimated Effort:** 7.0 Days
- **Implementation Complexity:** High
- **Expected Impact:**
  - *Learning:* Teaches In-Situ Resource Utilization (ISRU): turning Martian atmospheric carbon dioxide ($CO_2$) into breathable oxygen ($O_2$) using solid oxide electrolysis.
  - *Engagement:* High-stakes energy balancing: do we run the oxygen generator during peak daylight, or save power for habitat heaters as night approaches?
  - *Scientific Accuracy:* Based on the real NASA MOXIE experiment aboard the Perseverance rover (completed September 2023, producing $122\text{ g}$ of oxygen total).
- **Dependencies:** Phase 3 complete.
- **Required Datasets:** NASA MOXIE Final Mission Report (NASA JPL / MIT).
- **Affected Existing Code Components:**
  - `mission-registry.js`: Add `{id: 'mars-moxie', path: 'mars-moxie', campaign: 'mars', order: 7}`.
  - `missions/mars-moxie/`: Create scenario simulating $CO_2$ compressor, solid oxide electrolysis cell (SOEC), and high-pressure oxygen storage tanks.
  - `simulation/resources.js`: Add gas storage and thermodynamic load functions.
- **Acceptance Criteria & Verification:**
  - Oxygen production rate scales with power input and operating temperature ($\sim 800^\circ\text{C}$ pre-heat cycle).
  - Students must balance tank oxygen reserves against declining nighttime battery charge.

---

### Task 5.2: Planetary Defense Reconnaissance (DART Impact Characterization & Hera)
- **Priority:** P2
- **Estimated Effort:** 8.0 Days
- **Implementation Complexity:** High
- **Expected Impact:**
  - *Learning:* Teaches orbital mechanics, kinetic impact deflection, and international space agency cooperation (NASA DART + ESA Hera).
  - *Engagement:* Students pilot a reconnaissance probe to map Dimorphos's altered orbit and impact crater under tight downlink bandwidth limits.
  - *Scientific Accuracy:* Grounded in published post-impact orbit change data (33-minute period reduction) and Hera mission instruments.
- **Dependencies:** Task 2.1.
- **Required Datasets:** NASA DART Mission Archive & ESA Hera Mission Operations Overview (November 2026 data).
- **Affected Existing Code Components:**
  - New elective campaign: "Planetary Defense".
  - `missions/dart-survey/`: Orbital simulation and downlink queue mechanics.
- **Acceptance Criteria & Verification:**
  - Orbital period changes accurately reflect the measured 33-minute kinetic deceleration.
  - Downlink priority puzzle forces students to choose which high-resolution science images to transmit before ground station loss of signal.

---

### Task 5.3: Deep Space Infrared Observatory Scheduling (JWST Thermal & Pointing Lab)
- **Priority:** P2
- **Estimated Effort:** 8.0 Days
- **Implementation Complexity:** High
- **Expected Impact:**
  - *Learning:* Teaches infrared astronomy constraints: observatories must keep their mirrors cryogenically cold ($< 40\text{ K}$) behind a 5-layer sunshield while pointing at celestial targets.
  - *Engagement:* Students schedule telescope observation targets across deep space while avoiding pointing angles that expose cold mirrors to the Sun.
  - *Scientific Accuracy:* Incorporates real JWST Field of Regard (FOR) pointing constraints and MAST archive datasets.
- **Dependencies:** Phase 3 complete.
- **Required Datasets:** STScI JWST Science Operations Documentation & MAST Public Archive metadata.
- **Affected Existing Code Components:**
  - New elective chapter: "Eye in the Deep".
  - 3D Sunshield thermal model in Three.js displaying temperature gradients.
- **Acceptance Criteria & Verification:**
  - Mirror temperature rises dangerously if pointed outside the legal Field of Regard.
  - Successful observations award authentic astronomical spectral graphs.

---

### Task 5.4: Multi-Terminal Classroom Flight Director LAN Mode
- **Priority:** P2
- **Estimated Effort:** 10.0 Days
- **Implementation Complexity:** High
- **Expected Impact:**
  - *Learning:* Teaches real NASA Mission Control team dynamics: Flight Director (FLIGHT), Life Support (EECOM), Communications (CAPCOM), and Science Officer (SURFACE) collaborating to solve crises.
  - *Engagement:* Unprecedented classroom excitement as 4 students work together from separate computers to complete a single expedition.
  - *Scientific Accuracy:* Emulates actual NASA flight control console roles and communication protocols.
- **Dependencies:** Phase 3 complete.
- **Required Datasets:** None.
- **Affected Existing Code Components:**
  - WebRTC DataChannels / Local `BroadcastChannel` / WebSockets: Zero-configuration local network synchronization.
  - `journey.js`: Add "Multiplayer Mission Control" toggle in the main menu.
  - Role-specific UI views (CAPCOM sees message queue; EECOM sees power/water bus; NAV sees rover 3D terrain).
- **Acceptance Criteria & Verification:**
  - Operates seamlessly across local school Wi-Fi without requiring cloud servers or student account logins.
  - State changes made by EECOM immediately reflect on the Flight Director's master dashboard.

---

### Task 5.5: Open NASA Ingest Studio & Educator Mission Customization Toolkit
- **Priority:** P2
- **Estimated Effort:** 8.0 Days
- **Implementation Complexity:** Medium
- **Expected Impact:**
  - *Learning:* Empowers teachers and STEM educators to create custom lesson plans around breaking space events (e.g., a major solar flare that happened yesterday).
  - *Engagement:* Students can import their own local rover routes or space weather scenarios.
  - *Scientific Accuracy:* Democratizes scientific data curation through an intuitive, validated GUI.
- **Dependencies:** Task 1.4, Deliverable F ingest pipeline.
- **Required Datasets:** NASA Open APIs, CCMC DONKI, PDS.
- **Affected Existing Code Components:**
  - `/studio`: New web GUI route for authoring and exporting JSON scenario files.
  - Schema validator ensuring all user-authored scenarios satisfy `validateSource()` and physical invariants.
- **Acceptance Criteria & Verification:**
  - Educators can paste a NASA CCMC SEP event URL and export a playable scenario bundle.
  - Exported bundles load cleanly into the simulator with complete provenance metadata intact.

---

## Complete Phased Implementation Timeline & Effort Matrix

| Phase | Tasks Included | Priority | Total Effort (Days) | Target Completion Window | Key Milestone Deliverable |
|---|---|---|---|---|---|
| **Phase 1: Quick Wins** | 1.1, 1.2, 1.3, 1.4, 1.5 | **P0** | **7.0 Days** | Weeks 1–2 | Clean 241-test baseline, Curiosity RAD in pipeline, 5-min demo. |
| **Phase 2: Scientific Data** | 2.1, 2.2, 2.3, 2.4, 2.5 | **P1** | **15.5 Days** | Weeks 3–6 | Multi-epoch Horizons, 2nd Jezero DTM, LOLA illumination, RadLab. |
| **Phase 3: Major Redesigns** | 3.1, 3.2, 3.3, 3.4, 3.5 | **P1** | **24.5 Days** | Weeks 7–12 | Refactored shared engine, closed-loop ECLSS, Station Shift mission. |
| **Phase 4: Advanced Systems** | 4.1, 4.2, 4.3, 4.4, 4.5 | **P2** | **26.0 Days** | Weeks 13–18 | CLPS Lunar Survey, dynamic dust shaders, offline PWA, 30 Sols MEDA. |
| **Phase 5: Long-Term Horizon**| 5.1, 5.2, 5.3, 5.4, 5.5 | **P2** | **41.0 Days** | Weeks 19–28 | MOXIE ISRU, DART/Hera, JWST, Multi-terminal classroom LAN mode. |
| **TOTAL** | **25 Tasks** | | **114.0 Days** | **~6 Months** | **Comprehensive NASA-Aligned Mission Trainer Platform** |

---

## Risk Management & Mitigation Matrix

| Identified Risk | Severity | Probability | Automated & Architectural Mitigation |
|---|---|---|---|
| **Upstream NASA API Changes** | Medium | Medium | All raw data is pre-bundled in `public/data/raw/` with SHA-256 validation. Zero runtime API calls. Upstream breakages never impact active players. |
| **School Firewall Restrictions** | High | High | App is 100% static, requires no backend server, has zero cross-origin tracker calls, and functions completely offline via Service Worker. |
| **Cognitive Overload for Ages 7–9** | High | Medium | Strict Cadet mode tuning replaces numeric units with intuitive visual dials and qualitative words ("Good", "Low", "Urgent"); Pip provides progressive guidance hints. |
| **Performance Drops on Chromebooks** | High | Medium | Three.js budget $< 35$ draw calls, $< 45\text{k}$ polys, procedural GLBs, vertex coloring, and single-light shadow rendering. Dynamic low-graphics toggle available. |
| **Accidental NASA API Key Leakage** | Critical | Low | Zero `VITE_` private variables. Keys reside outside repo in `~/api.txt`. Ingest scripts sanitize query strings before committing provenance records. |
| **Replay & Grading Non-Determinism** | High | Low | Seeded Linear Congruential PRNG with discrete $\le 1\text{s}$ sub-step clock engine. Verified bit-exact resource reproducibility in automated tests. |
