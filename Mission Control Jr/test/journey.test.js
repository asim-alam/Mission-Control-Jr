import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createJourney,completionStatus,finishChapter,nextStoryChapter,storyComplete,readJourney,readMissionCarry,saveJourney,JOURNEY_KEY} from '../journey-state.js';
import {journeyUrl,missionFromUrl} from '../mission-routes.js';
import {missionById,MISSIONS} from '../mission-registry.js';

test('connected expedition advances through arrival, storm and rover and retains chapter results',()=>{
  const state=createJourney();assert.equal(nextStoryChapter(state),'orbit');
  assert.equal(finishChapter(state,'storm',{success:false}),false);assert.deepEqual(state.completed,[]);
  finishChapter(state,'orbit',{assisted:true,outcome:'Arrival qualified'});assert.equal(nextStoryChapter(state),'storm');
  finishChapter(state,'storm',{outcome:'Meridian protected'});assert.equal(nextStoryChapter(state),'rover');
  finishChapter(state,'rover',{score:91,outcome:'success'});assert.equal(storyComplete(state),false);assert.equal(nextStoryChapter(state),'solar-shelter');assert.equal(state.records.rover.score,91);
  finishChapter(state,'rover',{score:94});assert.equal(state.completed.length,3);assert.equal(state.records.rover.score,94);
  for(const id of ['solar-shelter','greenhouse','earth-delay'])finishChapter(state,id,{outcome:'complete'});assert.equal(storyComplete(state),true);assert.equal(nextStoryChapter(state),'extended');
  assert.equal(nextStoryChapter(state,'moon'),'lunar-sunlight');finishChapter(state,'lunar-sunlight',{outcome:'complete'});assert.equal(nextStoryChapter(state,'moon'),'lunar-dust');assert.equal(storyComplete(state,'moon'),false);
});
test('mission links preserve a static subdirectory and recognize old direct routes',()=>{
 const url=journeyUrl('https://example.org/mission-control/index.html','lunar-dust');assert.equal(url.href,'https://example.org/mission-control/lunar-dust');
 assert.equal(missionFromUrl(url.href,missionById),'lunar-dust');assert.equal(missionFromUrl('https://example.org/mission-control/storm',missionById),'storm');assert.equal(missionFromUrl('https://example.org/mission-control/base-boss',missionById),'extended');assert.equal(missionFromUrl('https://example.org/mission-control/index.html#strom',missionById),'storm');
 for(const mission of MISSIONS){assert.equal(missionFromUrl(`https://example.org/mission-control/${mission.id}`,missionById),mission.id);assert.ok(Array.isArray(mission.prerequisites));assert.ok(Array.isArray(mission.learningTags));assert.ok(Array.isArray(mission.sourceIds));assert.ok(mission.assetBundle);}
});
test('chapter practice never marks earlier chapters complete and progress survives storage round trip',()=>{
  const state=createJourney();state.current='rover';finishChapter(state,'rover',{score:85});assert.equal(nextStoryChapter(state),'orbit');
  const items=new Map(),storage={setItem:(key,value)=>items.set(key,value),getItem:key=>items.get(key)};assert.equal(saveJourney(state,storage),true);assert.deepEqual(readJourney(storage),state);
  items.set(JOURNEY_KEY,JSON.stringify({version:1,current:'bad',completed:['bad','rover','rover'],records:{rover:{score:999,outcome:'success'}}}));const restored=readJourney(storage);assert.equal(restored.current,'orbit');assert.deepEqual(restored.completed,['rover']);assert.equal(restored.records.rover.score,100);
  items.set(JOURNEY_KEY,'broken');assert.deepEqual(readJourney(storage),createJourney());assert.equal(saveJourney(state,undefined),false);assert.deepEqual(readJourney(undefined),createJourney());
});
test('storm and traverse carry-over notes survive progress saves without changing outcome ids',()=>{
  const state=createJourney();finishChapter(state,'storm',{outcome:'survived',carry:{stormOutcome:'survived',allocation:'research',cleanedCollectors:2}});finishChapter(state,'rover',{outcome:'success',score:82,carry:{mission2Outcome:'success',scienceComplete:true}});
  const items=new Map(),storage={setItem:(key,value)=>items.set(key,value),getItem:key=>items.get(key)};saveJourney(state,storage);const restored=readJourney(storage);
  assert.equal(restored.records.storm.carry.stormOutcome,'survived');assert.equal(restored.records.rover.carry.mission2Outcome,'success');
  assert.equal(restored.records.storm.outcome,'survived');assert.equal(restored.records.rover.outcome,'success');
  assert.deepEqual(readMissionCarry(storage),{stormOutcome:'survived',successfulTraverse:true});
});
test('v1 saves migrate without losing extended carry; suspended attempts do not grant completion',()=>{
  const items=new Map(),storage={setItem:(key,value)=>items.set(key,value),getItem:key=>items.get(key)};
  const carry=Object.fromEntries(Array.from({length:18},(_,i)=>[`fact${i}`,i]));
  items.set(JOURNEY_KEY,JSON.stringify({version:1,current:'storm',completed:['storm'],records:{storm:{outcome:'survived',carry}}}));
  const state=readJourney(storage);assert.equal(state.version,2);assert.equal(state.records.storm.carry.fact17,17);
  finishChapter(state,'rover',{attemptCompleted:false,success:false,outcome:'suspended'});assert.equal(state.completed.includes('rover'),false);assert.equal(state.attempts.rover[0].completed,false);assert.equal(state.attempts.rover[0].mastered,false);
  assert.equal(finishChapter(state,'rover',{attemptCompleted:true,success:false,mastered:false,outcome:'safe-limited'}),false);assert.equal(state.completed.includes('rover'),true);assert.equal(state.attempts.rover[1].completed,true);assert.equal(state.attempts.rover[1].success,false);assert.equal(state.attempts.rover[1].mastered,false);assert.equal(state.records.rover.mastered,false);
  finishChapter(state,'rover',{success:true,mastered:true,outcome:'success'});finishChapter(state,'rover',{success:true,mastered:false,outcome:'abort'});
  assert.equal(state.records.rover.outcome,'success');saveJourney(state,storage);assert.deepEqual(readJourney(storage),state);
});
test('chapter cards distinguish goal completion from a safe stop and replay option',()=>{
 assert.equal(completionStatus({success:true,mastered:true}),'🏆 Super job!');
 assert.equal(completionStatus({success:true,mastered:false}),'✓ Done! Try another plan?');
 assert.equal(completionStatus({success:false,mastered:false}),'Stopped safely · try again!');
});
test('every orbital briefing subtitle has a bundled Vorbis voice clip',()=>{
  const lines=JSON.parse(readFileSync(new URL('../dialogue-lines-orbit.json',import.meta.url)));assert.equal(Object.keys(lines).length,7);
  for(const [id,line]of Object.entries(lines)){assert.ok(line.text.length>30);assert.equal(line.speaker,'Elena Reyes · Commander');const audio=readFileSync(new URL(`../assets/audio-orbit/${id}.ogg`,import.meta.url));assert.equal(audio.subarray(0,4).toString(),'OggS');assert.ok(audio.length>20000,id);}
});

