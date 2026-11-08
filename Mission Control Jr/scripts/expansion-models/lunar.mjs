// Moon south-pole site and equipment for "Chasing the Sun", "Dust Busters" and "Over the Hill".
// The terrain is built from the same height function the game rules use (missions/shared/moon-ground.js).
import * as THREE from 'three';
import {M, add, box, rbox, cyl, sphere, torus, tube, node, bolts, seams, hazard, root, cone, extrude, lathe} from './kit.mjs';
import {SITE, groundHeight, farHorizonDeg} from '../../missions/shared/moon-ground.js';

const std = (name, color, roughness = .6, metalness = 0, extra = {}) => Object.assign(new THREE.MeshStandardMaterial({color, roughness, metalness, ...extra}), {name});
const L = {
  ground: std('moon-regolith', 0x8f8c87, .98),
  groundDark: std('moon-regolith-dark', 0x5f5d5a, .98),
  rock: std('moon-rock', 0x6a6863, .9),
  rockLight: std('moon-rock-light', 0x9c9890, .92),
  far: std('moon-far-massif', 0x77746f, 1),
  habWindow: std('hab-window', 0xffd9a0, .3, 0, {emissive: new THREE.Color(0xffc477), emissiveIntensity: 1.4}),
  moonView: std('moon-view', 0x9aa3b4, .3, 0, {emissive: new THREE.Color(0x7c8698), emissiveIntensity: .7}),
  edsGrid: std('eds-grid', 0x9fd8ff, .2, .3, {emissive: new THREE.Color(0x58c8ff), emissiveIntensity: .25, transparent: true, opacity: .55}),
  mli: std('mli-silver', 0xd8d9d6, .35, .6),
  suit: std('eva-suit', 0xf2f0ea, .85),
  dust: std('moon-dust-coat', 0x8c8880, 1, 0, {transparent: true, opacity: .92}),
  scratch: std('visor-scratch', 0xffffff, .5, 0, {transparent: true, opacity: .55}),
  bristle: std('bristle', 0x3a2f24, .95),
};

// Small seeded random generator so the terrain and rocks are the same every build.
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function rockGeo(r, rand) {
  const g = new THREE.DodecahedronGeometry(r, 0); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const k = .75 + rand() * .45; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * .7, p.getZ(i) * k); }
  g.computeVertexNormals(); return g;
}
const nearAny = (x, z, list, r) => list.some(p => Math.hypot(x - p.x, z - p.z) < r);

/** The whole site: terrain, rocks, boulder field, tracks, landing markers and far mountains. */
export function moonSite() {
  const g = root('moon-south-pole', 'Fictional lunar south-pole site: base pad, Long Ridge, East Hill, Shadow Hollow and distant massifs',
    ['ridge_pad_marker', 'near_pad_marker', 'relay_near', 'relay_saddle', 'relay_far'], {heightFunction: 'missions/shared/moon-ground.js#groundHeight'});
  const N = 170, half = SITE.size / 2;
  const plane = new THREE.PlaneGeometry(SITE.size, SITE.size, N, N); plane.rotateX(-Math.PI / 2);
  const pos = plane.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, groundHeight(pos.getX(i), pos.getZ(i)));
  plane.computeVertexNormals();
  const ground = new THREE.Mesh(plane, L.ground); ground.name = 'ground'; g.add(ground);
  // Rocks and boulders, kept off the paths and pads.
  const rand = rng(7), keepClear = [SITE.base, SITE.pads.near, SITE.pads.ridge, ...Object.values(SITE.relay), {x: 6, z: -9}, {x: -6, z: -22}, {x: 12, z: -60}];
  for (let i = 0; i < 420; i++) {
    const x = (rand() - .5) * (SITE.size - 6), z = (rand() - .5) * (SITE.size - 6);
    if (nearAny(x, z, keepClear, 6.5) || Math.hypot(x, z) < 12) continue;
    const big = rand() < .08, r = big ? .7 + rand() * 1.1 : .12 + rand() * .32;
    const m = new THREE.Mesh(rockGeo(r, rand), rand() < .5 ? L.rock : L.rockLight);
    m.name = '_rock'; m.position.set(x, groundHeight(x, z) + r * .15, z); m.rotation.set(rand() * .5, rand() * 6, rand() * .5); g.add(m);
  }
  // Dark ejecta patches around fresh small craters.
  for (const [x, z, r] of [[-26, -10, 9], [34, 14, 11], [-10, -82, 8]]) {
    const disc = new THREE.CircleGeometry(r, 28); disc.rotateX(-Math.PI / 2);
    const p = disc.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, groundHeight(p.getX(i) + x, p.getZ(i) + z) + .03);
    const m = new THREE.Mesh(disc, L.groundDark); m.name = '_ejecta'; m.position.set(x, 0, z); g.add(m);
  }
  // Pad markers: flat circles with hazard rings, so you can see where to set up.
  const marker = (name, p, color) => {
    const n = node(g, name, [p.x, groundHeight(p.x, p.z), p.z]);
    torus(n, '_pad-ring', 1.9, .06, [0, .04, 0], color, [Math.PI / 2, 0, 0]);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + .4; cone(n, '_pad-post', .07, .5, [Math.cos(a) * 1.9, .25, Math.sin(a) * 1.9], color); }
    return n;
  };
  marker('near_pad_marker', SITE.pads.near, M.orange); marker('ridge_pad_marker', SITE.pads.ridge, M.yellow);
  for (const [k, p] of Object.entries(SITE.relay)) { const n = node(g, `relay_${k}`, [p.x, groundHeight(p.x, p.z), p.z]); cyl(n, '_stake', .03, .03, .9, [0, .45, 0], M.orange); box(n, '_flag', [.3, .18, .01], [.15, .8, 0], k === 'far' ? M.green : M.yellow); }
  // Old rover tracks heading toward the ridge saddle: flat ribbons pressed into the ground.
  const path = t => ({x: 4 + 10 * t + 4 * Math.sin(Math.PI * t), z: -6 - 35.8 * t});
  for (const side of [-.75, .75]) {
    const verts = [], idx = [], steps = 90;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, a = path(t), b = path(Math.min(1, t + .01)), c = path(Math.max(0, t - .01));
      let dx = b.x - c.x, dz = b.z - c.z; const len = Math.hypot(dx, dz); dx /= len; dz /= len;
      const cx = a.x - dz * side, cz = a.z + dx * side;
      for (const w of [-.13, .13]) { const x = cx - dz * w, z = cz + dx * w; verts.push(x, groundHeight(x, z) + .02, z); }
      if (i < steps) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, L.groundDark); m.name = '_track'; g.add(m);
  }
  // Distant massifs, drawn at 600 m so their angle above the horizon matches the rules.
  const R = 600, seg = 180, verts = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const az = i / seg * 360, rad = az * Math.PI / 180, top = Math.tan(farHorizonDeg(az) * Math.PI / 180) * R + Math.sin(i * 1.7) * 2.2;
    const x = Math.sin(rad) * R, z = -Math.cos(rad) * R; verts.push(x, -20, z, x, top, z);
    if (i < seg) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const band = new THREE.BufferGeometry(); band.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); band.setIndex(idx); band.computeVertexNormals();
  const far = new THREE.Mesh(band, Object.assign(L.far.clone(), {side: THREE.DoubleSide, name: 'moon-far-massif'})); far.name = 'far_massifs'; g.add(far);
  return g;
}

