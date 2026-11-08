# M05 — The Greenhouse Promise

ID `greenhouse`; Mars chapter 05; Meridian cultivation periods around fictional Sols 32–34. Normal play target 6–8 minutes, with explicit time skips. Requires the crop/energy ledger, source metadata, and actual greenhouse models.

## Mission purpose and NASA basis

Teach that food production is a delayed investment in light, water, time, and crew attention. S04 OSD-269 supplies a documented ISS cultivation reference. It does not establish Mars yield, instant growth, or a complete crew diet. S03 supports the distinction between stored provisions and production assumptions.

Use established plants, labeled “already growing before this mission.” The reference ISS lighting protocol is shown with its actual study conditions after verification. The fictional Mars growth/stress and yield model must be labeled separately. All dialogue below is original game writing.

## Scene and required artifacts

Build/integrate `greenhouse-rack.glb`, `irrigation-manifold.glb`, and a shared `experiment-rack.glb` if needed for the study terminal. Reuse habitat and water-storage assets. Both plant trays require separate named visible growth stages; LED brightness, valve position, reservoir level, and harvested tray state must match actual state.

Primary indicators: energy, water, next-harvest progress. Packaged food is shown when a meal/checkpoint is due. A healthy salad harvest adds a fresh-food supplement; do not depict lettuce as providing the full crew's calories.

## State and schedule

Fields: `trayStates`, `servedLightSeconds`, `lightTargetSeconds`, `waterDeliveredKg`, `reservoirKg`, `cropStress`, `harvestedTrayIds`, `freshSupplementPortions`, `packagedFoodPortions`, `supportPolicy`, `periodIndex`, `experimentNotes`, `decisionHistory`.

Use two explicit 24-hour cultivation periods, labeled as a schedule approximation within the fictional Mars timeline. This is not a claim that a Martian sol is exactly 24 Earth hours. A reference-target lighting schedule can be 16 hours light/8 hours dark after source verification. Keep scenario scheduling, crop biological age, and mission clock distinct and visible.

Author a finite solar/energy schedule with an upcoming low-generation period. Tune battery capacity, essential loads, LED loads, irrigation consumption, stored meals, and crop thresholds in the assumptions file. Mandatory constraints: enough packaged food for a cautious reduced-harvest strategy; insufficient energy/water to maximize every optional task; at least two workable policies. Do not invent NASA numeric yields. Agents must supply tested golden action schedules before acceptance.

## Mission script

| Beat | Trigger / physical interaction | Original dialogue / child-facing copy | Consequence |
|---|---|---|---|
| 1: Meet the crop | Inspect two trays in the rack | Amara: “These plants have been growing for weeks. What we do now changes the next harvest.” | Show existing maturity; no new food created |
| 2: Inspect the system | Check reservoir and LED panel | Jin: “The lights, pump, and air system share our energy. The next dark period will test the battery.” | Reveal constrained forecast and selected reference |
| 3: Set the first policy | Operate light controls and tray valves | Amara: “We can support both trays, favor one tray, or save more energy for the habitat.” | Store actual allocation; show predicted range/cost |
| 4: Advance cultivation | Confirm “Run this period” | Elena: “We'll move the clock forward. The outpost keeps using supplies while we wait.” | Integrate loads, water, growth, stress, meals, scheduled events over the period |
| 5: Diagnose uneven moisture | Inspect visibly stressed tray and manifold | Jin: “The return line is restricted. We can isolate it for repair or spend more water keeping both trays supplied.” | Physical diagnosis enables a costly repair or limited-operation policy |
| 6: Revise the second period | Repair manifold or set revised allocation | Amara: “A smaller healthy harvest may be better than using our last reserve.” | Actions consume crew time; repair never refills supplies |
| 7: Harvest or defer | Walk to each eligible tray | Amara: “Only the ready tray can be harvested. The other one needs time.” | One-time transfer from crop state to supplement inventory |
| 8: Plan a meal / review | Place harvest into food storage or serve supplement | Luca: “Fresh food is useful. We still need our packaged meals.” | Show food categories and debrief actual trade-off |

The moisture fault is an authored scenario event, not a conclusion from OSD-269. Keep it deterministic in replay. Do not use mysterious edible fungus as the primary food lesson in this new mission.

## Decisions and viable paths

**Support both trays:** greater potential fresh supplement; higher light/water use and lower reserve. This path must require checking the battery forecast and acting on the fault rather than a free automatic maximum reward.

**Prioritize one tray:** smaller supplement but lower loads and more reserve. Another tray remains alive/stressed or delayed according to the model, not instantly dead.

**Habitat-first reserve policy:** reduce crop support, rely on packaged meals, and accept delayed harvest. This can be a prudent completed mission rather than automatic failure.

**Fault response:** isolate and repair with time/energy cost, or run the available healthy tray while preserving supplies. Continuing higher water flow is allowed only if the preview shows the cost and the system can physically support it. A hidden “correct answer” dropdown must not substitute for these state changes.

## Phases and implementation

```text
brief → inspect → plan-period-1 → advance → diagnose → plan-period-2 → advance → harvest/review
```

Actions: `inspectTray`, `inspectReservoir`, `setLightPolicy`, `setValve`, `advancePeriod`, `isolateManifold`, `repairReturnLine`, `harvestTray`, `finishCultivation`. Only the ledger advances growth/consumption. For a long skip, split integration at light on/off, fault, battery empty/full, crop threshold, meal, and message boundaries. Match equivalent fine-step integration within a declared tolerance.

Carry from storm/M04 can modify preserved experiment observations or starting condition, with explicit defaults for practice mode. Return `harvestedSupplement`, `cropCondition`, `waterRemaining`, `energyRemaining`, and `cultivationRecordComplete`; no raw six-week farming claim from a two-period exercise.

## Debrief and replay

- **Balanced harvest:** “Your policy kept the habitat reserve and produced a fresh-food supplement.”
- **Smaller harvest, larger reserve:** “One tray supplied fresh leaves. You kept more energy and water for later.”
- **Harvest delayed:** “Stored meals supported the crew. The plants need another growing period.”
- **Training suspended:** “The supply limit was reached. Compare the forecast with the support you selected.”

Show actual served light, consumed water, harvested trays, stored meals, and remaining energy. Replay the first allocation using the same fault timing; compare crop result and reserves. Record which quantities come from the study and which are authored. Avoid calling one policy always best.

## Acceptance tests

No growth before time advances; low served power reduces light credit; water cannot become negative; empty reservoir affects growth; pause and source reading do not consume supplies; time-skip and fine-step results agree; harvest is one-shot; full nutrition is not replaced by a leaf crop; two viable policies and cautious delayed-harvest completion exist. Browser proof must show plant stages, a real valve/light change, an actual harvest, and an action-specific debrief.
