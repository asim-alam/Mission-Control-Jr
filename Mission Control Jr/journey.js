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
async function startHomeScene(){if(matchMedia('(prefers-reduced-motion: reduce)').matches){document.body.classList.add('home-scene-fallback');return;}if(disposeHomeScene||$('journey').hidden)return;const generation=++homeSceneGeneration;try{const {createJourneyScene}=await import('./journey-scene.js');const dispose=await createJourneyScene($('home-scene'));if(generation!==homeSceneGeneration||$('journey').hidden){dispose();return;}disposeHomeScene=dispose;$('home-scene').classList.add('ready');document.body.classList.remove('home-scene-fallback');}catch(error){console.warn('Meridian menu scene unavailable:',error);document.body.classList.add('home-scene-fallback');}}

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
    "You conquered every mission! Ready to take charge as Base Boss for 30 Mars days?",
    "Commander Jin: Balance power, food, water, and crew tasks to keep the base thriving!"
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
  $('mission-progress-bar').style.width=`${chapters.length?Math.round(doneCount/chapters.length*100):0}%`;
  
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
  $('chapters').replaceChildren();

  const wavePositions = [
    'node-pos-center',
    'node-pos-right',
    'node-pos-far-right',
    'node-pos-center',
    'node-pos-left',
    'node-pos-far-left',
  ];
  let index = 0;
  for(const chapter of chapters){
    const done=state.completed.includes(chapter.id),record=state.records[chapter.id],node=document.createElement('article');
    const isNext = next === chapter.id;
    const posClass = wavePositions[index % wavePositions.length];
    node.className=`chapter path-node ${posClass}${done?' done':''}${isNext?' current':''}`;
    const look=CHAPTER_LOOK[chapter.id]||{icon:'🚀',color:'#ff9a5c'};
    node.dataset.chapter=chapter.id;
    node.style.setProperty('--chapter-color',look.color);

    const stepLabel=Number(chapter.number)?`Mission ${Number(chapter.number)}`:'Bonus';
    const statusPill=done?'<span class="chapter-star" aria-label="Done">⭐ Finished</span>':(isNext?'<span class="chapter-next-pill">🚀 Up Next</span>':'<span class="chapter-open-pill">🔓 Open</span>');
    const isStart = index === 0;

    node.innerHTML=`
      <div class="node-waypoint-anchor">
        <div class="node-waypoint-circle" style="--node-accent: ${look.color}">
          <span class="node-icon" aria-hidden="true">${look.icon}</span>
          ${isNext ? '<div class="node-rover-pin" aria-label="You are here"><span class="rover-token">🚙</span><span class="rover-speech">YOU ARE HERE!</span></div>' : ''}
          ${done ? '<span class="node-star-badge" aria-label="Done">⭐</span>' : ''}
        </div>
        <div class="node-step-number">${Number(chapter.number) ? `Level ${Number(chapter.number)}` : 'Bonus'}</div>
        ${isStart ? '<div class="path-start-badge">🚀 MISSION START</div>' : ''}
      </div>

      <div class="node-point-bar">
        <div class="point-info">
          <span class="point-step">${stepLabel}</span>
          <h3 class="point-title">${chapter.title}</h3>
        </div>
        <button type="button" class="point-play-btn ${isNext ? 'primary' : ''}">
          ${done ? '↻ Replay' : isNext ? '▶ Play' : '▶ Play'}
        </button>
      </div>

      <div class="node-content-card" role="tooltip">
        <div class="chapter-head">
          <div class="chapter-meta">
            <span class="chapter-step-badge">${stepLabel}</span>
            <span class="chapter-sol-text">${kidDay(chapter.sol)}</span>
          </div>
          ${statusPill}
        </div>
        <h2>${chapter.title}</h2>
        <p>${chapter.description}</p>
        <div class="node-card-footer"></div>
      </div>
    `;

    const launchChapter=()=>{
      toggleMissionMap(false);
      requestChapter(chapter.id,done);
    };
    const playBtn=node.querySelector('.point-play-btn');
    if(playBtn)playBtn.onclick=launchChapter;
    const waypointCircle=node.querySelector('.node-waypoint-circle');
    if(waypointCircle)waypointCircle.onclick=launchChapter;

    const button=document.createElement('button');
    button.textContent=done?'↻ Replay':isNext?'▶ Play Up Next!':'▶ Practice';
    if(isNext)button.className='primary';
    button.onclick=launchChapter;

    const status=document.createElement('div');
    status.className='chapter-status';
    status.textContent=done?`${completionStatus(record)}${record?.assisted?' · with help':''}${record?.score!=null?` · ${record.score}/100`:''}`:isNext?'⭐ Recommended next step':'Play any time';
    
    node.querySelector('.node-card-footer').append(button,status);
    $('chapters').append(node);
    index++;
  }

  // At the end of Mars campaign, add Base Boss as final apex node on the path!
  if(campaign==='mars'){
    const bossNode=document.createElement('article');
    bossNode.className='chapter path-node path-node-boss node-center';
    bossNode.innerHTML=`
      <div class="node-waypoint-anchor">
        <div class="node-waypoint-circle boss-circle">
          <span class="node-icon" aria-hidden="true">👑</span>
        </div>
        <div class="node-step-number">Final Boss</div>
      </div>

      <div class="node-point-bar boss-point-bar">
        <div class="point-info">
          <span class="point-step" style="color:var(--kid-yellow)">Command Simulation</span>
          <h3 class="point-title">Be the Base Boss</h3>
        </div>
        <button type="button" class="point-play-btn boss-play-btn primary">▶ Run Base</button>
      </div>

      <div class="node-content-card boss-card" role="tooltip">
        <div class="chapter-head">
          <div class="chapter-meta">
            <span class="chapter-step-badge" style="color:var(--kid-yellow)">COMMAND SIMULATION</span>
            <span class="chapter-sol-text">30 MARS DAYS</span>
          </div>
          <span class="chapter-star" style="background:var(--kid-yellow); color:#2b1d00">👑 Apex</span>
        </div>
        <h2>Be the Base Boss</h2>
        <p>Take charge of Meridian Base for a full month! Balance food, solar power, water recycler and jobs.</p>
        <div class="node-card-footer">
          <button type="button" class="boss-btn primary">Run the Base ▶</button>
          <div class="chapter-status" style="color:var(--kid-yellow)">Open for certified Commanders</div>
        </div>
      </div>
    `;
    const launchBoss=()=>{
      toggleMissionMap(false);
      requestChapter('extended');
    };
    bossNode.querySelector('.boss-play-btn').onclick=launchBoss;
    bossNode.querySelector('.boss-btn').onclick=launchBoss;
    const bossCircle=bossNode.querySelector('.boss-circle');
    if(bossCircle)bossCircle.onclick=launchBoss;
    $('chapters').append(bossNode);
  }

  // Append SVG trail and recalculate the curved path
  $('chapters').append(createPathSvg());
  requestAnimationFrame(()=>{
    updatePathCurve();
    if($('mission-map') && !$('mission-map').hidden){
      scrollToActiveMission();
    }
  });
  setTimeout(()=>{
    updatePathCurve();
    if($('mission-map') && !$('mission-map').hidden){
      scrollToActiveMission();
    }
  }, 60);
}

