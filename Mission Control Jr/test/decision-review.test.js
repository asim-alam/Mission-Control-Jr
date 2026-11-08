import test from 'node:test';
import assert from 'node:assert/strict';
import {selectDecisionReview} from '../simulation/decision-review.js';

test('final review retains early story decisions and summarizes repetitive work',()=>{
 const history=[{sol:2,type:'event',choice:'Study fungus'}];
 for(let sol=1;sol<=30;sol++)history.push({sol,type:'work',choice:sol%2?'life':'farm'});
 history.push({sol:12,type:'event',choice:'Prepare for storm'},{sol:24,type:'event',choice:'Move water as shielding'});
 const review=selectDecisionReview(history);
 assert.deepEqual(review.entries.filter(e=>e.type==='event').map(e=>e.choice),['Study fungus','Prepare for storm','Move water as shielding']);
 assert.deepEqual(review.entries.filter(e=>e.type==='work').map(e=>e.sol),[26,27,28,29,30]);
 assert.equal(review.summarizedWork,25);
});
