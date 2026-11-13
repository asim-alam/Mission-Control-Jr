# Deliverable C: Comprehensive NASA & Space Agency Dataset Evaluation
**Junior Astronaut Mission Trainer — Real-Data Scientific Architecture**  
**Document ID:** `NASA-MCJ-DELIVERABLE-C-2026-V1`  
**Date:** November 2026  
**Author:** NASA Datasets & Scientific APIs Specialist (@datasets)  
**Target Project:** Mission Control Jr. (`/home/asim/CODE/Mission-Control-Jr-publish/Mission Control Jr/`)

---

## Executive Summary & Data Taxonomy

The **Junior Astronaut Mission Trainer** challenges players aged 7–12 to make authentic, consequential decisions managing simulated planetary outposts on Mars and the Moon. To achieve pedagogical credibility without overwhelming younger learners, the simulation architecture balances **rigorous scientific grounding** with **accessible, low-latency client-side gameplay**.

A critical finding from this research and codebase audit is that **raw scientific telemetry cannot be plugged directly into real-time gameplay loops without intermediate transformation**. Space datasets exhibit high latency, complex hierarchical schemas, irregular sampling frequencies, missing records, and astronomical scales that do not directly correspond to human-scale game clocks. 

Therefore, our architecture establishes three distinct data classifications:
1. **Observation Data (Tier 1):** Verified physical measurements (e.g., HiRISE stereo elevation grids, Opportunity 2018 optical depth vs. solar array wattage, Curiosity RAD absorbed dose rates).
2. **Derived Data (Tier 2):** Deterministic calculations derived directly from authoritative models (e.g., JPL Horizons DE441 light-time vectors, LOLA 18.6-year south pole illumination averages).
3. **Reference Data (Tier 3):** Peer-reviewed operational baselines, biological protocols, and engineering literature (e.g., OSDR OSD-269 16:8 photoperiods, NASA BVAD ECLSS recovery metrics) used to calibrate gameplay constraints while maintaining complete transparency regarding authored simplifications.

This deliverable provides an exhaustive evaluation of **35+ space agency datasets and API endpoints**, documenting exact response schemas, scientific limitations, static-site deployment feasibility, and concrete gameplay mappings.

---

## Dataset Evaluation Methodology & Scoring Criteria

Each dataset is evaluated across thirteen standardized parameters, culminating in a **Priority Ranking (1 to 10)**:

| Ranking | Classification | Strategic Action for Static-Site Mission Trainer |
| :---: | :--- | :--- |
| **9 – 10** | **Essential Core Asset** | Preprocessed and bundled locally as immutable JSON/ES modules; directly drives core game loops (power, life support, radiation, comms). |
| **7 – 8** | **High-Value Feature Driver** | Integrated into specific specialized missions, dynamic narrative branching, or advanced Cadet/Explorer comparison modes. |
| **5 – 6** | **Enrichment / Contextual** | Used for educational debriefs, authentic UI HUD readouts, background visual assets, or optional sandbox scenarios. |
| **1 – 4** | **Impractical / Low Suitability** | Too voluminous, highly volatile, overly academic, or functionally redundant for 7–12 educational gameplay. |

---

# 1. NASA Open APIs (`api.nasa.gov`)

NASA's API portal (`api.nasa.gov`) provides a centralized public gateway to federal space data using the `api.data.gov` umbrella. All endpoints share a common rate-limiting and authentication infrastructure.

### Shared Infrastructure Specifications:
* **Base URL:** `https://api.nasa.gov/`
* **Authentication:** API Key passed as query parameter (`?api_key=YOUR_KEY`).
* **Rate Limits:**
  * `DEMO_KEY`: 30 requests per IP per hour, 50 requests per IP per day.
  * Free Registered Key: 1,000 requests per hour per key (tracked via `X-RateLimit-Limit` and `X-RateLimit-Remaining` HTTP response headers).
  * High-Volume / Educational Exemption: Available via direct request to `api@nasa.gov`.
* **CORS Policy:** Permissive (`Access-Control-Allow-Origin: *`), allowing client-side `fetch()` from static web applications.

---

### 1.1 Astronomy Picture of the Day (APOD)
* **Provider:** NASA / Michigan Technological University (MTU) (Drs. Robert Nemiroff & Jerry Bonnell).
* **Endpoint:** `GET https://api.nasa.gov/planetary/apod`
* **Query Parameters:** `date` (YYYY-MM-DD), `start_date`, `end_date`, `count` (integer for random images), `thumbs` (boolean).
* **Available Data Fields:**
  * `date` (String): YYYY-MM-DD date of publication.
  * `title` (String): Title of featured observation.
  * `explanation` (String): Scientific essay written by professional astronomers.
  * `url` (String): Direct link to standard-resolution image or web video iframe.
  * `hdurl` (String): Direct link to maximum-resolution image asset.
  * `media_type` (String): `"image"` or `"video"`.
  * `service_version` (String): API version (`"v1"`).
  * `copyright` (String, optional): Attribution when image is not public domain.
* **Format:** JSON.
* **Update Frequency:** Daily (00:00 Eastern Time).
* **Auth & Limits:** `api_key` required; 1,000 req/hr.
* **Temporal Scope:** Historical archive from June 16, 1995 to current day (~11,500 entries).
* **Reliability & Limitations:** Extremely high reliability (>99.9% uptime). However, ~15-20% of entries are YouTube/Vimeo video embeds rather than static images, requiring fallback logic in web rendering engines.
* **Preprocessing Needed:** Filter for `media_type === "image"`; cache high-resolution Mars/Moon entries locally to eliminate runtime API rate-limit exhaustion.
* **Gameplay Mechanics:**
  * **Daily Astronaut Briefing / Logbook:** "Image of the Day" reward screen during chapter transitions.
  * **Phenomena Discovery Badges:** Mini-game unlocks when players observe Mars dust storms, lunar craters, or solar coronal loops.
* **Static-Site Feasibility:** **High**. Can be pre-fetched at build time or called asynchronously with graceful cached fallbacks.
* **Priority Ranking:** **6/10** (Excellent visual immersion and daily hook; does not drive core mechanical resource loops).

---

### 1.2 Mars Rover Photos API (Curiosity, Opportunity, Spirit, Perseverance)
* **Provider:** NASA Jet Propulsion Laboratory (JPL).
* **Endpoint:** `GET https://api.nasa.gov/mars-photos/api/v1/rovers/{rover}/photos`
* **Query Parameters:** `sol` (Martian sol integer), `earth_date` (YYYY-MM-DD), `camera` (FHAZ, RHAZ, MAST, CHEMCAM, MAHLI, MARDI, NAVCAM, PANCAM, MINITES), `page` (integer).
* **Available Data Fields:**
  * `id` (Number): Global photo record ID.
  * `sol` (Number): Martian sol of acquisition.
  * `camera` (Object): `{ id: Number, name: String, rover_id: Number, full_name: String }`.
  * `img_src` (String): Canonical HTTP/HTTPS link to JPG raw image.
  * `earth_date` (String): ISO date on Earth.
  * `rover` (Object): `{ id: Number, name: String, landing_date: String, launch_date: String, status: String, max_sol: Number, max_date: String, total_photos: Number }`.
