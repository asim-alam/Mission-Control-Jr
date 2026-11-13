const slide = (title, summary, tryThis) => ({title, summary, try: tryThis});

export const pipLessons = {
  docked: {title: 'Docking complete', slides: [
    slide('The clamps caught', 'You lined up the two ports so the spacecraft could join the station.', 'The crosshair showed how far off center you were.'),
    slide('A gentle arrival', 'Docking slowly gives the clamps time to catch without a hard impact.', 'The training limit was 0.2 m/s at the port.'),
    slide('How Elena’s voice reached you', 'Sound needs something to travel through, like air inside your helmet. Radio waves can carry a signal through the vacuum outside.', 'Listen for the crew radio when you enter the cabin.'),
    slide('Welcome to Asteria', 'The clamps are locked and the air pressure is equalized.', 'Open the hatch and find out why Meridian Base can’t hear the station.'),
  ]},
};