/** Horizon Base from outside: a pressurised module on legs with a power port, windows, radiators and an antenna. */
export function lunarHabitat() {
  const g = root('lunar-habitat', 'Horizon Base exterior module with power port, airlock, radiators and a steerable antenna',
    ['power_port', 'port_socket', 'port_lamp', 'base_antenna', 'base_dish', 'beacon', 'windows', 'airlock']);
  const body = new THREE.Group(); body.name = 'body'; g.add(body);
  cyl(body, '_hull', 2.1, 2.1, 7.2, [0, 2.7, 0], M.hull, [0, 0, Math.PI / 2], 36);
  for (const s of [-1, 1]) { sphere(body, '_endcap', 2.1, [s * 3.6, 2.7, 0], M.hull, [.35, 1, 1], 32); }
  for (const x of [-2.6, -.9, .9, 2.6]) torus(body, '_hoop', 2.12, .05, [x, 2.7, 0], M.panel, [0, Math.PI / 2, 0]);
  rbox(body, '_mli-blanket', [5.6, .9, .1], [0, 4.25, 0], L.mli, .05, [Math.PI / 2, 0, 0]);
  // Legs with round footpads.
  for (const [x, z] of [[-2.8, -1.5], [2.8, -1.5], [-2.8, 1.5], [2.8, 1.5]]) {
    cyl(body, '_leg', .09, .12, 1.4, [x, .7, z], M.alu, [z < 0 ? -.18 : .18, 0, 0], 10);
    cyl(body, '_foot', .38, .42, .1, [x, .05, z + (z < 0 ? -.12 : .12)], M.steel, null, 18);
  }
  // Windows (one material so the game can dim the base when power runs low).
  const windows = node(g, 'windows');
  for (const x of [-2, 0, 2]) for (const s of [-1, 1]) { const w = rbox(windows, '_window', [.7, .42, .06], [x, 3.0, s * 2.04], L.habWindow, .12); w.rotation.x = s * -.3; }
  // Airlock on the east end with a hatch and ladder.
  const airlock = node(g, 'airlock', [4.3, 0, 0]);
  cyl(airlock, '_airlock-tube', 1.05, 1.05, 1.6, [.4, 2.0, 0], M.hullWarm, [0, 0, Math.PI / 2], 26);
  rbox(airlock, '_hatch', [.1, 1.5, 1.0], [1.22, 2.0, 0], M.panel, .2);
  torus(airlock, '_hatch-wheel', .22, .03, [1.29, 2.0, 0], M.orange, [0, Math.PI / 2, 0]);
  for (let i = 0; i < 6; i++) box(airlock, '_ladder-rung', [.05, .04, .6], [1.45, .25 + i * .26, 0], M.alu);
  for (const z of [-.32, .32]) box(airlock, '_ladder-rail', [.05, 1.5, .05], [1.45, .75, z], M.alu, [0, 0, -.12]);
  rbox(airlock, '_porch', [1.2, .1, 1.6], [1.5, 1.38, 0], M.floor, .02);
  // Radiators on the roof.
  for (const s of [-1, 1]) { const r = rbox(body, '_radiator', [3.6, .05, 1.3], [0, 4.7, s * 1.2], M.hull, .02); r.rotation.x = s * .5; seams(body, 3.4, .8, [0, 4.73, s * 1.2], 6, 1); }
  // Power port on the north (-z) side, low enough to reach.
  const port = node(g, 'power_port', [-.8, 0, -2.25]);
  cyl(port, '_port-post', .08, .1, 1.2, [0, .6, 0], M.steel, null, 12);
  rbox(port, '_port-box', [.6, .5, .3], [0, 1.25, 0], M.panel, .04);
  hazard(port, .56, .07, [0, 1.47, -.151]);
  const socket = node(port, 'port_socket', [0, 1.2, -.18]);
  cyl(socket, '_socket-ring', .085, .085, .06, [0, 0, 0], M.dark, [Math.PI / 2, 0, 0], 16);
  const lamp = node(port, 'port_lamp', [.2, 1.36, -.16]); sphere(lamp, 'lamp', .035, [0, 0, 0], M.ledAmber, null, 10);
  // Steerable antenna mast at the west end.
  const mast = node(g, 'base_antenna', [-3.2, 4.4, 0]);
  cyl(mast, '_ant-mast', .06, .07, 1.6, [0, .8, 0], M.alu, null, 10);
  const dish = node(mast, 'base_dish', [0, 1.65, 0]);
  lathe(dish, '_dish', [[0, 0], [.2, .03], [.38, .1], [.42, .14], [.4, .15], [.18, .06], [0, .03]], [0, 0, 0], M.hull, 24).rotation.x = Math.PI / 2;
  cyl(dish, '_feed', .015, .015, .3, [0, 0, -.18], M.steel, [Math.PI / 2, 0, 0], 8);
  const beacon = node(g, 'beacon', [3.2, 4.9, 0]); sphere(beacon, 'beacon-light', .09, [0, 0, 0], M.ledRed, null, 10);
  box(g, '_sign', [2.2, .32, .02], [0, 1.65, -2.03], M.blue);
  return g;
}

