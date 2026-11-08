/** Authored training scale for the Thirty Sols radiation event; values are not dose units. */
export function modeledStormExposure(preparationPoints){
 if(!Number.isFinite(preparationPoints)||preparationPoints<0)throw new RangeError('Invalid preparation points');
 const exposurePoints=Math.max(10,70-Math.min(100,preparationPoints));
 return {exposurePoints,crewConditionLoss:Math.max(2,Math.round(exposurePoints/5))};
}

/** Keep hazards consequential while the child-facing training remains nonlethal. */
export function remainingCrewCondition(current,loss){
 if(!Number.isFinite(current)||!Number.isFinite(loss)||current<1||loss<0)throw new RangeError('Invalid crew condition');
 return Math.max(1,current-loss);
}
