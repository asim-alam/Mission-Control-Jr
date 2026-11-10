const explanations={
 orbit:'Orbiters really relay radio for Mars landers, fly through Mars’ shadow and aim landers at a landing ellipse. Perseverance really steered around rocks while landing in 2021. The orbiter, its power units, the sites and the rocks are made up for the game.',
 'solar-shelter':'The May 2024 particle event is a real NASA record, measured near Earth by GOES, not at Mars. The refuge layout, warning window and exposure units are made up for the game. Water, plastic and packed supplies all slow particles because they hold lots of hydrogen, and where you put them matters.',
 greenhouse:'NASA gave us the light schedule (16 hours on, 8 off) and the crops astronauts really grew: red lettuce, mizuna and chile peppers. The power budget, growth speed and leak are made up for the game. Packed meals are still the main food.',
 'earth-delay':'On this date a message takes about 11 minutes to go from Mars to Earth, even at the speed of light (NASA JPL data). The answer needs 11 more minutes to come back. The recycler, its parts, the meter numbers and the water use are made up for the game.',
 'lunar-sunlight':'NASA’s LOLA maps show how often real spots near the Moon’s south pole get sunlight. Our hills, cart, cable and battery are pretend.',
 'lunar-dust':'NASA’s dust shield test cleaned hard, smooth things like glass. Our tool, power and filter numbers are pretend. The dust came in on our gear, not wind. The Moon has no wind.',
 'lunar-relay':'Radio goes in straight lines, so a hill blocks it. A relay on the ridge top needs two clear hops: base to relay, then relay to you. A message from the Moon to Earth takes about one second.'
};
const prompts={
 orbit:'Fix the radio, charge the lander, or pick the far smooth plains? Each one makes the landing safer in a different way.',
 'solar-shelter':'Water, plastic panels and supply bags all help. There is not time for everything, so what will you build first?',
 greenhouse:'Which beds get full light? Borrowing battery power grows more, but the base needs it at night.',
 'earth-delay':'Earth’s answer takes over 20 minutes. Test the parts yourself, ask Earth, or do both?',
 'lunar-sunlight':'Is it better to go high on the ridge, or build a tall mast close to home?',
 'lunar-dust':'Brushing is fast but makes dusty air. The vacuum is slow and uses power. Which will you use on the visor?',
 'lunar-relay':'Will you take time to set up a relay and stay in touch, or make a quick trip and send your data later?'
};
export function learningMode(storage){
 try{return (storage??globalThis.localStorage)?.getItem('mission-control-jr.learning-mode.v1')==='details'?'details':'simple';}
 catch{return 'simple';}
}
export function learningPrompt(id,storage){return learningMode(storage)==='simple'?(prompts[id]||'Pick one next step. Think: what will it use up?') : '';}
/** Simple mode exposes two mission actions plus a third progressive-disclosure control. */
export function learningChoices(actions,expanded=false,storage){
 if(learningMode(storage)!=='simple'||expanded||actions.length<=3)return actions;
 return [...actions.slice(0,2),{label:'More choices',more:true}];
}
export function learningDetail(id,storage){
 if(learningMode(storage)!=='details')return '';
 return explanations[id]||'';
}