function createPathSvg(){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.id='path-trail-svg';
  svg.setAttribute('class','path-trail-svg');
  svg.setAttribute('aria-hidden','true');
  svg.innerHTML=`
    <defs>
      <linearGradient id="candy-trail-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stop-color="#ff793f" />
        <stop offset="25%" stop-color="#ff9a5c" />
        <stop offset="50%" stop-color="#a78bfa" />
        <stop offset="75%" stop-color="#4cc9ff" />
        <stop offset="100%" stop-color="#ffd23f" />
      </linearGradient>
    </defs>
    <path id="path-trail-shadow" class="path-trail-shadow"></path>
    <path id="path-trail-bed" class="path-trail-bed"></path>
    <path id="path-trail-line" class="path-trail-line"></path>
    <path id="path-trail-dash" class="path-trail-dash"></path>
  `;
  return svg;
}

/**
 * Candy Crush style Catmull-Rom spline converted to cubic Bezier curves.
 * Guarantees smooth, continuous S-curves through all waypoint circle centers.
 */
function catmullRomToBezier(points, tension = 0.75) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  if (points.length === 2) {
    const p0 = points[0], p1 = points[1];
    const dy = (p1.y - p0.y) * 0.5;
    return `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} C ${p0.x.toFixed(1)} ${(p0.y + dy).toFixed(1)}, ${p1.x.toFixed(1)} ${(p1.y - dy).toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : { x: 2 * points[0].x - points[1].x, y: 2 * points[0].y - points[1].y };
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i + 2 < points.length ? points[i + 2] : { x: 2 * points[points.length - 1].x - points[points.length - 2].x, y: 2 * points[points.length - 1].y - points[points.length - 2].y };

    const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function updatePathCurve(){
  const svg=$('path-trail-svg');
  const container=$('chapters');
  if(!svg || !container)return;
  const nodes=Array.from(container.querySelectorAll('.path-node'));
  if(nodes.length<2)return;

  const containerRect=container.getBoundingClientRect();
  if(!containerRect.width || !containerRect.height)return;

  svg.setAttribute('viewBox',`0 0 ${containerRect.width} ${containerRect.height}`);
  svg.style.width=`${containerRect.width}px`;
  svg.style.height=`${containerRect.height}px`;

  // Get centers of all waypoint circles in progressive level order (start at bottom -> finish at top)
  const points=nodes.map(node=>{
    const circle=node.querySelector('.node-waypoint-circle');
    if(!circle)return null;
    const r=circle.getBoundingClientRect();
    return {
      x: r.left + r.width / 2 - containerRect.left,
      y: r.top + r.height / 2 - containerRect.top
    };
  }).filter(Boolean);

  if(points.length<2)return;

  const d = catmullRomToBezier(points, 0.75);

  const shadow=$('path-trail-shadow');
  const bed=$('path-trail-bed');
  const line=$('path-trail-line');
  const dash=$('path-trail-dash');
  if(shadow)shadow.setAttribute('d',d);
  if(bed)bed.setAttribute('d',d);
  if(line)line.setAttribute('d',d);
  if(dash)dash.setAttribute('d',d);
}

function scrollToActiveMission({ smooth = false } = {}){
  const scrollEl=document.querySelector('.mission-map-scroll');
  const container=$('chapters');
  if(!scrollEl || !container)return;

  const currentTarget=container.querySelector('.path-node.current');
  const firstTarget=container.querySelector('.path-node[data-chapter="orbit"]') ||
                    container.querySelector('.path-node[data-chapter="lunar-sunlight"]') ||
                    container.firstElementChild;
  const target=currentTarget || firstTarget;
  if(!target)return;

  const isAtStart = !currentTarget ||
                    currentTarget.dataset?.chapter === 'orbit' ||
                    currentTarget.dataset?.chapter === 'lunar-sunlight' ||
                    currentTarget === container.firstElementChild;

  if (isAtStart) {
    scrollEl.scrollTo({
      top: scrollEl.scrollHeight + 5000,
      behavior: smooth ? 'smooth' : 'instant'
    });
  } else {
    target.scrollIntoView({
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

function toggleMissionMap(open){
  const map=$('mission-map');
  if(!map)return;
  const show=open!=null?Boolean(open):map.hidden;
  map.hidden=!show;
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
      updatePathCurve();
      scrollToActiveMission({ smooth: false });
    });
    setTimeout(()=>{
      updatePathCurve();
      scrollToActiveMission({ smooth: false });
    }, 60);
    setTimeout(()=>{
      updatePathCurve();
    }, 200);
  }
}

window.addEventListener('resize',()=>requestAnimationFrame(updatePathCurve));
if(typeof ResizeObserver!=='undefined'){
  const ro=new ResizeObserver(()=>requestAnimationFrame(updatePathCurve));
  const ch=$('chapters');
  if(ch)ro.observe(ch);
}

function launch(id,{updatePath=true,sampler=false}={}){
  const chapter=chapterById(id);
  if(!chapter?.available)return;
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

const transitions={storm:{tag:'DAY 12 · AT THE BASE',title:'The base needs you!',copy:'Jin landed at Meridian base. The next day, the radio you fixed brings bad news: a big dust storm is coming! Get the power ready and keep the crew safe.'},rover:{tag:'DAY 16 · ROVER TIME',title:'Time to explore!',copy:'The storm is over! Now Jin drives the rover and Amara does the science. Take photos of the rocks, then bring everyone home.'},extended:{tag:'BONUS GAME · 30 DAYS',title:'You are the boss now!',copy:'You learned to fly, get ready and explore. Now run the whole base: give out jobs and watch the food, water and power.'}};

function requestChapter(id,replay=false){
  if(!chapterById(id))return;
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

$('open-map')?.addEventListener('click',()=>toggleMissionMap(true));
$('header-map-back')?.addEventListener('click',()=>toggleMissionMap(false));
$('map-close-btn')?.addEventListener('click',()=>toggleMissionMap(false));

$('journey-button').onclick=()=>{
  if(!$('journey').hidden && active){
    resume();
  } else if(!$('journey').hidden){
    toggleMissionMap();
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

window.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if($('settings-dialog')&&!$('settings-dialog').hidden)$('settings-dialog').hidden=true;
    if($('mission-map')&&!$('mission-map').hidden)toggleMissionMap(false);
    if($('sampler')&&!$('sampler').hidden)$('sampler').hidden=true;
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

function chapterFromLocation(){return missionFromUrl(location.href,id=>chapterById(id)?.available);}
window.addEventListener('popstate',()=>{
  const id=chapterFromLocation();
  if(id)launch(id,{updatePath:false,sampler:new URL(location.href).searchParams.get('sampler')==='1'});
  else menu({updatePath:false});
});

document.querySelectorAll('[data-campaign]').forEach(button=>button.onclick=()=>{state.selectedCampaign=button.dataset.campaign;persist();render();});

render();
persist();
const requested=chapterFromLocation();
if(requested)launch(requested,{updatePath:false,sampler:new URL(location.href).searchParams.get('sampler')==='1'});
else startHomeScene();
