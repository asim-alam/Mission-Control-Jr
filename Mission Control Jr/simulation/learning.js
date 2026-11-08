const explanations={
 'solar-shelter':'The air and lights use 180 W. The science machine wants 240 W more. The battery always powers the air and lights first. Water bags block some radiation, but never all of it. The water is still there to drink later.',
 greenhouse:'Each tray with its light on uses power and water. Plants only grow when they really get the power. Packed meals are still the main food. NASA gave us the light schedule: 16 hours on, 8 hours off.',
 'earth-delay':'On this date a message takes about 11 minutes to go from Mars to Earth, even at the speed of light. Earth also needs time to think. So the answer comes much later.',
 'lunar-sunlight':'NASA’s LOLA maps show how often real spots near the Moon’s south pole get sunlight. Our base, cables and shadow times are pretend.',
 'lunar-dust':'NASA’s dust shield test cleaned hard, flat things like glass. Our panel and filter numbers are pretend. The dust came in on our gear, not wind. The Moon has no wind.',
 'lunar-relay':'Radio goes in straight lines, so the hill blocks it. A relay on the hill top needs power and two clear hops: base to relay, then relay to you. A message from the Moon to Earth takes about one second.'
};
const prompts={
 'solar-shelter':'Water blocks radiation. Moving each water bag takes time. What will you do first?',
 greenhouse:'Which plants get light? Remember, the base needs power too.',
 'earth-delay':'Earth’s answer will take a long time. Fix it yourself, or save air while you wait?',
 'lunar-sunlight':'Where does the sunlight reach? Put the solar panel there, or just use the battery.',
 'lunar-dust':'Keep Moon dust out of the base. Clean your gear, then check the doors.',
 'lunar-relay':'How far will you drive? A relay can pass messages over the hill, but it uses time and battery.'
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
