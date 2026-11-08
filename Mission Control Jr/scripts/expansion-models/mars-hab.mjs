// Mars habitat interiors and the radiation-shelter equipment for "A Place to Hide".
import * as THREE from 'three';
import {M, box, rbox, cyl, sphere, torus, tube, node, bolts, seams, hazard, root, extrude, lathe} from './kit.mjs';

const inner = Object.assign(M.hull.clone(), {name: 'hull-inner', side: THREE.DoubleSide});
const windowMars = new THREE.MeshStandardMaterial({name: 'window-mars-view', color: 0xffb27a, emissive: new THREE.Color(0xd9773f), emissiveIntensity: .9, roughness: .2});

/**
 * A walk-in habitat module: flat floor, short walls and an elliptical vault.
 * length runs along X, width along Z. The player walks inside it.
 */
export function habInterior(id, {length = 16, width = 10, wall = 2.1, rise = 2.4, dressing = 'quarters'} = {}) {
  const g = root(id, `Walk-in Mars habitat module (${dressing})`, ['hatch_door', 'light_strips', 'window_l', 'window_r'], {walkBounds: {x: length / 2 - .6, z: width / 2 - .6}});
  const hw = width / 2, hl = length / 2;
  // Floor: raised grate panels with a darker access trench down the middle.
  box(g, '_floor', [length, .12, width], [0, -.06, 0], M.floor);
  for (let x = -hl + 1; x < hl; x += 2) box(g, '_floor-seam', [.03, .01, width], [x, .005, 0], M.dark);
  for (const z of [-hw + 1.4, hw - 1.4]) box(g, '_floor-trim', [length, .015, .08], [0, .008, z], M.yellow);
  // Walls and vault (double-sided so the room reads from inside).
  for (const s of [-1, 1]) {
    box(g, '_wall', [length, wall, .12], [0, wall / 2, s * hw], inner);
    box(g, '_kick', [length, .25, .06], [0, .125, s * (hw - .07)], M.panel);
    seams(g, length, wall - .3, [0, wall / 2 + .15, s * (hw - .065)], length / 2, 2);
  }
  const vault = new THREE.Mesh(new THREE.CylinderGeometry(hw, hw, length, 40, 1, true, 0, Math.PI), inner);
  vault.name = '_vault'; vault.rotation.z = Math.PI / 2; vault.scale.set(rise / hw, 1, 1); vault.position.y = wall; g.add(vault);
  // Ribs: elliptical frames every two metres.
  for (let x = -hl + 1; x <= hl - 1; x += 2) {
    const pts = []; for (let i = 0; i <= 24; i++) { const a = Math.PI * i / 24; pts.push([x, wall + Math.sin(a) * rise * .97, Math.cos(a) * (hw - .08)]); }
    tube(g, '_rib', pts, .045, M.panel, 32);
    for (const s of [-1, 1]) box(g, '_rib-post', [.1, wall, .1], [x, wall / 2, s * (hw - .08)], M.panel);
  }
  // Ceiling light strips, conduits, end walls.
  const lights = node(g, 'light_strips');
  for (const z of [-1.3, 1.3]) { box(lights, '_strip', [length - 1, .04, .18], [0, wall + rise * .93, z], M.lightStrip); box(lights, '_strip-housing', [length - .9, .06, .26], [0, wall + rise * .93 + .04, z], M.panel); }
  const conduitY = [1.75, 1.88, 2.0], conduitMat = [M.blue, M.yellow, M.orange];
  for (const s of [-1, 1]) conduitY.forEach((y, i) => { cyl(g, '_conduit', .03, .03, length - .4, [0, y, s * (hw - .2)], conduitMat[i], [0, 0, Math.PI / 2], 10); });
  for (const s of [-1, 1]) {
    const pts = [[-hw, 0], [hw, 0], [hw, wall]];
    for (let i = 1; i < 24; i++) { const a = Math.PI * i / 24; pts.push([Math.cos(a) * hw, wall + Math.sin(a) * rise]); }
    pts.push([-hw, wall]);
    extrude(g, '_end-wall', pts, .12, [s * hl, 0, 0], inner, [0, Math.PI / 2, 0], 0);
  }
  // Hatch at +X end with a hinged door.
  const hatch = node(g, 'hatch', [hl - .08, 0, 0]);
  rbox(hatch, '_hatch-frame', [.18, 2.2, 1.5], [0, 1.15, 0], M.panel, .08);
  const door = node(hatch, 'hatch_door', [-.1, 0, -.6]);
  rbox(door, '_door', [.08, 1.9, 1.15], [0, 1.1, .6], M.hullWarm, .06);
  cyl(door, '_wheel-hub', .05, .05, .06, [-.06, 1.15, .6], M.steel, [0, 0, Math.PI / 2], 12);
  torus(door, '_wheel', .18, .02, [-.08, 1.15, .6], M.orange, [0, Math.PI / 2, 0]);
  rbox(door, '_door-window', [.02, .35, .35], [-.05, 1.6, .6], M.glass, .05);
  box(hatch, '_hatch-sign', [.02, .1, 1.3], [-.1, 2.3, 0], M.yellow);
  // Portholes showing a bright Mars afternoon.
  for (const [nm, x, s] of [['window_l', -hl / 2, -1], ['window_r', hl / 2, 1]]) {
    const w = node(g, nm, [x, 1.35, s * (hw - .07)]);
    torus(w, '_porthole-ring', .36, .05, [0, 0, 0], M.alu);
    cyl(w, '_porthole-glass', .34, .34, .02, [0, 0, s * .02], windowMars, [Math.PI / 2, 0, 0], 28);
    bolts(w, Array.from({length: 8}, (_, i) => [Math.cos(i * Math.PI / 4) * .43, Math.sin(i * Math.PI / 4) * .43, -s * .04]));
  }
  // Wall-mounted details: vents, fire extinguisher, handrails, labels.
  for (let x = -hl + 2; x < hl - 1; x += 4) for (const s of [-1, 1]) {
    rbox(g, '_vent', [.5, .22, .05], [x, .55, s * (hw - .09)], M.panel, .02);
    for (let i = 0; i < 4; i++) box(g, '_vent-slot', [.42, .02, .02], [x, .48 + i * .05, s * (hw - .12)], M.dark);
    cyl(g, '_handrail', .022, .022, 1.4, [x + 1, 1.25, s * (hw - .18)], M.yellow, [0, 0, Math.PI / 2], 8);
  }
  extraDressing(g, dressing, hl, hw, wall);
  return g;
}

