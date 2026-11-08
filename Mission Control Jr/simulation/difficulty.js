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
 // Ten more minutes of warning and a gentler peak, so a slower builder still finishes the shelter.
 'solar-shelter':{warningSeconds:1800,peakDoseRate:.033},
 // A bigger battery, a slower leak and a wider "just right" soil band, so a careful plan still feasts.
 greenhouse:{batteryKWh:1.5,leakLPerDay:4,moistureBand:[.8,3.6]},
 // More water at the start, a quicker answer from Earth and shorter hand jobs. The light-time delay itself is never changed.
 'earth-delay':{waterStartL:26,earthThinkSeconds:240,holdSeconds:{openPanel:1.4,closePanel:1,test:.8,inspect:.8,swap:1.1}},
 // More suit air and a bigger, fuller battery, so a short mast still keeps the base warm. Pads, shadows and the Sun are unchanged.
 'lunar-sunlight':{suitMinutes:150,batteryKWh:55,batteryStartKWh:35},
 // More power and a second spare filter, so a brushing plan can still clean the air. Tool effects are unchanged.
 'lunar-dust':{powerUnits:70,spareFilters:2,holdSeconds:{wheel:1.2,brush:.8,vacuum:1.4,filter:1}},
 // More suit air, a fuller rover battery and shorter hand jobs. The hill, the radio rules and the light time are unchanged.
 'lunar-relay':{suitMinutes:110,batteryStart:95,holdSeconds:{legs:.9,stage:1.1,aim:1,drill:1.8}},
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
