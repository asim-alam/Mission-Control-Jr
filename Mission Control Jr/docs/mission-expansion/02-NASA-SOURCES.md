# NASA materials and data contracts

Research checked 8 November 2026. These are independent implementation recommendations, not a transcription of the challenge's Resources tab. The linked NASA pages/documentation were researched; no mission-ready raw data package was downloaded or validated by this planning task. An implementation agent must obtain and verify the selected records before making data-driven claims.

## Source registry

| ID | Primary source | Verified scientific basis | Implementation use |
|---|---|---|---|
| S01 | [NASA Space Apps challenge](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/) | Outpost decisions for ages 7–12, covering life support, shielding, power, food, and delay | Requirements traceability; user-supplied PDF contains the full Details brief |
| S02 | [NASA CCMC DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/) | Cataloged space-weather observations/analyses and linked events | M04 archived event card and scenario selection |
| S03 | [NASA Life Support Baseline Values and Assumptions, 2022](https://ntrs.nasa.gov/citations/20210024855) | Engineering reference assumptions for life-support studies | Documented reference basis for existing upkeep and new air/food budgets |
| S04 | [NASA OSDR OSD-269](https://osdr.nasa.gov/bio/repo/data/studies/OSD-269) | ISS lettuce study, cultivation protocol, and fresh-food supplementation context | M05 lighting schedule and established-crop/harvest explanation |
| S05 | [JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html), [manual](https://ssd.jpl.nasa.gov/horizons/manual.html) | Ephemerides and observer one-way light-time | M06 geometry-derived light-time; optional L03 lunar counterpart |
| S06 | [Curiosity REMS archive](https://atmos.nmsu.edu/data_and_services/atmospheres_data/MARS/curiosity/rems.html) | Calibrated local meteorological observations | Optional thermal inputs, with site/time/units/quality retained |
| S07 | [NASA GSFC Lunar Polar Illumination](https://pgda.gsfc.nasa.gov/products/69), [LOLA PDS](https://pds-geosciences.wustl.edu/missions/lro/lola.htm) | Topography-derived illumination and Earth-visibility products; published summaries can be long-period averages | L01 site comparison and L03 reference overlay; resolution and temporal meaning must be preserved |
| S08 | [LRO Diviner archive](https://pds-geosciences.wustl.edu/missions/lro/diviner.htm) | Lunar surface thermal products | Optional L01 temperature context; no cabin temperature claim |
| S09 | [NASA lunar south-pole environment](https://www.nasa.gov/reference/moonbase-environment/) | Low solar elevation and terrain produce difficult lighting/thermal conditions | L01 setting and power trade-off; educational narrative, not a data feed |
| S10 | [NASA Blue Ghost surface-operations report, March 2025](https://www.nasa.gov/blogs/missions/2025/03/04/blue-ghost-begins-surface-operations-captures-descent-video-sunrise/) | EDS demonstration removed regolith from glass and thermal-radiator surfaces | L02 dust-control technology inspiration; prototype rack is fictional |
| S11 | [NASA Lunar Surface Propagation](https://www.nasa.gov/glenn/glenn-expertise-space-exploration/scan/lunar-surface-propagation/) | Low Earth visibility and terrain complicate lunar communications | L03 obstruction/link-availability mechanism |
| S12 | [NASA Orion crew systems](https://www.nasa.gov/reference/crew-systems/), [radiation shelter discussion](https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/) | Existing supplies can contribute to a temporary shelter | M04 move-and-arrange shielding mechanic; fictional habitat layout |
| S13 | [NASA on lunar weather](https://www.nasa.gov/general/is-there-weather-on-the-moon-we-asked-a-nasa-scientist-episode-34/) | No substantial atmosphere for wind-driven lunar weather | Moon environment/art review |
| S14 | [NASA space communications overview](https://www.nasa.gov/missions/tech-demonstration/space-communications-7-things-you-need-to-know/), [NASA TechPort delay reference](https://techport.nasa.gov/projects/10516) | Destination-dependent delay; lunar light-time is about 1.3 seconds one way | Explain propagation versus outage; confirm scenario geometry rather than hard-code Mars delay everywhere |

NASA materials explain the science; the fictional characters, outpost designs, mission timings, choices, difficulty constants, and dialogue in this package are original proposed game content.

## Required source metadata

Create `public/data/provenance.json` and validate its schema. Each entry needs:

```js
{
  id: 'stable-project-source-id',
  basisKind: 'observation', // or 'reference', 'derived', 'authored'
  title: 'actual verified title',
  agency: 'NASA',
  sourceUrl: 'actual source URL',
  recordId: 'actual event/product/study ID',
  version: 'actual version or explicit unversioned retrieval',
  observationTime: null,    // reference documents need not have a sensor timestamp
  retrievedAt: 'actual UTC retrieval timestamp',
  location: null,
  units: {},
  qualityNotes: [],
  rawFile: 'data/raw/verified-file',
  sha256: 'computed digest',
  transforms: [],
  usedBy: ['solar-shelter'],
  limitation: 'specific limits of this input'
}
```

These example strings are schema descriptions, not acceptable production records. Never fill a NASA record ID, observation, reading, or checksum with invented values. References without downloadable raw payloads can point to an archived source excerpt/metadata note with its own digest and explicit basis kind.

Keep author-created parameters in `public/data/model-assumptions.json`, with parameter name, units, justification, related source IDs if any, and a statement that the numeric value is game design. Each scenario must say whether it is an archived replay, a composite exercise, or wholly authored with NASA-informed mechanisms.

## Dataset-specific extraction instructions

### DONKI / M04

Use the [current documentation](https://ccmc.gsfc.nasa.gov/DONKI/api/) and [migration announcement](https://ccmc.gsfc.nasa.gov/news/major-updates/). The announced public base is `https://ccmc.gsfc.nasa.gov/DONKI-API/get/...`. Earlier example calls were not successfully retrieved in the audit; independently test the endpoint and schema.

Select a real SEP or appropriately linked event after inspecting its records; store event time, identifier, instruments/location, links, and original response. A flare is not a guaranteed particle event at Mars. The event record can choose a scenario and provide historical context, while an authored hazard envelope drives qualitative exposure. Label those layers separately. Do not infer tissue dose, particle-arrival time at the fictional site, or exact advance warning from an event class.

### OSDR / M05

Store OSD-269 study/version metadata and the relevant cultivation protocol. The indexed study describes lettuce grown on ISS with a 16-hour-light/8-hour-dark schedule and some initial harvests at about 33 days. Verify the selected experimental conditions in the source before implementing them. Use them as an ISS reference, not a measured Mars growth curve. Do not download raw sequencing files merely to claim dataset usage.

### Horizons / M06 and L03

Request the actual date, target, observer, and time convention. For a Mars center viewed from Earth's center, the documented identifiers include target `499` and observer `500@399`; verify these in the current API response. Observer quantity `21` is one-way down-leg light-time in minutes. A small archived daily table is sufficient. Preserve the header, ephemeris version, dates, quantity, and units. Explain the approximation of using center-to-center light-time for a fictional surface outpost. Separate light-time from model-authored Earth response processing and network blackout windows.

### Lunar illumination / L01 and L03

A mean illumination map cannot tell the player exactly when a shadow arrives tomorrow. The GSFC product explicitly discusses long-time averages, spatial resolution, polar stereographic projection, and a lunar reference radius. Preserve product identity, projection, map bounds, scale/offset, invalid pixels, and resolution.

First release: extract two or three actual site-patch summaries to support a site comparison. Use an independently labeled authored short-term shadow timeline for the fictional training base. Data-driven site preference can affect an explicit average-exposure factor; it must not masquerade as a measured hourly forecast. For a later physically derived timeline, compute horizon visibility from a suitable elevation product and dated Sun geometry, validate it, and identify its resolution limits.

Likewise, mean Earth visibility is context, not the exact L03 blackout schedule. The local fictional ridge geometry can drive a clearly labeled line-of-sight teaching model. Do not upscale a coarse LOLA pixel and claim millimeter terrain truth.

### REMS / Diviner

Optional only after the required source paths work. Retain original units and quality flags. Do not interpret missing values as zero. REMS represents its rover site; Diviner represents surface thermal observations. Any heater-load conversion needs a separate authored thermal model. Neither source directly gives a fictional habitat's energy consumption.

## Data-to-game proof required from agents

For each used source deliver a short trace: original record → normalized field → model function → visible change → debrief source link. Include a test or reproducible inspection proving that changing a valid selected input changes the intended result. For narrative-only references such as the EDS report, label the role as mechanism inspiration and prove the simulated mechanism itself works; do not pretend a news article supplies sensor telemetry.

Bundle small archived inputs so play does not depend on network access. If import fails, preserve the last verified archive; never generate fake NASA data as fallback. If no verified record is available, visibly mark the scenario authored and do not release it as a data-driven mission. No “Live NASA” badge without a genuine successful recent fetch and visible timestamp.
