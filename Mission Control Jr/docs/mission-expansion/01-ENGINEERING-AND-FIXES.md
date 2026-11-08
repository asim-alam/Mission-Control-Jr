# Engineering contract and repairs

Read [the plan](README.md), [source contracts](02-NASA-SOURCES.md), and the assigned mission before editing. Paths below are relative to the game root. Preserve the working Three.js/Vite architecture; do not introduce a new framework, server requirement, account system, or external runtime dependency without a concrete need.

## 1. Required repairs to existing behavior

| ID | Existing files | Required change | Acceptance check |
|---|---|---|---|
| F01 | `vite.config.js`, `sources.html`, `scripts/package-game.py` | Build the Sources HTML and publish credit/objective content as HTML or copied static documents; include new mission/data/model credits | Clean static build serves the intended documents; no 404 or shell fallback at those URLs |
| F02 | `mission.js`, `demo.js` | Replace inventory-derived facts with explicit `batteryRecovered`, `batteryInstalled`, `allocation`; retain legacy fields through an adapter if needed | Early shelter reports no science allocation and no battery recovery; repeated actions cannot duplicate equipment |
| F03 | `demo.js`, `journey-state.js`, `mission2.js` | Derive carry text and next-mission starting state from the same carry rules | Every claimed change to rover charge/reserve appears in its actual state; prepared and early-shelter fixtures agree with narration |
| F04 | `mission.js` | Replace instant oxygen assignment as the entire allocation mechanic with finite power allocation, generation/processing, reserve use, and an actual experiment/crop benefit | Both life-first and science-first strategies can achieve distinct useful outcomes; neither manufactures reserves |
| F05 | `mission.js` | Model powered-system behavior at zero energy; completion depends on reserves/crew state, not only preparation flags | Zero energy cannot operate powered life support without an explicit alternate supply; known safe reserve-based survival remains possible |
| F06 | `story.js`, `main.js` | Water shielding reallocates mass instead of deleting it; shielding reduces an exposure model instead of granting immunity | Water mass is conserved except explicit consumption/loss; exposure remains nonnegative and can accumulate behind shielding |
| F07 | `story.js`, `main.js` | Greenhouse work incurs lighting/water/crew-time costs and affects a future harvest; fresh crops supplement food stores | No seed-to-meal instant reward; crop progress and harvested supplement survive relevant carry |
| F08 | `mission2-demo.js`, shared message module | Replace the display-only Earth delay with actual message state where relevant; preserve immediate local radio | Advice is not usable before arrival, waiting consumes resources, lunar and Mars parameters differ |
| F09 | `main.js`, debrief controllers | Seed state-affecting randomness and retain structured decision history, separate from the short HUD log | Same scenario/seed/actions reproduce outcomes; early important choices remain in final review |
| F10 | `LEARNING-OBJECTIVES.md`, `sources.html`, mission copy | Target 7–12, use current challenge URL, shorten instructions, make simple/details affect decision instructions as well as debrief | Source brief and age text match; child-facing choices are understandable and defined in context |
| F11 | Dependency setup and README | Reproduce install/build on Linux with lockfile; never commit `node_modules` or delete working source to repair native binding | `npm ci`, tests and build succeed in a clean install; document platform issue if unresolved |
| F12 | Existing debriefs/assessment | Store `attemptCompleted`, `success`, and `mastered` independently; make training suspension recoverable and migrate older saves without erasing progress | A completed but unsuccessful debrief remains an ended attempt without a mastery claim; a suspended attempt remains visible but does not count as completed or mastered |

Do not blindly preserve tests that enshrine the old defect. Update expected behavior with a documented rationale, while retaining coverage of prerequisites, duplicate-action prevention, collision/navigation, pause, save, and restart.

## 2. Campaign registry and saves

Current coupling to remove: `storyChapters = CHAPTERS.slice(0,3)`; hard-coded `3 CHAPTERS`; a single `current`; primitive-only carry truncated to 12 fields; chapter-name routing maps repeated in several places.

Introduce `mission-registry.js` as the source of truth for stable ID, campaign, display order, route, HTML entry, prerequisites, learning tags, source IDs, and asset bundle. Existing IDs `orbit`, `storm`, `rover`, `extended` stay stable. Assign the six new IDs exactly as in the roster. `extended` is training, not an extra numbered Mars story chapter.

Changes required:

