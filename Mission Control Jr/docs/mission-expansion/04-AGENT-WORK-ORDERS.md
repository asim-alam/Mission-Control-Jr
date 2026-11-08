# Implementation-agent work orders

These are execution and review instructions for implementing or auditing the expansion. The six missions and core integration are now in the worktree; use the current implementation-status record to distinguish delivered work from acceptance that remains. The package defines required scope, not permission to claim unverified completion.

## Copy-paste lead-agent instruction

> Implement the Mission Control Jr expansion specified in `docs/mission-expansion/README.md`, reading all linked contracts and all six mission scripts. Repair the audited issues in `01-ENGINEERING-AND-FIXES.md` and deliver six fully playable missions: `solar-shelter`, `greenhouse`, `earth-delay`, `lunar-sunlight`, `lunar-dust`, `lunar-relay`. Preserve and integrate the existing three chapters and Thirty Sols. Build the required actual 3D artifacts: editable procedural sources, exported self-contained GLBs, named animated/interaction nodes, collision proxies, metadata, and scene integration. Do not stop at text scripts, cards, placeholders, asset manifests, or concept images. Use verified NASA materials with explicit provenance and honest educational simplifications. Complete meaningful tests, model validation, clean production packaging, and browser walkthroughs before claiming completion. Follow the ownership/dependency gates in this file. If a dependency cannot be verified, record exactly what is missing and keep the affected mission out of the completed roster.

## Shared rules for every agent

1. Read applicable project instructions, this package, and your assigned files. Inspect the current source before editing; the baseline filenames are real, while proposed modules may not exist yet.
2. State which work order and files you own. Do not overwrite another worker's shared modules or reformat unrelated code. Route interface changes through the integrator.
3. Use current Three.js/Vite conventions and existing model/voice/navigation infrastructure where justified. Avoid a wholesale framework rewrite.
4. Keep state/clock/resource logic independent of the scene and UI. Do not create separate hidden rules for buttons, keyboard, and 3D interactions.
5. All new resource rates, geometry, hazards, and dialogue are authored unless their provenance explicitly proves otherwise. No fake NASA records, fabricated live badges, invented dose measurements, or implied NASA endorsement.
6. Every action cost and success statement must come from actual state. A title/card/voice line is not a mechanic.
7. **Create and integrate the necessary 3D artifacts.** If an asset worker supplies a model, the mission owner still verifies correct named nodes, interactions, collisions, disposal, and production loading.
8. Reading/help/pause must stop mission time. Deliberate waiting/work/time skips must advance the shared ledger/events/messages. Menus may not be used to bypass a cost or secretly deliver advice.
9. Keep two or three primary indicators; use progressive disclosure. Provide readable captions and accessible alternatives for 3D interactions.
10. Preserve v1 saves and old routes. Separate Mars and Moon inventories. Practice/replay must not fabricate campaign completion or overwrite a better result unintentionally.
11. Report actual checks and failures. Do not inherit the old “95 tests passed” statement as proof that your changes passed. Do not claim child testing, mobile support, model delivery, or data integration without evidence.
12. Deliver a concise implementation note: files changed, why, tested scenarios, source records, asset outputs, limitations, and outstanding dependencies. Never hide required unfinished work in a “future improvements” section while declaring scope complete.

## Work orders and ownership

### W00 — Integration lead / contract freeze

Own: registry, schema/API decisions, coordination document, final integration. Read current `journey-state.js`, `journey.js`, `campaign-bridge.js`, `vite.config.js`, and existing save/carry tests.

Deliver a short `implementation-status.md` mapping every F01–F12 and mission/asset to owner and status. Freeze mission IDs, state interfaces, asset anchor names, source IDs, and carry version contracts before multiple workers depend on them. Define valid outcomes/completion/mastery without changing existing IDs. Coordinate four distinct work lanes if using parallel implementation: foundations/integration, NASA data, 3D assets, mission behavior. Expand or sequence lanes only when ownership remains clear.

