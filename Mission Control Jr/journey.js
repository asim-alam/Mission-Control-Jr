import {chapterById,readJourney,saveJourney,finishChapter,nextStoryChapter,storyComplete,completionStatus} from './journey-state.js';
import {missionsFor} from './mission-registry.js';
import {journeyUrl,missionFromUrl} from './mission-routes.js';
import {restoreOrbit} from './orbital-mission.js';
import {installHiddenScrollUI} from './scroll-ui.js';
import {difficultyLevel,setDifficultyLevel} from './simulation/difficulty.js';

installHiddenScrollUI();
const $=id=>document.getElementById(id),frame=$('scene');
const learningKey='mission-control-jr.learning-mode.v1';
let storage;try{storage=localStorage;}catch{}
let state=readJourney(storage),active=null,pending=null,activeSampler=false,disposeHomeScene=null,homeSceneGeneration=0;
try{if(restoreOrbit(storage)?.complete&&!state.completed.includes('orbit'))finishChapter(state,'orbit',{outcome:'Arrival qualified'});}catch{}
const persist=()=>{if(!saveJourney(state,storage))$('save-status').textContent='This browser cannot save your game. Your progress ends when you close the page.';};
function hold(value){frame.inert=value;frame.contentWindow?.postMessage({source:'mission-control-jr-shell',type:'hold',value},location.origin);}
function stopHomeScene(){homeSceneGeneration++;disposeHomeScene?.();disposeHomeScene=null;$('home-scene').classList.remove('ready');}
async function startHomeScene(){if(disposeHomeScene||$('journey').hidden)return;const generation=++homeSceneGeneration;try{const {createJourneyScene}=await import('./journey-scene.js');const dispose=await createJourneyScene($('home-scene'));if(generation!==homeSceneGeneration||$('journey').hidden){dispose();return;}disposeHomeScene=dispose;$('home-scene').classList.add('ready');document.body.classList.remove('home-scene-fallback');}catch(error){console.warn('Meridian menu scene unavailable:',error);document.body.classList.add('home-scene-fallback');}}

const PIP_MESSAGE_SETS = {
  orbit: [
    "We're in Mars orbit! Fix the radio rack, save power in shadow, and pick a landing site!",
    "Tip from Pip: Mars is red because of iron dust—just like rust on a bicycle!",
    "Ready to land? Check the station instruments and guide your lander safely down!",
    "Did you know? A day on Mars is called a 'Sol' and lasts 24 hours and 39 minutes!"
  ],
  storm: [
    "A massive dust storm is blowing in! Clean the solar panels and grab the rover battery!",
    "Dust storm alert! Dust blocks sunlight, so we must store every watt of battery power!",
    "Teamwork tip: Jin and Elena are counting on you to keep life support running!"
  ],
  rover: [
    "The sky has cleared! Drive Rover Two across Jezero crater to inspect ancient rocks!",
    "Rover driving tip: Watch your battery reserves so you have enough power to drive home!",
    "Science discovery: Ancient Jezero crater used to be a giant lake billions of years ago!"
  ],
  'solar-shelter': [
    "Sun storm alert! Stack water walls to build a safe refuge before particles rise!",
    "Science fact: Water is heavy, but it blocks dangerous space radiation amazingly well!",
    "Stay calm Cadet! Build the rack frame first, then slide the water containers in."
  ],
  greenhouse: [
    "Hydroponics day! Share the light, water the dry beds, fix the hose, and pick fresh salad!",
    "Space botany: Plants on Mars give us fresh food AND help clean the habitat's air!",
    "Check the irrigation lines carefully—water is our most precious resource on Mars!"
  ],
  'earth-delay': [
    "The water recycler is stopped! Ask Earth for help and test the pump parts!",
    "Radio delay: Mars is so far away that radio signals take up to 20 minutes to reach Earth!",
    "Smart thinking: Save water mode buys you extra time while waiting for Earth's message!"
  ],
  'lunar-sunlight': [
    "Welcome to the Moon! Tow the solar cart to the high ridge to power Horizon Base!",
    "Moon fact: The Moon has deep shadows at the South Pole, but mountain peaks stay sunny!",
    "Hitch the solar cart and pull it to the highest ridge to catch the sunlight!"
  ],
  'lunar-dust': [
    "Moon dust is sharp like tiny glass shards! Clean your space suit before entering!",
    "Air purification: Use the EDS electrostatic plates to zap dust off your equipment!",
    "Keep the habitat clean so Moon dust never gets into our breathing air filters!"
  ],
  'lunar-relay': [
    "A tall crater hill blocks our signal! Drive the lunar rover and set up a radio relay!",
    "Line-of-sight challenge: Radio waves travel in straight lines and can't bend over hills!",
    "Drive to the crest, aim the dish at Horizon base, and drill a core sample!"
  ],
  extended: [
    "Ready to take command? The crews around Meridian Basin need your help.",
    "Take the rover between bases, then step outside to work with the crew."
  ],
  done: [
    "All missions completed! You are an official Junior Astronaut Commander!",
    "Feel free to replay any mission from the Mission Map or try the Mini Games!"
  ]
};

