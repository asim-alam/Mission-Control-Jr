// Check the restored exterior, docking-to-cabin handoff and both save flows.
// Usage: node scripts/verify-arrival-approach.mjs [base URL]
import {openPage} from './cdp.mjs';
import {mkdir} from 'node:fs/promises';
const dir='/tmp/mcj-arrival'; await mkdir(dir,{recursive:true});
const base=process.argv[2] || 'http://127.0.0.1:5182/';
const page=await openPage(new URL('index.html?mission=orbit',base).href,{width:1000,height:700});
const ev = body => page.eval(`const W=document.querySelector('#scene')?.contentWindow; if(!W) return null; return (()=>{with(W){${body}}})();`);
const wait=async expr=>{for(let i=0;i<240;i++){await page.eval(`document.querySelector('#transition:not([hidden]) button.primary')?.click()`);try{if(await ev(`return ${expr}`))return;}catch{}await page.sleep(250);}throw Error('Timeout '+expr);};
try{
 await wait("document.querySelector('#begin') && !document.querySelector('#begin').disabled");
 await page.shot(dir+'/01-opening.png'); console.log('opening ready');
 await ev("document.querySelector('#begin').click();document.querySelector('#action').click()");
 await wait("document.querySelector('#location')?.textContent==='DOCKING'");
 await page.shot(dir+'/02-docking.png');
 // Resume near capture to test assisted docking without waiting for the entire fly-in.
 await ev("const k='mission-control-jr.arrival-approach.v1';const s=JSON.parse(localStorage.getItem(k));s.dock={x:.1,y:.1,distance:2.1,speed:0,bumps:0};addEventListener('pagehide',()=>localStorage.setItem(k,JSON.stringify(s)),{once:true});location.reload()"); await wait("document.querySelector('#resume') && !document.querySelector('#resume').hidden");
 await ev("document.querySelector('#resume').click()"); await wait("document.querySelector('#location')?.textContent==='DOCKING'"); console.log('docking reload resumed');
 await ev("document.querySelector('#assist').click()");
 await wait("document.querySelector('#action') && !document.querySelector('#action').disabled");
 await ev("document.querySelector('#action').click()");
 await wait("!!window.__mission"); console.log('cabin loaded');
 await page.shot(dir+'/03-cabin-brief.png');
 await ev("document.querySelector('#dialog-actions button.primary').click()");
 await wait("window.__mission?.state.phase==='active'");
 await ev("__mission.ctx.persist(__mission.state,true);location.reload()");
 await wait("!!window.__mission && document.querySelector('#dialog-title')?.textContent==='Welcome back!'");
 console.log('cabin reload:',await ev("return {phase:__mission.state.phase,title:document.querySelector('#dialog-title').textContent}"));
 await ev("document.querySelector('#dialog-actions button.primary').click()");
 await page.shot(dir+'/04-cabin.png');
 await ev("__mission.ctx.restart()");
 await wait("document.querySelector('#begin') && !document.querySelector('#begin').disabled"); console.log('replay returns to opening');
 const errors=page.logs.filter(l=>l.startsWith('[exception]')||l.startsWith('[error]'));
 if(errors.length)throw Error(errors.join('\n'));
 console.log('No browser errors. Screenshots: '+dir);
}finally{await page.close();}