* **Format:** JSON payload wrapping array of photo records.
* **Update Frequency:** Batch updates (daily to weekly as raw downlink arrives from DSN).
* **Auth & Limits:** `api_key` required; 1,000 req/hr.
* **Temporal Scope:** Historical (Spirit 2004–2010, Opportunity 2004–2018) and Active (Curiosity 2012–Present, Perseverance 2021–Present). Over 750,000 images cataloged.
* **Reliability & Limitations:** The legacy API wrapper on `api.nasa.gov` occasionally suffers from server timeouts on high sol numbers. Hosted image URLs point to AWS S3 / JPL mirrors that require explicit HTTPS redirection handling.
* **Preprocessing Needed:** Curate a static index of high-relevance rover inspection photos (e.g., dust-covered solar panels on Opportunity Sol 5105; wheel wear on Curiosity Sol 3000; Jezero delta strata on Perseverance Sol 450) and bundle WebP compressed thumbnails (40–80 kB).
* **Gameplay Mechanics:**
  * **Rover Camera Inspection Mode:** In the Jezero Rover navigation mission, switching camera feeds (FHAZ, NAVCAM, MAST) displays real matched photos of actual Jezero Crater obstacles.
  * **Solar Array Dust Diagnostics:** Visual verification mechanic where the player visually inspects real camera images to assess dust accumulation percentage prior to dispatching cleaning tools.
* **Static-Site Feasibility:** **High** (via curated local asset bundling); **Low** for live querying across hundreds of thousands of raw unindexed records.
* **Priority Ranking:** **8/10** (Bridges 3D virtual environment with ground-truth visual reality for children).

---

### 1.3 Near Earth Object Web Service (NeoWs)
* **Provider:** NASA JPL / Caltech Asteroid Data System.
* **Endpoint:** `GET https://api.nasa.gov/neo/rest/v1/feed`
* **Query Parameters:** `start_date`, `end_date` (max 7-day span), `api_key`.
* **Available Data Fields:**
  * `element_count` (Number): Total asteroids in window.
  * `near_earth_objects` (Object): Keyed by date array containing:
    * `id`, `neo_reference_id`, `name` (String).
    * `absolute_magnitude_h` (Number).
    * `estimated_diameter` (Object): Min/max estimates in km, meters, miles, feet.
    * `is_potentially_hazardous_asteroid` (Boolean).
    * `close_approach_data` (Array):
      * `close_approach_date`, `epoch_date_close_approach`.
      * `relative_velocity`: `{ kilometers_per_second: String, kilometers_per_hour: String }`.
      * `miss_distance`: `{ astronomical: String, lunar: String, kilometers: String }`.
      * `orbiting_body` (String): e.g., `"Earth"`.
* **Format:** JSON.
* **Update Frequency:** Continuously updated as JPL orbital solution databases recalculate.
* **Auth & Limits:** `api_key` required; 1,000 req/hr.
* **Temporal Scope:** 1900 to 2200 ephemeris horizons.
* **Reliability & Limitations:** High uptime. Note that string-encoded numeric values (e.g. `"kilometers": "4521023.12"`) require client-side `parseFloat()`.
* **Preprocessing Needed:** Filter for objects passing within $< 5$ Lunar Distances (`lunar < 5.0`).
* **Gameplay Mechanics:**
  * **Planetary Defense Radar Tracking:** Lunar base perimeter defense training; calculating impact probability vectors and scheduling emergency shelter protocols.
* **Static-Site Feasibility:** **High**.
* **Priority Ranking:** **5/10** (Strong secondary mini-game candidate; tangential to outpost ECLSS management).

---

### 1.4 Earth Polychromatic Imaging Camera (EPIC)
* **Provider:** NASA Goddard Space Flight Center / NOAA DSCOVR Satellite (Lagrange Point L1).
* **Endpoint:** `GET https://api.nasa.gov/EPIC/api/natural` or `/enhanced`
* **Available Data Fields:**
  * `identifier` (String): Timestamp ID.
  * `caption` (String): Camera description.
  * `image` (String): Base image filename (e.g., `epic_1b_20261112012345`).
  * `centroid_coordinates` (Object): `{ lat: Number, lon: Number }` sub-satellite point.
  * `dscovr_j2000_position`, `lunar_j2000_position`, `sun_j2000_position` (Vectors).
  * `attitude_quaternions` (Array).
  * `date` (String): Timestamp.
* **Format:** JSON metadata with image archive paths on `epic.gsfc.nasa.gov/archive/...`.
* **Update Frequency:** Daily (~12 to 22 images downlinked daily from 1.5 million km out).
* **Auth & Limits:** `api_key` required; 1,000 req/hr.
* **Gameplay Mechanics:**
  * **"Looking Back at Home":** Earth observation window in the Outpost Cupola showing the real Earth as seen from space on the current calendar day, driving emotional connection and home-sickness gameplay variables for the crew.
* **Static-Site Feasibility:** **Medium** (High bandwidth for 2048x2048 PNGs; requires pre-generating downscaled 512x512 JPEGs).
* **Priority Ranking:** **5/10** (Beautiful contextual asset for Cupola module).

---

### 1.5 NASA Image and Video Library (`images-api.nasa.gov`)
* **Provider:** NASA Headquarters.
* **Endpoint:** `GET https://images-api.nasa.gov/search?q={query}&media_type=image,video`
* **Available Data Fields:**
  * `collection.items[]`:
    * `data[]`: `nasa_id`, `title`, `description`, `date_created`, `keywords[]`, `center`.
    * `href` (String): Manifest JSON listing asset resolutions (orig, large, medium, small, thumb).
* **Format:** JSON.
* **Auth & Limits:** **No API Key Required**; rate limit is ~100 req/min per IP.
* **Gameplay Mechanics:** Search and display real-world engineering blueprints, astronaut training archival footage (Apollo, Shuttle, Artemis) inside the Astronaut Training Academy logbook.
* **Static-Site Feasibility:** **High**.
* **Priority Ranking:** **6/10**.

---

# 2. NASA DONKI — Space Weather Database of Notifications, Knowledge, Information

**Critical Architectural Alert:** The NASA Space Weather Research Center (CCMC) migrated the primary DONKI REST API on **September 30, 2026**. Legacy wrappers on `api.nasa.gov/DONKI/` are deprecated in favor of direct access at:  
👉 **`https://ccmc.gsfc.nasa.gov/DONKI-API/get/`**

Direct access to the CCMC DONKI-API does not enforce federal API key headers, returns strict `application/json`, and provides unthrottled access to space weather catalogs.

---

### 2.1 Solar Flares (FLR)
* **Provider:** NASA GSFC / CCMC & NOAA Space Weather Prediction Center (SWPC).
* **Endpoint:** `GET https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate={YYYY-MM-DD}&endDate={YYYY-MM-DD}`
* **Available Data Fields:**
  * `flrID` (String): Unique event ID (e.g., `"2024-05-10T06:54:00-FLR-001"`).
  * `beginTime` (ISO 8601 String): Initial X-ray flux increase.
  * `peakTime` (ISO 8601 String): Peak X-ray flux timestamp.
  * `endTime` (ISO 8601 String, nullable): Return to background level.
  * `classType` (String): GOES X-ray classification (e.g., `"X5.8"`, `"X8.7"`, `"M2.4"`, `"C1.1"`).
  * `sourceLocation` (String): Heliographic coordinates (e.g., `"S18W89"`).
  * `activeRegionNum` (Number): NOAA active sunspot region (e.g., `13664`).
  * `instruments` (Array): Observation platforms (e.g., `[{ displayName: "GOES-16: EXIS 1.0-8.0" }]`).
  * `linkedEvents` (Array): Associated CME or SEP event IDs.
  * `link` (String): Web link to event analysis dossier.
* **Format:** JSON array of objects.
* **Update Frequency:** Real-time event logging (within 30–60 minutes of flare detection).
* **Auth & Limits:** Open access on CCMC base; no API key needed.
* **Historical vs. Current:** Full historical database from 2010 to Present; active live tracking.
* **Scientific Limitations:** Flare measurements are acquired from Earth-orbiting GOES spacecraft in the 1–8 Å X-ray band. The prompt electromagnetic radiation reaches Earth and the Moon in ~8.3 minutes, and Mars in ~12–20 minutes. It does not measure particulate proton flux directly, but serves as the earliest warning sign of inbound particles.
* **Preprocessing Needed:** Categorize flare `classType` into clear player-facing alert tiers:
  * $C$-Class: Background / Normal Operations (Green).
  * $M$-Class: Moderate Warning; prep radiation shelters (Yellow).
  * $X$-Class: Severe Hazard; immediate EVA abort and communications blackout warning (Red).