/** Wheeled cart with a telescoping vertical solar array, fold-out legs and a cable reel. */
export function solarMastCart() {
  const g = root('solar-mast-cart', 'Tow cart carrying a three-stage telescoping vertical solar array with legs, wings, sun sensor and cable reel',
    ['tow_bar', 'wheel_l', 'wheel_r', 'leg_1', 'leg_2', 'leg_3', 'leg_4', 'mast_1', 'mast_2', 'mast_3', 'panel_pivot', 'wing_l', 'wing_r', 'sun_lamp', 'reel_drum', 'plug', 'cable_exit', 'crank', 'screen'],
    {mast: {baseTop: 2.4, stage: 1.8, stages: 3}});
  rbox(g, '_chassis', [1.3, .22, 1.5], [0, .62, 0], M.panel, .04);
  rbox(g, '_battery-box', [.9, .3, .5], [0, .87, .45], M.dark, .04);
  hazard(g, 1.2, .06, [0, .62, .751]);
  for (const [nm, s] of [['wheel_l', -1], ['wheel_r', 1]]) {
    const w = node(g, nm, [s * .8, .45, -.1]);
    cyl(w, '_tyre', .45, .45, .2, [0, 0, 0], M.rubber, [0, 0, Math.PI / 2], 28);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; box(w, '_tread', [.22, .05, .06], [0, Math.cos(a) * .45, Math.sin(a) * .45], M.steel, [a, 0, 0]); }
    cyl(w, '_hub', .14, .14, .24, [0, 0, 0], M.alu, [0, 0, Math.PI / 2], 14);
  }
  const bar = node(g, 'tow_bar', [0, .62, .75]);
  tube(bar, '_bar', [[-.35, 0, 0], [-.1, .1, .5], [0, .2, .95]], .03, M.alu); tube(bar, '_bar', [[.35, 0, 0], [.1, .1, .5], [0, .2, .95]], .03, M.alu);
  cyl(bar, '_handle', .035, .035, .4, [0, .22, 1.0], M.orange, [0, 0, Math.PI / 2], 10);
  [[-.6, -.65], [.6, -.65], [-.6, .65], [.6, .65]].forEach(([x, z], i) => {
    const leg = node(g, `leg_${i + 1}`, [x, .6, z]);
    cyl(leg, '_strut', .04, .04, .62, [0, -.31, 0], M.alu, null, 8);
    cyl(leg, '_foot', .1, .12, .04, [0, -.62, 0], M.steel, null, 12);
  });
  // Telescoping mast: base tube plus three stages that slide up.
  cyl(g, '_mast-base', .1, .11, 1.0, [0, 1.2, -.15], M.alu, null, 16);
  bolts(g, [[-.1, .76, -.15], [.1, .76, -.15], [0, .76, -.05]], .02, M.steel, 'y');
  let parent = g; let y = .75;
  ['mast_1', 'mast_2', 'mast_3'].forEach((nm, i) => {
    const st = node(parent, nm, i === 0 ? [0, y, -.15] : [0, .12, 0]);
    cyl(st, '_stage', .085 - i * .018, .085 - i * .018, 1.9, [0, .95, 0], i % 2 ? M.hull : M.alu, null, 14);
    torus(st, '_collar', .09 - i * .018, .015, [0, 1.85, 0], M.orange, [Math.PI / 2, 0, 0]);
    parent = st;
  });
  const pivot = node(parent, 'panel_pivot', [0, 1.95, 0]);
  cyl(pivot, '_motor', .09, .09, .16, [0, 0, 0], M.dark, null, 14);
  const lamp = node(pivot, 'sun_lamp', [0, .14, 0]); sphere(lamp, 'lamp', .05, [0, 0, 0], M.ledAmber, null, 10);
  for (const [nm, s] of [['wing_l', -1], ['wing_r', 1]]) {
    const w = node(pivot, nm, [s * .06, 0, 0]);
    rbox(w, '_wing-frame', [1.22, 1.62, .04], [s * .64, 0, 0], M.alu, .02);
    box(w, '_wing-cells', [1.14, 1.54, .02], [s * .64, 0, .015], M.solar);
    for (let i = 1; i < 4; i++) box(w, '_cell-line', [.006, 1.54, .022], [s * (.07 + i * .285), 0, .016], M.alu);
    for (let j = 1; j < 5; j++) box(w, '_cell-line', [1.14, .006, .022], [s * .64, -.77 + j * .308, .016], M.alu);
  }
  // Cable reel on the side, with the plug parked on it.
  const drum = node(g, 'reel_drum', [-.55, 1.0, .35]);
  cyl(drum, '_drum', .2, .2, .22, [0, 0, 0], M.dark, [0, 0, Math.PI / 2], 20);
  for (const s of [-1, 1]) cyl(drum, '_flange', .3, .3, .02, [s * .12, 0, 0], M.orange, [0, 0, Math.PI / 2], 20);
  for (let i = 0; i < 5; i++) torus(drum, '_coil', .21, .025, [-.08 + i * .04, 0, 0], M.yellow, [0, Math.PI / 2, 0]);
  const crank = node(drum, 'crank', [-.14, 0, 0]); box(crank, '_crank-arm', [.03, .2, .03], [0, .1, 0], M.alu); cyl(crank, '_knob', .025, .025, .08, [-.04, .2, 0], M.dark, [0, 0, Math.PI / 2], 8);
  node(g, 'cable_exit', [-.55, 1.0, .1]);
  const plug = node(g, 'plug', [-.85, .95, .2]);
  cyl(plug, '_plug-body', .05, .06, .18, [0, 0, 0], M.orange, [Math.PI / 2, 0, 0], 12); cyl(plug, '_plug-tip', .03, .03, .06, [0, 0, -.11], M.steel, [Math.PI / 2, 0, 0], 10);
  // Little sun-forecast screen on the battery box.
  const screen = node(g, 'screen', [0, .9, .705]); box(screen, 'screen', [.6, .22, .01], [0, 0, 0], M.screen);
  return g;
}

