import * as THREE from 'three';

/** Let a deliberate double-click on a registered 3D prop use its matching station action. */
export function bindStationPicking(canvas,camera,player,stations,onInteract,{range=1.4}={}){
 const targets=stations.filter(s=>s.model).map(s=>{s.model.userData.stationTargetId=s.id;return s.model;}),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 function pick(event){
  if(!player.enabled||event.button!==0||player.lastDrag>8||!targets.length)return;
  const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
  raycaster.setFromCamera(pointer,camera);
  for(const hit of raycaster.intersectObjects(targets,true)){
   let node=hit.object;while(node&&!node.userData.stationTargetId)node=node.parent;
   const id=node?.userData.stationTargetId,station=stations.find(s=>s.id===id);if(!station)continue;
   if(Math.hypot(player.position.x-station.stand.x,player.position.z-station.stand.z)<=range)onInteract(id);
   return;
  }
 }
 canvas.addEventListener('dblclick',pick);
 return ()=>canvas.removeEventListener('dblclick',pick);
}
