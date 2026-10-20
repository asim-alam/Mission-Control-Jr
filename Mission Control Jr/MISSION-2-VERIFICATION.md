# Mission 2 verification — 20 October 2026

## Current automated result

All **71 tests pass**. Coverage includes original Mission 1 regressions, Mission 2 state/action gates, physical station reachability, real controller-driven completion of all three routes, parked reports, terrain reasoning, post-drive transfer and crew count, resource forecasts, abort/retry, generated and supplied GLBs, packaged voice clips, and walking camera zoom with wall avoidance.

The north-wash, direct, and rim integration runs drive the real kinematic controller through the expedition and return, assert no collisions or powered slip, and finish above the training return margins. On-foot positions and science actions in those tests are state fixtures; these tests do not establish browser camera framing.

The production build succeeds for index.html, mission2.html, campaign.html, and models.html. Vite retains its shared Three.js loader chunk-size advisory. The production mission page returns HTTP 200.

## Browser observations

Earlier browser work exercised physical preparation and fault repair, boarding and actual keyboard movement/steering/braking, route justification, both parked reports, terrain-decision feedback, on-foot context and scaled close photographs, description feedback, return, and reverse recovery. A complete post-drive successful ending is covered by automated integration; the latest browser run did not replay that entire ending.

After the latest cleanup, the rebuilt production mission loaded, began, accepted its briefing, and showed the compact objective with Tasks and Map closed by default. Zoom out visibly widened the third-person view. The large mountain and black plinth are absent from the photographed outpost view. Their world mesh, sign, map symbol, collision box, and camera references are removed from source; the original model remains in the optional archive. Updated screenshot: screenshots/mission2-focused-view.png.

The supplied globe remains at the terminal and the robotic exhibit remains on the east pad. A previous browser check loaded and rotated all three older references including Perseverance; its screenshot remains in screenshots/mission2-reference-perseverance.png. The new physical-pad model switch and every responsive breakpoint have not been re-exercised in this final cleanup pass.

## Delivered behavior and limits

One current objective is shown by default; Details expands instructions, Tasks/T opens the checklist, and Map/M toggles the minimap. Wheel and +/− control zoom. Boarding shows the clearance sequence and live readiness requirements. Mission 1 retains its default camera distance.

Models retain embedded provenance and credits. Voice playback retains a single active audio object with cancellation and no fallback to the old browser/system voice.

The orbital chapter is **planned, not built**. ORBIT-AND-SURFACE-PLAN.md records reviewed NASA/JPL sources, story, asset decisions, technical boundaries, and acceptance criteria. The existing small navigation globe is not a playable orbital scene.

This remains a desktop keyboard/mouse educational prototype with fictional geography, simplified vehicle dynamics and normalized reserves. No novice timing study, calibrated physical simulation, or agency certification is claimed.
