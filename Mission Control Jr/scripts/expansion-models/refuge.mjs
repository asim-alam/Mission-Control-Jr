// "A Place to Hide" v3 models: a partly prepared crew refuge and the three kinds of shielding work.
// Refuge layout (meters, origin at floor centre, door facing +Z towards the habitat):
//   x -1.8 … 1.8 (side wall at x = -1.8), z -1.4 … 1.4 (back wall at z = -1.4), height 2.3.
import {M, box, rbox, cyl, sphere, torus, tube, node, root, bolts, seams, hazard} from './kit.mjs';

const W = 3.6, D = 2.8, H = 2.3;
export const REFUGE = {
  seats: {A: [-1.3, -.45], B: [-.45, -.45], C: [.45, -.45], D: [1.3, -.45], E: [-1.05, .55], F: [1.05, .85]},
  rack: {back_l: [[-.85, -1.18], 0], back_r: [[.85, -1.18], 0], side_l: [[-1.58, .05], Math.PI / 2]},
  rails: {roof_l: [-.9, 'roof'], roof_r: [.9, 'roof'], back_l: [-.9, 'back'], back_r: [.9, 'back']},
  zones: {shelf_l: [[-1.25, 2.02, .55], 'shelf'], shelf_r: [[1.25, 2.02, .55], 'shelf'], stack_side: [[-1.55, 0, 1.0], 'floor'], stack_back: [[.85, 0, -.82], 'floor'], stack_door: [[0, 0, 1.05], 'floor']},
};