test('mission map directly presents scrollable mission cards for both campaigns without diagram map or switcher',()=>{
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const js = readFileSync(new URL('../journey.js', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../kid-theme.css', import.meta.url), 'utf8');

  // DOM markup check: diagram map and switcher tabs are removed
  assert.ok(!html.includes('id="tab-place-map"'));
  assert.ok(!html.includes('id="tab-card-list"'));
  assert.ok(!html.includes('id="expedition-place-map"'));
  assert.ok(!html.includes('id="place-map-viewport"'));
  assert.ok(!html.includes('id="place-inspector-card"'));

  // Clean mission map scroller & chapters container exist
  assert.ok(html.includes('id="mission-map"'));
  assert.ok(html.includes('class="mission-map-scroll native-scroll"'));
  assert.ok(html.includes('id="chapters"'));

  // Logic check in journey.js: diagram generators removed
  assert.ok(!js.includes('renderPlaceMap'));
  assert.ok(!js.includes('generateMarsMapSvg'));
  assert.ok(!js.includes('generateMoonMapSvg'));
  assert.ok(!js.includes('renderInspector'));
  assert.ok(!js.includes('setMapView'));
  assert.ok(js.includes('toggleMissionMap'));
  assert.ok(js.includes('scrollToActiveMission'));

  // Styles check: switcher and diagram styles removed, scroller retained
  assert.ok(!css.includes('.map-view-switcher'));
  assert.ok(!css.includes('.expedition-place-map'));
  assert.ok(!css.includes('.place-inspector-card'));
  assert.ok(!css.includes('.game-place-map-svg'));
  assert.ok(css.includes('.mission-map-scroll'));
});

test('teacher view lesson with voice is available after ending all Mars and Moon missions', async () => {
  const {allMissionsComplete, ALL_EXPEDITION_MISSION_IDS} = await import('../journey-state.js');
  const {pipLessons} = await import('../professor-pip-lessons.js');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const js = readFileSync(new URL('../journey.js', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../kid-theme.css', import.meta.url), 'utf8');

  // Verify all 9 missions across Mars and Moon are tracked
  assert.equal(ALL_EXPEDITION_MISSION_IDS.length, 9);
  assert.deepEqual(ALL_EXPEDITION_MISSION_IDS, [
    'orbit', 'storm', 'rover', 'solar-shelter', 'greenhouse', 'earth-delay',
    'lunar-sunlight', 'lunar-dust', 'lunar-relay'
  ]);

  // allMissionsComplete logic
  const incompleteState = {completed: ['orbit', 'storm', 'rover']};
  assert.equal(allMissionsComplete(incompleteState), false);
  const completeMarsOnly = {completed: ['orbit', 'storm', 'rover', 'solar-shelter', 'greenhouse', 'earth-delay']};
  assert.equal(allMissionsComplete(completeMarsOnly), false);
  const allState = {completed: [...ALL_EXPEDITION_MISSION_IDS]};
  assert.equal(allMissionsComplete(allState), true);

  // Lesson deck content verification
  const lesson = pipLessons['all-missions'];
  assert.ok(lesson, 'all-missions lesson deck must exist');
  assert.ok(lesson.slides.length >= 10, 'Deck covers all missions plus intro and finale');
  for (const s of lesson.slides) {
    assert.ok(s.title && s.summary, 'Every slide must have title and summary');
  }

  // UI markup in index.html
  assert.ok(html.includes('id="header-teacher-lesson"'));
  assert.ok(html.includes('id="all-missions-grad-banner"'));
  assert.ok(html.includes('id="settings-teacher-lesson-btn"'));

  // Logic in journey.js
  assert.ok(js.includes('showAllMissionsTeacherLesson'));
  assert.ok(js.includes('allMissionsComplete'));
  assert.ok(js.includes('all-missions'));

  // CSS in kid-theme.css
  assert.ok(css.includes('.all-missions-graduation-banner'));
  assert.ok(css.includes('.header-grad-btn'));
  assert.ok(css.includes('.settings-teacher-btn'));
});
