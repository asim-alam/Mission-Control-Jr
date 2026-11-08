# M06 — Earth Can't Answer Yet

ID `earth-delay`; Mars chapter 06; Meridian, fictional Sol 35. Normal play target 5–7 minutes. Requires actual message scheduling, shared upkeep, established-crop state, and physical service hardware.

## Mission purpose / NASA basis

Teach the difference between sending a request and receiving useful advice, and why a crew needs local procedures and reserves. Use S05 JPL Horizons for archived Mars one-way light-time and S14 for explanation. The fault, reply processing delay, equipment, and procedures are authored training content, not actual NASA repair instructions.

Use a selected dated geometry value from a verified response; show date and approximation. A 12-minute value can be an explicitly authored test fixture until a real table is imported, but do not present it as a checked NASA reading. Local crew radio stays local and immediate.

## Scene / mandatory assets

Build/integrate `pump-service-module.glb` for the **coolant circulation pump supporting an air-processing unit**, `air-reserve-cylinder.glb`, and the shared experiment rack/message-terminal screen. Reuse the habitat and crew. The pump's electrical disconnect, interlocked cover, cartridge, and latch must be distinct animated nodes. The equipment is a fictional low-risk training module; no real mains/pressure servicing instructions.

Primary indicators: breathing reserve, energy, reply status. Crops/experiment condition is a context consequence.

## State and tuning constraints

Fields: `faultIsolated`, `reserveConnected`, `pumpCartridgeState`, `serviceCoverState`, `supportPolicy`, `messageIds`, `replyAvailable`, `replyApplied`, `cropStress`, and `decisionHistory`. `EarthAdvice` is a queued message with outbound, processing, return, and reception timing; actions cannot inspect its hidden future contents.

Parameterize `tauOut` and `tauBack` from the archived table; model Earth processing separately. Set horizon to at least `tauOut + processing + tauBack + recoveryWindow`, not one-way time. A time scale such as 15 simulated seconds per real second is acceptable with a visible label. Reading menus pauses; a confirmed “wait five mission minutes” integrates real costs and events.

Required balance: unmitigated operation exhausts a protected reserve before advice returns; a tested local isolation/repair path is feasible; a conserve-and-bridge path can last until the reply at a cost to energy/reserve/experiment output; a prudent training suspension remains available. Tune numeric costs and verify these claims rather than relying on dramatic copy.

## Mission script

| Beat | Trigger / physical action | Original dialogue / copy | Consequence |
|---|---|---|---|
| 1: Fault | Air-processing controller alarms | Luca: “The cooling pump has stopped. Our air reserve gives us time, but it is not unlimited.” | Begin reserve trend and a clearly stated fault |
| 2: Request advice | Inspect and send status at terminal | Jin: “Earth has the service history. I'll send the readings.” | Queue one actual request; display separate travel and processing stages |
| 3: Understand delay | Outbound message traveling | Elena: “They cannot answer before the message arrives. We need a plan while it travels.” | Reveal three viable local policies and their previews |
| 4A: Local repair | Isolate branch; inspect module; swap available spare | Jin: “The training interlock is green. I can replace the cartridge, but that uses our only spare.” | Charge time, energy, and finite spare; repair only after validated sequence |
| 4B: Conserve and bridge | Connect reserve, suspend optional experiment, select low load | Amara: “I can pause the study. That protects the reserve while we wait.” | Real reserve consumption continues; study progress changes |
| 4C: Suspend early | Confirm protected shutdown | Elena: “Stopping the exercise now protects the crew. We will carry the unresolved fault into review.” | Limited objective outcome; not a fake repair |
| 5: Earth receives | Scheduled outbound arrival | Terminal: “Request received at Earth. Reply being prepared.” | No advice available yet; processing clock starts |
| 6: Reply received | Scheduled return arrival | Earth advisor: “Your report is clear. Use the verified isolation check before restoring the pump.” | Unlock authored diagnostic confirmation; never retroactively solve past damage |
| 7: Verify | Inspect flow and reserve trend | Luca: “The processor is running again. Watch the reserve trend to confirm it.” | Require sustained correct behavior for a short verification interval |
| 8: Review | Complete or suspend | Elena: “You made a local choice before Earth could help. Let's compare what it cost.” | Derive time/resources/spare/study result |

The local repair must use information available locally; do not punish the child for missing hidden Earth-only information. The message can add confidence or a cheaper follow-up, not magically justify an unsafe instruction. Clearly separate a local radio conversation from an Earth packet.

## Decisions and implementation

Three strategic policies: **local repair** spends the spare and time but restores function earlier; **conserve and bridge** sacrifices experiment progress/uses reserve to wait for Earth; **protected suspension** preserves safety with an unresolved objective. Both first two must be tested feasible in their intended scenario variants.

Actions: `inspectFault`, `sendEarthRequest`, `selectSupportPolicy`, `connectReserve`, `isolatePumpBranch`, `openServiceCover`, `replaceCartridge`, `latchCover`, `restoreBranch`, `verifyFlow`, `advanceWait`, `suspendExercise`. Use action prerequisites plus physical proximity. Isolation cannot accidentally disable unrelated habitat essential loads; a rejected action consumes nothing except any clearly modeled attempted-work cost.

Phases: `brief → fault-assessment → request-and-local-plan → local-work-or-bridge → verify → debrief`. Request/reply stages are concurrent message state, not a linear modal sequence that freezes the rest of the mission. Opening a menu must not secretly deliver a reply.

## Endings / debrief

- **Local recovery:** “You restored the unit before Earth's answer. The spare is used, and the reserve lasted.”
- **Bridge and verify:** “You waited with a plan. Earth helped, while the paused study and reserve carried the cost.”
- **Protected suspension:** “The crew stayed within the training limit. The unit still needs repair.”
- **Reserve limit reached:** “Waiting used more reserve than the plan allowed. Try a different bridge or repair policy.”

Display a timeline with send, Earth receive, reply depart, crew receive, and restoration/suspension. Show actual elapsed time and opportunity cost. Compare two strategies under identical geometry and fault conditions. Return spare remaining, unit condition, experiment condition, and reply/repair facts as versioned carry.

For replay, snapshot immediately after the request is sent and before the local policy is chosen. Restore the pending message, geometry table/version, reserves, fault, spare, clock, and seed together. Run local repair versus conserve-and-bridge through the same controller. Compare restoration time, reply time, remaining reserve, spare use, and study progress; do not reveal the future reply to the player before its scheduled arrival.

## Acceptance tests

Reply arrival includes both legs and processing; changing Horizons light-time changes scheduling; queue survives pause and save/restore; repeated requests do not duplicate benefits; local crew messages remain immediate; wait advances upkeep; service interlocks/proximity work; zero energy prevents unsupported pump output; compare both viable strategies; debrief never says Earth approved an action before the reply arrived. Capture pump open/closed/replaced states and the visible message timeline in the playable scene.
