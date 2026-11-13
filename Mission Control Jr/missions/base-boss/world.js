import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {bounds, facilities, ground, routes, sites, segmentDistance} from './region.js';
import {servicePosts} from './eva.js';

const urls = import.meta.glob('../../assets/models/expansion/base-boss-*.glb',
  {query: '?url', import: 'default', eager: true});
const loader = new GLTFLoader();
const asset = name => loader.loadAsync(urls[`../../assets/models/expansion/base-boss-${name}.glb`])
  .then(({scene}) => scene);

function place(scene, object, x, z, rotation = 0) {
  object.position.set(x, ground(x, z), z);
  object.rotation.y = rotation;
  scene.add(object);
  return object;
}

function terrain(texture) {
  // Mars imagery is naturally very red. Shift the regolith toward muted ochre
  // so the landscape reads as dusty sand instead of a saturated red plain.
  const canvas = document.createElement('canvas');
  canvas.width = texture.image.width;
  canvas.height = texture.image.height;
  const context = canvas.getContext('2d');
  context.filter = 'saturate(58%) hue-rotate(16deg)';
  context.drawImage(texture.image, 0, 0);
  texture.dispose();
  const regolith = new THREE.CanvasTexture(canvas);
  regolith.colorSpace = THREE.SRGBColorSpace;
  regolith.wrapS = regolith.wrapT = THREE.RepeatWrapping;
  regolith.repeat.set(46, 40);
  const width = bounds.maxX - bounds.minX;
  const length = bounds.maxZ - bounds.minZ;
  const geom = new THREE.PlaneGeometry(width, length, 180, 148);
  geom.rotateX(-Math.PI / 2);
  geom.translate((bounds.maxX + bounds.minX) / 2, 0, (bounds.maxZ + bounds.minZ) / 2);
  const attr = geom.attributes.position;
  const colors = [];
  const lo = new THREE.Color(0xd4c3a2);
  const hi = new THREE.Color(0xb8ad96);
  for (let i = 0; i < attr.count; i++) {
    const x = attr.getX(i), z = attr.getZ(i);
    const y = ground(x, z);
    attr.setY(i, y);
    const tint = lo.clone().lerp(hi, THREE.MathUtils.clamp(y / 35 + Math.sin(x * .036 + z * .081) * .13, 0, 1));
    colors.push(tint.r, tint.g, tint.b);
  }
  geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geom.computeVertexNormals();
  const mesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({map: regolith, vertexColors: true, roughness: 1, bumpMap: regolith, bumpScale: .075}));
  mesh.receiveShadow = true;
  return mesh;
}

