# Mission Control Jr: Mars and Moon expansion build plan

Prepared 8 November 2026. Status: **six new missions and their core systems are implemented; release acceptance checks remain open**. See [`implementation-status.md`](implementation-status.md) for evidence and unresolved checks.

Project root: `/home/asim/CODE/Mission Control Jr/Mission Control Jr`.

## Start here

This package specifies six new fully playable missions, repairs to the existing game, NASA evidence requirements, new 3D assets, and implementation-agent work orders. It answers the user's expanded request to add lunar missions. That request supersedes the older audit's recommendation to stay on one world; the audit's factual findings remain applicable.

Read in this order:

1. [Engineering and previous-issue fixes](01-ENGINEERING-AND-FIXES.md).
2. [NASA source and data contracts](02-NASA-SOURCES.md).
3. [Required 3D asset build specification](03-3D-ASSET-BUILD-SPEC.md).
4. [Agent work orders and integration gates](04-AGENT-WORK-ORDERS.md).
5. The six mission scripts linked below.

The earlier [source audit](../../NASA_CHALLENGE_AUDIT_AND_ROADMAP.md) records 95 passing baseline tests and a successful clean-copy build. Those results describe the pre-expansion review. The current implementation has 178 passing tests and passed a clean `npm ci`/test/build in an isolated copy; this does not close browser-path, target-age, or hardware acceptance by itself.

## Mission roster

Keep the existing three story chapters and the Thirty Sols exercise. Add six story missions, giving **nine story missions plus one command exercise**.

| Campaign | Display order | Stable ID | Title | Central decision | Script |
|---|---:|---|---|---|---|
| Mars | 01 | `orbit` | Arrival at Mars | Diagnose, isolate, verify | Existing; preserve and simplify onboarding |
| Mars | 02 | `storm` | Before the Storm | Air reserves versus experiment support | Existing; required model/debrief repairs |
| Mars | 03 | `rover` | Tracks in the Dust | Science opportunity versus return reserve | Existing; add true message state and accurate carry |
| Mars | 04 | `solar-shelter` | A Place to Hide | Shield placement versus preparation time and supply access | [M04](missions/M04-A-PLACE-TO-HIDE.md) |
| Mars | 05 | `greenhouse` | The Greenhouse Promise | Today's energy versus tomorrow's fresh-food supplement | [M05](missions/M05-THE-GREENHOUSE-PROMISE.md) |
| Mars | 06 | `earth-delay` | Earth Can't Answer Yet | Act locally, bridge the delay, or suspend the experiment | [M06](missions/M06-EARTH-CANT-ANSWER-YET.md) |
| Moon | 01 | `lunar-sunlight` | Chasing the Sun | Move a collector versus spend stored energy | [L01](missions/L01-CHASING-THE-SUN.md) |
| Moon | 02 | `lunar-dust` | Dust at the Door | Decontamination method versus power, air, and filters | [L02](missions/L02-DUST-AT-THE-DOOR.md) |
| Moon | 03 | `lunar-relay` | Beyond the Ridge | Deploy a relay versus shorter survey or lost contact | [L03](missions/L03-BEYOND-THE-RIDGE.md) |
| Training | Separate | `extended` | Thirty Sols | Long-term linked resource management | Existing; adapt shared systems incrementally |

Mars is a fictional Meridian sequence: arrival Sol 11; storm Sol 12; rover Sol 16; shelter exercise Sol 18; greenhouse Sols 32–34; delayed-advice exercise Sol 35. The Moon campaign is a separate fictional training assignment at **Horizon Outpost**, not the Mars crew instantaneously traveling to the Moon. Display “Separate lunar training assignment” at its opening. The same cast can appear as simulation instructors; do not imply these are documented NASA missions or actual astronauts.

## What “fully playable” means

Every new mission must have all of the following before its card becomes publicly playable:

- Its own introduction, named location, working 3D environment, and readable learning objective.
- At least two consequential decision points, with at least two viable overall strategies. A prudent return or reduced science result can be successful; do not force one universally correct answer.
- Physical interaction with relevant 3D hardware, synchronized with state. A button opening a fact panel alone does not count.
- One consistent simulation clock and resource costs for work, waiting, and transport.
- A visible delayed consequence, based on the actual decision history.
- A source explanation distinguishing observations, reference assumptions, and authored gameplay.
- At least three outcome descriptions: objective achieved, prudent limited outcome, and recoverable training suspension.
- A short debrief, replay from the same seed, and a selected decision comparison.
- Direct route, campaign navigation, pause/resume, restart, keyboard and pointer controls, captions, and source/credit access in the production build.
- Meaningful controller tests and a real browser walkthrough. At least one target-age usability round is a project-level release gate.

Keep two or three primary indicators visible at a time. Let the mission select which ones matter. Explain other resources when a decision needs them.

## Story and learning style

All scripts in this package are original fictional game writing informed by NASA materials. They are not NASA quotations or operational procedures. The child plays Jin or a junior commander; Elena, Amara, and Luca provide short advice without taking away the decision.

Target ages 7–12. Simple mode uses one short instruction and two or three labeled options. Details mode adds quantities, graphs, model limits, and source identifiers. Keep reading time outside pressure: opening instructions, source panels, help, and debrief pause time. Decisions can initiate modeled work or an explicit “advance mission time” step after confirmation.

Do not use crew deaths as the main teaching penalty. Suspend unsafe training, preserve the child's decision record, explain the cause, and offer a checkpoint. Preserve a meaningful resource cost without humiliating or frightening the player.

## Required delivery slices

The full requested scope is all six new missions. Build in slices so each is reviewable and the game stays runnable.

| Slice | Deliverables | Gate |
|---|---|---|
| A: foundations | Previous bugs fixed; source packaging; registry/save migration; shared clock, ledger, messages, provenance | Existing chapters still work; required fix checks pass |
| B: reference mission | M04 plus its actual GLBs and archived source integration | Complete physical interaction → decision → consequence → debrief |
| C: challenge coverage | M05 and M06, replay comparison, greenhouse/pump assets | Power, life support, food, radiation, delay are all demonstrable |
| D: Moon | L01, L02, L03; lunar environment and hardware | Every lunar mission distinguishes its conditions from Mars |
| E: release | Whole-roster walkthrough, target-age fixes, deployment, source and model verification, presentation | No placeholder mission cards or required missing assets |

For a short event, present the completed slices honestly. Do not call a scripted slide, disconnected menu choice, or unfinished card a finished mission. Do not silently drop lunar delivery; record incomplete scope if the actual build window ends.

## Judge path

Provide a selectable “Mission sampler” with saved entry snapshots, not automatic completion. Suggested 7–9 minute route: fixed storm allocation (2 min), M04 shelter choice (2 min), M05 established-crop checkpoint (1 min), M06 request/reply dilemma (1 min), lunar L01 comparison and replay (1–3 min). This is a guided sampler across fictional scenarios; label it as such. Every mission also needs a normal start and full standalone playthrough.

## Implementation handoff

The work orders explicitly require agents to **build, export, integrate, and validate the necessary 3D artifacts**. Procedural Three.js-generated, self-contained GLBs fit the current project. A filename in a manifest, concept image, or TODO is not a delivered asset. See the [asset specification](03-3D-ASSET-BUILD-SPEC.md) for the required models, animated nodes, collision proxies, budgets, and evidence.

The six new controllers, scenes, mission cards, source-backed context, and required generated GLB assets are now present in the worktree. The specifications remain the implementation contract for reviewing the delivered code and for any future agent work. Current code evidence and remaining acceptance work are tracked in [`implementation-status.md`](implementation-status.md); do not mark a mission complete solely because its controller or asset file exists.
