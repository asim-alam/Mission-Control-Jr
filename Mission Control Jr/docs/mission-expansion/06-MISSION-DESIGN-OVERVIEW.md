# Mission design overview (six expansion missions)

This is a per-mission breakdown of the goals, steps, resources, ratings and design issues for the six expansion missions. It was written from the rules files (`missions/<name>/actions.js` and `scenario.js`), so the numbers match the code. Where a number was worked out by hand from the data, the text says so.

Two things apply to every mission:
- **Sim time vs real time:** each mission runs on its own clock. `timeScale` says how many game-seconds pass per real second.
- **Ratings:** each mission ends with a rating (great, ok or low/stopped). "Great" is the mastered result.

---

## 1. Solar Shelter ("A Place to Hide")

**Player goal:** A solar storm is coming. Get the 4 crew and yourself inside a shelter and keep the team's radiation dose low.

**Steps, in order (as shown in the step list)**
1. **Pick a plan:** Water fortress, Fast fill or Roof first.
2. **Cover the roof** (2 roof spots, 0/2).
3. **Fill the walls** (6 wall spots).
4. **Call the crew** (4 crew, one at a time; each walks 90 sim-seconds to the shelter).
5. **Get inside yourself.**
6. **Wait out the storm.** You can skip ahead once everyone is inside.

**Actions:** pick up a shield, place it in a spot, put it back, call a crew member, skip ahead, check the storm screen, finish.

**Materials (12 items for 8 spots):**
- Water walls: 6 in stock, block 75% (slow to carry).
- Plastic shield: 2 in stock, block 80% (bolting it on takes 1.6 s of hold).
- Supply bags: 4 in stock, block 55% (quick to carry).

**Timing:**
- Warning: 1200 sim-seconds (20 min). Prep runs at 5x, so about 4 real minutes.
- Storm: 3600 sim-seconds at 45x, so about 80 real seconds.
- Notices at half the warning time and 4 minutes before the storm.

**Results:**
- Each person's dose adds up over time. The team dose is the average of all 5.
- Great: team dose ≤ 40. OK: ≤ 65. High: above 65 (not a success).
- Score is 100 minus the team dose.

**Plans:** the three plans only set a label. They don't change any rule. The real choice is which items go in which spots.

**Things to think about:**
- The plans don't change any rules, so "two strategies that both work" is really about what you place, not what you pick.
- Only 2 roof spots exist, but the "Roof first" plan text says roof placement matters a lot. Check that the roof gives a clear advantage.
- The habitat walls alone block only 15%. So a poor shelter feels only slightly worse than a good one, which lowers the stakes.

---

## 2. The Greenhouse Promise

**Player goal:** Grow a salad for Elena's birthday in three Mars days. Keep the plants alive, fix the leak, and serve dinner.

**Steps, in order**
1. **Pick a plan:** Salad first, Try for a feast, or Share the light.
2. **Day 1:** set the light for each bed (off, half or full), water the beds, then end the day.
3. **Day 2:** the same. The leak starts on day 2 (6 litres a day).
4. **Fix the leak:**
   - Close the red valve.
   - Unclip the old hose.
   - Take the spare hose from the shelf.
   - Fit the new hose.
   - Open the red valve again.
5. **Harvest day (day 3):** take the basket, pick the ready plants.
6. **Serve dinner:** put the basket on the table.

**Crops:**
- Red lettuce: 4 portions, ready at growth 3.
- Mizuna: 3 portions, ready at growth 3.
- Chile peppers: 2 portions, ready at growth 5. They don't count toward the salad.

**Resources:**
- **Power:** 2.2 kWh a day from solar. A 1.2 kWh battery covers the extra. Full light is 1 kWh per bed, half is 0.55, off is 0. Ending a day with too much light is blocked.
- **Water:** an 18-litre tank, 1 litre per watering. Soil must stay between 1 and 3.2 to be "good". Dry or soggy soil slows growth.
- **Leak:** starts on day 2 and drains 6 litres a day until fixed.
- **Baby harvest:** a crop can be picked early at 80% of full size.