function extraDressing(g, dressing, hl, hw) {
  if (dressing === 'quarters') {
    // Galley counter and crew lockers along the back wall.
    for (let i = 0; i < 4; i++) {
      rbox(g, '_locker', [.7, 1.8, .55], [-hl + 1.6 + i * .76, .9, -hw + .38], i % 2 ? M.hullWarm : M.hull, .03);
      box(g, '_locker-handle', [.04, .3, .03], [-hl + 1.85 + i * .76, 1, -hw + .67], M.steel);
      box(g, '_locker-tag', [.3, .08, .01], [-hl + 1.6 + i * .76, 1.55, -hw + .66], [M.orange, M.blue, M.green, M.yellow][i]);
    }
  }
  if (dressing === 'greenhouse') {
    // Wall shelves of seedling trays and hanging herb pots: the greenhouse is already a working farm.
    const pot = Object.assign(M.orange.clone(), {name: 'terracotta'}); pot.color.set(0xc4673d);
    for (const s of [-1, 1]) for (let x = -hl + 2.5; x < hl - 2; x += 3.2) {
      rbox(g, '_wall-shelf', [2.2, .05, .4], [x, 1.45, s * (hw - .3)], M.alu, .01);
      for (let i = 0; i < 4; i++) {
        cyl(g, '_pot', .09, .07, .14, [x - .75 + i * .5, 1.55, s * (hw - .3)], pot, null, 12);
        sphere(g, '_pot-plant', .12, [x - .75 + i * .5, 1.68, s * (hw - .3)], i % 2 ? M.leaf : M.leafDark, [1, .7, 1], 10);
      }
    }
    for (const x of [-hl + 3, 0, hl - 3]) { cyl(g, '_hanger', .006, .006, .7, [x, 3.6, 0], M.steel, null, 4); cyl(g, '_hang-pot', .12, .09, .14, [x, 3.2, 0], pot, null, 12); sphere(g, '_hang-plant', .18, [x, 3.08, 0], M.leaf, [1, .8, 1], 10); }
  }
  if (dressing === 'service') {
    for (let i = 0; i < 3; i++) {
      rbox(g, '_cabinet', [1.1, 1.1, .6], [-hl + 1.5 + i * 1.2, .55, hw - .4], M.panel, .03);
      box(g, '_cabinet-drawer', [1, .02, .01], [-hl + 1.5 + i * 1.2, .7, hw - .09], M.dark);
      box(g, '_cabinet-drawer', [1, .02, .01], [-hl + 1.5 + i * 1.2, .4, hw - .09], M.dark);
    }
  }
}

