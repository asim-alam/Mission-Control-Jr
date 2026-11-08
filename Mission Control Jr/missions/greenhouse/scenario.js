import inputs from '../../data/normalized.json' with {type:'json'};
export const greenhouseScenario={id:'meridian-cultivation-v1',version:1,kind:'authored exercise with NASA-informed concepts',
 sourceIds:['osdr-osd-269','nasa-life-support-baseline'],durationSeconds:172800,periodSeconds:86400,lightSeconds:inputs.lettuceReference.lightHours*3600,
 initialEnergyWh:3600,capacityWh:4000,essentialW:60,lightW:100,generationW:[220,205],initialWaterKg:12,
 pumpW:20,waterPerTrayKg:1,progressPerFullLightPeriod:.15,faultFlowFactor:.6,repairSeconds:1800,repairEnergyWh:40,
 limitation:'Plants were already growing. Mars crop growth, resources, fault, yields and this simplified 24-hour schedule are authored for play, not measured Mars production.'};