**Rules that matter:**
- You can't end the day with the valve closed. The plants get no water.
- You can't serve dinner until harvest day.
- Harvest is blocked until the crop is ready.

**Ratings:**
- **Birthday feast:** at least 6 salad portions and peppers.
- **Salad served:** at least 6 salad portions.
- **Small harvest:** some food, but not enough for the salad goal.
- **No harvest:** nothing picked.

**Things to think about:**
- The "Try for a feast" plan is only a label. Peppers depend on full light. By hand from the numbers, half light on days 1 and 2 brings peppers only to baby size, not full size. Make sure the plan text matches that.
- The leak fix is 5 steps, a long chain for ages 7–9. Consider splitting it or showing a hint earlier.

---

## 3. Waiting for Earth ("Message to Earth")

**Player goal:** The water recycler has broken. Find the broken part and get it running again. You can ask Earth for help, fix it yourself, or do both. Every message takes real time.

**Steps, in order**
1. **Pick a plan:** Ask Earth first, Fix it yourself, or Do both.
2. **Message Earth** (not shown in the "Fix it yourself" plan).
3. **Power off and open the panel.** Safety first: turn the lever off before opening.
4. **Find what is broken:** use the meter on the pump and the valve, and look at the filter.
5. **Swap the broken parts** from the shelf.
6. **Test run:** turn the power on and press the lamp.

**The three faults (chosen at random):**
- Pump broken, filter clogged.
- Valve broken, filter clogged.
- Pump broken, filter fine.

**Spares:** 1 pump, 1 valve, 2 filters. Swapping in a part that wasn't broken wastes it.

**Earth's delay:**
- One-way light time to Mars is about 661 seconds (11 minutes), from JPL data.
- Earth needs 6 minutes to think, halved to 3 if you send your meter readings.
- Round trip: about 28 minutes without readings, about 25 minutes with them.
- The "wait for Earth" action skips ahead.

**Water:**
- Starts at 20 litres.
- Drains at 0.5 litres a minute, or 0.2 with save-water mode on.
- At 3 litres the crew opens emergency water and the mission ends. That is a failure.

**Actions take time:** opening the panel takes 60 sim-seconds, closing 45, a test 60, a swap 120.

**Ratings:**
- **Great:** fixed, at least 20 litres left, no spare wasted.
- **OK:** fixed, at least 10 litres left.
- **Low:** fixed with less water, or not fixed.

**Things to think about:**
- The 25–28 minute round trip is a long wait for ages 7–9. The Earth answer text says "about 22 minutes", which doesn't match the code. Fix the text or the timing.
- The panel-open objective says "hold E", and the scene uses a hold. Confirm that matches what you want.
- If you ask Earth, you only learn the broken part after the answer arrives. "Fix it yourself" feels quicker but risks mistakes. Make sure the Earth route is worth taking.

---

## 4. Chasing the Sun ("Horizon Base" solar mast)

**Player goal:** Set up a solar mast near the Moon's south pole and keep the base powered for 18 days.

**Steps, in order**
1. **Pick a pad:** Near pad or Ridge pad. This is a real choice.
2. **Tow the cart:** grab the handle (the cart follows you), walk to the pad.
3. **Legs down and raise the mast:** the mast has 3 stages, each 1.8 m. The base is 2.4 m, so the top is 7.8 m.
4. **Open the solar wings** (needs legs down and at least one mast stage).
5. **Plug the cable into the base:** take the plug from the reel and walk it to the power port.
6. **Turn on the Sun tracker** (needs wings open and the cable plugged in).
7. **Pick a power plan** at the base console: science all the time, or save science for daylight.
8. **Watch 18 days go by:** one button runs the whole window.

**Pads:**

