# Deliverable D: Mission Redesign Blueprint
**Junior Astronaut Mission Trainer**
*Author: Mission Design Specialist*
*Document Reference: AGY-JAMT-DELIV-D*
*Target Platforms: Static Web / Vite / Three.js / ES Modules*
*Target Age Tiers: Cadet (Ages 7–9) & Explorer (Ages 10–12+)*

---

## Executive Summary & Design System

The Mission Redesign Blueprint establishes an end-to-end pedagogical and gameplay specification for all **fourteen (14)** missions of the *Junior Astronaut Mission Trainer* (11 existing missions audited and redesigned + 3 brand-new missions). 

Each mission transforms authentic NASA/ESA/partner spaceflight engineering challenges, scientific observations, and physical principles into engaging, age-scaffolded simulation gameplay. The design strictly preserves the separation between **empirically observed NASA data** (ephemerides, surface DTMs, solar output curves, space weather particle events, plant photoperiods) and **authored pedagogical abstractions** (simplified power units, game-time scaling, bounded risk thresholds), as documented in `provenance.json` and `model-assumptions.json`.

### Dual-Tier Scaffolding Model
- **Cadet Tier (Ages 7–9):** Maximizes visual and physical intuition; presents at most three primary variables simultaneously; wider safety margins (+20% to +50% battery/water/air); earlier warnings from Pip; forgiving hold-times; clear binary/ternary qualitative decisions with visible direct consequences.
- **Explorer Tier (Ages 10–12+):** Exposes authentic engineering units (Watts, Watt-hours, Litres, µGy/h, degrees of slope, signal latency in minutes/seconds); tight margins requiring multi-variable optimization; cascading failure modes; multi-step diagnosis and evidence-backed rationale debriefs.

---

## 1. Arrival at Mars (`/orbit`)
*Station Rendezvous, Electrical Diagnostics, and Landing Hazard Certification*

### Evaluation
**Improve & Connect.** Retain the three-phase structure (approach/docking, orbital diagnostics, and descent planning) while tightening the scientific connection to real Artemis/Perseverance operations. Replace the fictional radio fault with an authentic test-and-verify bus isolation procedure. Connect landing site selection directly to real HiRISE slope and hazard data, and pass the touchdown site and vehicle integrity into the surface campaign carry state.

### 1. Mission Identity
- **Title:** Arrival at Mars
- **Real-World Inspiration:** Artemis II/III vehicle checkouts; Mars Reconnaissance Orbiter (MRO) / 2001 Mars Odyssey telecommunications relay passes; Perseverance Mars 2020 Terrain-Relative Navigation (TRN) landing at Jezero Crater.
- **Category:** Spacecraft Flight Operations / Telecommunications / Orbital Mechanics.
- **Difficulty:** Introductory (Cadet: guided checklists, automated docking alignment, wide landing ellipses; Explorer: manual RCS velocity dampening, electrical bus troubleshooting, rock-hazard landing optimization).
- **Learning Objectives:**
  1. Understand orbital solar/shadow cycles and why spacecraft rely on batteries during planetary occultation.
  2. Master safe electrical isolation procedures (de-energizing loads before swapping physical hardware).
  3. Analyze the trade-off between landing proximity to an outpost vs terrain hazard safety (landing ellipses and terrain-relative navigation).

### 2. Scientific Foundation
- **Concepts:** Low-Mars orbit period (~120 min), orbital eclipse/shadow fraction (~35 min), solar array generation vs battery depth-of-discharge, electrical bus isolation, line-of-sight telecommunication relay windows, landing ellipses, terrain hazard distribution.
- **Real Datasets & Research:**
  - *HiRISE Jezero Digital Terrain Model (DTM)* (`ESP_023524_1985`) for landing site elevation, slope gradients, and boulder fields.
  - *NASA Mars 2020 TRN Overview*: Autonomous Lander Vision System (LVS) hazard avoidance.
  - *Artemis Mission Flight Rules*: Staged system checkouts and electrical safety protocols.
- **Measurements:** Orbit period $T = 120\text{ min}$; shadow interval $t_{\text{shadow}} = 35\text{ min}$; solar generation $P_{\text{sun}} = 10\text{ units}$, $P_{\text{shadow}} = 6\text{ units}$ (battery discharge); landing ellipse semi-major axis $a = 6.0\text{ km}$, reduced by beacon to $a' = 3.3\text{ km}$.
- **Simplifications & Pedagogical Abstractions:** Real Mars orbital periods depend on altitude (e.g., MRO is ~112 min, circular ~300 km); power is modeled in discrete units ($1\text{ to }10$) rather than dynamic kilowatt telemetry; the 3 landing sites represent distinct synthetic hazard profiles derived from real DTM metrics.

### 3. Gameplay Design
- **Player Role:** Orbital Flight Engineer & Landing Pilot aboard the *Asteria* Mars Transfer Vehicle.
- **Objectives:**
  1. Complete orbital approach and dock with Asteria orbital hub.
  2. Diagnose and repair the failed S-band surface communications relay under orbital power limits.
  3. Allocate power between lander recharging and station life support during Mars shadow.
  4. Select a landing site and descent profile based on terrain roughness and outpost distance.
- **Player Actions:** Thruster burns (WASD/docking cone), electrical load toggle switches (`life`, `heat`, `radio`, `amp`, `motor`, `charger`), diagnostic probe inspections, component replacement (antenna cable plug, amplifier, controller card), landing site comparison map.
- **Decisions & Trade-offs:**
  - *Power Balancing in Shadow:* In Mars shadow, total power drops from 10 to 6 units. Keeping life support (3) and heaters (2) leaves only 1 unit. Recharging the lander (3 units) requires shedding heaters or turning off science cameras, risking cabin chill or missed imaging windows.
  - *Landing Site Selection:*
    - *Meridian Pad:* 0.3 km from base (zero rover drive needed), but high boulder density (safe area only 28% of ellipse).
    - *Dune Ridge:* 2.5 km from base, intermediate hazard (50% safe, slope slip risk).
    - *Wide Plains:* 9.0 km from base, 100% smooth flat ground, but requires an extensive 9 km surface traverse consuming battery and time.
- **Challenges:** Entering shadow with overloaded circuits trips the main bus breaker; touching an energized radio component causes an electrical fault and damages the spare.
- **Environment Response:** Real-time day/night terminator sweep across Mars below the cupola; cockpit instruments dim upon entering shadow; radio signal meter responds dynamically to relay component repairs.

### 4. Mission Progression
1. **Preparation:** Approach Asteria station; align docking crosshairs with the target ring under low RCS thruster velocity ($v < 0.2\text{ m/s}$).
2. **Main Activities:** Enter orbital module; review relay fault status; inspect radio rack. Identify blown amplifier (scorch marks / burning odor cue) and loose antenna feed. De-energize amplifier load bus before unseating the burnt hardware; install spare amplifier; re-torque antenna coupling; re-energize bus and run loopback test.
3. **Emergencies / Anomalies:** Orbital shadow warning chime. Power generation collapses by 40%. The lander battery is only at 45% charge and needs 80% for powered descent hazard cameras. Player must shed non-essential station loads (science payload, cabin lights, partial heating) to sustain lander trickle charge.
4. **Completion:** Orbiter passes over Meridian Base line-of-sight window ($t = 100\text{ min}$). Successful two-way handshake confirmed with ground station. Select landing site; initiate de-orbit burn.
5. **Debrief:** Displays power conservation rating, diagnostic accuracy, and landing ellipse overlay showing simulated touchdown accuracy relative to terrain hazards.

### 5. Game Mechanics & Formulas
- **Net Orbital Power Balance:**
  $$P_{\text{net}}(t) = P_{\text{source}}(t) - \sum_{i} P_{\text{load}, i} \cdot \sigma_i$$
  where $P_{\text{source}}(t) = 10$ (sunlight) or $6$ (shadow battery limit), and $\sigma_i \in \{0, 1\}$. If $P_{\text{net}}(t) < 0$, breaker trip timer initiates ($t_{\text{trip}} = 10\text{ s}$).
- **Lander Battery Charge:**
  $$E_{\text{lander}}(t) = E_0 + \int r_{\text{charge}} \cdot \sigma_{\text{charger}} \, dt \quad (E_0 = 45\%, \, r_{\text{charge}} = 1\%/\text{min})$$
- **Landing Hazard Risk Formula:**
  $$\text{Risk}_{\text{touchdown}} = (1 - S_{\text{site}}) \cdot (1 - \delta_{\text{beacon}} \cdot 0.45) \cdot (1 - \sigma_{\text{hazcam}} \cdot 0.35)$$
  where $S_{\text{site}} \in \{0.28, 0.50, 1.00\}$ is site smoothness, $\delta_{\text{beacon}} = 1$ if relay fixed, and $\sigma_{\text{hazcam}} = 1$ if lander charge $\ge 80\%$.

### 6. Fun & Engagement
- **Tactile Thrills:** Analog cockpit switches, authentic docking HUD with target range/rate reticle, physical rack drawer slides.
- **Meaningful Choices:** Choosing between an ultra-safe distant landing (long drive ahead) versus a daring pad touchdown (requires perfect relay beacon and high lander charge).
- **Unexpected Events:** Early shadow onset due to slight orbital inclination mismatch; ground beacon intermittently drops carrier frequency until amplifier impedance is tuned.
- **Replayability:** Alternate fault injection (antenna motor slip vs controller card lockup vs amplifier burnout); experimenting with aggressive power shedding to achieve 100% lander charge.

### 7. Technical Implementation
- **Datasets/APIs:** Cropped HiRISE Jezero DTM elevation map; MRO orbit timeline parameters; Artemis checklist schemas.
- **Integration:** Pure ES module in `missions/orbit/`; Three.js scene featuring 3,600-unit planetary Mars sphere, textured Asteria exterior, interactive station interior cabin, and glass-canopy cockpit.
- **Components:** `station-layout.js`, `landing-cockpit.js`, `approach-state.js`, `ui.js`, `actions.js`.

### 8. Learning Outcomes
- Player understands why spacecraft must store energy for shadow passes.
- Player grasps that repairing electronics requires isolating power first.
- Player articulates why landing near base facilities involves balancing terrain obstacle density against rover travel burdens.

---

## 2. Before the Storm (`/storm`)
*Dust Storm Energy Forecasting, Collector Cleaning, and Outpost Survival Preparation*

### Evaluation
**Improve & Connect.** Upgrade the legacy `demo.js` implementation into the modern shared mission runtime architecture (`missions/shared/runtime.js`). Connect solar generation directly to normalized Opportunity 2018 sol-by-sol optical depth tau curves, displaying real historical sol values alongside time-scaled game minutes. Pass storm preparation score directly into the campaign carry-over state.

### 1. Mission Identity
- **Title:** Before the Storm
- **Real-World Inspiration:** The June 2018 planet-encircling Martian dust storm that ended the 14-year Opportunity rover mission at Perseverance Valley; MER solar array dust accumulation and atmospheric optical depth ($\tau$) measurements.
- **Category:** Planetary Meteorology / Energy Management / Outpost Life Support.
- **Difficulty:** Introductory (Cadet: 9-minute preparation clock, 40% reduced storm drain; Explorer: 5-minute clock, full atmospheric dust attenuation, tight battery reserves).
- **Learning Objectives:**
  1. Understand how airborne atmospheric dust attenuates solar irradiance on Mars.
  2. Evaluate the critical role of energy storage (batteries) when solar array generation collapses.
  3. Prioritize essential life support loads over secondary scientific operations during an environmental crisis.

### 2. Scientific Foundation
- **Concepts:** Atmospheric opacity / optical depth ($\tau$), atmospheric dust settling, photovoltaic conversion efficiency degradation, battery watt-hour reserve vs discharge rate, habitat life support air-loop sealing.
- **Real Datasets & Research:**
  - *Opportunity 2018 Dust Storm Solar Output Series* (`opportunity-2018.js`): Sol 5111 to Sol 5130 historical generation data showing drop from $645\text{ Wh/sol}$ to $< 22\text{ Wh/sol}$.
  - *JPL MER Mission Operations Reports*: Conservation strategies, rover deep sleep protocols.
- **Measurements:** Solar insolation factor dropping from $1.0$ down to $0.034$; solar panel dust coating reducing clean efficiency by up to $65\%$; rover battery capacity $12\text{ kWh}$.
- **Simplifications & Pedagogical Abstractions:** The multi-week Martian dust storm onset is compressed into a 6–9 minute countdown clock; habitat power and oxygen are rendered as accessible percentage gauges ($0–100\%$) alongside true kWh/L values.

### 3. Gameplay Design
- **Player Role:** Surface Outpost Maintenance Lead at Meridian Base.
- **Objectives:**
  1. Inspect and diagnose the outpost solar array electrical fault.
  2. Clear accumulated dust from the photovoltaic collector panels.
  3. Retrieve the auxiliary exploration rover battery and wire it into the habitat emergency bus.
  4. Align the habitat relay antenna before high winds cause dish deflection.
  5. Allocate reserves between life support oxygen generators and long-term research freezers.
  6. Secure exterior airlocks and seal the crew inside the storm shelter before the dust front strikes.
- **Player Actions:** Physical EVA walking, brush tool manipulation across solar collectors, heavy battery transport, manual 3-phase connector rotation (pin alignment 1-2-3), power bus toggle switches, habitat airlock door sealing wheel.
- **Decisions & Trade-offs:**
  - *Cleaning vs Battery Retrieval:* Spending time thoroughly brushing all 4 solar collectors increases power generation from 35% to 90%, but leaves less time to haul the heavy rover battery before the storm hits.
  - *Power Allocation:* Allocating emergency power to Life Support guarantees 100% crew safety and stable oxygen. Allocating partial power to Research Freezers preserves months of biological samples but tightens oxygen margins.
- **Challenges:** Dust front reduces visibility dynamically in Three.js; exterior wind drags player walking speed; failing to rotate battery connectors in sequence blows the transfer fuse.
- **Environment Response:** Sky changes from pale butterscotch to deep copper, then dark brown gloom; Three.js particle system simulates swirling dust eddies; ambient sound transitions from gentle wind to a howling gale.

### 4. Mission Progression
1. **Preparation:** Review weather alert from Asteria orbiter relay. Clock starts: dust front arrival in $T-360\text{ s}$ (Explorer) or $T-540\text{ s}$ (Cadet).
2. **Main Activities:** Step out through airlock; walk to solar array farm; sweep dust off panel banks 1 through 4. Walk to parked rover; unlatch heavy auxiliary battery pack; drag battery to base power junction box; orient multi-pin connectors (1, 2, 3) and engage locking latch.
3. **Emergencies / Anomalies:** Sudden wind gust dislodges the primary communications mast cable; player must make a fast detour to reconnect the telemetry link before shelter entry.
4. **Completion:** Return through outer airlock; cycle pressure chamber; close inner hatch; turn main sealing wheel. At central console, balance final power allocation sliders; verify oxygen recovery system.
5. **Debrief:** Displays final habitat energy stored, solar clearing efficiency percentage, oxygen reserve margin, and sample preservation status. Unlocks three distinct narrative endings: *Fully Prepared* (clean sweep), *Survived with Scars* (tight margins), or *Emergency Evacuation Mode*.

### 5. Game Mechanics & Formulas
- **Solar Generation Formula:**
  $$P_{\text{solar}}(t) = P_{\text{max}} \cdot \eta_{\text{clean}} \cdot f_{\text{Opp}}(t / t_{\text{storm}})$$
  where $P_{\text{max}} = 5.0\text{ kW}$, $\eta_{\text{clean}} \in [0.35, 1.0]$ based on panel brushing count, and $f_{\text{Opp}}$ is the normalized Opportunity 2018 solar decay curve.
- **Habitat Energy Storage:**
  $$E_{\text{hab}}(t) = E_0 + \int (P_{\text{solar}} + P_{\text{rover\_aux}} - P_{\text{loads}}) \, dt$$
  where $P_{\text{rover\_aux}} = 3.5\text{ kW}$ if installed, and $P_{\text{loads}} \ge 2.0\text{ kW}$ (life support alone) or $3.8\text{ kW}$ (+ research).