// ---- Radiation shelter kit -------------------------------------------------------------

/** Crew storm shelter: an open frame with eight shield sockets (two roof sockets count most). */
export function stormShelter() {
  const slots = ['back_1', 'back_2', 'left_1', 'left_2', 'right_1', 'right_2', 'roof_1', 'roof_2'];
  const g = root('storm-shelter', 'Crew storm shelter frame with eight shield sockets', [...slots.map(s => `slot_${s}`), ...slots.map(s => `mount_${s}`), 'dose_screen', 'seat_1', 'seat_2', 'seat_3', 'seat_4', 'entry_light'],
    {footprint: [3.4, 2.6]});
  const W = 3.4, D = 2.6, H = 2.3;
  box(g, '_deck', [W, .1, D], [0, .05, 0], M.dark);
  rbox(g, '_deck-mat', [W - .2, .03, D - .2], [0, .115, 0], M.foam, .01);
  for (const x of [-W / 2, W / 2]) for (const z of [-D / 2, D / 2]) rbox(g, '_post', [.12, H, .12], [x, H / 2, z], M.alu, .02);
  for (const z of [-D / 2, D / 2]) rbox(g, '_beam', [W, .12, .12], [0, H, z], M.alu, .02);
  for (const x of [-W / 2, W / 2]) rbox(g, '_beam', [.12, .12, D], [x, H, 0], M.alu, .02);
  rbox(g, '_beam', [W, .1, .1], [0, H, 0], M.alu, .02);
  // Seats with harness straps.
  for (let i = 0; i < 4; i++) {
    const x = -1.2 + i * .8, s = node(g, `seat_${i + 1}`, [x, .12, -.55]);
    rbox(s, '_seat', [.6, .12, .55], [0, .32, 0], M.fabricBlue, .04);
    rbox(s, '_seat-back', [.6, .7, .1], [0, .7, -.25], M.fabricBlue, .04);
    for (const dx of [-.15, .15]) box(s, '_strap', [.05, .6, .01], [dx, .7, -.19], M.orange);
    for (const dx of [-.22, .22]) cyl(s, '_seat-leg', .025, .025, .3, [dx, .15, 0], M.steel, null, 8);
  }
  // Sockets: placement outline (visible guide) + mount point where shields snap.
  const defs = {
    back_1: [[-.85, 1.1, -D / 2 - .06], [0, 0, 0]], back_2: [[.85, 1.1, -D / 2 - .06], [0, 0, 0]],
    left_1: [[-W / 2 - .06, 1.1, -.62], [0, Math.PI / 2, 0]], left_2: [[-W / 2 - .06, 1.1, .62], [0, Math.PI / 2, 0]],
    right_1: [[W / 2 + .06, 1.1, -.62], [0, -Math.PI / 2, 0]], right_2: [[W / 2 + .06, 1.1, .62], [0, -Math.PI / 2, 0]],
    roof_1: [[-.85, H + .1, 0], [-Math.PI / 2, 0, 0]], roof_2: [[.85, H + .1, 0], [-Math.PI / 2, 0, 0]],
  };
  for (const [id, [pos, rot]] of Object.entries(defs)) {
    const slot = node(g, `slot_${id}`, pos, rot);
    const outline = new THREE.Group(); outline.name = `outline_${id}`; slot.add(outline);
    for (const [w, h, x, y] of [[1.5, .04, 0, 1], [1.5, .04, 0, -1], [.04, 2.1, 1, 0], [.04, 2.1, -1, 0]]) box(outline, '_outline', [w, h, .02], [x * .75, y * 1.05, 0], M.yellow);
    node(slot, `mount_${id}`, [0, -.95, 0]); // shields are built standing on their base; this centres them in the slot
    // Small clamp hardware.
    for (const x of [-.7, .7]) rbox(slot, '_clamp', [.08, .12, .06], [x, .98, -.02], M.steel, .01);
  }
  // Dose display mounted inside on the back beam.
  const screen = node(g, 'dose_screen', [0, 1.95, -D / 2 + .1]);
  rbox(screen, '_dose-body', [.6, .34, .06], [0, 0, 0], M.panel, .02);
  box(screen, 'dose_display', [.52, .26, .01], [0, 0, .035], M.screen);
  const light = node(g, 'entry_light', [0, H - .08, D / 2]);
  box(light, 'entry_lamp', [.5, .05, .08], [0, 0, 0], M.ledAmber);
  return g;
}