| Pad | Walk and tow time | Cable needed | Sunlit share (archived LOLA averages) |
|---|---|---|---|
| Near | 8 min tow, 6 min carry | about 19 m | about 13% |
| Ridge | 16 min tow, 13 min carry | about 43 m | about 34% |

The cable reel has 50 m, so both pads fit.

**Suit air:** 120 minutes. Each action costs suit minutes, for example raising a stage costs 4 minutes and a tow costs 8 or 16 minutes. Running out ends the mission with no result.

**Power:**
- Solar panel: 3.6 kW when the Sun hits it.
- Essential load: 1.2 kW, always on.
- Science: 0.8 kW, optional.
- Battery: 45 kWh max, starts at 25 kWh.

**Ratings:**
- **Great:** no cold hours, and science runs at least 70% of the time.
- **OK:** at most 12 cold hours.
- **Low:** more than 12 cold hours.

**Things to think about:**
- Raising the mast is the only way to get more sunlight, and the objective and scene still use "hold E". The relay mission's mast was changed to "press E", so this is inconsistent (see the list at the end).
- Watching 18 days is a single click. Everything before it is hands-on, but the payoff is one click. Consider a short hands-on sun-watching moment.
- The Sun is fixed at 1.5° above the horizon. Mast height decides how much of the day the panel is lit.

---

## 5. Dust Busters ("Horizon Airlock")

**Player goal:** Clean the four moonwalk pieces of gear and the air in the airlock before opening the inside hatch. Dust that gets into the base counts against you.

**Steps, in order**
1. **Pick a plan:** Brush it off, Vacuum it up, or Mix with the EDS.
2. **Shut the outside hatch** (hold E on the orange wheel, 1 minute).
3. **Fill the airlock with air** (press the green button, 5 minutes, 8 power).
4. **Clean all 4 pieces of gear:** the suit, helmet, bag and boots.
5. **Clean the air:** run the scrubber fan (5 minutes, 5 power) and swap the filter when it's full.
6. **Open the inside hatch** (hold E on the green wheel).

**Gear and starting dust:**

| Item | Starting dust | EDS works on it |
|---|---|---|
| Suit | 100 | No, too big for the plate |
| Helmet | 60 | Yes, 95%. It also has a glass visor. |
| Tool bag | 50 | Yes, 40% |
| Boots | 90 | Yes, 60% |

A piece counts as clean when dust is 15 or less.

**Tools:**

| Tool | Minutes | Power | Removes | Dust into the air |
|---|---|---|---|---|
| Brush | 2 | 0 | 80% | 60% of what it removes |
| Vacuum | 7 | 4 | 85% | 5% of what it removes |
| EDS plate | 4 | 5 | Depends on the item | 10% |

- The vacuum sends 20% of what it removes into the filter.
- Brushing the helmet's visor scratches it. A scratch loses the great rating.
- The EDS plate works on one item at a time: put it on, then flip the switch.

**Opening the inside hatch too early:** dust leaks into the base. Two leaks and the mission ends with a dusty base.

**Ratings:**
- **Great:** no dust in the base, no scratches.
- **OK:** at most 30 dust in the base.
- **Dusty:** more than 30.

**Things to think about:**
- The plans are labels only. The tools are the real choice, so the three plans don't change which tools you can use.
- The suit (100 dust) takes about two brush passes to get under 15. Check that this feels like a fair amount of work.
- The power budget is 50 units. Pressurizing takes 8 and each vacuum takes 4. Check that a kid can only run out by choosing badly.

---

## 6. Over the Hill ("lunar-relay")

**Player goal:** Drive a rover over Long Ridge to Shadow Hollow, drill two cores, and get the data back to base. Keep the battery and suit air under control.

**Steps, in order (relay plan)**
1. **Pick a plan:** Relay on the ridge, or Quick trip.
2. **Load the relay on the rover** (relay plan only).
3. **Drive to the ridge top** and set the relay down on the yellow ring.
4. **Set up the relay:**
   - Put its legs out.
   - Raise the mast (press E on the green ▲; 3 stages).
   - Aim the dish at the base (hold E).