let pipTimer = null;
let currentPipMsgIndex = 0;
let lastPipKey = '';
let currentRawPipMessage = '';

function startPipTypewriter(messageList) {
  if (!messageList || messageList.length === 0) return;
  if (pipTimer) clearTimeout(pipTimer);

  function showNext() {
    const bubble = $('pip-home-bubble');
    if (!bubble) return;

    const msg = messageList[currentPipMsgIndex % messageList.length];
    currentPipMsgIndex++;
    currentRawPipMessage = msg;

    bubble.innerHTML = `Hi, I'm <b>Pip</b>! <span class="pip-text"></span><span class="pip-cursor" aria-hidden="true">|</span>`;
    const textSpan = bubble.querySelector('.pip-text');
    let charIndex = 0;

    function typeChar() {
      if (!textSpan || !bubble.isConnected) return;
      if (charIndex < msg.length) {
        textSpan.textContent += msg.charAt(charIndex);
        charIndex++;
        pipTimer = setTimeout(typeChar, 22);
      } else {
        // Leave message on screen for 5.5 seconds, then type next message
        pipTimer = setTimeout(showNext, 5500);
      }
    }

    typeChar();
  }

  showNext();
}

function stopPipTypewriter() {
  if (pipTimer) clearTimeout(pipTimer);
}

