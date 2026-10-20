# Mission Control Jr. — Mission 2: The Ground Remembers

Research, narrative, playable script, and development specification • 20 October 2026

**Status:** Proposed mission design, grounded in the supplied project and agency references. Mission 2 and its driving systems are not implemented by this document. Mission 1 and the thirty-sol campaign remain separate and intact.

**Recommended experience:** A seven-minute guided demonstration, expandable through optional exploration. The player directly drives the rover, evaluates terrain, documents a geological contact, and brings the expedition home.

## Part 1: Existing Game Analysis

### What was inspected

The available archive is `D:/CODE/Mission Control Jr.zip`. Its inner game directory is `Mission Control Jr/Mission Control Jr/`. I inspected the corresponding extracted project at `D:/CODE/Mission Control Jr/Mission Control Jr` and compared SHA-256 hashes for eight core files: `mission.js`, `demo.js`, `player.js`, `demo-assets.js`, `dialogue-lines.json`, `demo-audio.js`, `story.js`, and `package.json`. All eight match the archive. The analysis below therefore uses the actual project, rather than relying only on the brief or earlier conversation.

Additional inspected sources include `README.md`, `DEMO-WALKTHROUGH.md`, `navigation.js`, `vite.config.js`, and the rover generators in `scripts/model-designs.js` and `scripts/mission-models.js`. This was a source and archive inspection, not a new browser playtest or an assertion that every existing feature has passed a fresh runtime test.

### Mission 1: Before the Storm

The current 3D introduction explicitly labels its brief **Sol 12**. Jin Park diagnoses contaminated solar collectors and a failed reserve battery, cleans three collector sections, removes a reserve battery from the rover service bay, installs it at the habitat power junction, aligns connectors to **1 / 2 / 3**, and chooses a reserve allocation. Allocating reserves brings on the dust front early for a short demonstration. Otherwise it arrives after six minutes of preparation time.

Jin enters Meridian and seals the airlock. The mission evaluates preparation and shelter status:

- **Prepared:** All three collectors cleaned, power repaired, life support prioritized, player inside, airlock sealed. All four crew are safe.
- **Survived:** Shelter secured, but preparation or reserve allocation falls short of that combination.
- **Evacuated:** Shelter or sealing requirements are unmet when the attempt ends.

The collectors are dust-contaminated, not necessarily physically damaged. The resource changes and storm timing are game abstractions.

### Established crew

| Character | Current role and characterization | Mission 2 responsibility |
| --- | --- | --- |
| Jin Park | Player engineer; diagnoses, repairs, and acts on evidence | Rover pilot, vehicle inspection, terrain decisions, and field documentation |
| Elena Reyes | Commander; prioritizes people, orderly preparation, and shelter readiness | Local Meridian operations lead; approves departure and supports decisions |
| Amara Okafor | Biologist; connects research and life support to dependable engineering | Expedition partner; handles the science checklist and sample context, without being recast as a specialist geologist |
| Luca Moreau | Medic; emphasizes fatigue, oxygen margins, and avoiding rushed mistakes | Remains at Meridian; monitors the expedition's reported suit reserves and readiness |

There are still four crew members. Jin and Amara travel together; Elena and Luca remain at the habitat. All immediate radio dialogue is local Mars communication.

### What exists, and what does not

| System | Verified current support | Consequence for this expansion |
| --- | --- | --- |
| Rendering | Three.js `0.186.1`, GLTFLoader, Vite; separate exterior and interior groups | Reuse rendering conventions and loaders |
| Walking | Camera-relative WASD/arrows, object proximity, guided routes, rectangular obstacle checks | Retain walking; add explicit vehicle input ownership |
| Views | First-person and third-person walking; camera collision probes | Reuse view preference and collision approach; vehicle cameras are new |
| Rover | Six-wheel survey vehicle model, named `wheel_0`–`wheel_5` and `sensor_head`, service bay and recoverable battery | Reuse chassis and materials; add actual vehicle simulation and suitable crew seating |
| Existing rover motion | Scripted docking displacement, wheel rotation, mast scan, bay opening | These are animation effects, not player driving |
| Terrain | A flat 160 × 160 ground plane; decorative rocks; player bounds approximately ±18 | Slopes, material-dependent traction, expedition terrain, and a larger playable boundary are new |
| Story | Mission state/actions in `mission.js`; much scene/UI orchestration in `demo.js` | Reuse the state/action pattern; give Mission 2 its own reducer and scene controller |
| UI | Task list, proximity actions, resources, journal, dialogue choices, pause/settings, subtitles | Reuse presentation patterns; add driving instruments and route map |
| Audio | Nineteen bundled voice clips; queued playback, effects, ambience, skip/replay, volume controls | New dialogue needs new recordings and a mission-specific line registry |
| Assets | Thirteen GLBs including habitat, rover variants, animated astronaut, battery, terminals, junction, array, airlock, interior, water tank, tool | Most visual work can be reused |
| Campaign | Separate `/campaign.html`, with different sol-based events in `story.js` | Keep its progression and data separate from the episodic missions |
| Mission selection | Current 3D page and links to campaign/model gallery | An episode selector and completion handoff need development |
| Learning assessment | Outcome classification and resource feedback | Detailed behavior telemetry and competency debrief are new |

### Continuity decisions

1. **Explicit canon assumption:** Mission 2 follows the fully prepared ending of Mission 1. It begins on **Sol 15**, after a short recovery and equipment review. This date is new fiction, not an existing implemented event.
2. **Battery continuity:** The working rover reserve battery used in Mission 1 stays connected to Meridian. The current code does not simulate an independent traction battery or prove the rover is drive-ready. Mission 2 introduces an inventoried, compatible spare pack, charged at the restored outpost during the intervening sols. Its existence and charging are new story facts, shown in the briefing and maintenance record.
3. **No repeated repair puzzle:** Jin installs that precharged pack and verifies vehicle readiness. There is no connector puzzle, solar cleaning sequence, or competing habitat power allocation.
4. **Vehicle configuration:** The existing mesh has a vehicle shell and windscreen, but no verified usable crew interior, seats, driver animation, or life-support cabin. Mission 2 uses an explicitly unpressurized two-seat field-rover configuration with suited occupants. A visible seating/control module is essential new model work. A sealed pressurized cabin is outside the minimum version.
5. **Campaign independence:** Sol 15 here belongs to the short-story continuity. Do not import or overwrite the thirty-sol campaign's timeline, resources, or salvage flags.
6. **Educational fiction:** Meridian, its geology, hardware procedures, and operational thresholds are invented for this game. Research informs the learning principles; it does not certify the fictional mission.

## Part 2: NASA Research Findings

### 1. Human rover analogs: plan, drive, work, and return

NASA and JAXA's 2022 Desert RATS work used a pressurized rover prototype in an Earth environment simulating lunar exploration. Crews followed mapped traverses with science stops, drove, practiced camera-based visibility contingencies, performed simulated surface work, and returned to base. This is human-operated lunar analog research, not a record of humans driving on Mars. [NASA: Rover operations in a simulated lunar environment](https://www.nasa.gov/humans-in-space/nasa-practices-rover-operations-in-simulated-lunar-environment/).