- **Shelter Oxygen Depletion/Recovery:**
  $$\frac{dO_2}{dt} = \begin{cases} -r_{\text{drain}} \cdot \tau_{\text{dust}} & \text{if unsealed} \\ +r_{\text{gen}}(P_{\text{allocated}}) - N_{\text{crew}} \cdot c_{\text{crew}} & \text{if sealed} \end{cases}$$

### 6. Fun & Engagement
- **Tactile Urgency:** Real-time countdown timer creates high dramatic tension as the sky progressively darkens in Three.js.
- **Visceral Feedback:** Satisfying visual transformation as dark red grime is brushed away to reveal sparkling photovoltaic glass; mechanical clunk and spark when mating the rover battery connector.
- **Replayability:** Attempting high-efficiency runs that preserve biological research samples without dipping into emergency oxygen reserves.

### 7. Technical Implementation
- **Datasets/APIs:** `opportunity-2018.js` bundled array degradation curve; Martian atmospheric opacity profiles.
- **Integration:** Migrating `demo.js` to standard ES module runtime with Three.js shadow maps, procedural dust fog shaders, and directional light dimming.
- **Components:** `collector-cleaning.js`, `battery-transfer.js`, `storm-audio.js`, `hud-presentation.js`.

### 8. Learning Outcomes
- Player explains how dust accumulation directly cripples solar power generation on Mars.
- Player recognizes that batteries act as an essential buffer during prolonged environmental power loss.
- Player understands why life support must be prioritized over non-critical systems in an emergency.

---

## 3. Tracks in the Dust (`/rover`)
*Traverse Route Planning, Soil Mechanics, and Field Geological Investigation*

### Evaluation
**Improve & Expand.** Refactor `mission2.js` into standard modular architecture. Upgrade the Jezero HiRISE elevation DTM renderer to display authentic slope contours and traction heatmaps. Add explicit calculation of return energy reserves ($E_{\text{return}} = d_{\text{return}} \cdot \text{Wh/m} \cdot \mu_{\text{slip}}$) and enhance the field science observation tool with real Perseverance Mastcam-Z sample comparison cards.

### 1. Mission Identity
- **Title:** Tracks in the Dust
- **Real-World Inspiration:** NASA Mars 2020 Perseverance rover operations on the Jezero Crater delta; HiRISE digital elevation models; Curiosity rover wheel damage and wheel slip in loose Martian regolith.
- **Category:** Surface Mobility / Planetary Geology / Field Science / Energy Budgeting.
- **Difficulty:** Intermediate (Cadet: auto-calculated return reserves, simplified 2-way path choice, assisted braking; Explorer: manual return reserve calculations, 3 route alternatives with variable slip hazards, geological rock layer stratification analysis).
- **Learning Objectives:**
  1. Calculate and preserve non-negotiable vehicle energy reserves required for safe return travel.
  2. Understand how terrain slope and loose surface regolith increase rover wheel slip and energy drain.
  3. Distinguish between objective empirical field observations and speculative interpretations.

### 2. Scientific Foundation
- **Concepts:** Digital Elevation Models (DTM), slope gradient ($\theta = \arctan(\Delta z / \Delta x)$), wheel slip ratio ($s = (\omega r - v)/\omega r$), regolith terramechanics (bedrock vs sand ripples vs drift snow), specific tractive energy consumption ($\text{Wh/m}$), stratigraphic geological law of superposition, field sample custody.
- **Real Datasets & Research:**
  - *HiRISE Jezero Crater DTM* (`DTEEC_023524_1985_023379_1985_U01`): 1-meter horizontal elevation grid.
  - *NASA Mars 2020 AutoNav Telemetry & Mastcam-Z Science Archive*: Driving slip records, delta sedimentary outcrop images.
- **Measurements:** Slope angles up to $22^\circ$; tractive energy varying from $0.45\text{ Wh/m}$ (compacted clay/bedrock) to $1.85\text{ Wh/m}$ (loose sand ripples); rover battery capacity $100\%$ ($4.8\text{ kWh}$ nominal).
- **Simplifications & Pedagogical Abstractions:** Real rover drives are executed via uplinked command sequences at a few centimeters per second; game allows real-time interactive driving at scaled speed ($1–3\text{ m/s}$) with simplified steering physics.

### 3. Gameplay Design
- **Player Role:** Surface Rover Driver & Field Geologist accompanied by Dr. Amara Okafor.
- **Objectives:**
  1. Perform pre-drive inspection (secure spare battery, check wheel pins, clean hazard camera lens, radio check).
  2. Execute steering and emergency braking qualification test.
  3. Evaluate route options to Kestrel Ridge on the HiRISE topographic map.
  4. Drive the traverse, stopping at designated checkpoints to radio status updates back to base.
  5. Inspect an unexpected terrain anomaly (dune ripple field) and execute a safe detour.
  6. Conduct field geological science at Kestrel Ridge: take context and close-up scale photos, log factual rock layer observations, and decide whether battery permits harvesting a bonus core sample.
  7. Drive safely back to Meridian Outpost, arriving with battery $> 20\%$ reserve.
- **Player Actions:** Pre-drive tactile clicks, vehicle driving (WASD/arrows, Space for brake, P for park), pan/tilt scientific camera, photo capture with scale ruler overlay, geological multiple-choice observation logging.
- **Decisions & Trade-offs:**
  - *Route Selection:*
    - *Wash Path (Canyon Bed):* Shortest distance, flat slopes, but cross-cuts deceptive silt pockets that increase rolling resistance.
    - *Rim Path (Ridge Crest):* Longer distance, firm bedrock (minimal slip), but steep initial ascent requiring high peak motor current.
  - *Bonus Sample Decision:* Drilling a secondary rock core at Kestrel Ridge adds 30 science prestige points, but costs 8% battery and 15 minutes of suit oxygen. If the return reserve drops below 20%, any wheel slip on the return will strand the rover.
- **Challenges:** Slipping backwards on loose sand slopes; motor overheating on sustained uphill grades; descending steep hills without engaging regenerative parking brakes.
- **Environment Response:** Tire tracks permanently deform the Three.js terrain mesh; rover physics responds to local pitch/roll angles; motor sound pitch increases under heavy tractive load.

### 4. Mission Progression
1. **Preparation:** Habitat exterior bay. Inspect 4 vehicle subsystems; mount spare battery. Climb aboard; release parking brake (P); perform 5-meter drive, turn, and emergency stop test.
2. **Main Activities:** Open navigation console. Select route. Embark on traverse. Checkpoint 1: radio base with coordinates. Checkpoint 2: report battery state-of-charge.
3. **Emergencies / Anomalies:** Approaching waypoint 3, ground texture changes to cracked ripples. Stop and inspect: ground is a hidden silt trap. Player must evaluate: plow through (high risk of getting bogged down) vs take a 60-meter rocky detour (guaranteed safe footing, +5% battery cost).
4. **Completion:** Reach Kestrel Ridge. Disembark rover. Deploy geological scale marker. Capture wide-angle geological context photo showing outcrop contact; capture macroscopic texture photo showing fine laminations. Record factual observation: *"Dark layered rock lies below lighter crumbly rock"*. Evaluate return battery reserve: return immediately or drill bonus core. Drive back to base; park in dock; transmit field dataset to mission server.
5. **Debrief:** Displays traverse map with actual driving path vs planned route, energy consumption profile, wheel slip histogram, geological observation score, and final battery reserve margin.

### 5. Game Mechanics & Formulas
- **Traverse Energy Expenditure:**
  $$E_{\text{used}} = \sum_{k} d_k \cdot \left[ C_{\text{base}} + C_{\text{slope}} \cdot \sin(\theta_k) + C_{\text{surface}} \cdot \mu_{\text{slip}, k} \right]$$
  where $\theta_k$ is the local terrain incline from DTM, and $\mu_{\text{slip}} \in [1.0, 2.4]$.
- **Return Reserve Invariant:**
  $$\text{Reserve}_{\text{current}} = E_{\text{battery}} - d_{\text{return}} \cdot \overline{\text{Drain}}_{\text{worst\_case}}$$
  If $\text{Reserve}_{\text{current}} < 20\%$, the HUD flashes a mandatory "Return to Base" abort warning.
- **Scientific Observation Scoring:**
  $$S_{\text{science}} = S_{\text{framing}} \cdot 0.35 + S_{\text{scale\_ruler}} \cdot 0.25 + S_{\text{factual\_accuracy}} \cdot 0.40$$

### 6. Fun & Engagement
- **Driving Physics:** Satisfying low-gravity rover suspension bouncing, responsive skid-steer controls, realistic wheel slip particles.
- **Geological Detective Work:** Looking closely at rock formations, placing the virtual ruler, and discovering sedimentary evidence of ancient Martian water.
- **Replayability:** Mastering all three routes; attempting the challenging Rim Route with zero slip errors; optimizing driving line to safely recover the bonus core.

### 7. Technical Implementation
- **Datasets/APIs:** Pre-processed HiRISE Jezero elevation grid (128x128 resampled heightmap); Perseverance Mastcam-Z calibrated texture patches.
- **Integration:** Three.js custom displacement terrain shader; raycast vehicle wheel-ground collision system in `rover-controller.js` and `expedition-terrain.js`.
- **Components:** `rover-controller.js`, `expedition-terrain.js`, `science-camera.js`, `mission2-ui.js`.

### 8. Learning Outcomes
- Player understands why field vehicles must always budget enough fuel/energy to make the return trip.
- Player recognizes that steep slopes and loose soil multiply vehicular energy consumption.
- Player learns to record verifiable empirical facts rather than unsupported assumptions during scientific exploration.

---

## 4. A Place to Hide (`/solar-shelter`)
*Space Weather Early Warning, Radiation Shielding Physics, and Emergency Refuge Construction*

### Evaluation
**Improve & Connect.** Upgrade the static plan buttons so they actively alter equipment inventory and layout constraints rather than serving as passive text labels. Split external space weather alerts (real NASA DONKI GOES proton flux data) from ground-level Martian exposure physics (Curiosity RAD 8,100 µGy May 2024 benchmarks). Connect the completed shelter shielding factor directly to the long-term crew health metrics in Base Boss and Thirty Sols.

### 1. Mission Identity
- **Title:** A Place to Hide
- **Real-World Inspiration:** NOAA Space Weather Prediction Center / NASA CCMC DONKI Solar Energetic Particle (SEP) alerts (e.g., the historic May 10, 2024 severe solar storm); Curiosity RAD (Radiation Assessment Detector) measurements on the surface of Mars; NASA Artemis crew storm shelter architectures utilizing water walls and food stowage.
- **Category:** Space Weather / Radiation Biophysics / Habitat Architecture / Emergency Response.
- **Difficulty:** Intermediate (Cadet: 20-minute warning clock, 40 max allowed dose, highlighted placement snaps; Explorer: 12-minute warning clock, 25 max allowed dose, directional radiation modeling, tight mass budget).
- **Learning Objectives:**
  1. Understand that space radiation consists of ionizing particles (solar protons and galactic cosmic rays) shielded most effectively by light, hydrogen-rich materials.
  2. Calculate how material thickness, density, and placement geometry attenuate radiation dose rate.
  3. Manage time, physical labor, and life-support trade-offs during a rapid-onset space weather emergency.

### 2. Scientific Foundation
- **Concepts:** Solar Energetic Particles (SEP), coronal mass ejections (CME), ionizing absorbed dose ($\text{Gray} = \text{J/kg}$), equivalent dose ($\text{Sievert}$), material shielding efficiency (hydrogen mass fraction), half-value layer thickness ($x_{1/2}$), secondary particle spallation.
- **Real Datasets & Research:**
  - *NASA DONKI Record* (`SEP-2024-05-10T13:35:00-001`): GOES-16 $>10\text{ MeV}$ and $>100\text{ MeV}$ proton flux onset time series.
  - *Curiosity RAD May 20, 2024 Mars Surface Observation*: Recorded $8,100\text{ \mu Gy}$ cumulative absorbed dose, the highest during MSL's mission.
  - *NASA Radiation Protection Research*: High hydrogen materials (water, polyethylene, food stocks) vs heavy metals (aluminum, lead) which produce dangerous secondary neutron scattering.
- **Measurements:** Unshielded habitat wall dose rate: $45\text{ \mu Gy/h}$; peak SEP event rate: up to $420\text{ \mu Gy/h}$; water wall shielding coefficient: $75\%$ attenuation; polyethylene shield: $80\%$; packed dry food supplies: $55\%$; bare habitat wall: only $15\%$.
- **Simplifications & Pedagogical Abstractions:** Absorbed radiation is presented to Cadets as "Radiation Points" ($0–100$, where lower is safer) with Explorer mode toggling true microGray cumulative units; biological cell DNA repair curves are abstracted into a cumulative crew exposure threshold.

### 3. Gameplay Design
- **Player Role:** Habitat Safety Officer at Meridian Base.
- **Objectives:**
  1. Receive and acknowledge the DONKI space weather alert from the deep space monitoring network.
  2. Select a shelter configuration plan (Water Fortress, Rapid Polyethylene, or Roof-Priority).
  3. Transport and mount radiation shielding modules into the central habitat core (2 ceiling spots, 6 perimeter wall spots).
  4. Ensure habitat life-support airflow ducting remains unobstructed by placed shielding.
  5. Recall all 4 crew members from their distributed work stations into the shelter before particle flux onset.
  6. Seal the inner vault doors and monitor real-time radiation dosage until the SEP peak subsides.
- **Player Actions:** First-person carrying of heavy shielding blocks, positioning and bolting panels (timed hold), cycling crew recall comms, skip-ahead time compression during peak storm, inspecting dosimeter sensor readouts.
- **Decisions & Trade-offs:**
  - *Material Selection & Placement:*
    - *Water Walls (6 available):* High protection (75% attenuation), but heavy and slow to haul ($18\text{ s}$ per wall).
    - *Polyethylene Panels (2 available):* Maximum protection (80% attenuation), lightweight, but require careful bolting ($1.6\text{ s}$ tool hold).
    - *Supply Bags (4 available):* Moderate protection (55%), fast to carry ($6\text{ s}$), but placing them around ventilation grates blocks air circulation, triggering an oxygen starvation penalty.
  - *Ceiling vs Lateral Protection:* Particles arrive omnidirectionally with a downward Martian atmospheric scatter bias; leaving the 2 roof spots unshielded exposes all occupants regardless of wall thickness.
- **Challenges:** Carrying heavy items depletes player stamina; calling crew too late means astronauts accumulate high outdoor transit dose; blocking air vents causes carbon dioxide alarms to sound during the storm.
- **Environment Response:** Dosimeter audio clicking frequency increases exponentially as the particle front arrives; warning sirens pulse in amber inside the base; exterior camera views show static snow and cosmic ray hits on sensor pixels.

### 4. Mission Progression
1. **Preparation:** Alert sounded: Coronal Mass Ejection detected Earth-sunward, propagating toward Mars orbit. Warning window: $1,200\text{ s}$ sim-time ($4\text{ real minutes}$ at $5\times$ speed).
2. **Main Activities:** Enter storage bay. Select shielding materials. Carry polyethylene slabs to the storm shelter core and lock them into the two ceiling frames. Haul water wall bladders from life-support recycling tanks to cover vulnerable outward-facing walls. Fill remaining gaps with dense food supply canisters.
3. **Emergencies / Anomalies:** Airflow sensor flashes red: supply bags have occluded the emergency CO2 scrubber intake. Player must unseat two bags and reposition them to an alternate wall rack before crew enters.
4. **Completion:** Trigger crew recall klaxon. Monitor arrival of Commander Reyes, Dr. Okafor, Jin Park, and Dr. Moreau (each takes $90\text{ s}$ transit). Step inside; seal blast door. Engage storm time compression ($45\times$). Watch real-time dosimeter trace.
5. **Debrief:** Displays crew individual and team-average radiation dose, shielding attenuation diagram, time-to-safety margins, and validates whether cumulative exposure stayed below the health safety threshold ($\le 40\text{ points}$ for Mastered).

### 5. Game Mechanics & Formulas
- **Local Shielding Factor:**
  $$\eta_{\text{spot}} = 1 - \prod_{m} (1 - k_m) \quad \text{where } k_{\text{water}} = 0.75, \, k_{\text{poly}} = 0.80, \, k_{\text{food}} = 0.55, \, k_{\text{bare}} = 0.15$$
