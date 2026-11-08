# M04 — A Place to Hide

ID `solar-shelter`; Mars chapter 04; Meridian, fictional Sol 18. Normal play target 6–8 minutes. Implement after the shared resource/exposure ledger and storm carry repair.

## Mission purpose and NASA basis

Teach that shielding reduces future exposure, moving supplies has costs, and existing mass can serve more than one purpose. Use S02 DONKI for a verified archived event record and S12 for shelter-design inspiration; see [source contracts](../02-NASA-SOURCES.md). An authored training hazard envelope is not a NASA prediction of particle arrival or tissue dose.

Opening badge: “Fictional Mars training mission · inspired by an archived NASA space-weather record.” The source drawer shows the actual event identity and explains which timing/risk values are authored. Do not represent a detector near Earth as a sensor at Meridian.

## Playable scene

Reuse the habitat interior, airlock, crew, and terminal. Build and integrate `shelter-frame.glb`, instanced `water-bag-module.glb`, `exposure-monitor.glb`, and `experiment-rack.glb`. Put supply storage, shelter slots, and experiment controls in reachable physical locations. Moving a bag must visibly move the same inventory item from its stored location to the shelter.

Primary indicators: air reserve, stored energy, accumulated exposure. Water remains in a context drawer with separate “total,” “accessible,” and “installed as shielding” values. A plain-language exposure label accompanies the numerical educational points.

## State and authored tuning seed

New fields: `phase`, `hazardProfileId`, `bagLocations`, `shieldLayout`, `crewLocations`, `experimentPoweredSeconds`, `experimentPreserved`, `waterAccessibleKg`, `exposureByCrew`, and `decisionHistory`. Use a map of crew to exposure; aggregate display may show maximum/trend.

Initial tuning candidate: 20 simulated minutes; 140 Wh initially stored in a 400 Wh battery; no solar production during this exercise; essential loads 180 W; experiment load 240 W; three 5 kg portable water modules. These values are authored difficulty parameters, not measurements or NASA hardware specifications. A 5 kg module is handled using a cart/assisted transfer, not tossed by the child character.

Suggested hazard envelope: background until minute 8, elevated activity from minute 8 to 18, then a decline. Protection multipliers remain positive: ordinary habitat 0.6, two correctly placed modules 0.35, three correctly placed modules 0.2, exposed service area 1.0. These are qualitative game coefficients. Do not display them as medical shielding performance.

Require a balance test before finalizing values. Essential-only and protected-experiment strategies should both be viable in suitable carry conditions, with different reserves and science results. Do not force the life-first player into failure merely for accepting reduced science.

## Mission script and interactions

| Beat | Trigger / action | Original dialogue / child-facing copy | State consequence |
|---|---|---|---|
| 1: Brief | Enter interior; inspect monitor | Elena: “A space-weather warning has reached Meridian. We can make our shelter better, but moving supplies takes time.” | Pause briefing; show NASA archive badge; no resource grant |
| 2: Read the evidence | Open archived event details; then choose Begin | Luca: “This record tells us about a real event. The warning clock here is part of our training.” | Start authored scenario clock; store source ID |
| 3: Inspect the shelter | Walk to frame and highlight three slots | Jin: “The shelter is ready for supplies. Which bags can we move and still reach what we need?” | Reveal bag weights/access and transfer-time preview |
| 4: Decide arrangement | Select two modules, three modules, or existing habitat shelter | Luca: “More material can reduce exposure. It will not make it disappear.” | Layout changes protection only after transfer completes; crew work/time charged |
| 5: Allocate energy | Physical experiment switch | Amara: “The recorder can finish one useful run. Turning it off saves energy, but we lose that result.” | Actual served experiment power accumulates progress; no instant science reward |
| 6: Respond to changed conditions | Elevated event begins | Elena: “The warning has become a shelter period. Bring everyone into the protected area.” | All crew positions and future exposure update; late arrival still has a consequence |
| 7: Optional supply access | A scheduled drinking-supply need | Luca: “One bag is hard to reach now. We can move it, use the accessible reserve, or stop the experiment and finish early.” | Retrieval takes time and changes shielding while moved; actual consumption subtracts mass |
| 8: Confirm end of exercise | Decline + crew check | Amara: “The recorder and the crew have different needs. Let's see what your plan protected.” | Derive result from resource/exposure/science history |

Never require clicking a science fact to earn a reward. The evidence drawer is an explanation; gameplay comes from positioning mass, serving loads, and deciding when work stops.

## Decision contracts

**Shelter arrangement:** two modules leaves easier supply access and costs less setup; three improves protection in the game model but increases setup/access cost; existing shelter avoids setup but accepts higher modeled exposure and a shorter mission. A plan can be reasonable without maximizing every metric.

**Recorder:** continue until the required served-power duration, run a shorter useful observation, or suspend it. Specify a concrete `experimentProgress` threshold and carry result. Disconnected equipment cannot accrue progress. If energy approaches zero, essential-load policy applies; later exposure does not erase accumulated values.

**Supply retrieval:** mass removed from a slot becomes accessible inventory; it is neither copied nor destroyed. Consumption and location are separate. Require valid grip/cart interaction and prohibit installing one module in multiple slots.

## Phases / implementation

```text
brief → inspect → configure → shelter-period → verify → debrief
                                      ↘ training-suspended → checkpoint/replay
```

Implement mission actions `inspectMonitor`, `begin`, `moveBag`, `setExperimentPolicy`, `recallCrew`, `accessSupply`, `confirmCrew`. Shared work advancement must process event onset while a transfer is in progress. If a transfer is interrupted, define its final location and incurred cost; never leave inventory in two places.

Use `experimentPreserved` repaired carry from storm as an initial progress/condition modifier, not automatic completion. Return `shelterLayout`, `experimentStatus`, `waterRemainingKg`, `maxExposurePoints`, and `crewAccountedFor` as versioned carry facts.

## Endings and debrief script

- **Prepared shelter, useful record:** “Your layout reduced the model's exposure. The recorder also finished a useful run, with less energy left.”
- **Crew first, study paused:** “You stopped the recorder and protected reserve energy. The study needs another session.”
- **Prudent limited exercise:** “You used the existing shelter and ended the exercise early. You kept a reserve, with less science completed.”
- **Training suspended:** “The reserve or exposure limit was reached. Review the plan and try from the last safe checkpoint.”

Show actual layout, time spent, accumulated exposure, energy, and recorder progress. Compare two versus three modules or recorder on/off from the same snapshot. Use “lower modeled exposure,” never “zero radiation” or “NASA-certified safe.”

## Acceptance tests

Water conservation; exposure never decreases; shelter factors never reach zero; work crosses event boundaries correctly; actual recorder benefit exists; energy shortage affects served load; each crew member must reach the shelter; repeated bag actions cannot duplicate mass; debrief/carry match facts. Verify at least two viable strategies using the final tuned scenario and carry variants. Capture the GLBs at stored, carried, and installed states in a working browser mission.