export function refuge() {
  const nodes = ['roof_cutaway', 'vent', 'vent_fan', 'door_frame', 'refuge_screen', 'refuge_display',
    ...Object.keys(REFUGE.seats).map(s => `seat_${s}`), ...Object.keys(REFUGE.rack).map(s => `rack_${s}`),
    ...Object.keys(REFUGE.rails).flatMap(s => [`rail_${s}`, `rail_${s}_1`, `rail_${s}_2`]),
    ...Object.keys(REFUGE.zones).flatMap(z => [`zone_${z}`, `strap_${z}`]), ...['roof_l', 'roof_r', 'back_l', 'back_r', 'side_l', 'front'].map(s => `surface_${s}`)];
  const g = root('refuge-v3', 'Crew radiation refuge with water-rack mounts, panel rails, stacking shelves, vent and seats', nodes, {footprint: [W, D]});
  // Floor and frame.
  box(g, '_deck', [W, .1, D], [0, .05, 0], M.dark);
  rbox(g, '_deck-mat', [W - .2, .03, D - .2], [0, .115, 0], M.foam, .01);
  for (const x of [-W / 2, W / 2]) for (const z of [-D / 2, D / 2]) rbox(g, '_post', [.12, H, .12], [x, H / 2, z], M.alu, .02);
  // Back wall and side wall: thin habitat bulkhead (this is the weak part the player reinforces).
  const backL = node(g, 'surface_back_l', [-.9, H / 2, -D / 2]), backR = node(g, 'surface_back_r', [.9, H / 2, -D / 2]);
  for (const b of [backL, backR]) { box(b, '_wall', [W / 2, H, .06], [0, 0, 0], M.hullWarm); seams(b, W / 2 - .1, H - .1, [0, 0, .031], 2, 3, M.panel); }
  const side = node(g, 'surface_side_l', [-W / 2, H / 2, 0]); box(side, '_wall', [.06, H, D], [0, 0, 0], M.hullWarm);
  rbox(g, '_wall-right', [.14, H, D], [W / 2 - .07, H / 2, 0], M.panel, .03); seams(g, .01, H - .2, [W / 2 - .145, H / 2, 0], 1, 4, M.dark);
  const front = node(g, 'surface_front', [0, H / 2, D / 2]);
  // Front: open door frame in the middle, low lockers either side (the habitat itself is beyond).
  for (const x of [-1.25, 1.25]) { rbox(front, '_locker', [1.1, H, .3], [x, 0, -.15], M.panel, .03); seams(front, 1, H - .2, [x, 0, .005], 2, 4, M.dark); }
  const door = node(g, 'door_frame', [0, 0, D / 2]);
  for (const x of [-.72, .72]) rbox(door, '_jamb', [.12, H, .2], [x, H / 2, -.1], M.alu, .02);
  rbox(door, '_lintel', [1.56, .14, .2], [0, H - .07, -.1], M.alu, .02);
  hazard(door, 1.3, .1, [0, H - .2, .01], 8);
  box(door, 'door_lamp', [.5, .05, .06], [0, H - .32, .02], M.ledAmber);
  // Roof (fades out for the cutaway view).
  const roof = node(g, 'roof_cutaway', [0, H, 0]);
  const roofL = node(roof, 'surface_roof_l', [-.9, 0, 0]), roofR = node(roof, 'surface_roof_r', [.9, 0, 0]);
  for (const r of [roofL, roofR]) { box(r, 'roof_sheet', [W / 2, .06, D], [0, .03, 0], M.hullWarm); }
  for (const z of [-D / 2, D / 2, 0]) rbox(g, '_beam', [W, .1, .1], [0, H - .05, z], M.alu, .02);
  // Air vent low on the side wall, with a turning fan.
  const vent = node(g, 'vent', [-W / 2 + .05, .38, .95], [0, Math.PI / 2, 0]);
  rbox(vent, '_vent-box', [.5, .4, .06], [0, 0, 0], M.panel, .02);
  for (let i = 0; i < 5; i++) box(vent, '_louvre', [.42, .025, .03], [0, -.14 + i * .07, .035], M.dark);
  const fan = node(vent, 'vent_fan', [0, 0, .02]); for (let i = 0; i < 4; i++) box(fan, '_blade', [.3, .05, .01], [0, 0, 0], M.steel, [0, 0, i * Math.PI / 4]);
  // Seats (fold-down crew seats with straps).
  for (const [id, [x, z]] of Object.entries(REFUGE.seats)) {
    const s = node(g, `seat_${id}`, [x, .12, z]);
    rbox(s, '_seat', [.55, .1, .5], [0, .32, 0], M.fabricBlue, .04);
    rbox(s, '_seat-back', [.55, .55, .08], [0, .62, -.22], M.fabricBlue, .03);
    for (const dx of [-.14, .14]) box(s, '_strap', [.045, .5, .01], [dx, .62, -.17], M.orange);
    for (const dx of [-.2, .2]) cyl(s, '_seat-leg', .022, .022, .28, [dx, .14, 0], M.steel, null, 8);
    rbox(s, '_seat-tag', [.16, .1, .01], [0, .86, -.17], M.hull, .01);
  }
  // Rack mounting plates (yellow corner marks show where a rack can go).
  for (const [id, [[x, z], yaw]] of Object.entries(REFUGE.rack)) {
    const r = node(g, `rack_${id}`, [x, .12, z], [0, yaw, 0]);
    for (const dx of [-.62, .62]) box(r, '_rack-mark', [.12, .012, .4], [dx, .002, 0], M.yellow);
    bolts(r, [[-.5, .01, -.15], [.5, .01, -.15], [-.5, .01, .15], [.5, .01, .15]], .02, M.steel, 'y');
  }
  // Panel rails: two slots per surface (roof slots lie flat under the roof, back slots stand on the wall).
  for (const [id, [x, kind]] of Object.entries(REFUGE.rails)) {
    const rail = node(g, `rail_${id}`, kind === 'roof' ? [x, H - .14, 0] : [x, .12, -D / 2 + .1]);
    for (const k of [1, 2]) {
      const pos = kind === 'roof' ? [0, 0, k === 1 ? -.62 : .62] : [0, k === 1 ? .05 : 1.08, 0];
      const rot = kind === 'roof' ? [-Math.PI / 2, 0, 0] : [0, 0, 0];
      node(rail, `rail_${id}_${k}`, pos, rot);
    }
    if (kind === 'roof') for (const dx of [-.62, .62]) box(rail, '_rail', [.05, .05, D - .2], [dx, 0, 0], M.steel);
    else for (const dx of [-.64, .64]) box(rail, '_rail', [.05, 2.05, .06], [dx, 1.02, 0], M.steel);
  }
  // Stacking zones: overhead shelves with a lip, floor pads with tie-down rings, and a strap for each.
  for (const [id, [pos, kind]] of Object.entries(REFUGE.zones)) {
    const z = node(g, `zone_${id}`, pos);
    if (kind === 'shelf') { rbox(z, '_shelf', [1, .04, 1.1], [0, -.03, -.3], M.panel, .01); box(z, '_shelf-lip', [1, .1, .02], [0, .02, .24], M.yellow); }
    else { rbox(z, '_pad', [.75, .02, .6], [0, .125, 0], M.dark, .01); for (const dx of [-.34, .34]) torus(z, '_tie-ring', .04, .01, [dx, .14, .28], M.steel, [Math.PI / 2, 0, 0]); }
    const strap = node(z, `strap_${id}`, kind === 'shelf' ? [0, .2, -.3] : [0, .6, 0]);
    box(strap, 'strap_band', kind === 'shelf' ? [1.02, .05, 1.12] : [.78, 1.1, .64], [0, 0, 0], M.orange).scale.set(1, kind === 'shelf' ? 1 : .03, 1);
  }
  // Refuge sensor screen inside, above the door.
  const screen = node(g, 'refuge_screen', [0, H - .55, D / 2 - .3]);
  rbox(screen, '_screen-body', [.7, .36, .06], [0, 0, 0], M.panel, .02);
  box(screen, 'refuge_display', [.62, .28, .01], [0, 0, -.035], M.screen);
  return g;
}