- **Refuge Radiation Dose Rate:**
  $$\dot{D}_{\text{shelter}}(t) = \dot{D}_{\text{storm}}(t) \cdot \left[ 0.40 \cdot (1 - \overline{\eta}_{\text{roof}}) + 0.60 \cdot (1 - \overline{\eta}_{\text{walls}}) \right]$$
- **Individual Crew Dose Accumulation:**
  $$D_i = \int_0^{t_{\text{shelter}, i}} \dot{D}_{\text{outdoor}}(t) \, dt + \int_{t_{\text{shelter}, i}}^{T_{\text{end}}} \dot{D}_{\text{shelter}}(t) \, dt$$
- **Airflow Constraint:**
  $$\text{Airflow} = 100\% - 25\% \cdot N_{\text{blocked\_vents}} \quad (\text{if Airflow } < 70\%, \, \dot{O}_2 \text{ drops and CO}_2 \text{ rises})$$

### 6. Fun & Engagement
- **Pacing & Spatial Puzzle:** Spatial layout challenge of fitting 12 candidate shielding items into 8 optimal spots under an unforgiving ticking countdown.
- **Visceral Audio:** The authentic Geiger counter clicking that accelerates from occasional clicks to a frightening continuous buzz creates powerful scientific suspense.
- **Replayability:** Testing different shielding layouts (e.g., all-water vs balanced food/polyethylene); attempting ultra-fast speedruns to get all crew inside with zero transit exposure.

### 7. Technical Implementation
- **Datasets/APIs:** `donki-sep-2024-05.json` (CCMC DONKI SEP profile); `curiosity-rad-2024-05-20.json` (Mars ground dose rate).
- **Integration:** Pure ES module in `missions/solar-shelter/`; Three.js interactive habitat bunker with physics-based component sockets, animated blast doors, and dynamic dosimeter canvas display.
- **Components:** `scenario.js`, `state.js`, `actions.js`, `scene.js`, `ui.js`, `legacy-exposure.js`.

### 8. Learning Outcomes
- Player explains why water and plastic protect against space radiation better than thin metal.
- Player grasps that both ceiling and walls must be shielded to prevent particle scatter into the living space.
- Player articulates why early warning systems and prompt emergency response save lives in deep space.

---

## 5. The Greenhouse Promise (`/greenhouse`)
*Space Crop Photobiology, Closed-Loop Irrigation, and Hardware Anomaly Diagnosis*

### Evaluation
**Improve & Connect.** Upgrade the plan selections so that "Salad First", "Feast for All", and "Share the Light" enforce distinct photoperiod power caps and water rationing allocations. Refactor the 5-step leak repair chain with visual progress indicators tailored for young learners. Connect harvested fresh vegetable mass directly to crew morale and nutrition variables in Base Boss and Thirty Sols.

### 1. Mission Identity
- **Title:** The Greenhouse Promise
- **Real-World Inspiration:** NASA Biological and Physical Sciences OSDR study OSD-269 (Veggie passive orbital nutrient delivery system and light recipes on the ISS); Khodadad et al. (2020) microbiological and nutritional analysis; CSA space food production initiatives.
- **Category:** Space Biology / Controlled Environment Agriculture / Fluid Dynamics / Life Support.
- **Difficulty:** Intermediate (Cadet: 1.5 kWh emergency battery, slower 4 L/day leak, wider soil moisture comfort zone $[0.8, 3.6]$; Explorer: 1.2 kWh battery, 6 L/day leak, narrow moisture zone $[1.0, 3.2]$, strict pepper maturity photoperiod).
- **Learning Objectives:**
  1. Understand the biological requirements of plants in controlled environments (photoperiod, spectrum, root hydration).
  2. Master multi-system trade-offs where agricultural power and water directly compete with outpost utility baselines.
  3. Diagnose and resolve real-world hardware anomalies (closed valves, unseated hoses, fan airflow sensor failures).

### 2. Scientific Foundation
- **Concepts:** Photosynthetically Active Radiation (PAR), photoperiod light-dark cycles ($16\text{ h light} : 8\text{ h dark}$), transpiration, root-zone matric potential vs hypoxia/root rot, fluid loop mechanics, supplementary crew micronutrients (antioxidants, vitamins C and K).
- **Real Datasets & Research:**
  - *NASA OSDR OSD-269 ISS Veggie Dataset*: Cultivar protocols for Outredgeous red romaine lettuce (*Lactuca sativa*), Mizuna mustard (*Brassica rapa*), and dwarf chile peppers.
  - *Documented Veggie Fan Anomaly*: Fan telemetry indicated nominal RPM while physical airflow was stagnant due to lint/dust filter clogging.
  - *NASA Life Support Baseline Values & Assumptions (2022)*: Daily human dietary water and fresh biomass mass fractions.
- **Measurements:** Baseline solar generation: $2.2\text{ kWh/day}$; full light draw: $1.0\text{ kWh/bed/day}$; half light: $0.55\text{ kWh/bed/day}$; irrigation tank: $18\text{ L}$; nominal watering: $1.0\text{ L/dose}$; leak rate: $6.0\text{ L/day}$.
- **Simplifications & Pedagogical Abstractions:** Multi-week crop growth cycles are represented across a 3-sol narrative arc (Preparation, Active Growth & Anomaly, Harvest Sol); soil physics is mapped to a calibrated moisture index ($0–5$).

### 3. Gameplay Design
- **Player Role:** Outpost Hydroponics Botanist preparing a celebratory birthday salad for Commander Elena Reyes.
- **Objectives:**
  1. Configure diurnal lighting schedules across three dedicated growth trays (Red Lettuce, Mizuna, Chile Peppers).
  2. Irrigate root-zone media to maintain optimal moisture without drowning seedlings.
  3. Detect, isolate, and repair a sudden high-pressure irrigation hose leak on Sol 2.
  4. Diagnose a false fan telemetry reading and clear an obstructed ventilation intake.
  5. Harvest mature crop heads on Sol 3 and serve the birthday meal in the habitat mess hall.
- **Player Actions:** Light level selector dials (`Off`, `Half`, `Full`), water dispensing wand, manual isolation valve wheel, quick-disconnect hose fittings, replacement hose tool, harvesting shear clicks, basket transport.
- **Decisions & Trade-offs:**
  - *Light Budgeting:* Total solar budget is $2.2\text{ kWh/day}$ plus a $1.2\text{ kWh}$ battery reserve. Setting all 3 beds to Full Light consumes $3.0\text{ kWh}$, draining the battery and risking an outpost power blackout if Sol 2 is overcast. Setting all to Half Light protects the battery but guarantees chile peppers will not ripen in time for the birthday.
  - *Leak Repair Urgency:* Fixing the leak immediately consumes 3 real minutes of precision valve/hose work while water drains at $6\text{ L/day}$. Delaying repair to water other beds first risks emptying the main tank below the emergency reserve.
- **Challenges:** Over-watering plants causes yellowing leaves (hypoxia); forgetting to re-open the red isolation valve after fixing the leak starves plants of water for the entire second sol.
- **Environment Response:** Plants physically grow in 3D across the three sols; healthy leaves display vibrant emerald and ruby hues, while stressed plants wilt, curl, and develop brown necrotic tips; greenhouse LED lighting shifts between magenta grow spectrum and white work lighting.

### 4. Mission Progression
1. **Preparation (Sol 1):** Review crop status on greenhouse terminal. Red Lettuce requires 3 growth units, Mizuna requires 3, Peppers require 5. Set lighting: Lettuce (Full), Mizuna (Half), Peppers (Full). Dispense 1L water to each dry tray. End Sol 1.
2. **Main Activities (Sol 2):** Arrive at greenhouse. Water level alarm sounds: 6 liters lost to a spraying puddle beneath Tray B. Inspect manifold: main flexible delivery hose has ruptured.
3. **Emergencies / Anomalies:** Execute emergency leak repair protocol:
   1. Rotate red isolation shut-off valve $90^\circ$ clockwise (stops pressurized spray).
   2. Unclip locking collar on ruptured hose; discard into recycle bin.
   3. Retrieve reinforced braided spare hose from maintenance locker.
   4. Seat new hose into barbs until audible snap is heard; close locking collar.
   5. Rotate red valve counter-clockwise to repressurize fluid loop.
   *Second Anomaly:* Airflow sensor shows green, but plant leaves are motionless and condensation coats the glass. Inspect ventilation duct: lint screen is clogged. Pull screen; vacuum clean; reinsert.
4. **Completion (Sol 3 - Harvest Sol):** Inspect crops. Red Lettuce is fully headed (4 portions); Mizuna is lush (3 portions); Peppers are crisp (2 portions). Take harvest basket; snip outer leaves with shears; carry harvest to wardroom table.
5. **Debrief:** Evaluates total harvested food yield, water efficiency ratio, power balance adherence, and diagnostic precision. Rewards ratings: *Birthday Feast* ($\ge 6\text{ salad} + \text{peppers}$), *Salad Served* ($6\text{ salad}$), or *Small Harvest*.

### 5. Game Mechanics & Formulas
- **Daily Crop Growth Increment:**
  $$\Delta G_{\text{crop}} = \text{BaseRate} \cdot f(\text{Light}) \cdot f(\text{Moisture}) \cdot f(\text{Airflow})$$
  where $f(\text{Light}) \in \{0.0, 0.65, 1.0\}$ for Off/Half/Full, $f(\text{Moisture}) = 1.0$ if $M \in [1.0, 3.2]$ (Cadet: $[0.8, 3.6]$) and $0.25$ otherwise, and $f(\text{Airflow}) = 0.5$ if duct is clogged.
- **Water Tank Balance:**
  $$V_{\text{tank}}(t) = V_0 - \sum \text{Doses} - \int r_{\text{leak}} \cdot (1 - \sigma_{\text{valve\_shut}}) \, dt$$
- **Net Daily Energy Equation:**
  $$E_{\text{net}} = E_{\text{solar}} - \left( \sum_{\text{beds}} P_{\text{light}, i} + P_{\text{fans}} + P_{\text{pumps}} \right) \quad (\text{must maintain } E_{\text{battery}} \ge 0)$$

### 6. Fun & Engagement
- **Tactile Gardening:** Joy of nurturing living plants in a barren Martian environment; tangible gratification of snipping crisp heads of lettuce into the wooden basket.
- **Hands-on Mechanical Chain:** Physical five-step leak repair gives a satisfying feeling of authentic plumbing mastery.
- **Replayability:** Attempting the high-wire "Birthday Feast" strategy by riding the exact edge of battery capacity to produce mature spicy peppers.

### 7. Technical Implementation
- **Datasets/APIs:** `osdr-osd-269.json` (ISS Veggie light/dark protocols and crop cultivars); Veggie fan anomaly engineering log.
- **Integration:** Pure ES module in `missions/greenhouse/`; Three.js scene featuring plant leaf growth tweening, water particle spray, dynamic liquid levels in transparent acrylic tanks.
- **Components:** `scenario.js`, `state.js`, `actions.js`, `scene.js`, `ui.js`, `crops.js`.

### 8. Learning Outcomes
- Player understands that plants require balanced light, water, and air circulation—and that more light requires more energy.
- Player grasps that hardware telemetry can be misleading and must be verified with physical observations.
- Player learns that fresh food on a planetary outpost provides critical dietary supplements and psychological well-being.

---

## 6. Message to Earth (`/earth-delay`)
*Interplanetary Communications Latency, Autonomous Troubleshooting, and Fluid Loop Servicing*

### Evaluation
**Improve & Expand.** Synchronize in-game dialogue timestamps with authentic JPL Horizons ephemeris light-time data (eliminating the minor textual mismatch noted in the audit). Add dynamic packet loss models during solar conjunction, and allow players to draft targeted telemetry queries that reduce Earth's analytical turnaround time. Connect remaining water reserves to the outpost starting state.

### 1. Mission Identity
- **Title:** Message to Earth
- **Real-World Inspiration:** NASA JPL Deep Space Network (DSN) communications with Mars missions; speed-of-light propagation delays calculated via JPL Horizons ephemeris; International Space Station Environmental Control and Life Support System (ECLSS) Urine Processor Assembly (UPA) and catalytic oxidizer servicing.
- **Category:** Deep Space Communications / Life Support Systems / Autonomous Troubleshooting / Decision Theory.
- **Difficulty:** Intermediate (Cadet: 26 L starting water, 4-minute Earth thinking delay, highlighted diagnostic meter sockets; Explorer: 20 L starting water, 6-minute Earth thinking delay, multi-component electrical testing, component inventory limits).
- **Learning Objectives:**
  1. Understand that the speed of light creates unavoidable, multi-minute round-trip communications latency across interplanetary distances.
  2. Evaluate the risks and benefits of independent local problem-solving versus waiting for remote expert guidance.
  3. Master disciplined electrical and fluid diagnostics (isolating pumps, check-valves, and particulate filters).

### 2. Scientific Foundation
- **Concepts:** Interplanetary radio signal propagation at $c \approx 3 \times 10^8\text{ m/s}$, astronomical distance variations across synodic periods, one-way light time (OWLT), round-trip light time (RTLT), telemetry packet downlinks, ECLSS water recovery loops, pump cavitation, particulate filter pressure drop ($\Delta P$).
- **Real Datasets & Research:**
  - *JPL Horizons Ephemeris Data* (`horizons-mars-earth-2026-11.txt`): Target 499 (Mars), Observer 500@399 (Earth geocenter), Quantity 21 (one-way light time = $11.014\text{ minutes}$ on Nov 14, 2026; round trip = $22.028\text{ minutes}$).
  - *NASA ECLSS 98% Water Recovery Milestone (2023)*: Assembly schematics for distillation assemblies, peristaltic pumps, and ion-exchange resin filters.
- **Measurements:** One-way light time: $661\text{ s}$ ($11\text{ min } 1\text{ s}$); Earth ground team analysis delay: $180\text{ to }360\text{ s}$; total round trip response window: $25\text{ to }28\text{ minutes}$; habitat clean water consumption rate: $0.5\text{ L/min}$ (nominal) or $0.2\text{ L/min}$ (strict conservation mode); emergency reserve threshold: $3.0\text{ L}$.
- **Simplifications & Pedagogical Abstractions:** Real communication packets must wait for scheduled DSN dish passes; game assumes an active DSN link window and provides a "Wait for Transmission / Advance Time" interface allowing players to compress the 25-minute wait while observing water consumption.

### 3. Gameplay Design
- **Player Role:** Meridian Base Life Support Systems Technician.
- **Objectives:**
  1. Respond to a master alarm: primary ECLSS water recycler pump failure.
  2. Choose an operational strategy: Ask Earth for Help, Troubleshoot Autonomously, or Execute a Hybrid Plan.
  3. De-energize the high-voltage recycler rack safety disconnect lever before opening maintenance hatch.
  4. Perform multimeter tests on pump motor windings and solenoid valve coils; visually inspect particulate filter cartridge.
  5. Replace defective hardware from the limited spare parts storage rack.
  6. Repressurize system, prime fluid loop, and verify nominal water recovery before clean water reserves deplete.
- **Player Actions:** Terminal transmission composition, safety lever throw, thumb-screw panel removal, multimeter test lead placement, mechanical part swapping (pump, valve, filter), prime button press, water conservation mode toggle.
- **Decisions & Trade-offs:**
  - *The Latency Dilemma:*
    - *Ask Earth First:* Sends telemetry and waits. Earth will return the exact, 100% correct diagnosis, guaranteeing zero wasted parts. However, waiting $25+$ minutes burns $12.5\text{ L}$ of water (leaving only $7.5\text{ L}$).
    - *Autonomous Repair:* Player uses multimeter immediately. Fast (takes only 4 minutes), conserving maximum water ($18\text{ L}$ remains). However, misinterpreting test readings and swapping the wrong component wastes an unrecoverable spare and leaves the recycler broken.
    - *Hybrid Plan:* Transmit comprehensive diagnostic telemetry to Earth, but begin physical panel removal, cleaning, and preliminary testing while the packet travels.
- **Challenges:** Opening the maintenance door without pulling the safety interlock blows the rack fuse; swapping parts blindly consumes the only replacement pump.
- **Environment Response:** Water tank level gauge steadily drops in real time; recycler audio transitions from healthy rhythmic thumping to harsh grinding cavitation sounds; message console displays authentic transmission status bars showing light-minute distance packet tracking.