/** The dust-control airlock: a small room between the Moon and the base. */
export function moonAirlock() {
  const g = root('moon-airlock', 'Walk-in lunar airlock with outer and inner hatches, gear hooks, brush, vacuum, EDS cleaning plate, air filter and spare-filter locker',
    ['outer_door', 'outer_wheel', 'inner_door', 'inner_wheel', 'hook_suit', 'hook_helmet', 'hook_bag', 'boot_mat', 'brush_holder', 'vac_unit', 'vac_nozzle', 'eds_pad', 'eds_glow', 'eds_slot', 'eds_switch', 'fan', 'filter_door', 'filter_slot', 'locker_door', 'spare_filter_1', 'spare_filter_2', 'air_screen', 'air_lamp', 'cycle_button', 'dust_tray', 'floor_dust'],
    {walkBounds: {x: 2.2, z: 1.2}});
  const W = 5.6, D = 3.4, H = 2.6, inner = Object.assign(M.hull.clone(), {name: 'airlock-wall', side: THREE.DoubleSide});
  box(g, '_floor', [W, .1, D], [0, -.05, 0], M.floor);
  for (let x = -2.5; x <= 2.5; x += .25) box(g, '_grate', [.03, .02, D - .2], [x, .01, 0], M.dark);
  const tray = node(g, 'dust_tray', [0, -.02, 0]); box(tray, '_tray', [W - .4, .01, D - .4], [0, 0, 0], M.dark);
  const floorDust = node(g, 'floor_dust', [0, .015, 0]); box(floorDust, 'dust-layer', [W - .6, .006, D - .6], [0, 0, 0], L.dust);
  box(g, '_ceiling', [W, .1, D], [0, H + .05, 0], inner);
  for (const s of [-1, 1]) { box(g, '_wall', [W, H, .1], [0, H / 2, s * D / 2], inner); seams(g, W, H - .4, [0, H / 2, s * (D / 2 - .051)], 4, 2); }
  // End walls with hatch openings.
  for (const [s, nm] of [[-1, 'outer'], [1, 'inner']]) {
    const x = s * W / 2;
    box(g, '_end', [.1, H, .9], [x, H / 2, -1.25], inner); box(g, '_end', [.1, H, .9], [x, H / 2, 1.25], inner); box(g, '_end', [.1, .5, 1.6], [x, H - .25, 0], inner);
    rbox(g, '_hatch-frame', [.16, 2.2, 1.7], [x - s * .02, 1.1, 0], M.panel, .06);
    const door = node(g, `${nm}_door`, [x - s * .09, 0, -.78]);
    rbox(door, '_door', [.08, 2.0, 1.52], [0, 1.05, .76], nm === 'outer' ? M.hullWarm : M.hull, .08);
    rbox(door, '_door-window', [.02, .38, .38], [-s * .045, 1.62, .76], nm === 'outer' ? L.moonView : L.habWindow, .06);
    const wheel = node(door, `${nm}_wheel`, [-s * .07, 1.05, .76]);
    torus(wheel, '_wheel-rim', .2, .025, [0, 0, 0], M.orange, [0, Math.PI / 2, 0]);
    for (let i = 0; i < 3; i++) box(wheel, '_spoke', [.02, .4, .03], [0, 0, 0], M.steel, [i * Math.PI / 3, 0, 0]);
    cyl(wheel, '_hub', .05, .05, .06, [0, 0, 0], M.dark, [0, 0, Math.PI / 2], 12);
    box(g, '_hatch-sign', [.02, .14, 1.2], [x - s * .06, 2.38, 0], nm === 'outer' ? M.orange : M.green);
  }
  // Gear hooks on the north wall.
  const wallZ = -D / 2 + .08;
  for (const [nm, x, y] of [['hook_suit', -1.4, 1.95], ['hook_helmet', -.1, 1.45], ['hook_bag', .9, 1.5]]) {
    const n = node(g, nm, [x, y, wallZ + .22]); cyl(n, '_hook', .02, .02, .22, [0, 0, -.11], M.steel, [Math.PI / 2, 0, 0], 8);
  }
  box(g, '_helmet-shelf', [.7, .04, .35], [-.1, 1.12, wallZ + .17], M.panel);
  const mat = node(g, 'boot_mat', [1.7, .02, -1.0]); box(mat, '_mat', [.8, .02, .6], [0, 0, 0], M.rubber);
  // Cleaning bench on the south wall: brush holder, vacuum and the EDS plate.
  const benchZ = D / 2 - .4;
  rbox(g, '_bench', [2.4, .08, .6], [-.3, .9, benchZ], M.panel, .02);
  for (const x of [-1.4, .8]) box(g, '_bench-leg', [.06, .9, .5], [x, .45, benchZ], M.alu);
  const brush = node(g, 'brush_holder', [-1.25, 1.1, benchZ + .15]); box(brush, '_holder', [.3, .2, .08], [0, 0, .1], M.dark);
  const vac = node(g, 'vac_unit', [-.6, .95, benchZ + .05]);
  rbox(vac, '_vac-body', [.45, .35, .35], [0, .18, 0], M.blue, .05); box(vac, '_vac-grille', [.3, .12, .01], [0, .2, -.18], M.dark);
  const nozzle = node(vac, 'vac_nozzle', [.3, .2, -.1]); cyl(nozzle, '_nozzle', .035, .05, .3, [0, 0, 0], M.dark, [0, 0, Math.PI / 2], 12);
  const eds = node(g, 'eds_pad', [.45, .94, benchZ]);
  rbox(eds, '_eds-base', [.7, .05, .5], [0, 0, 0], M.dark, .02);
  const glow = node(eds, 'eds_glow', [0, .035, 0]); box(glow, 'eds-plate', [.62, .01, .42], [0, 0, 0], L.edsGrid);
  for (let i = 0; i < 9; i++) box(glow, '_electrode', [.004, .012, .42], [-.28 + i * .07, .002, 0], M.copper);
  node(eds, 'eds_slot', [0, .06, 0]);
  const sw = node(g, 'eds_switch', [.95, 1.0, benchZ + .22]); box(sw, '_sw-plate', [.12, .16, .02], [0, 0, 0], M.panel); box(sw, 'sw-toggle', [.03, .08, .04], [0, .02, -.02], M.yellow);
  box(g, '_eds-label', [.5, .06, .01], [.45, 1.25, D / 2 - .06], M.blue);
  // Air system: fan grille and filter door on the ceiling corner, spare locker, dust screen.
  const fan = node(g, 'fan', [1.6, H - .06, .9]); cyl(g, '_fan-shroud', .32, .32, .06, [1.6, H - .03, .9], M.panel, null, 24);
  for (let i = 0; i < 5; i++) box(fan, '_blade', [.26, .01, .08], [.12, 0, 0], M.dark, [0, i / 5 * Math.PI * 2, .3]).position.set(Math.cos(i / 5 * Math.PI * 2) * .12, 0, Math.sin(i / 5 * Math.PI * 2) * -.12);
  rbox(g, '_filter-housing', [.5, .7, .3], [2.1, 1.75, 1.45], M.panel, .03);
  const fdoor = node(g, 'filter_door', [1.85, 1.75, 1.29]); rbox(fdoor, '_fdoor', [.5, .66, .03], [.25, 0, 0], M.hullWarm, .02); box(fdoor, '_fdoor-label', [.3, .05, .005], [.25, .22, -.017], M.orange);
  node(g, 'filter_slot', [2.1, 1.62, 1.42]);
  rbox(g, '_locker', [.6, 1.6, .4], [2.2, .8, -1.4], M.panel, .03);
  const ldoor = node(g, 'locker_door', [1.9, .8, -1.19]); rbox(ldoor, '_ldoor', [.6, 1.56, .03], [.3, 0, 0], M.hull, .02); box(ldoor, '_ldoor-handle', [.03, .2, .03], [.52, 0, .03], M.dark);
  node(g, 'spare_filter_1', [2.1, .95, -1.4]); node(g, 'spare_filter_2', [2.35, .95, -1.4]);
  box(g, '_locker-shelf', [.55, .03, .35], [2.2, .78, -1.4], M.alu);
  const screen = node(g, 'air_screen', [.6, 1.85, -D / 2 + .06]); rbox(screen, '_screen-bezel', [1.0, .62, .04], [0, 0, 0], M.dark, .03); box(screen, 'screen', [.92, .54, .01], [0, 0, .022], M.screen);
  const lamp = node(g, 'air_lamp', [1.25, 2.1, -D / 2 + .08]); sphere(lamp, 'lamp', .06, [0, 0, 0], M.ledRed, null, 12);
  const btn = node(g, 'cycle_button', [1.25, 1.75, -D / 2 + .08]); rbox(btn, '_btn-plate', [.22, .22, .03], [0, 0, 0], M.panel, .02); cyl(btn, 'button', .06, .06, .04, [0, 0, .03], M.green, [Math.PI / 2, 0, 0], 16);
  // Lights.
  for (const x of [-1.6, 0, 1.6]) box(g, '_light', [.9, .03, .2], [x, H - .02, -.6], M.lightStrip);
  hazard(g, 1.5, .08, [-W / 2 + .9, .3, -D / 2 + .056]);
  return g;
}

