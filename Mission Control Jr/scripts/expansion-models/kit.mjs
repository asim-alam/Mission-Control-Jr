// Shared modelling kit for the expansion-mission GLBs.
// Every model is built from code so it can be edited and rebuilt with `npm run models:expansion`.
// Naming rules:
//  - Meshes whose name starts with "_" are static detail; finalize() merges them per material.
//  - Any other name is a stable interaction node the game looks up (hinges, valves, slots, states).
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries, mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

const std = (name, color, roughness = .6, metalness = 0, extra = {}) => {
  const m = new THREE.MeshStandardMaterial({color, roughness, metalness, ...extra});
  m.name = name; return m;
};
/** Physically based palette shared by every expansion model. Names are kept so the game can find them. */
export const M = {
  hull: std('hull-white', 0xe8ebe7, .55),
  hullWarm: std('hull-cream', 0xd9d2c2, .7),
  panel: std('panel-grey', 0xb9c0c4, .5, .25),
  alu: std('aluminium', 0xb4bcc2, .32, .85),
  steel: std('dark-steel', 0x59636b, .4, .8),
  dark: std('dark-polymer', 0x262c33, .72),
  rubber: std('rubber', 0x141619, .92),
  orange: std('safety-orange', 0xff7a2f, .5),
  yellow: std('hazard-yellow', 0xffc83a, .5),
  blue: std('nasa-blue', 0x1f4fa8, .45),
  red: std('signal-red', 0xd83a3a, .5),
  green: std('signal-green', 0x3fae62, .5),
  copper: std('copper', 0xc8783e, .35, .9),
  gold: std('foil-gold', 0xd7a73b, .28, .95),
  fabric: std('beta-cloth', 0xf1eee4, .95),
  fabricBlue: std('cargo-bag-blue', 0x6c8fb3, .9),
  poly: std('polyethylene', 0xf3f1ea, .38),
  water: std('water', 0x3aa6dc, .12, 0, {transparent: true, opacity: .72}),
  bladder: std('bladder', 0x8fcbe4, .3, 0, {transparent: true, opacity: .88}),
  glass: std('glass', 0xa9dcff, .05, .1, {transparent: true, opacity: .32}),
  visor: std('visor-gold', 0xc89a32, .12, 1),
  screen: std('screen', 0x0d2230, .3, 0, {emissive: new THREE.Color(0x2fd3c0), emissiveIntensity: .55}),
  screenDark: std('screen-off', 0x0b1218, .25),
  ledGreen: std('led-green', 0x2bff86, .4, 0, {emissive: new THREE.Color(0x2bff86), emissiveIntensity: 1.6}),
  ledRed: std('led-red', 0xff3a3a, .4, 0, {emissive: new THREE.Color(0xff3a3a), emissiveIntensity: 1.6}),
  ledAmber: std('led-amber', 0xffb02e, .4, 0, {emissive: new THREE.Color(0xffb02e), emissiveIntensity: 1.6}),
  lightStrip: std('light-strip', 0xfff4dc, .4, 0, {emissive: new THREE.Color(0xfff1d6), emissiveIntensity: 2.2}),
  growRed: std('grow-led-red', 0xff3f6c, .4, 0, {emissive: new THREE.Color(0xff2a5a), emissiveIntensity: 2}),
  growBlue: std('grow-led-blue', 0x5a6bff, .4, 0, {emissive: new THREE.Color(0x4a5cff), emissiveIntensity: 2}),
  solar: std('solar-cell', 0x1b2d63, .22, .55),
  leaf: std('leaf', 0x4cae4f, .6),
  leafDark: std('leaf-dark', 0x2f7f3b, .65),
  pepper: std('pepper-red', 0xe2382b, .35),
  soil: std('grow-media', 0x5b4433, .95),
  regolith: std('regolith', 0x8d8a85, .97),
  marsDust: std('mars-dust', 0xb36a43, .97),
  moonDust: std('moon-dust', 0x9a968e, 1),
  floor: std('floor-grate', 0x4c555c, .55, .6),
  foam: std('foam', 0x3b4a5a, .9),
};