function render(){
  const campaign=state.selectedCampaign,chapters=missionsFor(campaign),complete=storyComplete(state,campaign),next=nextStoryChapter(state,campaign),doneCount=chapters.filter(c=>state.completed.includes(c.id)).length;
  $('journey-count').textContent=`⭐ ${doneCount} / ${chapters.length}`;
  $('journey-count').title=`${doneCount} of ${chapters.length} missions done`;
  if($('mission-progress-bar')) $('mission-progress-bar').style.width=`${chapters.length?Math.round(doneCount/chapters.length*100):0}%`;
  
  const nextChapter=chapters.find(c=>c.id===next);
  $('continue').disabled=campaign==='moon'&&complete;
  if(complete){
    $('continue').textContent=campaign==='mars'?'👑 Be the Base Boss':'🌕 Moon missions done!';
    $('continue').title=$('continue').textContent;
  } else if(nextChapter){
    const num = Number(nextChapter.number) ? `Mission ${Number(nextChapter.number)}` : 'Mission';
    $('continue').textContent=`🚀 Continue · ${num}: ${nextChapter.title}`;
    $('continue').title=`Play ${num}: ${nextChapter.title}`;
  } else if(doneCount){
    $('continue').textContent='▶ Keep going!';
    $('continue').title='Continue your expedition';
  } else if(campaign==='moon'){
    $('continue').textContent='▶ Fly to the Moon';
    $('continue').title='Fly to the Moon';
  } else {
    $('continue').textContent='🚀 Start Adventure';
    $('continue').title='Start your space adventure';
  }

  $('journey-title').innerHTML='MISSION CONTROL<br><span>JUNIOR.</span>';
  $('journey-intro').textContent=campaign==='moon'?'Bonus Moon missions: chase sunlight, fight dust, and send messages from Horizon base.':'Train as a junior astronaut on Mars! Fly in, keep the base safe, drive a rover, and help your crew.';
  
  // Rotating typewriter Pip message
  const pipKey = `${campaign}-${complete ? 'done' : (next || 'orbit')}`;
  if (pipKey !== lastPipKey) {
    lastPipKey = pipKey;
    currentPipMsgIndex = 0;
    const msgList = complete
      ? (campaign === 'mars' ? PIP_MESSAGE_SETS.extended : PIP_MESSAGE_SETS.done)
      : (next && PIP_MESSAGE_SETS[next] ? PIP_MESSAGE_SETS[next] : PIP_MESSAGE_SETS.orbit);
    startPipTypewriter(msgList);
  }

  document.querySelectorAll('[data-campaign]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.campaign===campaign)));
  $('return-active').hidden=!active;
  $('chapters').className='trail-grid';
  $('chapters').replaceChildren();

  for(const chapter of chapters){
    const done=state.completed.includes(chapter.id),record=state.records[chapter.id],card=document.createElement('article');
    const isNext = next === chapter.id;
    card.className=`chapter${done?' done':''}${isNext?' current':''}`;
    const look=CHAPTER_LOOK[chapter.id]||{icon:'🚀',color:'#ff9a5c'};
    card.dataset.chapter=chapter.id;
    card.style.setProperty('--chapter-color',look.color);

    const stepLabel=Number(chapter.number)?`Mission ${Number(chapter.number)}`:'Bonus';
    const statusPill=done?'<span class="chapter-star" aria-label="Done">⭐ Finished</span>':(isNext?'<span class="chapter-next-pill">🚀 Up Next</span>':'<span class="chapter-open-pill">🔓 Open</span>');

    card.innerHTML=`
      <div class="chapter-head">
        <span class="chapter-icon" aria-hidden="true" style="--node-accent: ${look.color}">${look.icon}</span>
        <div class="chapter-meta">
          <span class="chapter-step-badge">${stepLabel}</span>
          <span class="chapter-sol-text">${kidDay(chapter.sol)}</span>
        </div>
        ${statusPill}
      </div>
      <h2>${chapter.title}</h2>
      <p>${chapter.description}</p>
      <button type="button" class="chapter-play-btn ${isNext ? 'primary' : ''}">
        ${done ? '↻ Replay' : isNext ? '▶ Play Up Next!' : '▶ Practice'}
      </button>
      <div class="chapter-status">
        ${done?`${completionStatus(record)}${record?.assisted?' · with help':''}${record?.score!=null?` · ${record.score}/100`:''}`:isNext?'⭐ Recommended next step':'Play any time'}
      </div>
    `;

    const launchChapter=()=>{
      toggleMissionMap(false);
      requestChapter(chapter.id,done);
    };
    const playBtn=card.querySelector('.chapter-play-btn');
    if(playBtn)playBtn.onclick=launchChapter;
    const iconBtn=card.querySelector('.chapter-icon');
    if(iconBtn)iconBtn.onclick=launchChapter;

    $('chapters').append(card);
  }

  // At the end of Mars campaign, add Base Boss as final apex card
  if(campaign==='mars'){
    const bossCard=document.createElement('article');
    bossCard.className='chapter boss-card';
    bossCard.innerHTML=`
      <div class="chapter-head">
        <button type="button" class="chapter-icon boss-icon" aria-label="Play Be the Base Boss">👑</button>
        <div class="chapter-meta">
          <span class="chapter-step-badge" style="color:var(--kid-yellow)">MARS EXPEDITION</span>
        </div>
        <span class="chapter-star" style="background:var(--kid-yellow); color:#2b1d00">👑 Apex</span>
      </div>
      <h2>Be the Base Boss</h2>
      <p>Drive the rover, work outside in your spacesuit, and help the bases keep their water, food, and radio links running.</p>
      <button type="button" class="boss-btn primary">Start expedition ▶</button>
    `;
    const launchBoss=()=>{
      toggleMissionMap(false);
      requestChapter('extended');
    };
    bossCard.querySelector('.boss-btn').onclick=launchBoss;
    bossCard.querySelector('.boss-icon').onclick=launchBoss;
    $('chapters').append(bossCard);
  }

  requestAnimationFrame(()=>{
    if($('mission-map') && !$('mission-map').hidden){
      scrollToActiveMission();
    }
  });
}

function scrollToActiveMission({ smooth = false } = {}){
  const scrollEl=document.querySelector('.mission-map-scroll');
  const container=$('chapters');
  if(!scrollEl || !container)return;

  const currentTarget=container.querySelector('.chapter.current');
  if(!currentTarget || currentTarget === container.firstElementChild) {
    scrollEl.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'instant'
    });
  } else {
    currentTarget.scrollIntoView({
      block: 'center',
      inline: 'nearest',
      behavior: smooth ? 'smooth' : 'instant'
    });
  }
}

