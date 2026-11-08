import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {bindStationPicking} from '../simulation/picking.js';

function rig(){
 const handlers={},canvas={addEventListener:(name,fn)=>handlers[name]=fn,removeEventListener:name=>delete handlers[name],getBoundingClientRect:()=>({left:0,top:0,width:100,height:100})};
 const camera=new THREE.PerspectiveCamera(60,1,.1,20);camera.position.set(0,1,0);camera.lookAt(0,1,-5);camera.updateMatrixWorld();
 const model=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial());model.position.set(0,1,-5);model.updateMatrixWorld();
 const player={enabled:true,lastDrag:0,position:new THREE.Vector3(0,0,0)},station={id:'pump',stand:{x:0,z:0},model};let selected=null;
 const dispose=bindStationPicking(canvas,camera,player,[station],id=>selected=id);
 const dblclick=()=>handlers.dblclick({button:0,clientX:50,clientY:50});
 return {canvas,camera,model,player,station,dispose,dblclick,get selected(){return selected;}};
}
test('deliberate pick on a nearby 3D object dispatches its stable station id',()=>{const r=rig();r.dblclick();assert.equal(r.selected,'pump');r.dispose();assert.equal(r.canvas.dblclick,undefined);});
test('picking obeys enabled state, drag suppression, and physical reach',()=>{
 const r=rig();r.player.enabled=false;r.dblclick();assert.equal(r.selected,null);r.player.enabled=true;r.player.lastDrag=30;r.dblclick();assert.equal(r.selected,null);r.player.lastDrag=0;r.player.position.x=20;r.dblclick();assert.equal(r.selected,null);r.dispose();
});