function roadStrip(points, width, height, material, offset = 0) {
  const vertices = [];
  const indices = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const distance = Math.hypot(b.x - a.x, b.z - a.z);
    const count = Math.max(1, Math.ceil(distance / 1.6));
    const dx = (b.x - a.x) / (distance || 1);
    const dz = (b.z - a.z) / (distance || 1);
    for (let j = 0; j <= count; j++) {
      const t = j / count;
      for (const side of [-1, 1]) {
        const edge = offset + side * width / 2;
        const x = THREE.MathUtils.lerp(a.x, b.x, t) - dz * edge;
        const z = THREE.MathUtils.lerp(a.z, b.z, t) + dx * edge;
        vertices.push(x, ground(x, z) + height, z);
      }
      if (j) {
        const v = vertices.length / 3 - 4;
        indices.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

function trackWorld(scene) {
  const track = new THREE.MeshStandardMaterial({color: 0x75644e, transparent: true, opacity: .34, depthWrite: false, side: THREE.DoubleSide});
  const shoulder = new THREE.MeshStandardMaterial({color: 0xa18c6b, transparent: true, opacity: .28, depthWrite: false, side: THREE.DoubleSide});
  for (const route of routes) {
    scene.add(roadStrip(route.points, 6.0, .1, shoulder));
    for (const offset of [-1.25, 1.25]) scene.add(roadStrip(route.points, .64, .12, track, offset));
  }
}

function addBoulders(scene) {
  const stone = new THREE.DodecahedronGeometry(1, 1);
  const rocks = new THREE.InstancedMesh(stone, new THREE.MeshStandardMaterial({color: 0x918674, roughness: 1}), 740);
  const transform = new THREE.Object3D();
  let used = 0;
  for (let i = 0; i < 1300 && used < rocks.count; i++) {
    const x = bounds.minX + 7 + ((i * 131.373) % (bounds.maxX - bounds.minX - 14));
    const z = bounds.minZ + 7 + ((i * 62.736) % (bounds.maxZ - bounds.minZ - 14));
    if (Object.values(sites).some(site => Math.hypot(x - site.x, z - site.z + 5) < 22) ||
      routes.some(route => route.points.slice(1).some((b, j) => segmentDistance(x, z, route.points[j], b) < 6))) continue;
    const size = .09 + (i % 41 / 40) ** 3 * 1.53;
    transform.position.set(x, ground(x, z) + size * .08, z);
    transform.rotation.set(i * .22, i * 2.4, i * .34);
    transform.scale.set(size * 1.19, size * .49, size * .72);
    transform.updateMatrix();
    rocks.setMatrixAt(used, transform.matrix);
    rocks.setColorAt(used++, new THREE.Color().setHSL(.095 + (i % 8) * .006, .15, .42 + i % 6 * .06));
  }
  rocks.count = used;
  rocks.receiveShadow = true;
  scene.add(rocks);
}

function sitePlate(site) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = '#252a2c';
  context.fillRect(0, 0, 512, 128);
  context.fillStyle = site.color;
  context.fillRect(0, 0, 11, 128);
  context.font = '700 27px system-ui';
  context.fillText(site.code, 34, 43);
  context.fillStyle = '#f6efe5';
  context.font = '700 49px system-ui';
  context.fillText(site.name.toUpperCase(), 32, 100);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const group = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 1.08),
    new THREE.MeshBasicMaterial({map: texture}));
  plate.position.y = 1.55;
  group.add(plate);
  const back = new THREE.Mesh(new THREE.BoxGeometry(4.3, 1.08, .06),
    new THREE.MeshStandardMaterial({color: 0x4f4840, roughness: .86}));
  back.position.set(0, 1.55, -.032);
  group.add(back);
  const steel = new THREE.MeshStandardMaterial({color: 0x65625a, roughness: .76});
  for (const x of [-1.65, 1.65]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(.09, 1.37, .1), steel);
    leg.position.set(x, .685, 0);
    group.add(leg);
  }
  return group;
}

function statusLight(model, name, active) {
  const group = model.getObjectByName(name);
  group?.traverse(part => {
    if (!part.isMesh) return;
    if (!part.userData.statusMaterial) {
      part.material = part.material.clone();
      part.userData.statusMaterial = true;
    }
    part.material.color.set(active ? 0x78dda5 : 0xe9a34d);
    part.material.emissive?.set(active ? 0x41b66c : 0x9c561c);
    part.material.emissiveIntensity = .85;
  });
}

