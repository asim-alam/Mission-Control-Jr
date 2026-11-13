const slide = (title, summary, tryThis) => ({title, summary, try: tryThis});

export const pipLessons = {
  orbit: {title: 'Dock with Asteria', slides: [
    slide('Line up the docking ports', 'The two ports have to face each other so the clamps can catch.', 'Use A and D to move sideways. Use R and F to move up or down.'),
    slide('Make a gentle approach', 'Thrusters slow the ship before the docking clamps touch.', 'Press Space to slow below 0.2 m/s. Inside 2 m, press E when the crosshair turns green.'),
  ]},
  docked: {title: 'Docking complete', slides: [
    slide('The clamps caught', 'You lined up the two ports so the spacecraft could join the station.', 'The crosshair showed how far off center you were.'),
    slide('A gentle arrival', 'Docking slowly gives the clamps time to catch without a hard impact.', 'The training limit was 0.2 m/s at the port.'),
    slide('How Elena’s voice reached you', 'Sound needs something to travel through, like air inside your helmet. Radio waves can carry a signal through the vacuum outside.', 'Listen for the crew radio when you enter the cabin.'),
    slide('Welcome to Asteria', 'The clamps are locked and the air pressure is equalized.', 'Open the hatch and find out why Meridian Base can’t hear the station.'),
  ]},
  station: {title: 'Repair the radio and land', slides: [
    slide('Find the fault', 'A radio can go quiet for several reasons. A test helps you narrow it down before you swap anything.', 'Check the radio rack or use the tester from Spares.'),
    slide('Isolate the faulty part', 'You can cut power to the faulty part while the rest of the station stays on.', 'Switch off its circuit before touching it. Restore power and test the radio after the repair.'),
    slide('Prepare the lander', 'The lander’s hazard camera helps it steer away from rocks. The camera needs 80% charge in this mission.', 'Use Charger Switch 6 in sunlight. Check the power budget first.'),
    slide('Pick a landing site', 'The oval on the map shows the area where you might land. Look at the terrain across the whole oval.', 'Use the planner, then check the hatch before descent.'),
  ]},
  storm: {title: 'Prepare Meridian for the storm', slides: [
    slide('Find out what failed', 'Dust blocks sunlight, so the base has less solar power to share.', 'Follow the green beacon to the base computer. Then check which panels need cleaning.'),
    slide('Restore a backup', 'Clean panels collect more sunlight, and a spare battery can help when the storm gets darker.', 'Take the spare from the rover and connect it at the power junction.'),
    slide('Protect the crew', 'Your reserve can support more air or keep the experiment running. Check the supplies before you decide.', 'Make your choice at the computer, then get inside and seal the door.'),
  ]},
  rover: {title: 'A safe trip to Kestrel Ridge', slides: [
    slide('Check the rover before you leave', 'A small fault near the base is much easier to fix than one far from home.', 'Inspect the equipment and practice steering, braking, and parking on the pad.'),
    slide('Plan the return, too', 'Soft ground can make the wheels slip and use up your reserve. The shortest path can cost more than you expect.', 'Stop at cracked ground, check the return forecast, and radio the base before deciding.'),
    slide('Take two useful photos', 'A wide photo shows where the rock layers meet. A ruler in the close-up shows how big the details are.', 'Photograph both layers, then show the ruler in the close-up. Describe what you actually see.'),
    slide('Bring your crew and evidence home', 'The photos still count if you leave the extra rock behind.', 'Keep enough battery and suit air for the return, then send your photos from the base computer.'),
  ]},
  'solar-shelter': {title: 'Build a safer refuge', slides: [
    slide('Find where the crew needs cover', 'Energetic particles can arrive after an eruption on the Sun. A shelter with more material between the crew and the outside can reduce exposure.', 'Open the refuge tablet and check the seat map.'),
    slide('Use the supplies around you', 'Water containers, panels, and cargo can shield different parts of the refuge.', 'Fasten what you install and keep the door, vent, and drinking tap clear.'),
    slide('Check the refuge before the alert', 'The seat map estimates protection. The sensors show what happens during the event.', 'Run the refuge check, seat the crew, and watch both sensors until the all-clear.'),
  ]},
  greenhouse: {title: 'Grow a birthday salad', slides: [
    slide('Share the light', 'Each bed needs light to grow, and the lamps share the base’s power supply.', 'Choose a lighting plan and check the power budget before ending the day.'),
    slide('Check the soil and the air', 'Roots need water and leaves need moving air. A screen reading can look normal even when a fan has stopped.', 'Check the vent directly. Water dry beds and close the red valve before replacing a leaking hose.'),
    slide('Check before serving', 'Ready plants still need clean handling and a clean basket.', 'Inspect the leaves and basket at the table before serving Elena’s salad.'),
  ]},
  'earth-delay': {title: 'Fix the water recycler', slides: [
    slide('Use the waiting time', 'A message to Earth and its reply both take time to cross space.', 'Choose whether to test locally, ask Earth, or do both. Save water while you wait.'),
    slide('Power off before opening', 'Testing helps you decide which part needs replacing and keeps good spares on the shelf.', 'Turn off the breaker before opening the panel. Use the meter or look for a blocked filter.'),
    slide('Prove the repair worked', 'A test run tells you whether the recycler can clean water again.', 'Close the panel, turn power back on, and test the machine before reporting in.'),
  ]},
  'lunar-sunlight': {title: 'Catch the low lunar Sun', slides: [
    slide('Pick a place for the mast', 'Near the Moon’s south pole, even a small hill can cast a long shadow across the panels.', 'Compare the pads and check how far the cable can reach.'),
    slide('Raise the panels safely', 'The cart’s legs steady it when the mast extends.', 'Lower the legs, raise the mast, unfold the solar wings, then plug into the base and start the tracker.'),
    slide('Watch what happens in shadow', 'When the panels lose sunlight, the base draws from its battery.', 'At the console, compare how your plan supports heating and science.'),
  ]},
  'lunar-dust': {title: 'Keep Moon dust out of the base', slides: [
    slide('Keep the airlock sealed', 'Fine Moon dust can scratch visors and irritate the crew’s lungs.', 'Close the outside hatch and fill the airlock with air before cleaning.'),
    slide('Choose a tool for the surface', 'The brush is quick on fabric. A visor needs a gentler tool.', 'Try the vacuum or the electric dust plate on the helmet. Watch your power and filters.'),
    slide('Clear the air, too', 'A clean suit can still be surrounded by dusty air.', 'Run the air cleaner and wait for a safe reading before opening the inside hatch.'),
  ]},
  'lunar-relay': {title: 'Keep in touch over the ridge', slides: [
    slide('Plan for the radio shadow', 'The ridge blocks the direct radio path from Shadow Hollow to Horizon Base.', 'Pick the relay plan if you want to keep a link in the hollow.'),
    slide('Find a path for the signal', 'From high on the ridge, the relay can pass messages between the base and the rover.', 'Set out its legs, raise the mast, and aim the dish toward the base.'),
    slide('Bring back the sample and the data', 'The soil core and its notes work together. The notes tell scientists where the core came from.', 'Store the core in the rover, send its data when you have a link, and save enough air and battery for home.'),
  ]},
  extended: {title: 'Keep the Meridian bases connected', slides: [
    slide('Meet the crews at their bases', 'Each base has a different job. A repair at one base can help the others.', 'Park at Meridian, step outside, and follow the gold beacon to Reyes.'),
    slide('Plan a pickup and delivery', 'The rough route can save time. A smoother route can be easier to drive.', 'Check the cargo and destination, then choose a route on the map.'),
    slide('Follow the supply chain', 'Fixing the recycler helps Verdant grow food to share. A repaired relay keeps the bases in touch.', 'Use the field log to check which crew needs you next.'),
  ]},
  'outpost-drill': {title: 'Keep Verdant running', slides: [
    slide('Choose what to power', 'Dust cuts Verdant’s solar output. The battery can cover some of the gap.', 'Compare the forecast for the recycler and grow lights before you commit.'),
    slide('Shield the crew', 'Water in the refuge can reduce exposure, but those containers are unavailable for other jobs until the all-clear.', 'Compare the shielded core with the water-wall option.'),
    slide('Choose when to restart', 'A local check takes power now. Waiting for Earth uses some of your stored air.', 'Look at the forecast for air and crop growth before choosing a restart plan.'),
  ]},
  campaign: {title: 'Plan 30 sols at Meridian', slides: [
    slide('Read the supplies before choosing', 'The crew shares its power, air, water, and food. A job can help one supply and cost another.', 'Check the meters, then pick one job for the day.'),
    slide('Leave some room for surprises', 'A storm or equipment problem can change what the crew needs tomorrow.', 'Build a reserve when things are calm and rest the crew when they tire.'),
    slide('Review your decisions', 'Small choices add up over 30 sols.', 'At the end, compare the crew’s condition and supplies with the choices you made.'),
  ]},
};

export const pipLessonStep = {
  station: s => s.comms ? (s.site ? 3 : 2) : s.diagnosed || s.fixed ? 1 : 0,
  'solar-shelter': s => s.stage !== 'prep' ? 2 : s.mapViewed ? 1 : 0,
  greenhouse: s => s.day > s.scenario.growDays ? 2 : s.plan ? 1 : 0,
  'earth-delay': s => s.fixed || s.swaps.length ? 2 : s.plan ? 1 : 0,
  'lunar-sunlight': s => s.plug === 'port' && s.tracker ? 2 : s.plan ? 1 : 0,
  'lunar-dust': s => s.innerOpen || (s.pressurized && Object.values(s.items).every(item => item.dust <= s.scenario.cleanEnough)) ? 2 : s.pressurized ? 1 : 0,
  'lunar-relay': s => s.at === 'hollow' || s.stowed ? 2 : s.plan ? 1 : 0,
};
