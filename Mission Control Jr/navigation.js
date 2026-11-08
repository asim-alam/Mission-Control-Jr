export function isBlocked(x,z,obstacles,padding=.32) {
  return obstacles.some(o=>x>o.minX-padding&&x<o.maxX+padding&&z>o.minZ-padding&&z<o.maxZ+padding);
}
export function planRoute(start,end,obstacles,bounds={minX:-18,maxX:18,minZ:-18,maxZ:18}) {
  const step=.5,key=(x,z)=>`${x},${z}`;
  const a=[Math.round(start.x/step),Math.round(start.z/step)],b=[Math.round(end.x/step),Math.round(end.z/step)];
  const open=[{x:a[0],z:a[1],g:0,f:0}],cost=new Map([[key(...a),0]]),parents=new Map();
  const valid=(x,z)=>x*step>=bounds.minX&&x*step<=bounds.maxX&&z*step>=bounds.minZ&&z*step<=bounds.maxZ&&!isBlocked(x*step,z*step,obstacles);
  if(!valid(...b))return [];
  let found=null;
  for(let iteration=0;open.length&&iteration<7000;iteration++) {
    open.sort((a,b)=>b.f-a.f);const current=open.pop();
    if(current.g!==cost.get(key(current.x,current.z)))continue;
    if(current.x===b[0]&&current.z===b[1]){found=current;break;}
    for(const [dx,dz]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]) {
      const x=current.x+dx,z=current.z+dz;
      if(!valid(x,z)||(dx&&dz&&(!valid(current.x+dx,current.z)||!valid(current.x,current.z+dz))))continue;
      const g=current.g+Math.hypot(dx,dz),k=key(x,z);
      if(g>=(cost.get(k)??Infinity))continue;
      cost.set(k,g);parents.set(k,key(current.x,current.z));
      open.push({x,z,g,f:g+Math.hypot(x-b[0],z-b[1])});
    }
  }
  if(!found)return [];
  const result=[];let current=key(found.x,found.z),origin=key(...a);
  while(current!==origin){const [x,z]=current.split(',').map(Number);result.unshift({x:x*step,z:z*step});current=parents.get(current);if(!current)return [];}
  result.push({x:end.x,z:end.z});return result;
}
