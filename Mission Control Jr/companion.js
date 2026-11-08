// Pip, the helper robot. Pip watches the chapter's #objective text and explains the next step
// in one or two short sentences, with a "why" a 7-9 year old can follow. Pip never plays the
// game for the child: it only explains. A speaker button reads the tip aloud.
import {PIP_TIPS} from './companion-tips.js';

const HIDDEN_KEY='mission-control-jr.pip-hidden.v1';
const store={get(){try{return localStorage.getItem(HIDDEN_KEY)==='1';}catch{return false;}},set(v){try{localStorage.setItem(HIDDEN_KEY,v?'1':'0');}catch{}}};

/** Pick Pip's tip for an objective. Exported for tests. */
export function pipTip(chapter,objective){
 const text=String(objective||'').trim();if(!text)return null;
 const hit=(PIP_TIPS[chapter]||[]).find(([pattern])=>pattern.test(text));
 return {next:text,why:hit?hit[1]:null};
}

const css=`
#pip{position:fixed;left:16px;bottom:96px;z-index:40;display:flex;align-items:flex-end;gap:8px;max-width:min(320px,calc(100vw - 32px));font:500 15px/1.35 system-ui,sans-serif;color:#eef2f5;pointer-events:none}
#pip .pip-face{pointer-events:auto;flex:none;width:52px;height:52px;border-radius:50%;border:2px solid #6fe3c8;background:#172431;display:grid;place-items:center;cursor:pointer;padding:0;box-shadow:0 4px 14px #0008}
#pip .pip-face:focus-visible,#pip button:focus-visible{outline:3px solid #ffc857;outline-offset:2px}
#pip .pip-bubble{pointer-events:auto;background:#0f1923ee;border:1px solid #2b3b4b;border-radius:14px 14px 14px 4px;padding:10px 12px;box-shadow:0 6px 20px #0009}
#pip .pip-name{font-size:12px;letter-spacing:.08em;color:#6fe3c8;font-weight:700;display:flex;justify-content:space-between;align-items:center;gap:8px}
#pip .pip-next{margin:4px 0 0;font-weight:700}
#pip .pip-why{margin:4px 0 0;color:#cfd8df}
#pip .pip-tools{display:flex;gap:6px}
#pip .pip-tools button{background:#172431;border:1px solid #2b3b4b;color:#eef2f5;border-radius:8px;font-size:13px;padding:2px 8px;cursor:pointer}
#pip.pip-hidden .pip-bubble,#pip.pip-resting .pip-bubble{display:none}
#pip.pip-idle,body:has(#opening:not([hidden])) #pip,body:has(#landing:not([hidden])) #pip,body:has(.ui-scrim:not([hidden])) #pip,body:has(#dialog:not([hidden])) #pip{display:none}
body:has(#locations) #pip{left:auto;right:16px;flex-direction:row-reverse}body:has(#locations) #pip .pip-bubble{border-radius:14px 14px 4px 14px}
#pip.pip-pop .pip-face{animation:pip-pop .5s ease}
@keyframes pip-pop{40%{transform:scale(1.15)}}
@media (prefers-reduced-motion:reduce){#pip.pip-pop .pip-face{animation:none}}
@media (max-width:640px){#pip{bottom:76px;font-size:14px}#pip .pip-face{width:44px;height:44px}}
`;
const face=`<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><line x1="20" y1="3" x2="20" y2="9" stroke="#6fe3c8" stroke-width="2"/><circle cx="20" cy="3" r="2.5" fill="#ff9a5c"/><rect x="6" y="9" width="28" height="24" rx="9" fill="#eef2f5"/><circle cx="14.5" cy="20" r="3.4" fill="#0f1923"/><circle cx="25.5" cy="20" r="3.4" fill="#0f1923"/><circle cx="15.5" cy="19" r="1.1" fill="#fff"/><circle cx="26.5" cy="19" r="1.1" fill="#fff"/><path d="M15 26.5q5 4 10 0" stroke="#0f1923" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;

/** The task text Pip should read: the heading if the objective has one, never button labels. */
export function objectiveText(target){
 if(!target)return '';
 const heading=target.querySelector?.('h2,h3');if(heading)return heading.textContent.trim();
 const copy=target.cloneNode(true);copy.querySelectorAll?.('button').forEach(b=>b.remove());return copy.textContent.trim();
}
const REST_AFTER_MS=9000;

/** Start Pip on a chapter page. Returns {say(next,why)} for chapters that want to add a moment. */
export function startPip(chapter,{objective='objective'}={}){
 if(typeof document==='undefined'||document.getElementById('pip'))return {say(){}};
 const style=document.createElement('style');style.textContent=css;document.head.append(style);
 const root=document.createElement('aside');root.id='pip';root.setAttribute('aria-label','Pip the helper robot');
 root.innerHTML=`<button class="pip-face" type="button" aria-label="Show or hide Pip's tip" aria-expanded="true">${face}</button><div class="pip-bubble" role="status" aria-live="polite"><div class="pip-name"><span>PIP · HELPER ROBOT</span><span class="pip-tools"><button type="button" data-read aria-label="Read Pip's tip out loud">🔊 Read</button></span></div><p class="pip-next"></p><p class="pip-why"></p></div>`;
 document.body.append(root);
 const next=root.querySelector('.pip-next'),why=root.querySelector('.pip-why'),toggle=root.querySelector('.pip-face');
 const setHidden=v=>{root.classList.toggle('pip-hidden',v);toggle.setAttribute('aria-expanded',String(!v));store.set(v);};
 setHidden(store.get());
 let restTimer=0;const rest=()=>{clearTimeout(restTimer);root.classList.remove('pip-resting');restTimer=setTimeout(()=>root.classList.add('pip-resting'),REST_AFTER_MS);};
 toggle.onclick=()=>{if(root.classList.contains('pip-resting')&&!root.classList.contains('pip-hidden')){rest();return;}setHidden(!root.classList.contains('pip-hidden'));if(!root.classList.contains('pip-hidden'))rest();};
 root.querySelector('[data-read]').onclick=()=>{try{const s=speechSynthesis;s.cancel();const u=new SpeechSynthesisUtterance(`${next.textContent} ${why.textContent}`);u.rate=.9;u.pitch=1.35;s.speak(u);}catch{}};
 let last='';
 const say=(nextText,whyText)=>{if(!nextText||nextText===last)return;last=nextText;next.textContent=nextText;why.textContent=whyText||'';why.hidden=!whyText;root.classList.remove('pip-pop');void root.offsetWidth;root.classList.add('pip-pop');rest();};
 const watch=()=>{const target=document.getElementById(objective);if(!target)return false;const update=()=>{const text=objectiveText(target);const idle=!text||/^loading/i.test(text);root.classList.toggle('pip-idle',idle);if(idle)return;const tip=pipTip(chapter,text);if(tip)say(`Next: ${tip.next}`,tip.why);};new MutationObserver(update).observe(target,{childList:true,characterData:true,subtree:true});update();return true;};
 if(!watch())addEventListener('DOMContentLoaded',watch,{once:true});
 return {say};
}