/** Floor-standing rack for six water containers, with a hinged latch bar and a drinking tap. */
export function waterRack() {
  const spots = [1, 2, 3, 4, 5, 6].map(i => `spot_${i}`);
  const g = root('water-rack', 'Six-place water container rack with latch bar and tap', [...spots, 'latch_bar', 'tap'], {});
  for (const x of [-.6, .6]) for (const z of [-.16, .16]) rbox(g, '_upright', [.05, 1.9, .05], [x, .95, z], M.alu, .01);
  for (const y of [.04, .66, 1.28, 1.88]) { rbox(g, '_shelf', [1.26, .04, .38], [0, y, 0], M.panel, .01); }
  box(g, '_back', [1.2, 1.86, .01], [0, .95, -.18], M.dark);
  for (let i = 0; i < 6; i++) node(g, `spot_${i + 1}`, [i % 2 ? .3 : -.3, .06 + Math.floor(i / 2) * .62, 0]);
  const latch = node(g, 'latch_bar', [-.6, 0, .2]);
  for (const y of [.42, 1.04, 1.64]) rbox(latch, '_bar', [1.24, .05, .03], [.6, y, 0], M.orange, .01);
  const tap = node(g, 'tap', [.66, .3, .1]);
  cyl(tap, '_tap-pipe', .02, .02, .2, [0, 0, 0], M.alu, [0, 0, Math.PI / 2], 10); cyl(tap, '_tap-head', .035, .035, .05, [.1, 0, 0], M.blue, null, 12);
  rbox(g, '_label', [.4, .14, .01], [0, 1.93, .19], M.blue, .01);
  return g;
}

/** 20-litre water container (about 20 kg when full) with a handle and a cap. */
export function waterContainer() {
  const g = root('water-container', 'Twenty-litre drinking water container', ['handle', 'cap', 'water_level'], {massKg: 20});
  rbox(g, '_shell', [.5, .52, .3], [0, .27, 0], M.bladder, .06);
  const level = node(g, 'water_level'); rbox(level, 'water_core', [.44, .42, .24], [0, .24, 0], M.water, .05);
  for (const y of [.12, .42]) box(g, '_rib', [.51, .03, .31], [0, y, 0], M.bladder);
  const handle = node(g, 'handle', [0, .54, 0]); tube(handle, '_grip', [[-.15, 0, 0], [-.1, .08, 0], [.1, .08, 0], [.15, 0, 0]], .02, M.dark, 12);
  const cap = node(g, 'cap', [.17, .55, 0]); cyl(cap, '_cap', .04, .04, .05, [0, 0, 0], M.blue, null, 12);
  rbox(g, '_label', [.2, .12, .01], [0, .3, .152], M.hull, .01); box(g, '_drop', [.05, .07, .012], [-.05, .3, .154], M.blue);
  return g;
}

/** Slim high-density polyethylene shield panel with two quarter-turn fasteners. */
export function shieldPanel() {
  const g = root('shield-panel', 'Polyethylene shield panel that slides into rails', ['fastener_l', 'fastener_r', 'grip'], {massKg: 14});
  rbox(g, '_slab', [1.2, 1.0, .07], [0, .5, 0], M.poly, .02);
  seams(g, 1.1, .9, [0, .5, .036], 3, 2, M.panel);
  for (const [nm, x] of [['fastener_l', -.52], ['fastener_r', .52]]) { const f = node(g, nm, [x, .9, .04]); cyl(f, 'fastener_knob', .04, .04, .03, [0, 0, 0], M.yellow, [Math.PI / 2, 0, 0], 10); box(f, '_slot', [.06, .012, .012], [0, 0, .016], M.dark); }
  const grip = node(g, 'grip', [0, .55, .04]); tube(grip, '_grip', [[-.15, 0, 0], [-.12, 0, .05], [.12, 0, .05], [.15, 0, 0]], .016, M.dark, 12);
  box(g, '_tag', [.3, .08, .01], [0, .22, .037], M.blue);
  return g;
}