- `journey-state.js`: campaign-aware progress, attempt records, per-mission current position, schema validation, migration.
- `journey.js` / `index.html`: Mars, Moon, Training selectors; counts derived from registry; Continue per campaign; direct practice; source and accessibility controls.
- `campaign-bridge.js`: registry-derived routing, new chapter messages, validated completion payloads, base-path-safe links.
- `vite.config.js`: new HTML entry points, real Sources/credits output, rewrites generated from registry or a shared route list.
- `scripts/package-game.py`: assert all new entries, source records, required assets, and docs are included; maintain audio/source exclusions intentionally.

Keep old direct URLs working. For deployment without rewrite support, provide a verified `index.html?mission=ID` fallback or physical route entries. Avoid root-absolute paths that break deployment below a subdirectory. Verify both root and `/mission-control/` deployment if supporting the README's subdirectory claim.

Proposed save shape:

```js
{
  version: 2,
  selectedCampaign: 'mars',
  campaigns: {mars:{current:'storm'}, moon:{current:'lunar-sunlight'}},
  missions: {
    storm: {
      bestResult: {outcome:'...', completed:true, mastered:false},
      attempts: [{id:'...', scenarioId:'...', seed:42, outcome:'...', assisted:false}],
      carry: {version:1, batteryRecovered:false, batteryInstalled:false, allocation:null}
    }
  }
}
```

This is an interface proposal; define exact discriminated records before implementation. Migrate the existing v1 journey and orbit checkpoint without erasing them. Unknown/corrupt fields fall back safely. Use bounded retention of attempts and independently versioned snapshot/event logs. A storage failure keeps the mission playable in memory and visibly explains that persistence is unavailable. Do not transfer Mars consumables into the separate Moon campaign.

## 3. Shared simulation APIs

Implement small modules in `simulation/`, with DOM/Three.js kept outside the core:

```text
simulation/clock.js         fixed-step time and scheduled events
simulation/resources.js     rate ledger, bounds, allocations, conservation
simulation/messages.js      outgoing/uplink/processing/downlink states
simulation/exposure.js      qualitative educational exposure accumulation
simulation/crops.js         staged growth, stress, lighting, harvest
simulation/decisions.js      immutable decision facts and action validation
simulation/replay.js         seeded scenarios, snapshots, comparison
simulation/provenance.js     validated source/derived/model metadata
missions/<id>/state.js       mission-specific phase/state creation
missions/<id>/actions.js     valid actions and effects
missions/<id>/scenario.js    typed archived inputs + authored parameters
missions/<id>/scene.js       3D environment and state visualization
missions/<id>/ui.js          instructions, decisions, debriefs
```

Use a shared runtime interface rather than copying the entire 40–60 KB existing scene/controller into six files:

```js
createMission({scenario, seed, initialCarry}) // serializable state
applyAction(state, {id, targetId, payload})  // validated, atomic effects
advanceMission(state, simSeconds)           // drains due events in time order
getObjective(state)                         // plain data for UI and navigation
getResult(state)                            // derived facts, never UI guesses
serializeSnapshot(state) / restoreSnapshot(data)
```

Deterministic modules may mutate internal state as current controllers do, provided mutation boundaries and replay serialization are consistent. UI buttons, proximity interactions, and keyboard actions all call the same validated action function. Guard repeatable versus one-shot actions explicitly. On rejection, do not apply partial costs or rewards.

## 4. Units and time contract

Use `simSeconds` as the common clock. Each scenario declares a visible playback scale or explicit step transitions. Pause freezes simulated time, resource consumption, events, messages, audio, and movement. A work action can deliberately advance time after confirmation; it must use the same event/ledger path even if its decision modal is open. Cosmetic animation cannot be the owner of mission logic.

All new model parameters are educational unless accompanied by a verified NASA reference and transformation. Suggested internal quantities:

| Field | Meaning |
|---|---|
| `energyWh`, `capacityWh`, subsystem `loadW` | Stored energy and power, with consistent integration |
| `airReserveUnits` | Explicitly labeled educational breathing reserve, not an atmosphere measurement |
| `waterKg`, `waterLocations` | Conserved inventory with location/access flags; consumption tracked separately |
| `foodPortions`, `freshSupplementPortions` | Packaged food versus modest crop supplement; not a complete nutrition model |
| `cropProgress`, `cropStress` | Educational growth/stress state in [0,1] |
| `exposurePoints` | Educational accumulated exposure; never labeled sieverts or medical risk |
| `dustLoad`, `filterRemaining` | Authored contamination/filter condition measures |

