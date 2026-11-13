# Deliverable B: Space Mission Research & Real-World Dataset Alignment
**Junior Astronaut Mission Trainer — Planetary & Deep Space Exploration Database**  
*Compiled: November 2026*  
*Researcher: Space Missions Specialist (@missions)*  
*Target Output: `/home/asim/.gemini/antigravity-cli/brain/863cfb48-0639-43da-8b13-6d8ffe140b14/B-space-mission-research.md`*

---

## Executive Summary & Database Scope

This deliverable provides an authoritative, rigorously verified research database of real-world space missions across NASA, ESA, JAXA, ISRO, CNSA, CSA, and commercial aerospace leaders as of **November 2026**. Designed specifically to anchor the gameplay mechanics, educational scaffolding, and scientific credibility of the **Junior Astronaut Mission Trainer**, this compendium bridges actual flight telemetry, hardware designs, operational procedures, and space hazards directly into experiential learning challenges for young astronauts (Cadet: ages 7–9; Explorer: ages 10–12+).

Every mission profile in this document conforms to strict verification standards using primary space agency documentation (NASA, ESA, JAXA, ISRO, CNSA) and peer-reviewed mission archives. Crucially, missions are explicitly categorized into five standardized readiness states:
1. **Completed Missions**: Successfully concluded or retired operations with complete legacy datasets available.
2. **Currently Operational**: Actively flying, in-orbit, or surface-operating assets downlinking active telemetry and science.
3. **Under Development / In Assembly & Testing**: Hardware built or undergoing active qualification/integration with confirmed flight contracts.
4. **Officially Approved Future Missions**: Formally greenlit and funded by governing space agency budgets with baseline architectures established.
5. **Proposed Concepts & Strategic Studies**: Conceptual architectures and pathfinders undergoing feasibility assessment without finalized launch baselines.

---