Gate: all workers know the same schema and file boundaries. Do not spend the build window designing a generic plugin engine beyond the six specified missions.

### W01 — Existing fixes and shared simulation

Own: F02–F09/F12 controller fixes; `simulation/*`; adapters in `mission.js`, `main.js`, `story.js`, `mission2.js`; focused tests. Coordinate UI/debrief and registry edits with W00/W07 to avoid concurrent writes.

Implement the finite energy/served-load ledger, air reserve consequences, mass-preserving water placement, crop model, message queue, immutable decision facts, seeded replay, and snapshot validation. Correct storm research benefit and zero-power behavior. Define explicit carry facts that the renderer consumes; do not infer battery recovery from `battery:false`.

Required regression cases: early shelter with no recovery/allocation; recovered but not installed; installed; life/science viable variants; zero-energy model response; carry narration equals rover charge/reserve; shield non-immunity and water conservation; message two-leg timing; seed-stable replay; bounded complete history.

Gate: shared modules and existing repaired paths work before new mission logic duplicates them. Provide fixture interfaces to mission workers.

### W02 — NASA inputs and science traceability

Own: `public/data/*`, import/normalization scripts, provenance/model-assumptions schemas, source notes. Coordinate `sources.html` publishing through W07.

Read `02-NASA-SOURCES.md`. Obtain and verify a real DONKI event, OSD-269 protocol metadata, dated Horizons light-time table, and lunar illumination/visibility product summaries. Preserve raw excerpts and checksums. Data availability may require adapting the selected record; never fabricate a response to match a desired story. Keep source observations separate from composite/authored timings and balancing constants.

Deliver small import scripts runnable without shipping credentials to the browser. Archive selected verified data; public play must not depend on an API request. Provide evidence of each field's use in a controller. For reference-only mission science, identify it as reference, not telemetry. Review lunar no-wind, map-average/timeline distinction, radiation-dose limitations, crop timing, and communication geometry.

Gate: a judge can trace original record → derived field → model use → visible consequence. No data-driven mission is complete with placeholder source IDs.

### W03 — 3D artifact production

Own: new generator/source files, new GLBs, asset manifest entries, asset validation/report, model credits. Existing assets remain intact unless an agreed specific fix requires changing them.

**You must build the actual assets in `03-3D-ASSET-BUILD-SPEC.md`.** Start with shared habitat/experiment/portable-storage contracts, then M04 shelter assets, M05 greenhouse, M06 service module, and lunar mast/dust/relay kits. Use procedural Three.js plus existing exporter tooling. Preserve named nodes for moving parts; generate simple collision/interaction metadata. Do not optimize away required articulations.

Deliver reproducible commands, actual GLBs, per-model validator/count/bounds data, and screenshots of relevant states. Pair with mission owners to verify physical integration, approach paths, collision, camera, interaction effects, and asset disposal. A model gallery can assist review but does not replace the playable integration.

Gate: no missing required asset URLs; no empty placeholder models; no required external buffers; zero validator errors; animation nodes and metadata survive export.

### W04 — Mars mission M04 / reference implementation

Own: `missions/solar-shelter/*`, its root HTML entry if assigned by W00, mission-specific tests and dialogue file. Use shared modules; do not independently invent a second clock, exposure ledger, or message format.

Follow the complete [M04 script](missions/M04-A-PLACE-TO-HIDE.md). Implement source inspection, physical mass movement, graded exposure, real experiment benefit, supply access, crew recall, result and replay. Integrate actual shelter GLBs from W03 or build them yourself if necessary. Hand back a working mission as the reference pattern for the other five.

Gate: two viable strategies, conservative completion, zero-power behavior, no disappearing/duplicated water, source trace, actual 3D states, browser walkthrough.

### W05 — Mars missions M05 and M06

Own: `missions/greenhouse/*`, `missions/earth-delay/*`, their dialogue/tests; root entries assigned through W00. Implement sequentially or assign separate owners only after shared APIs stabilize.

M05: established trays, served-light/water growth, two cultivation periods, real fault response, one-time harvest, packaged-food distinction, source drawer, replay.

