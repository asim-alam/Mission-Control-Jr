# Mission Control Jr. · UI and environment decisions

**Design review · November 12, 2026**

## What the challenge asks

**Build a trainer where children ages 7–12 run an outpost and learn what their decisions cost.** The brief asks for decisions about life support, radiation shielding, power budgeting, food production, and communication delay. A child should be able to choose, see the effect now or later in the mission, and explain why it happened. The brief encourages real NASA data, clear attribution, replay, and easy access. The format is open. Browser play with no account or download is our product decision. [2026 NASA Space Apps challenge brief](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/)

## Decision

**Make Before the Storm the flagship.** Put a direct **Play the Mars Storm** entry on the home screen and start near the power allocation decision. Give the player a short briefing, a battery meter, and an air meter. They can use spare power to make more air or save storm readings when air reserves allow. Show the benefit and cost of each route, then let them replay from the same starting state. The current storm controller already records experiment data, but reserves its strongest outcome for life support. Before judging, show what the science route preserves and make crew safety depend on reserves and preparation. The result should answer “What did my choice change?” in plain language.

Use the existing missions to show the rest of the brief. Each row describes the decision to demonstrate and verify in play.

| Challenge objective | Mission | What the player should see |
| --- | --- | --- |
| Power budgeting and life support | **Before the Storm** | As the sky darkens, solar output falls. Sharing the same battery changes air reserves and the science result. The mission uses archived Opportunity storm readings to shape the sunlight curve. |
| Radiation shielding | **A Place to Hide** | A solar particle event prompts a shelter decision. Show what shielding uses and how protection changes. Use the archived DONKI event as context and label the game’s exposure model. Present this as a separate hazard from the Martian dust storm. |
| Food production | **The Greenhouse Promise** | Light and water allocated now affect crop progress and the later harvest. Credit the OSDR research as context and label the accelerated growing timeline. |
| Communication delay | **Message to Earth** | The player can troubleshoot locally while a reply is in flight. Show what happens to the outpost while waiting and explain the JPL Horizons basis for the modeled signal delay. |

Give each featured decision a small in-game source card showing **what NASA observed or calculated, how the game uses it, and what the team simplified**. Use the [existing data provenance](/home/asim/CODE/Mission-Control-Jr-publish/Mission%20Control%20Jr/public/data/provenance.json) as the starting point.

Give the game the visual identity of a **warm, working Mars expedition**. In the storm mission, show the system through darkening sunlight, a changing panel readout, and the equipment the player is deciding to power. **Arrival at Mars** remains the campaign opening and a useful place to refine docking guidance and room art once the outpost decision works.

## What I observed

I played the local browser build through assisted approach, docking, opening the hatch, and entering the station. I tried the station practice, skipped it, used the guided walk to the power panel, and inspected the gauge. It told me the station was using **9 of 10 power units**, with only **6 available in Mars’ shadow**. That is the kind of concrete system behavior the presentation should bring forward. The full radio repair, the landing, mobile play, and performance were outside this session. I reviewed Last Light Academy through your two screenshots and its local project documentation. I did not independently play its native build.

| Area | Last Light Academy reference | Mission Control Jr. in play | Design decision |
| --- | --- | --- | --- |
| Opening | The illustrated arrival establishes the crew and setting before the interface takes over. | Mars is already a strong visual, but a mission checklist is followed by a second flight guide before the player gets to fly. The guide’s text broke into narrow columns in the view I used. | Open on Mars and Asteria with one line from Elena. Put **Fly with help** and **Fly myself** in view. Teach alignment and braking when the player can act on them. |
| Task guidance | The yellow outline, object name, and `E` prompt point to the same object. | At the power panel, the job card, checklist, walk buttons, arrow, and object label all signal what to do. The large arrow points at the whole panel, while the actual action needs a specific control. My click there surfaced the gauge prompt. | Use one objective card with **Walk there** and one small marker at the relevant control. At arm’s reach, replace the marker with a specific prompt such as **E / Click · Turn on the radio receiver** when that is the next step. |
| Room | Ceiling structure, floor fasteners, handholds, furniture, and room signs give the commons a believable scale. | Asteria has orange route lines, physical equipment, a panoramic window, and an animated crew. Large flat wall surfaces, dark blocks, and bright ceiling hotspots make the arrival corridor feel sparse. | Add details that describe a working spacecraft: recessed wall panels, labeled stowage, grippy deck sections, and warm light at occupied workstations. Use the observation window as the first room’s visual landmark. |
| HUD hierarchy | The pictured scene gives most of the screen to the room and calls attention to one task. | The title, timer, job card, meters, walk menu, and Pip can all compete. After boarding, a five-step briefing leads into another five-step practice. | Keep the current task and relevant status visible. Put the checklist, extra destinations, and practice behind **Details** or **Map**. Keep Pip available as a read-aloud helper and bring up the tip when it adds something useful. |

## Art and interface direction

- **Asteria:** warm off-white pressure walls, graphite equipment and deck surfaces, amber route markings, and cool light from the Mars window. Use a shared material palette and let props show how the station works. Give the radio rack and power panel different silhouettes so players can recognize them before they read a label.
- **HUD:** dark blue panels with high contrast, generous type, and a restrained amber accent for the next action. Use the same shape and wording for the objective, marker, and interaction prompt. Pair status colors with words or symbols. Keep plain labels such as **Power**, **Radio**, and **Charge**.
- **Cadet and Explorer:** keep assisted flight, click-to-walk, captions, and keyboard controls. For Cadets, show a short instruction and the action it refers to. Put precise telemetry, additional explanations, and free exploration within reach for Explorers. Both modes should play the same mission.
- **Cinematic style:** use the existing Mars model, a deliberate opening camera angle, and a short radio line. Give the player control promptly and respect reduced motion. Illustrated crew cards can be considered later if the first scene still needs a stronger character introduction.

## Browser decisions and priority

| Order | Scope | How to know it worked |
| --- | --- | --- |
| **1. First outpost decision** | Give the storm demo a direct link, two choices with consequences, a replay checkpoint, and visible source attribution. | A new player reaches the choice within about a minute and can explain what the battery did and what their choice gave up. Both paths play through from the same checkpoint. |
| **2. Visual pass** | Apply one objective, one marker, and one context prompt to the storm demo first. Then streamline the orbit briefing and dress the first cabin. Reuse geometry and materials, bake small details into textures, and reserve dynamic lighting for mission state. | Players can find the intended control and see the environment respond. The interface is readable in the target browser, including during the cabin handoff. |
| **3. Play and measure** | Try the browser link on the ZBook and observe a few children across both age bands. Record time to decision, where they need help, what they can explain after replay, frame rate, and download size. | Use a stable **30 fps or better** on the target laptop as an initial performance floor. Treat the child observations as a small usability sample and fix the first recurring problem. |

Defer a whole-campaign restyle, video cutscenes, new character rigs, and expensive post-processing until the flagship decision works. In judging, let the judge play it and use one slide to show how the other three missions cover shielding, food, and communication delay.

**Competitive opportunity:** Last Light shows how a believable room and a clear object prompt can sell the astronaut fantasy. Mission Control Jr. can pair that level of care with a direct browser link, clearer help for younger players, and an immediate engineering choice. The strongest demo is a judge or child reaching the right control and seeing the outpost respond to their own decision.