export async function buildWorld(canvas) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  const scene = new THREE.Scene();
  const skyColor = new THREE.Color(0xca987c);
  scene.background = skyColor;
  scene.fog = new THREE.FogExp2(skyColor, .0037);
  scene.add(new THREE.HemisphereLight(0xffe5d9, 0x917267, 1.48));
  const sun = new THREE.DirectionalLight(0xffd5a9, 3.2);
  sun.castShadow = true;
  const shadowSize = innerWidth > 780 ? 2048 : 1024;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(sun.shadow.camera, {left: -41, right: 41, top: 41, bottom: -41, near: .4, far: 155});
  sun.shadow.normalBias = .075;
  scene.add(sun, sun.target);

  const sky = new THREE.Mesh(new THREE.SphereGeometry(620, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 dome; void main(){ dome=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `varying vec3 dome;
      void main(){ vec3 horizon=vec3(.83,.634,.513); vec3 high=vec3(.56,.399,.393);
        float mixSky=smoothstep(.0,.67,dome.y);
        gl_FragColor=vec4(mix(horizon,high,mixSky),1.0); }`,
  }));
  sky.renderOrder = -20;
  scene.add(sky);

  const [texture, rover, suit, crate, annex, ...stationModels] = await Promise.all([
    new THREE.TextureLoader().loadAsync(new URL('../../assets/mars-ground.webp', import.meta.url).href),
    loader.loadAsync(new URL('../../assets/models/rover-dynamic.glb', import.meta.url).href).then(({scene}) => scene),
    loader.loadAsync(new URL('../../assets/models/astronaut-animated.glb', import.meta.url).href).catch(error => {
      console.warn('Spacesuit model unavailable:', error);
      return null;
    }),
    asset('valve-crate'), asset('power-annex'),
    ...Object.values(sites).map(site => asset(site.model)),
  ]);
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  scene.add(terrain(texture));
  trackWorld(scene);
  addBoulders(scene);
  const apron = new THREE.MeshStandardMaterial({color: 0xb3a58d, transparent: true, opacity: .42,
    side: THREE.DoubleSide, depthWrite: false});
  const marginLine = new THREE.MeshStandardMaterial({color: 0xc9b993, transparent: true, opacity: .62,
    side: THREE.DoubleSide, depthWrite: false});
  const models = {};
  Object.keys(sites).forEach((id, index) => {
    const site = sites[id];
    const {x, z, heading} = facilities[id];
    models[id] = place(scene, stationModels[index], x, z, heading);
    place(scene, sitePlate(site), site.x + 5.5, site.z - 2.6, Math.atan2(-5.5, 2.6));
    const setback = facilities[id].footprint ? 8.2 : 5.4;
    const approach = [
      {x: site.x + Math.sin(heading) * 3, z: site.z + Math.cos(heading) * 3},
      {x: x + Math.sin(heading) * setback, z: z + Math.cos(heading) * setback},
    ];
    scene.add(roadStrip(approach, 4.4, .12, apron));
    for (const side of [-1, 1]) scene.add(roadStrip(approach, .11, .15, marginLine, side * 2.14));
  });
  place(scene, annex, sites.meridian.x - 19, sites.meridian.z - 17, .3);
  const berm = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10),
    new THREE.MeshStandardMaterial({color: 0x91806b, roughness: 1}));
  berm.scale.set(5.7, 1.55, 2.35);
  place(scene, berm, sites.meridian.x - 17, sites.meridian.z - 11, .38);
  const cachedCargo = crate.clone();
  models.cache.getObjectByName('cache_slot_a').add(cachedCargo);
  const roverFrame = rover.getObjectByName('Meridian_animated_rover') ?? rover;
  const cargoMount = new THREE.Group();
  cargoMount.name = 'cargo_slot_a';
  cargoMount.position.set(-1.58, 1.54, 0);
  roverFrame.add(cargoMount);
  const carriedCargo = crate.clone();
  cargoMount.add(carriedCargo);
  const steerPivots = {};
  for (const [side, wheelName] of [['left', 'wheel_2'], ['right', 'wheel_5']]) {
    const wheel = roverFrame.getObjectByName(wheelName);
    const pivot = new THREE.Group();
    pivot.name = `steer_${side}`;
    pivot.position.copy(wheel.position);
    wheel.position.set(0, 0, 0);
    pivot.add(wheel);
    roverFrame.add(pivot);
    steerPivots[side] = pivot;
  }
  scene.add(rover);
  const astronaut = suit?.scene;
  const mixer = astronaut ? new THREE.AnimationMixer(astronaut) : null;
  const idle = mixer?.clipAction(suit.animations.find(clip => clip.name === 'Idle')).play();
  const walk = mixer?.clipAction(suit.animations.find(clip => clip.name === 'Walk')).setEffectiveTimeScale(1.8);
  let suitAction = idle;
  if (astronaut) {
    astronaut.visible = false;
    scene.add(astronaut);
  }
  scene.traverse(part => {
    if (!part.isMesh || part === sky) return;
    part.castShadow = !part.material.transparent && part.geometry.type !== 'PlaneGeometry' && !part.isInstancedMesh;
    part.receiveShadow = true;
  });

  const marker = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.8, 3.08, 48),
    new THREE.MeshBasicMaterial({color: 0xffcc7e, side: THREE.DoubleSide, transparent: true, opacity: .75}));
  ring.rotation.x = -Math.PI / 2;
  marker.add(ring);
  scene.add(marker);
  const beacon = new THREE.Group();
  const beaconMaterial = new THREE.MeshBasicMaterial({color: 0xffd68f});
  const beaconRing = new THREE.Mesh(new THREE.RingGeometry(.92, 1.03, 32),
    new THREE.MeshBasicMaterial({color: 0xffd68f, side: THREE.DoubleSide}));
  beaconRing.rotation.x = -Math.PI / 2;
  const beaconLight = new THREE.Mesh(new THREE.OctahedronGeometry(.25), beaconMaterial);
  beaconLight.position.y = 2.1;
  beacon.add(beaconRing, beaconLight);
  beacon.visible = false;
  scene.add(beacon);
  const roverRing = new THREE.Mesh(new THREE.RingGeometry(2.45, 2.55, 40),
    new THREE.MeshBasicMaterial({color: 0x9ad9ee, side: THREE.DoubleSide}));
  roverRing.rotation.x = -Math.PI / 2;
  roverRing.visible = false;
  scene.add(roverRing);
  const guided = new THREE.MeshBasicMaterial({color: 0xe9bd81, transparent: true, opacity: .32, depthWrite: false, side: THREE.DoubleSide});
  let trail = null;
  const camera = new THREE.PerspectiveCamera(52, 1, .09, 1200);
  const aim = new THREE.Vector3();
  const target = new THREE.Vector3();
  const desired = new THREE.Vector3();
  let cameraReady = false, roll = 0;
  let outside = false, previousView;
  const wheels = Array.from({length: 6}, (_, i) => roverFrame.getObjectByName(`wheel_${i}`));

  function resize() {
    const {width, height} = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  return {
    canWalk: Boolean(astronaut),
    route(plan, destination) {
      if (trail) {
        scene.remove(trail);
        trail.geometry.dispose();
        trail = null;
      }
      marker.visible = Boolean(destination);
      if (destination) {
        const site = sites[destination];
        marker.position.set(site.x, ground(site.x, site.z) + .1, site.z);
      }
      if (plan?.points.length > 1) {
        trail = roadStrip(plan.points, .85, .27, guided);
        scene.add(trail);
      }
    },
    updateProgress(state) {
      carriedCargo.visible = state.cargo;
      cachedCargo.visible = !state.completed.valve && !(state.active === 'valve' && state.cargo);
      statusLight(models.verdant, 'service_indicator', state.completed.valve);
      statusLight(models.kestrel, 'relay_status', state.completed.relay);
      statusLight(models.pathfinder, 'shelter_status', state.completed.shelter);
    },
    showDrill(run, expedition) {
      const last = run?.history.at(-1);
      statusLight(models.verdant, 'service_indicator', last?.recyclerRan ?? Boolean(expedition.completed.valve));
      models.verdant.getObjectByName('grow_lights').visible = last?.lit ?? true;
    },
    render(state, motion, dt, surveyId, eva, serviceSite, view) {
      const firstPerson = view === 'first' && !surveyId;
      rover.visible = !firstPerson || Boolean(eva);
      const x = state.x, z = state.z, h = state.heading;
      const y = ground(x, z);
      const dx = Math.sin(h), dz = Math.cos(h);
      rover.position.set(x, y, z);
      const terrainPitch = Math.atan2(
        ground(x - dx * 2, z - dz * 2) - ground(x + dx * 2, z + dz * 2), 4);
      rover.rotation.set(THREE.MathUtils.clamp(terrainPitch, -.075, .075), h - Math.PI / 2,
        0, 'YXZ');
      roll += motion.metres * Math.sign(motion.speed) / .49;
      for (const wheel of wheels) wheel.rotation.z = roll;
      steerPivots.left.rotation.y = motion.steer * .34;
      steerPivots.right.rotation.y = motion.steer * .34;
      desired.set(x - dx * 10.5, y + 6.2, z - dz * 10.5);
      desired.y = Math.max(desired.y, ground(desired.x, desired.z) + 2.5);
      target.set(x + dx * 2, y + 2, z + dz * 2);
      if (astronaut) astronaut.visible = Boolean(eva) && !firstPerson;
      if (eva) {
        const height = ground(eva.x, eva.z);
        const forwardX = Math.sin(eva.heading), forwardZ = Math.cos(eva.heading);
        astronaut.position.set(eva.x, height, eva.z);
        astronaut.rotation.y = eva.heading;
        const nextAction = eva.walking ? walk : idle;
        if (nextAction !== suitAction) {
          suitAction.fadeOut(.16);
          nextAction.reset().fadeIn(.16).play();
          suitAction = nextAction;
        }
        mixer.update(dt);
        desired.set(eva.x - forwardX * 5.8 + forwardZ * 1.15, height + 3.05,
          eva.z - forwardZ * 5.8 - forwardX * 1.15);
        desired.y = Math.max(desired.y, ground(desired.x, desired.z) + 1.6);
        target.set(eva.x + forwardX * 1.8, height + 1.45, eva.z + forwardZ * 1.8);
        roverRing.position.set(x, y + .11, z);
      }
      if (firstPerson) {
        if (eva) {
          desired.set(eva.x, ground(eva.x, eva.z) + 1.65, eva.z);
          target.set(eva.x + Math.sin(eva.heading) * 12, desired.y - .5, eva.z + Math.cos(eva.heading) * 12);
        } else {
          desired.set(x + dx * 1.2, y + 2.25, z + dz * 1.2);
          target.set(x + dx * 16, y + 2.05, z + dz * 16);
        }
      }
      roverRing.visible = Boolean(eva);
      beacon.visible = Boolean(eva && serviceSite);
      if (beacon.visible) {
        const post = servicePosts[serviceSite];
        beacon.position.set(post.x, ground(post.x, post.z) + .12, post.z);
      }
      if (surveyId) {
        const base = facilities[surveyId];
        const frontX = Math.sin(base.heading), frontZ = Math.cos(base.heading);
        const distance = base.footprint ? 21.5 : 17;
        const height = ground(base.x, base.z);
        desired.set(base.x + frontX * distance - frontZ * distance * .58, height + 13,
          base.z + frontZ * distance + frontX * distance * .58);
        target.set(base.x - frontX * 2, height + (base.footprint ? 3.3 : 2), base.z - frontZ * 2);
      }
      if (!cameraReady || previousView !== firstPerson || outside !== Boolean(eva) || camera.position.distanceTo(desired) > 35) {
        camera.position.copy(desired);
        aim.copy(target);
        cameraReady = true;
      } else {
        const alpha = 1 - Math.exp(-dt * 6);
        camera.position.lerp(desired, alpha);
        aim.lerp(target, alpha);
      }
      outside = Boolean(eva);
      previousView = firstPerson;
      camera.lookAt(aim);
      const focus = surveyId ? facilities[surveyId] : eva ?? state;
      const lightY = ground(focus.x, focus.z);
      sun.target.position.set(focus.x, lightY, focus.z);
      sun.position.set(focus.x - 42, lightY + 26, focus.z + 37);
      sky.position.copy(camera.position);
      renderer.render(scene, camera);
    },
  };
}