M06: coolant-pump fault affecting the modeled air processor, interlocked physical service, finite spare/reserve, actual Earth queue, local repair versus conserve-and-bridge strategies, visible timeline, replay.

**Build/integrate the actual greenhouse, irrigation, service pump, reserve cylinder, and message-terminal states.** Do not replace a repair or harvest with an instantaneous modal reward. Both missions must work standalone with explicit practice defaults and in campaign with repaired carry.

Gate: tested long-step crop integration and two-leg message timing; two viable strategies per mission; scene actions and results agree with ledger; real assets and provenance available in build.

### W06 — Lunar missions L01–L03

Own: `missions/lunar-sunlight/*`, `missions/lunar-dust/*`, `missions/lunar-relay/*`, shared lunar scene configuration, assigned tests/dialogue. Coordinate reusable terrain/habitat/mast source ownership with W03.

Implement the three lunar scripts completely. Create a distinct lunar environment and separate campaign inventory. Use actual model-average site data honestly; authored short shadow windows remain labeled. Implement collector/cable/battery planning, EDS-inspired equipment treatment plus airlock procedure, and relay geometry/packet availability.

**Build and integrate the lunar habitat variant, solar mast, cart, cable reel, dust rack, boot tray, removable filter, relay mast, probe, and terrain artifacts necessary to play.** Reuse real suitable assets intentionally; do not recolor a Mars storm scene and call it lunar science.

Gate: no lunar windstorm; no Mars-length lunar propagation; actual shadow/deployment/cable and line-of-sight effects; manual/powered cleaning alternatives; airlock interlocks; all three missions complete, recover, replay, and navigate.

### W07 — Campaign UI, accessibility, packaging, release verification

Own: coordinated `journey*`, `index.html`, `campaign-bridge.js`, `vite.config.js`, source/credits outputs, packaging/README, F01/F10/F11, final test evidence. Do not overwrite mission state or procedural generators.

Replace three-chapter assumptions with registry-driven campaign lists and separate training. Migrate v1 progress. Add source/context drawers, age-appropriate simple/details copy, captions, pause, and keyboard/pointer alternatives. Publish all required source/credit files. Add the mission sampler as an honest sequence of entry snapshots; do not fake completion.

Verify a clean install/build, all existing and new tests, required GLB validation, actual built routes under the claimed base paths, source pages/credits/raw excerpts, and fresh-browser normal/reduced/checkpoint/replay paths. Profile scene switching for leaked WebGL/audio resources. Conduct target-age testing through parents/teachers and record anonymous actual findings; if access is unavailable, mark that validation pending.

Gate: every required mission is physically playable and source-traceable in production, or explicitly listed incomplete. Record exact commands/results, not generic “all done.”

## Integration sequence and shared-file policy

```text
W00 contracts
  → W01 foundation + W02 data + W03 assets (separate ownership)
  → W04 complete reference mission
  → W05 Mars coverage + W06 Moon campaign + W07 integration
  → W07 whole-roster validation and release
```

W07 packaging/source fixes may start early after W00 assigns ownership. Shared-file edits are serialized; mission-local work can proceed independently once APIs freeze. Use isolated branches/worktrees only if the actual repository supports them; do not assume this folder is a Git checkout. Never discard another person's changes to make an integration easier.

## Completion checklist returned to the user

- F01–F12 status with evidence and any unresolved issue.
- All six new IDs, titles, normal-play routes, and actual outcomes.
- List of generated and reused 3D artifacts, generator commands, validator results, and integrated-state screenshots.
- Actual NASA record/product IDs and source-to-mechanic explanations.
- Clean test/build results, direct-route/source-page checks, walkthroughs, and measured performance.
- Save migration/carry/replay verification.
- Actual target-age observations or clearly pending status.
- Remaining limitations and honest completed scope.

The implementation agent's final response must distinguish **implemented**, **verified**, and **still pending**. Do not report this planning document itself as delivery of the missions or 3D assets.
