// Pip's "why" tips, matched against each chapter's objective text (first match wins, so order matters).
// Keep every tip to one or two short sentences a 7-9 year old can read.
// test/companion.test.js checks that every objective a chapter can show gets a tip.
export const PIP_TIPS={
 storm:[
  [/air or science/i,'There is not enough power for everything. You choose what matters most.'],
  [/computer/i,'The computer is like a doctor for the base. It tells us what is broken.'],
  [/panel/i,'Solar panels turn sunlight into power. Dust blocks the sunlight, so brush it off!'],
  [/battery from the rover/i,'A battery stores power for later. We need it when the storm hides the Sun.'],
  [/battery in/i,'Carry the battery to the power box. It plugs in there.'],
  [/plugs/i,'Click each plug until it shows the right number: 1, then 2, then 3.'],
  [/message home/i,'Earth is far away. Messages take minutes to get there, so send it soon.'],
  [/door/i,'Inside the base, the walls keep out the dust. Close the door tight!'],
  [/inside/i,'Storms on Mars can last for weeks. The base is the safest place to be.'],
  [/finished|complete/i,'You did it! Want to try a different choice next time?']
 ],
 rover:[
  [/plan|listen/i,'Listen to the plan first. Good explorers know where they are going.'],
  [/spare|battery/i,'The rover runs on a battery. A spare one means we can get home safely.'],
  [/wheel|pin/i,'A loose wheel can fall off far from home. Fix it now, while it is easy.'],
  [/camera/i,'Dust on the camera makes blurry photos. Scientists need clear pictures.'],
  [/radio stop/i,'Radio stops tell the base where we are. If something goes wrong, they know where to look.'],
  [/suits|tools/i,'Check everything before driving. A small problem is easy to fix at home.'],
  [/get in/i,'Everyone rides together. Never leave a friend behind!'],
  [/test drive/i,'Practice near the base first. Learn to stop before the real drive.'],
  [/path/i,'The shortest way is not always the safest. Look at the ground on each path.'],
  [/strange ground|what should we do/i,'Cracked ground can hide soft sand. A real NASA rover called Spirit got stuck in sand on Mars!'],
  [/kestrel|explore/i,'The striped rocks were made in layers, long ago. Layers are like pages in a history book.'],
  [/wide photo/i,'Scientists take a wide photo first, then a close one. Then they can compare.'],
  [/close photo/i,'The ruler shows how big things are. Scientists always put something in the photo to show size.'],
  [/say what you see/i,'Scientists say what they see first. Guessing comes later.'],
  [/bonus rock/i,'A bonus rock is fun, but only if there is enough battery to get home.'],
  [/send your photos/i,'Photos only help if they reach the base. Real rovers send their pictures to Earth too.'],
  [/everyone is home/i,'Count everyone before you finish. Nobody gets left behind!'],
  [/science done|drive home/i,'Always keep enough battery to get home. That is called a safety margin.'],
  [/finished|complete/i,'Great driving! Real rovers on Mars drive slowly and carefully too.']
 ],
 orbit:[
  [/arrival/i,'Mars is the red planet. The space station flies around it, high above the ground.'],
  [/dock|soft capture/i,'Go slow when docking. Bumping a space station is dangerous.'],
  [/hear the plan/i,'Listen first. Then you know what job to do.'],
  [/find what is broken/i,'Find the problem before you fix it. A doctor checks you before giving medicine, too.'],
  [/turn off power/i,'Turn off the power before you touch the parts. That keeps you safe.'],
  [/controller/i,'Sometimes a loose part just needs to be pushed back in tight.'],
  [/test the radio/i,'A relay passes messages along, like friends passing a note. Test it so the base can hear us.'],
  [/pack|kit/i,'In space, loose things float away. Pack everything tight.'],
  [/door/i,'The door to the lander must lock tight, so no air leaks out.'],
  [/get in the lander/i,'The lander carries us down to the ground. Check it before we go.'],
  [/landing path/i,'The computer must know where Meridian base is, so we land in the right spot.'],
  [/fuel|belt/i,'The engine slows us down for landing. Seat belts keep us safe on the bumpy ride.'],
  [/landed|complete/i,'Welcome to Mars! Next, help the base get ready for a dust storm.'],
  [/land on mars|landing on mars/i,'Mars air is thin, so a parachute is not enough. Rockets slow the lander at the end.']
 ],
 'solar-shelter':[
  [/weather screen/i,'The Sun can throw out invisible energy called radiation. The screen warns us.'],
  [/practice/i,'Practice makes us fast. When a real warning comes, everyone knows what to do.'],
  [/water|bag/i,'Water blocks radiation. Water bags around the safe room make it safer.'],
  [/crew and finish/i,'Radiation storms pass with time. Check everyone is OK before you finish.'],
  [/what you chose/i,'You kept everyone safe from the Sun storm. Nice work!'],
  [/stopped/i,'That is OK! Real crews practice many times.']
 ],
 greenhouse:[
  [/meet the plants/i,'Plants make food and fresh air. On Mars, a greenhouse is like a farm inside a tent.'],
  [/light/i,'Plants need light to grow. NASA grows lettuce in space with 16 hours of light a day.'],
  [/pipe|leak/i,'A leaky pipe wastes water. On Mars, every drop counts.'],
  [/harvest/i,'Ready to pick! Fresh food makes astronauts happy and healthy.'],
  [/plants did/i,'Your greenhouse grew real food. Farming on Mars is hard work!'],
  [/stopped/i,'That is OK! Farmers learn from every season.']
 ],
 'earth-delay':[
  [/broken pump/i,'First, look at what is broken. Then you can make a plan.'],
  [/message to earth/i,'Mars is very far from Earth. A message can take up to 22 minutes just to get there!'],
  [/fix it yourself|wait for earth/i,'While you wait, save air. Or follow the repair steps in order yourself.'],
  [/test the pump/i,'Always test a repair. Then you know it really works.'],
  [/finish|what you chose/i,'You made a plan without waiting for Earth. That is what Mars crews must do!'],
  [/stopped/i,'That is OK! Real crews practice many times.']
 ],
 'lunar-sunlight':[
  [/welcome/i,'Near the Moon’s south pole, the Sun stays low in the sky. Shadows are very long.'],
  [/battery/i,'Check your power before you start. Then you know how much you have.'],
  [/where the sunlight is/i,'Long shadows move across the ground. NASA maps show the sunny spots.'],
  [/pick a spot/i,'Put solar panels where the sunlight reaches. High spots stay sunny longer.'],
  [/move the solar panel|plug/i,'The cable must reach the base. Plug it in so the power can flow.'],
  [/shadow/i,'Save power for when the shadow comes. The Moon gets very cold in the dark.'],
  [/plan worked/i,'You found the sunlight! Real NASA scientists study these sunny spots.'],
  [/stopped/i,'That is OK! Shadows move, so plans can change.']
 ],
 'lunar-dust':[
  [/dusty things/i,'Moon dust is sharp and sticky, like tiny bits of glass. It sticks to everything.'],
  [/clean the dust|outside door/i,'Clean your suit and tools first. Then shut the outside door so no more dust comes in.'],
  [/clean the air/i,'The filter catches dust floating in the air. Both doors stay shut while it works.'],
  [/no dust is left/i,'Check carefully. Even a little dust can scratch things and make people cough.'],
  [/inside door/i,'Only open the inside door when the dust is gone. Then the base stays clean.'],
  [/kept dust out/i,'Dust is one of the hardest problems on the Moon. You handled it!'],
  [/stopped/i,'That is OK! Dust is tricky.']
 ],
 'lunar-relay':[
  [/plan your moon drive/i,'Plan before you drive. Then you know how to get home.'],
  [/map and the hill/i,'Hills block radio signals. Look where the hill is on the map.'],
  [/near stop|far stop/i,'The far stop is behind the hill. The radio cannot reach it without help.'],
  [/relay/i,'A relay on the hill top passes the message over, like a friend passing a note.'],
  [/arrived|everyone is home/i,'Check the message got through and everyone is back. Then the trip is done!'],
  [/message|drive home/i,'Keep enough battery to drive back. Do not get stuck far away.'],
  [/trip went/i,'Your message hopped over the hill. That is how relays work!'],
  [/stopped/i,'That is OK! Every trip teaches something.']
 ]
};