const CHAPTER_LOOK={orbit:{icon:'🛰️',color:'#4cc9ff'},storm:{icon:'🌪️',color:'#ff8a3d'},rover:{icon:'🚙',color:'#ff5d73'},'solar-shelter':{icon:'☀️',color:'#ffd23f'},greenhouse:{icon:'🌱',color:'#3ee6b5'},'earth-delay':{icon:'📡',color:'#a78bfa'},'lunar-sunlight':{icon:'🔆',color:'#ffd23f'},'lunar-dust':{icon:'🧹',color:'#c4b5fd'},'lunar-relay':{icon:'📶',color:'#4cc9ff'}};
const kidDay=sol=>/LUNAR/i.test(sol)?'Moon base':sol.replace(/^SOLS?/i,'Day');
function clearPresentation(){document.body.classList.remove('minimal-hud','photo-mode');}
const chapterPath=(id,sampler=false)=>journeyUrl(location.href,id,{sampler}).href;

function toggleMissionMap(open,{syncPath=false}={}){
  const map=$('mission-map');
  if(!map)return;
  const show=open!=null?Boolean(open):map.hidden;
  map.hidden=!show;
  if(syncPath){
    const next=show?new URL('./mission-map',location.href).href:journeyUrl(location.href).href;
    if(location.href!==next)history.pushState(null,'',next);
  }
  document.body.classList.toggle('map-open',show);
  const mapContent=$('header-map-content');
  if(mapContent)mapContent.hidden=!show;
  const defaultContent=$('header-default-content');
  if(defaultContent)defaultContent.hidden=show;
  const jBtn=$('journey-button');
  if(jBtn && $('journey') && !$('journey').hidden){
    jBtn.textContent=show?'✕ Close':'🗺️ Mission Map';
  }
  if(show){
    requestAnimationFrame(()=>{
      scrollToActiveMission({ smooth: false });
    });
    setTimeout(()=>{
      scrollToActiveMission({ smooth: false });
    }, 60);
  }
}

function launch(id,{updatePath=true,sampler=false}={}){
  const chapter=chapterById(id);
  if(!chapter?.available)return;
  if(id==='extended'){
    const url=chapterPath(id);
    if(updatePath)location.assign(url);
    else location.replace(url);
    return;
  }
  stopHomeScene();
  stopPipTypewriter();
  $('home-scene').hidden=true;
  clearPresentation();
  pending=null;active=id;activeSampler=sampler;state.current=id;
  if(['mars','moon'].includes(chapter.campaign)){
    state.selectedCampaign=chapter.campaign;
    state.campaigns[chapter.campaign].current=id;
  }
  persist();
  toggleMissionMap(false);
  if($('settings-dialog'))$('settings-dialog').hidden=true;
  $('transition').hidden=true;$('sampler').hidden=true;$('journey').hidden=true;$('loading-scene').hidden=false;
  frame.hidden=false;frame.inert=false;
  frame.src=`./${chapter.file}?embedded=1${sampler?'&sampler=1':''}`;
  $('active-chapter').textContent=`${chapter.number} / ${chapter.title.toUpperCase()}`;
  const nextPath=chapterPath(id,sampler);
  if(updatePath&&location.href!==nextPath)history.pushState(null,'',nextPath);
  render();
}

