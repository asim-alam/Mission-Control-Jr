// Player age profiles. Cadet (ages 7–9) is the default: the same choices and trade-offs,
// with wider safety margins, shorter work steps and earlier warnings so a younger player
// can learn from a weaker plan instead of hitting a training stop.
// Explorer (ages 10–12) keeps the original authored values unchanged.
export const DIFFICULTY_KEY='mission-control-jr.difficulty.v1';
export const LEVELS={
 cadet:{id:'cadet',label:'Cadet',ages:'7–9'},
 explorer:{id:'explorer',label:'Explorer',ages:'10–12'}
};

/** Cadet overrides per mission. Values are authored game tuning, not NASA measurements. */
export const CADET_TUNING={
 // 10 min before activity instead of 8; one-minute cart moves; gentler modeled hazard.
 'solar-shelter':{initialEnergyWh:200,hazardStart:600,bagTransferSeconds:60,eventPerSecond:.02},
 // Shorter repair; slightly faster growth so a one-tray plan still reaches harvest.
 greenhouse:{repairSeconds:900,progressPerFullLightPeriod:.2},
 // Waiting for Earth's reply (~25 min round trip) without conserving is survivable, just costly.
 'earth-delay':{processingSeconds:120,normalAirLossPerSecond:.055,conservedAirLossPerSecond:.015,unpoweredAirLossPerSecond:.055,initialEnergyWh:150},
 // More stored energy so a late or shaded collector does not stop training.
 'lunar-sunlight':{initialEnergyWh:650},
 // Larger filter and shorter hand cleaning.
 'lunar-dust':{initialFilter:60,spareFilters:2,manualPanelSeconds:300,manualOtherSeconds:150,initialEnergyWh:400},
 // A faster, better-charged rover.
 'lunar-relay':{initialRoverWh:420,secondsPerMeter:3},
 // Older chapters read these through their own controllers.
 storm:{prepSeconds:540,stormDrainScale:.6},
 rover:{drainScale:.65}
};

export function difficultyLevel(storage){
 try{return (storage??globalThis.localStorage)?.getItem(DIFFICULTY_KEY)==='explorer'?'explorer':'cadet';}
 catch{return 'cadet';}
}
export const isCadet=storage=>difficultyLevel(storage)==='cadet';
export function setDifficultyLevel(level,storage){
 if(!LEVELS[level])return false;
 try{(storage??globalThis.localStorage).setItem(DIFFICULTY_KEY,level);return true;}catch{return false;}
}

/** Return a copy of a mission scenario tuned for the level. Explorer returns an unchanged copy. */
export function tuneScenario(missionId,scenario,level=difficultyLevel()){
 const tuned=structuredClone(scenario);
 tuned.difficulty=LEVELS[level]?level:'cadet';
 if(tuned.difficulty==='cadet')Object.assign(tuned,CADET_TUNING[missionId]||{});
 return tuned;
}
/** Plain options object for the older storm and rover controllers. */
export function chapterTuning(missionId,level=difficultyLevel()){
 return level==='explorer'?{}:{...(CADET_TUNING[missionId]||{})};
}

/** HUD text: Cadets see a percentage and a word; Explorers see the original units. */
export function reserveText(value,max,unit,level=difficultyLevel()){
 const safe=Number.isFinite(value)?value:0;
 if(level==='explorer')return `${unit==='kg'?safe.toFixed(1):Math.round(safe)} ${unit}`;
 const pct=max>0?Math.max(0,Math.min(100,Math.round(safe/max*100))):0;
 return `${pct}% · ${pct>=50?'Good':pct>=25?'Getting low':'Very low'}`;
}