5. **Drive into Shadow Hollow.** Put the drill on the first X and drill a core (hold E, 8 minutes).
6. **Store the core** in the rover's sample box.
7. **Send the data** from the rover radio. Earth asks for a second core at the second X.
8. **Drill the second core.**
9. **Drive home and go inside.**

**Steps, quick-trip plan:** skip the relay steps. Drill, drive home. Data sends when the rover can see the base.

**The map:**
- Base to ridge top: 18% battery, 6 minutes.
- Ridge top to base: 12%, 6 minutes.
- Ridge top to hollow: 10%, 5 minutes.
- Hollow to ridge top: 15%, 5 minutes.
- Each drill costs 8% battery.
- Start: 85% battery, with a 10% reserve.
- Suit: 90 minutes.

**Light-time delay:** one way from the Moon to Earth is 1.35 seconds, from JPL data. The data delay is real but tiny. Most of the waiting comes from driving.

**Radio:** the base can hear the rover only with a clear line of sight. Hills block it. The relay on the ridge lets the rover in the hollow reach the base. The relay mast height decides whether the signal gets over the ridge.

**Battery rescue:** if the rover runs out of battery mid-drive, Luca drives out a spare battery. That costs 15 minutes of suit air and caps the rating at "ok".

**Ratings:**
- **Great:** data sent, no rescue, suit at least 15 minutes left, battery at least 10%.
- **OK:** rescued, or low suit air, or low battery.
- **Low:** no data sent.

**Rough battery check (worked out by hand):**
- Relay plan, 2 cores: about 71% used, so about 14% left. That's great.
- Quick trip, 1 core: about 63% used, so about 22% left.

**Things to think about:**
- The quick trip only sends data when the rover can see the base, and the code only asks for a second core after a successful send in the hollow. So the quick trip gives one core. This matches the report, but it's a rule the player may not guess.
- The relay plan's mast step is the one changed from "hold E" to "press E". The rest of the mission still uses hold for the drill, aim and legs.
- The relay has the most steps and moving parts, so it's the most likely to confuse a 7–9-year-old. Consider a hint for when the rover is out of sight of the base.

---

## Design issues found while reading the code

1. **Plans that don't change rules.** Solar Shelter, Greenhouse and Dust Busters have plans that only set a label. The real decisions are in the actions. Earth Delay, Chasing the Sun and Over the Hill have plans that change which steps exist. If "two strategies that both work" is the goal, make the plans change real rules in the first three.
2. **Hold E vs press E is mixed.** The Over the Hill mast was changed to press. The Chasing the Sun mast still uses hold, and its objective text says "hold E". Earth Delay and Dust Busters still use hold for panels and wheels. Pick one rule for each kind of action.
3. **Earth wait text mismatch.** The Earth answer says "about 22 minutes", but the round trip is 25–28 minutes. Earth Delay has no way to shorten the wait except the wait action.
4. **Chasing the Sun ends in one click.** The 18-day watch runs with a single button. Everything before it is hands-on, but the payoff is one click.
5. **Long steps in two missions.** The Greenhouse leak fix (5 steps) and the Over the Hill relay setup (up to 6 steps) are the longest chains. Both need a visible progress cue for ages 7–9.
6. **Dust Busters power.** The 50-unit power budget could be too tight or too loose depending on the plan. This has not been played through.

---

## NASA sources used for the six missions

These links come from the project's own source records (`public/data/provenance.json` and `docs/mission-expansion/02-NASA-SOURCES.md`).

**Challenge brief**
- NASA Space Apps, Junior Astronaut Mission Trainer: https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/

**1. Solar Shelter**
- NASA DONKI, the solar particle event used (10 May 2024): https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/30677/-1
- NASA, how astronauts are protected from radiation at the Moon (supplies as shielding): https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/
- DONKI main page: https://ccmc.gsfc.nasa.gov/tools/DONKI/