function menu({updatePath=true}={}){
  clearPresentation();hold(true);document.exitPointerLock?.();
  toggleMissionMap(false);
  if($('settings-dialog'))$('settings-dialog').hidden=true;
  $('transition').hidden=true;$('journey').hidden=false;$('home-scene').hidden=false;frame.hidden=true;
  if(updatePath)history.pushState(null,'',journeyUrl(location.href).href);
  render();startHomeScene();$('continue').focus();
}

function resume(){
  if(!active)return;
  toggleMissionMap(false);
  if($('settings-dialog'))$('settings-dialog').hidden=true;
  $('journey').hidden=true;$('transition').hidden=true;frame.hidden=false;hold(false);frame.focus();
}

const transitions={storm:{tag:'DAY 12 · AT THE BASE',title:'The base needs you!',copy:'Jin landed at Meridian base. The next day, the radio you fixed brings bad news: a big dust storm is coming! Get the power ready and keep the crew safe.'},rover:{tag:'DAY 16 · ROVER TIME',title:'Time to explore!',copy:'The storm is over! Now Jin drives the rover and Amara does the science. Take photos of the rocks, then bring everyone home.'}};

function requestChapter(id,replay=false){
  if(!chapterById(id))return;
  if(id==='extended'){launch(id);return;}
  if(active===id){
    if(replay)launch(id);else resume();
    return;
  }
  let info=active&&transitions[id];
  if(!info){launch(id);return;}
  if(id==='rover'){
    const outcome=state.records.storm?.carry?.stormOutcome;
    if(outcome==='evacuated')info={...info,title:'The base is being fixed.',copy:'The crew left the base to stay safe. Now it is being fixed. The rover battery is not full, so keep extra for the trip home.'};
    else if(outcome==='survived')info={...info,title:'Everyone is safe, but power is low.',copy:'The base got through the storm, just barely. The rover battery is not full. Luca says: turn back if the home battery drops below 24%.'};
  }
  clearPresentation();pending=id;hold(true);
  stopPipTypewriter();
  toggleMissionMap(false);
  if($('settings-dialog'))$('settings-dialog').hidden=true;
  $('journey').hidden=true;
  $('transition-tag').textContent=info.tag;
  $('transition-title').textContent=info.title;
  $('transition-copy').textContent=info.copy;
  $('transition-begin').textContent=`▶ Go! · ${chapterById(id).title}`;
  $('transition').hidden=false;
  $('transition-begin').focus();
}

$('sampler-start').onclick=()=>{ $('sampler').hidden=false; $('sampler-close').focus(); };
$('sampler-close').onclick=()=>{ $('sampler').hidden=true; $('sampler-start').focus(); };
if($('sampler-close-top')) $('sampler-close-top').onclick=()=>{ $('sampler').hidden=true; $('sampler-start').focus(); };
document.querySelectorAll('[data-sample]').forEach(button=>button.onclick=()=>launch(button.dataset.sample,{sampler:true}));

$('open-map')?.addEventListener('click',()=>toggleMissionMap(true,{syncPath:true}));
$('header-map-back')?.addEventListener('click',()=>toggleMissionMap(false,{syncPath:true}));
$('map-close-btn')?.addEventListener('click',()=>toggleMissionMap(false,{syncPath:true}));

$('journey-button').onclick=()=>{
  if(!$('journey').hidden && active){
    resume();
  } else if(!$('journey').hidden){
    toggleMissionMap(undefined,{syncPath:true});
  } else {
    menu();
  }
};

