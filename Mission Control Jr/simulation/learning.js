const explanations={
 'solar-shelter':'Essential systems request 180 W and the recorder requests 240 W. The battery serves essentials first. Water changes access and the modeled exposure factor; it does not erase water mass or reduce exposure to zero.',
 greenhouse:'Each lit tray uses modeled electricity and water over the full training period. Crop progress depends on power actually served. Packaged meals remain the primary food supply; the NASA reference supplies a light schedule, not Mars yields.',
 'earth-delay':'The archived Mars–Earth center light time is about 11.01 minutes one way for the selected date. Processing time is a separate authored delay, so sending a request does not make Earth’s reply available.',
 'lunar-sunlight':'The LOLA illumination windows are long-term site samples used as separate analogs. The short shadow windows, loads, cable lengths, and generation mapping are authored for this training exercise.',
 'lunar-dust':'The NASA EDS demonstration concerned rigid surfaces such as glass and a radiator. The panel and filter values are fictional; lunar dust is shown from earlier handling, not wind.',
 'lunar-relay':'The ridge blocks the local direct path in this simplified geometry. A relay needs power and two clear hops; Earth packet travel uses a lunar light-time estimate and does not model a radio link budget.'
};
const prompts={
 'solar-shelter':'Choose what to protect first. Water stays in the outpost when you move it, but takes time to reach.',
 greenhouse:'Choose which crop work to power. Lights and water only help when the habitat can serve them.',
 'earth-delay':'Choose a local repair or a safe way to wait. Earth’s reply arrives later.',
 'lunar-sunlight':'Compare the pads, then decide whether to move the collector or save the battery.',
 'lunar-dust':'Keep dusty gear outside the clean cabin. Choose powered or hand cleaning, then check the doors.',
 'lunar-relay':'Choose how far to survey. A relay can help around the ridge, but it costs time and energy.'
};
export function learningMode(storage){
 try{return (storage??globalThis.localStorage)?.getItem('mission-control-jr.learning-mode.v1')==='details'?'details':'simple';}
 catch{return 'simple';}
}
export function learningPrompt(id,storage){return learningMode(storage)==='simple'?(prompts[id]||'Choose one next step. Check what it costs before you continue.') : '';}
/** Simple mode exposes two mission actions plus a third progressive-disclosure control. */
export function learningChoices(actions,expanded=false,storage){
 if(learningMode(storage)!=='simple'||expanded||actions.length<=3)return actions;
 return [...actions.slice(0,2),{label:'More choices',more:true}];
}
export function learningDetail(id,storage){
 if(learningMode(storage)!=='details')return '';
 return explanations[id]||'';
}