### 4. Mission Progression
1. **Preparation:** Master caution klaxon: Recycler Loop B Failure. Clean water sits at $20\text{ L}$. Tank level drains at $0.5\text{ L/min}$. Emergency water threshold is $3\text{ L}$ (at which point mission aborts).
2. **Main Activities:** Review communications console. If messaging Earth, package error code `ERR-WTR-404` and multimeter logs, then hit Transmit. While packet travels, isolate rack power: flip yellow high-voltage breaker. Unscrew 4 knurled fasteners; remove front shroud.
3. **Emergencies / Anomalies:** Diagnostic probing reveals ambiguous resistance across Solenoid Valve 2. The player must decide: wait another 14 minutes for Earth's analysis of the telemetry trace, or make an autonomous call based on acoustic tap testing.
4. **Completion:** Identify fault: motor drive impeller seized on Pump 1, secondary filter partially occluded. Unseat failed pump; grease O-ring; seat spare pump; lock quick-release levers. Replace filter cartridge. Close panel; reset safety breaker; press Prime button. System pressure rises to $2.4\text{ bar}$ (green band). Water tank stops draining and begins replenishing.
5. **Debrief:** Displays total round-trip light time, water consumed during the repair window, diagnostic accuracy, spare parts conservation efficiency, and awards *Deep Space Comms Master* badge.

### 5. Game Mechanics & Formulas
- **Interplanetary Signal Latency:**
  $$t_{\text{round\_trip}} = 2 \cdot \frac{D_{\text{Mars-Earth}}(t)}{c} + t_{\text{ground\_analysis}}$$
  where $D_{\text{Mars-Earth}} = 1.321\text{ AU} \approx 1.976 \times 10^8\text{ km}$, yielding $OWLT = 661\text{ s}$ ($11.01\text{ min}$) and $t_{\text{ground}} = 180\text{ s}$ (with telemetry data) or $360\text{ s}$ (raw error code).
- **Water Reserve Drain:**
  $$W_{\text{reserve}}(t) = W_0 - \int_0^{t_{\text{fixed}}} \dot{W}_{\text{consumption}}(\text{mode}) \, dt$$
  where $\dot{W} = 0.5\text{ L/min}$ (nominal) or $0.2\text{ L/min}$ (conservation mode). Failure occurs if $W_{\text{reserve}}(t) \le 3.0\text{ L}$.
- **Component Health Diagnostic Equation:**
  $$R_{\text{pump\_coil}} = \begin{cases} 24\text{ }\Omega \pm 2 & \text{Nominal} \\ \infty & \text{Open Circuit (Blown)} \\ 0\text{ }\Omega & \text{Short Circuit} \end{cases}$$

### 6. Fun & Engagement
- **The Psychology of Isolation:** Palpable feeling of profound isolation as the player watches the communications status bar creep across millions of kilometers of deep space.
- **Ticking Clock High Stakes:** Watching the clear acrylic water column drain toward the red danger line creates genuine adrenaline.
- **Replayability:** Randomized fault generation (Pump Seized + Filter Dirty vs Valve Jammed + Filter Dirty vs Pump Electrical Short + Clean Filter) ensures different diagnostic paths on every playthrough.

### 7. Technical Implementation
- **Datasets/APIs:** `horizons-mars-earth-2026-11.txt` (JPL Horizons light-time ephemeris); NASA ECLSS engineering flow diagrams.
- **Integration:** Pure ES module in `missions/earth-delay/`; Three.js recycler hardware unit with animated fluid flow tubes, interactive multimeter leads, and authentic telemetry terminal.
- **Components:** `scenario.js`, `state.js`, `actions.js`, `scene.js`, `ui.js`, `messages.js`.

### 8. Learning Outcomes
- Player understands why astronauts on Mars cannot hold real-time telephone conversations with Earth.
- Player learns to balance the risk of independent action against the cost of waiting for assistance.
- Player grasps the fundamental mechanics of closed-loop life-support water purification.

---

## 7. Chasing the Sun (`/lunar-sunlight`)
*Lunar South Polar Topography, Long Shadow Dynamics, and High-Mast Energy Harvesting*

### Evaluation
**Improve & Connect.** Replace the single-click 18-day simulation conclusion with an interactive multi-phase solar tracking inspection where players monitor real-time shadow elongation. Harmonize interaction controls (unifying "Press E" vs "Hold E" across mast deployment). Expose authentic LOLA 18.6-year polar illumination raster data in the site selection UI, comparing Near Pad vs High Ridge Pad.

### 1. Mission Identity
- **Title:** Chasing the Sun
- **Real-World Inspiration:** Artemis III/IV south polar exploration (Shackleton Crater rim / Malapert Mountain); NASA Lunar Reconnaissance Orbiter (LRO) LOLA (Lunar Orbiter Laser Altimeter) illumination maps; Peaks of Eternal Light vs permanently shadowed craters.
- **Category:** Lunar Surface Operations / Photovoltaic Engineering / Polar Solar Dynamics.
- **Difficulty:** Introductory (Cadet: 150 min suit oxygen, 55 kWh battery, Near Pad shadow buffer; Explorer: 120 min suit oxygen, 45 kWh battery, tight cable routing, cold habitat limits).
- **Learning Objectives:**
  1. Understand why the Sun skims the horizon at the lunar poles ($1.5^\circ$ elevation), casting extremely long topography shadows.
  2. Evaluate how elevating solar panels on telescoping masts dramatically increases sunlight interception above crater rims.
  3. Balance EVA suit life-support consumables against long-distance heavy equipment transport.

### 2. Scientific Foundation
- **Concepts:** Lunar polar solar elevation angle ($\alpha \approx 1.5^\circ$), topography-induced solar shadowing, high-mast clearance geometry ($h = d \cdot \tan(\theta_{\text{ridge}})$), photovoltaic array tracking, power cable resistive transmission loss ($V = IR$), battery cycle depth.
- **Real Datasets & Research:**
  - *NASA LOLA South Polar Illumination Product* (`pgda.gsfc.nasa.gov/products/69`): 60-meter pixel resolution multi-year illumination averages around 89–90°S.
  - *NASA Moon Base Phases Architecture Study*: Deployable solar tower designs for polar habitation.
- **Measurements:** Solar insolation: $1,361\text{ W/m}^2$; solar array output: $3.6\text{ kW}$ when illuminated; base essential survival load: $1.2\text{ kW}$ (constant); base science load: $0.8\text{ kW}$ (optional); battery capacity: $45\text{ kWh}$ (starts at $25\text{ kWh}$); mast height: up to $7.8\text{ m}$ ($2.4\text{ m}$ base $+ 3 \times 1.8\text{ m}$ telescoping stages); cable spool: $50\text{ m}$.
- **Simplifications & Pedagogical Abstractions:** The 29.5-day lunar synodic day-night cycle is represented via an 18-day mission observation window; solar movement across the azimuth is accelerated to illustrate dynamic shadow transit.

### 3. Gameplay Design
- **Player Role:** Lunar Surface Infrastructure Specialist at Horizon Outpost.
- **Objectives:**
  1. Analyze LOLA illumination maps and choose an installation site: Near Pad or Ridge Pad.
  2. Tow the heavy mobile solar mast cart from the outpost airlock to the selected pad.
  3. Deploy stabilizing outrigger legs; raise telescoping mast stages; deploy dual photovoltaic wings.
  4. Reel out the high-voltage power umbilical cable back to the outpost power distribution port.
  5. Engage the solar azimuth tracker motor.
  6. Configure the base power priority console (Continuous Science vs Daytime-Only Science).
  7. Monitor habitat battery reserves and solar generation across the 18-day illumination cycle.
- **Player Actions:** Cart towing handle grasp, walking traversal, outrigger leg jack cranks, telescoping stage winch actuation (Press E), wing deployment latch release, cable spool haul, base plug insertion, power policy toggle switches.
- **Decisions & Trade-offs:**
  - *Pad Selection:*
    - *Near Pad:* Distance only 19 m (requires only 8 min tow, 19 m cable). Fast, leaving 112 min of suit oxygen. However, it sits in a shallow depression where LOLA data shows only 13% average illumination—shadows sweep across frequently, forcing the base to run on batteries and causing 8 cold hours.
    - *High Ridge Pad:* Distance 43 m (requires 16 min tow, 43 m cable, high suit oxygen expenditure). However, its elevated rim catches 34% illumination—enabling continuous power generation with zero cold hours.
  - *Mast Height vs Time:* Raising each additional stage adds 1.8 m of elevation and clears lower ridge shadows, but costs 4 minutes of suit air.
- **Challenges:** Towing the heavy cart uphill drains suit oxygen faster; running out of cable 2 meters short of the base forces repositioning; leaving the Sun tracker off limits panel exposure to a narrow angle.
- **Environment Response:** Deep black lunar shadows crawl across the brilliant stark white crater terrain in Three.js; pitch-black sky filled with brilliant un-twinkling stars and the bright blue marble of Earth hovering near the horizon; harsh directional lighting creates extreme chiaroscuro contrast.

### 4. Mission Progression
1. **Preparation:** Review EVA brief at Horizon Base airlock. Suit oxygen: $120\text{ min}$. Grasp handle of wheeled solar mast cart. Step onto lunar regolith.
2. **Main Activities:** Tow cart along illuminated ridge path to Ridge Pad ($43\text{ m}$). Drop outrigger stabilizing jacks. Winch up mast Stage 1, Stage 2, and Stage 3 (reaching $7.8\text{ m}$). Release photovoltaic wing latches: solar wings blossom outward. Grasp cable connector; pull heavy umbilical reel back down the hill to the base exterior junction box; push plug into socket and twist locking collar.
3. **Emergencies / Anomalies:** Base power panel indicates zero current: solar tracker azimuth drive is stuck in transport stowage. Walk back up to mast; tap stuck azimuth gimbal clutch with service wrench; engage automatic sun-tracking sensor. Green tracking LED illuminates.
4. **Completion:** Enter habitat base. Access power console. Set policy: *Daytime Science Only* (conserves battery when shadows cross) or *Continuous Science*. Engage 18-day time-lapse simulation. Watch solar generation curves and battery reserves.
5. **Debrief:** Displays total kilowatt-hours generated, battery depth-of-discharge curve, zero cold hours achieved, remaining suit oxygen, and awards *Sun Chaser* badge.

### 5. Game Mechanics & Formulas
- **Shadow Clearance Height:**
  $$H_{\text{shadow}}(t) = D_{\text{crater\_rim}} \cdot \tan(\theta_{\text{sun}}(t) - \theta_{\text{terrain}})$$
  If $H_{\text{mast}} > H_{\text{shadow}}(t)$, panel is in sunlight ($P_{\text{gen}} = 3.6\text{ kW}$); if $H_{\text{mast}} \le H_{\text{shadow}}(t)$, panel is in shadow ($P_{\text{gen}} = 0$).
- **Base Power Conservation Equation:**
  $$E_{\text{batt}}(t + \Delta t) = E_{\text{batt}}(t) + \left[ P_{\text{solar}}(t) - \left( P_{\text{essential}} + \sigma_{\text{sci}} \cdot P_{\text{science}} \right) \right] \cdot \Delta t$$
  where $P_{\text{essential}} = 1.2\text{ kW}$, $P_{\text{science}} = 0.8\text{ kW}$. If $E_{\text{batt}} = 0$, base enters "Cold Hours" ($T_{\text{cold}} = T_{\text{cold}} + \Delta t$).
- **Suit Life Support Drain:**
  $$\text{Oxygen}_{\text{remaining}} = \text{Oxygen}_0 - \sum t_{\text{action}} \cdot \dot{O}_{2, \text{action}} \quad (\text{tow} = 1.0\text{ min/min}, \, \text{winch} = 0.8\text{ min/min})$$

### 6. Fun & Engagement
- **Stark Lunar Aesthetics:** Striking visual beauty of the low-angle lunar polar sunlight casting kilometer-long shadows across crater rims.
- **Physical Achievement:** Hauling a cart, raising a towering 7.8-meter solar array, and running a power line back to base provides a deep sense of pioneering civil engineering.
- **Replayability:** Comparing Near Pad vs Ridge Pad outcomes; discovering the optimal mast height that balances suit oxygen safety against maximum electrical yield.

### 7. Technical Implementation
- **Datasets/APIs:** `patches.json` (NASA LOLA polar illumination raster subsets); LRO Diviner thermal boundary context.
- **Integration:** Pure ES module in `missions/lunar-sunlight/`; Three.js scene featuring high-contrast directional sun shadow cameras, low-gravity towing physics, and procedural terrain.
- **Components:** `scenario.js`, `state.js`, `actions.js`, `scene.js`, `ui.js`, `moon-world.js`.

### 8. Learning Outcomes
- Player explains why solar towers must be tall at the Moon's poles to capture sunlight over crater walls.
- Player grasps that high average sunlight does not prevent localized temporary shadow blackouts.
- Player understands how energy storage (batteries) bridges predictable environmental generation dips.

---

## 8. Dust Busters (`/lunar-dust`)
*Abrasive Regolith Contamination, Airlock Decontamination Protocols, and Electrodynamic Mitigation*

### Evaluation
**Improve & Connect.** Update plan selections ("Brush It Off", "Vacuum It Up", "Electrodynamic Shielding") so that each plan unlocks distinct tool configurations and power caps rather than acting as a superficial label. Differentiate equipment surfaces from the suit visor, adding clear visual feedback showing scratches when mechanical brushes are misused on optical glass. Connect airlock filter clogging to outpost life support degradation.

### 1. Mission Identity
- **Title:** Dust Busters
- **Real-World Inspiration:** Apollo astronaut reports on jagged, abrasive lunar dust adhering electrostatically to spacesuits and degrading seals; NASA Blue Ghost Mission 1 (Firefly Aerospace, March 2025) testing the Electrodynamic Dust Shield (EDS) payload on optical glass and thermal radiators; NASA Lunar Dust Safety Standards.
- **Category:** Planetary Materials Science / Environmental Health / Space Habitat Maintenance.
- **Difficulty:** Introductory (Cadet: 70 power units, 2 spare filters, forgiving 1.2 s tool hold times; Explorer: 50 power units, 1 spare filter, tight particulate air quality standards, optical scratch penalties).
- **Learning Objectives:**
  1. Understand why lunar dust is extremely sharp, abrasive, and magnetically/electrostatically reactive (due to space weathering, micrometeoroid bombardment, and lack of wind erosion).
  2. Evaluate decontamination tool trade-offs across speed, power draw, airborne particulate creation, and surface damage.
  3. Master disciplined airlock interlock procedures to prevent hazardous particulate contamination of living quarters.

### 2. Scientific Foundation
- **Concepts:** Lunar regolith petrology (anorthosite, basaltic glass shards, agglutinates), lack of atmospheric weathering (razor-sharp jagged edges), triboelectric and photoelectric charging, airlock pressure cycling, electrodynamic dust shielding (EDS) traveling wave dielectric repulsion, HEPA filtration mechanics.
- **Real Datasets & Research:**
  - *Firefly Blue Ghost Mission 1 EDS Payload Reports (2025)*: Dielectric electrode coatings clearing $>95\%$ of dust from glass and mirrors without mechanical contact.
  - *NASA Celestial Dust Exposure Risk Assessment*: Health risks of inhaled sub-micron silica particulates (space silicosis).
  - *Apollo Lunar Surface Journal*: Crew notes on zipper jams, visor scratching, and seal abrasion.
- **Measurements:** Starting dust loads: Suit ($100\text{ units}$), Boots ($90\text{ units}$), Helmet Visor ($60\text{ units}$), Tool Bag ($50\text{ units}$); clean threshold: $\le 15\text{ units}$; airlock power budget: $50\text{ units}$ (Explorer) or $70\text{ units}$ (Cadet); brush removal: $80\%$ (zero power, but generates $60\%$ airborne dust and scratches polycarbonate glass); vacuum removal: $85\%$ ($4\text{ power}$, generates only $5\%$ airborne dust); EDS rack: up to $95\%$ on smooth dielectric surfaces ($5\text{ power}$, generates $10\%$ airborne dust).
- **Simplifications & Pedagogical Abstractions:** Dust contamination is measured in accessible integer points ($0–100$); airlock chamber atmosphere cycling is compressed into 5-minute interactive blocks.