* **Gameplay Mechanics:**
  * **EVA Abort Warning Clock:** When an $X$-class flare is detected, the player receives an emergency prompt. Since light reaches Mars ahead of energetic particles, the player has a realistic 30-to-60-minute in-game window to recall astronauts from the surface to the radiation vault before proton arrival.
* **Static-Site Feasibility:** **Extremely High**.
* **Priority Ranking:** **9/10**.

---

### 2.2 Solar Energetic Particle (SEP) Events
* **Provider:** NASA GSFC / CCMC.
* **Endpoint:** `GET https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP?startDate={YYYY-MM-DD}&endDate={YYYY-MM-DD}`
* **Available Data Fields:**
  * `sepID` (String): e.g., `"2024-05-10T13:35:00-SEP-001"`.
  * `eventTime` (ISO 8601 String): Onset timestamp of proton flux enhancement.
  * `instruments` (Array): `[{ displayName: "GOES-P: SEISS" }]`.
  * `linkedEvents` (Array): Linked flare (`FLR`) and CME IDs.
  * `link` (String): Canonical CCMC analysis URL.
* **Format:** JSON.
* **Data Context in Game:** Already bundled in `public/data/raw/donki-sep-2024-05.json` for the historic Mother's Day May 2024 solar storm!
* **Scientific Limitations:** Measures proton energy thresholds $>10\text{ MeV}$ and $>100\text{ MeV}$ at Earth L1/geostationary orbit. Mars surface doses depend on atmospheric column mass (~$20\text{ g/cm}^2$) and local magnetic crustal anomalies.
* **Gameplay Mechanics:**
  * **Radiation Storm Shelter Management (`solar-shelter` mission):** Directly drives ambient radiation dosage. Astronauts must seal the storm vault, reroute power from science experiments to life support scrubbers, and monitor cumulative dose points until the event subsides.
* **Static-Site Feasibility:** **10/10** (Proven in production via normalized JSON bundle).
* **Priority Ranking:** **10/10** (Core foundation of the radiation gameplay loop).

---

### 2.3 Coronal Mass Ejections (CME) & CME Analysis
* **Provider:** NASA GSFC / CCMC.
* **Endpoints:**
  * `GET https://ccmc.gsfc.nasa.gov/DONKI-API/get/CME`
  * `GET https://ccmc.gsfc.nasa.gov/DONKI-API/get/CMEAnalysis?mostAccurateOnly=true&speed=500&halfAngle=30`
* **Available Data Fields:**
  * `activityID` (String): e.g., `"2024-05-11T02:00:00-CME-001"`.
  * `startTime` (ISO 8601 String).
  * `cmeAnalyses` (Array):
    * `time21_5` (ISO 8601 String): Timestamp CME front crosses 21.5 solar radii.
    * `latitude`, `longitude` (Number): Ejection trajectory angles.
    * `halfAngle` (Number): Cone model half-width in degrees.
    * `speed` (Number): Radial velocity in $\text{km/s}$ (ranges from 300 to $>2500\text{ km/s}$).
    * `type` (String): `'C'` (Common), `'O'` (Occasional), `'R'` (Rare), `'S'` (Severe).
    * `isMostAccurate` (Boolean).
    * `enlilList` (Array): Enlil 3D magnetohydrodynamic solar wind model output.
      * `modelURL` (String): Link to WSA-Enlil simulation movies.
      * `impactList` (Array): Predicted arrival timestamps and impact parameters at specific target bodies (`"Earth"`, `"Mars"`, `"STEREO A"`).