const mesh = (geometry, material, name, pos = [0, 0, 0], rot) => {
  const m = new THREE.Mesh(geometry, material); m.name = name; m.position.set(...pos);
  if (rot) m.rotation.set(...rot); return m;
};
export const add = (parent, object) => (parent.add(object), object);
export const box = (p, name, size, pos, mat = M.hull, rot) => add(p, mesh(new THREE.BoxGeometry(...size), mat, name, pos, rot));
export const rbox = (p, name, size, pos, mat = M.hull, r = .03, rot) => add(p, mesh(new RoundedBoxGeometry(...size, 2, Math.min(r, Math.min(...size) / 2 - .001)), mat, name, pos, rot));
export const cyl = (p, name, rt, rb, h, pos, mat = M.alu, rot, seg = 20) => add(p, mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, name, pos, rot));
export const sphere = (p, name, r, pos, mat = M.hull, scale, seg = 18) => { const s = add(p, mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg * .6 | 0)), mat, name, pos)); if (scale) s.scale.set(...scale); return s; };
export const torus = (p, name, r, t, pos, mat = M.steel, rot, arc = Math.PI * 2) => add(p, mesh(new THREE.TorusGeometry(r, t, 10, 28, arc), mat, name, pos, rot));
export const lathe = (p, name, profile, pos, mat = M.hull, seg = 28) => add(p, mesh(new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), seg), mat, name, pos));
export const tube = (p, name, points, r, mat = M.steel, seg = 40) => add(p, mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v => new THREE.Vector3(...v))), seg, r, 10), mat, name));
export const cone = (p, name, r, h, pos, mat = M.alu, rot, seg = 20) => add(p, mesh(new THREE.ConeGeometry(r, h, seg), mat, name, pos, rot));
export function extrude(p, name, shapePoints, depth, pos, mat = M.hull, rot, bevel = .01) {
  const shape = new THREE.Shape(shapePoints.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(shape, {depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2});
  g.translate(0, 0, -depth / 2); return add(p, mesh(g, mat, name, pos, rot));
}
/** Empty pivot or socket for animation and gameplay anchors. */
export function node(p, name, pos = [0, 0, 0], rot) { const n = new THREE.Group(); n.name = name; n.position.set(...pos); if (rot) n.rotation.set(...rot); p.add(n); return n; }
/** Ring of small bolt heads. */
export function bolts(p, points, r = .012, mat = M.steel, axis = 'z') {
  const rot = axis === 'z' ? [Math.PI / 2, 0, 0] : axis === 'x' ? [0, 0, Math.PI / 2] : undefined;
  for (const pt of points) cyl(p, '_bolt', r, r, .012, pt, mat, rot, 6);
}
/** Recessed panel seams on a face (normal +Z). */
export function seams(p, w, h, pos, cols = 2, rows = 2, mat = M.dark) {
  for (let i = 1; i < cols; i++) box(p, '_seam', [.006, h, .004], [pos[0] - w / 2 + w * i / cols, pos[1], pos[2]], mat);
  for (let j = 1; j < rows; j++) box(p, '_seam', [w, .006, .004], [pos[0], pos[1] - h / 2 + h * j / rows, pos[2]], mat);
}
/** Diagonal hazard stripes on a face (normal +Z). */
export function hazard(p, w, h, pos, n = 6) {
  box(p, '_hazard-base', [w, h, .004], pos, M.yellow);
  for (let i = 0; i < n; i++) box(p, '_hazard-stripe', [w / n / 2, h * 1.35, .005], [pos[0] - w / 2 + (i + .5) * w / n, pos[1], pos[2] + .001], M.dark, [0, 0, .6]).scale.y = .75;
}
/** Root group with provenance metadata exported into glTF extras. */
export function root(id, description, interactionNodes = [], extras = {}) {
  const g = new THREE.Group(); g.name = id;
  g.userData = {assetId: id, creator: 'Mission Control Jr', license: 'Project-original procedural model', source: `scripts/expansion-models (${id})`,
    units: 'meters', upAxis: '+Y', forwardAxis: '+Z', origin: 'ground center', description, interactionNodes, ...extras};
  return g;
}
/** Merge static "_" meshes per parent and material to keep draw calls low. */
export function finalize(rootGroup) {
  rootGroup.updateMatrixWorld(true);
  const parents = []; rootGroup.traverse(o => { if (o.children.some(c => c.isMesh && c.name.startsWith('_'))) parents.push(o); });
  for (const parent of parents) {
    const buckets = new Map();
    for (const child of [...parent.children]) {
      if (!child.isMesh || !child.name.startsWith('_') || child.children.length) continue;
      child.updateMatrix();
      const g = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone();
      for (const key of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(key)) g.deleteAttribute(key);
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      g.applyMatrix4(child.matrix);
      const list = buckets.get(child.material) || []; list.push(g); buckets.set(child.material, list);
      parent.remove(child);
    }
    for (const [material, list] of buckets) {
      let merged = mergeGeometries(list, false); if (!merged) continue; merged = mergeVertices(merged, 1e-4);
      parent.add(mesh(merged, material, `${parent.name || 'part'}-${material.name}`));
    }
  }
  return rootGroup;
}