### 3. Gameplay Design
- **Player Role:** Airlock Ingress & Decontamination Technician at Horizon Outpost.
- **Objectives:**
  1. Ingress outer airlock hatch; seal outer hatch wheel and dog down dogs.
  2. Repressurize airlock chamber from vacuum to habitat atmosphere ($101\text{ kPa}$).
  3. Clean 4 gear components (EVA suit torso, boots, tool bag, and helmet visor) using available tools.
  4. Run the airlock atmospheric scrubber fan to remove airborne dust particulates.
  5. Replace contaminated HEPA filter cartridge when particulate differential pressure spikes.
  6. Verify zero dust leak into habitat before unlocking the inner pressure door.
- **Player Actions:** Outer hatch wheel rotation (hold E), repressurization valve push button, tool selection (Mechanical Brush, High-Efficiency Vacuum Wand, EDS Electrostatic Plate), item placement on EDS rack, scrubber fan switch, filter pull/swap, inner hatch wheel rotation.
- **Decisions & Trade-offs:**
  - *Tool Selection per Surface:*
    - *Helmet Visor:* Using the brush is fast and free, but jagged dust particles permanently scratch the optical polycarbonate, ruining visor clarity and disqualifying the player from a Mastered rating. The EDS plate clears 95% of dust safely using electrical fields.
    - *EVA Suit Torso:* Too bulky to fit onto the EDS plate; must be cleaned using a combination of vacuum wand and brush.
    - *Tool Bag:* Sturdy fabric; brush removes dust quickly, but releases clouds of airborne dust that load the air scrubber.
  - *Power vs Time Management:* Pressurizing costs 8 power, vacuum costs 4 power per item, EDS costs 5 power, and scrubber costs 5 power. Blasting every item with power tools drains the entire 50-power budget before air filtration is complete.
- **Challenges:** Opening the inner hatch while air contains $> 15\text{ ppm}$ dust causes a hazardous leak into the living quarters; two leaks cause habitat contamination failure.
- **Environment Response:** Dust visibly coats gear meshes with a dull gray grime; brushing produces a swirling cloud of particulate haze in the airlock air; vacuum wand leaves a clean, bright path across fabrics; scratched visor shows permanent micro-abrasion streaks across the player's view.

### 4. Mission Progression
1. **Preparation:** Step into Horizon Base airlock from lunar exterior. Grasp orange outer hatch wheel; rotate and lock dogs ($60\text{ s}$). Press green pressurization button: gas hisses as chamber pressure climbs to $101\text{ kPa}$ (costs 8 power).
2. **Main Activities:** Review contamination status on wall monitor: Suit 100, Boots 90, Helmet 60, Tool Bag 50.
   - Detach helmet; place onto EDS plate; flip toggle: high-frequency electric fields hum, repelling dust instantly down to 5 units without a single scratch.
   - Vacuum boots (clears to 13 units, costs 4 power).
   - Brush tool bag (clears to 10 units, costs 0 power, but releases airborne cloud).
   - Vacuum and brush EVA suit torso.
3. **Emergencies / Anomalies:** Air scrubber differential pressure gauge redlines: HEPA filter is fully packed with sucked dust. Air scrubber halts while airborne particulate remains dangerously high ($45\text{ ppm}$). Player must open maintenance shroud, unseat dirty filter, grab clean filter from rack, insert it, and restart scrubber.
4. **Completion:** Air quality monitor reads $0\text{ ppm}$; all 4 gear items indicate clean ($\le 15$). Grasp green inner hatch wheel; rotate locking dogs; swing door open into pristine base living quarters.
5. **Debrief:** Displays final base dust leakage ($0\text{ units}$), optical visor condition (Zero Scratches), total power consumed, filter efficiency, and awards *Dust Buster* badge.

### 5. Game Mechanics & Formulas
- **Decontamination Cleaning Equation:**
  $$D_{\text{item}}(t + 1) = D_{\text{item}}(t) \cdot (1 - \text{Efficiency}_{\text{tool}}) \quad \text{where } \text{Eff}_{\text{brush}} = 0.80, \, \text{Eff}_{\text{vac}} = 0.85, \, \text{Eff}_{\text{EDS}} = 0.95$$
- **Airborne Particulate Generation:**
  $$\text{AirborneDust} = \text{AirborneDust} + \Delta D_{\text{item}} \cdot f_{\text{aerosol}}(\text{tool}) \quad (f_{\text{brush}} = 0.60, \, f_{\text{vac}} = 0.05, \, f_{\text{EDS}} = 0.10)$$
- **Airlock Air Scrubber Filtration:**
  $$\frac{d(\text{Airborne})}{dt} = -r_{\text{scrub}} \cdot \sigma_{\text{fan}} \cdot (1 - \text{FilterClog}) \quad (\text{FilterClog} = \text{TotalDustCaptured} / 120)$$
- **Inner Hatch Interlock Violation:**
  $$\text{BaseLeak} = \text{BaseLeak} + \text{AirborneDust} \quad \text{if InnerDoor Opened when } \text{AirborneDust} > 15$$

### 6. Fun & Engagement
- **Tactile Cleaning Pleasure:** Deeply satisfying visual "power-washing" style gratification as thick gray grime is scrubbed, vacuumed, and zapped away.
- **Scientific Realism:** Kids are fascinated by the counter-intuitive fact that Moon dust is razor-sharp glass that cannot be wiped with a cloth without ruining visors.
- **Replayability:** Finding the absolute minimum-power cleaning combo that achieves zero scratches and zero base dust leaks.

### 7. Technical Implementation
- **Datasets/APIs:** Firefly Blue Ghost Mission 1 EDS engineering reports; NASA Apollo dust toxicity clinical reports.
- **Integration:** Pure ES module in `missions/lunar-dust/`; Three.js scene featuring dynamic texture alpha-mask cleaning shaders, airborne particulate particle systems, and mechanical hatch interlocks.
- **Components:** `scenario.js`, `state.js`, `actions.js`, `scene.js`, `ui.js`.

### 8. Learning Outcomes
- Player explains why lunar dust is sharp and dangerous compared to smooth Earth sand (no wind/water weathering).
- Player understands why different materials and surfaces require specialized cleaning tools (EDS for optical glass vs vacuum/brush for fabrics).
- Player grasps the critical safety function of an airlock as an environmental boundary.

---

## 9. Over the Hill (`/lunar-relay`)
*Topographic RF Shadowing, Deployable Repeater Masts, and Geological Core Sample Custody*

### Evaluation
**Improve & Connect.** Upgrade the terrain elevation profile by importing authentic LRO LOLA ridge topography. Add a clear visual line-of-sight raycasting tool that lets players test whether radio signals clear the ridge summit before descending into Shadow Hollow. Connect the harvested lunar core samples to the scientific campaign archive.

### 1. Mission Identity
- **Title:** Over the Hill
- **Real-World Inspiration:** Lunar south pole line-of-sight RF communications blockage; NASA Glenn Research Center lunar surface RF propagation experiments; Chandrayaan-3 Pragyan rover / Vikram lander communications relay architecture; JPL Horizons Earth-Moon ephemeris ($1.35\text{ s}$ delay).
- **Category:** Telecommunications / Lunar Surface Navigation / Field Geology / Robotics.
- **Difficulty:** Intermediate (Cadet: 110 min suit oxygen, 95% rover battery, automated relay alignment; Explorer: 90 min suit oxygen, 85% rover battery, manual dish aiming, dual-core sample battery management).
- **Learning Objectives:**
  1. Understand that radio waves propagate via line-of-sight and are completely blocked by opaque geological obstacles (hills, ridges, crater walls).
  2. Master the deployment and geometry of relay repeaters to maintain communication across obstructed terrain.
  3. Manage vehicular battery consumption during uphill/downhill traverses and evaluate sample return trade-offs.

### 2. Scientific Foundation
- **Concepts:** Line-of-sight (LOS) radio propagation, diffraction over knife-edge obstacles, repeater relay hops, Horizons Earth-Moon ephemeris light-time ($1.35\text{ s}$), rover battery discharge kinetics, rotary percussion core drilling energy costs ($8\%\text{ battery/core}$).
- **Real Datasets & Research:**
  - *JPL Horizons Earth-Moon Ephemeris* (`horizons-moon-earth-2026-11.txt`): Target 301 (Moon), Observer 500@399 (Earth), 1-way light time = $1.35\text{ seconds}$.
  - *NASA Glenn Lunar Surface Propagation Studies*: Ultra-high frequency (UHF) and S-band signal attenuation over lunar regolith ridges.
  - *Apollo Lunar Surface Drill (ALSD)*: Mechanical energy and heat generation during rotary percussion drilling into consolidated breccia.
- **Measurements:** Rover battery: $85\%$ capacity; reserve requirement: $10\%$; suit oxygen: $90\text{ min}$; traverse costs: Base to Ridge Top ($18\%\text{ battery}, 6\text{ min}$); Ridge Top to Hollow ($10\%\text{ battery}, 5\text{ min}$); Hollow to Ridge Top ($15\%\text{ battery}, 5\text{ min}$); Ridge Top to Base ($12\%\text{ battery}, 6\text{ min}$); drilling cost: $8\%\text{ battery}, 8\text{ min}$ per core.
- **Simplifications & Pedagogical Abstractions:** Signal attenuation is modeled as a binary line-of-sight raycast check; rover driving physics is tuned for stability on low-gravity slopes.

### 3. Gameplay Design
- **Player Role:** Lunar Rover Field Specialist & Core Drilling Operator at Horizon Outpost.
- **Objectives:**
  1. Select an expedition strategy: Relay Deployment Plan vs Quick-Trip Blind Run.
  2. Load mobile communications relay unit into the rover cargo bed.
  3. Drive rover from Horizon Base up to the summit of Long Ridge.
  4. Deploy relay unit: extend outrigger legs, raise 3-stage telescoping mast, and align directional high-gain dish toward Horizon Base.
  5. Descend into Shadow Hollow; locate target geological outcrop X1.
  6. Deploy rotary percussion drill and extract Core Sample 1; store core in sample custody container.
  7. Transmit scientific data telemetry back to base through the ridge relay.
  8. Receive Earth ground command requesting an optional second core sample at outcrop X2; calculate battery return reserve and decide whether to drill or return.
  9. Drive safely back to Horizon Base and ingress airlock.
- **Player Actions:** Rover driving (WASD/arrows, Space for brake, P for park), relay unit loading, tripod deployment, mast height crank (Press E), dish gimbal orientation, drill arm deployment (hold E), core sample transfer, radio transmission.
- **Decisions & Trade-offs:**
  - *Relay Plan vs Quick Trip:*
    - *Quick Trip (No Relay):* Avoids hauling and setting up the relay, saving 15 minutes of suit air and 8% battery. However, once in Shadow Hollow, the ridge blocks all radio contact with base. The rover cannot transmit initial findings, cannot receive authorization for Core 2, and must drive all the way back blind.
    - *Relay Plan:* Costs time and energy up front, but establishes a continuous communication link. Enables real-time data downlink and unlocks the second high-value core sample request.
  - *Core 2 Energy Decision:* Drilling Core 2 costs 8% battery. Total expedition energy with 2 cores uses ~71% battery, leaving ~14% upon return. That satisfies the 10% safety reserve, but leaves very little room for driving errors.
- **Challenges:** Driving into Shadow Hollow without deploying the relay cuts the radio link—HUD displays static and loses navigation telemetry; climbing out of the hollow with low battery triggers an emergency rescue sequence from Luca Moreau, capping rating at OK.
- **Environment Response:** As the rover crests Long Ridge and descends into Shadow Hollow, the distant base disappears behind the rocky crest; signal strength bars drop from 5 bars to 0 bars unless the relay is deployed; Three.js lighting shifts from harsh low-angle sunlight to deep, cold crater shadow illuminated only by rover headlights.

### 4. Mission Progression
1. **Preparation:** Review EVA brief at Horizon Base. Suit oxygen: $90\text{ min}$. Rover battery: $85\%$. Pick Relay Plan. Mount relay package onto rear rover rack. Climb into rover; disengage parking brake.
2. **Main Activities:** Drive up winding switchback trail to Long Ridge summit ($18\%\text{ battery used}$). Park on yellow target ring. Unload relay. Extend 3 legs; raise 3 mast stages; align dish crosshair with Horizon Base beacon. Green link light turns solid: Relay Active.
3. **Emergencies / Anomalies:** Descend into Shadow Hollow ($10\%\text{ battery used}$). Reach Outcrop X1. Deploy drill; drill core (8 min, $8\%\text{ battery}$). Store core. Transmit telemetry via ridge relay. Signal bounces successfully over ridge to base and on to Earth ($1.35\text{ s}$ delay).
4. **Completion:** Earth responds immediately: *"Spectrometry of Core 1 is astonishing! Secondary target X2 detected 20 meters east. Drill Core 2 if battery permits."* Player calculates return energy: Current Battery $49\%$. Drilling Core 2 costs $8\%$. Climbing to ridge costs $15\%$. Descending home costs $12\%$. Total needed: $35\%$. Remaining battery: $14\% > 10\%$ reserve. Safe to proceed! Drill Core 2. Drive up to ridge, down to base, and dock.
5. **Debrief:** Displays traverse elevation map, radio line-of-sight raycast diagram, 2 cores collected, battery reserve margin ($14\%$), suit oxygen remaining, and awards *Crater Relay* badge.

### 5. Game Mechanics & Formulas
- **Line-of-Sight Raycast Check:**
  $$\text{LOS}(A, B) = \forall x \in [A, B], \, z_{\text{ray}}(x) > z_{\text{terrain}}(x)$$
  Direct link: $\text{LOS}(\text{Rover}, \text{Base})$. Relay link: $\text{LOS}(\text{Rover}, \text{Relay}) \land \text{LOS}(\text{Relay}, \text{Base})$.
- **Relay Mast Line-of-Sight Elevation:**
  $$z_{\text{antenna}} = z_{\text{ground}} + H_{\text{mast}} \quad (H_{\text{mast}} = 2.0\text{ m} + N_{\text{stages}} \cdot 1.8\text{ m})$$
- **Total Expedition Battery Accounting:**
  $$E_{\text{final}} = E_0 - \left[ \Delta E_{\text{up1}} + \Delta E_{\text{down1}} + N_{\text{cores}} \cdot \Delta E_{\text{drill}} + \Delta E_{\text{up2}} + \Delta E_{\text{down2}} \right]$$
  where $E_0 = 85\%$, $\Delta E_{\text{up1}} = 18\%$, $\Delta E_{\text{down1}} = 10\%$, $\Delta E_{\text{drill}} = 8\%$, $\Delta E_{\text{up2}} = 15\%$, $\Delta E_{\text{down2}} = 12\%$.

### 6. Fun & Engagement
- **Overcoming Obstacles:** Intuitive physical satisfaction of solving an invisible radio blockage problem with an elegant relay antenna tower.
- **Calculated Risk:** Calculating battery math in your head to decide whether you can safely drill the second core sample before driving home.
- **Replayability:** Testing the Quick Trip route to see what happens when you attempt the mission without radio communications; pushing battery efficiency to maximize return margins.

### 7. Technical Implementation
- **Datasets/APIs:** `horizons-moon-earth-2026-11.txt` (JPL Horizons lunar light-time); NASA Glenn lunar RF surface models.
- **Integration:** Pure ES module in `missions/lunar-relay/`; Three.js scene featuring rugged lunar ridge elevation geometry, dynamic raycast visibility testing, and low-gravity driving physics.
- **Components:** `scenario.js`, `state.js`, `actions.js`, `scene.js`, `ui.js`.

### 8. Learning Outcomes
- Player explains why radio signals cannot pass through solid planetary rock and hills.
- Player grasps how repeater stations allow communications to bend around topographical obstacles.
- Player learns to calculate multi-stage energy budgets to ensure safe return from remote expeditions.

---

## 10. Be the Base Boss (`/base-boss`)
*Regional Multi-Outpost Logistics, Supply Chain Dependencies, and Crisis Management*

### Evaluation
**Expand & Connect.** Connect the regional exploration map directly to the Verdant Outpost life-support drill. Reconcile the legacy battery reserve differences identified in the code audit. Fully integrate the conserved water loop (separating potable clean water, gray wastewater, and radiation shield water). Connect the outcomes of the 3 linked decisions (storm power, SEP shelter, Earth reply) to create meaningful branch states for the capstone review.