/** EVA suit on a hanger, with removable dust layers. */
export function moonSuit() {
  const g = root('moon-suit', 'Hanging EVA suit with separate dust layers on the legs, arms and body', ['dust_legs', 'dust_arms', 'dust_body', 'hanger']);
  const hanger = node(g, 'hanger', [0, 0, 0]); box(hanger, '_bar', [.6, .03, .03], [0, 0, 0], M.alu);
  const torso = rbox(g, '_torso', [.56, .62, .32], [0, -.42, 0], L.suit, .12); torso.scale.set(1, 1, 1);
  rbox(g, '_pack', [.5, .6, .2], [0, -.4, -.25], M.hull, .06);
  rbox(g, '_chest-unit', [.3, .16, .08], [0, -.32, .18], M.dark, .03); for (let i = 0; i < 3; i++) cyl(g, '_dial', .025, .025, .02, [-.08 + i * .08, -.3, .225], [M.red, M.blue, M.yellow][i], [Math.PI / 2, 0, 0], 10);
  torus(g, '_neck-ring', .14, .03, [0, -.1, 0], M.alu, [Math.PI / 2, 0, 0]);
  for (const s of [-1, 1]) {
    cyl(g, '_arm', .08, .07, .6, [s * .36, -.5, 0], L.suit, [0, 0, s * .15], 14);
    sphere(g, '_glove', .075, [s * .42, -.84, .02], M.blue, [1, 1.2, .8], 12);
    cyl(g, '_leg', .11, .09, .75, [s * .14, -1.12, 0], L.suit, null, 14);
    rbox(g, '_boot', [.17, .14, .3], [s * .14, -1.55, .05], M.panel, .05);
    torus(g, '_knee', .1, .015, [s * .14, -1.08, 0], M.alu, [Math.PI / 2, 0, 0]);
  }
  const legs = node(g, 'dust_legs'); for (const s of [-1, 1]) { cyl(legs, '_dust', .118, .1, .62, [s * .14, -1.2, 0], L.dust, null, 14); rbox(legs, '_dust', [.18, .1, .31], [s * .14, -1.52, .05], L.dust, .04); }
  const arms = node(g, 'dust_arms'); for (const s of [-1, 1]) { cyl(arms, '_dust', .086, .076, .4, [s * .38, -.62, 0], L.dust, [0, 0, s * .15], 14); sphere(arms, '_dust', .08, [s * .42, -.84, .02], L.dust, [1, 1.2, .8], 12); }
  const body = node(g, 'dust_body'); rbox(body, '_dust', [.58, .3, .34], [0, -.6, 0], L.dust, .1);
  return g;
}
/** EVA helmet with gold visor; dust and scratch layers are separate nodes. */
export function evaHelmet() {
  const g = root('eva-helmet', 'EVA helmet with gold sun visor, a dust layer and a scratch layer (scratches appear if the visor is brushed)', ['visor', 'dust_visor', 'scratches']);
  sphere(g, '_shell', .17, [0, .18, 0], M.hull, [1, 1.05, 1.08], 24);
  torus(g, '_neck', .13, .03, [0, .02, 0], M.alu, [Math.PI / 2, 0, 0]);
  const visor = node(g, 'visor'); sphere(visor, 'visor-gold', .172, [0, .19, .03], M.visor, [.92, .8, 1.02], 24).scale.z = 1.05;
  const dust = node(g, 'dust_visor'); sphere(dust, '_dust', .176, [0, .17, .035], L.dust, [.93, .72, 1.03], 20);
  const scr = node(g, 'scratches'); for (let i = 0; i < 6; i++) box(scr, '_scratch', [.12, .004, .004], [-.06 + i * .025, .14 + (i % 3) * .04, .2], L.scratch, [0, 0, .5 - i * .2]);
  for (const s of [-1, 1]) cyl(g, '_lamp', .025, .025, .05, [s * .13, .3, .06], M.dark, [Math.PI / 2, 0, 0], 10);
  return g;
}
export function toolBag() {
  const g = root('tool-bag', 'Geology tool bag with a dust layer', ['dust_bag']);
  rbox(g, '_bag', [.42, .32, .16], [0, -.2, 0], M.fabricBlue, .05); box(g, '_strap', [.04, .3, .02], [0, 0, 0], M.dark);
  cyl(g, '_tongs', .012, .012, .35, [.12, -.02, .09], M.alu, null, 6); cyl(g, '_hammer', .015, .015, .3, [-.1, -.04, .09], M.alu, null, 6);
  const d = node(g, 'dust_bag'); rbox(d, '_dust', [.44, .2, .17], [0, -.28, 0], L.dust, .05);
  return g;
}
export function moonBoots() {
  const g = root('moon-boots', 'Pair of EVA overboots with a dust layer', ['dust_boots']);
  for (const s of [-1, 1]) { rbox(g, '_boot', [.18, .26, .34], [s * .13, .13, 0], M.panel, .06); rbox(g, '_sole', [.2, .05, .37], [s * .13, .025, 0], M.rubber, .02); }
  const d = node(g, 'dust_boots'); for (const s of [-1, 1]) rbox(d, '_dust', [.19, .14, .35], [s * .13, .08, 0], L.dust, .05);
  return g;
}
export function dustBrush() {
  const g = root('dust-brush', 'Soft dust brush', ['bristles']);
  cyl(g, '_handle', .02, .025, .3, [0, .15, 0], M.orange, null, 10); rbox(g, '_head', [.14, .05, .05], [0, .32, 0], M.dark, .015);
  const b = node(g, 'bristles', [0, .36, 0]); for (let i = 0; i < 7; i++) box(b, '_tuft', [.012, .05, .04], [-.06 + i * .02, 0, 0], L.bristle);
  return g;
}

