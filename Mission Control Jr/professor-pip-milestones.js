// Only major achievements get a classroom visit. Each lesson explains the action
// the player just completed and points to the next thing they can do.
const milestone = (title, summary, next) => ({title, summary, try: next});

export const pipMilestones = {
  station: [
    [s => s.comms && s.phase === 'active', milestone('Meridian can hear you!', 'The test proved your radio repair worked. Meridian’s beacon now helps the lander aim at a smaller area.', 'Get the lander ready and choose a site at the planner table.')],
    [s => s.stage === 'landed' && s.landing, s => {
      const {rough, diverted, comms} = s.landing;
      return milestone(rough ? 'Touchdown! What made it bumpy?' : 'Touchdown on Mars!',
        rough ? 'The lander reached rough ground inside the landing oval. Choosing smoother terrain or charging the hazard camera can help on another try.'
          : diverted ? 'The hazard camera spotted rough ground and helped the lander steer to a smoother spot.'
            : comms ? 'Meridian’s radio beacon helped shrink the landing oval, and you touched down on smooth ground.'
              : 'You touched down on smooth ground. A landing oval shows the area the lander might reach, so look at the whole area when picking a site.',
        'Open the landing report to see where you came down.');
    }],
  ],
  storm: [
    [s => s.repaired, milestone('Backup power connected', 'Dust reduces the sunlight reaching the panels. The battery can supply power while the panels make less.', 'Choose what to protect at the computer, then get the crew inside.')],
    [s => s.ended, s => milestone('The storm exercise is over', s.outcome === 'evacuated'
      ? 'When base power ran too low, the rover gave the crew another place to shelter.'
      : 'The crew made it through. Cleaning panels, connecting backup power, and closing the shelter door can all improve their safety.',
    'Check the report to see how much power and air were left.')],
  ],
  rover: [
    [s => s.checks.brakes, milestone('Driving test passed', 'You proved the rover can steer and stop while you are still close to base.', 'Compare the routes and keep enough battery for the trip home.')],
    [s => s.scienceComplete, milestone('Field evidence recorded', 'Your wide photo shows where the layers meet. The ruler in the close photo shows the size of the details.', 'Check your reserves before deciding whether to collect a bonus rock or head home.')],
    [s => s.ended && s.returned, s => milestone('The crew is home', s.scienceComplete
      ? 'Bringing back your notes and photos lets other scientists check what you saw.'
      : 'Turning back when a trip gets risky is a good crew decision. You can return for the photos on another attempt.',
    'See how the route and your decisions affected the trip in the report.')],
  ],
  'solar-shelter': [
    [s => s.stage === 'cover', milestone('The crew is in the refuge', 'Water, panels, and supplies can reduce exposure. Where you put them changes how well each seat is protected.', 'Watch the sensors to see how your layout works.')],
    [s => s.stage === 'after', milestone('All clear', 'The particle event has passed. Compare the sensor readings to see which parts of your refuge gave the crew more protection.', 'Open the report to see the results by seat.')],
  ],
  greenhouse: [
    [s => s.leak === 'fixed', milestone('You stopped the leak', 'Closing the valve stopped the water flow so you could replace the hose. Keeping water in the system leaves more for the plants.', 'Check the beds for dry soil and keep the growing plan going.')],
    [s => s.served, milestone('Harvest checked and served', 'Light, water, and moving air helped the plants grow. Checking the leaves and basket was the last step before serving.', 'Look at the report to see what your garden produced.')],
  ],
  'earth-delay': [
    [s => s.phase === 'debrief' && s.fixed && !s.stoppedEarly, milestone('Clean water is flowing', 'The test run proved the repair worked. Local checks can help a crew keep working while a radio reply is still on its way.', 'Compare your repair choices in the report.')],
  ],
  'lunar-sunlight': [
    [s => s.tracker && s.plug === 'port', milestone('The solar cart is online', 'The tracker keeps the panels facing the Sun. The mast raises them above some of the shadows cast by nearby hills.', 'Run the watch at the console to see how your setup powers the base.')],
    [s => s.watch, milestone('Your power watch is complete', 'The panels supply power in sunlight. During shadow, the base has to draw from the battery.', 'Compare heating and science time in the report.')],
  ],
  'lunar-dust': [
    [s => s.innerOpen, milestone('Airlock exercise complete', 'Gear can look clean while fine dust is still floating in the air. That is why you check the air reading as well as the gear before going inside.', 'See how much dust was left in the report.')],
  ],
  'lunar-relay': [
    [s => s.stowed > 0, milestone('A core is packed for the trip', 'A sample tells scientists more when they know where it came from. The field notes and the core belong together.', 'Send the data when you have a signal, then save enough air and battery to get home.')],
    [s => s.finished, milestone('Back at Horizon Base', 'A ridge can block a direct radio signal. A relay above the ridge can pass the message along, or a crew can send saved data once they return to coverage.', 'Open the report to review your route, samples, and messages.')],
  ],
  campaign: [
    [s => s.sol > 7, milestone('One week on Mars', 'Each job changes the supplies the crew can use tomorrow. Building a reserve gives you more choices when a storm arrives.', 'Look for the lowest supply before you pick the next job.')],
    [s => s.ended && s.sol === 30, milestone('Thirty sols complete', 'Small choices about power, food, and rest add up over a long stay.', 'Compare the crew’s condition and supplies with your biggest decisions in the report.')],
  ],
};

export const baseBossLessons = {
  valve: 'A working recycler lets Verdant reuse water and keep its plants growing.',
  relay: 'The repaired radio can reach the orbiter again. The trip to Earth and back still takes time.',
  sample: 'Keeping the field notes with the rock helps the lab understand where it came from.',
  food: 'Repairing the recycler helped Verdant grow food to share with Forge.',
  shelter: 'Stocking a refuge before a solar particle event gives the crew a safer place to wait.',
};

export function trackPipMilestones(deck, initialState) {
  const entries = pipMilestones[deck] ?? [];
  let seen;
  function reset(state) { seen = entries.map(([done]) => Boolean(done(state))); }
  reset(initialState);
  return {
    reset,
    update(state) {
      let latest;
      entries.forEach(([done, lesson], i) => {
        if (seen[i] || !done(state)) return;
        seen[i] = true;
        latest = lesson;
      });
      return typeof latest === 'function' ? latest(state) : latest;
    },
  };
}