### 1. Mission Identity
- **Title:** Be the Base Boss
- **Real-World Inspiration:** Multi-outpost planetary exploration concepts (NASA Moon-to-Mars Architecture, CHAPEA simulated Mars missions); integrated environmental control across multiple sites (Meridian Base, Verdant Greenhouse Outpost, Kestrel Ridge Science Camp).
- **Category:** Planetary Expedition Command / Multi-Base Logistics / Systems Engineering / Capstone.
- **Difficulty:** Advanced (Cadet: guided regional waypoint routes, forgiving resource consumption, simplified 3-slider Verdant drill; Explorer: multi-base inventory balancing, real-time battery drain on regional traverses, complex water recycling loops, cascading crisis mitigation).
- **Learning Objectives:**
  1. Master systems thinking: understand how decisions in power, water, food, radiation, and communications interlock across an entire planetary basin.
  2. Evaluate opportunity costs when allocating scarce supplies among competing outposts.
  3. Manage multi-base supply chains and logistical travel times under harsh planetary constraints.

### 2. Scientific Foundation
- **Concepts:** Multi-node logistical networks, closed-loop mass conservation ($\sum \dot{m}_{\text{in}} = \sum \dot{m}_{\text{out}}$), solar storm attenuation profiles across regional separations, deep space delay in multi-tier command hierarchies, battery capacity degradation.
- **Real Datasets & Research:**
  - *Opportunity 2018 Solar Output Series* (`opportunity-2018.js`): Drives regional solar power forecasts.
  - *Curiosity RAD May 20, 2024 Event Summary* (`curiosity-rad-2024-05-20.json`): Supplies the $8,100\text{ \mu Gy}$ regional radiation event benchmark.
  - *JPL Horizons Light-Time Model* (`horizons-mars-earth-2026-11.txt`): Governs Earth consultation latency ($11.01\text{ min}$ OWLT).
  - *NASA OSDR OSD-269 Veggie Data*: Governs Verdant greenhouse crop yield and photoperiod power requirements.
- **Measurements:** Meridian Basin spans $25\text{ km}$; rover travel speed: $12\text{ km/h}$; regional battery draw: $0.8\text{ kWh/km}$; clean water stock: $150\text{ L}$; wastewater stock: $40\text{ L}$; shield water: $60\text{ L}$; food rations: $120\text{ portions}$.
- **Simplifications & Pedagogical Abstractions:** Real regional travel on Mars requires sol-length autonomous traversals; game provides an interactive regional driving and fast-transit map with accurate time and battery accounting.

### 3. Gameplay Design
- **Player Role:** Meridian Basin Regional Operations Commander.
- **Objectives:**
  1. Review basin-wide logistics dashboard: Meridian (Main Hub), Verdant (Agricultural Outpost), Kestrel (Science Camp).
  2. Pilot long-range rover between outposts to deliver critical spares and life-support supplies.
  3. Respond to three linked, compounding regional operational crises:
     - *Dust Storm Approaching:* Allocate regional battery reserves between Verdant greenhouses and Meridian life support.
     - *Solar Particle Event Triggered:* Balance water mass between drinking reserves and habitat radiation shielding walls.
     - *Water Recycler Anomaly at Verdant:* Choose whether to deploy local replacement parts, wait for Earth downlink, or limp on emergency reserves.
  4. Execute the Verdant Outpost Stabilization Drill: configure clean water, gray water recycling, and crop photoperiods to achieve self-sustaining equilibrium.
- **Player Actions:** Regional driving navigation, cargo loading/unloading, crisis decision modal selection, three-way resource allocation sliders, suit-up EVA actions at outposts.
- **Decisions & Trade-offs:**
  - *Water Mass Allocation:* Water acts as both drinking supply and radiation shielding. Diverting 40L of water into the radiation shelter walls cuts crew storm dosage by 60%, but leaves Verdant crops on strict drought rationing.
  - *Power vs Fresh Food:* Verdant's crops need 8 kWh of power daily. During the dust storm, keeping Verdant lit requires shutting down science racks at Kestrel and drawing Meridian's battery down to 30%.
- **Challenges:** Running out of rover battery on the desolate transit trail between Meridian and Verdant; misallocating water such that crew survives the radiation storm but crops die of drought two sols later.
- **Environment Response:** Basin map shows real-time weather and radiation overlays; Three.js outposts change appearance based on power allocation (bright vs brownout lighting); crew status portraits update dynamically with fatigue, health, and morale indicators.

### 4. Mission Progression
1. **Preparation:** Command briefing at Meridian Hub. Review regional resource status. Commander Reyes assigns priority task: deliver newly overhauled ECLSS pump to Verdant Outpost ($8\text{ km}$ northeast) before storm arrival.
2. **Main Activities:** Load pump into rover cargo bay. Drive across Meridian Basin, navigating terrain contours. Arrive at Verdant Outpost; dock rover. Ingress airlock; deliver pump to hydroponics bay.
3. **Emergencies / Anomalies:** Triple crisis cascades across the basin:
   - *Crisis 1 (Meteorological):* Opportunity dust curve indicates 70% solar drop across the basin within 3 hours.
   - *Crisis 2 (Radiological):* DONKI alert: major SEP event incoming. Crew at Kestrel is unshielded.
   - *Crisis 3 (Technical):* Recycler motor trips circuit breaker; Earth reply is 22 minutes away.
   Player executes three linked command decisions on the basin terminal, balancing reserves across all three stations.
4. **Completion:** Enter the Verdant Central Drill Console. Balance the newly installed closed-loop life-support system: route gray water from wash sinks into filtration; allocate 75% clean water to crew drinking and 25% to hydroponic beds; establish 16:8 photoperiod. Verify that all outposts maintain positive energy and life-support reserves.
5. **Debrief:** Displays comprehensive basin performance matrix: Total Regional Energy Surpluses, Crew Radiation Dose, Crop Survival Rate, Water Recycling Efficiency ($> 95\%$), and awards the prestigious *Base Commander* crown badge.

### 5. Game Mechanics & Formulas
- **Conserved Multi-Node Water Balance:**
  $$\begin{aligned}
  W_{\text{clean}}(t + 1) &= W_{\text{clean}}(t) - C_{\text{crew}} - C_{\text{crops}} + \eta_{\text{recycler}} \cdot W_{\text{gray}}(t) \\
  W_{\text{gray}}(t + 1) &= W_{\text{gray}}(t) + C_{\text{crew}} \cdot 0.85 - \text{RecycledWater} \\
  W_{\text{shield}}(t + 1) &= W_{\text{shield}}(t) \pm \Delta W_{\text{diverted}}
  \end{aligned}$$
  where total water mass $W_{\text{total}} = W_{\text{clean}} + W_{\text{gray}} + W_{\text{shield}} + W_{\text{crops}}$ is strictly conserved (accounting for minor loop losses).
- **Regional Traverse Battery Cost:**
  $$E_{\text{rover\_battery}}(d) = E_0 - d \cdot \left[ \text{Wh/km}_{\text{base}} + \text{Wh/km}_{\text{cargo}} \cdot M_{\text{cargo}} + \text{Wh/km}_{\text{roughness}} \cdot R \right]$$
- **Regional Radiation Attenuation:**
  $$D_{\text{crew}}(t) = D_{\text{curiosity\_event}}(t) \cdot \left( 1 - \frac{W_{\text{shield}}}{W_{\text{shield\_max}}} \cdot 0.70 \right)$$

### 6. Fun & Engagement
- **Grand Strategy Feel:** Thrill of stepping up from an individual technician to the overarching Base Boss commanding an entire planetary network.
- **Interlocking Consequences:** Every decision has tangible ripple effects: saving water at Base A creates an unexpected crop dilemma at Base B.
- **Replayability:** High replay value through exploring radically different command doctrines (e.g., Agriculture-First vs Crew-Comfort-First vs Science-Maximization).

### 7. Technical Implementation
- **Datasets/APIs:** `normalized.json` (integrated ephemeris, solar, radiation, and crop data); `curiosity-rad-2024-05-20.json`.
- **Integration:** Pure ES module in `missions/base-boss/`; Three.js regional terrain map, rover traversal physics, and interactive Verdant drill terminal.
- **Components:** `region.js`, `progress.js`, `outpost-drill.js`, `drill-panel.js`, `driving.js`, `world.js`.

### 8. Learning Outcomes
- Player understands how life support, power, food, and shielding form an inextricably linked web of resources.
- Player grasps the concept of opportunity cost: choosing to protect one resource always requires sacrificing or deferring another.
- Player learns to coordinate multi-site logistics across vast planetary distances.

---

## 11. Thirty Sols (`/campaign`)
*Long-Duration Expedition Survival, Compound Risk Management, and Decision Review*

### Evaluation
**Improve & Expand.** Standardize resource nomenclature and consumption units to match the rest of the redesigned curriculum. Introduce an explicit "Cadet Mode" grouping the seven resources into three simplified macro-pools (Power, Life Support, Crew Health). Implement deterministic seeded replays with detailed retrospective decision analytics showing where small early deferrals caused late-game compounding failures.

### 1. Mission Identity
- **Title:** Thirty Sols
- **Real-World Inspiration:** Long-duration isolation analog missions (NASA CHAPEA 378-day mission, HI-SEAS, Antarctic research stations); NASA Life Support Baseline Values and Assumptions; human spaceflight expedition planning.
- **Category:** Long-Duration Expedition Management / Risk Analysis / Systems Engineering.
- **Difficulty:** Advanced (Cadet: 3 macro-resource pools, forgiving daily event penalties, early warning indicators; Explorer: 7 discrete resources, compound interest on deferred equipment maintenance, severe weather anomalies).
- **Learning Objectives:**
  1. Understand that long-duration space expeditions require sustained, forward-looking resource conservation rather than short-term panic fixes.
  2. Experience how small, neglected maintenance issues compound exponentially into catastrophic multi-system failures.
  3. Analyze retrospective decision trees to identify root causes of expedition success or collapse.

### 2. Scientific Foundation
- **Concepts:** Long-duration ECLSS mass balances, mean time between failures (MTBF), preventive maintenance vs corrective maintenance, crew psychological fatigue and circadian degradation, cumulative biological radiation exposure, compound risk dynamics.
- **Real Datasets & Research:**
  - *NASA Life Support Baseline Values & Assumptions (2022)*: Daily per-crew mass consumables (0.84 kg O2, 2.5 L drinking water, 0.62 kg dry food).
  - *NASA Human Research Program (HRP) Evidence Books*: Behavioral health, sleep loss, and team cohesion degradation over prolonged confinement.
  - *Opportunity and Curiosity Long-Term Power Records*: Seasonal solar and RTG degradation profiles.
- **Measurements:** Campaign duration: 30 Martian sols; crew size: 4 astronauts (Elena Reyes, Amara Okafor, Jin Park, Luca Moreau); 7 tracked metrics: Power, Air, Water, Food, Radiation Shielding, Equipment Health, Crew Morale (nominal starting baseline: $70–80\%$).
- **Simplifications & Pedagogical Abstractions:** Daily operational schedules are structured as turn-based planning cycles (Day Planning Phase $\rightarrow$ Daily Event / Crisis $\rightarrow$ Sol Progression $\rightarrow$ Night Telemetry Review).

### 3. Gameplay Design
- **Player Role:** Expedition Mission Director for the Meridian Outpost 30-Sol Campaign.
- **Objectives:**
  1. Guide a 4-person astronaut crew through 30 consecutive Martian sols.
  2. Assign daily operational duties to each crew member (System Maintenance, Crop Farming, Scientific EVA, Exercise & Rest, Medical Support).
  3. Manage seven interlocking resource pools (Power, Air, Water, Food, Shielding, Equipment, Morale).
  4. Respond to unpredictable deterministic seeded events (dust devils, seal leaks, optical sensor dust, solar particle storms, psychological friction).
  5. Conclude the 30-sol campaign with all four crew members healthy, all systems functional, and scientific objectives fulfilled.
- **Player Actions:** Crew roster task assignment cards, daily work allocation buttons, crisis modal decision buttons, timeline scrubber, retrospective decision review explorer.
- **Decisions & Trade-offs:**
  - *Preventive Maintenance vs Science Output:* Assigning Jin Park to inspect airlock seals and clean solar arrays every 3 sols keeps Equipment Health high ($> 85\%$) and prevents unexpected leaks, but reduces time spent on geological exploration and crop harvesting.
  - *Dietary Rationing:* Serving full fresh food rations boosts Crew Morale by $+5\%$ daily, but depletes food reserves by Sol 22 if crop growth falls behind.
- **Challenges:** "The Cascade": ignoring a minor $2\%$ water pipe weep on Sol 5 causes an electrical short on Sol 12, which knocks out the crop lights on Sol 18, causing food starvation on Sol 26.
- **Environment Response:** 3D habitat exterior and interior visually reflects the sol cycle and weather; solar array efficiency reflects dust accumulation; habitat lighting shifts to amber during equipment brownouts; crew portraits display fatigue bags and scowls when morale plummets.

### 4. Mission Progression
1. **Preparation:** Sol 1 Launch. Review carry-over state from previous missions (e.g., if *Before the Storm* was completed successfully, starting air starts at $80\%$ instead of $75\%$; if *Tracks in the Dust* succeeded, Kestrel science survey is pre-credited).
2. **Main Activities (Sols 1–10):** Establish steady-state routines. Assign daily tasks: Amara tends hydroponics; Jin maintains water recyclers; Elena manages communications; Luca monitors physical exercise. Balance daily power consumption against diurnal solar insolation.
3. **Emergencies / Anomalies (Sols 11–25):** Seeded crisis sequence:
   - *Sol 12:* Dust devil brushes solar farm: power generation drops $25\%$.
   - *Sol 17:* Solar particle alert: crew must hunker in shelter; work is suspended for 24 hours.
   - *Sol 21:* Water recycler membrane tears: choice between burning spare part or rationing water.
4. **Completion (Sols 26–30):** Final push toward Sol 30. Manage dwindling supplies; balance remaining battery cycles; complete final science reports. Sol 30 sunset brings mission conclusion.
5. **Debrief:** Comprehensive 30-Sol Analytics Review. Displays full 30-day graphs for all 7 resources, crew health trajectories, decision tree branch analysis showing the root causes of every crisis, and overall mission mastery grade.

### 5. Game Mechanics & Formulas
- **Daily Resource Progression Invariant:**
  $$R_j(t + 1) = \text{clamp}\left( R_j(t) + \Delta R_{\text{gen}, j}(t) - \Delta R_{\text{con}, j}(t) + \Delta R_{\text{event}, j}(t), \, 0, \, 100 \right)$$
- **Compound Equipment Wear Equation:**
  $$\Delta \text{Equip}_{\text{wear}}(t) = k_{\text{base}} + k_{\text{deferred}} \cdot (100 - \text{Equip}(t))^2$$
  Notice the non-linear squaring: as equipment health drops, the daily rate of failure accelerates dramatically.
- **Crew Morale Dynamic Equation:**
  $$\text{Morale}(t + 1) = \text{Morale}(t) + f(\text{FoodQuality}) + f(\text{RestHours}) - f(\text{Overwork}) - f(\text{SystemFailures})$$

### 6. Fun & Engagement
- **Emergent Storytelling:** Rich personal attachment to the 4 crew members as you guide them through month-long hardships and celebrate their triumphs.
- **The "One More Sol" Addiction:** Fast, compelling daily turn cycles make it almost impossible to stop playing.
- **Replayability:** Fixed-seed replaying allows players to test different managerial philosophies against the exact same sequence of historical events.

### 7. Technical Implementation
- **Datasets/APIs:** `story.js` (seeded event engine); `legacy-exposure.js`; `decision-review.js`.
- **Integration:** Pure ES module in `main.js` and `campaign.html`; Three.js planetary habitat scene with procedural day/night cycle, dynamic HUD resource meters, and modal event dialogues.
- **Components:** `main.js`, `story.js`, `outpost.js`, `audio.js`, `decision-review.js`.