/** Open two-seat rover with a cargo deck. Forward is -Z. */
export function moonRover() {
  const g = root('moon-rover', 'Two-seat open lunar rover with wheel pivots, cargo deck, antenna and headlights (forward is -Z)',
    ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr', 'cargo_slot', 'rover_antenna', 'headlights', 'seat_l', 'seat_r', 'dash_screen', 'drill_slot']);
  rbox(g, '_chassis', [1.7, .16, 3.0], [0, .78, 0], M.alu, .04);
  rbox(g, '_belly', [1.2, .22, 2.4], [0, .6, 0], M.dark, .05);
  for (const [nm, x, z] of [['wheel_fl', -.98, -1.1], ['wheel_fr', .98, -1.1], ['wheel_rl', -.98, 1.1], ['wheel_rr', .98, 1.1]]) {
    const w = node(g, nm, [x, .42, z]);
    cyl(w, '_tyre', .42, .42, .26, [0, 0, 0], M.alu, [0, 0, Math.PI / 2], 30);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; box(w, '_chevron', [.28, .03, .07], [0, Math.cos(a) * .425, Math.sin(a) * .425], M.steel, [a, 0, 0]); }
    cyl(w, '_hub', .12, .12, .3, [0, 0, 0], M.dark, [0, 0, Math.PI / 2], 12);
    const fender = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .3, 20, 1, true, -Math.PI / 2, Math.PI), M.orange); fender.name = '_fender'; fender.rotation.z = Math.PI / 2; fender.position.set(x, .45, z); fender.material = M.orange; g.add(fender);
  }
  for (const [nm, x] of [['seat_l', -.38], ['seat_r', .38]]) {
    const seat = node(g, nm, [x, .88, -.1]);
    rbox(seat, '_seat', [.5, .08, .5], [0, .04, 0], M.fabricBlue, .03); rbox(seat, '_back', [.5, .55, .08], [0, .32, .25], M.fabricBlue, .03);
    tube(seat, '_belt', [[-.2, .55, .22], [0, .3, .2], [.2, .1, .2]], .015, M.dark);
  }
  rbox(g, '_dash', [1.2, .4, .14], [0, 1.1, -.85], M.dark, .04);
  const dash = node(g, 'dash_screen', [0, 1.22, -.92]); box(dash, 'screen', [.5, .24, .01], [0, 0, 0], M.screen);
  tube(g, '_tiller', [[0, .9, -.75], [0, 1.05, -.62], [0, 1.15, -.55]], .025, M.dark); cyl(g, '_tiller-knob', .04, .04, .12, [0, 1.17, -.53], M.orange, [Math.PI / 2, 0, 0], 10);
  const cargo = node(g, 'cargo_slot', [0, .88, 1.05]); box(g, '_deck', [1.3, .04, .9], [0, .86, 1.05], M.floor);
  for (const s of [-1, 1]) box(g, '_rail', [.04, .2, .9], [s * .66, .97, 1.05], M.alu);
  node(g, 'drill_slot', [.55, .9, .35]);
  const ant = node(g, 'rover_antenna', [-.7, .9, .6]); cyl(ant, '_ant-mast', .02, .025, 1.4, [0, .7, 0], M.alu, null, 8);
  lathe(ant, '_ant-dish', [[0, 0], [.14, .03], [.24, .08], [.2, .09], [0, .03]], [0, 1.4, 0], M.hull, 18).rotation.x = -1.1;
  const lights = node(g, 'headlights', [0, .9, -1.5]); for (const s of [-1, 1]) { cyl(lights, '_lamp-housing', .08, .08, .1, [s * .5, 0, 0], M.dark, [Math.PI / 2, 0, 0], 12); cyl(lights, 'lens', .065, .065, .02, [s * .5, 0, -.06], M.lightStrip, [Math.PI / 2, 0, 0], 12); }
  hazard(g, 1.5, .06, [0, .78, -1.51]);
  return g;
}

