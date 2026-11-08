import * as T from 'three';
export async function createOrbitalEnvironment(scene,loader){
  // Planet-facing local orbital frame: Mars remains visible through the observation window.
  const planet=new T.Group();planet.position.set(2250,-650,-350);scene.add(planet);
  const [gltf,map]=await Promise.all([loader.loadAsync(new URL('./assets/models/reference-mars-globe.glb',import.meta.url).href),new T.TextureLoader().loadAsync(new URL('./assets/mars-orbit.webp',import.meta.url).href)]);map.colorSpace=T.SRGBColorSpace;map.flipY=false;
  // Keep Mars visually dominant beside the station in the shared orbital shot.
  const planetDiameter=3600;
  const box=new T.Box3().setFromObject(gltf.scene),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3()),scale=planetDiameter/Math.max(size.x,size.y,size.z);
  gltf.scene.scale.setScalar(scale);gltf.scene.position.copy(center.multiplyScalar(-scale));gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;for(const m of Array.isArray(o.material)?o.material:[o.material]){m.roughness=1;m.metalness=0;}}});planet.add(gltf.scene);
  gltf.scene.traverse(o=>{if(o.isMesh)for(const material of Array.isArray(o.material)?o.material:[o.material]){material.map?.dispose();material.map=map;material.needsUpdate=true;}});
  const limb=new T.Mesh(new T.SphereGeometry(planetDiameter/2*1.0072,64,40),new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.BackSide,uniforms:{tint:{value:new T.Color(0xc69c85)}},vertexShader:'varying vec3 n; varying vec3 v; void main(){ vec4 p=modelViewMatrix*vec4(position,1.); n=normalize(normalMatrix*normal); v=normalize(-p.xyz); gl_Position=projectionMatrix*p; }',fragmentShader:'uniform vec3 tint; varying vec3 n; varying vec3 v; void main(){ float edge=pow(1.-abs(dot(normalize(n),normalize(v))),5.); gl_FragColor=vec4(tint,edge*.24); }'}));planet.add(limb);
  const stars=new Float32Array(1400*3);let seed=2047;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<1400;i++){const a=random()*Math.PI*2,y=random()*2-1,r=Math.sqrt(1-y*y),d=14000+random()*4000;stars.set([Math.cos(a)*r*d,y*d,Math.sin(a)*r*d],i*3);}const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(stars,3));const starfield=new T.Points(geometry,new T.PointsMaterial({color:0xcbd6dc,size:12,sizeAttenuation:true,transparent:true,opacity:.62,depthWrite:false}));scene.add(starfield);
  const sun=new T.DirectionalLight(0xffedd9,3.1);sun.position.set(-70,95,130);scene.add(sun);scene.add(new T.AmbientLight(0x8cabbc,.16));
  const orbitOffset=planet.position.clone().negate();orbitOffset.y+=2.2;
  const orbitalRing=new T.Group();planet.add(orbitalRing);const points=Array.from({length:161},(_,i)=>orbitOffset.clone().applyAxisAngle(new T.Vector3(0,1,0),i/160*Math.PI*2));const line=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0x83bdb6,transparent:true,opacity:.13}));orbitalRing.add(line);
  return {planet,orbitalRing,orbitOffset,radius:planetDiameter/2,overviewTarget:planet.position.clone().multiplyScalar(.6),update(dt){gltf.scene.rotation.y+=dt*.004;starfield.rotation.y+=dt*.001;},setOverview(value){orbitalRing.visible=value;},credits:'Mars — Akshat · CC BY 4.0 · supplied by the player'};
}