/** Tall soft water wall (about 60 kg of water) with carry handle, straps and a drinking valve. Fills one shelter slot. */
export function waterBag() {
  const g = root('water-wall-bag', 'Soft water wall bladder used as radiation shielding', ['handle', 'drink_valve', 'water_level'], {massKg: 60, slotSize: [1.4, 1.9]});
  const body = rbox(g, '_bladder', [1.36, 1.86, .3], [0, .95, 0], M.bladder, .14);
  const level = node(g, 'water_level'); rbox(level, 'water_core', [1.2, 1.6, .2], [0, .88, 0], M.water, .08);
  for (const y of [.35, .95, 1.55]) rbox(g, '_strap', [1.4, .07, .34], [0, y, 0], M.dark, .02);
  for (const x of [-.5, .5]) rbox(g, '_strap-v', [.07, 1.9, .335], [x, .95, 0], M.dark, .02);
  for (let i = 0; i < 4; i++) cyl(g, '_quilt', .05, .05, .02, [-.25 + (i % 2) * .5, .65 + Math.floor(i / 2) * .6, .155], M.bladder, [Math.PI / 2, 0, 0], 12);
  const handle = node(g, 'handle', [0, 1.9, 0]); tube(handle, '_grip', [[-.25, 0, 0], [-.18, .12, 0], [.18, .12, 0], [.25, 0, 0]], .03, M.orange, 16);
  const valve = node(g, 'drink_valve', [.55, .25, .17]); cyl(valve, '_valve', .045, .045, .1, [0, 0, 0], M.blue, [Math.PI / 2, 0, 0], 12); cyl(valve, '_valve-cap', .055, .055, .03, [0, 0, .06], M.blue, [Math.PI / 2, 0, 0], 12);
  rbox(g, '_label', [.5, .2, .01], [0, 1.25, .16], M.hull, .02); box(g, '_label-drop', [.1, .12, .012], [-.15, 1.25, .162], M.blue); box(g, '_label-text', [.22, .03, .012], [.08, 1.25, .162], M.dark);
  return g;
}

