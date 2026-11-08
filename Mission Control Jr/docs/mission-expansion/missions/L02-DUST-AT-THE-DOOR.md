# L02 — Dust at the Door

ID `lunar-dust`; Moon chapter 02; Horizon Outpost after a fictional equipment-handling/EVA session. Target 5–7 minutes. Requires lunar environment, a resource ledger, airlock interlocks, contamination state, and actual dust-control assets.

## Learning goal and NASA basis

Teach that dust management consumes energy, time, filters, and sometimes breathing-gas reserve, so maintenance must be planned. S10 documents an EDS demonstration on glass and thermal-radiator surfaces. The mission uses a **fictional EDS-inspired equipment test rack**, not a claim that a complete astronaut suit cleaner has been flight-demonstrated. S13 rules out a wind-driven lunar dust storm.

Dust initially comes from the crew's previous handling of regolith-covered equipment. Explain this in the opening. Material does not blow in because the sky has weather.

## Scene and mandatory artifacts

Build/integrate `dust-control-rack.glb`, `boot-tray.glb`, `filter-cassette.glb`, and a lunar airlock adaptation with visible clean/dirty zones. Reuse the lunar habitat, astronaut, service tools, and battery hardware. The rack must include a dusty rigid test panel and distinct manual-tool and electrode-grid geometry. Show dust condition with a material/decal/procedural mask tied to `dustLoad`; do not rely solely on a text counter.

The rack treats equipment. Boots/tools are staged and manually handled using the declared safe training interaction; the electrical test-panel result must not magically clean all items. Provide button/keyboard alternatives for selecting each dirty item.

Primary indicators: energy, airlock reserve, contamination/filter status. Show crew time when choosing methods.

## State / authored constraints

Fields: `equipmentDust`, `bootZoneState`, `rackMode`, `rackPoweredSeconds`, `filterRemaining`, `spareFilters`, `outerDoor`, `innerDoor`, `airlockPressureState`, `dirtyInventory`, `cleanInventory`, `deconCycles`, and actual consumption ledgers.

Author dust-removal efficiency, cycle duration, EDS load, manual-work time, filter life, and pump/recovery performance; list them in model assumptions. The NASA demonstration inspires the mechanism, not these numeric values. Scenario constraints: energy left from L01 matters within a bounded authored range; a spare filter is finite; manual equipment cleaning plus conservation is viable; powered rack treatment plus correctly completed airlock cycle is also viable with enough energy. A designated recovery checkpoint exists if carried reserves are too low; do not make an earlier completed mission create an unrecoverable soft lock.

## Mission script

| Beat | Trigger / physical action | Original dialogue / copy | Consequence |
|---|---|---|---|
| 1: Return | Dirty equipment reaches exterior station | Elena: “The dust came back on our equipment. Keep it out of the clean cabin.” | Mark contaminated items and clean/dirty zones |
| 2: Inspect | Check rack, filter, and energy | Jin: “The powered rack is faster for this panel. Manual cleaning takes longer and uses the filter.” | Show actual inventory and method previews |
| 3: Choose equipment treatment | Select rack or manual station | Luca: “Choose a method we can finish with the reserve we have.” | Energy/time/filter consequences begin only after valid start |
| 4: Operate hardware | Close rack cover/start treatment, or use enclosed manual tool | Jin: “The panel is changing. Check the result before calling it clean.” | Dust reduces according to actual elapsed served operation; no instant universal clean flag |
| 5: Prepare the airlock | Stage boots/tools; inspect filter cassette | Elena: “The equipment panel is one job. The airlock is another.” | Dirty items cannot bypass staging; spent filter affects cycle model |
| 6: Allocate a filter/cycle | Replace filter or choose a longer conservation cycle | Luca: “A fresh filter costs a spare. A longer cycle costs time and energy.” | Finite inventory; real pump/filter/time ledger |
| 7: Verify clean boundary | Check interlocks and enter cabin | Jin: “The outside door is secured. The cycle is verified. The clean side can open.” | Inner/outer doors never open together; completed treatment controls access |
| 8: Review | Equipment stowed | Elena: “Your cleaning plan used resources, and it protected the cabin. Let's count both.” | Derive contamination and reserve outcomes |

No child needs to perform precise rubbing gestures for minutes. A short tool interaction can initiate an explicitly time-advanced work cycle with clear cost. Waiting for actual frame animation is not the educational objective.

## Decisions and branches

**Powered test-rack policy:** faster rigid-panel treatment; higher energy use. Other items still need their correct handling and airlock steps. **Manual policy:** lower rack electricity, more work time/filter usage. **Pause optional equipment use:** leave a nonessential item quarantined outside and complete a reduced-objective return, if essential crew-entry procedures can still be met.

**Filter decision:** replace one cassette or accept a tested longer cycle/limited equipment load. A spent filter cannot provide full modeled performance. Alternative valid paths must be enabled by the model, not arbitrarily rejected because the script wants one answer.

Actions: `inspectDust`, `stageItem`, `selectTreatment`, `closeRack`, `startRack`, `manualCleanItem`, `inspectFilter`, `replaceFilter`, `secureOuterDoor`, `runAirlockCycle`, `verifyBoundary`, `openInnerDoor`, `quarantineItem`. Every item keeps one location and contamination state; no duplicates between inventory lists.

Phases: `brief → dirty-zone-assessment → equipment-treatment → airlock-preparation → cycle → cabin-verification → debrief`. Power loss pauses or degrades a modeled cycle; it must not complete just because its animation finished. Maintain a reversible action when the outer door must be reopened before a cycle, with its declared cost.

## Endings and debrief

- **Clean return, equipment ready:** “The cabin boundary stayed clean. Your selected method used this much energy, time, and filter life.”
- **Clean return, item quarantined:** “The crew returned safely. The optional item remains outside for later treatment.”
- **Reserve-conserving completion:** “Manual work reduced rack electricity, with more work time or filter use.”
- **Training suspension:** “The cycle did not meet the model's entry condition. Review the filter and reserve before trying again.”

Use actual dirty/clean item results, cycles, filter consumption, energy, and air reserve. Do not imply EDS protects against radiation, produces oxygen, or cleans an entire suit because one test panel cleared. Replay method choice with the same initial dust/reserves.

## Acceptance tests

No wind-driven dust event; energy/time matter to dust reduction; no powered cycle completion at zero supply; valid manual and powered strategies; simultaneous door-open state impossible; used filters/spares cannot duplicate; quarantined items cannot appear clean in cabin; paused work stays paused; low carried reserve has a recoverable path. Browser proof must show dust before/after, removable filter, door interlocks, and outcome-linked resource changes.