/** Soft cargo bag of packed food and clothes, with webbing handles. */
export function supplyBag() {
  const g = root('supply-bag', 'Packed cargo transfer bag (food and clothing)', ['handle'], {massKg: 15});
  rbox(g, '_bag', [.7, .32, .5], [0, .16, 0], M.fabric, .08);
  for (const x of [-.2, .2]) box(g, '_webbing', [.05, .33, .52], [x, .16, 0], M.fabricBlue);
  box(g, '_zip', [.6, .012, .02], [0, .32, .1], M.dark);
  rbox(g, '_card', [.18, .1, .01], [.12, .17, .253], M.hull, .01); box(g, '_code', [.12, .025, .012], [.12, .15, .255], M.dark);
  box(g, '_tag', [.06, .06, .012], [-.12, .17, .253], M.orange);
  const handle = node(g, 'handle', [0, .33, 0]); tube(handle, '_grip', [[-.14, 0, 0], [-.1, .06, 0], [.1, .06, 0], [.14, 0, 0]], .015, M.fabricBlue, 10);
  return g;
}

/** Flat trolley with a push handle and six container spots. */
export function waterTrolley() {
  const spots = [1, 2, 3, 4, 5, 6].map(i => `cart_${i}`);
  const g = root('water-trolley', 'Push trolley for carrying water containers', [...spots, 'handle', 'wheel_1', 'wheel_2', 'wheel_3', 'wheel_4'], {});
  rbox(g, '_deck', [1.6, .06, .7], [0, .22, 0], M.panel, .02);
  box(g, '_lip', [1.6, .06, .02], [0, .27, .35], M.yellow); box(g, '_lip', [1.6, .06, .02], [0, .27, -.35], M.yellow);
  const h = node(g, 'handle', [.82, .22, 0]);
  for (const z of [-.28, .28]) rbox(h, '_handle-post', [.04, .8, .04], [0, .4, z], M.alu, .01);
  cyl(h, '_handle-bar', .025, .025, .62, [0, .8, 0], M.dark, [Math.PI / 2, 0, 0], 10);
  [[-.65, -.28], [-.65, .28], [.65, -.28], [.65, .28]].forEach(([x, z], i) => { const w = node(g, `wheel_${i + 1}`, [x, .09, z]); cyl(w, '_wheel', .09, .09, .05, [0, 0, 0], M.rubber, [Math.PI / 2, 0, 0], 14); cyl(w, '_hub', .03, .03, .06, [0, 0, 0], M.steel, [Math.PI / 2, 0, 0], 8); });
  for (let i = 0; i < 6; i++) node(g, `cart_${i + 1}`, [-.55 + (i % 3) * .55, .25, i < 3 ? -.17 : .17]);
  return g;
}

/** Flexible duct that moves the vent opening above a bag stack. */
export function ventDuct() {
  const g = root('vent-duct', 'Flexible vent duct extension with clamp', ['outlet'], {});
  tube(g, '_hose', [[0, .38, 0], [.12, .5, 0], [.16, 1.0, 0], [.12, 1.6, 0], [.1, 1.75, 0]], .12, M.alu, 30);
  for (let i = 0; i < 8; i++) torus(g, '_ring', .125, .008, [.14 + Math.sin(i) * .01, .55 + i * .15, 0], M.steel, [Math.PI / 2, 0, 0]);
  const outlet = node(g, 'outlet', [.1, 1.8, 0]); cyl(outlet, '_outlet', .15, .13, .08, [0, 0, 0], M.panel, null, 16);
  rbox(g, '_clamp', [.3, .3, .05], [0, .38, 0], M.orange, .02, [0, Math.PI / 2, 0]);
  return g;
}

export const DESIGNS = {
  'refuge-v3': refuge, 'water-rack': waterRack, 'water-container': waterContainer, 'shield-panel': shieldPanel,
  'supply-bag': supplyBag, 'water-trolley': waterTrolley, 'vent-duct': ventDuct,
};