/** Hydrogen-rich polyethylene tile with carry handles. */
export function polyPanel() {
  const g = root('poly-shield-panel', 'High-density polyethylene radiation shield tile', ['handle_l', 'handle_r', 'bolt_holes'], {massKg: 9});
  rbox(g, '_tile', [1.4, 1.9, .1], [0, .95, 0], M.poly, .04);
  seams(g, 1.3, 1.8, [0, .95, .052], 3, 4, M.panel);
  const holes = node(g, 'bolt_holes'); bolts(holes, [[-.62, .1, .06], [.62, .1, .06], [-.62, 1.8, .06], [.62, 1.8, .06]], .025, M.steel);
  for (const [nm, x] of [['handle_l', -.4], ['handle_r', .4]]) { const h = node(g, nm, [x, 1.2, .07]); tube(h, '_handle', [[0, -.12, 0], [0, -.1, .07], [0, .1, .07], [0, .12, 0]], .018, M.dark, 12); }
  box(g, '_tag', [.4, .12, .01], [0, 1.6, .056], M.blue); box(g, '_tag-text', [.3, .03, .012], [0, 1.6, .057], M.hull);
  return g;
}

/** Three NASA-style cargo transfer bags (clothes, food packs) strapped to a light frame. Fills one shelter slot. */
export function cargoStack() {
  const g = root('cargo-shield-stack', 'Strapped stack of cargo transfer bags used as shielding', ['handle', 'bag_1', 'bag_2', 'bag_3'], {massKg: 36, slotSize: [1.4, 1.9]});
  for (const x of [-.66, .66]) rbox(g, '_frame', [.05, 1.9, .05], [x, .95, -.18], M.alu, .01);
  rbox(g, '_frame-top', [1.38, .05, .05], [0, 1.88, -.18], M.alu, .01);
  const colors = [M.fabric, M.fabricBlue, M.fabric];
  for (let i = 0; i < 3; i++) {
    const bag = node(g, `bag_${i + 1}`, [0, .32 + i * .62, 0]);
    rbox(bag, '_bag', [1.3, .58, .4], [0, 0, 0], colors[i], .12);
    for (const x of [-.4, .4]) box(bag, '_webbing', [.06, .6, .42], [x, 0, 0], i === 1 ? M.fabric : M.fabricBlue);
    box(bag, '_zip', [1.1, .015, .02], [0, .29, 0], M.dark);
    rbox(bag, '_id-card', [.24, .14, .01], [.15, 0, .205], M.hull, .01); box(bag, '_barcode', [.16, .035, .012], [.15, -.02, .207], M.dark);
    box(bag, '_tag', [.08, .08, .012], [-.15, 0, .205], [M.orange, M.green, M.yellow][i]);
  }
  for (const y of [.3, 1.55]) box(g, '_cinch', [1.42, .05, .44], [0, y, 0], M.orange);
  const handle = node(g, 'handle', [0, 1.9, 0]); tube(handle, '_grip', [[-.22, 0, 0], [-.15, .1, 0], [.15, .1, 0], [.22, 0, 0]], .025, M.dark, 16);
  return g;
}

/** Space-weather console with a sun graphic, a countdown screen and an alert beacon. */
export function weatherConsole() {
  const g = root('space-weather-console', 'Space weather alert console', ['main_screen', 'alert_beacon', 'button_ack'], {});
  rbox(g, '_pedestal', [.9, .95, .55], [0, .475, 0], M.panel, .04);
  rbox(g, '_desk', [1.1, .07, .65], [0, .98, .06], M.dark, .02, [-.18, 0, 0]);
  for (let i = 0; i < 6; i++) rbox(g, '_key', [.1, .025, .08], [-.3 + i * .12, 1.01, .15], i === 2 ? M.orange : M.panel, .01, [-.18, 0, 0]);
  const screen = node(g, 'main_screen', [0, 1.45, -.12]);
  rbox(screen, '_bezel', [1.05, .65, .06], [0, 0, 0], M.dark, .03);
  box(screen, 'display', [.95, .55, .01], [0, 0, .035], M.screen);
  sphere(screen, '_sun-glyph', .1, [-.28, .08, .045], M.ledAmber, [1, 1, .15], 16);
  for (let i = 0; i < 5; i++) box(screen, '_bar', [.06, .05 + i * .05, .005], [.05 + i * .09, -.15 + i * .025, .042], i > 2 ? M.ledRed : M.ledGreen);
  const beacon = node(g, 'alert_beacon', [.42, 1.82, -.12]); cyl(beacon, '_beacon-base', .06, .07, .05, [0, 0, 0], M.dark, null, 14); sphere(beacon, 'beacon_lamp', .06, [0, .06, 0], M.ledRed, [1, 1.3, 1], 14);
  const ack = node(g, 'button_ack', [.32, 1.05, .2]); cyl(ack, 'ack_cap', .045, .05, .03, [0, 0, 0], M.red, [-.18, 0, 0], 16);
  return g;
}