### 8. Learning Outcomes
- Player understands that success on a planetary expedition depends on steady, disciplined daily preventive care.
- Player learns how neglect in one subsystem triggers cascading failures across an entire habitat.
- Player develops long-term strategic foresight and risk-mitigation skills.

---

## 12. Station Shift (`/station-shift`) [NEW]
*Orbital Life Support Balancing, Astronaut Circadian Scheduling, and Space Dosimetry*

### 1. Mission Identity
- **Title:** Station Shift
- **Real-World Inspiration:** International Space Station (ISS) Expedition flight engineering daily shifts; NASA Human Research Program (HRP) 2.5-hour mandatory daily astronaut exercise protocols (ARED resistance and T2 treadmill) to prevent bone demineralization and muscle atrophy; NASA RadLab dosimeter telemetry from Columbus and Destiny modules; astronaut sleep loss and circadian disruption research.
- **Category:** Orbital Operations / Human Physiology / Space Medicine / ECLSS.
- **Difficulty:** Introductory (Cadet: guided 16-hour schedule drag-and-drop, 4 core activity blocks, forgiving power margin; Explorer: 8 discrete 1-hour schedule blocks, simultaneous crew member time management, unexpected orbital solar array gimbal lock, RadLab dosimeter orbital analysis).
- **Learning Objectives:**
  1. Understand why microgravity requires astronauts to exercise 2+ hours daily to prevent severe bone density and muscle loss.
  2. Manage an astronaut's finite 24-hour daily time budget across life-support maintenance, scientific research, exercise, and protected restorative sleep.
  3. Analyze real orbital radiation dosimeter data to see how exposure rates fluctuate across orbital inclination and the South Atlantic Anomaly (SAA).

### 2. Scientific Foundation
- **Concepts:** Microgravity musculoskeletal deconditioning (osteoclast/osteoblast imbalance, muscle atrophy), cardiovascular deconditioning, circadian rhythm entrainment (16 sunrises/sunsets per day on ISS), sleep architecture, South Atlantic Anomaly (SAA) geomagnetic radiation trapping, active vs passive dosimeters.
- **Real Datasets & Research:**
  - *NASA RadLab API Telemetry* (`visualization.osdr.nasa.gov/radlab/`): Instrument `instrument_id: DOSTEL`, absorbed dose rates ($\mu\text{Gy/h}$) along ISS orbital tracks.
  - *Smith et al. (2012) & NASA HRP Human Bone/Muscle Studies*: Quantitative bone mineral density loss ($1–1.5\%\text{ per month}$ without resistance exercise) and ARED countermeasure efficacy.
  - *Astronaut Sleep Confinement Studies (PMC4188436)*: Impact of circadian shifts and acoustic noise on restorative REM sleep.
- **Measurements:** Shift duration: 16 working hours $+ 8$ protected sleep hours; daily exercise requirement: $\ge 2.0\text{ hours}$ (1 hour aerobic, 1 hour heavy resistance); daily maintenance: $\ge 3.0\text{ hours}$; orbital period: $90\text{ minutes}$; SAA transit dose spike: up to $180\text{ \mu Gy/h}$ (vs background $12\text{ \mu Gy/h}$).
- **Simplifications & Pedagogical Abstractions:** Real astronaut timelines are scheduled down to 5-minute increments by Houston Mission Control; game abstracts the day into an engaging, interactive scheduling board with immediate physiological and electrical simulation feedback.

### 3. Gameplay Design
- **Player Role:** Station Flight Engineer aboard the *Asteria* Orbital Complex.
- **Objectives:**
  1. Build and manage the daily 16-hour schedule for Astronaut Jin Park and Dr. Amara Okafor.
  2. Allocate time blocks among 4 competing operational requirements: Life Support (ECLSS) Filter Servicing, Scientific Research Glovebox, ARED Exercise, and Meals/Hygiene.
  3. Guarantee an uncompromised 8-hour protected sleep period in the crew sleep quarters.
  4. Respond to an unexpected mid-shift emergency: Solar Array Beta Gimbal Jam, which caps station electrical power by $35\%$ during orbital day.
  5. Inspect the RadLab dosimeter telemetry graph and identify radiation spikes corresponding to orbital passage through the South Atlantic Anomaly.
- **Player Actions:** Interactive schedule timeline block snapping, ECLSS filter bay inspection and pull, ARED exercise machine tension setting, glovebox experiment manipulation, solar array manual gimbal trim controls.
- **Decisions & Trade-offs:**
  - *Exercise vs Science:* Cutting exercise time from 2 hours to 30 minutes frees up 1.5 hours to finish high-value crystal growth science experiments, but causes immediate physical fatigue penalties, long-term bone deconditioning flags, and a reprimand from flight medicine.
  - *Power Load Shedding during Gimbal Lock:* When the solar wing sticks at an oblique angle, power generation drops. The player must choose whether to power down the science research rack (delaying experiments) or power down exercise equipment displays and cabin galley heating.
  - *Sleep Protection:* Sacrificing 2 hours of sleep to fix the gimbal jam immediately reduces cognitive sharpness and reaction time on the following day.
- **Challenges:** Scheduling exercise immediately after meals causes nausea; overlapping high-power experiment runs with battery charging in shadow triggers station bus brownouts.
- **Environment Response:** Earth rolls silently past the panoramic cupola windows below; station lighting automatically dims to deep blue during sleep periods; station interior acoustics hum with pumps, ventilation fans, and the rhythmic clanking of the exercise machine.

### 4. Mission Progression
1. **Preparation:** Morning handover briefing from Houston/Munich ground control. Review today's work board. Review RadLab background dosimeter reading ($15\text{ \mu Gy/h}$).
2. **Main Activities:** Open Crew Scheduling Console. Drag-and-drop activity blocks onto Jin's and Amara's daily timelines:
   - Block 1: Breakfast & Medical Telemetry Check.
   - Block 2: ECLSS Carbon Dioxide Scrubber Canister Swap.
   - Block 3: ARED Heavy Resistance Squats & Deadlifts (2 hours).
   - Block 4: Materials Science Glovebox Processing.
   - Block 5: Lunch & Earth Family Video Call.
   - Block 6: Station Routine Maintenance & Dust Filter Vacuuming.
   - Block 7: T2 Treadmill Aerobic Run with Bungee Harness.
   - Block 8: Dinner, Personal Time, and 8-Hour Protected Sleep.
3. **Emergencies / Anomalies:** Hour 7: Master Caution tone. Solar Array Wing 2 Beta Gimbal motor stalls. Generation drops from $12\text{ kW}$ to $7.8\text{ kW}$. Station enters orbital eclipse in 15 minutes. Player must rapidly rearrange afternoon schedule: pause high-draw glovebox furnaces, adjust array tilt manually via cupola remote drive, and route essential power to life support.
4. **Completion:** Shift conclusion. Review dosimeter console: identify radiation peak at 14:20 UTC corresponding to orbit track crossing the South Atlantic Anomaly. Confirm crew is secured in sleep bunks with cabin fans quieted and sleep eye-masks on.
5. **Debrief:** Displays Schedule Adherence Score, Astronaut Muscle/Bone Preservation Index ($100\%$), Scientific Data Yield, Energy Margin during Gimbal Anomaly, and awards *Orbital Station Engineer* badge.

### 5. Game Mechanics & Formulas
- **Crew Bone/Muscle Health Index:**
  $$H_{\text{musculoskeletal}}(t + 1) = H_0 + \alpha \cdot (t_{\text{exercise}} - 2.0\text{ h}) \quad (\text{if } t_{\text{exercise}} < 2.0\text{ h}, \, H \text{ drops by } 8\%\text{ per shift})$$
- **Cognitive Fatigue & Sleep Debt:**
  $$\text{Fatigue}(t + 1) = \text{Fatigue}(t) + \beta \cdot (8.0\text{ h} - t_{\text{sleep}}) - \gamma \cdot \text{RestorativeQuality}$$
  High fatigue ($> 40\%$) causes interactive cursor jitter and adds random hold-time delays to physical maintenance tasks.
- **Orbital Solar Generation with Gimbal Misalignment:**
  $$P_{\text{array}}(\theta_{\text{gimbal}}, t) = P_{\text{max}} \cdot \cos(\theta_{\text{gimbal}} - \theta_{\text{sun}}(t)) \cdot \sigma_{\text{sunlight}}(t)$$

### 6. Fun & Engagement
- **Authentic Astronaut Daily Life:** Kids love seeing the human side of spaceflight—how astronauts sleep strapped to wall bunks, eat floating tortillas, and work out with giant rubber bungees.
- **Satisfying Timeline Optimization:** Snapping schedule blocks together like puzzle pieces to create the perfect, harmonious astronaut day.
- **Replayability:** Managing different crisis days (e.g., sudden water recycler leak vs biomedical centrifuge vibration anomaly).

### 7. Technical Implementation
- **Datasets/APIs:** NASA RadLab API JSON export (`instrument_id: DOSTEL`); NASA HRP exercise/bone countermeasure datasets.
- **Integration:** Pure ES module in `missions/station-shift/`; Three.js orbital station interior with cupola Earth view, interactive timeline drag-and-drop HUD, and animated ARED exercise equipment.
- **Components:** `scenario.js`, `state.js`, `actions.js`, `scene.js`, `ui.js`, `radlab-telemetry.js`.

### 8. Learning Outcomes
- Player explains why astronauts must exercise vigorously every single day in microgravity.
- Player understands that time and human energy are finite, critical mission resources just like battery power or oxygen.
- Player grasps that radiation exposure in low Earth orbit varies depending on geographic position and geomagnetic shielding.

---

## 13. Survey Before You Land (`/survey-lunar`) [NEW]
*Autonomous Precursor Scouting, Landing Site Hazard Certification, and Downlink Prioritization*

### 1. Mission Identity
- **Title:** Survey Before You Land
- **Real-World Inspiration:** NASA Commercial Lunar Payload Services (CLPS) robotic precursor landers and rovers (Intuitive Machines Nova-C, Firefly Blue Ghost, Astrobotic Peregrine/Griffin); ISRO Chandrayaan-3 Pragyan rover site scouting; LRO LROC Narrow Angle Camera (NAC) micro-topography imaging; Artemis landing site certification.
- **Category:** Robotic Precursor Exploration / Autonomous Navigation / Telecommunications / Planetary Cartography.
- **Difficulty:** Intermediate (Cadet: 2 pre-filtered sites, automated slope contouring, forgiving bandwidth allocation; Explorer: 3 candidate landing zones, raw DTM elevation analysis, boulder counting density metrics, strict telemetry downlink budget).
- **Learning Objectives:**
  1. Understand why robotic precursor rovers must survey and certify landing zones before risking human crews in giant landers.
  2. Analyze high-resolution terrain elevation data to calculate slope angles, surface roughness, and boulder collision risks.
  3. Manage constrained deep-space telecommunication bandwidth by prioritizing which raw sensor datasets to compress and downlink to Earth.

### 2. Scientific Foundation
- **Concepts:** Precursor site reconnaissance, landing site safety criteria (slopes $< 10^\circ$, zero boulders $> 0.5\text{ m}$ in landing footprint), DTM spatial resolution, micro-relief, shadow fraction vs solar charging, high-gain vs low-gain antenna data rates, lossless vs lossy data compression.
- **Real Datasets & Research:**
  - *LROC Narrow Angle Camera (NAC) Stereo Digital Elevation Models*: 1-meter horizontal elevation grids of lunar south pole sites (e.g., Connecting Ridge, de Gerlache rim).
  - *NASA CLPS Payload Reports & Artemis III Site Selection Architecture*: 100m x 100m landing ellipse certification standards.
  - *ISRO Chandrayaan-3 Landing Telemetry*: Autonomous Hazard Detection and Avoidance System (LHDAS) operations.
- **Measurements:** Candidate Landing Zones: Site Alpha (de Gerlache Rim), Site Beta (Malapert Plateau), Site Gamma (Shackleton Connecting Ridge); max allowable landing slope: $\theta_{\text{max}} = 10.0^\circ$; rover downlink bandwidth: $250\text{ kbps}$ (total downlink budget: $15\text{ MB}$); rover battery: $3.2\text{ kWh}$.
- **Simplifications & Pedagogical Abstractions:** Real site certification takes months of human and machine analysis; game provides a streamlined 15-minute field reconnaissance session with authentic analytical tools.

### 3. Gameplay Design
- **Player Role:** Robotic Precursor Scout Rover Teleoperator at Houston Mission Control.
- **Objectives:**
  1. Teleoperate the autonomous CLPS precursor scout rover across candidate landing zones.
  2. Drive a perimeter survey around candidate landing sites Alpha and Beta.
  3. Deploy micro-lidar scanner and optical hazard cameras to map local slope gradients and boulder fields.
  4. Identify radio line-of-sight to Earth and calculate daily illumination continuity.
  5. Select which sensor products (high-res DTM, boulder distribution map, optical mosaic, or raw telemetry) to transmit within the tight 15 MB downlink budget.
  6. Deliver a formal Landing Site Safety Certification Report recommending the safest site for the upcoming crewed Artemis lunar lander.
