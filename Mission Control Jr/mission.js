import {sunlightFraction} from './data/opportunity-2018.js';
export const PREPARATION_SECONDS = 360;
export function createMission({prepSeconds=PREPARATION_SECONDS,stormDrainScale=1}={}) {
  return {prepSeconds,stormDrainScale,started:false,diagnosed:false,cleaned:[false,false,false],battery:false,installed:false,batteryRecovered:false,batteryInstalled:false,experimentData:0,
    connector:[0,0,0],bayOpen:false,repaired:false,allocation:null,inside:false,sealed:false,storm:false,
    sunlight:1,elapsed:0,stormAge:0,insideAge:0,ended:false,outcome:null,
    resources:{power:34,oxygen:77,morale:72},talked:[],responded:[],log:[]};
}
export function objective(m) {
  if(m.ended)return 'Mission complete';
  if(m.inside)return !m.sealed?'Close the door tight':m.insideAge<5?'Wait for the storm to pass':'Send a message home';
  if(m.storm)return 'Go inside! Follow the marker to the door';
  if(!m.diagnosed)return 'Check the base computer';
  if(m.cleaned.some(v=>!v))return `Clean the solar panels · ${m.cleaned.filter(Boolean).length} of 3 done`;
  if(!m.battery&&!m.installed)return 'Get the spare battery from the rover';
  if(!m.installed)return 'Put the battery in the power box';
  if(!m.repaired)return 'Turn the plugs to 1, 2, 3 · then connect';
  if(!m.allocation)return 'Make a choice at the computer: air or science?';
  return 'Go to the door and bring everyone inside';
}
export function record(m,text) {m.log.unshift(text);m.log=m.log.slice(0,30);}
export function finish(m) {
  if(m.ended)return;
  const prepared=m.cleaned.every(Boolean)&&m.repaired;
  m.outcome=!m.inside||!m.sealed||m.resources.oxygen<=0?'evacuated':prepared&&m.allocation==='life'&&m.resources.oxygen>=75?'prepared':'survived';
  m.ended=true;
  record(m,m.outcome==='prepared'?'Everyone is safe. Getting ready early protected Meridian.':m.outcome==='survived'?'Everyone is safe, but supplies are very low.':'The crew had to leave the base for now.');
}
export function act(m,type,value) {
  const no=message=>({ok:false,message});
  if(m.ended)return no('Start a new mission to keep playing.');
  let line=null,message='';
  if(type==='start'){if(m.started)return no('The mission has already started.');m.started=true;line='intro';message='Mission started.';}
  else if(!m.started)return no('Start the mission first.');
  else if(type==='diagnose') {
    if(m.diagnosed)return no('You already checked the computer.');
    m.diagnosed=true;line='diagnosis';message='Found it: dusty solar panels and an empty spare battery.';
  } else if(type==='clean') {
    if(!m.diagnosed)return no('Check the computer inside first.');
    if(!Number.isInteger(value)||value<0||value>2)return no('That is not one of our panels.');
    if(m.cleaned[value])return no('This panel is already clean.');
    m.cleaned[value]=true;m.resources.power=Math.min(100,m.resources.power+13);message=`Panel ${value+1} is clean!`;
    line=m.cleaned.every(Boolean)?'solar-complete':'panel-clean';
  } else if(type==='openBay') {
    if(!m.diagnosed)return no('Check the computer inside first.');
    if(m.bayOpen)return no('The rover hatch is already open.');
    m.bayOpen=true;message='The rover hatch is open. Grab the spare battery.';
  } else if(type==='battery') {
    if(!m.diagnosed)return no('Check the computer inside first.');
    if(!m.bayOpen)return no('Open the rover hatch first.');
    if(m.battery||m.installed)return no('You already have the battery.');
    m.battery=true;m.batteryRecovered=true;line='battery';message='You are carrying the spare battery.';
  } else if(type==='install') {
    if(m.installed)return no('The battery is already in.');
    if(!m.battery)return no('Get the spare battery from the rover first.');
    m.installed=true;m.batteryInstalled=true;m.battery=false;line='install';message='Battery is in! Now turn the plugs to 1, 2, 3.';
  } else if(type==='rotate') {
    if(!m.installed)return no('Put the battery in first.');
    if(m.repaired)return no('The power is already working.');
    if(!Number.isInteger(value)||value<0||value>2)return no('That is not one of the plugs.');
    m.connector[value]=(m.connector[value]+1)%4;return {ok:true,message:'Click! The plug turned.'};
  } else if(type==='connect') {
    if(!m.installed)return no('Put the spare battery in first.');
    if(m.repaired)return no('The power is already back on.');
    if(!m.connector.every((v,i)=>v===i+1))return no('Turn the plugs to show 1, 2, 3. Then connect.');
    m.repaired=true;m.resources.power=Math.min(100,m.resources.power+25);line='repair';message='Power is back! The lights are on.';
  } else if(type==='allocate') {
    if(!m.repaired||!m.cleaned.every(Boolean))return no('Clean the panels and fix the power box first.');
    if(m.allocation)return no('You already made this choice.');
    if(!['life','research'].includes(value))return no('Pick air or science.');
    m.allocation=value;line=value==='life'?'life':'research';
    message=value==='life'?'You chose extra air. Everyone is ready to go inside.':'You chose science. We have less spare air now.';
    m.storm=true;m.stormAge=0;
  } else if(type==='enter') {
    if(!m.diagnosed)return no('Check the computer before you go inside.');
    if(m.inside)return no('You are inside already.');
    m.inside=true;m.storm=true;line='shelter';message='You are inside! Close the door at the console.';
  } else if(type==='seal') {
    if(!m.inside)return no('Go inside first.');
    if(m.sealed)return no('The door is already closed tight.');
    m.sealed=true;m.insideAge=0;line='sealed';message='Door sealed. All four crew are here. Wait for the storm to pass.';
  } else if(type==='report') {
    if(!m.inside||!m.sealed)return no('Close the door tight first.');
    if(m.insideAge<5)return no('The storm is still passing. Wait a little longer.');
    finish(m);return {ok:true,message:'Message sent home!',line:m.outcome};
  } else if(type==='talk') {
    if(!['elena','amara','luca'].includes(value))return no('Who do you want to talk to?');
    line=value;
    if(!m.talked.includes(value)){m.talked.push(value);m.resources.morale=Math.min(100,m.resources.morale+3);}
    message=`You talked with ${value[0].toUpperCase()+value.slice(1)}.`;
  } else if(type==='respond') {
    if(!value||!m.talked.includes(value.crew)||!['encourage','procedure'].includes(value.choice))return no('Talk with this crew member first.');
    if(m.responded.includes(value.crew))return no('You already answered.');
    m.responded.push(value.crew);
    if(value.choice==='encourage'){m.resources.morale=Math.min(100,m.resources.morale+2);message='Your friend feels braver now.';}
    else {m.resources.power=Math.min(100,m.resources.power+1);message='You followed the safety steps. That saves a little power.';}
  } else return no('That does not work here.');
  record(m,message);return {ok:true,message,line};
}
export function advance(m,dt,paused=false) {
  if(!m.started||m.ended||paused||!m.diagnosed)return null;
  dt=Math.max(0,Math.min(dt,1));m.elapsed+=dt;
  // Sunlight follows Opportunity's real 2018 power record, squeezed into the preparation window.
  m.sunlight=m.storm?sunlightFraction(1):sunlightFraction(m.elapsed/(m.prepSeconds??PREPARATION_SECONDS));
  const solar=dt*.01*m.cleaned.filter(Boolean).length*m.sunlight;
  if(!m.storm&&m.elapsed>=(m.prepSeconds??PREPARATION_SECONDS)){m.storm=true;m.stormAge=0;record(m,'The storm arrived before everything was ready.');return 'storm';}
  if(m.storm) {
    m.stormAge+=dt;
    // Educational percent-units: running systems consume a finite battery.
    // In a partial final tick, only the fraction supplied by the battery works.
    const demand=dt*(m.repaired?.055:.2), supplied=demand?Math.min(1,m.resources.power/demand):0;
    m.resources.power=Math.max(0,Math.min(100,m.resources.power-demand+solar));
    m.resources.oxygen=Math.max(0,Math.min(100,m.resources.oxygen-dt*(m.sealed?.08:.55)*(m.stormDrainScale??1)+(m.sealed&&m.repaired&&m.allocation==='life'?dt*.18*supplied:0)));
    if(m.sealed&&m.repaired&&m.allocation==='research')m.experimentData+=dt*supplied;
    if(m.inside&&m.sealed){m.insideAge+=dt;if(m.insideAge>=16){finish(m);return m.outcome;}}
    if((m.stormAge>=100&&!m.sealed)||m.resources.oxygen<=0){finish(m);return m.outcome;}
  } else m.resources.power=Math.max(0,Math.min(100,m.resources.power+solar-(m.repaired?0:dt*.018)));
  return null;
}