Power integration: `deltaWh = (generationW - servedLoadsW) * dtSeconds / 3600`. Never subtract watts directly from stored watt-hours. When a battery empties or fills within a tick, split the tick or otherwise integrate the boundary correctly. Use an explicit priority policy for essential loads; do not grant every load its requested power when supply is insufficient. Track actual served power, which drives air/crop/thermal effects.

Existing 0–100 mission units need an explicit adapter. Do not silently reinterpret 77 oxygen units as kilograms or 34 power units as watts. Carry condition modifiers can initialize a scenario from an authored capacity fraction, with that mapping documented.

Use one simulated-second integration steps for emergency missions unless a smaller step is justified. Multi-hour crop transitions can integrate analytically between scheduled boundaries, but results must match equivalent small-step tests. Clamp/render frame time without losing intended simulated elapsed time. Pause on background visibility unless intentionally documented otherwise.

## 5. Message queue contract

Each message includes `id`, sender/recipient, local-or-Earth channel, created time, departure time, one-way durations, processing delay, status, payload, and source/model provenance.

For a request with immediate departure:

```text
Earth receives = sendTime + outboundLightTime
Earth reply departs = receiveTime + processingTime
Crew receives reply = replyDepartTime + inboundLightTime
```

If the link is blocked before transmission, queue the whole teaching packet and start propagation only after availability returns. Use a documented packet abstraction rather than inventing detailed RF physics. A later blockage at reception can defer delivery to the next window. No duplicate delivery or time travel after restore. Local crew radio has its own short/local behavior and does not inherit Earth latency. M06 uses archived Mars geometry; L03 uses lunar light-time plus terrain blockage. Do not give the Moon a Mars-length propagation delay.

## 6. Exposure, crops, dust

Exposure is a time integral of a declared educational hazard profile multiplied by a nonzero protection factor. Moving water changes geometry/access; it does not destroy water. Current exposure never decreases because the player builds a shield. Log any transport or setup cost. Never claim complete radiation safety from one flag, or fabricate a clinical dose from a flare class.

Crop progress depends on served light, water, and elapsed growth time; one interrupted light period causes modeled stress rather than instant death. Show established plants and explicit day changes. Harvest the same tray only once; fresh vegetables supplement packaged food. Keep crop constants separate from the OSDR study facts.

Lunar dust comes from a declared contamination episode (previous EVA, equipment handling, or landed activity), not atmospheric winds. Dust removal affects equipment condition; electrical dust control is not radiation shielding. Maintain an airlock interlock and visible clean/dirty zones. Treat filtration efficacy as a model assumption unless sourced.

## 7. Debrief and replay

The result must contain actual decisions, resource deltas, opportunity cost, crew/training outcome, source IDs, and simplification text. A missing/null choice must stay missing in text. Keep full bounded decision history separately from transient HUD chatter. Use neutral words such as “completed with less reserve,” not punitive labels for rational trade-offs.

Replay restores the selected decision's state, scenario version, source snapshot, seed, and event sequence. Compare alternatives by running the same controller. Do not fabricate the “other choice” text by guessing its result. Scope comparison to changed causal outcomes; do not claim one action caused a difference actually produced by a different random draw.

## 8. Verification and release gates

Run the existing suite before changes. Add meaningful tests for changed rules and the new systems. Avoid replacing behavior tests with regex checks for button labels.

- Energy/air depletion and within-tick supply boundaries.
- Water conservation; nonzero shielded exposure; crop rate/harvest idempotence.
- Message arrival/blackout/pause/save-restore behavior.
- Same-seed same-action replay; different choices create expected differences.
- Carry/debrief consistency, v1 migration, independent campaign progress.
- Preconditions, proximity/collision, duplicate actions, action-cost atomicity.
- Two feasible strategies and a prudent reduced-objective path per mission.
- Real source/asset availability in a clean production build; all direct routes and source links.
- Browser start, key decisions, recovery/replay, debrief and return navigation for all nine story missions.

Use the existing `npm test` and `npm run build`; add focused commands only where needed. Capture actual new test counts and build results. Model validation requirements are in the asset spec. Profile an ordinary integrated-GPU laptop and provide a low-quality setting; do not claim mobile/touch support without verifying the actual required interactions. No agent may report child-learning results without real observations.
