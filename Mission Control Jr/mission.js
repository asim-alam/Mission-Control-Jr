export const PREPARATION_SECONDS = 360;
export function createMission() {
  return {started:false,diagnosed:false,cleaned:[false,false,false],battery:false,installed:false,
    connector:[0,0,0],bayOpen:false,repaired:false,allocation:null,inside:false,sealed:false,storm:false,
    elapsed:0,stormAge:0,insideAge:0,ended:false,outcome:null,
    resources:{power:34,oxygen:77,morale:72},talked:[],responded:[],log:[]};
}
export function objective(m) {
  if(m.ended)return 'Mission complete';
  if(m.inside)return m.sealed?'Wait for the front to pass · transmit status':'Seal the airlock at the shelter console';
  if(m.storm)return 'Return to the airlock and take shelter';
  if(!m.diagnosed)return 'Check the diagnostic terminal';
  if(m.cleaned.some(v=>!v))return `Clean the solar array · ${m.cleaned.filter(Boolean).length}/3 sections`;
  if(!m.battery&&!m.installed)return 'Recover the reserve battery from the rover';
  if(!m.installed)return 'Fit the battery at the power junction';
  if(!m.repaired)return 'Align the power junction connectors · 1 / 2 / 3';
  if(!m.allocation)return 'Allocate reserves at the diagnostic terminal';
  return 'Return to the airlock and secure the crew';
}
export function record(m,text) {m.log.unshift(text);m.log=m.log.slice(0,30);}
export function finish(m) {
  if(m.ended)return;
  const prepared=m.cleaned.every(Boolean)&&m.repaired;
  m.outcome=!m.inside||!m.sealed?'evacuated':prepared&&m.allocation==='life'?'prepared':'survived';
  m.ended=true;
  record(m,m.outcome==='prepared'?'All four crew safe. Preparation protected Meridian.':m.outcome==='survived'?'Crew safe; reserves depleted. Review your preparation.':'Emergency evacuation initiated. Meridian must be abandoned.');
}
export function act(m,type,value) {
  const no=message=>({ok:false,message});
  if(m.ended)return no('Start a new mission to continue.');
  let line=null,message='';
  if(type==='start'){if(m.started)return no('Mission already started.');m.started=true;line='intro';message='Mission started.';}
  else if(!m.started)return no('Begin the mission first.');
  else if(type==='diagnose') {
    if(m.diagnosed)return no('Diagnostics already complete.');
    m.diagnosed=true;line='diagnosis';message='Fault found: contaminated collectors and a failed reserve battery.';
  } else if(type==='clean') {
    if(!m.diagnosed)return no('Inspect the habitat terminal first.');
    if(!Number.isInteger(value)||value<0||value>2)return no('Unknown collector.');
    if(m.cleaned[value])return no('This collector is already clean.');
    m.cleaned[value]=true;m.resources.power=Math.min(100,m.resources.power+13);message=`Collector ${value+1} restored.`;
    line=m.cleaned.every(Boolean)?'solar-complete':'panel-clean';
  } else if(type==='openBay') {
    if(!m.diagnosed)return no('Inspect the habitat terminal first.');
    if(m.bayOpen)return no('Service bay already open.');
    m.bayOpen=true;message='Rover service bay unlocked. Recover the reserve battery.';
  } else if(type==='battery') {
    if(!m.diagnosed)return no('Inspect the habitat terminal first.');
    if(!m.bayOpen)return no('Open the rover service bay first.');
    if(m.battery||m.installed)return no('Reserve battery already recovered.');
    m.battery=true;line='battery';message='Reserve battery added to inventory.';
  } else if(type==='install') {
    if(m.installed)return no('Battery already fitted.');
    if(!m.battery)return no('Recover the reserve battery from the rover first.');
    m.installed=true;m.battery=false;line='install';message='Battery fitted. Align connectors to 1 / 2 / 3.';
  } else if(type==='rotate') {
    if(!m.installed)return no('Fit the battery first.');
    if(m.repaired)return no('Connection is already stable.');
    if(!Number.isInteger(value)||value<0||value>2)return no('Unknown connector.');
    m.connector[value]=(m.connector[value]+1)%4;return {ok:true,message:'Connector rotated.'};
  } else if(type==='connect') {
    if(!m.installed)return no('Fit the reserve battery first.');
    if(m.repaired)return no('Power already restored.');
    if(!m.connector.every((v,i)=>v===i+1))return no('Align connectors to 1 / 2 / 3, then engage the relay.');
    m.repaired=true;m.resources.power=Math.min(100,m.resources.power+25);line='repair';message='Power bus restored. Habitat lights online.';
  } else if(type==='allocate') {
    if(!m.repaired||!m.cleaned.every(Boolean))return no('Restore the collectors and repair the power junction first.');
    if(m.allocation)return no('Reserves are already allocated.');
    if(!['life','research'].includes(value))return no('Unknown allocation.');
    m.allocation=value;m.resources.oxygen=value==='life'?95:55;
    m.resources.morale=value==='life'?84:75;line=value==='life'?'life':'research';
    message=value==='life'?'Oxygen reserves prioritized. Crew ready for shelter.':'Science systems retained. Oxygen reserves are limited.';
    m.storm=true;m.stormAge=0;
  } else if(type==='enter') {
    if(!m.diagnosed)return no('Read the mission diagnostics before entering shelter.');
    if(m.inside)return no('You are already inside.');
    m.inside=true;m.storm=true;line='shelter';message='Inside Meridian. Seal the airlock at the console.';
  } else if(type==='seal') {
    if(!m.inside)return no('Enter the shelter first.');
    if(m.sealed)return no('Airlock already sealed.');
    m.sealed=true;m.insideAge=0;line='sealed';message='Airlock sealed. Crew accounted for. Hold for the front to pass.';
  } else if(type==='report') {
    if(!m.inside||!m.sealed)return no('Seal the airlock first.');
    if(m.insideAge<5)return no('The front is still passing. Stand by.');
    finish(m);return {ok:true,message:'Status transmitted.',line:m.outcome};
  } else if(type==='talk') {
    if(!['elena','amara','luca'].includes(value))return no('Unknown crew member.');
    line=value;
    if(!m.talked.includes(value)){m.talked.push(value);m.resources.morale=Math.min(100,m.resources.morale+3);}
    message=`Radio contact: ${value}.`;
  } else if(type==='respond') {
    if(!value||!m.talked.includes(value.crew)||!['encourage','procedure'].includes(value.choice))return no('Check in with this crew member first.');
    if(m.responded.includes(value.crew))return no('Your response is already recorded.');
    m.responded.push(value.crew);
    if(value.choice==='encourage'){m.resources.morale=Math.min(100,m.resources.morale+2);message='Crew reassured. Morale improved.';}
    else {m.resources.power=Math.min(100,m.resources.power+1);message='Procedure confirmed. Equipment consumption reduced.';}
  } else return no('Unknown action.');
  record(m,message);return {ok:true,message,line};
}
export function advance(m,dt,paused=false) {
  if(!m.started||m.ended||paused||!m.diagnosed)return null;
  dt=Math.max(0,Math.min(dt,1));m.elapsed+=dt;
  if(!m.storm&&m.elapsed>=PREPARATION_SECONDS){m.storm=true;m.stormAge=0;record(m,'Dust front arrived before preparations were complete.');return 'storm';}
  if(m.storm) {
    m.stormAge+=dt;
    m.resources.power=Math.max(0,m.resources.power-dt*(m.repaired?.055:.2));
    if(!m.sealed)m.resources.oxygen=Math.max(0,m.resources.oxygen-dt*.55);
    if(m.inside&&m.sealed){m.insideAge+=dt;if(m.insideAge>=16){finish(m);return m.outcome;}}
    if((m.stormAge>=100&&!m.sealed)||m.resources.oxygen<=0){finish(m);return m.outcome;}
  } else if(!m.repaired)m.resources.power=Math.max(0,m.resources.power-dt*.018);
  return null;
}