**2. The Greenhouse Promise**
- NASA OSDR study OSD-269, lettuce grown on the ISS (16-hour light schedule): https://osdr.nasa.gov/bio/repo/data/studies/OSD-269
- NASA, growing plants in space: https://www.nasa.gov/missions/station/iss-research/growing-plants-in-space/
- NASA Life Support Baseline Values and Assumptions (2022): https://ntrs.nasa.gov/citations/20210024855

**3. Waiting for Earth**
- JPL Horizons, Mars seen from Earth (light-time data): https://ssd.jpl.nasa.gov/horizons/
- JPL Horizons API documentation: https://ssd-api.jpl.nasa.gov/doc/horizons.html
- The archived query behind the game's Mars number: https://ssd.jpl.nasa.gov/api/horizons.api?format=text&COMMAND=%27499%27&OBJ_DATA=%27YES%27&MAKE_EPHEM=%27YES%27&EPHEM_TYPE=%27OBSERVER%27&CENTER=%27500%40399%27&START_TIME=%272026-11-14%27&STOP_TIME=%272026-11-16%27&STEP_SIZE=%271%20d%27&QUANTITIES=%2721%27
- NASA space communications overview (delay depends on destination): https://www.nasa.gov/missions/tech-demonstration/space-communications-7-things-you-need-to-know/

**4. Chasing the Sun**
- NASA GSFC lunar polar illumination product (LOLA sunlight averages): https://pgda.gsfc.nasa.gov/products/69
- LOLA instrument on the Lunar Reconnaissance Orbiter: https://pds-geosciences.wustl.edu/missions/lro/lola.htm
- NASA, lunar south-pole environment (low sun, long shadows): https://www.nasa.gov/reference/moonbase-environment/

**5. Dust Busters**
- NASA Blue Ghost surface operations, March 2025 (Electrodynamic Dust Shield test): https://www.nasa.gov/blogs/missions/2025/03/04/blue-ghost-begins-surface-operations-captures-descent-video-sunrise/

**6. Over the Hill**
- JPL Horizons, the Moon seen from Earth (1.35 s one-way light time): https://ssd.jpl.nasa.gov/api/horizons.api?format=text&COMMAND=%27301%27&OBJ_DATA=%27YES%27&MAKE_EPHEM=%27YES%27&EPHEM_TYPE=%27OBSERVER%27&CENTER=%27500%40399%27&START_TIME=%272026-11-14%27&STOP_TIME=%272026-11-16%27&STEP_SIZE=%271%20d%27&QUANTITIES=%2721%27
- NASA Glenn, lunar surface propagation (hills block radio): https://www.nasa.gov/glenn/glenn-expertise-space-exploration/scan/lunar-surface-propagation/

**Listed in the sources doc but not used by the six missions**
- Curiosity REMS (thermal data): https://atmos.nmsu.edu/data_and_services/atmospheres_data/MARS/curiosity/rems.html
- LRO Diviner (thermal data): https://pds-geosciences.wustl.edu/missions/lro/diviner.htm
- NASA TechPort delay reference: https://techport.nasa.gov/projects/10516
- NASA Orion crew systems: https://www.nasa.gov/reference/crew-systems/
- NASA on lunar weather: https://www.nasa.gov/general/is-there-weather-on-the-moon-we-asked-a-nasa-scientist-episode-34/

**Caveats**
- Most NASA pages are background reading. The game's numbers come from the archived data files and the game's own tuning, not from these pages.
- The Blue Ghost page describes the dust test in words only. The dust amounts and tool numbers are game values.
- The Greenhouse and Solar Shelter numbers are NASA-inspired, not measured. The Mars light time (about 11 minutes one way) is real for that date.
- The Opportunity dust-storm power source is used by a different mission, not the six above.