/** Open stowage rack with three shelves. Items sit on named shelf anchors. */
export function stowageRack() {
  const g = root('stowage-rack', 'Open stowage rack with labelled shelves', ['shelf_1', 'shelf_2', 'shelf_3'], {});
  for (const x of [-1, 1]) for (const z of [-.3, .3]) rbox(g, '_upright', [.06, 2, .06], [x, 1, z], M.alu, .01);
  [.08, .78, 1.48].forEach((y, i) => { rbox(g, '_shelf', [2.1, .05, .7], [0, y, 0], M.panel, .01); box(g, '_shelf-lip', [2.1, .08, .02], [0, y + .04, .35], M.yellow); node(g, `shelf_${i + 1}`, [0, y + .03, 0]); });
  box(g, '_back-net', [2, 1.9, .01], [0, 1, -.33], M.dark);
  return g;
}

/** Drinking-water station with a tank level indicator. */
export function waterStation() {
  const g = root('drinking-water-station', 'Crew drinking water dispenser with level gauge', ['level_fill', 'tap'], {});
  rbox(g, '_cabinet', [.7, 1.3, .5], [0, .65, 0], M.hull, .04);
  rbox(g, '_window', [.12, .9, .02], [-.2, .75, .26], M.glass, .01);
  const fill = node(g, 'level_fill', [-.2, .32, .262]); box(fill, 'level_bar', [.08, .85, .01], [0, .425, 0], M.water);
  const tap = node(g, 'tap', [.12, .9, .3]); cyl(tap, '_tap', .025, .025, .14, [0, 0, 0], M.alu, [Math.PI / 2, 0, 0], 10); cyl(tap, '_tap-head', .04, .04, .04, [0, .05, .03], M.blue, null, 12);
  box(g, '_drip-tray', [.4, .03, .2], [.1, .5, .3], M.steel);
  box(g, '_label', [.3, .1, .01], [.12, 1.15, .255], M.blue);
  return g;
}

/**
 * Stylised crew member in a flight suit. Limbs hang from named pivots so the game can animate
 * walking, reaching and waving in code. Hair styles, helmet and life-support pack are toggled per person.
 */