/** Portable radio relay: tripod legs, three-stage mast, steerable dish and solar flaps. */
export function relayStation() {
  const g = root('relay-station', 'Portable radio relay with folding tripod legs, three-stage telescoping mast, steerable dish, link lamp and solar flaps',
    ['leg_1', 'leg_2', 'leg_3', 'mast_1', 'mast_2', 'mast_3', 'dish_pivot', 'dish_tilt', 'link_lamp', 'power_lamp', 'flap_l', 'flap_r', 'handle'],
    {mast: {baseTop: 1.2, stage: 1.8, stages: 3}});
  rbox(g, '_hub', [.5, .35, .5], [0, .5, 0], M.hull, .05); hazard(g, .48, .05, [0, .62, .251]);
  const handle = node(g, 'handle', [0, .7, 0]); tube(handle, '_handle', [[-.18, 0, 0], [-.12, .1, 0], [.12, .1, 0], [.18, 0, 0]], .02, M.orange);
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * Math.PI * 2, leg = node(g, `leg_${i + 1}`, [Math.sin(a) * .2, .4, Math.cos(a) * .2], [0, a, 0]);
    cyl(leg, '_strut', .025, .025, .55, [0, -.27, 0], M.alu, null, 8); cyl(leg, '_foot', .07, .08, .03, [0, -.55, 0], M.steel, null, 10);
  }
  for (const [nm, s] of [['flap_l', -1], ['flap_r', 1]]) { const f = node(g, nm, [s * .25, .55, 0]); box(f, '_flap', [.5, .02, .44], [s * .25, 0, 0], M.solar); box(f, '_flap-frame', [.52, .015, .46], [s * .25, -.01, 0], M.alu); }
  let parent = g;
  ['mast_1', 'mast_2', 'mast_3'].forEach((nm, i) => {
    const st = node(parent, nm, i === 0 ? [0, .55, 0] : [0, .1, 0]);
    cyl(st, '_stage', .05 - i * .01, .05 - i * .01, 1.85, [0, .925, 0], i % 2 ? M.hull : M.alu, null, 12);
    torus(st, '_collar', .055 - i * .01, .01, [0, 1.8, 0], M.yellow, [Math.PI / 2, 0, 0]);
    parent = st;
  });
  // The dish sits on top of the third stage.
  const pivot = node(parent, 'dish_pivot', [0, 1.88, 0]); cyl(pivot, '_az-motor', .06, .06, .1, [0, 0, 0], M.dark, null, 12);
  const tilt = node(pivot, 'dish_tilt', [0, .1, 0]);
  lathe(tilt, '_dish', [[0, 0], [.18, .03], [.32, .09], [.35, .12], [.33, .13], [.16, .06], [0, .03]], [0, 0, 0], M.hull, 26).rotation.x = Math.PI / 2;
  cyl(tilt, '_feed', .012, .012, .26, [0, 0, -.15], M.steel, [Math.PI / 2, 0, 0], 8);
  const ll = node(pivot, 'link_lamp', [.09, 0, 0]); sphere(ll, 'lamp', .03, [0, 0, 0], M.ledRed, null, 10);
  const pl = node(g, 'power_lamp', [.18, .6, .26]); sphere(pl, 'lamp', .025, [0, 0, 0], M.ledAmber, null, 10);
  return g;
}