- **Player Actions:** Remote waypoint driving, lidar sweep trigger, optical zoom pan/tilt, hazard box tagging (identifying rocks $> 0.5\text{ m}$), bandwidth file allocation toggles, certification stamp submission.
- **Decisions & Trade-offs:**
  - *Site Alpha vs Site Beta:*
    - *Site Alpha (Rim Crest):* Excellent continuous sunlight ($75\%$ illuminated) and direct Earth radio visibility. However, high-resolution lidar reveals steep local terrace gullies ($13^\circ$ slopes) that exceed lander tip-over thresholds.
    - *Site Beta (Plateau Basin):* Perfectly flat ($3^\circ$ slopes, zero tip-over hazard) and sparse boulders. However, it enters deep rim shadows for 48 hours every fortnight, requiring the crew lander to arrive with fully charged emergency batteries.
  - *Bandwidth Prioritization:* Total bandwidth is capped at 15 MB. The full raw 3D point cloud is 20 MB (won't fit). The player must choose between transmitting a compressed lidar slope map (6 MB) + optical mosaic (5 MB) + boulder log (2 MB), or sending only a low-res image and risking unverified hazards.
- **Challenges:** Driving into soft crater rim drifts slows the scout rover and drains battery; transmitting uncompressed raw images exhausts bandwidth before slope certification data is sent.
- **Environment Response:** Scout rover's lidar beams sweep across the lunar surface in glowing neon scan lines; real-time slope contour overlays color terrain green ($< 5^\circ$), yellow ($5–10^\circ$), and red ($> 10^\circ$, danger); radio downlink meter ticks upward as files stream back to Earth.

### 4. Mission Progression
1. **Preparation:** Review Artemis III precursor scouting objective. Download orbital recon overview. Rover deployed $200\text{ m}$ south of Candidate Site Alpha. Battery: $100\%$. Downlink window closes in $T-15\text{ minutes}$.
2. **Main Activities:** Teleoperate scout rover to Site Alpha boundary. Engage 360-degree lidar terrain scan. Review generated slope heatmap: northern quad shows dangerous red $14^\circ$ scarps. Tag 6 boulder hazards exceeding $0.6\text{ m}$ height. Mark Site Alpha: *Rejected - Slope Hazards Exceed Margin*.
3. **Emergencies / Anomalies:** Drive scout rover toward Site Beta ($400\text{ m}$ west). Rover passes through a sharp communications shadow behind a central spire. Autonav engages: rover halts and executes a safe 10-meter backtrack to re-establish DSN carrier lock.
4. **Completion:** Reach Site Beta. Execute lidar sweep: slopes are uniformly $2.8^\circ$ (brilliant green). Boulder density is minimal (zero obstacles $> 0.3\text{ m}$). Direct line-of-sight to Earth confirmed. Open Downlink Manager: select Compressed Slope DTM (6 MB), Boulder Heatmap (3 MB), and Optical Touchdown Mosaic (4 MB) = 13 MB / 15 MB. Hit Transmit. Submit certification report: *Site Beta Certified for Human Touchdown*.
5. **Debrief:** Displays site hazard analysis accuracy, bandwidth optimization efficiency, Artemis mission safety margin, and awards *Lunar Scout Surveyor* badge.

### 5. Game Mechanics & Formulas
- **Lander Touchdown Tip-over Risk:**
  $$\text{Risk}_{\text{tip-over}} = \max_{\text{footprint}}(\theta_{\text{slope}}) / 10.0^\circ + \sum_{\text{boulders}} \mathbb{I}(h > 0.5\text{ m}) \cdot 0.35$$
  If $\text{Risk} \ge 1.0$, site is lethal for crew landing.
- **Downlink File Budget Constraint:**
  $$\sum_{f \in \text{Selected}} \text{Size}(f) \le \text{Bandwidth}_{\text{budget}} \quad (15.0\text{ MB})$$
- **Rover Autonomous Backtrack Logic:**
  $$\text{SignalStrength} = f(\text{LOS}_{\text{Earth}}) \quad \text{If } \text{Signal} = 0\text{ for } > 5\text{ s}, \, \text{Execute AutoNav Reverse } 10\text{ m}$$

### 6. Fun & Engagement
- **High-Tech Scouting Feel:** Players feel like authentic NASA robotic specialists operating high-tech lidars, mapping lasers, and autonomous rovers.
- **Analytical Decision-Making:** Weighing visual images against mathematical slope data gives kids real confidence in evidence-based scientific reasoning.
- **Replayability:** Randomized micro-topography boulder fields and candidate sites ensure every survey requires careful fresh inspection.

### 7. Technical Implementation
- **Datasets/APIs:** LROC NAC digital elevation models; Chandrayaan-3 landing hazard algorithms.
- **Integration:** Pure ES module in `missions/survey-lunar/`; Three.js scene featuring neon lidar point-cloud shaders, terrain slope color ramps, and autonomous rover teleoperation HUD.
- **Components:** `scenario.js`, `state.js`, `actions.js`, `scene.js`, `ui.js`, `lidar-mapper.js`.

### 8. Learning Outcomes
- Player explains why robotic rovers must scout landing zones before human missions arrive.
- Player learns how to read and interpret topographic slope maps and hazard distributions.
- Player understands that telecommunications bandwidth across deep space is finite and requires careful data prioritization.

---

## 14. Oxygen on a Short Power Budget (`/moxie-oxygen`) [NEW]
*In-Situ Resource Utilization (ISRU), Atmospheric Electrolysis, and Energy-Constrained Production*

### 1. Mission Identity
- **Title:** Oxygen on a Short Power Budget
- **Real-World Inspiration:** NASA Mars 2020 MOXIE (Mars Oxygen In-Situ Resource Utilization Experiment) instrument on the Perseverance rover; solid oxide electrolysis cells (SOEC) splitting atmospheric $CO_2$ into $O_2$ and $CO$; diurnal Martian atmospheric pressure variations measured by MEDA (Mars Environmental Dynamics Analyzer); full-scale human outpost oxygen production architectures.
- **Category:** In-Situ Resource Utilization (ISRU) / Chemical Engineering / Energy Management / Advanced Logistics.
- **Difficulty:** Advanced (Cadet: guided 2-phase production schedule, simplified power sliders, forgiving 50 L buffer; Explorer: 3-phase diurnal planning, temperature pre-heating energy costs, cryogenic liquefaction vs tank storage, tight day/night power balancing).
- **Learning Objectives:**
  1. Understand the principles of In-Situ Resource Utilization (ISRU): manufacturing essential life-support consumables from local planetary resources.
  2. Master the severe energy cost of high-temperature chemical conversion (electrolysis) and how it competes with habitat heating and life support.
  3. Optimize production cycles to take advantage of diurnal atmospheric density fluctuations on Mars.

### 2. Scientific Foundation
- **Concepts:** Solid Oxide Electrolysis Cells (SOEC), endothermic chemical conversion ($2\text{CO}_2 \rightarrow 2\text{CO} + \text{O}_2$), high-temperature pre-heating ($800^\circ\text{C}$ operating temperature), diurnal atmospheric pressure oscillations (Martian thermal tides: $600\text{ to }900\text{ Pa}$), cryogenic compression vs gaseous storage tanks, specific energy consumption ($\text{kWh/kg O}_2$).
- **Real Datasets & Research:**
  - *NASA/JPL MOXIE Final Results (Sept 2023)*: Completed 16 successful runs on Mars, producing a total of $122\text{ grams of oxygen}$, achieving peak production rates of $12\text{ g/h}$ at $> 98\%$ purity.
  - *Mars 2020 MEDA Atmospheric Pressure Time Series*: Recorded diurnal pressure wave peaking during early morning cold hours when atmospheric gas density is highest.
  - *NASA Space Technology Mission Directorate (STMD) ISRU Architecture*: Scaled 2 to 3 kg/h oxygen production plant concepts for human Mars ascent vehicles (MAV).
- **Measurements:** Scaled habitat plant capacity: $1,200\text{ g/h O}_2$ ($1.2\text{ kg/h}$); plant power draw: $3.0\text{ kW}$ (operating) $+ 1.5\text{ kW}$ (pre-heat phase); habitat crew oxygen demand: $350\text{ g/h}$ ($8.4\text{ kg/sol}$ for 4 crew); solar array generation: $6.5\text{ kW}$ (noon peak) down to $0\text{ kW}$ (night); outpost battery capacity: $35\text{ kWh}$; gaseous oxygen storage buffer: $50\text{ kg}$.
- **Simplifications & Pedagogical Abstractions:** Real chemical plants require complex valve start-up purging sequences; game models this via intuitive warm-up, production, and shutdown phases with clear temperature and energy readouts.

### 3. Gameplay Design
- **Player Role:** Meridian Base In-Situ Resource Utilization (ISRU) Plant Superintendent.
- **Objectives:**
  1. Assess outpost oxygen reserves and forecast daily atmospheric pressure waves from MEDA weather telemetry.
  2. Schedule the operational run of the Solid Oxide Electrolysis Oxygen Plant across a 24.6-hour Martian sol.
  3. Pre-heat electrolysis catalyst tubes to $800^\circ\text{C}$ before initiating gas compression.
  4. Balance the massive $3.0\text{ kW}$ electrolysis power draw against declining late-afternoon solar array output and habitat life-support baselines.
  5. Decide whether to run production during the diurnal atmospheric pressure peak (midnight/early morning: maximum gas density, but requires running on expensive battery reserves) or during the solar insolation peak (noon: free solar power, but thinner air requires more compressor work).
  6. Fill outpost high-pressure oxygen storage tanks to $\ge 90\%$ capacity without tripping habitat emergency power breakers.
- **Player Actions:** Plant master power switch, pre-heat thermostat dial, compressor intake valve lever, diurnal production scheduler sliders, oxygen tank transfer manifold valve, emergency load shed toggle.
- **Decisions & Trade-offs:**
  - *Noon Run vs Dawn Run:*
    - *Noon Run (High Solar):* Solar panels generate $6.5\text{ kW}$, easily powering the $3.0\text{ kW}$ plant with zero battery drain. However, the midday Martian atmosphere is hot and thin ($650\text{ Pa}$), reducing oxygen yield per hour to only $850\text{ g/h}$.
    - *Early Morning Run (High Density):* Atmospheric thermal tides peak at $900\text{ Pa}$, maximizing density and boosting oxygen yield to $1,400\text{ g/h}$. However, with zero sunlight, the entire $4.5\text{ kW}$ preheat and production load draws directly from outpost batteries, leaving dangerously thin margins if morning clouds appear.
  - *Tank Draw vs Direct Production:* Drawing from stored oxygen tanks during low-power dust storms preserves battery life for heating, but depletes the strategic reserve required for the upcoming Mars Ascent Vehicle launch.
- **Challenges:** Running the plant below $750^\circ\text{C}$ causes carbon deposition (coking) that permanently ruins the catalyst tubes; running production without verifying tank head-space blows the overpressure burst disk.
- **Environment Response:** Electrolysis reactor glow transitions from dark red to brilliant orange as it hits $800^\circ\text{C}$; compressor sound hums with a deep mechanical thrum; digital flow meters display real-time grams of oxygen generated; storage tank pressure needle smoothly sweeps into the green zone.

### 4. Mission Progression
1. **Preparation:** Review life-support inventory: habitat oxygen reserve has dropped to $45\%$ following a heavy EVA week. Commander Reyes authorizes a full-scale ISRU production run. Outpost battery sits at $88\%$. Review MEDA atmospheric pressure graph: morning density peak predicted at Sol 34, 04:00 LMST ($880\text{ Pa}$).
2. **Main Activities:** Open ISRU Control Console. Set operational schedule:
   - Phase 1 (10:00 - 11:00 LMST): Pre-heat SOEC stack to $800^\circ\text{C}$ utilizing surplus midday solar power.
   - Phase 2 (11:00 - 15:30 LMST): Main Production Run. Open atmospheric intake; spin CO2 intake compressor. Monitor gas stream: $CO_2$ splits into $CO$ (vented harmlessly outside) and pure $O_2$ (routed to cryogenic compressor). Production rate: $1,150\text{ g/h}$.
3. **Emergencies / Anomalies:** 14:00 LMST: Thin cirrus dust cloud drifts overhead. Solar array generation unexpectedly plunges from $5.8\text{ kW}$ to $3.2\text{ kW}$. Total station draw is $4.6\text{ kW}$ ($3.0\text{ kW}$ ISRU $+ 1.6\text{ kW}$ habitat life support). Battery begins discharging rapidly at $-1.4\text{ kW}$.
   *The Decision:* Shut down ISRU immediately (losing the thermal preheat investment), or throttle electrolysis down to $50\%$ production ($1.6\text{ kW}$ draw) while shedding base non-essential lighting.
4. **Completion:** Player throttles plant to $50\%$, maintaining catalyst temperature above $780^\circ\text{C}$ while balancing battery drain to zero. At 16:00 LMST, solar day ends; plant executes controlled purge and shutdown. Check storage buffer: $+14.2\text{ kg}$ of pure breathing oxygen transferred to habitat tanks. Outpost battery remains at safe $68\%$.
5. **Debrief:** Displays total grams of oxygen manufactured, kilowatt-hours consumed per gram, catalyst thermal stability index ($100\%$), final outpost reserve margin, and awards *ISRU Chemical Engineer* badge.

### 5. Game Mechanics & Formulas
- **ISRU Oxygen Production Rate:**
  $$\dot{m}_{\text{O}_2}(t) = \dot{m}_{\text{max}} \cdot \left( \frac{P_{\text{atm}}(t)}{P_{\text{ref}}} \right) \cdot \eta_{\text{thermal}}(T) \cdot \left( \frac{P_{\text{elec}}}{P_{\text{nominal}}} \right)$$
  where $P_{\text{atm}}$ is MEDA atmospheric pressure ($600–900\text{ Pa}$), and $\eta_{\text{thermal}} = 1.0$ if $T \ge 800^\circ\text{C}$, dropping to $0$ if $T < 700^\circ\text{C}$.
- **Catalyst Carbon Deposition (Coking Penalty):**
  $$\text{CokingRisk} = \int \mathbb{I}(T < 750^\circ\text{C} \land \text{GasFlow} > 0) \, dt \quad (\text{ruins catalyst if } > 60\text{ s})$$
- **Total Station Energy Conservation Equation:**
  $$E_{\text{batt}}(t + \Delta t) = E_{\text{batt}}(t) + \left[ P_{\text{solar}}(t) - \left( P_{\text{ISRU}}(\text{state}) + P_{\text{hab\_base}} \right) \right] \cdot \Delta t$$

### 6. Fun & Engagement
- **The Magic of Making Air:** Deep wonder in taking the poisonous, unbreathable Martian air and transforming it into sweet, life-giving oxygen.
- **High-Temperature Tension:** Balancing glowing $800^\circ\text{C}$ chemical reactors against scarce electrical watts creates exciting industrial gameplay.
- **Replayability:** Mastering the high-efficiency night/morning run utilizing advanced battery management; setting production speed records.

### 7. Technical Implementation
- **Datasets/APIs:** NASA Mars 2020 MOXIE engineering datasets; Mars 2020 MEDA atmospheric pressure time series.
- **Integration:** Pure ES module in `missions/moxie-oxygen/`; Three.js chemical plant interior scene featuring glowing ceramic electrolysis tubes, analog pressure gauges, and dynamic gas flow particle streams.
- **Components:** `scenario.js`, `state.js`, `actions.js`, `scene.js`, `ui.js`, `isru-thermodynamics.js`.

### 8. Learning Outcomes
- Player explains how In-Situ Resource Utilization (ISRU) enables sustainable human exploration by avoiding the impossible burden of hauling all supplies from Earth.
- Player grasps that converting planetary chemical compounds into usable oxygen demands enormous electrical power.
- Player understands how planetary weather (atmospheric pressure cycles) directly impacts industrial engineering production.

---

## Mission Evaluation & Redesign Matrix

| # | Mission Route & Title | Proposed Redesign Action | Primary Rationale & Architectural Enhancement |
|---|---|---|---|
| 01 | `/orbit` · Arrival at Mars | **Improve & Connect** | Replace synthetic radio bug with authentic de-energized bus isolation checklist; link landing site selection directly to HiRISE slope/hazard maps and pass touchdown status into surface carry. |
| 02 | `/storm` · Before the Storm | **Improve & Connect** | Refactor legacy `demo.js` into modern shared runtime; tie panel decay directly to normalized Opportunity 2018 sol-by-sol optical depth tau curves; pass preparation score to carry state. |
| 03 | `/rover` · Tracks in the Dust | **Improve & Expand** | Refactor `mission2.js` to shared architecture; integrate HiRISE elevation DTM slope and traction heatmaps; add explicit return energy reserve calculations and factual rock observation cards. |
| 04 | `/solar-shelter` · A Place to Hide | **Improve & Connect** | Upgrade plan buttons to alter real inventory/layout constraints; distinguish near-Earth DONKI space weather alert from Curiosity RAD surface dosage; pass shelter integrity to base health. |
| 05 | `/greenhouse` · The Greenhouse Promise | **Improve & Connect** | Make plan selections enforce distinct photoperiods and water caps; streamline 5-step leak repair with visible progress cues for younger players; connect fresh food mass to crew morale in Base Boss. |
| 06 | `/earth-delay` · Message to Earth | **Improve & Expand** | Harmonize in-game dialogue timestamps with JPL Horizons ephemeris light-time data; add targeted diagnostic query composition; link conserved water to outpost initial state. |
| 07 | `/lunar-sunlight` · Chasing the Sun | **Improve & Connect** | Replace single-click 18-day ending with multi-phase interactive solar tracking inspection; unify "Press E" controls; expose authentic LOLA polar illumination rasters in site selection UI. |
| 08 | `/lunar-dust` · Dust Busters | **Improve & Connect** | Differentiate tool selection so plans enforce real mechanics; add optical polycarbonate scratch penalties when brushes are used on visors; connect airlock filter clogging to base life support. |
| 09 | `/lunar-relay` · Over the Hill | **Improve & Connect** | Import authentic LOLA ridge topography; add interactive radio line-of-sight raycasting tool; connect harvested lunar core sample records to scientific campaign archive. |
| 10 | `/base-boss` · Be the Base Boss | **Expand & Connect** | Connect regional map directly to Verdant drill; reconcile legacy battery reserve inconsistencies; implement strictly conserved clean/gray/shield water loop; link 3 crisis decisions to outcome states. |
| 11 | `/campaign` · Thirty Sols | **Improve & Expand** | Standardize resource terminology with core curriculum; introduce Cadet Mode with 3 macro-pools; implement deterministic seeded replays with retrospective root-cause decision tree analytics. |
| 12 | `/station-shift` · Station Shift | **NEW (Introductory)** | Introduces orbital mechanics, microgravity physiological deconditioning (mandatory exercise), ECLSS life-support scheduling, and real RadLab dosimeter telemetry tracking. |
| 13 | `/survey-lunar` · Survey Before You Land | **NEW (Intermediate)** | Introduces robotic precursor reconnaissance, micro-topography lidar slope certification ($< 10^\circ$), landing hazard avoidance, and deep-space bandwidth downlink prioritization. |
| 14 | `/moxie-oxygen` · Oxygen on a Short Power Budget | **NEW (Advanced)** | Introduces In-Situ Resource Utilization (ISRU), solid oxide electrolysis ($CO_2 \rightarrow O_2$), high-temperature power trade-offs, and diurnal Martian atmospheric density optimization. |

---
*End of Deliverable D: Mission Redesign Blueprint*