export function crewMember() {
  const g = root('crew-member', 'Stylised crew member with poseable limbs and swappable hair, helmet and pack',
    ['hips', 'torso', 'head', 'arm_l', 'arm_r', 'leg_l', 'leg_r', 'hair_short', 'hair_bun', 'hair_curly', 'hair_cap', 'helmet', 'pack', 'badge'], {height: 1.72});
  const suit = Object.assign(M.fabricBlue.clone(), {name: 'crew-suit'});
  const skin = Object.assign(M.hullWarm.clone(), {name: 'crew-skin'}); skin.color.set(0xc68a63); skin.roughness = .6;
  const hair = Object.assign(M.dark.clone(), {name: 'crew-hair'}); hair.color.set(0x2b1d14); hair.roughness = .85;
  const hips = node(g, 'hips', [0, .86, 0]);
  rbox(hips, '_pelvis', [.34, .2, .2], [0, 0, 0], suit, .08);
  box(hips, '_belt', [.35, .045, .21], [0, .075, 0], M.dark);
  for (const [nm, x] of [['leg_l', -.1], ['leg_r', .1]]) {
    const leg = node(hips, nm, [x, -.06, 0]);
    rbox(leg, '_thigh', [.13, .44, .15], [0, -.22, 0], suit, .06);
    rbox(leg, '_shin', [.12, .36, .13], [0, -.58, 0], suit, .05);
    rbox(leg, '_boot', [.14, .1, .24], [0, -.78, .04], M.dark, .04);
  }
  const torso = node(hips, 'torso', [0, .1, 0]);
  rbox(torso, '_chest', [.4, .46, .24], [0, .24, 0], suit, .1);
  box(torso, '_zip', [.02, .4, .01], [0, .25, .121], M.alu);
  const badge = node(torso, 'badge', [-.1, .36, .122]); cyl(badge, '_patch', .045, .045, .01, [0, 0, 0], M.blue, [Math.PI / 2, 0, 0], 14);
  box(torso, '_flag', [.07, .045, .01], [.12, .36, .122], M.red);
  for (const [nm, x, s] of [['arm_l', -.25, -1], ['arm_r', .25, 1]]) {
    const arm = node(torso, nm, [x, .42, 0]);
    rbox(arm, '_upper', [.11, .32, .12], [0, -.16, 0], suit, .05);
    rbox(arm, '_lower', [.1, .28, .11], [0, -.45, 0], suit, .05);
    sphere(arm, '_hand', .055, [0, -.62, 0], skin, [1, 1.1, .8], 12);
    box(arm, '_shoulder-stripe', [.115, .04, .125], [0, -.05, 0], M.orange);
  }
  const head = node(torso, 'head', [0, .5, 0]);
  cyl(head, '_neck', .05, .055, .08, [0, .02, 0], skin, null, 12);
  sphere(head, '_head', .15, [0, .19, 0], skin, [1, 1.08, 1.02], 22);
  for (const x of [-.055, .055]) { sphere(head, '_eye', .022, [x, .21, .135], M.rubber, null, 10); sphere(head, '_eye-glint', .007, [x + .008, .22, .155], M.lightStrip, null, 6); }
  tube(head, '_smile', [[-.04, .14, .14], [0, .125, .15], [.04, .14, .14]], .008, M.rubber, 8);
  const short = node(head, 'hair_short'); sphere(short, '_hair', .158, [0, .23, -.01], hair, [1.02, .8, 1.05], 18);
  const bun = node(head, 'hair_bun'); sphere(bun, '_hair', .158, [0, .23, -.01], hair, [1.02, .8, 1.05], 18); sphere(bun, '_bun', .07, [0, .3, -.13], hair, null, 12);
  const curly = node(head, 'hair_curly'); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; sphere(curly, '_curl', .07, [Math.cos(a) * .12, .27 + Math.sin(i * 1.7) * .02, Math.sin(a) * .11 - .02], hair, null, 10); }
  sphere(curly, '_curl', .1, [0, .32, -.02], hair, null, 12);
  const cap = node(head, 'hair_cap'); sphere(cap, '_cap', .16, [0, .24, 0], M.orange, [1.02, .72, 1.04], 18); box(cap, '_visor', [.2, .02, .12], [0, .2, .15], M.orange);
  const helmet = node(head, 'helmet'); sphere(helmet, '_shell', .23, [0, .19, 0], M.hull, null, 24); sphere(helmet, '_visor', .2, [0, .19, .05], M.visor, [1, .85, .85], 22);
  const pack = node(torso, 'pack', [0, .26, -.2]); rbox(pack, '_pack', [.38, .5, .18], [0, 0, 0], M.hull, .06); box(pack, '_pack-light', [.06, .06, .01], [.12, .18, -.091], M.ledGreen);
  return g;
}