**Design inference:** Make the complete expedition—not just steering—the learning activity: readiness, route, driving, observation, and return. Transfer that structure to our fictional unpressurized Mars rover without claiming the vehicles or procedures are equivalent.

### 2. Overhead maps support planning but do not replace local observations

JPL's route-planning activity uses orbital imagery and topography to identify hazards such as craters and cliffs. It explains why maps and rover camera views complement one another. This is an educational activity about robotic Mars exploration. [JPL Education: Map a Mars Rover Driving Route](https://www.jpl.nasa.gov/edu/resources/project/map-a-mars-rover-driving-route/).

**Design inference:** Give players a route map with surface uncertainty, then let ground-level observations overturn an initially reasonable plan. The game map is fictional, not a NASA terrain dataset.

### 3. Geometry, waypoints, and slip matter

JPL describes robotic rover navigation using stereo views, hazard assessment, waypoints, keep-out zones, and visual odometry. Comparing wheel-based expectations against observed movement helps identify slip. Autonomous robotic navigation is distinct from the direct human driving proposed here. [JPL Robotics: Surface System Software and Rover Navigation](https://robotics.jpl.nasa.gov/what-we-do/flight-projects/mars-science-laboratory/surface-system-software-and-rover-navigation/).

**Design inference:** Teach the relationship between wheel rotation and actual ground progress, and provide slope and surface warnings. Do not imply that our simple controller reproduces Curiosity's software or engineering performance.

### 4. Soft ground can be more dangerous than it looks

In 2009, Spirit's wheels slipped and became embedded in soft soil. The team suspended driving while studying the terrain and testing options. Increased available electrical energy did not remove the mobility hazard. [JPL: Soft Ground Puts Spirit in Danger Despite Gain in Daily Energy](https://www.jpl.nasa.gov/news/soft-ground-puts-spirit-in-danger-despite-gain-in-daily-energy/).

**Design inference:** The complication is uncertain load-bearing ground. A fictional shallow slip zone allows a teachable retreat; that recovery must not be presented as a universally valid real rover extraction method.

### 5. Resource plans must change as an expedition unfolds

An NTRS paper on the Multi-Mission Space Exploration Vehicle describes planning and monitoring limited air and electrical energy, maintaining margins, and revising activities using actual rover energy data during Desert RATS. I verified the repository abstract and metadata; the linked PDF was unavailable through the research tool. [NTRS document 20100039593: Energy Management of the Multi-Mission Space Exploration Vehicle Using a Goal-Oriented Control System](https://ntrs.nasa.gov/citations/20100039593).

**Design inference:** Show projected reserves at home, update them after a detour, and allow a reduced science plan. The game's numeric reserve rule and consumption model are original design choices.

### 6. Geological observations need context

ESA's PANGAEA discussion with NASA geology specialists emphasizes landscape observations, clear descriptions, sampling-location choices, documentation, and field practice. These principles support useful science even when remote support is unavailable. [ESA: Lunar geology lessons for Artemis](https://blogs.esa.int/caves/2025/09/16/lunar-geology-lessons-for-artemis/).

**Design inference:** A wide contextual photograph, a close view, and a location-linked observation are the required science product. An optional physical sample is not automatically better than well-documented observations.

### 7. Earth cannot provide immediate emergency decisions

NASA describes Mars communication delays reaching about 22 minutes one way and the resulting need for crew expertise and autonomy. [NASA: Expanding the Human Factors Toolbox](https://www.nasa.gov/centers-and-facilities/nesc/expanding-the-human-factors-toolbox-an-approach-to-balancing-crew-and-mission-design-parameters/).

**Design inference:** Elena provides local operational support from Meridian. A departure message to Earth is queued; no freshly requested Earth response resolves a seven-minute event. The episode assumes a fictional 12-minute one-way delay, identified as a scenario value.

### 8. Layers are evidence, not an instant discovery claim

NASA's description of sedimentary layers in Danielson Crater explains how their thickness and variation can inform studies of past deposition. It does not establish the origin of our invented outcrop. [NASA Science: Layers in Mars' Danielson Crater](https://science.nasa.gov/resource/layers-in-mars-danielson-crater/).

**Design inference:** The player records a contact between two visible rock units and reports uncertainty. Appearance alone cannot prove water, life, a precise age, or a particular mineral.

### 9. Keep the Mars environment proportionate

NASA notes that Mars' thin atmosphere produces less force from winds of similar speed than Earth's atmosphere. Dust still affects sunlight, operations, and equipment. [NASA Science: Dusty Differences Between Mars and Earth](https://science.nasa.gov/earth/earth-observatory/dusty-differences-between-mars-and-earth-149926/).

**Design inference:** Do not add a wind wall that throws the rover around. This episode takes place in calm post-storm conditions; its challenge is driving judgment, not another storm escape.

**Scope of these sources:** Agency publications support the principles above. Neither NASA nor ESA has validated this game's checklist, physics, thresholds, scoring, invented terrain, or future Mars procedures. Sources were checked on 20 October 2026.

## Part 3: Three Mission 2 Concepts

### Concept A — The Ground Remembers

**Goal:** Reach a mapped geological contact, document both rock units in context, and return with useful observations.

**Conflict:** Ground-level evidence reveals that the apparently smooth approach contains a crust over loose material. The player must stop, reassess, choose a firmer detour, and decide whether remaining reserves justify optional sampling.

**Strengths:** Driving has a scientific purpose. Observation changes the route, and returning with a careful report feels like achievement. Rocks, rover, terrain materials, terminals, and crew are largely reusable. The science objective does not depend on a complicated simulated instrument.

**Weaknesses:** The layered outcrop must be visually legible, and the terrain needs enough variety to make route decisions meaningful. Poorly presented, the climax could feel like a photography checklist.

### Concept B — The Silent Witness

**Goal:** Drive to a remote weather station and retrieve its local data recorder after its radio link fails.

**Conflict:** Two plausible station sites appear on an outdated survey. The expedition must reconcile landmarks and a local beacon before committing its return margin.

**Strengths:** Clear objective, easy-to-read hardware interaction, strong navigation and communications lessons. Terminals and equipment can be reused.

**Weaknesses:** It risks becoming another repair-and-recover task. It needs a believable local beacon and position uncertainty interface, and an apparently urgent recorder deadline could feel artificial unless carefully justified.

### Concept C — The Missing Baseline

**Goal:** Place three dust-monitoring reference markers along a short traverse so future expeditions can compare surface conditions.

**Conflict:** The last ideal measurement site is hazardous. The player chooses between closer spacing on safe terrain and a more complete but resource-expensive survey geometry.

**Strengths:** Driving, measurement planning, and weighing data quality against access fit naturally together. A reusable sensor deployment mechanic could support later episodes.

**Weaknesses:** Three similar stops can become repetitive. Meaningful placement assessment and a clear explanation of measurement quality require extra development and teaching time.

### Comparative evaluation

Scores are design judgments from **1 = weak** to **5 = strong**. They are not measured learning results or scientific validation. Equal weighting keeps the comparison transparent.

| Criterion | A: Ground Remembers | B: Silent Witness | C: Missing Baseline |
| --- | ---: | ---: | ---: |
| Educational value | 5 | 4 | 5 |
| Scientific credibility | 5 | 4 | 5 |
| Emotional engagement | 4 | 4 | 3 |
| Rover-driving quality | 5 | 4 | 4 |
| Existing asset reuse | 5 | 5 | 4 |
| Technical feasibility | 4 | 4 | 3 |
| Future mission potential | 5 | 4 | 5 |
| Total / 35 | **33** | **29** | **29** |

**Selection: Concept A.** It makes the central lesson concrete: a safe explorer compares the plan with evidence and changes the plan when necessary. One destination, two approach corridors, and one science interaction sequence provide more driving value with less new machinery than the alternatives. Its emotional arc also follows Mission 1 naturally: the crew can finally explore because Jin protected the outpost.

## Part 4: Final Mission Story

### Premise

**Sol 15. Meridian survived. Exploration can resume.**

Three sols after the dust front, the repaired habitat is stable. Elena has deliberately delayed new fieldwork until the crew has rested and equipment has been reviewed. Amara has been waiting to investigate a nearby outcrop that survey imagery suggests contains two contrasting rock units. Understanding how those units meet may help the team choose better locations for later analysis.

The outcrop already existed in the survey. The story does not require a storm to carve a new canyon or suddenly expose a spectacular fossil. Post-storm access conditions need checking, and the crew wants a cautious first traverse after recovery.

The rover cannot simply drive away. Its usable reserve pack remains in Meridian's repaired power system. An identified spare has been checked and charged over the intervening sols. Jin must install it into the rover's isolated service connection, confirm its identity and latch, then test mobility, braking, cameras, and local communication. A maintenance note makes clear that habitat power is not being dismantled.

### Departure

Jin pilots; Amara travels in the second seat and watches terrain and the science checklist. Both wear suits because this is an unpressurized field vehicle. Elena and Luca remain at Meridian. The map displays a longer route across surveyed firm ground and a shorter approach with uncertain surface properties. Neither route is identified as morally good or bad: the map gives reasons and uncertainty, and the player must justify a choice.

The crew's departure report includes their route and turn-back margin. Earth receives a delayed status packet, not a request for live permission.

### The ground disagrees

On the approach to the outcrop, both routes reach a common observation point. A smooth patch ahead appears convenient. At close range the surface shows small broken plates and fine material below. A camera inspection gives the player evidence before commitment.

If Jin stops to inspect, the team marks the patch as uncertain and takes the firmer perimeter. If Jin drives onto its shallow edge, the wheels rotate faster than the vehicle advances. Continuing throttle increases energy use and simulated sinkage. Amara reports the discrepancy without panic. The correct response is to release the throttle, inspect, and attempt only the controlled retreat offered by this deliberately shallow training scenario. Persistent forcing suspends the attempt and offers a clearly labeled checkpoint retry.

There is no compulsory entrapment for players who notice the hazard. Good observation prevents trouble, and the player can still experience the decision by revising the map and choosing a detour.

### A discovery made useful

After the detour, the outcrop comes into view: a dark unit meets a paler layered unit. The expedition has reached something worth investigating, but its appearance does not reveal a definitive origin.

Jin parks on firm ground, applies the parking brake, and confirms suit reserves. Amara remains with the rover, within sight and local radio range, while Jin walks a few metres to the marked observation area. The player takes a contextual image containing both units, a close view of the contact with a scale reference, and attaches a location and description.

The best report describes what can actually be seen: contrasting material, layering, and a boundary. It proposes further study rather than announcing water or life. A loose fragment from a safe, preapproved collection spot is optional; the mandatory science product is the documented observation.

### The climax is a decision

Amara identifies an attractive loose fragment farther along the same safe observation area. The interface compares the cost of an additional collection task with projected reserves at Meridian. With adequate margins, Jin may collect and label it. With a poor driving history or depleted reserves, turning back is the stronger operational decision.

The player can also abort earlier and return with a hazard report alone. Elena accepts a justified retreat. Science is valuable because the crew can come back to investigate again.

### Return and resolution

Jin selects the return route using the revised map. The uncertain patch remains marked, and the inbound drive tests whether the player remembers it. There is no final weather ambush. The challenge is driving with the remaining margin, checking in, parking safely, and accounting for both expedition members.

At Meridian, the debrief links recorded actions to consequences. A strong expedition provides usable geology observations, a safer route for the next crew, and healthy reserves. An incomplete expedition can still demonstrate good judgment. A risky return identifies the decisions that consumed its margin. A suspended attempt presents focused practice rather than an astronaut death scene.

Amara adds the boundary to the field map. Elena asks what follow-up measurement would actually test their interpretation. This introduces Mission 3: comparing observations and choosing measurements, rather than making the rover drive repeat itself.

## Part 5: Detailed Scene-by-Scene Script

### Timing and presentation rules

The standard route totals **420 seconds: seven minutes**. Scene estimates assume a practiced demonstration, dialogue overlapping safe traversal, and no checkpoint retries. Reading menus, exploring, using accessibility options, and learning the controls can extend play. There is no reward for finishing faster.

All voice lines below are original proposed dialogue. Never overlap speakers. Safety guidance can interrupt a noncritical line; interrupted information remains in the journal. Captions identify the speaker and whether communication is local radio. A muted or missing recording must not block interaction.

| Scene | Duration | Cumulative time |
| --- | ---: | ---: |
| 1. We can go outside again | 35 s | 0:35 |
| 2. A rover earns its clearance | 55 s | 1:30 |
| 3. Choose the journey home first | 35 s | 2:05 |
| 4. Leaving Meridian | 60 s | 3:05 |
| 5. The map is not the ground | 55 s | 4:00 |
| 6. Read the boundary | 75 s | 5:15 |
| 7. Bring the evidence home | 70 s | 6:25 |
| 8. What made this a good expedition? | 35 s | 7:00 |

### Scene 1 — We can go outside again

**Location/environment:** Meridian's existing interior. Calm exterior light through the doorway; collector and habitat status stable. Jin, Elena, Amara, and Luca are present. Sol 15 appears on the terminal.

**Camera/cinematic:** Optional six-second view from the repaired junction to the habitat, then return control to Jin. Reduced-motion mode replaces this with a still view. No extended noninteractive opening.

**Dialogue:**

- **Elena:** “Three sols ago, you kept Meridian running. We have rested, checked the outpost, and cleared a short science traverse.”
- **Amara:** “The survey shows two rock units meeting nearby. I need to see their boundary in context. A loose rock alone cannot tell us the whole story.”
- **Luca:** “You and Amara go together. Bring back enough reserve for a delay, not just the planned drive.”
- **Jin:** “Inspect the rover, plan the route, document the contact, return with margin.”

**Player objective:** Read the expedition card and accept the task.

**Actions/gameplay:** Inspect the terminal, review the canonical recap and science goal, then choose “Prepare expedition.” No rover movement yet.

**Decision/consequence:** “Explain the objective” opens a brief optional explanation of a geological contact without a penalty. The route can also be declined; Elena offers to resume later, leaving the briefing checkpoint available.

**Sound/environment:** Reuse low habitat hum and terminal feedback; restrained opening music. No storm alarm.

**Educational objective:** State the mission goal and distinguish required observations from optional collection.

**Transition:** Journal adds the departure checklist; Jin walks through the existing airlock transition to the service area.

### Scene 2 — A rover earns its clearance

**Location/environment:** Rover bay beside Meridian. Jin and Amara at the vehicle; Elena and Luca on local radio. The habitat junction remains powered and visually untouched.

**Camera/cinematic:** Normal first/third-person walking. Selecting an inspection item highlights its actual location. A short service-bay close-up is optional.

**Dialogue:**

- **Jin:** “The pack we borrowed stays with the habitat. Spare R-two passed its storage check and charged here during recovery.”
- **Elena:** “Confirm that identity before connecting it. Meridian's reserve is not part of today's vehicle supply.”
- **Amara:** “Wheels clear. Our sample kit and camera are secured.”
- **Luca:** “Both suits ready. Confirm your local radio and the braking test before departure.”
- **Jin, after actual test completion:** “Pack latched. Steering responds. Vehicle stopped inside the test area. Radio check complete.”

**Player objective:** Complete five readiness groups: spare pack; wheels/underside; steering and brakes; cameras/local radio; two suits and secured field kit.

**Actions/gameplay:** Confirm the labeled spare in a newly added inventory slot, isolate the service connection, fit and latch it, run the displayed connection check, inspect wheel clearances, mount the rover, steer between marks, and stop in a marked braking box. The test uses the actual driving controller, not an automatic checkmark. Board Amara only after the vehicle stops; her attachment is a seated pose, not an autonomous follower simulation.

**Decision/consequence:** A mismatched pack selection gives “Identification does not match this vehicle” and allows correction. Skipping a readiness item leaves launch unavailable and explains why. A missed brake box requires another short attempt, not a cinematic crash.

**Sound/environment:** Latch click, contactor cue, low electric drive sound, brief radio confirmation. Keep motor sound quiet enough for speech.

**Educational objective:** Verify readiness through evidence, including a physical stop test.

**Transition:** Successful checklist and occupied passenger seat unlock the route terminal. Vehicle remains parked while planning.

### Scene 3 — Choose the journey home first

**Location/environment:** Parked rover map display at the service apron. Jin and Amara seated; Elena on local radio. Planning pauses simulation time.

**Camera/cinematic:** Show a north-up local map with Meridian, contact site, two corridors, slope shading, uncertain soil, and a home icon. No suggestion of a real-time orbital camera.

**Dialogue:**

- **Elena:** “The northern arc is longer and better surveyed. The direct line crosses uncertain surface. Select a route and tell me what makes it workable.”
- **Amara:** “Our map helps us plan. It cannot tell us how every patch will carry the rover.”
- **Jin, after route and reason selection:** “Route logged. I will compare it with the ground and preserve the homeward reserve.”

**Player objective:** Choose an outbound corridor, mark a turn-back point, and verify the forecast return margin.

**Actions/gameplay:** Toggle hazard and slope layers, compare distance and predicted charge cost, choose a route, then select a reason. The correct explanation relates terrain evidence and reserves, not just shortest distance. Marking the turn-back point places a visible waypoint.

**Decision/consequence:** A cautious direct-route plan may be acceptable if it includes inspection and an alternative. “Shortest must use least energy” gets immediate feedback about surface resistance and uncertainty. The northern route avoids an early loose-soil pocket but still reaches the common approach inspection point.

**Sound/environment:** Soft UI tones; no dramatic countdown. Visible note: “Earth status packet queued. Scenario delay: 12 minutes one way.”

**Educational objective:** Plan for uncertainty and a return, not merely arrival.

**Transition:** Confirm local departure report. Launch gate checks both crew seated, readiness complete, viable route, and parking brake release. Active expedition resource use begins.

### Scene 4 — Leaving Meridian

**Location/environment:** A new short traverse extending the current exterior. Low ridges, rocks, firm stretches, one optional loose patch, and sightlines back toward Meridian. Jin drives; Amara rides beside him. Elena and Luca use local radio.

**Camera/cinematic:** Third-person rover follow view by default. V switches to a functional driver-eye view with camera housing/controls; an elaborate enclosed cockpit is unnecessary. No camera cuts take control during steering.

**Dialogue:**

- **Jin:** “Meridian, departing on the logged route. Two crew aboard.”
- **Elena:** “Departure recorded. Call at the approach marker or if conditions change.”
- **Amara:** “That low ridge is our first landmark. The waypoint arrow should agree with what we see.”
- **Luca, only if speed warning persists:** “The caution speed has changed. Give yourself room to stop.”

**Player objective:** Drive through the first waypoint and reach the approach observation marker.

**Actions/gameplay:** Accelerate, steer between rocks, brake before a rough section, compare heading with the ridge, and optionally switch views. HUD shows speed, heading, battery, both suit reserves, and projected home margin. All route movement is player controlled; the walking navigation buttons cannot autopilot the rover.

**Decision/consequence:** Firm terrain supports the normal speed band. Taking the shorter loose section produces reduced progress and increased energy consumption. Cautious inspection and choosing the longer line are both supported. Boundary markers explain the training area limit before a physical stop.

**Sound/environment:** Tire/contact sounds follow surface type; electric drive pitch follows commanded wheel speed. Dust is restrained. Suit/radio sound is emphasized over exaggerated external noise.

**Educational objective:** Drive to terrain conditions while checking instruments against landmarks.

**Transition:** Entering the approach zone introduces the ground evidence, regardless of initial route. It does not force the rover onto the hazard.

### Scene 5 — The map is not the ground

**Location/environment:** A shared approach apron before the contact site. The suspect patch has a smooth surface, broken edges, and visible fine material. The firm detour is visible around its perimeter. Both field crew remain aboard unless parked in a safe zone.

**Camera/cinematic:** A player-requested inspection view magnifies the edge. If moving, deliver warnings through the HUD and passenger dialogue rather than cutting the camera away.

**Dialogue, before entering the patch:**

- **Amara:** “Stop short of that edge. The surface looks smooth, but the broken plates show loose material underneath.”
- **Jin, after inspecting:** “The map did not resolve that. Marking the patch uncertain.”
- **Elena:** “Describe the evidence, then choose. You can take the firm perimeter or return with the hazard report.”

**Additional dialogue only if slipping:**

- **Amara:** “Wheel speed is up; ground speed is not. Release the throttle.”
- **Jin, after stopping:** “Stopped. I will inspect before commanding another movement.”
- **Elena:** “This shallow edge still connects to your firm approach. If the retreat check is green, reverse slowly along that track. Otherwise suspend the attempt.”

**Player objective:** Recognize uncertainty, report it, and revise the plan.

**Actions/gameplay:** Stop and set the brake, inspect surface evidence and wheel/ground-speed discrepancy, mark the map, and choose firm detour or abort. Players in the shallow slip zone may release the brake for a low-speed reverse only after the rear corridor check passes. Outside the authored recovery envelope there is no promised extraction.

**Decision/consequence:** Early observation avoids the slip cost. Continuing throttle raises training sinkage and charge use. Repeated forcing ends the attempt at a safe pause with a retry option. Neither “scan” nor “request help” teleports the rover or invents an instant soil-strength sensor.

**Sound/environment:** A moderate warning chime and changing wheel sound; a shallow rut visual if entered. No explosion, violent collapse, or surprise storm.

**Educational objective:** Revise a plan using local evidence; understand that more throttle is not always more progress.

**Transition:** The revised map remains available for the return. Taking the detour unlocks the destination; aborting leads directly to the return scene with a reduced science plan.

### Scene 6 — Read the boundary

**Location/environment:** A small, low outcrop on firm terrain, within a short walk of the parking point. Contrasting units and the boundary are clearly visible without climbing. Jin works outside; Amara stays by the rover as visual/radio partner. Elena and Luca remain local support.

**Camera/cinematic:** Let the outcrop enter the follow view naturally as the rover rounds the detour. After parking, switch control to walking. A handheld camera frame guides photos; no automatic cinematic collection.

**Dialogue:**

- **Amara:** “There it is. Start wide: both units and where they meet. Then take the close view with a scale.”
- **Jin:** “Dark material below, pale layered material above. Boundary position recorded.”
- **Amara:** “Good observation. We have not established how either unit formed. Keep that uncertainty in the report.”
- **Luca:** “Check the projected home margin before adding work.”
- **Amara, optional sample prompt:** “There is a loose fragment at the approved spot. We can label it if the reserve supports another stop. The image record is already useful.”
- **Jin, collect branch:** “Margin checked. Collecting the loose fragment and linking it to this location.”
- **Jin, return branch:** “The observation record meets our goal. We are keeping the reserve for the drive home.”

**Player objective:** Produce a context image, a scaled close view, and an accurate, location-linked observation.

**Actions/gameplay:** Park within the firm marked area, brake, verify both suits, exit on a clear side, walk to the safe observation point, compose two photos, and attach the correct description. Optional collection uses a new small container and the existing EVA tool's visual language. Return to the seat; confirm both occupants before moving.

**Decision/consequence:** A close-up without context triggers “Useful detail; add an image showing where it belongs.” Selecting “We proved ancient life” triggers “These observations do not establish life; describe the evidence.” The label can be corrected. Optional collection is unavailable if its predicted costs breach the return margin; explain the prediction. Choosing to leave a sample earns no science penalty when the required record is complete.

**Sound/environment:** Quiet camera click, tool/container latch if used, suit breathing. Stable light allows an accessible science task. Music opens briefly at the reveal, then ducks for speech.

**Educational objective:** Record context and uncertainty; make an operational go/no-go decision for optional work.

**Transition:** Boarding confirmation opens the return-route review. Aborted expeditions bypass unvisited science actions honestly; no hidden auto-completion.

### Scene 7 — Bring the evidence home

**Location/environment:** Outcrop to Meridian, through the same connected terrain. Hazard markings persist. Jin and Amara aboard; Elena and Luca at Meridian.

**Camera/cinematic:** Player-controlled driving. Meridian becomes a visual landmark before arrival. No automatic final approach or forced return cutscene.

**Dialogue:**

- **Jin:** “Returning to Meridian. Route updated; uncertain ground remains excluded.”
- **Elena:** “Return logged. Use the revised map and keep checking the ground.”
- **Amara:** “We brought back two things: evidence from the outcrop and a better route for the next crew.”
- **Luca, only at low projected margin:** “Your predicted home reserve is below the training margin. Drop optional stops and take the verified return.”
- **Jin, after parking:** “Vehicle stopped, parking brake set. Two crew back at Meridian.”

**Player objective:** Return, park safely, secure the vehicle, and account for both expedition members.

**Actions/gameplay:** Select a viable return corridor, drive around the marked patch, respond to updated resource predictions, stop in the apron, set the parking brake, exit, and confirm crew status at the existing terminal.

**Decision/consequence:** Optional sightseeing can be declined. Reentering the hazard is a new recorded decision, not an unavoidable trap. Declining extra work when margins are poor is positively explained. Zero resource budget or irrecoverable immobilization suspends training; it does not trigger an unsupported instant rescue.

**Sound/environment:** Receding rover motor, familiar habitat hum on arrival, radio confirmation. No triumphant cue until the parking and crew checks actually complete.

**Educational objective:** Execute the return plan and finish the operation, including the stop and accountability checks.

**Transition:** A confirmed return opens the appropriate debrief. A suspended attempt opens its alternative debrief and checkpoint options.

### Scene 8 — What made this a good expedition?

**Location/environment:** Existing habitat terminal. Jin, Elena, Amara, and Luca at Meridian for completed returns. For a suspended attempt, use a clearly labeled training review overlay instead of pretending everyone physically returned.

**Camera/cinematic:** Stable view with three evidence cards: preparation, decisions, result. Timeline entries expand on demand; there is no long score animation.

**Dialogue, full science and safe return:**

- **Elena:** “You changed the plan when the evidence changed. The observation record is useful, and both of you returned with margin.”
- **Amara:** “We know where the units meet. Our next question is which measurement can test how they formed.”
- **Luca:** “Your reserve gave us room for uncertainty. Keep that habit.”

**Alternative ending dialogue:**

- **Safe return, reduced science — Elena:** “You returned safely and recorded what stopped the plan. We can schedule the unfinished observations with better information.”
- **Reduced margin — Luca:** “You reached home, but the reserve was below the planned margin. Review the marked decisions before another traverse.”
- **Suspended training — Elena:** “The attempt is paused. Review the terrain and resource evidence, then practice from the last safe checkpoint.”

**Player objective:** Review one consequence and answer a transfer question: “A new route looks shorter but its surface is uncertain. What should you check before committing?”

**Actions/gameplay:** Review actual route and telemetry; choose a response, receive an explanation, and select replay, focused practice, Mission 1, or campaign. A future Mission 3 card is labeled “Planned,” not playable.

**Decision/consequence:** Correct transfer answer: inspect local evidence, compare projected return reserves, and keep an alternative. Incorrect answers receive feedback and another attempt; display first and corrected responses separately.

**Sound/environment:** Calm resolution cue, familiar interior ambience. Only one ending voice line plays for the actual outcome.

**Educational objective:** Explain why a decision mattered and transfer the principle to a new situation.

**Transition:** Save episode summary separately from campaign state; return to episode selection or focused practice.

## Part 6: Detailed Rover Gameplay Design

### Control contract

| Input | Walking | Driving |
| --- | --- | --- |
| W / Up | Forward | Apply forward throttle |
| S / Down | Backward | Brake while moving forward; reverse only after stopping and releasing/reapplying input |
| A / D or Left / Right | Strafe relative to camera | Steer left/right; no sideways translation |
| Space | No new walking action required | Service brake |
| P | No new walking action required | Toggle parking brake when stopped |
| E / action button | Nearby interaction or board | Exit only when stopped, parking brake set, and exit area clear |
| V / View | First/third-person astronaut | Driver-eye/third-person rover |
| Drag mouse | Look | Orbit follow view or look within bounded driver-eye range |
| M / Map | Local map when safe | Map only while stopped; brake first |
| J | Journal | Journal while stopped |
| Escape | Pause, release mouse | Pause, clear input, freeze vehicle/resource simulation |

Entering transfers input ownership from the walking controller to the rover controller. Leaving restores walking at a checked location beside the rover. Holding E cannot bounce repeatedly between states. Clear held inputs on blur, dialogue opening, camera/input-mode changes, and pause. An optional steering assist damps abrupt input but does not choose routes or drive automatically.

### Vehicle and camera behavior

- Use fixed-step kinematic simulation, for example 60 updates per second with bounded frame catch-up. Frame rate must not change distance, charge use, or braking.
- Starting tuning: forward maximum **3.3 m/s**, reverse **1.0 m/s**, acceleration **0.8 m/s²**, service deceleration **1.5 m/s²**. These are prototype parameters, not real Mars vehicle operating limits.
- A bicycle-style steering model is adequate for the MVP. Smooth steering and reduce turn authority at higher speed. Adjust signs consistently while reversing. Do not simulate lateral keyboard strafing.
- Probe terrain below the vehicle/wheels, align the chassis to a smoothed ground normal, and apply small independent wheel offsets. This approximates terrain response; it is not validated rocker-bogie dynamics or a full suspension solver.
- The generator uses local **X** as the rover's long axis, with wheels rotating around local **Z**. Bind steering pivots and wheel spin using those conventions; do not assume a generic model's forward axis.
- Named wheel nodes support visual rotation. Add steering pivot parents so wheel spin and steering do not overwrite each other.
- Follow camera: approximately 7 m behind and 3 m above, with a look-ahead target and obstruction handling. Driver-eye view anchors to the actual new driver position. V preserves vehicle motion and mission state.
- Add a visible two-seat module, hand controls, foot support, restraints, and seated suited poses for Jin and Amara. Do not put the first-person camera inside the existing opaque shell and call it a cockpit.
- Keep roll/pitch restrained and offer reduced camera motion. No motion blur, vehicle jumping, racing boost, or drift mechanic is necessary.

### Terrain and routes

Create a compact authored expedition area of roughly **260 × 220 world metres**, connected to Meridian's existing apron. A fictional contact about 100 m from base can support two winding corridors of approximately 120–170 m each. The practiced round trip, including detour and inspection movement, is roughly 300–380 m. Exact lengths are level-design targets, not measured properties of the current map.

The **northern arc** favors surveyed firm ground, mild slopes, and a longer distance. The **direct corridor** is shorter but includes uncertain material and a rougher passage. Both join the visible approach inspection point. A final firm perimeter reaches the outcrop without crossing the suspect patch.

Use four material/hazard categories:

1. **Firm ground:** Normal progress and charge cost; suitable stopping locations.
2. **Rough ground:** Increased movement resistance and a lower advisory speed; avoid large rocks using proper colliders.
3. **Loose material:** Reduced traction, more wheel spin per metre, higher charge cost; a shallow authored portion is recoverable.
4. **Keep-out terrain:** Crater edges, excessive slopes, occupied equipment areas, and unresolved ground. Mark these before physical limits. Do not create an invisible drop or random lethal patch.

Advisory speed bands can begin at **12 km/h firm, 8 km/h rough, and 4 km/h uncertain**. A prototype slope limit can begin at **12 degrees**. Label these as game training limits, tune them through playtests, and never attribute them to NASA.

### HUD and map

Keep instruments to information the player can act on:

- Current speed in km/h; heading and next waypoint bearing.
- Rover charge, Jin's suit reserve, Amara's suit reserve.
- Predicted **reserve at Meridian**, not only a battery percentage.
- Ground state: firm / rough / uncertain; traction warning when commanded wheel motion exceeds ground progress.
- Current task and next safe action.
- Small north-up map with route choice, travelled breadcrumb, revised hazard marking, and return location. Show hazard patterns/icons as well as color.
- Local radio speaker labels; Earth communications identified as delayed messages.

The map is based on authored survey information and local observations. No magical global GPS or continuously refreshed orbital feed is needed. The player's exact map dot is a navigation aid, not an implementation of real Mars localization.

### Resources and a transparent return rule

Use normalized **training units from 0 to 100**, not real battery kilowatt-hours or literal oxygen quantities. Display that simplification in help. Both suits remain essential while riding because the rover is unpressurized; battery state does not refill oxygen.

Initial balancing model, active only after expedition departure and outside paused menus:

- Rover charge starts at 100; idle/electronics use **0.01 units per active second**.
- Movement costs **0.07 charge units per metre on firm ground**, multiplied by 1.5 on rough and 3 on loose terrain.
- Significant powered slip adds **0.18 charge units per second**; waiting with throttle released does not incur that slip cost.
- Each suit starts at 100 and uses **0.10 units per active expedition second**. Equal suit use is an MVP simplification; track both explicitly for future extensions.
- Optional sample collection adds approximately 18 seconds and 1 charge unit for equipment. Walking and sample work consume suit budget through elapsed active time.
- Apply no driving charge while a menu has paused the simulation. Pausing cannot recharge a battery or add resources.

At every safe stop, calculate a route-dependent return projection:

`predictedChargeAtHome = chargeNow - sum(remainingDistanceBySurface × surfaceCost) - estimatedReturnSeconds × idleRate`

`predictedSuitAtHome = currentSuitReserve - estimatedReturnSeconds × suitUseRate`

The departure/optional-task rule requires predicted charge and **both** predicted suit values to remain at least **20 units**. Twenty is a visible game margin, not a NASA percentage. Predictions must change when the player revises the route and must include the task being considered. Unknown ground should carry a conservative cost range; show the lower predicted reserve for clearance decisions.

At 300 m of firm travel and 300 active seconds, the base model consumes about 24 charge units and 30 suit units. That leaves room to learn and detour. Avoid tuning normal careful play so tightly that young players must rush. Deliberate looping, powered slip, or extended active waiting can still produce a meaningful return decision.

### Errors, safety gates, and checkpoints

- **Missed checklist item:** Block launch and name the missing verification.
- **Collision:** Use a swept collider sized for the whole vehicle, including wheels. Stop before overlap; log a collision episode, give specific clearance feedback, and allow reversing. Continuous contact counts once until separation, not once per frame.
- **Speed mismatch:** Warn after a two-second grace period. Explain stopping distance or roughness. Do not punish a harmless momentary input with a mission-ending event.
- **Slip:** Make low ground speed and wheel rotation visible. Stop, inspect, and use a checked low-speed retreat only in the authored shallow recovery corridor. This is a lesson about reassessment, not a general real extraction procedure.
- **Persistent immobilization or zero budget:** Suspend the training attempt. Offer review, restart, or a last-safe-checkpoint retry. Explicitly label resource restoration as a simulation retry, not physical rescue, free charging, or oxygen production.
- **Low predicted home margin:** Warn immediately and remove optional work from the recommended plan. The player can still operate the return; crossing 20 is a caution, not instant failure.
- **Exit while moving:** Refuse with “Stop and set the parking brake before exiting.” A blocked side offers another checked exit or requires repositioning.
- **Passenger left behind:** Departure requires Amara attached; post-science movement requires both seated. Do not silently teleport her into a moving vehicle.

Safe checkpoints: briefing, completed readiness at the apron, approach stop on firm ground, and destination parking. Store the actual position, heading, resources, decisions, passenger state, and mission flags. A checkpoint retry starts a new assisted attempt while preserving the prior event record in the debrief.

## Part 7: Branching Story and Endings

### Decision structure

```text
Canonical prepared Mission 1 ending
  -> Sol 15 briefing and spare-pack readiness
  -> Route + reason + predicted return check
  -> Player-driven outbound traverse
  -> Common approach inspection point
       |-- Observe before committing -> mark hazard -> firm detour
       |-- Enter shallow edge -> slip -> stop / inspect / checked retreat
       |-- Keep forcing / become irrecoverable -> training suspended
       `-- Abort expedition -> drive home with hazard report
  -> Outcrop reached
       -> Context image + close view + location/description
       -> Optional sample only with adequate predicted margin
       -> Choose revised return route
  -> Player-driven return + park + crew accounted for
       -> classify science, margins, and assistance separately
```

Changing an initial route because of new evidence is good performance. Choosing an unfamiliar route cautiously is not automatically a bad decision. Picking “safe” in a dialogue is insufficient if the player then drives into the marked hazard.

### Ending conditions, evaluated in order

1. **Attempt suspended — “Stop. Understand. Try again.”** No completed return because of exhausted resources, unrecoverable immobilization, or choosing to suspend. Show the last safe location and practice recommendation. No physical rescue is asserted.
2. **Return with reduced margin — “Home, with a lesson.”** Both field crew returned and parking/accountability checks completed, but charge or either suit reserve is below 20. Report science completion independently. A high science score cannot hide a reserve breach.
3. **Safe return, reduced science — “The right decision can be to turn back.”** Both crew returned, reserves at least 20, but one or more required science records are missing. Includes a well-justified early abort. Show which useful hazard observations were retained.
4. **Full objective and safe return — “A route worth sharing.”** Both crew returned, reserves at least 20, and all three required science records completed. An optional sample is not required.

**Separate assistance label:** A run after checkpoint restoration is marked “Completed with checkpoint practice” regardless of ending quality. Do not erase this through scoring, and do not call it an unaided expedition. A completed return after a genuine in-world shallow retreat remains an ordinary completion; recovering through valid play is not cheating.

### Persistent consequences

Save a mission-specific summary: outcome, route/hazard observations, science record, optional sample flag, first/corrected assessment responses, and assistance status. Later episodes can refer to the field map and observations. Do not carry arbitrary oxygen percentages into the strategic campaign. Standalone Mission 2 uses a clearly visible canonical recap instead of requiring a prior saved win.

## Part 8: Development Feasibility

### Existing reusable assets and systems

- Habitat exterior/interior, airlock, array, junction, water tanks, and terminal GLBs.
- Rover chassis, wheel geometry/materials, named wheel groups, service-bay interaction concept, and sensor mast.
- Animated astronaut and crew appearance, walking/repair animation approach, EVA tool.
- Ground/sky textures, rock generation style, restrained dust, lighting, world labels, and interaction markers.
- Subtitle/journal patterns, audio volume controls, pause/reduced-motion settings, and mission action/state conventions.
- Current tests as a foundation for protecting Mission 1 behavior; existing passing status must be checked during implementation, not assumed here.

### Minor modifications

- Add a mission card and links while keeping the default Mission 1 and campaign URLs working.
- Reuse terminal and inspection UI with Mission 2 copy and objective data.
- Extend voice registry lookup to accept episode-specific lines and assets; the current audio class directly imports Mission 1's JSON.
- Add spare-pack identification/maintenance text and a separate visible rover pack instance.
- Adjust appropriate camera clipping, terrain bounds, fog distances, shadows, and obstacle lists for the new expedition scene only.
- Reuse an astronaut mesh with fixed seated limb poses; use a brief fade between walking and seated positions initially.

### Essential new development

| Work | Why it is genuinely new | Suggested isolated module |
| --- | --- | --- |
| Episode state/actions | Mission 1's reducer has no vehicle/science/return state | `mission2.js` |
| Vehicle controller | Current rover motion is scripted | `rover-controller.js` |
| Terrain and traction | Current player moves on a flat plane | `expedition-terrain.js` |
| Vehicle collisions and footprint | Walking obstacle padding is too small and axis tests are inadequate for a moving rover | Vehicle collision helpers |
| Embark/disembark and passenger | No current ownership or crew seating system | Vehicle interaction state |
| Driving cameras | Walking view offsets do not provide vehicle views | Rover camera component |
| Local map and route forecasting | No implemented expedition map or home-budget estimator | `expedition-navigation.js` |
| Science records | No photo framing, contact record, or linked observation assessment | `field-science.js` |
| Debrief telemetry | Current ending classification does not measure these skills | `mission2-assessment.js` |
| Expanded playable scene | Existing walk bounds are a small outpost apron | `mission2-demo.js` and `mission2.html` |
| Two-seat crew vehicle adaptation | Current model does not provide a usable crew interior | New generator variant and GLB |
| Mission-specific speech | Existing recordings do not contain this episode's dialogue | New local recordings and line manifest |

Suggested module names are proposals; none of these files are being represented as existing implementations.

### Required art, including GLBs

**Essential:** A crew-capable derivative such as `rover-crewed.glb` with visible driver/passenger positions, controls, and safe mounting points; a readable layered outcrop; scale marker; simple sample container if optional collection is included. The outcrop, scale, and container can be generated with basic Three.js geometry and exported if desired. They do not require external photorealistic assets.

**Reuse:** `astronaut-animated.glb`, `battery.glb`, `terminal.glb`, and habitat assets. Preserve the original `rover-dynamic.glb` so Mission 1's composition and animation references remain stable. Update the generator with a new variant rather than overwriting the old mesh.

**No external model is a blocker.** A detailed rover cockpit, better rock textures, seated astronaut animations, or a more polished field camera would improve presentation if supplied later. They are enhancements, not prerequisites for the proposed minimum version.

### Optional enhancements

Full suspension dynamics; independently articulated steering axles; richer seated animation; navigation position uncertainty; a more detailed cockpit; multiple scientific sites; localized dialogue; gamepad support; environmental instrument deployment; validated geological datasets; educator export of learner records. Actual NASA map data would require attribution, alignment, and careful distinction from fictional Meridian.

### Minimum viable seven-minute version

Build one connected short traverse, two outbound choices converging on one inspectable hazard, one firm detour, one outcrop, one manual return, and four outcome categories. Include real acceleration/braking, visible steering/wheel rotation, collision handling, third-person and driver-eye views, a small map, resource projection, a parked on-foot science task, and an evidence-based debrief. Keep one optional sample only if it fits the interaction budget.

Do not make an expansive open world, full vehicle damage simulator, pressurized cabin, or simulated Earth operations center part of this minimum. Clear surface feedback and dependable input matter more than map size.

### Implementation order and acceptance gates

1. **Vehicle proving ground:** Manual drive/brake/reverse; full-size collision; stopped/parked entry and exit; both views; frame-rate-independent travel. Gate: a player can drive and stop safely without story scripting.
2. **Terrain and route loop:** Firm/rough/loose ground, two corridors, authored recovery, manual return, map and waypoints. Gate: the learner can avoid the hazard entirely or recover from a shallow mistake using evidence.
3. **Episode and science:** Readiness, passenger state, resource forecasts, context/close-view record, optional task decision, return/accountability. Gate: every completion depends on actual player actions.
4. **Narrative and teaching:** Dialogue, audio priority, immediate feedback, assessment, four endings, persistence and checkpoint labels. Gate: no generic or unearned debrief claims.
5. **Integration and presentation:** Episode access, production entry point, packaged assets, regression and browser verification. Gate: Mission 1, `/campaign.html`, and `/models.html` still work; new page works in a production preview.

For a developer already comfortable with this codebase, a rough planning allowance is **5–9 focused development days**, including tuning and browser checks. This is an estimate, not a delivery promise. High-detail art, full physics, or a larger map increases it. An early driving-only prototype should precede narration production.

### Integration specifics

Use a separate `mission2.html` Vite entry initially. Add it to `vite.config.js` alongside the existing game/campaign/models entries so production builds include it. A mission-select dialog can link to Mission 1, Mission 2, and the independent campaign without changing the default landing route. Later, “Continue to Mission 2” may appear after a prepared Mission 1 ending.

Use a versioned, namespaced save such as `mission-control-jr.episodes.v1`. Store no campaign state there. Handle missing, corrupt, outdated, or unavailable local storage by offering the canonical recap and a fresh episode. Completion should not depend on local storage availability.

Meaningful verification includes reducer/ending gates, return-budget arithmetic, fixed-step frame-rate invariance, braking and collision behavior, pause/input cleanup, passenger/accountability checks, and corrupt-save handling. Browser scenarios should cover both views, safe avoidance, shallow recovery, abort, low-margin return, checkpoint retry, and missing audio. Run the project's tests and production build, and smoke-test Mission 1/campaign/models. Do not claim these future checks have already passed.

## Part 9: Mission Assessment

### Competencies and transparent rubric

This is an original junior-learning rubric, not a NASA certification. The operational ending, assistance label, and competency evidence remain visible separately from the optional score.

| Competency | Observable indicator | Score rule |
| --- | --- | --- |
| Vehicle and EVA readiness | Five readiness groups verified, including actual steering/brake test | 4 per completed group; **20 maximum** |
| Planning and adaptation | Evidence-based route reason, return projection checked, hazard-driven revision or justified abort | 5 each; **15 maximum** |
| Safe navigation | Collision episodes and time above applicable advisory speed after grace periods | Collision component `max(0, 10 - 2 × episodes)`; speed component `10 × (1 - warnedOverspeedDrivingSeconds / totalDrivingSeconds)`; **20 maximum** |
| Reserve management | Optional work decision checked against forecast; return charge at least 20; both suit reserves at least 20 on return | 5 each; **15 maximum** |
| Scientific observation | Context image, scaled close view, accurate location-linked description | 5 each; **15 maximum** |
| Communication | Departure report, hazard/evidence report, return report | 2 + 2 + 1; **5 maximum** |
| Operational completion | Both field crew back, vehicle stopped/parked, crew accounted for | **10 maximum**, all required |
| Total | Seven competencies | **100 maximum** |

If there is no driving time, the speed component is **not demonstrated**, worth zero for the provisional score; never divide by zero or award safe-driving credit for standing still. Only meaningful driving time with movement above a small threshold enters the speed denominator. Clamp overspeed time to that denominator. Display one rounded final total, while retaining component precision internally.

An early abort does not receive invented science credit or the full navigation record. It can still demonstrate excellent judgment. A score is secondary to “what you demonstrated / what you have not yet practiced.” A high total cannot override a missing return or an unsafe reserve outcome.

### Evidence events

Record events with active simulation time, position, action, relevant resource snapshot, assistance status, and the evidence shown at that moment. Example types: `readiness_verified`, `brake_test_completed`, `route_reason_selected`, `projection_reviewed`, `hazard_observed`, `hazard_reported`, `powered_slip_started`, `collision_episode`, `photo_context_saved`, `photo_scale_saved`, `observation_labeled`, `optional_task_decided`, `return_reported`, `crew_accounted`, and `checkpoint_retried`.

Do not infer learning solely from button clicks. Readiness includes a controller test; a photograph must actually frame the required subjects; a hazard revision must change the route or result in an abort. Store first and corrected answers separately so feedback remains supportive without fabricating independent first-attempt mastery.

### Immediate feedback examples

- **Appropriate stop:** “You stopped before uncertain ground. Inspecting before entry preserved your route options.”
- **Slip response:** “The wheels were turning without matching ground progress. Releasing throttle avoided further powered slip.”
- **Poor route reasoning:** “Shorter distance can still cost more energy on loose ground. Compare surface and return margin.”
- **Useful science:** “This wide image connects the close-up to its location. Another scientist can interpret where the observation belongs.”
- **Unsupported interpretation:** “Your image shows layers and a boundary. It does not establish water or life.”
- **Wise omission:** “You declined optional work because its forecast breached the return margin. The required observation record is complete.”
- **Reduced margin:** “Your home reserve was 16 units against a planned 20. Review the recorded extra driving and slip time.” Use actual measured values; this example number is not hardcoded.

### Debrief structure

1. **What happened:** Return status, science record, minimum/home reserves, and assistance label.
2. **What caused it:** Three selected timeline events, prioritizing a successful adaptation, a meaningful cost, and the return decision. Show actual positions and before/after forecasts where available.
3. **What was demonstrated:** Competency cards with evidence and transparent scores. Mark skipped activities as not practiced.
4. **What to practice:** One actionable recommendation tied to the weakest demonstrated behavior, rather than a generic failure statement.
5. **Transfer question:** Ask the unfamiliar-route question from Scene 8. Record initial and revised response independently from the 100-point operational rubric.

To claim measured learning improvement later, add educator-reviewed questions and pre/post or repeated-transfer evaluation with actual learners. Completion statistics alone do not establish learning gains.

## Part 10: Expansion Roadmap

### Mission 3 — Evidence Before Answers

**Continuation:** The mapped rock contact provides a specific question: which observation would discriminate between alternative origins?

**Primary new responsibility:** Scientific reasoning, instrument selection, calibration, and comparing uncertain measurements. Use the returned image record and optional sample; if no sample was collected, use remote imagery or a documented later collection, without pretending the item exists.

**New mechanic:** Choose measurements, calibrate a simple instrument, compare readings and confidence, and write an evidence-limited conclusion. Driving can be a short optional transition; it should not dominate again.

### Mission 4 — The Quiet Leak

**Continuation:** Routine habitat monitoring shows an unexplained change in the water-loop balance during normal operations.

**Primary new responsibility:** System diagnosis and controlled testing, with Amara protecting research needs, Luca assessing crew impacts, Elena managing priorities, and Jin isolating the fault.

**New mechanic:** Compare trends, isolate one section at a time, test a hypothesis, and verify repair. Reuse the interior, tanks, terminals, and tool. Avoid another battery retrieval or immediate storm countdown.

### Mission 5 — The Shift We Share

**Continuation:** Successful exploration creates a demanding backlog of science, maintenance, and crew care.

**Primary new responsibility:** Team workload, fatigue recognition, clear handovers, and scheduling essential tasks.

**New mechanic:** Allocate roles and rest, prepare an operational handover, and respond to a subtle mistake caused by incomplete information. Reuse all four characters and adapt the existing campaign's resource concepts without merging save files automatically.

Each episode should preserve a small set of meaningful consequences—observations, reports, decisions, and demonstrated skills—while introducing one primary new responsibility. Mission 1 establishes preparation, Mission 2 adds mobility and field judgment, and later episodes broaden what the junior astronaut can understand and do.