## Table of Contents
1. [Master Mission Classification Index](#1-master-mission-classification-index)
2. [Section 1: Human Spaceflight & Orbital Habitats](#section-1-human-spaceflight--orbital-habitats)
   - 1.1 International Space Station (ISS) & Transition Strategy
   - 1.2 Artemis Program (Artemis I through Artemis V)
   - 1.3 Lunar Gateway Program (2026 Strategic Realignment)
   - 1.4 Moon Base Architecture & Commercial Lunar Payload Services (CLPS)
   - 1.5 Commercial Low Earth Orbit Destinations (CLD) & Space Stations
   - 1.6 CHAPEA (Crew Health and Performance Exploration Analog)
   - 1.7 Advanced Long-Duration Human Flight & Life Support Concepts
3. [Section 2: Mars Exploration Missions](#section-2-mars-exploration-missions)
   - 2.1 Mars Science Laboratory (*Curiosity* Rover) & RAD
   - 2.2 Mars 2020 (*Perseverance* Rover) & Jezero Science
   - 2.3 *Ingenuity* Mars Helicopter Legacy & Future Aerial Scouting
   - 2.4 Mars Sample Return (MSR) & Perseverance Sample Retrieval Architecture (PSRA)
   - 2.5 ESCAPADE (Escape and Plasma Acceleration and Dynamics Explorers)
   - 2.6 ExoMars *Rosalind Franklin* Rover
   - 2.7 Future Human Mars Concepts & Flight Architectures
4. [Section 3: Solar System Exploration & Planetary Defense](#section-3-solar-system-exploration--planetary-defense)
   - 3.1 Martian Moons eXploration (MMX & *Idefix* Rover)
   - 3.2 Chandrayaan-3 & Chandrayaan-4 Lunar Sample Return
   - 3.3 Planetary Defense: DART & *Hera* Asteroid Rendezvous
   - 3.4 OSIRIS-REx & OSIRIS-APEX (Apophis 2029 Intercept)
   - 3.5 NEO Surveyor (Infrared Planetary Defense)
   - 3.6 James Webb Space Telescope (JWST)
   - 3.7 Europa Clipper (Outer Planet Habitability)
   - 3.8 Dragonfly (Titan Rotorcraft Lander)
5. [Section 4: International Space Agencies & Emerging Programs](#section-4-international-space-agencies--emerging-programs)
   - 4.1 China National Space Administration (CNSA: Tiangong, Chang'e 6/7/8, Tianwen-2/3)
   - 4.2 Indian Space Research Organisation (ISRO: Gaganyaan Crewed Flight, Shukrayaan)
   - 4.3 European Space Agency (ESA: Juice, EnVision, Argonaut Lander)
   - 4.4 Canadian Space Agency (CSA: Artemis II Jeremy Hansen, Canadarm3, Deep Space Food)
6. [Section 5: Commercial Spaceflight Systems & Architectures](#section-5-commercial-spaceflight-systems--architectures)
   - 5.1 SpaceX Starship / Super Heavy & Artemis HLS
   - 5.2 Blue Origin New Glenn, Blue Moon HLS & Blue Ring
7. [Section 6: Comprehensive 10-Field Mission Reference Profiles](#section-6-comprehensive-10-field-mission-reference-profiles)
8. [Section 7: Gameplay Applicability & Junior Astronaut Mechanics Mapping](#section-7-gameplay-applicability--junior-astronaut-mechanics-mapping)
9. [Primary Source Documentation & Citations](#primary-source-documentation--citations)

---

## 1. Master Mission Classification Index

| Mission Name | Primary Organization | Classification Status (Nov 2026) | Target Destination / Regime | Key Hardware / Asset |
| :--- | :--- | :--- | :--- | :--- |
| **ISS** | NASA / ESA / JAXA / CSA / Roscosmos | **Currently Operational** (Transition planned ~2030) | Low Earth Orbit (~415 km) | Modular Orbital Laboratory, iROSA, USDV |
| **Artemis I** | NASA / International | **Completed** (Dec 2022) | Distant Retrograde Lunar Orbit | SLS Block 1, Orion (Uncrewed) |
| **Artemis II** | NASA / CSA | **Completed** (April 2026) | Lunar Free-Return Trajectory | SLS Block 1, Orion Crewed (Wiseman, Glover, Koch, Hansen) |
| **Artemis III** | NASA / Commercial Partners | **Under Development** (Target: Late 2027) | Low Earth Orbit (LEO Demo) | SLS Block 1, Orion, Starship HLS / Blue Moon test articles |
| **Artemis IV** | NASA / ESA / Commercial Partners | **Under Development** (Target: Early 2028) | Lunar South Pole Surface | SLS Block 1B, Orion, Blue Moon MK2 / Starship HLS |
| **Artemis V** | NASA / JAXA / ESA | **Officially Approved** (Target: Late 2028) | Lunar South Pole Surface | SLS Block 1B, Orion, Commercial HLS, Lunar Terrain Vehicle |
| **Lunar Gateway** | NASA / ESA / JAXA / CSA / MBRSC | **Strategic Pause / Architecture Revision** | Near-Rectilinear Halo Orbit (NRHO) | PPE bus, HALO module (Repurposed for surface-first support) |
| **Blue Ghost M1** | Firefly Aerospace / NASA CLPS | **Completed** (Landed March 2, 2025) | Mare Crisium (Lunar Surface) | Blue Ghost Lander (10 NASA instruments) |
| **Blue Ghost M2** | Firefly Aerospace / NASA CLPS | **Under Development** (Target: 2027) | Lunar Far Side | Blue Ghost Lander, Elytra Dark, LuSEE-Night |
| **IM-1 (Odysseus)** | Intuitive Machines / NASA CLPS | **Completed** (Feb 2024) | Lunar South Pole (Malapert A) | Nova-C Lander |
| **IM-2 (Athena)** | Intuitive Machines / NASA CLPS | **Completed** (Landed early 2025) | Lunar South Pole (Shackleton) | Nova-C Lander, PRIME-1 Ice Drill, Micro-Nova hopper |
| **IM-3** | Intuitive Machines / NASA CLPS | **Under Development** (Target: 2027) | Reiner Gamma (Lunar Swirl) | Nova-C Lander, Lunar Vertex magnetic rover |
| **VIPER Rover** | NASA / Blue Origin | **Under Development / Reassigned** (Target: 2027) | Lunar South Pole (Mons Mouton) | VIPER Rover, Blue Moon MK-1 Commercial Lander |
| **Griffin-1** | Astrobotic / NASA CLPS | **Under Development** (Target: Jan 2027) | Lunar South Pole | Griffin Heavy Lander, Mass Simulator & Tech Payloads |
| **Axiom Station** | Axiom Space / NASA CLD | **Under Development** (Modules late 2020s) | Low Earth Orbit (Attaches to ISS) | AxH1 Habitation Module, AxPLM Logistics Module |
| **Starlab** | Voyager Space / Airbus / ESA | **Under Development** (Single Starship launch) | Low Earth Orbit | Stainless Steel Habitation/Lab Module, Solar Array |
| **Haven-1** | Vast Space / SpaceX | **Under Development** (Target: 2026/2027) | Low Earth Orbit | Single-Module Commercial Station, Artificial Gravity spin test |
| **Orbital Reef** | Blue Origin / Sierra Space | **Proposed Concept / Strategic Pivot** | Low Earth Orbit | LIFE Inflatable Habitat, Dream Chaser cargo |
| **CHAPEA M2** | NASA Johnson Space Center | **Completed** (Concluded Oct 31, 2026) | Terrestrial Mars Analog (Houston) | Mars Dune Alpha (1,700 sq ft 3D-printed habitat) |
| **Curiosity (MSL)**| NASA JPL | **Currently Operational** (14+ years) | Mars (Gale Crater / Mount Sharp) | MMRTG Rover, RAD, ChemCam, SAM, APXS |
| **Perseverance**| NASA JPL | **Currently Operational** (5+ years, >42 km) | Mars (Jezero Crater / Margin Unit) | Nuclear Rover, SuperCam, PIXL, SHERLOC, Sample Caching |
| **Ingenuity** | NASA JPL | **Completed** (Retired Jan 2024, 72 flights) | Mars (Jezero Crater) | Solar Rotorcraft, Autonomous Martian Flight Avionics |
| **MSR / PSRA** | NASA / JPL / ESA | **Strategic Formulation / Study** | Mars Jezero Return to Earth | PSRA Low-Cost Architecture Studies (Target: ~2031-2035) |
| **ESCAPADE** | NASA / UC Berkeley / Rocket Lab | **Currently Operational / In Flight** | En route to Mars (Arrival: Sep 2027) | Twin Probes ("Blue" & "Gold"), EM-1/2 Magnetometers |
| **Rosalind Franklin**| ESA / NASA ROSA | **Under Development** (Launch: Late 2028) | Mars (Oxia Planum, Arrival: Nov 2030)| European Rover, 2m Subsurface Drill, MOMA Spectrometer |
| **MMX & Idefix** | JAXA / CNES / DLR / NASA | **Currently Operational / In Flight** (Launched Oct 2026) | Mars / Phobos (Arrival: Aug 2027) | H3-launched Orbiter, Return Capsule, *Idefix* 4-legged rover |
| **Chandrayaan-3** | ISRO | **Completed** (August 2023) | Lunar South Pole (Shiv Shakti Point)| Vikram Lander, Pragyan Rover, ChaSTE, ILSA |
| **Chandrayaan-4** | ISRO | **Officially Approved** (Launch: 2027-2028) | Lunar South Pole (84°–86° S) | 5 Modules across 2 LVM3 launches (DM, AM, TM, RM, PM) |
| **DART** | NASA / Johns Hopkins APL | **Completed** (Impacted Sep 26, 2022) | Dimorphos (Didymos binary system) | Kinetic Impactor, DRACO high-res camera, LICIACube |
| **Hera** | ESA | **Currently Operational** (Arrived Nov 2026)| Didymos & Dimorphos Asteroids | Hera Orbiter, Asteroid Framing Camera, *Milani* & *Juventas* CubeSats |
| **OSIRIS-APEX** | NASA / Univ. of Arizona | **Currently Operational** (Cruise phase) | Asteroid 99942 Apophis (April 2029) | Spacecraft Bus, PolyCam, MapCam, OTES, Gas Thrusters |
| **NEO Surveyor** | NASA JPL | **Under Development** (Launch: Sep 2027) | Sun-Earth L1 Lagrange Point | 50cm Infrared Space Telescope, Passive Cryocooler |
| **JWST** | NASA / ESA / CSA / STScI | **Currently Operational** (Operational since 2022)| Sun-Earth L2 Lagrange Point | 6.5m Beryllium Mirror, Sunshield, NIRCam, NIRSpec, MIRI |
| **Europa Clipper**| NASA JPL / Johns Hopkins APL | **Currently Operational** (Earth Flyby Dec 2026)| Jupiter System (Arrival: April 2030) | Solar Outer-Planet Orbiter, REASON Radar, MASPEX, PIMS |
| **Dragonfly** | NASA / Johns Hopkins APL | **Under Development** (Launch: July 2028) | Saturn Moon Titan (Arrival: 2034) | Dual-Quadcopter Rotorcraft, DraMS mass spectrometer, DraGMet |
| **Tiangong (TSS)**| CNSA | **Currently Operational** (Continuous Crew) | Low Earth Orbit (~390 km) | Tianhe Core Module, Wentian & Mengtian Science Labs |
| **Chang'e 6** | CNSA | **Completed** (June 2024) | Lunar Far Side (South Pole-Aitken) | Far-side Lander, Ascender, Orbiter, Return Capsule (1,935g) |
| **Chang'e 7** | CNSA | **Under Development** (Rescheduled: 2027) | Lunar South Pole (Shackleton crater)| Orbiter, Lander, Roving Robot, Mini-Flying Hopper Probe |
| **Chang'e 8** | CNSA | **Under Development** (Target: ~2029) | Lunar South Pole | Lander, Rover, Regolith 3D-Printing Robot (ILRS prototype) |
| **Tianwen-2** | CNSA | **Currently Operational** (Rendezvous mid-2026)| Asteroid Kamoʻoalewa / Comet 311P | Asteroid Sample Return Craft (Touch-and-go sampling) |
| **Tianwen-3** | CNSA | **Under Development** (Target: Late 2028) | Mars Surface Sample Return (2031) | Dual Long March 5 Stacks, Mars Lander, Drill, Ascender, Orbiter |
| **Gaganyaan** | ISRO | **Under Development** (G1 uncrewed Q4 2026) | Low Earth Orbit (~400 km) | HLVM3, Crew Module, Service Module, *Vyommitra* Humanoid |
| **Juice** | ESA | **Currently Operational** (Cruise phase) | Jupiter System / Ganymede (2031) | 85 m² Solar Arrays, RIME Radar, JANUS Camera, PEP |
| **Starship HLS** | SpaceX / NASA | **Under Development** (Flight 15+ in 2026) | LEO Depot to Lunar Surface | Raptor 3 Methalox Engines, Vacuum Thrust, Cryogenic Transfer |
| **Blue Moon HLS** | Blue Origin / NASA | **Under Development** (MK-1: 2027; MK-2: 2028)| Low Lunar Orbit to Surface | BE-7 Hydrolox Deep-Throttling Engines, BT-7 Thrusters |

---

## Section 1: Human Spaceflight & Orbital Habitats

### 1.1 International Space Station (ISS) & Transition Strategy
* **Operational Status (November 2026):** Fully operational in Low Earth Orbit (LEO, inclination 51.6°, altitude ~415 km). Celebrating over 26 years of continuous human habitation since November 2000. Crew rotations are maintained via SpaceX Crew Dragon and Russian Soyuz-MS spacecraft.
* **International Commitments:** NASA, ESA, JAXA, and CSA are legally and operationally committed through **2030**. Roscosmos has aligned support through 2028 with technical discussions permitting operations through 2030 to synchronize with the transition to commercial platforms.
* **End-of-Life & Controlled Deorbit Plan:** NASA officially contracted SpaceX (up to $843 million) to engineer and construct the **United States Deorbit Vehicle (USDV)**. The USDV will be a heavily modified Dragon-derived propulsion tug equipped with enlarged propellant tanks and powerful engines capable of executing high-thrust retro-burns to deorbit the ~430,000 kg complex safely. 
* **Target Disposal Zone:** South Pacific Ocean Uninhabited Area (SPOUA), centered on Point Nemo. Final disposal is slated for **early 2031**, following an agency review checkpoint scheduled for **2027** that will evaluate commercial station readiness.
* **Key Science & Environmental Control Systems:**
  - *ECLSS (Environmental Control and Life Support System):* Recovers >98% of onboard crew water through urine processing and moisture condensation; uses the Sabatier reactor and Oxygen Generation System (OGS) to recycle water into breathable oxygen.
  - *Power Grid:* Upgraded with ISS Roll-Out Solar Arrays (iROSA) delivering over 215 kW to support heavy microgravity research.

### 1.2 Artemis Program (Artemis I through Artemis V)
NASA’s Artemis architecture underwent substantial strategic restructuring through 2025–2026 to optimize flight safety, de-risk complex commercial lunar lander rendezvous, and manage federal appropriations constraints.

```
Artemis Architecture Evolution (2022–2028)
========================================================================================
[Artemis I]   Nov-Dec 2022 : Uncrewed SLS Block 1 / Orion Distant Retrograde Orbit (PASS)
[Artemis II]  April 2026   : Crewed Lunar Flyby (Wiseman, Glover, Koch, Hansen) (PASS)
[Artemis III] Late 2027    : Restructured LEO Rendezvous & Commercial HLS Demo (IN PREP)
[Artemis IV]  Early 2028   : First Crewed Lunar South Pole Landing (MK2 / Starship)
[Artemis V]   Late 2028    : Sustainable South Pole Landing & Rover Exploration
========================================================================================
```

* **Artemis I (Completed Dec 11, 2022):** Validated the SLS Block 1 heavy lifter (8.8 million lbs thrust) and the uncrewed Orion spacecraft during a 25.5-day flight traveling 1.4 million miles, including a Distant Retrograde Orbit (DRO) around the Moon and a high-speed skip reentry into the Pacific Ocean.
* **Artemis II (Completed April 11, 2026):** NASA's first crewed deep-space mission in over 50 years. Launched on April 1, 2026, carrying Commander Reid Wiseman (NASA), Pilot Victor Glover (NASA), Mission Specialist Christina Koch (NASA), and Mission Specialist Jeremy Hansen (CSA). The crew flew a 10-day lunar free-return trajectory, reaching a maximum distance of 400,171 km from Earth, testing Orion’s manual handling, life support scrubbers, and high-bandwidth optical communications before a safe Pacific splashdown.
* **Artemis III (Restructured / In Development, Target: Late 2027):** 
  - *Strategic Revision:* In early 2026, NASA restructured Artemis III from a direct lunar surface landing into a **crewed Low Earth Orbit (LEO) docking and systems integration demonstration**. 
  - *Assigned Prime Crew:* Randy Bresnik (Commander), Frank Rubio, Andre Douglas, and Luca Parmitano (ESA).
  - *Mission Profile:* Orion will launch via SLS Block 1 to rendezvous, dock, and perform integrated multi-week systems evaluations with uncrewed test articles of both commercial Human Landing Systems: the SpaceX Starship HLS and the Blue Origin Blue Moon test article. This minimizes risk prior to lunar landing descents.
* **Artemis IV (In Development, Target: Early 2028):** Designated as the **first crewed lunar surface landing** under the revised architecture. Four astronauts will launch on an SLS Block 1B (featuring the Exploration Upper Stage / EUS) and transfer in lunar vicinity to the human landing system (Starship HLS or Blue Moon MK2) for a 6-day surface stay at the Lunar South Pole.
* **Artemis V (Approved, Target: Late 2028):** Follow-on crewed landing mission establishing a continuous cadence of one lunar flight per year, deploying the unpressurized Lunar Terrain Vehicle (LTV) and testing long-duration surface power systems.

### 1.3 Lunar Gateway Program (2026 Strategic Realignment)
* **Status as of November 2026:** **Operationally Paused & Structurally Revised.**
* **The March 24, 2026 Policy Pivot:** NASA leadership formally announced that the Gateway orbital space station in Near-Rectilinear Halo Orbit (NRHO) is "paused in its current form." The agency adopted a **"surface-first" lunar strategy**, redirecting near-term capital directly toward permanent lunar surface habitats, power grids, and CLPS logistics.
* **Component Repurposing:**
  - *Power and Propulsion Element (PPE):* The high-power 60 kW solar electric propulsion bus built by Maxar is being repurposed as a deep-space autonomous logistics tug.
  - *Habitation and Logistics Outpost (HALO):* Built by Northrop Grumman and Thales Alenia Space, HALO’s completed pressure vessel has been transferred to ground integration to evaluate adaptation as a surface habitat prototype or cis-lunar transfer stage.
  - *International Hardware Adaptation:* ESA (*I-Hab*, *ESPRIT*), JAXA (environmental life support), and CSA (*Canadarm3*) are working with NASA to transition robotics and modular architectures to lunar surface applications and logistics landers.

### 1.4 Moon Base Architecture & CLPS Program
NASA’s Commercial Lunar Payload Services (CLPS) initiative provides the robotic precursor foundation for the Artemis Base Camp at the Lunar South Pole:
* **Blue Ghost Mission 1 (Firefly Aerospace — Completed March 2, 2025):** 
  - *Landing Site:* Mare Crisium (18.56° N, 61.81° E).
  - *Operational Success:* Successfully executed a soft landing on March 2, 2025. Operated for a full 14-day lunar daylight period and gathered valuable engineering data through sunset, delivering 10 NASA science and technology payloads including regolith thermal probes, radiation detectors, and GPS receivers.
* **Blue Ghost Mission 2 / CS-3 (In Development, Target: 2027):** Awarded to Firefly Aerospace to deliver payloads to the **lunar far side** using the Elytra Dark orbital transfer stage. It will land the **LuSEE-Night** (Lunar Surface Electromagnetic Explorer Night) experiment, a low-frequency radio telescope shielded from Earth radio frequency interference.
* **Intuitive Machines Missions:**
  - *IM-1 (Odysseus — Feb 2024):* Soft-landed at Malapert A near the south pole; tipped on its side but delivered telemetry and radio-astronomy data.
  - *IM-2 (Athena — Early 2025):* Touched down near Shackleton crater carrying the PRIME-1 drill to sample water ice down to 1 meter depth.
  - *IM-3 (Target: 2027):* Bound for Reiner Gamma to study magnetic anomalies and dust levitation with the Lunar Vertex rover.
* **NASA VIPER Rover Resurrected via Blue Origin MK-1:** Following VIPER's cancellation in July 2024 due to budget overruns, NASA restructured the program in 2025–2026. The fully assembled 430 kg rover will be delivered to the lunar south pole (Mons Mouton) aboard Blue Origin's **Blue Moon Mark 1 (MK-1)** cargo lander.
* **CLPS 2 Procurement (November 2026):** NASA awarded the $10 billion, 10-year CLPS 2 IDIQ contract, onboarding vendors (including Firefly, Intuitive Machines, and Blue Origin) to transport multi-ton infrastructure loads, nuclear power systems, and heavy rovers to the lunar surface.

### 1.5 Commercial Low Earth Orbit Destinations (CLD) & Space Stations
To prevent an orbital gap following the retirement of the ISS in 2030–2031, NASA’s CLD initiative is funding commercial station development:
* **NASA CLD RFP Release (October 9, 2026):** NASA published the final Phase 2 RFP for Commercial LEO Destinations, with formal industry proposals due **December 8, 2026**, and binding multi-billion-dollar development awards scheduled for **Spring 2027**.
* **Key Commercial Contenders:**
  - *Vast Space (Haven-1):* A 100-meter-class single-module free-flying commercial station launching on a Falcon 9 in late 2026 / early 2027. Includes internal centrifuge capabilities to conduct artificial gravity microgravity-to-lunar-gravity biology trials.
  - *Axiom Space (Axiom Station):* Modular design that attaches initially to the ISS Forward Port (AxH1 Habitation Module targeted for the late 2020s) before detaching upon ISS decommissioning to operate as an independent station.
  - *Starlab Space (Voyager Space & Airbus):* Large-diameter (8m+) stainless steel monolithic habitat designed for a single launch aboard SpaceX Starship, incorporating an ESA science laboratory.
  - *Orbital Reef (Blue Origin & Sierra Space):* Mixed-use space business park utilizing Sierra Space's expandable LIFE inflatable modules. (Blue Origin has partially shifted core resources toward lunar surface and HLS contracts).

### 1.6 CHAPEA (Crew Health and Performance Exploration Analog)
* **CHAPEA Mission 2 (Completed October 31, 2026):**
  - *Setting:* **Mars Dune Alpha**, a 1,700-square-foot 3D-printed habitat situated at NASA’s Johnson Space Center in Houston, Texas.
  - *Duration:* **378 days** (Ingress: October 19, 2025; Egress: October 31, 2026).
  - *Crew:* Ross Elder (Commander), Ellen Ellis, James Spicer, Matthew Montgomery (Science Officer).
  - *Operational Stresses Tested:* Absolute environmental isolation; continuous **communication latency of 13 to 22 minutes each way**; a planned **two-week total communications blackout** simulating solar conjunction; strict resource quotas for water, food, and power; hydroponic crop cultivation (tomatoes, peppers, leafy greens); and simulated virtual-reality "Marswalks" on a regolith simulant test yard.
  - *Follow-on Program:* NASA is merging long-duration terrestrial analogs into the **Moon and Mars Exploration Analog (MMEA)** slated for late 2027.

### 1.7 Advanced Long-Duration Human Flight & Life Support Concepts
* **Nuclear Thermal Propulsion (DRACO Project):** DARPA and NASA’s Demonstration Rocket for Agile Cislunar Operations, developing a high-assay low-enriched uranium (HALEU) nuclear thermal reactor delivering specific impulse ($I_{sp} \sim 900\text{ s}$), cutting human transit times to Mars by 50%.
* **Closed-Loop ECLSS Milestones:** Demonstrated 98.4% water recovery on ISS; development of catalytic CO₂ reduction systems (Bosch and advanced Sabatier cycles) targeting 100% closed-loop oxygen and carbon loops.
* **Radiation Mitigation Architecture:** Solar Energetic Particle (SEP) storm shelters utilizing onboard potable water tanks as hydrogen-rich perimeter shielding, supplemented by dynamic high-density polyethylene (HDPE) panels.

---

## Section 2: Mars Exploration Missions

```
Chronological Status of Mars Robotic & Crewed Explorers (Nov 2026)
========================================================================================
[Curiosity Rover]       Operational since 2012 : Mt. Sharp elevation gain >1 km; RAD monitoring
[Perseverance Rover]    Operational since 2021 : >42.2 km driven; 30+ cached core samples
[Ingenuity Helicopter]  Completed Jan 2024     : 72 flights; tech pathfinder for Mars aerial scouts
[ESCAPADE Blue & Gold]  In Flight (Nov 2026)   : Earth flybys complete; Mars arrival Sep 2027
[Rosalind Franklin]     Under Development      : Launch late 2028; 2m subsurface drill
[Tianwen-3 (China)]     Under Development      : Launch 2028; Mars sample return ~2031
[PSRA (NASA MSR Study)] Strategic Formulation  : Low-cost sample return architecture review
========================================================================================
```

### 2.1 Mars Science Laboratory (*Curiosity* Rover) & RAD
* **Operational Status (November 2026):** Active for over **14 years (5,060+ Sols)** in Gale Crater. Operating nominally powered by its Multi-Mission Radioisotope Thermoelectric Generator (MMRTG). Recently achieved over **1,000 meters of cumulative vertical elevation climbing** up Mount Sharp (Aeolis Mons), conducting drill campaigns at sulfate-bearing units (e.g., the "Nazca" drill site).
* **Radiation Assessment Detector (RAD) Instrument:**
  - *Function:* Continuously records the high-energy ionizing radiation environment on the Martian surface (Galactic Cosmic Rays [GCRs] and Solar Energetic Particles [SEPs]).
  - *Dosimetry Findings:* Average surface dose rate of ~0.64 mGy/day; SEP storm events can spike dose rates by orders of magnitude.
  - *Terrain Shielding Science:* Curiosity's ascent through deep canyon walls and yardang formations provided empirical validation that Martian topographical features (cliffs, crater rims, valleys) offer up to **30–40% passive radiation shielding**, a key principle for future human base siting.

### 2.2 Mars 2020 (*Perseverance* Rover) & Jezero Science
* **Operational Status (November 2026):** Active for over **5.7 years (2,030+ Sols)** in Jezero Crater. Officially surpassed a **marathon distance (>42.2 km / 26.2 miles)** of driving across rugged deltaic and crater-margin terrain.
* **Key Science Breakthroughs:** 
  - Investigated the "Margin Unit" along the inner rim of Jezero Crater, uncovering evidence of three distinct hydrological eras (ancient lacustrine, deep groundwater circulation, and high-temperature hydrothermal alteration).
  - Detected preserved organic carbon and aromatic macromolecules within the Bright Angel formation.
* **Sample Caching:** Successfully acquired, hermetically sealed, and cataloged 30+ rock cores, regolith samples, and atmospheric witness blanks inside titanium sample tubes. Duplicate caches have been distributed between the Jezero delta floor and the rover's internal storage carousel.

### 2.3 *Ingenuity* Mars Helicopter Legacy & Future Aerial Scouting
* **Mission Status (Completed):** Concluded operations on Sol 1042 (January 2024) following damage to its rotor blade tips during its 72nd flight.
* **Legacy & Engineering Benchmarks:** 
  - Proved aerodynamic flight in Mars’s hyper-thin atmosphere (~1% of Earth’s atmospheric density) with twin counter-rotating carbon-fiber blades spinning at 2,400–2,900 RPM.
  - Completed 72 flights, logging over 128 minutes in the air and covering 17 kilometers.
  - Defined the flight physics, autonomous optical flow navigation, and thermal pre-heating protocols that form the operational baseline for next-generation Mars rotorcraft scouts.

### 2.4 Mars Sample Return (MSR) & Perseverance Sample Retrieval Architecture (PSRA)
* **Status as of November 2026:** **Program Cancelled & Restructured into PSRA.**
* **The 2026 Budget Pivot:** The legacy NASA-ESA MSR architecture (involving an expensive Sample Retrieval Lander, Mars Ascent Vehicle, and Earth Return Orbiter) was officially wound down after independent lifecycle cost estimates escalated to $8B–$11B with projected return dates slipping past 2040. Congress declined full funding for the legacy architecture.
* **Perseverance Sample Retrieval Architecture (PSRA):** NASA chartered the PSRA strategy team in 2026 to evaluate commercial and streamlined architectures (e.g., single-launch commercial landers, simplified Mars ascent vehicles) capable of retrieving Perseverance's cached samples for under $3 billion by the early 2030s.

### 2.5 ESCAPADE (Escape and Plasma Acceleration and Dynamics Explorers)
* **Status (November 2026):** **In Deep-Space Cruise to Mars.**
* **Organizations:** NASA / University of California, Berkeley / Rocket Lab.
* **Flight Path & Historic Maneuvers:**
  - Launched November 13, 2025, on Blue Origin’s New Glenn rocket.
  - Twin spacecraft named **"Blue"** and **"Gold"** (built on Rocket Lab’s Explorer-class spacecraft bus).
  - Loitered at the Sun-Earth L2 Lagrangian point for 11 months awaiting interplanetary alignment.
  - Executed a world-first **double powered Earth gravity assist**: "Blue" conducted its flyby and trans-Mars injection burn on **November 7, 2026**; "Gold" followed on **November 9, 2026**, achieving >99% burn accuracy.
* **Destination & Arrival:** En route to Mars; orbital insertion targeted for **September 7–9, 2027**.
* **Science Objectives:** Two-point simultaneous orbital measurements of the Martian magnetosphere to quantify how solar wind ion stripping depleted Mars’s primordial atmosphere and water.

### 2.6 ExoMars *Rosalind Franklin* Rover
* **Status as of November 2026:** **In Advanced Assembly & System Testing (Launch: Late 2028).**
* **Organizations:** ESA in direct partnership with NASA (ROSA — Return to Operations and System Augmentation).
* **Launch & Trajectory:** Scheduled for late 2028 aboard a **SpaceX Falcon Heavy** from Kennedy Space Center (LC-39A). Due to orbital mechanics optimized for spring landing illumination, the spacecraft lands at **Oxia Planum** in **November 2030**.
* **Unique Science Capability:** Features a subsurface drill capable of penetrating **2.0 meters** beneath the surface—far deeper than any prior Mars rover. Subsurface samples are transferred into the analytical drawer to be pulverized and analyzed by the Mars Organic Molecule Analyzer (MOMA) to detect delicate biosignatures shielded from surface ultraviolet and cosmic radiation.

---

## Section 3: Solar System Exploration & Planetary Defense

### 3.1 Martian Moons eXploration (MMX) & *Idefix* Rover
* **Operational Status (November 2026):** **Launched and En Route to Mars.**
* **Organizations:** JAXA (Japan), in collaboration with CNES (France), DLR (Germany), and NASA.
* **Launch Date:** Lifted off on **October 20, 2026 (04:41 JST)** aboard an H3-24L launch vehicle from Tanegashima Space Center.
* **Timeline:** 
  - *Mars Arrival:* August 2027.
  - *Phobos Proximity Operations & Landing:* 2030.
  - *Earth Return:* 2031 (landing at Woomera, Australia).
* **Key Hardware:**
  - *Main Spacecraft:* Multi-module orbiter with a robotic core sampler targeting $\ge 10\text{ grams}$ of Phobos regolith.
  - *Idefix Rover:* A 25 kg four-legged mini-rover developed by CNES and DLR designed to tumble, right itself, and traverse Phobos's microgravity surface ($g \approx 0.0057\text{ m/s}^2$).
* **Scientific Goal:** Settle whether Phobos and Deimos are captured carbonaceous chondrite asteroids or fragments of Mars ejected during an ancient giant impact.

### 3.2 Chandrayaan-3 & Chandrayaan-4 Lunar Missions
* **Chandrayaan-3 (Completed August 2023):** ISRO achieved a soft landing at 69.37° S (Shiv Shakti Point) near the lunar south pole. The *Pragyan* rover and *Vikram* lander operated for one lunar day, recording surface regolith temperatures (ChaSTE probe discovered steep thermal gradients) and confirming elemental sulfur in lunar soil.
* **Chandrayaan-4 (Officially Approved / In Development, Launch: ~2027–2028):**
  - *Mission Scope:* India's first lunar sample return mission, aiming to extract and return **2 to 3 kg** of south polar regolith (84°–86° S latitude).
  - *Architecture:* Multi-launch configuration using **two separate LVM3 rockets**.
  - *Five-Module Modular Stack:*
    1. *Descender Module (DM):* Carries the lunar landing system, surface robotic arm, and drill.
    2. *Ascender Module (AM):* Launches samples off the Moon into lunar orbit.
    3. *Transfer Module (TM):* Performs trans-Earth injection and cruise.
    4. *Re-entry Module (RM):* High-speed atmospheric entry capsule.
    5. *Propulsion Module (PM):* Orbital maneuvering and rendezvous tug.

### 3.3 Planetary Defense: DART & *Hera* Asteroid Rendezvous
* **DART (Double Asteroid Redirection Test — Completed September 26, 2022):** 
  - NASA intentionally crashed a 570 kg kinetic impactor into **Dimorphos** (moonlet of asteroid Didymos) at 6.1 km/s.
  - Altered Dimorphos’s orbital period by **33 minutes**, proving kinetic impact deflection.
* **Hera Mission (ESA — Currently Operational at Target, November 2026):**
  - *Arrival Milestones:* Traveled ahead of baseline schedule, executing orbital synchronization burns on October 15 and October 22, 2026, and officially arriving at the Didymos system in **November 2026**.
  - *Proximity Operations:* Transmitting high-resolution images from 60 km away, characterizing the impact crater, measuring Dimorphos’s mass via gravitational deflection, and preparing to deploy the **Milani** (dust/mineralogy) and **Juventas** (low-frequency radar interior sounding) CubeSats in early 2027.

### 3.4 OSIRIS-REx & OSIRIS-APEX
* **OSIRIS-REx (Completed September 24, 2023):** Returned 121.6 grams of pristine carbonaceous sample from asteroid Bennu to the Utah Test and Training Range.
* **OSIRIS-APEX (Currently Operational, Cruise Phase):**
  - Following sample return capsule release, the main spacecraft was retargeted to asteroid **99942 Apophis**.
  - Completed an Earth gravity assist flyby on September 23, 2025, and multiple deep-space perihelion burns.
  - *Apophis Encounter (April 13, 2029):* Apophis will make a rare pass within 32,000 km of Earth (inside geosynchronous orbit). OSIRIS-APEX will rendezvous with the asteroid immediately after this flyby, entering proximity operations to observe tidal distortions, surface landslides, and spin alterations induced by Earth’s gravity.

### 3.5 NEO Surveyor
* **Status (November 2026):** **Under Development / In Spacecraft Integration.**
* **Organization:** NASA JPL / Planetary Defense Coordination Office.
* **Target Launch:** **September 2027** aboard a SpaceX Falcon 9 to the **Sun-Earth L1 Lagrange point** (1.5 million km sunward).
* **Instrument Architecture:** 50 cm infrared telescope operating at two heat-sensing infrared channels (4–5.2 $\mu$m and 6–10 $\mu$m).
* **Mission Goal:** Fulfill the Congressional mandate to discover, track, and characterize $\ge 90\%$ of potentially hazardous asteroids and comets $\ge 140\text{ meters}$ in diameter, detecting dark, non-reflective objects invisible to ground-based optical telescopes.

### 3.6 James Webb Space Telescope (JWST)
* **Status (November 2026):** Fully operational in halo orbit around Sun-Earth L2 (1.5 million km anti-sunward). Exceeded primary cryogenic and propellant lifetime estimates, with sufficient stationkeeping fuel to operate for 20+ years.
* **Science Delivery:** Infrared deep-field imagery, discovery of early high-redshift galaxies ($z > 14$), and transmission spectroscopy of exoplanetary atmospheres (detecting carbon dioxide, water vapor, methane, and sulfur dioxide in worlds such as WASP-39b and the TRAPPIST-1 system).

### 3.7 Europa Clipper
* **Status (November 2026):** **In Deep-Space Cruise (Target Arrival: April 11, 2030).**
* **Organizations:** NASA JPL / Johns Hopkins APL.
* **Launch Date:** October 14, 2024, on a SpaceX Falcon Heavy.
* **Trajectory Milestones:** Completed Mars gravity assist on March 1, 2025; heading toward its final planetary gravity assist flyby of **Earth on December 3, 2026** (at ~3,200 km altitude) to gain velocity for Jupiter transit.
* **Target Science:** Execute **49 close flybys of Europa** (dipping as low as 25 km above the ice shell) while in an eccentric Jupiter orbit, using ice-penetrating radar (REASON), mass spectrometers (MASPEX), and magnetometers to confirm the thickness of the ice shell and the habitability of its global subsurface ocean.

### 3.8 Dragonfly (Titan Rotorcraft Lander)
* **Status (November 2026):** **In Hardware Assembly & Avionics Testing (Launch: July 2028).**
* **Organization:** NASA / Johns Hopkins Applied Physics Laboratory.
* **Launch & Cruise:** Scheduled launch July 5–25, 2028, aboard a SpaceX Falcon Heavy; arriving at Saturn’s moon **Titan in 2034**.
* **Spacecraft Architecture:** A large octocopter / dual-quadcopter rotorcraft (weighing ~450 kg) powered by an MMRTG. Exploits Titan’s dense nitrogen atmosphere (1.5 bar) and low gravity (0.14 g) to fly multiple kilometers per hop between surface study sites across the Shangri-La sand dunes and Selk impact crater.

---

## Section 4: International Space Agencies & Emerging Programs

### 4.1 China National Space Administration (CNSA)
* **Tiangong Space Station (Currently Operational):** Three-module T-shaped orbital station (Tianhe core, Wentian and Mengtian science labs). Maintains a permanent crew of three taikonauts on 6-month rotations via Shenzhou spacecraft, supported by Tianzhou automated cargo freighters.
* **Chang'e 6 (Completed June 2024):** Achieved humanity's first lunar far-side sample return, touching down in the South Pole-Aitken Basin (Apollo crater) and returning 1,935.3 grams of ancient regolith to Earth.
* **Chang'e 7 (Rescheduled to 2027):** Targeted at the lunar south pole; includes an orbiter, lander, rover, and a specialized **mini-flying hopping probe** equipped with water detectors to hop directly into Permanently Shadowed Regions (PSRs).
* **Chang'e 8 (Target: ~2029):** Precursor infrastructure for the International Lunar Research Station (ILRS); testing robotic in-situ resource utilization (ISRU) and 3D printing of lunar regolith bricks.
* **Tianwen-2 (Currently Operational, Mid-2026 Rendezvous):** Sampling probe operating at near-Earth quasi-satellite asteroid **Kamoʻoalewa**; will collect surface regolith via touch-and-go anchoring before heading toward active comet 311P.
* **Tianwen-3 (In Development, Target: Late 2028):** Dual Long March 5 launches to return ~500 grams of Martian rock cores to Earth by **2031**, directly competing with the revised NASA/ESA timeline.

### 4.2 Indian Space Research Organisation (ISRO)
* **Gaganyaan Human Spaceflight Program:**
  - *Gaganyaan-1 (G1 Uncrewed Demo — Target: Q4 2026):* Launching on the human-rated HLVM3 rocket carrying **Vyommitra**, an intelligent female half-humanoid robot designed to record cabin acoustics, microgravity dynamics, and life-support sensor telemetry during a 3-day orbital flight.
  - *Gaganyaan Crewed Flight (Target: Mid-2027):* Sending 2–3 Indian astronaut gaganyanaats to a 400 km low Earth orbit for a multi-day mission followed by a Bay of Bengal recovery.
* **Shukrayaan / Venus Orbiter Mission:** Formally approved by the Union Cabinet in 2024; targeted for late 2028 to study atmospheric chemistry and volcanic activity on Venus using synthetic aperture radar.

### 4.3 European Space Agency (ESA)
* **Juice (Jupiter Icy Moons Explorer — In Cruise):** Launched April 2023. Executed humanity's first lunar-Earth double gravity assist in August 2024; scheduled to arrive in the Jovian system in July 2031 to study Europa, Callisto, and enter orbit around Ganymede in 2034.
* **Argonaut (European Large Logistics Lander):** Heavy autonomous lunar cargo carrier capable of landing 1.5 metric tons on the Moon, supporting Artemis surface operations starting in 2030.
* **EnVision (Target: 2031):** Advanced Venus orbiter providing radar mapping and subsurface sounding.

### 4.4 Canadian Space Agency (CSA)
* **Jeremy Hansen & Artemis II:** CSA astronaut Jeremy Hansen completed the Artemis II lunar circumlunar mission in April 2026, becoming the first non-American to leave low Earth orbit and fly around the Moon.
* **Canadarm3 Robotics:** Advanced AI-driven robotic arm system engineered by MDA Space. Originally designed for the Lunar Gateway, Canadarm3’s modular components (large robotic arm, dexterous hand, specialized end effectors) are currently being adapted for autonomous logistics on commercial LEO stations and lunar surface infrastructure.
* **Deep Space Food Challenge:** Joint CSA/NASA initiative cultivating micro-algae, cellular agriculture, and automated vertical hydroponics for long-duration deep space exploration.

---

## Section 5: Commercial Spaceflight Systems & Architectures

### 5.1 SpaceX Starship / Super Heavy & Artemis HLS
* **Flight Testing Milestones (Flight 14 & 15, 2026):**
  - Starship Flight 14 (September 28, 2026) achieved the vehicle's first true orbital insertion and deployed full-scale Starlink V3 satellites before a deorbit burn.
  - Flight 15 (late 2026) tested a multi-orbit 22-hour flight profile, full tower catches of the Super Heavy booster, and thermal tile endurance on Ship 42.
* **Orbital Cryogenic Propellant Transfer:** SpaceX and NASA are actively testing microgravity transfer of liquid oxygen (LOX) and liquid methane (LCH₄). For a crewed lunar landing, Starship HLS requires approximately 8–10 tanker launches to fill a low-Earth-orbit propellant storage depot before departing for the Moon.
* **Starship HLS in Artemis:** Scheduled for an uncrewed lunar landing demonstration, followed by crewed surface transport on Artemis IV/V.

### 5.2 Blue Origin New Glenn & Blue Moon HLS
* **New Glenn Heavy Lifter:** Following launch pad restoration at Launch Complex 36 (LC-36) after early 2026 ground testing anomalies, New Glenn is entering regular flight cadence, providing heavy-lift launch capabilities for commercial satellites, ESCAPADE, and lunar hardware.
* **Blue Moon Mark 1 (MK-1):** Single-launch uncrewed cargo lander capable of delivering 3 metric tons to the lunar surface. Selected to deliver NASA's VIPER rover to Mons Mouton in 2027.
* **Blue Moon Mark 2 (MK-2 Human Landing System):** Awarded under NASA’s NextSTEP-2 Appendix P contract for Artemis IV/V. Uses liquid hydrogen and liquid oxygen (BE-7 deep-throttling engines), integrating with a cislunar transporter tug to support sustained surface exploration.

---

## Section 6: Comprehensive 10-Field Mission Reference Profiles

### Profile 1: International Space Station (ISS)
1. **Mission Name:** International Space Station (ISS)
2. **Responsible Organizations:** NASA (USA), ESA (Europe), JAXA (Japan), CSA (Canada), Roscosmos (Russia)
3. **Current Status (Nov 2026):** Currently Operational in LEO (~415 km, 51.6°). Scheduled for commercial handoff and controlled deorbit in 2030–2031.
4. **Main Objectives:** Microgravity biological, physical, and materials research; human physiology adaptations to long-duration spaceflight; testing closed-loop life support hardware.
5. **Planned/Actual Timeline:** Continuous crew occupation since November 2, 2000; operations funded through 2030; USDV deorbit target early 2031.
6. **Hardware/Technologies:** Modular pressurized modules, Canadarm2, Dextre, iROSA solar arrays, ECLSS water recovery and oxygen generation assemblies, SpaceX Dragon, Soyuz-MS.
7. **Major Engineering Challenges:** Structural metal fatigue, micro-meteoroid orbital debris (MMOD) shielding, toxic ammonia cooling loop maintenance, microbial biofilm management in water recyclers.
8. **Astronaut Activities:** 2 hours daily cardiovascular/resistive exercise (ARED/T2 treadmill), maintenance EVAs, plant growth operations, rodent research, Earth observations.
9. **Public Datasets & Imagery:** 
   - NASA RadLab: https://visualization.osdr.nasa.gov/radlab/
   - NASA OSDR (Open Science Data Repository): https://osdr.nasa.gov/
10. **Trainer Gameplay Applications:** 
    - ECLSS filter unclogging and water reclamation balancing mini-game.
    - Orbital docking alignment simulator using realistic reaction control thruster dynamics.
    - Emergency decompression isolation challenge (sealing hatch bulkheads based on pressure drops).

---

### Profile 2: Artemis II
1. **Mission Name:** Artemis II
2. **Responsible Organizations:** NASA (USA), CSA (Canada)
3. **Current Status (Nov 2026):** **Completed Mission** (Flown April 1–11, 2026; Pacific splashdown verified).
4. **Main Objectives:** First crewed flight test of the Space Launch System and Orion spacecraft; validate environmental life support with crew onboard; execute manual handling in lunar proximity.
5. **Planned/Actual Timeline:** Launched April 1, 2026; completed 10-day circumlunar free-return flight; splashed down April 11, 2026.
6. **Hardware/Technologies:** SLS Block 1 rocket (twin 5-segment solid boosters + core stage with 4 RS-25 engines), Orion Crew and Service Module (ESA-provided service module), O2/CO2 scrubbers, optical laser communications (O2O).
7. **Major Engineering Challenges:** Orion heat shield charring behavior during 40,000 km/h skip entry; managing life support transients during crew exercise; deep-space radiation protection during solar flare events.
8. **Astronaut Activities:** Manual piloting proximity demonstrations near the upper stage; sleep and metabolic health tracking; high-bandwidth video downlink; circumlunar navigation checks.
9. **Public Datasets & Imagery:** 
   - NASA Artemis Imagery & Telemetry: https://images.nasa.gov/
   - NASA Orion Mission Archives: https://www.nasa.gov/artemis-ii
10. **Trainer Gameplay Applications:** 
    - Free-return trajectory course corrections using manual reaction thrusters.
    - Crew CO₂ scrubber canister replacement during elevated exertion spikes.
    - Deep-space optical laser communication alignment challenge.

---

### Profile 3: Artemis III (Restructured LEO Test)
1. **Mission Name:** Artemis III (Restructured)
2. **Responsible Organizations:** NASA, SpaceX, Blue Origin, ESA
3. **Current Status (Nov 2026):** **Under Development** (Target Launch: Late 2027).
4. **Main Objectives:** Crewed LEO qualification of Orion docked with commercial Human Landing Systems; test propellant transfer dynamics, integrated avionics, and high-volume hatch transfers in orbit.
5. **Planned/Actual Timeline:** Flight scheduled for late 2027.
6. **Hardware/Technologies:** SLS Block 1, Orion spacecraft, Starship HLS test vehicle, Blue Moon LEO demonstrator, NASA Docking System (NDS / IDSS standard).
7. **Major Engineering Challenges:** Thermal insulation and boil-off mitigation of cryogenic propellants (liquid oxygen/methane/hydrogen) during multi-day docked burns; cross-system software communications bus translation.
8. **Astronaut Activities:** Docking control from Orion consoles, cross-hatch module ingress, zero-g suit pressure-drop tests, emergency egress rehearsals.
9. **Public Datasets & Imagery:** 
   - NASA Human Landing System Program Data: https://www.nasa.gov/hls
10. **Trainer Gameplay Applications:** 
    - Multi-vehicle orbital docking mini-game with realistic mass inertia and laser ranging sensors.
    - Cryogenic boil-off pressure relief balancing under solar heating.

---

### Profile 4: Firefly Blue Ghost Mission 1 (CLPS)
1. **Mission Name:** Blue Ghost Mission 1
2. **Responsible Organizations:** Firefly Aerospace, NASA CLPS Program
3. **Current Status (Nov 2026):** **Completed Mission** (Landed March 2, 2025; surface ops completed).
4. **Main Objectives:** Low-cost commercial delivery of 10 NASA science payloads to Mare Crisium; characterize regolith geophysics, solar wind plasma, and surface radiation.
5. **Planned/Actual Timeline:** Launched January 15, 2025; lunar landing March 2, 2025; operated across full lunar day until sunset.
6. **Hardware/Technologies:** Firefly Blue Ghost lander, LISTER drill/thermal probe, Lunar Planet-Vac regolith sampler, Electrodynamic Dust Shield (EDS), NPL solar wind spectrometer.
7. **Major Engineering Challenges:** Autonomous hazard avoidance landing in rugged basaltic terrain; thermal survival during midday lunar heat ($>120^\circ\text{C}$); dust plume contamination of optical payloads.
8. **Astronaut Activities:** Uncrewed robotic delivery.
9. **Public Datasets & Imagery:** 
   - Firefly Aerospace Blue Ghost Mission Archive: https://fireflyspace.com/missions/blue-ghost/
   - NASA CLPS Archive: https://www.nasa.gov/clps
10. **Trainer Gameplay Applications:** 
    - Electrodynamic Dust Shield (EDS) activation to repel charged lunar dust from solar panels.
    - Autonomous lander thruster descent timing challenge to prevent tipping on crater slopes.

---

### Profile 5: Mars Science Laboratory (*Curiosity* Rover)
1. **Mission Name:** Mars Science Laboratory (MSL) / *Curiosity* Rover
2. **Responsible Organizations:** NASA JPL
3. **Current Status (Nov 2026):** **Currently Operational** (14+ years in Gale Crater, climbed >1,000m up Mount Sharp).
4. **Main Objectives:** Assess whether Mars ever had an environment capable of supporting microbial life; investigate Gale Crater's ancient lake deposits and paleoclimate.
5. **Planned/Actual Timeline:** Launched November 26, 2011; landed August 6, 2012; prime mission completed; currently in extended multi-year science operations.
6. **Hardware/Technologies:** 899 kg six-wheeled rover, MMRTG (plutonium-238 heat/power), Radiation Assessment Detector (RAD), ChemCam laser, SAM analytical chemistry suite, Mastcam.
7. **Major Engineering Challenges:** Aluminum wheel puncturing from sharp ventifact rocks; memory single-event upsets (SEUs) from cosmic radiation; declining MMRTG electrical wattage over 14 years.
8. **Astronaut Activities:** Robotic surface operations.
9. **Public Datasets & Imagery:** 
   - NASA PDS Geosciences MSL Archive: https://pds-geosciences.wustl.edu/missions/msl/
   - Curiosity Raw Images: https://mars.nasa.gov/msl/multimedia/raw-images/
10. **Trainer Gameplay Applications:** 
    - Terrain pathfinding puzzle avoiding abrasive jagged bedrock to preserve wheel integrity.
    - Natural cliffside radiation shielding mechanic: park the rover in a deep canyon during an energetic particle storm to reduce absorbed dose.

---

### Profile 6: Mars 2020 (*Perseverance* Rover)
1. **Mission Name:** Mars 2020 / *Perseverance* Rover
2. **Responsible Organizations:** NASA JPL
3. **Current Status (Nov 2026):** **Currently Operational** (5+ years in Jezero Crater, drove >42.2 km marathon distance, 30+ sample tubes sealed).
4. **Main Objectives:** Search for signs of ancient life (biosignatures); characterize Jezero’s river delta and crater rim; collect and hermetically cache pristine core samples for Earth return.
5. **Planned/Actual Timeline:** Launched July 30, 2020; landed February 18, 2021; currently executing the Margin Unit and Crater Rim exploration campaigns.
6. **Hardware/Technologies:** 1,025 kg rover, coring drill arm, Adaptive Caching Assembly (ACA), SuperCam, PIXL micro-focus X-ray fluorescence, SHERLOC UV Raman spectrometer, MOXIE (in-situ oxygen generator, completed).
7. **Major Engineering Challenges:** Autonomous hazard-free navigation across steep bouldered crater rims; robotic coring without sample tube jam or contamination; thermal cycling from $-90^\circ\text{C}$ nights.
8. **Astronaut Activities:** Robotic planetary explorer.
9. **Public Datasets & Imagery:** 
   - Mars 2020 Raw Imagery: https://mars.nasa.gov/mars2020/multimedia/raw-images/
   - Jezero Crater HiRISE DTMs (USGS/NASA): https://astrogeology.usgs.gov/search/map/Mars/Mars2020/
10. **Trainer Gameplay Applications:** 
    - Jezero navigation route planner: balance energy consumption, slope slip risk, and high-value rock core targets.
    - Sample tube sealing verification mini-game (ensuring hermetic vacuum seal on core samples).

---

### Profile 7: ESCAPADE (Escape and Plasma Acceleration and Dynamics Explorers)
1. **Mission Name:** ESCAPADE
2. **Responsible Organizations:** NASA, University of California Berkeley, Rocket Lab
3. **Current Status (Nov 2026):** **Currently Operational / In Deep Space Cruise** (Executed double powered Earth flybys Nov 7 & 9, 2026; Mars arrival September 2027).
4. **Main Objectives:** Conduct twin-point orbital measurements of Mars's magnetic field and upper atmosphere to quantify real-time atmospheric escape driven by solar wind interaction.
5. **Planned/Actual Timeline:** Launched November 13, 2025; Earth flybys November 2026; Mars arrival September 7–9, 2027.
6. **Hardware/Technologies:** Twin Rocket Lab Explorer-class spacecraft ("Blue" and "Gold"), Curie bi-propellant propulsion, fluxgate magnetometers (EM-1/2), electrostatic analyzers.
7. **Major Engineering Challenges:** Low-cost deep-space mission design ($<\$80\text{M}$); novel non-Hohmann loiter trajectory at Earth-Sun L2 followed by dual powered flybys; autonomous orbit insertion.
8. **Astronaut Activities:** Robotic scientific twin probes.
9. **Public Datasets & Imagery:** 
   - UC Berkeley Space Sciences Lab ESCAPADE Page: https://ssl.berkeley.edu/missions/escapade/
10. **Trainer Gameplay Applications:** 
    - Double gravity-assist slingshot timing puzzle: fire thrusters precisely at closest approach to boost velocity toward Mars.
    - Multi-point space weather sensor alignment (triangulating solar wind shockfronts).

---

### Profile 8: ExoMars *Rosalind Franklin* Rover
1. **Mission Name:** ExoMars *Rosalind Franklin* Rover
2. **Responsible Organizations:** ESA (Europe), NASA (USA)
3. **Current Status (Nov 2026):** **Under Development / Qualification Testing** (Launch: Late 2028 on Falcon Heavy; Mars Landing: November 2030).
4. **Main Objectives:** Search for biochemical markers and molecular biosignatures of past Martian life by drilling 2 meters beneath the radiation-sterilized surface.
5. **Planned/Actual Timeline:** Launch window late 2028; touchdown at Oxia Planum in November 2030.
6. **Hardware/Technologies:** European rover chassis, NASA ROSA descent engines, 2-meter drill with infrared mineral spectrometer (Ma_MISS), MOMA mass spectrometer, PanCam.
7. **Major Engineering Challenges:** Redesigning European landing platform after terminating Roscosmos cooperation; planetary protection strict sterility for deep subsurface drilling; ultra-fine sample distribution.
8. **Astronaut Activities:** Robotic astrobiology explorer.
9. **Public Datasets & Imagery:** 
   - ESA ExoMars Exploration Page: https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Exploration/ExoMars
10. **Trainer Gameplay Applications:** 
    - Subsurface core drill simulator: monitor drill bit temperature, torque resistance, and stratum layers down to 2 meters.
    - Mass spectrometer chromatogram analysis: match chemical peaks to identify organic amino acids versus inorganic minerals.

---

### Profile 9: Martian Moons eXploration (MMX)
1. **Mission Name:** Martian Moons eXploration (MMX)
2. **Responsible Organizations:** JAXA (Japan), CNES (France), DLR (Germany), NASA (USA)
3. **Current Status (Nov 2026):** **Currently Operational / In Deep Space Cruise** (Launched October 20, 2026 on H3 rocket; Mars arrival August 2027).
4. **Main Objectives:** Collect $\ge 10\text{ grams}$ of regolith from Phobos and return it to Earth; clarify the origin of the Martian moons; deploy the *Idefix* micro-rover on Phobos.
5. **Planned/Actual Timeline:** Launched October 20, 2026; Mars arrival August 2027; Phobos landing/sampling 2030; Earth return capsule landing in Australia 2031.
6. **Hardware/Technologies:** Three-module spacecraft (Exploration, Return, and Propulsion modules), pneumatic corer and robotic arm, *Idefix* 4-legged rover, MEGANE gamma-ray spectrometer (NASA).
7. **Major Engineering Challenges:** Autonomous navigation and proximity docking in Phobos’s extremely weak and non-spherical gravity field; dust levitation and rebound dynamics during touchdown.
8. **Astronaut Activities:** Robotic interplanetary sample-return.
9. **Public Datasets & Imagery:** 
   - JAXA MMX Project Site: https://www.mmx.jaxa.jp/en/
10. **Trainer Gameplay Applications:** 
    - Low-gravity asteroid docking: navigate spacecraft down to Phobos's surface without bouncing off into escape velocity.
    - *Idefix* self-righting puzzle: manipulate robotic legs to flip an inverted rover upright in $0.0005\text{ g}$.

---

### Profile 10: Chandrayaan-4
1. **Mission Name:** Chandrayaan-4
2. **Responsible Organizations:** ISRO (India)
3. **Current Status (Nov 2026):** **Officially Approved / In Hardware Development** (Target Launch: 2027–2028).
4. **Main Objectives:** Execute India's first lunar south pole sample return (2–3 kg of regolith); demonstrate autonomous lunar surface ascent and docking in lunar orbit.
5. **Planned/Actual Timeline:** Approved 2024; dual LVM3 launches targeted for 2027–2028.
6. **Hardware/Technologies:** Two LVM3 launch vehicles, five modular spacecraft modules (Descender, Ascender, Transfer, Re-entry, and Propulsion), robotic scoop and core drill.
7. **Major Engineering Challenges:** Autonomous orbit docking between the Ascender and Transfer modules in lunar orbit; multi-stage thermal protection of ice-rich regolith during Earth atmospheric reentry.
8. **Astronaut Activities:** Robotic sample return demonstrator.
9. **Public Datasets & Imagery:** 
   - ISRO Chandrayaan Program Portal: https://www.isro.gov.in/
10. **Trainer Gameplay Applications:** 
    - Modular launch and orbit assembly challenge: dock two separate spacecraft stacks in low Earth orbit before lighting the lunar transfer burn.
    - Lunar surface ascent launch window timing: ignite ascender engines to intercept the waiting transfer orbiter.

---

### Profile 11: Hera Mission
1. **Mission Name:** Hera
2. **Responsible Organizations:** ESA (Europe)
3. **Current Status (Nov 2026):** **Currently Operational at Target** (Arrived at Didymos binary asteroid system in November 2026; capturing close-up imagery).
4. **Main Objectives:** Conduct detailed post-impact investigation of Dimorphos following NASA's DART kinetic impact; measure impact crater morphology, asteroid mass, and momentum transfer efficiency ($\beta$).
5. **Planned/Actual Timeline:** Launched October 7, 2024; rendezvoused with Didymos in November 2026; CubeSat deployment and proximity operations through 2027.
6. **Hardware/Technologies:** Hera mothership, Asteroid Framing Camera (AFC), Thermal Infrared Imager (TIRI), *Milani* CubeSat (multispectral mineralogy), *Juventas* CubeSat (low-frequency radar sounder).
7. **Major Engineering Challenges:** Autonomous optical navigation (AFC feature tracking) around a tumbling, binary irregular asteroid pair with negligible gravity.
8. **Astronaut Activities:** Robotic planetary defense scout.
9. **Public Datasets & Imagery:** 
   - ESA Hera Mission Information: https://www.esa.int/Hera
10. **Trainer Gameplay Applications:** 
    - Planetary defense impact forensics: measure crater diameter and ejecta ray patterns to calculate asteroid core density.
    - Low-frequency radar pinging mini-game: transmit radar waves through the asteroid to map internal rubble voids.

---

### Profile 12: OSIRIS-APEX (Apophis Explorer)
1. **Mission Name:** OSIRIS-APEX (Origins, Spectral Interpretation, Resource Identification, and Security–Apophis Explorer)
2. **Responsible Organizations:** NASA, University of Arizona
3. **Current Status (Nov 2026):** **Currently Operational / In Heliocentric Cruise** (Preparing for April 13, 2029 Apophis rendezvous).
4. **Main Objectives:** Rendezvous with potentially hazardous asteroid 99942 Apophis immediately after its close Earth flyby; investigate tidal stress deformations and surface changes.
5. **Planned/Actual Timeline:** Bennu sample returned Sep 2023; Earth gravity assist Sep 2025; Apophis Earth flyby & spacecraft intercept April 13, 2029; 18 months of proximity science.
6. **Hardware/Technologies:** Repurposed OSIRIS-REx spacecraft bus, OTES thermal emission spectrometer, OVIRS visible/IR spectrometer, MapCam/PolyCam cameras, hydrazine thruster gas-blast system.
7. **Major Engineering Challenges:** Surviving multiple extreme perihelion passages (dipping within 0.5 AU of the Sun); operating gas thrusters close to asteroid regolith without tumbling.
8. **Astronaut Activities:** Robotic asteroid explorer.
9. **Public Datasets & Imagery:** 
   - University of Arizona OSIRIS-APEX: https://www.asteroidmission.org/
10. **Trainer Gameplay Applications:** 
    - Gravitational tidal monitoring: track asteroid surface fractures and rock avalanches as Earth's gravity tugs on the asteroid during close approach.

---

### Profile 13: Europa Clipper
1. **Mission Name:** Europa Clipper
2. **Responsible Organizations:** NASA JPL, Johns Hopkins APL
3. **Current Status (Nov 2026):** **Currently Operational / In Cruise** (Approaching close Earth gravity assist flyby on December 3, 2026; Jupiter arrival April 11, 2030).
4. **Main Objectives:** Determine whether Jupiter's icy moon Europa harbors habitable subsurface conditions; assess ice shell thickness, ocean salinity, and surface-ice-ocean exchanges.
5. **Planned/Actual Timeline:** Launched October 14, 2024; Mars flyby March 2025; Earth flyby Dec 3, 2026; Jupiter arrival April 2030; science flybys 2031–2034.
6. **Hardware/Technologies:** Massive 30-meter solar array wings, radiation-shielded avionics vault, REASON ice-penetrating radar, MASPEX neutral gas/ion mass spectrometer, MISE infrared imaging spectrometer.
7. **Major Engineering Challenges:** Surviving Jupiter’s lethal radiation belts (requiring wide looping orbits and heavy aluminum-tantalum armor); keeping electronics warm in deep space.
8. **Astronaut Activities:** Robotic outer-solar-system flagship.
9. **Public Datasets & Imagery:** 
   - NASA Europa Clipper Hub: https://www.jpl.nasa.gov/missions/europa-clipper
10. **Trainer Gameplay Applications:** 
    - Radiation belt avoidance orbital navigation: time science flybys through Europa's atmosphere while minimizing total accumulated rad dose in the radiation vault.
    - Ice-penetrating radar analysis: interpret synthetic radar echograms to detect liquid water pockets trapped within the ice crust.

---

### Profile 14: Dragonfly
1. **Mission Name:** Dragonfly
2. **Responsible Organizations:** NASA, Johns Hopkins APL
3. **Current Status (Nov 2026):** **Under Development / Hardware Assembly & Testing** (Launch: July 2028; Titan Arrival: 2034).
4. **Main Objectives:** Explore prebiotic chemical processes and habitability on Saturn's organic-rich moon Titan; fly across multiple landing sites to sample surface materials.
5. **Planned/Actual Timeline:** Launch window July 5–25, 2028; transit cruise ~6 years; landing at Titan's Shangri-La dune field in 2034.
6. **Hardware/Technologies:** 450 kg dual-quadcopter rotorcraft (8 rotors), MMRTG power source, DraMS mass spectrometer, DraGMet geophysics/meteorology package, pneumatic drills on landing skids.
7. **Major Engineering Challenges:** Autonomous rotorcraft flight in cryogenic conditions ($-179^\circ\text{C}$); navigating methane rain, dense haze, and low-light optical conditions with long communication delays (80+ minutes).
8. **Astronaut Activities:** Robotic aerial explorer.
9. **Public Datasets & Imagery:** 
   - Johns Hopkins APL Dragonfly Mission Portal: https://dragonfly.jhuapl.edu/
10. **Trainer Gameplay Applications:** 
    - Titan aerial flight simulation: control drone lift and pitch in low gravity ($0.14\text{ g}$) and dense atmosphere ($1.5\text{ bar}$), managing battery reserves between landing skids.
    - Cryogenic drilling and methane slush sampling puzzle.

---

### Profile 15: CHAPEA (Crew Health and Performance Exploration Analog)
1. **Mission Name:** CHAPEA Mission 2
2. **Responsible Organizations:** NASA Johnson Space Center
3. **Current Status (Nov 2026):** **Completed Mission** (Concluded October 31, 2026; 378 days of continuous isolation).
4. **Main Objectives:** Collect empirical behavioral and physiological data on four crew members living in a high-fidelity Mars surface habitat under strict communication delays and resource scarcity.
5. **Planned/Actual Timeline:** Ingress October 19, 2025; egress October 31, 2026 (378 days).
6. **Hardware/Technologies:** Mars Dune Alpha (1,700 sq ft 3D-printed habitat), VR simulated Marswalk system, indoor aeroponic/hydroponic plant grow units, food formulation systems.
7. **Major Engineering Challenges:** Managing interpersonal behavioral friction under strict sensory isolation; surviving a two-week communications blackout during simulated solar conjunction; nutritional stability of shelf-stable crops.
8. **Astronaut Activities:** Daily 30-minute habitat cleaning, routine treadmill/bike exercise, simulated EVA geological surveys in VR, growing and harvesting crops, preparing freeze-dried meal rations.
9. **Public Datasets & Imagery:** 
   - NASA CHAPEA Information Portal: https://www.nasa.gov/chapea
10. **Trainer Gameplay Applications:** 
    - Communications delay decision manager: player must issue commands to Mars base with a 15-minute one-way delay, forcing autonomous local error correction.
    - Solar conjunction blackout survival mode: base systems must operate entirely on automated scripts for 14 sols without Earth guidance.

---

## Section 7: Gameplay Applicability & Junior Astronaut Mechanics Mapping

The core goal of Deliverable B is translating real spaceflight mechanics into intuitive, scientifically grounded game modules for the Junior Astronaut Mission Trainer. The matrix below synthesizes real-world missions into tangible game mechanics across both Cadet (ages 7–9) and Explorer (ages 10–12+) tracks:

| Real-World Mission Reference | Real Scientific Principle & Challenge | Game Mechanic in Mission Control Jr. | Cadet Mode Simplification (Ages 7–9) | Explorer Mode Depth (Ages 10–12+) |
| :--- | :--- | :--- | :--- | :--- |
| **Curiosity Rover (RAD)** | Terrain radiation shielding from cliff walls and yardangs | **Radiation Shielding & Base Siting** | Visual radiation meter: drag rover behind cliff walls when warning sirens sound. | Quantify $\mu\text{Sv/hr}$ reduction curves based on rock mass, angle of elevation, and GCR vs. SEP event types. |
| **Perseverance Rover & Jezero DTM** | Topographical wheel slip, elevation climbing & energy management | **Rover Traverse & Route Optimization** | Simple line-drawing route avoiding big red hazard rocks to reach science flags. | Contour map analysis, calculating battery watt-hours vs. incline grade, soil shear strength, and slip percentage. |
| **ISS & ECLSS** | Closed-loop water recovery, urine processing, Sabatier oxygen loops | **Life Support Balance (Greenhouse & Outpost)** | Matching water/air pipe icons to keep green balance lights on. | Dynamic flow rate management: balance $L/\text{sol}$ recovery rates, filter particulate degradation, and Sabatier CO₂ feed. |
| **CHAPEA M2 & Horizons** | 13 to 22 minute speed-of-light radio delay; 14-sol conjunction blackout | **Communication Delay & Autonomous Rover Prep** | "Delayed Action" buffer: press button now, watch rover execute action 10 seconds later. | Program multi-step command sequences into an onboard script queue before communication window shuts down for solar conjunction. |
| **Artemis II & Orion** | Lunar free-return trajectory mechanics and burn timing | **Orbital Insertion & Free-Return Pilot** | Tap thrusters inside green target circles to stay on the glowing trajectory tunnel. | Calculate $\Delta v$ velocity burns, prograde/retrograde vector alignment, and fuel budget margin. |
| **Artemis III / Starship HLS** | Cryogenic propellant transfer, boil-off pressure, orbital docking | **Orbital Rendezvous & Cryo-Fuel Tug** | Snap docking alignment crosshairs together using simple directional keys. | Manage RCS translation thrusters in 6 degrees of freedom, monitor LOX/LCH₄ tank venting pressures during solar exposure. |
| **Blue Ghost M1 & EDS** | Electrodynamic dust repulsion, lunar regolith abrasive adhesion | **Dust Busters & Lunar Airlock Prep** | Use electro-repulsion wand to zap dust away from solar cells before power runs low. | Manage high-voltage AC electric fields on solar glass; sequence 3-stage airlock depressurization and dust scrubbers. |
| **DART & Hera** | Kinetic momentum deflection, orbital period alteration, crater physics | **Planetary Defense Interceptor** | Launch interceptor rocket to hit incoming asteroid bullseye and nudge it away. | Calculate momentum transfer multiplier ($\beta$), measure mass ejection vectors, and adjust orbital period by target minutes. |
| **MMX & Idefix Rover** | Microgravity surface operations ($g \approx 0.0005\text{ g}$), rebound dynamics | **Phobos Low-G Hopper** | Low-gravity jump button: tap lightly to hop across craters without floating away. | Calculate escape velocity ($v_{\text{esc}} \approx 11\text{ m/s}$), use mechanical spring legs to self-right without imparting rotational spin. |
| **Europa Clipper** | High-radiation Jovian belts; ice-penetrating radar sounding | **Ocean World Radar Scout** | Fly through clear radar zones and take pictures of the blue subsurface ocean glowing beneath the ice. | Balance radiation vault accumulated dose limits against low-altitude radar penetration depth through conductive ice layers. |
| **Dragonfly** | High-density atmosphere rotor flight in cryogenic nitrogen | **Titan Aerial Navigator** | Steer the 8-rotor helicopter through wind currents to land safely on dune crests. | Monitor air density lift equations, battery pre-heating cycles, and cryogenic rotor torque in $-179^\circ\text{C}$ nitrogen. |
| **Chandrayaan-4 / Chang'e 6** | Autonomous lunar ascent, orbit rendezvous, sample capsule return | **Lunar Sample Return Capstone** | Collect sparkly rocks with robotic arm, push "Launch Home" button to return. | Execute descender core drilling, calculate ascender launch azimuth, and perform automated rendezvous docking in lunar orbit. |

---

## Primary Source Documentation & Citations

1. **NASA Artemis Operations & Schedules (2026 Updates):**
   - NASA Artemis Program Overview: https://www.nasa.gov/artemis-program/
   - NASA Artemis II Crew & Trajectory Profiles: https://www.nasa.gov/mission/artemis-ii/
   - NASA Commercial Crew & Cargo / HLS Updates: https://www.nasa.gov/humans-in-space/commercial-space/
2. **International Space Station Operations & Transition Strategy:**
   - NASA International Space Station Transition Report & USDV Procurement: https://www.nasa.gov/international-space-station/
   - KeepTrack Space Station Operational Deorbit Assessments: https://keeptrack.space/
3. **Lunar Gateway Strategic Policy (March 2026 Policy Pivot):**
   - NASA Exploration Systems Development Directorate Statements: https://www.nasa.gov/gateway/
   - Orbital Intel Deep-Space Architecture Analysis: https://orbitalintel.org/
4. **Commercial Lunar Payload Services (CLPS):**
   - Firefly Aerospace Blue Ghost Mission 1 Surface Success Documentation: https://fireflyspace.com/missions/blue-ghost/
   - NASA CLPS Task Orders & Awards: https://www.nasa.gov/commercial-lunar-payload-services/
5. **Commercial LEO Destinations (CLD):**
   - NASA CLD Phase 2 Request for Proposals (Released Oct 9, 2026): https://www.nasa.gov/cld
   - Payload Space Commercial Habitat Landscape Reviews: https://payloadspace.com/
6. **CHAPEA Mars Analog (Mission 2 Conclusion, October 31, 2026):**
   - NASA Johnson Space Center CHAPEA Mission 2 Outbriefs: https://www.nasa.gov/chapea/
7. **Curiosity Rover & RAD Instrument (Gale Crater):**
   - NASA JPL MSL Curiosity 14-Year Science Archive: https://mars.nasa.gov/msl/
   - Southwest Research Institute (SwRI) Radiation Assessment Detector Archive: https://www.swri.org/
8. **Perseverance Rover & Mars Sample Return / PSRA Strategy:**
   - NASA JPL Mars 2020 Perseverance Science Deliverables: https://mars.nasa.gov/mars2020/
   - SpacePolicyOnline MSR Restructuring & PSRA Strategy Updates: https://spacepolicyonline.com/
9. **ESCAPADE Mars Mission (Double Earth Flyby, November 2026):**
   - UC Berkeley Space Sciences Laboratory ESCAPADE Telemetry Releases: https://ssl.berkeley.edu/missions/escapade/
   - NASA Planetary Missions Program Office: https://www.nasa.gov/escapade/
10. **ExoMars Rosalind Franklin Rover (ESA / NASA ROSA):**
    - ESA ExoMars Project Architecture (2028 Launch Profile): https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Exploration/ExoMars
11. **JAXA MMX Mission (Launched October 20, 2026):**
    - JAXA MMX Official Launch Notification & Mission Trajectory: https://global.jaxa.jp/projects/sas/mmx/
12. **ISRO Chandrayaan-4 & Gaganyaan:**
    - Indian Space Research Organisation Official Press Releases: https://www.isro.gov.in/
13. **ESA Hera Asteroid Mission (Arrived Didymos November 2026):**
    - ESA Hera Planetary Defense Operations Portal: https://www.esa.int/Hera
14. **NASA Planetary Defense & Outer Solar System:**
    - NASA Europa Clipper Mission Telemetry: https://europa.nasa.gov/
    - NASA Johns Hopkins APL Dragonfly Mission Page: https://dragonfly.jhuapl.edu/
    - NASA NEO Surveyor Mission Architecture: https://neos.jpl.nasa.gov/
    - University of Arizona OSIRIS-APEX Project: https://www.asteroidmission.org/