* **Format:** JSON.
* **Update Frequency:** Processed within 2–6 hours of coronagraph observation (SOHO LASCO / STEREO).
* **Gameplay Mechanics:**
  * **Interplanetary Trajectory & Travel Interruption:** In transit missions between Earth and Mars/Moon, a fast CME ($>1500\text{ km/s}$) crossing the spacecraft trajectory requires orientation adjustments (pointing the spacecraft's engine bell or water reserves towards the Sun as a protective shield).
* **Static-Site Feasibility:** **High**.
* **Priority Ranking:** **8/10**.

---

### 2.4 Geomagnetic Storms (GST) & Interplanetary Shocks (IPS)
* **Provider:** NOAA SWPC / NASA CCMC.
* **Endpoints:**
  * `GET https://ccmc.gsfc.nasa.gov/DONKI-API/get/GST`
  * `GET https://ccmc.gsfc.nasa.gov/DONKI-API/get/IPS`
* **Available Data Fields:**
  * `gstID` (String): e.g., `"2024-05-10T18:00:00-GST-001"`.
  * `startTime` (ISO 8601 String).
  * `allKpIndex` (Array):
    * `obsTime` (ISO 8601 String).
    * `kpIndex` (Number): Planetary $K_p$ scale from 0 (quiet) to 9 (extreme storm, G5).
    * `source` (String): e.g., `"NOAA_ESTIMATED"`.
  * `linkedEvents` (Array): Triggering CME and shock IDs.
* **Gameplay Mechanics:**
  * **Lunar Surface Grid Tripping:** Extreme geomagnetic activity induces surface charge differentials in lunar regolith and disrupts orbital communication relays, requiring backup mesh radio deployments.
* **Static-Site Feasibility:** **High**.
* **Priority Ranking:** **7/10**.

---

# 3. NASA OSDR (Open Science Data Repository)

The **NASA Open Science Data Repository (OSDR)** merges GeneLab (spaceflight omics) and ALSDA (Ames Life Sciences Data Archive — physiological, phenotypic, and environmental data).

### API Architecture:
* **Repository Portal:** `https://osdr.nasa.gov/bio/repo/`
* **Search REST API:** `https://osdr.nasa.gov/osdr/data/search?term={keyword}&size={count}`
* **Biological Data API v2:** `https://visualization.osdr.nasa.gov/biodata/api/v2/`
* **Authentication:** **No API Key Required** (Public open science repository).
* **Raw File Storage Mirror:** AWS Open Data Registry S3 bucket (`s3://nasa-osdr/public/`).

---

### 3.1 Plant Biology: Lettuce Crops on ISS (OSD-269 / VEG-03A)
* **Accession ID:** `OSD-269` (formerly `GLDS-269`).
* **Title:** *Microbiological and nutritional analysis of lettuce crops grown on the International Space Station-VEG03A.*
* **Investigator:** Dr. Gioia Massa et al. (NASA Kennedy Space Center).
* **Downloadable Assets:**
  * Study metadata JSON (investigation, study, assay, sample tables).
  * Tabular assay CSVs: Mineral nutrient concentrations (potassium, calcium, magnesium, iron, zinc), antioxidant capacity (TEAC), total phenolics, and anthocyanin pigments.
  * Microbial counts: Total aerobic bacterial and fungal colony-forming units (CFU/g) across space-grown vs. ground-control leaves.
  * Operational logbooks detailing Veggie hardware anomalies (fan setting readouts vs. actual motor status).
* **Scientific Limitations:** Grown in ISS microgravity inside a controlled bellows chamber under red/blue/green LED lighting; plants received nutrient pillows with time-release fertilizer. It is not an unpressurized Martian soil/regolith experiment.
* **Existing Game Integration:** Bundled in `Mission Control Jr/public/data/raw/osdr-osd-269.json` and parsed by `normalize-nasa-data.mjs` to establish the authentic **16:8 light-to-dark photoperiod**.
* **Gameplay Mechanics:**
  * **Greenhouse Photoperiod & Airflow Balancing:** The player must regulate the greenhouse day/night light cycle. If the player leaves lights on 24/7 to boost biomass, plant stress increases. Furthermore, referencing the paper's noted fan failure anomaly, players must verify physical air circulation when humidity spikes to prevent mold proliferation.
* **Static-Site Feasibility:** **10/10** (Proven in codebase).
* **Priority Ranking:** **10/10** (Essential food production system asset).

---

### 3.2 Bone Density Loss & Osteoblast Dynamics (OSD-107 & OSD-310)
* **Accession IDs:**
  * `OSD-107`: *The Role of PTHrP in Osteoblast Response to Microgravity: Implications for Osteoporosis Development.*
  * `OSD-310`: *Rodent Research-1 Cancellous Bone Loss and Marrow Adiposity Histomorphometry.*
* **Downloadable Assets:** Micro-computed tomography ($\mu\text{CT}$) volumetric metrics, cancellous bone volume fraction ($\text{BV/TV}$ in %), trabecular thickness ($\text{Tb.Th}$), trabecular separation ($\text{Tb.Sp}$), osteoclast surface area, and RNA-Seq gene expressions of RUNX2 and Osteocalcin.
* **Scientific Grounding:** Demonstrates an unmitigated bone mineral density loss rate of **1.0% to 1.5% per month** in weight-bearing bones (femur, calcaneus, lumbar vertebrae) during microgravity, accompanied by a shift where mesenchymal stem cells differentiate into marrow fat cells rather than bone-forming osteoblasts.
* **Gameplay Mechanics:**
  * **Astronaut Exercise & Countermeasure Scheduling:** In the long-duration Mars transit chapter, player must allocate crew time to the ARED (Advanced Resistive Exercise Device) resistance trainer and prescribe calcium/vitamin D nutritional rations. Neglecting exercise causes crew bone fragility, resulting in injury during high-$g$ Mars descent.
* **Static-Site Feasibility:** **High** (Extract a 5-row lookup table of bone density decline vs. daily workout minutes).
* **Priority Ranking:** **9/10**.

---

### 3.3 Muscle Atrophy & Sarcopenia (OSD-104 & OSD-243)
* **Accession IDs:**
  * `OSD-104`: *Rodent Research-1 (RR-1) Validation Flight: Soleus Muscle Atrophy and Epigenetic Remodeling.*
  * `OSD-243`: *Rodent Research-6 (RR-6): Muscle Atrophy Mitigation via Sustained Formoterol Nanochannel Delivery.*
* **Downloadable Assets:** Skeletal muscle wet mass (mg), cross-sectional muscle fiber area ($\mu\text{m}^2$), fast-to-slow twitch myosin heavy chain isoform shifts, and proteomic degradation pathways (MuRF-1, Atrogin-1).
* **Scientific Grounding:** Postural slow-twitch muscles (e.g. soleus) lose up to **20% of functional mass within 14–30 days** of disuse if unconditioned, degrading stamina and EVA workload endurance.
* **Gameplay Mechanics:**
  * **Crew Fatigue & Workload Efficiency Meter:** Crew physical stamina scales with muscle condition. High muscle mass allows faster tool manipulation and heavier regolith transport during EVA; depleted muscle increases oxygen consumption and error rates.
* **Static-Site Feasibility:** **High**.
* **Priority Ranking:** **8/10**.

---

### 3.4 Immune Dysregulation & Cytokine Balance (OSD-515)
* **Accession ID:** `OSD-515`: *Spaceflight-induced changes in splenic leukocyte subpopulations and cytokine profiles.*
* **Downloadable Assets:** White blood cell differentials, CD4+/CD8+ T-cell ratios, natural killer cell cytotoxicity assay values, and cytokine concentrations (IL-2, IFN-$\gamma$, TNF-$\alpha$).
* **Scientific Grounding:** Spaceflight suppresses cell-mediated immunity while simultaneously triggering subclinical latent herpesvirus reactivation (EBV, VZV) and cutaneous hypersensitivity.
* **Gameplay Mechanics:**
  * **Quarantine & Sick Bay Diagnosis:** An astronaut exhibits dermatitis or fatigue. The player reviews microbial air filter logs and biological diagnostics to isolate pathogens and administer appropriate treatments.
* **Static-Site Feasibility:** **Medium**.
* **Priority Ranking:** **6/10**.

---

### 3.5 Circadian Rhythm & Sleep Disruption (OSD-479 / Circadian Physiology)
* **Accession ID:** `OSD-479`: *Core body temperature rhythms and circadian clock gene expression during spaceflight.*
* **Downloadable Assets:** Continuous 24-hour core body temperature telemetry (Double-Sensor telemetric capsules), sleep actigraphy logs, salivary melatonin curves, and PER1/PER2/CLOCK transcript profiles.
* **Scientific Grounding:** The absence of natural 24-hour daylight cycles (ISS orbits Earth every 90 minutes; Mars has a 24-hour 39-minute sol) causes circadian desynchronization, reducing REM sleep and impairing cognitive reaction times by 15–25%.
* **Gameplay Mechanics:**
  * **Habitat Lighting Schedule & Sleep Shift Planning:** Player configures dynamic Solid-State Light Modules (Blue-enriched 460–480 nm light during morning shifts to suppress melatonin; low-intensity amber light before sleep). Prevents operator mistakes during critical station docking maneuvers.
* **Static-Site Feasibility:** **High**.
* **Priority Ranking:** **7/10**.

---

### 3.6 Space Radiation Biology & DNA Double-Strand Breaks (OSD-379 & OSD-521)
* **Accession IDs:**
  * `OSD-379`: *Transcriptional profiling of DNA repair and cell cycle arrest following high-charge and energy (HZE) ion irradiation.*
  * `OSD-521`: *Retinal and neural oxidative stress markers in mice exposed to simulated Galactic Cosmic Rays.*
* **Downloadable Assets:** $\gamma$-H2AX foci counts (direct measure of double-strand DNA breaks), 53BP1 expression, apoptosis markers, and reactive oxygen species (ROS) levels.
* **Scientific Grounding:** Galactic cosmic ray heavy ions ($^{56}\text{Fe}$, $^{28}\text{Si}$) produce dense ionization tracks ("core and penumbra") that cause clustered, complex DNA lesions difficult for enzymatic machinery to repair.
* **Gameplay Mechanics:**
  * **Cellular Repair Mini-Game / Medical Debrief:** In the Explorer difficulty tier, players inspect simulated DNA damage meters following a radiation event, comparing simple single-strand breaks from medical X-rays against complex clusters from space heavy ions.
* **Static-Site Feasibility:** **Medium**.
* **Priority Ranking:** **7/10**.

---

# 4. NASA RadLab (Radiation Laboratory Data API)

NASA’s **RadLab** platform centralizes space radiation dosimetry telemetry recorded across decades of space missions, with heavy focus on the International Space Station.

* **Base URL:** `https://visualization.osdr.nasa.gov/radlab/api`
* **Interactive Portal:** `https://visualization.osdr.nasa.gov/radlab/gui/`
* **Authentication:** **None** (Open HTTP GET REST API).
* **Available Instruments in Database:**
  * `DosTel1`, `DosTel2`: DOSimetry TELescopes (DLR / Germany).
  * `Lidal`: Light Ion Detector for ALTEA (ASI / Italy).
  * `Liulin-5-D1`: Spectrometric dosimeter telescope (BAS / Bulgaria).
  * `REM-Lid`: Radiation Environment Monitor.
  * `TEPC`: Tissue Equivalent Proportional Counter (NASA JSC).
  * `CPDS`: Charged Particle Directional Spectrometer.

### RadLab API Query Parameters & Response Structure:
* **Query Format:** `https://visualization.osdr.nasa.gov/radlab/api?spacecraft=ISS&instrument_id=DosTel1&timestamp>={start}&timestamp<={end}`
* **Response Attributes:**
  * `timestamp` (ISO 8601 String).
  * `instrument_id` (String).
  * `spacecraft` (String): `"ISS"`.
  * `module` (String): e.g., `"Columbus"`, `"US Lab"`, `"Cupola"`, `"Service Module"`.
  * `absorbed_dose_rate` (Number): Expressed in **$\mu\text{Gy/hour}$**.
  * `dose_equivalent_rate` (Number): Expressed in **$\mu\text{Sv/hour}$** ($H = D \times Q$).
  * `latitude`, `longitude`, `altitude` (Number): Spacecraft orbital coordinates at moment of record.
  * `flux` (Number): Particle counts per $\text{cm}^2 \cdot \text{s} \cdot \text{sr}$.

---

### Comparative Analysis: Orbital Geometry & Shielding Discrepancies
RadLab telemetry reveals two profound scientific phenomena vital for gameplay:

```
[Quiet Orbit: High Shielding]  -> Absorbed Dose: ~4 to 8 µGy/hr
[Quiet Orbit: Low Shielding]   -> Absorbed Dose: ~12 to 20 µGy/hr (Cupola)
[South Atlantic Anomaly (SAA)] -> Absorbed Dose: Spikes to 200 - 1,500 µGy/hr!
```

1. **The South Atlantic Anomaly (SAA):** As the ISS passes through longitudes $40^\circ\text{W}$ to $0^\circ$ and latitudes $10^\circ\text{S}$ to $40^\circ\text{S}$, the Earth's inner Van Allen belt dips down to 200–400 km altitude. Trapped proton flux increases radiation exposure by **100x to 1,000x** for a duration of 10–15 minutes per orbit.
2. **Module Shielding Thickness ($g/\text{cm}^2$):** DOSTEL in the heavily shielded interior of the *Columbus* rack records significantly lower baseline GCR dose rates compared to sensors situated near the unshielded windows of the *Cupola*.

### Gameplay Mechanics:
* **Orbital Hazard Pass Clock / SAA Traversal:** In an orbital training simulation, the player tracks the orbital ground track. When approaching the SAA or an active solar storm, astronauts must move from vulnerable observation cupolas into the reinforced central core.
* **Shielding Material Allocation:** Players choose whether to line habitat walls with lead, polyethylene, or greywater tanks. RadLab data validates that hydrogen-rich water shields are vastly superior to heavy metals for absorbing secondary neutron backscatter.
* **Static-Site Feasibility:** **10/10** (Extract an authentic 24-hour time series of ISS DosTel/Lidal readings showing 16 orbital revolutions and 6 SAA passes, bundled as a 25 kB JSON).
* **Priority Ranking:** **10/10** (Authoritative empirical validation for the radiation simulation engine).

---

# 5. NASA / JPL Horizons Ephemeris System

The JPL Horizons system provides high-precision ephemerides for solar system bodies, calculating positions, velocities, and light travel times based on numerical integration models (DE440/DE441).

* **Web Portal:** `https://ssd.jpl.nasa.gov/horizons/`
* **REST API Endpoint:** `https://ssd.jpl.nasa.gov/api/horizons.api`
* **Authentication:** **None** (Open HTTP GET).
* **Format:** JSON wrapper (`format=json`) containing plain-text structured tabular blocks in the `result` field.

### Critical Query Parameters for Light-Time:
To retrieve the exact one-way light time between Earth and Mars or Moon:
```http
GET https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='499'&OBJ_DATA='YES'&MAKE_EPHEM='YES'&EPHEM_TYPE='OBSERVER'&CENTER='500@399'&START_TIME='2026-11-14'&STOP_TIME='2026-11-16'&STEP_SIZE='1d'&QUANTITIES='21'
```
* `COMMAND`: Target body ID (`'499'` for Mars center, `'301'` for Moon center, `'4'` for Mars System Barycenter).
* `CENTER`: Observer coordinate center (`'500@399'` for Earth geocenter, `'399'` for Earth body center, `'0@10'` for Sun).
* `EPHEM_TYPE`: `'OBSERVER'`.
* `QUANTITIES`: `'21'` (Down-leg One-Way Light-Time `1-way_down_LT` and target range `delta`), or `'9'` (Light time and range-rate).

### Field Names & Extraction Pattern:
Within the response `result` string block between `$$SOE` (Start of Ephemeris) and `$$EOE` (End of Ephemeris):
* Column 1: `Date__(UT)__HR:MN` (e.g., `2026-Nov-14 00:00`).
* Column 2: `1-way_down_LT` (Minutes of light travel time, e.g., `18.625410`).
* Column 3: `delta` (Distance in Astronomical Units $\text{AU}$, e.g., `2.241029`).
* Column 4: `deldot` (Range-rate in $\text{km/s}$).

### Range of One-Way Light Times:
* **Earth to Moon:** **$1.25$ to $1.35$ seconds** (~$384,400\text{ km}$). Round-trip latency is ~$2.6$ seconds.
* **Earth to Mars:**
  * Minimum (Opposition / Closest Approach): **~$3.1$ to $4.3$ minutes** (~$56\text{ million km}$).
  * Maximum (Superior Conjunction / Opposite sides of Sun): **~$21.0$ to $22.4$ minutes** (~$400\text{ million km}$).
  * Round-trip latency: **~$6.2$ minutes to ~$45.0$ minutes**!

### Existing Game Integration:
Bundled in `Mission Control Jr/public/data/raw/horizons-mars-earth-2026-11.txt` and `horizons-moon-earth-2026-11.txt`. Normalized in `scripts/normalize-nasa-data.mjs` extracting the exact November 14, 2026 baseline.

### Gameplay Mechanics:
* **Asynchronous Deep Space Telemetry & Command Delay (`earth-delay` mission):**
  * When a crisis occurs, requesting advice from Earth Mission Control does not return instant help. The request packet takes $N$ minutes to travel to Earth, engineers take time to process, and the command takes $N$ minutes to return.
  * In Cadet mode: Scaled to 5–15 seconds to teach the principle of waiting.
  * In Explorer mode: Full authentic minutes buffer, forcing the player to take emergency local autonomous action rather than waiting for ground control!
* **Static-Site Feasibility:** **10/10** (Already operational).
* **Priority Ranking:** **10/10** (Core scientific signature of the game).

---

# 6. NASA Mars Trek & Planetary Treks (WMTS / DTM)

NASA’s Solar System Treks project (`trek.nasa.gov`) provides web-based mapping, 3D visualization, and spatial analysis tools for planetary surfaces utilizing standardized OGC (Open Geospatial Consortium) services.

* **Base Portal:** `https://trek.nasa.gov/mars/`
* **WMTS Capabilities XML:** `https://trek.nasa.gov/tiles/Mars/EQ/WMTSCapabilities.xml`
* **WMTS RESTful Tile Pattern:**
  ```http
  https://trek.nasa.gov/tiles/Mars/EQ/{Layer_ID}/1.0.0/default/default028mm/{z}/{y}/{x}.png
  ```
* **Authentication:** **None** (Publicly accessible).

---

### 6.1 Jezero Crater HiRISE DTM (Digital Terrain Model)
* **Dataset Identifier:** `DTEEC_023524_1985_023379_1985_U01`
* **Originating Instrument:** High Resolution Imaging Science Experiment (HiRISE) on Mars Reconnaissance Orbiter (MRO) / University of Arizona.
* **Resolution:** **1.0 meter per pixel horizontal resolution**, with sub-meter vertical precision derived from stereo photogrammetry pairs.
* **Geographic Coverage:** Jezero Crater Western Fan Delta deltaic deposits ($18.38^\circ\text{N}$, $77.58^\circ\text{E}$).
* **Format:** Available as floating-point PDS IMG / GeoTIFF, or as pre-rendered hillshade/elevation color tiles via WMTS.
* **Existing Game Integration:**
  * Window extracted via HTTP range read (240 lines $\times$ 210 samples), filtered with a $3\times3$ box filter, downsampled to 2-meter spacing, and stored as an array of relative heights in `data/jezero-terrain.js`.
* **Gameplay Mechanics:**
  * **3D Rover Driving Physics & Elevation Obstacle Navigation:** The player steers the Mars rover across actual Jezero crater delta topography. Slopes exceeding $15^\circ$ increase motor power draw and trigger slip hazards; deep depressions cast communication shadows.
* **Static-Site Feasibility:** **10/10** (Pre-extracted height grid represents the ideal architecture for Three.js terrain meshes).
* **Priority Ranking:** **10/10** (Essential spatial framework for the Mars campaign).

---

### 6.2 LOLA (Lunar Orbiter Laser Altimeter) South Polar Illumination
* **Provider:** NASA GSFC / Lunar Reconnaissance Orbiter (LRO) LOLA Science Team.
* **Product Reference:** `AVGVISIB_85S_060M_201608` (NASA Planetary Geodynamics Data Archive Product 69).
* **URL:** `https://pgda.gsfc.nasa.gov/products/69`
* **Format:** Polar stereographic raster, 60 meters per pixel, covering $85^\circ\text{S}$ to $90^\circ\text{S}$.
* **Data Context:** Models the percentage of time that each point on the lunar south pole receives solar illumination over an entire **18.6-year lunar orbital precession cycle**.
* **Existing Game Integration:**
  * Stored in `Mission Control Jr/public/data/raw/lunar-illumination/patches.json`. Verified with SHA-256 integrity checks, averaging $5\times5$ pixel patches to supply illumination percentages.
* **Gameplay Mechanics:**
  * **Lunar Base Site Selection & Solar Tower Siting (`lunar-sunlight` mission):**
    * The player must select where to erect photovoltaic towers and landing pads near the rim of Shackleton or Malapert Mountain. Sites with $>80\%$ illumination provide steady power; sites inside permanently shadowed regions (PSRs) offer cold ice traps for water harvesting but zero solar power.
* **Static-Site Feasibility:** **10/10** (Proven in codebase).
* **Priority Ranking:** **10/10** (Essential for Moon base resource mechanics).

---

# 7. Canadian Space Agency (CSA) STEM & Space Agriculture Resources

The Canadian Space Agency (CSA-ASC) has developed specialized educational toolkits and data challenges that connect long-duration space food production directly with isolated terrestrial agriculture.

* **STEM Educator Portal:** `https://www.asc-csa.gc.ca/eng/youth-educators/resources-stem-and-youth-organizations.asp`
* **Food Production Toolkit:** `https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/`
* **Target Audience:** Educators and youth (Ages 6 to 14, perfectly aligned with our 7–12 cohort).

---

### 7.1 Tomatosphere™ Educational Database
* **Partners:** CSA, Let's Talk Science, University of Guelph, HeinzSeed, NASA.
* **Program Overview:** Over 3 million students across Canada and the US have grown tomato seeds (*Solanum lycopersicum*) flown in space (ISS or shuttle missions) alongside terrestrial control groups in blind double-blind experiments.
* **Available Data & Metrics:**
  * Seed germination rates (%) across space-exposed vs. Earth baseline seeds.
  * Germination time curves (days to cotyledon emergence).
  * Seedling vigor, stem height, and leaf count distributions.
  * Thermal and vacuum exposure stress telemetry of the seed payloads.
* **Pedagogical Alignment:** Teaches children the scientific method, variable isolation, blind experimentation, and statistical sample variation.
* **Gameplay Mechanics:**
  * **Blind Crop Experimentation Mini-Game:** Players receive two unlabelled seed canisters ("Batch Alpha" and "Batch Beta"). They plant both, log germination rates over in-game sols, and determine which batch suffered cosmic radiation damage during deep space transit.
* **Static-Site Feasibility:** **High** (Compact statistical curves easily represented in JSON).
* **Priority Ranking:** **8/10**.

---

### 7.2 Deep Space Food Challenge & CANGrow System
* **Partners:** CSA, NASA Centennial Challenges, Impact Canada.
* **Innovation Focus:** Modular, autonomous indoor controlled-environment food production systems capable of producing fresh food for a crew of 4 on a 3-year Mars mission without resupply.
* **System Metrics (CANGrow & Winners):**
  * Resource conversion ratios: Liters of water and kWh of electrical power required per kilogram of edible biomass.
  * Multi-crop chamber allocations: Dwarf tomatoes, microgreens, culinary herbs, and polyculture micro-fungal/algal protein reactors.
  * Waste biomass recycling efficiency.
* **Gameplay Mechanics:**
  * **Modular Greenhouse Expansion:** In the Base Boss or late-stage outpost campaign, player selects which agricultural modules to install (Fast-growing radishes for quick vitamin C vs. high-calorie protein bioreactors that consume more electrical power).
* **Static-Site Feasibility:** **High**.
* **Priority Ranking:** **8/10**.

---

# 8. Mission Surface, Engineering & Telemetry Datasets

---

### 8.1 Curiosity RAD (Radiation Assessment Detector) Surface Telemetry
* **Provider:** NASA JPL / Southwest Research Institute (SwRI) / PDS PPI Node.
* **PDS Archive:** `https://ppi.pds.nasa.gov/` under Mars Science Laboratory RAD bundles.
* **Reference Event:** May 20, 2024 (Sol 4191) Solar Particle Event at Mars.
* **Surface Metrics:**
  * Baseline Galactic Cosmic Ray (GCR) absorbed dose on Mars surface: **~210 $\mu\text{Gy/day}$** (~0.21 mGy/day).
  * Biological dose equivalent: **~0.64 to 0.67 $\text{mSv/day}$**.
  * May 20, 2024 extreme event: Single-event absorbed dose peaked at **$8,100\ \mu\text{Gy}$** ($8.1\text{ mGy}$), producing scintillation camera noise across Curiosity's navigation and hazard cameras.
* **Existing Game Integration:** Bundled in `public/data/raw/curiosity-rad-2024-05-20.json` and utilized in the Base Boss scenario to calibrate the outdoor radiation danger baseline.
* **Gameplay Mechanics:**
  * Sets the real-world baseline for surface EVA radiation risk. Outdoor exposure points accumulate at a rate calibrated to Curiosity's actual Gale Crater dosimeter.
* **Static-Site Feasibility:** **10/10**.
* **Priority Ranking:** **10/10**.

---

### 8.2 Opportunity Rover Atmospheric Opacity ($\tau$) & Solar Power Loss
* **Provider:** NASA JPL MER Team / PDS Geosciences Node (`atmos.nmsu.edu`).
* **Dataset:** MER-1 Pancam 440 nm / 880 nm Optical Depth ($\tau$) and Power Subsystem Assembly (PSA) daily energy generation (Watt-hours).
* **Reference Timeline:** June 1 to June 10, 2018 (Sols 5103 to 5111) — The Planet-Encircling Dust Storm that concluded Opportunity's 14.5-year mission.
* **Telemetry Data Points:**
  * Sol 5103 (June 1): Pre-storm baseline; $\tau \approx 0.6$; Daily Energy = $645\text{ Wh}$.
  * Sol 5105 (June 3): Dust arriving; $\tau \approx 1.4$; Daily Energy = $345\text{ Wh}$.
  * Sol 5107 (June 5): Heavy obscuration; $\tau \approx 3.0$; Daily Energy = $133\text{ Wh}$.
  * Sol 5109 (June 8): Extreme darkness; $\tau \approx 8.0$; Daily Energy = $42\text{ Wh}$.
  * Sol 5111 (June 10): Communications lost; $\tau > 10.8$; Daily Energy = $22\text{ Wh}$ (insufficient to operate battery survival heaters).
* **Existing Game Integration:** Hardcoded mathematical curve in `data/opportunity-2018.js` and referenced in `public/data/provenance.json`.
* **Gameplay Mechanics:**
  * **Dust Storm Emergency Power Management (`storm` mission):** The player experiences the exact mathematical decay curve of Opportunity's real solar panels. As sunlight plummets from 100% to 3%, the player must shut down rover battery chargers, turn off non-essential lights, and redirect remaining battery power to the habitat seal and thermal loop.
* **Static-Site Feasibility:** **10/10**.
* **Priority Ranking:** **10/10**.

---

### 8.3 NASA ECLSS (Environmental Control and Life Support System) Engineering Baselines
* **Provider:** NASA Marshall Space Flight Center (MSFC) & Johnson Space Center (JSC).
* **Authoritative Reference:** NASA/TP-2015-218570/REV2 (*Life Support Baseline Values and Assumptions Document* - BVAD), NTRS record `20210024855`.
* **Empirical Engineering Milestones:**
  * Crew Consumables per Person-Day:
    * Oxygen consumption: **$0.84\text{ kg/day}$**.
    * Drinking water requirement: **$2.50\text{ kg/day}$** ($2.5\text{ L/day}$).
    * Food dry mass: **$0.62\text{ kg/day}$** (yielding ~$3,000\text{ kcal}$).
    * Carbon dioxide generated: **$1.00\text{ kg/day}$**.
  * Water Recovery System (WRS) Loop Closure:
    * Baseline (WPA + UPA): **$93\% - 94\%$** recovery from humidity condensate and urine distillate.
    * Advanced Exploration Target (WPA + UPA + Brine Processor Assembly BPA): **$98\%$ water recovery milestone** demonstrated on ISS in 2023–2024.
* **Existing Game Integration:** Referenced in `Mission Control Jr/public/data/raw/ntrs-20210024855.json`.
* **Gameplay Mechanics:**
  * **Life Support Mass Balance Equations:** In the Base Boss mission, the player balances daily oxygen generation (via Sabatier and electrolysis) and water recycling. A failure in the brine processor causes water reserves to drop by $2\%$ each sol, creating a countdown clock for filter replacement.
* **Static-Site Feasibility:** **10/10**.
* **Priority Ranking:** **10/10**.

---

### 8.4 NASA Blue Ghost CLPS 2025 Electrodynamic Dust Shield (EDS)
* **Provider:** NASA Kennedy Space Center / Firefly Aerospace Blue Ghost Mission 1.
* **Reference Source:** NASA Mission Operations Log 2025-03-04.
* **Technology Overview:** The Electrodynamic Dust Shield (EDS) uses high-voltage, low-current traveling dielectric waves across embedded micro-electrodes to loft and clear abrasive lunar regolith from optical glass, visor surfaces, and thermal radiators without mechanical contact or water.
* **Existing Game Integration:** Stored in `data/raw/nasa-blue-ghost-eds-2025.html` and used by `lunar-dust`.
* **Gameplay Mechanics:**
  * **Airlock Dust Mitigation Protocol (`lunar-dust` mission):** Returning astronauts are covered in jagged, electrostatically charged lunar dust. Player activates EDS electrostatic grids, sequences air showers, and monitors airlock HEPA filters to prevent pulmonary toxicity in the habitat.
* **Static-Site Feasibility:** **10/10**.
* **Priority Ranking:** **9/10**.

---

### 8.5 NASA Glenn SCaN Lunar Surface Radio Propagation Models
* **Provider:** NASA Glenn Research Center / Space Communications and Navigation (SCaN) Program.
* **Reference Source:** NASA Glenn Lunar Surface Propagation technical investigation.
* **Data Context:** Models ultra-high frequency (UHF) and S-band ground-to-ground radio attenuation over undulating lunar regolith, taking into account lack of ionosphere and severe knife-edge diffraction over crater rims.
* **Existing Game Integration:** Bundled in `data/raw/nasa-lunar-propagation.html` and utilized by `lunar-relay`.
* **Gameplay Mechanics:**
  * **Relay Satellite & Ridge Node Positioning (`lunar-relay` mission):** Direct line-of-sight communication is blocked by crater topography. Player must orient rover directional antennas toward orbital relay satellites or place solar-powered relay transceivers along elevated crater rims to maintain connection to Earth.
* **Static-Site Feasibility:** **10/10**.
* **Priority Ranking:** **9/10**.

---

# 9. Real-Data-to-Gameplay Mapping Master Table

The following master table synthesizes every analyzed dataset, defining the exact transformation pipeline from raw scientific telemetry to player-facing gameplay mechanics in *Mission Control Jr.*:

| Dataset / Source ID | Agency / Provider | Raw Data Format | Key Fields Extracted | Game Subsystem | Target Mission(s) | Player-Facing Gameplay Mechanic & Consequence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DONKI Solar Flares (`FLR`)** | NASA CCMC | JSON REST API | `flrID`, `classType`, `peakTime`, `sourceLocation` | Hazard Warning | `solar-shelter`, `extended` | **EVA Abort Warning Clock:** $X$-class flare detection gives player a 30-min window before particle arrival to recall surface crews. |
| **DONKI Particle Events (`SEP`)** | NASA CCMC | JSON REST API | `sepID`, `eventTime`, `energy`, `instruments` | Radiation Loop | `solar-shelter`, `base-boss` | **Radiation Vault Lockdown:** Drives outdoor microgray surge; player must seal blast doors and redirect power to scrubbers. |
| **DONKI Coronal Mass Ejections (`CME`)** | NASA CCMC | JSON REST API | `speed`, `halfAngle`, `time21_5`, `impactList` | Transit Hazards | Campaign Travel | **Interplanetary Storm Shielding:** Fast CMEs ($>1500\text{ km/s}$) force ship orientation adjustments to place water tanks sunward. |
| **OSDR Veggie Lettuce (`OSD-269`)** | NASA OSDR | JSON / Tabular CSV | Photoperiod (`16:8`), nutrient concentrations, fan anomaly | Food & Agriculture | `greenhouse`, `base-boss` | **Crop Photoperiod & Airflow:** Player balances 16-hour light cycles; detects silent fan failures when leaf moisture spikes. |
| **OSDR Bone Loss (`OSD-107/310`)** | NASA OSDR | $\mu\text{CT}$ / RNA-Seq | Cancellous bone fraction ($\text{BV/TV}$), osteoblast activity | Human Health | Training / Transit | **Exercise Scheduling:** Player assigns daily 2-hour ARED workouts; prevents bone mineral deconditioning before landing. |
| **OSDR Muscle Atrophy (`OSD-104/243`)** | NASA OSDR | Microarray / Histology | Muscle mass wet weight, soleus fiber cross-section | Physical Stamina | `rover`, EVA tasks | **Workload & Fatigue Meter:** Muscle atrophy reduces EVA digging speed and increases suit oxygen consumption rate. |
| **RadLab ISS Dosimetry** | NASA OSDR / RadLab | JSON Time-Series | `timestamp`, `absorbed_dose_rate` ($\mu\text{Gy/hr}$), `module` | Habitat Architecture | `solar-shelter`, Base Boss | **Modular Shielding Validation:** Verifies that central water-shielded modules experience 10x lower dose than glass cupolas. |
| **JPL Horizons Ephemeris** | NASA JPL | JSON / Text Ephemeris | `1-way_down_LT` (minutes), `delta` ($\text{AU}$) | Comms Latency | `earth-delay`, `lunar-relay` | **Light-Speed Delay Buffer:** Earth assistance messages suffer 3–22 min latency; forces local tactical decision-making. |
| **HiRISE Jezero Crater DTM** | NASA MRO / UA | 1m/px 16-bit DTM | Stereo heights relative to areoid | 3D Rover Physics | `rover`, Outpost Scene | **Topographic Slope & Hazard Driving:** High slopes cause wheel slippage; terrain depressions block direct line-of-sight. |
| **LOLA Lunar Illumination** | NASA GSFC / LRO | 60m/px Polar Raster | Mean fraction of 18.6-yr solar visibility | Solar Power | `lunar-sunlight` | **Solar Tower Placement:** Player sites solar arrays on crater rims ($>80\%$ light); balances dark crater floor ice extraction. |
| **Opportunity 2018 Dust Storm** | NASA JPL MER | PDS Opacity & Telemetry | Sol-by-sol optical depth $\tau$, Daily Energy (Wh) | Emergency Power | `storm`, `orbit` | **Dust Storm Battery Survival:** Sunlight drops from 100% to 3%; player must shed non-critical loads to keep heaters alive. |
| **Curiosity RAD May 2024 Event** | NASA JPL / SwRI | PDS Plasma Node | Surface absorbed dose ($8,100\ \mu\text{Gy}$), background dose | Radiation Baseline | Base Boss, `solar-shelter` | **Surface Danger Calibration:** Outdoor exposure calibrated to real Mars surface detector data during severe solar storm. |
| **NASA ECLSS Baseline (BVAD)** | NASA MSFC / JSC | NTRS Technical Report | $0.84\text{ kg } \text{O}_2/\text{day}$, $2.5\text{ L }\text{H}_2\text{O}/\text{day}$, 98% loop closure | Consumables Budget | Base Boss, Life Support | **Mass-Balanced Life Support:** Oxygen and water consumption follow NASA human standards; models 98% recycling efficiency. |
| **Blue Ghost CLPS EDS (2025)** | NASA KSC / Firefly | Technical Mission Report | Electrodynamic dust lofting from glass and radiators | Contamination Loop | `lunar-dust` | **Electrostatic Airlock De-Dusting:** Activating high-voltage wave grids removes razor-sharp lunar regolith from suits. |
| **Glenn SCaN Surface Propagation** | NASA Glenn | Technical Radio Report | Knife-edge obstacle attenuation, line-of-sight loss | Radio Comms | `lunar-relay` | **Relay Antenna Network:** Player positions repeater nodes along crater rims to bounce signals over terrain obstructions. |
| **CSA Food Production Toolkit** | CSA / ASC | Curriculum & Study Guides | Controlled agriculture yields, CANGrow modular ratios | Food System | `greenhouse` | **Controlled Agriculture Scaling:** Modular indoor farm expansion balancing energy draw vs. crew caloric intake. |
| **Tomatosphere™ Seed Database** | CSA / Let's Talk Science | Statistical Field Studies | Germination rate (%), days to emerge, radiation stress | Science Discovery | Training Academy | **Blind Seed Trial Experiment:** Player investigates radiation-damaged vs. control seeds, charting growth variations. |
| **NASA APOD API** | NASA / MTU | Daily JSON Feed | `hdurl`, `title`, `explanation`, `media_type` | Visual Immersion | Journey Hub Logbook | **Astronaut Picture of the Day:** Rewarding mission completion with real astronomical observations and scientist notes. |
| **Mars Rover Photos API** | NASA JPL | JSON Image Feed | `img_src`, `sol`, `camera` (FHAZ, NAVCAM, MAST) | Visual Inspection | `rover`, `storm` | **Ground-Truth Camera Feeds:** Player verifies terrain hazards and panel dust accumulation using actual rover imagery. |

---

# 10. Architectural Integration Strategy for Static-Site Deployment

*Mission Control Jr.* is built with a lightweight, ultra-reliable static-site architecture (**Vite + Three.js + Vanilla ES Modules**) hosted on modern CDNs without requiring backend database servers. To ensure instantaneous loading, zero runtime API rate-limit failures, and offline classroom resilience, we evaluate three integration models:

```mermaid
flowchart TD
    subgraph BuildPipeline ["Build-Time Data Ingestion & Validation"]
        RawAPI["NASA & Space APIs (DONKI, Horizons, OSDR, LOLA, PDS)"] --> FetchScript["scripts/normalize-nasa-data.mjs"]
        FetchScript --> HashCheck{"SHA-256 Check & Verification"}
        HashCheck -->|Pass| CleanJSON["public/data/normalized.json"]
        HashCheck -->|Pass| ProvenanceDoc["public/data/provenance.json"]
        HashCheck -->|Mismatch| BuildFail["Halt Build with Error"]
    end

    subgraph RuntimeBrowser ["Client-Side Browser Execution"]
        CleanJSON --> AppInit["Game Engine Startup"]
        ProvenanceDoc --> SourcesModal["Sources & Data Provenance UI"]
        AppInit --> SimEngine["simulation/resources.js & clocks"]
        SimEngine --> MissionHUD["Child-Friendly HUD & Decision Engine"]
    end
```

### Evaluation of Architecture Paradigms:

#### Architecture A: Live Direct Client-Side Fetching
* *Mechanism:* Browser executes `fetch('https://api.nasa.gov/...')` directly from player devices.
* *Pros:* Displays real-time data from the current calendar day.
* *Cons:* **Critical Failure Risk in Educational Environments**. School firewalls frequently block external API endpoints; hitting the shared `DEMO_KEY` limit locks out entire classrooms simultaneously; CORS policies and API migrations (like DONKI 2026) break gameplay without warning.
* *Verdict:* **Rejected for core game loops**.

#### Architecture B: Build-Time Ingestion & Normalization (The Chosen Standard)
* *Mechanism:* Node.js build scripts (`scripts/normalize-nasa-data.mjs`) fetch, validate, transform, and freeze space datasets into deterministic, compressed JSON assets with strict SHA-256 cryptographic hashes.
* *Pros:*
  * **100% Offline Capability:** Operates flawlessly in isolated school computer labs and offline exhibition kiosks.
  * **Sub-Millisecond Loading:** Zero runtime HTTP network latency.
  * **Complete Data Integrity:** Cryptographic hashing prevents corrupted or altered scientific baselines.
  * **Pedagogical Reproducibility:** Every student experiences identical scientific conditions, enabling classroom competition and discussion.
* *Verdict:* **Adopted as Primary Production Architecture**.

#### Architecture C: Progressive Live Augmentation (Hybrid Polish)
* *Mechanism:* The game relies on bundled local data for all gameplay calculations, but optionally executes an asynchronous background check for non-critical visual assets (e.g., today's APOD image or real-time solar flare status). If the network request fails, it silently defaults to the bundled asset without alerting or stalling the player.
* *Verdict:* **Adopted for Visual Polish & Daily Rewards**.

---

## 11. Final Implementation Recommendations for Mission Control Jr.

1. **Maintain Strict Provenance Accounting:** Expand `public/data/provenance.json` with the new datasets identified in this evaluation (RadLab ISS dosimetry, Curiosity RAD Gale Crater May 2024 spike, CSA Tomatosphere rates). Every number shown to a child must clearly indicate whether it is an **empirical NASA measurement** or an **authored gameplay calibration**.
2. **Implement Dual-Tier Presentation (Cadet vs. Explorer):**
   * **Cadet Tier (Ages 7–9):** Simplified qualitative meters (Green/Yellow/Red indicators, light delay represented in seconds, simplified oxygen/water units).
   * **Explorer Tier (Ages 10–12):** Numerical readouts with authentic scientific units ($\mu\text{Gy/hr}$ for radiation, minutes for light-time delay, $\tau$ optical depth, and kilograms/liters mass balance).
3. **Preserve High-Value Preprocessing Pipelines:** Keep procedural heightmap sampling (HiRISE Jezero DTM) and 18.6-year lunar illumination raster patches locally compiled within the repository to maintain zero-dependency 60 FPS Three.js rendering performance.
