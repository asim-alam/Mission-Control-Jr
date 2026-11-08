# L03 — Beyond the Ridge

ID `lunar-relay`; Moon chapter 03; fictional Horizon Outpost field perimeter. Target 6–8 minutes. Requires physical lunar terrain, return-reserve forecasting, scheduled messages, relay state, and save/replay.

## Learning goal / NASA basis

Teach that a fast-traveling signal can still be unavailable because terrain blocks a link, and that communications infrastructure costs energy, transport, and setup time. S11 supports the terrain/visibility constraint; S07 provides Earth-visibility context; S14 or S05 provides the light-time explanation. About 1.3 seconds one way is a useful lunar reference, not a Mars-like minutes-long delay.

Use a fictional local ridge and a simplified geometric line-of-sight teaching model. Do not claim a validated radio link budget, multipath prediction, or an operational LunaNet service. If a relay spacecraft appears in contextual artwork, label it as an illustrative future network; the required gameplay hardware is a local portable mast.

## Scene / required artifacts

Build/integrate `lunar-relay-mast.glb`, `field-probe.glb`, cable/battery assets, and a ridge terrain patch. Reuse a suitable rover and existing navigation/collision code with explicit lunar configuration. Add a reachable **relay saddle**, a **near survey stop**, and a **far survey stop** behind the ridge. Terrain that blocks the link must be visibly understandable from a map and side-view diagram; a transparent illustrative line can show the simplified signal path.

Primary indicators: rover/relay energy, suit reserve, link status. Distinguish local outpost link from Earth uplink and explain which is unavailable. The relay must connect both required hops; merely raising a mast does not guarantee every path.

## State / tuning constraints

Fields: `routePlan`, `probeProgress`, `relayLocation`, `relayDeployed`, `relayEnergyWh`, `localLinkAvailable`, `earthLinkAvailable`, `queuedPackets`, `verifiedCrewPosition`, `returnForecast`, and `decisionHistory`.

Author receiver limits and terrain geometry with a documented simplification. Determine link availability from that geometry and powered/deployed relay state. A reference map can contextualize site selection but must not supply an exact blackout timeline from a long-term mean. A packet is queued until its applicable link opens; its light-time starts after departure. Received Earth advice can have a separate human processing delay.

Required balance: the far stop provides more observations but needs deployment time/relay battery or an explicitly limited planned-autonomy policy; the near stop supports a shorter direct-contact survey with a larger return reserve. Give each a valid mission result. Relay deployment consumes mass transport, time, and power rather than creating a free route upgrade.

## Mission script

| Beat | Trigger / physical action | Original dialogue / copy | Consequence |
|---|---|---|---|
| 1: Plan | Inspect route/visibility display | Elena: “Earth is close enough for short signal travel. This ridge can still hide the link.” | Explain propagation versus availability |
| 2: Inspect hardware | Check relay mast, battery, probe | Jin: “The relay can help if both sides can reach it. Carrying and powering it costs reserve.” | Reveal finite kit and return forecast |
| 3: Choose scope | Near survey or relay-supported far survey | Amara: “A shorter survey gives fewer observations. The farther stop could add another measurement.” | Save actual scope choice; no automatic science reward |
| 4: Deploy if chosen | Move cart, anchor mast, connect battery, verify both hops | Jin: “Mast raised. Now test the outpost side and the field side.” | Link only becomes available if geometry and power support both hops |
| 5: Work the field | Travel to selected stop, operate probe | Amara: “The probe needs time in place. Keep enough reserve for the return.” | Time/energy/suit cost; observations accrue only while probe conditions hold |
| 6: Handle blockage | Terrain occlusion or battery warning | Elena: “Your packet is queued, not lost. Move to the contact point, use the relay, or shorten the survey.” | Queue/delivery and reserve consequences use actual state |
| 7: Decide extra measurement | Optional stop with forecast | Amara: “One more result would help. Is the return margin still there?” | Accept work cost or return prudently |
| 8: Return and report | Dock/park and verify record delivery | Elena: “You brought the crew and observations home. Which part of the link needed your planning?” | Actual survey, message, relay, and reserve debrief |

No instant Earth answer should arrive while required links are unavailable. Local outpost radio can still work where its own line of sight exists; avoid one global “all communications off” flag.

## Actions / implementation

Actions: `inspectRoute`, `selectSurveyScope`, `loadRelayKit`, `moveToSaddle`, `anchorRelay`, `connectRelayPower`, `verifyHop`, `startProbe`, `sendPacket`, `shortenSurvey`, `returnToBase`, `confirmDelivery`. Pair hardware actions with physical proximity and parked/stable conditions. Retry must restore relay, queues, reserves, probe progress, and terrain model version together.

Use `relayDeployed && relayPowered && firstHopVisible && secondHopVisible` for the simplified repeater availability. If power empties during a packet cycle, follow the documented whole-packet teaching model consistently. Raising an unpowered mast does not count as restoring contact. For horizons beyond a small local patch, use an explicit curvature model or avoid claiming full lunar-horizon accuracy.

Phases: `brief → route-and-kit → optional-deployment → survey → return → delivery-check → debrief`. Message state operates concurrently. A reduced survey is allowed to transition to return without completing the optional far objective.

## Endings / replay

- **Relay-supported survey:** “The relay used reserve and setup time, and it supported the longer observation route.”
- **Direct-contact short survey:** “You collected fewer observations and kept a larger return reserve.”
- **Prudent turnaround:** “You shortened the fieldwork when the link or reserve changed. The crew and partial record returned.”
- **Training suspended:** “The return margin or contact rule was exceeded. Review the plan at the last safe point.”

Debrief separates travel time, time queued without a link, propagation time, processing time, delivered observations, setup costs, and return reserves. Replay near versus far scope using the same terrain and initial supply. Finish the Moon campaign with actual competence records, not a universal perfect score.

## Acceptance tests

Actual ridge obstruction changes appropriate link; unpowered/one-hop relay cannot restore both-hop route; packet cannot depart while required link blocked; lunar propagation is not a 12-minute Mars default; queued packet survives restore and delivers once; near and relay-far strategies both viable; optional work reduces margin; return/recovery path reachable; debrief reflects actual delivery. Browser proof must show mast deployment, a blocked/unblocked path, queued-to-delivered message, and a completed return.