$('settings-toggle')?.addEventListener('click',()=>{
  const dlg=$('settings-dialog');
  if(dlg){
    dlg.hidden=false;
    $('settings-close-btn')?.focus();
  }
});
$('settings-close-btn')?.addEventListener('click',()=>{
  if($('settings-dialog')) $('settings-dialog').hidden=true;
});
$('settings-dialog')?.addEventListener('click',e=>{
  if(e.target===$('settings-dialog')) $('settings-dialog').hidden=true;
});

const BADGES = [
  {id: 'orbit', icon: '🛸', title: 'Asteria Docking', desc: 'Docked with the Mars orbital station.'},
  {id: 'storm', icon: '🌪️', title: 'Storm Survivor', desc: 'Saved Meridian Base and crew from the dust storm.'},
  {id: 'rover', icon: '🚙', title: 'Rover Navigator', desc: 'Explored Jezero Crater and photographed rock layers.'},
  {id: 'solar-shelter', icon: '🛡️', title: 'Radiation Shield', desc: 'Built a water-wall refuge for solar storm safety.'},
  {id: 'greenhouse', icon: '🥗', title: 'Space Botanist', desc: 'Grew and harvested fresh crops on Mars.'},
  {id: 'earth-delay', icon: '📡', title: 'Deep Space Comms', desc: 'Fixed life support across the light-time delay.'},
  {id: 'lunar-sunlight', icon: '☀️', title: 'Sun Chaser', desc: 'Raised the high-ridge solar mast on the Moon.'},
  {id: 'lunar-dust', icon: '🧹', title: 'Dust Buster', desc: 'Protected Horizon Base from abrasive lunar dust.'},
  {id: 'lunar-relay', icon: '📻', title: 'Crater Relay', desc: 'Overcame terrain blockage with radio relay.'},
  {id: 'extended', icon: '👑', title: 'Base Commander', desc: 'Completed the Meridian Basin expedition.'}
];

function toggleBadges(open) {
  const dialog = $('badges-dialog');
  if (!dialog) return;
  const show = open ?? dialog.hidden;
  dialog.hidden = !show;
  if (show) {
    renderBadges();
    $('badges-close-btn')?.focus();
  }
}

function renderBadges() {
  const container = $('badges-grid');
  if (!container) return;
  const completed = state.completed || [];
  const earnedCount = BADGES.filter(b => completed.includes(b.id)).length;
  $('badges-summary').textContent = `You earned ${earnedCount} of ${BADGES.length} Junior Astronaut Expedition badges!`;
  container.innerHTML = BADGES.map(b => {
    const earned = completed.includes(b.id);
    const record = state.records?.[b.id];
    return `<div class="badge-item ${earned ? 'earned' : 'locked'}">
      <div class="badge-icon" aria-hidden="true">${earned ? b.icon : '🔒'}</div>
      <div class="badge-info">
        <h4>${b.title}</h4>
        <p>${earned ? b.desc : 'Complete this mission to unlock!'}</p>
        <span class="badge-status">${earned ? (record?.mastered ? '🏆 Mastered' : '⭐ Earned') : '🔒 Incomplete'}</span>
      </div>
    </div>`;
  }).join('');
}

$('badges-btn')?.addEventListener('click', () => toggleBadges(true));
$('badges-close-btn')?.addEventListener('click', () => toggleBadges(false));
$('badges-dialog')?.addEventListener('click', e => {
  if (e.target === $('badges-dialog')) toggleBadges(false);
});
if ($('journey-count')) {
  $('journey-count').addEventListener('click', () => toggleBadges(true));
  $('journey-count').style.cursor = 'pointer';
}

window.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if($('settings-dialog')&&!$('settings-dialog').hidden)$('settings-dialog').hidden=true;
    if($('mission-map')&&!$('mission-map').hidden)toggleMissionMap(false,{syncPath:true});
    if($('sampler')&&!$('sampler').hidden)$('sampler').hidden=true;
    if($('badges-dialog')&&!$('badges-dialog').hidden)toggleBadges(false);
  }
});