/** Small science drill that takes a core of regolith. */
export function scienceDrill() {
  const g = root('science-drill', 'Tripod science drill with spinning head, sliding bit and a core sample tube', ['drill_head', 'drill_bit', 'core_sample']);
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; tube(g, '_leg', [[0, 1.1, 0], [Math.sin(a) * .35, .5, Math.cos(a) * .35], [Math.sin(a) * .45, 0, Math.cos(a) * .45]], .02, M.alu, 12); }
  cyl(g, '_rail', .03, .03, 1.0, [0, .62, 0], M.steel, null, 8);
  const head = node(g, 'drill_head', [0, 1.05, 0]); rbox(head, '_motor', [.22, .2, .22], [0, 0, 0], M.orange, .04); box(head, '_label', [.15, .05, .005], [0, .02, .112], M.dark);
  const bit = node(head, 'drill_bit', [0, -.1, 0]); cyl(bit, '_bit', .025, .02, .7, [0, -.35, 0], M.steel, null, 10);
  for (let i = 0; i < 6; i++) torus(bit, '_flute', .028, .006, [0, -.08 - i * .1, 0], M.alu, [Math.PI / 2, 0, i]);
  const core = node(g, 'core_sample', [.35, .3, 0]); cyl(core, '_core-tube', .04, .04, .4, [0, 0, 0], M.glass, null, 12); cyl(core, '_core', .035, .035, .3, [0, -.03, 0], M.moonDust, null, 12);
  return g;
}

export const DESIGNS = {
  'moon-south-pole': moonSite, 'lunar-habitat': lunarHabitat, 'solar-mast-cart': solarMastCart,
  'moon-airlock': moonAirlock, 'moon-suit': moonSuit, 'eva-helmet': evaHelmet, 'tool-bag': toolBag, 'moon-boots': moonBoots, 'dust-brush': dustBrush,
  'moon-rover': moonRover, 'relay-station': relayStation, 'science-drill': scienceDrill,
};
