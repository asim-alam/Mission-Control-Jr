// Fictional, authored training terrain. Distances are metres; operational limits are game rules.
export const HOME={x:10,z:10}, RIDGE={x:40,z:-160}, HAZARD={x:32,z:-126,r:11};
export const BOUNDS={minX:-100,maxX:110,minZ:-198,maxZ:40};
export const OUTPOST_SOLIDS=[{minX:-13.7,maxX:-10.3,minZ:11.5,maxZ:14.5},{minX:4.5,maxX:5.5,minZ:6.5,maxZ:7.5},{minX:-4.5,maxX:-3.5,minZ:5.5,maxZ:6.5},{minX:-13.5,maxX:-4.5,minZ:4,maxZ:6.5},{minX:18.7,maxX:23.3,minZ:13.7,maxZ:18.3},{minX:2.3,maxX:3.7,minZ:7.3,maxZ:8.7}];
export const ROUTES={
  direct:{name:'Direct line',note:'Shortest; uncertain pale ground on the final approach.',surface:'Mixed / uncertain',points:[HOME,{x:12,z:-35},{x:25,z:-85},{x:32,z:-126},{x:40,z:-150}]},
  wash:{name:'North wash',note:'Longer; gentle gravel corridor with a firm perimeter approach.',surface:'Mostly firm',points:[HOME,{x:12,z:-16},{x:-34,z:-28},{x:-40,z:-80},{x:-15,z:-116},{x:7,z:-134},{x:40,z:-150}]},
  rim:{name:'Rim track',note:'Rockier slopes; watch clearance, speed, and energy use.',surface:'Rough / slopes',points:[HOME,{x:53,z:-28},{x:75,z:-75},{x:65,z:-112},{x:40,z:-150}]},
};
export const ROCKS=[{x:29,z:-47,r:2.2},{x:58,z:-61,r:2.8},{x:-28,z:-68,r:2.2},{x:85,z:-100,r:3},{x:14,z:-96,r:1.8},{x:56,z:-140,r:2.2},{x:-56,z:-110,r:3},{x:3,z:-64,r:1.6}];
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function heightAt(x,z){
  const fade=Math.min(1,Math.max(0,(-z-15)/28));
  return fade*(.5*Math.sin(x*.055)*Math.sin(z*.045)+.4*Math.cos(z*.075)+5*Math.exp(-((x-87)**2+(z+84)**2)/850));
}
export function slopeAt(x,z){const e=.4;return Math.atan(Math.hypot((heightAt(x+e,z)-heightAt(x-e,z))/(2*e),(heightAt(x,z+e)-heightAt(x,z-e))/(2*e)))*180/Math.PI;}
export function surfaceAt(x,z){
  if(distance({x,z},HAZARD)<HAZARD.r)return 'loose';
  if(x>48&&z< -35&&z> -140)return 'rough';
  return 'firm';
}
export const surfaceCost={firm:.075,rough:.12,loose:.225};
export const speedLimit={firm:12,rough:8,loose:4};
export function routeLength(points){return points.slice(1).reduce((n,p,i)=>n+distance(points[i],p),0);}
export function routeEnergy(points){let cost=0;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],d=distance(a,b),steps=Math.max(1,Math.ceil(d/2));for(let j=0;j<steps;j++){const t=(j+.5)/steps;cost+=d/steps*surfaceCost[surfaceAt(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t)];}}return cost;}
export function safeReturnPoints(position){
  const points=ROUTES.wash.points;let best={distance:Infinity,index:0,point:HOME};
  for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((position.x-a.x)*dx+(position.z-a.z)*dz)/(dx*dx+dz*dz))),point={x:a.x+t*dx,z:a.z+t*dz},d=distance(position,point);if(d<best.distance)best={distance:d,index:i,point};}
  return [position,best.point,...points.slice(0,best.index+1).reverse()].filter((p,i,a)=>i===0||distance(p,a[i-1])>.1);
}
export function returnForecast(position,battery,oxygen,extraSeconds=0,extraCharge=0,eco=false){
  const points=safeReturnPoints(position),metres=routeLength(points),seconds=metres/(eco?2:2.6)+extraSeconds;
  return {metres,seconds,battery:battery-routeEnergy(points)*(eco?.83:1)-seconds*.012-extraCharge,oxygen:oxygen-seconds*.1};
}