$('return-active').onclick=resume;
$('continue').onclick=()=>{
  const next=nextStoryChapter(state,state.selectedCampaign);
  if(next)requestChapter(next);
};
if($('quick-mission')) $('quick-mission').onclick=()=>requestChapter('storm');
$('extended-start').onclick=()=>requestChapter('extended');
$('transition-begin').onclick=()=>launch(pending);
$('transition-back').onclick=resume;

const pipSpeakBtn=$('pip-speak');
if(pipSpeakBtn){
  pipSpeakBtn.onclick=e=>{
    e.stopPropagation();
    if('speechSynthesis' in window){
      window.speechSynthesis.cancel();
      const speakText = currentRawPipMessage ? `Hi, I'm Pip! ${currentRawPipMessage}` : ($('pip-home-bubble')?.textContent || '');
      const clean = speakText.replace(/[\u{1F300}-\u{1F6FF}]/gu, '');
      const utter = new SpeechSynthesisUtterance(clean);
      utter.rate = 0.92;
      utter.pitch = 1.2;
      window.speechSynthesis.speak(utter);
    }
  };
}

const mode=()=>{try{return localStorage.getItem(learningKey)||'simple';}catch{return 'simple';}};
function renderLearningMode(){document.querySelectorAll('[data-learning-mode]').forEach(button=>{button.setAttribute('aria-pressed',String(button.dataset.learningMode===mode()));});}
document.querySelectorAll('[data-learning-mode]').forEach(button=>button.onclick=()=>{try{localStorage.setItem(learningKey,button.dataset.learningMode);}catch{}renderLearningMode();});
renderLearningMode();

function renderDifficulty(){
  const level=difficultyLevel(storage);
  document.querySelectorAll('[data-difficulty]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.difficulty===level)));
}
document.querySelectorAll('[data-difficulty]').forEach(button=>button.onclick=()=>{setDifficultyLevel(button.dataset.difficulty,storage);renderDifficulty();});
renderDifficulty();

function renderGraphics(){
  let value='standard';
  try{value=localStorage.getItem('mission-control-jr.graphics')||value;}catch{}
  document.querySelectorAll('[data-graphics]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.graphics===value)));
}
document.querySelectorAll('[data-graphics]').forEach(button=>button.onclick=()=>{try{localStorage.setItem('mission-control-jr.graphics',button.dataset.graphics);}catch{}renderGraphics();});
renderGraphics();

window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
  const data=event.data;
  if(data?.source==='mission-control-jr-hud'){
    document.body.classList.toggle('minimal-hud',data.mode==='minimal-hud');
    document.body.classList.toggle('photo-mode',data.mode==='photo-mode');
    return;
  }
  if(data?.source!=='mission-control-jr')return;
  if(data.chapter!==active)return;
  if(data.type==='ready'){$('loading-scene').hidden=true;hold(!$('journey').hidden||!$('transition').hidden);}
  if(data.type==='complete'&&!activeSampler){finishChapter(state,active,data.result);persist();render();}
  if(data.type==='next')requestChapter(data.target);
  if(data.type==='menu')menu();
});

function isMissionMapLocation(){
  const url=new URL(location.href);
  return url.pathname.replace(/\/+$/,'').endsWith('/mission-map')||url.searchParams.get('view')==='mission-map';
}
function chapterFromLocation(){return missionFromUrl(location.href,id=>chapterById(id)?.available);}
window.addEventListener('popstate',()=>{
  const id=chapterFromLocation();
  if(id)launch(id,{updatePath:false,sampler:new URL(location.href).searchParams.get('sampler')==='1'});
  else {
    menu({updatePath:false});
    if(isMissionMapLocation())toggleMissionMap(true);
  }
});

document.querySelectorAll('[data-campaign]').forEach(button=>button.onclick=()=>{state.selectedCampaign=button.dataset.campaign;persist();render();});

render();
persist();
const requested=chapterFromLocation();
if(requested)launch(requested,{updatePath:false,sampler:new URL(location.href).searchParams.get('sampler')==='1'});
else {
  startHomeScene();
  if(isMissionMapLocation())toggleMissionMap(true);
}
