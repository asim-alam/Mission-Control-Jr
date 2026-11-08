// Greenhouse equipment and crops for "The Greenhouse Promise".
// Crops follow real plants grown by NASA in space: red romaine lettuce, mizuna and chile peppers.
import * as THREE from 'three';
import {M, box, rbox, cyl, sphere, torus, tube, node, bolts, seams, root, lathe, cone} from './kit.mjs';
import {habInterior} from './mars-hab.mjs';

const leafRed = Object.assign(M.leaf.clone(), {name: 'leaf-red-romaine'}); leafRed.color.set(0x9c2f4a);
const leafLight = Object.assign(M.leaf.clone(), {name: 'leaf-light'}); leafLight.color.set(0x7ccf5a);
const pepperGreen = Object.assign(M.leaf.clone(), {name: 'pepper-green'}); pepperGreen.color.set(0x3f8f2f);
const pillow = Object.assign(M.fabric.clone(), {name: 'plant-pillow'}); pillow.color.set(0xd8cfb8);
const bellows = Object.assign(M.glass.clone(), {name: 'bellows'}); bellows.color.set(0xe9f2ff); bellows.opacity = .22;

/** Veggie-style grow bed: LED bank on top, see-through bellows, six plant pillows, a light lever,
 *  a water valve wheel and a moisture dial. */
export function growBed() {
  const g = root('grow-bed', 'Veggie-style grow bed with LED bank, bellows, plant pillows, light lever, water valve and moisture dial',
    ['led_panel', 'led_glow', 'light_lever', 'valve_wheel', 'moisture_needle', 'water_spray', ...[1, 2, 3, 4, 5, 6].map(i => `plant_${i}`), 'nameplate'], {});
  rbox(g, '_cabinet', [1.8, .7, .9], [0, .35, 0], M.hull, .05);
  seams(g, 1.7, .6, [0, .35, .452], 3, 1);
  rbox(g, '_root-tray', [1.7, .1, .8], [0, .75, 0], M.panel, .03);
  rbox(g, '_root-mat', [1.6, .04, .7], [0, .815, 0], M.soil, .01);
  for (const x of [-.86, .86]) for (const z of [-.41, .41]) rbox(g, '_mast', [.06, .9, .06], [x, 1.25, z], M.alu, .01);
  // Bellows: folded clear curtain on three sides.
  for (let i = 0; i < 7; i++) {
    const y = .9 + i * .11;
    box(g, '_bellows-back', [1.68, .1, .01], [0, y, -.4], bellows);
    for (const x of [-.84, .84]) box(g, '_bellows-side', [.01, .1, .78], [x, y, 0], bellows);
    box(g, '_bellows-fold', [1.7, .008, .02], [0, y + .055, -.4], M.alu);
  }
  const led = node(g, 'led_panel', [0, 1.72, 0]);
  rbox(led, '_led-housing', [1.8, .1, .92], [0, 0, 0], M.panel, .03);
  const glow = node(led, 'led_glow', [0, -.055, 0]);
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) box(glow, '_led', [.2, .012, .1], [-.7 + i * .28, 0, -.3 + j * .2], (i + j) % 3 === 0 ? M.growBlue : M.growRed);
  for (const x of [-.6, .6]) cyl(led, '_fan', .07, .07, .03, [x, .06, 0], M.dark, null, 16);
  for (let i = 0; i < 6; i++) {
    const x = -.55 + (i % 3) * .55, z = i < 3 ? -.18 : .2;
    const p = node(g, `plant_${i + 1}`, [x, .84, z]);
    rbox(p, '_pillow', [.24, .07, .2], [0, .03, 0], pillow, .03);
  }
  // Front controls: light lever (left), moisture dial (middle), water valve wheel (right).
  rbox(g, '_control-plate', [1.7, .28, .05], [0, .55, .47], M.dark, .02);
  const lever = node(g, 'light_lever', [-.6, .55, .5]);
  cyl(lever, '_lever-hub', .05, .05, .05, [0, 0, 0], M.steel, [Math.PI / 2, 0, 0], 12);
  cyl(lever, '_lever-arm', .018, .018, .2, [0, .1, .03], M.alu, null, 8); sphere(lever, '_lever-knob', .04, [0, .2, .03], M.yellow, null, 12);
  for (const [i, m] of [M.dark, M.ledAmber, M.ledGreen].entries()) box(g, '_lever-mark', [.04, .02, .01], [-.6 + (i - 1) * .1, .68, .5], m);
  const dial = node(g, 'moisture_dial', [0, .55, .5]);
  cyl(dial, '_dial-face', .1, .1, .02, [0, 0, 0], M.hull, [Math.PI / 2, 0, 0], 24);
  torus(dial, '_dial-red-l', .085, .012, [0, 0, .012], M.ledRed, [0, 0, 2.4], .7);
  torus(dial, '_dial-green', .085, .012, [0, 0, .012], M.ledGreen, [0, 0, 1.0], 1.2);
  torus(dial, '_dial-blue', .085, .012, [0, 0, .012], M.blue, [0, 0, .3], .7);
  const needle = node(dial, 'moisture_needle', [0, 0, .02]); box(needle, '_needle', [.012, .08, .006], [0, .035, 0], M.red);
  const valve = node(g, 'valve_wheel', [.6, .55, .52]);
  torus(valve, '_wheel', .09, .015, [0, 0, 0], M.blue);
  for (let i = 0; i < 3; i++) box(valve, '_spoke', [.17, .015, .015], [0, 0, 0], M.blue, [0, 0, i * Math.PI / 3]);
  cyl(valve, '_wheel-hub', .025, .025, .03, [0, 0, 0], M.steel, [Math.PI / 2, 0, 0], 10);
  const spray = node(g, 'water_spray', [0, 1.1, 0]); for (const x of [-.55, 0, .55]) cyl(spray, '_drip-line', .012, .012, .05, [x, -.2, 0], M.blue, null, 6);
  tube(g, '_drip-pipe', [[.6, .55, .45], [.8, .7, .3], [.75, .9, 0], [0, .92, -.3], [-.75, .9, 0]], .015, M.blue, 24);
  const plate = node(g, 'nameplate', [0, .16, .455]); rbox(plate, '_plate', [.5, .12, .01], [0, 0, 0], M.panel, .02);
  return g;
}

function leafRosette(parent, mat, count, length, width, lift, tilt) {
  for (let i = 0; i < count; i++) {
    const a = i / count * Math.PI * 2 + (i % 2) * .3, holder = node(parent, `_leaf-holder`, [0, 0, 0], [0, a, 0]);
    const leaf = sphere(holder, '_leaf', .5, [0, lift + length * .35 * Math.sin(tilt), length * .45], mat, [width, .12, length], 10);
    leaf.rotation.x = -tilt;
  }
}
/** Red romaine lettuce rosette ('Outredgeous' was the first lettuce NASA astronauts ate in space, 2015). */
export function lettucePlant() {
  const g = root('lettuce-plant', 'Red romaine lettuce rosette', ['leaves', 'heart'], {});
  const leaves = node(g, 'leaves');
  leafRosette(leaves, leafRed, 7, .26, .12, .02, .7);
  leafRosette(leaves, M.leaf, 5, .2, .1, .05, .35);
  const heart = node(g, 'heart'); sphere(heart, '_heart', .06, [0, .1, 0], leafLight, [1, 1.3, 1], 12);
  return g;
}
/** Mizuna: a feathery Japanese mustard green, grown in NASA's Veggie chamber. */
export function mizunaPlant() {
  const g = root('mizuna-plant', 'Feathery mizuna greens', ['leaves'], {});
  const leaves = node(g, 'leaves');
  for (let i = 0; i < 11; i++) {
    const a = i / 11 * Math.PI * 2, r = .03, h = .2 + (i % 3) * .05;
    const stem = node(leaves, '_stem-holder', [Math.cos(a) * r, 0, Math.sin(a) * r], [Math.sin(a) * .5, 0, -Math.cos(a) * .5]);
    cyl(stem, '_stem', .006, .008, h, [0, h / 2, 0], leafLight, null, 5);
    for (let j = 0; j < 4; j++) sphere(stem, '_frond', .5, [(j % 2 ? .02 : -.02), h * (.45 + j * .15), 0], M.leafDark, [.05, .02, .03], 6);
  }
  return g;
}
/** Dwarf chile pepper bush (NASA astronauts harvested chile peppers on the ISS in 2021). Fruit nodes appear when ripe. */
export function pepperPlant() {
  const g = root('pepper-plant', 'Dwarf chile pepper bush with fruit', ['leaves', 'fruit', 'flowers'], {});
  cyl(g, '_trunk', .012, .016, .2, [0, .1, 0], M.leafDark, null, 6);
  const leaves = node(g, 'leaves');
  for (let i = 0; i < 14; i++) { const a = i * 2.4, y = .12 + (i % 5) * .045, r = .07 + (i % 3) * .025; sphere(leaves, '_leaf', .5, [Math.cos(a) * r, y, Math.sin(a) * r], pepperGreen, [.08, .025, .05], 8).rotation.y = a; }
  const flowers = node(g, 'flowers'); for (let i = 0; i < 4; i++) { const a = i * 1.7; sphere(flowers, '_flower', .015, [Math.cos(a) * .09, .26, Math.sin(a) * .09], M.hull, null, 6); }
  const fruit = node(g, 'fruit');
  for (let i = 0; i < 5; i++) { const a = i * 1.3 + .4; cone(fruit, '_pepper', .018, .08, [Math.cos(a) * .1, .17 + (i % 2) * .05, Math.sin(a) * .1], M.pepper, [Math.PI, 0, .3], 10); }
  return g;
}

/** Recycled-water tank with a sight-glass level and a gauge. */
export function waterTank() {
  const g = root('greenhouse-water-tank', 'Recycled water tank with sight glass', ['level', 'gauge_needle'], {});
  lathe(g, '_tank', [[0, 0], [.42, 0], [.45, .05], [.45, 1.5], [.4, 1.6], [0, 1.62]], [0, 0, 0], M.hull, 28);
  for (const y of [.3, 1.3]) torus(g, '_band', .455, .02, [0, y, 0], M.steel, [Math.PI / 2, 0, 0]);
  rbox(g, '_glass-frame', [.16, 1.2, .06], [0, .8, .44], M.steel, .02);
  rbox(g, '_glass', [.1, 1.12, .02], [0, .8, .47], M.glass, .01);
  const level = node(g, 'level', [0, .24, .465]); box(level, 'level_water', [.08, 1.1, .015], [0, .55, 0], M.water);
  for (let i = 0; i <= 4; i++) box(g, '_tick', [.05, .008, .01], [.07, .26 + i * .27, .48], M.dark);
  rbox(g, '_label', [.4, .14, .01], [0, 1.5, .44], M.blue, .02);
  for (const a of [0, 2.1, 4.2]) cyl(g, '_leg', .03, .03, .12, [Math.cos(a) * .34, -.04, Math.sin(a) * .34], M.steel, null, 8);
  return g;
}

/** Wall irrigation line with an isolation valve wheel and a hose segment that can be swapped. */
export function irrigationLine() {
  const g = root('irrigation-line', 'Wall irrigation line with isolation valve and swappable hose', ['isolation_valve', 'hose_segment', 'hose_mount', 'leak_point'], {});
  rbox(g, '_backboard', [2.6, 1.1, .06], [0, 1.2, 0], M.panel, .03);
  seams(g, 2.5, 1, [0, 1.2, .032], 4, 2);
  cyl(g, '_pipe-left', .04, .04, .9, [-.85, 1.2, .1], M.blue, [0, 0, Math.PI / 2], 12);
  cyl(g, '_pipe-right', .04, .04, .7, [.95, 1.2, .1], M.blue, [0, 0, Math.PI / 2], 12);
  for (const x of [-.38, .58]) cyl(g, '_coupling', .06, .06, .08, [x, 1.2, .1], M.steel, [0, 0, Math.PI / 2], 14);
  const valve = node(g, 'isolation_valve', [-.75, 1.2, .2]);
  cyl(valve, '_stem', .02, .02, .12, [0, 0, -.05], M.steel, [Math.PI / 2, 0, 0], 8);
  torus(valve, '_wheel', .13, .02, [0, 0, .02], M.red);
  for (let i = 0; i < 3; i++) box(valve, '_spoke', [.25, .02, .02], [0, 0, .02], M.red, [0, 0, i * Math.PI / 3]);
  const mount = node(g, 'hose_mount', [.1, 1.2, .1]);
  const hose = node(mount, 'hose_segment'); cyl(hose, '_hose', .035, .035, .9, [0, 0, 0], M.dark, [0, 0, Math.PI / 2], 12);
  for (const x of [-.42, .42]) cyl(hose, '_hose-clamp', .045, .045, .04, [x, 0, 0], M.alu, [0, 0, Math.PI / 2], 12);
  node(g, 'leak_point', [.15, 1.17, .14]);
  tube(g, '_down-pipe', [[1.3, 1.2, .1], [1.4, 1.1, .1], [1.4, .1, .1]], .035, M.blue, 16);
  rbox(g, '_tag', [.4, .12, .01], [-.75, 1.55, .035], M.yellow, .02);
  return g;
}
/** Spare hose segment with clamps, stored on the tool shelf. */
export function spareHose() {
  const g = root('spare-hose', 'Spare irrigation hose segment', ['grip'], {});
  cyl(g, '_hose', .035, .035, .9, [0, .04, 0], M.dark, [0, 0, Math.PI / 2], 12);
  for (const x of [-.42, .42]) cyl(g, '_clamp', .045, .045, .04, [x, .04, 0], M.alu, [0, 0, Math.PI / 2], 12);
  box(g, '_tag', [.12, .06, .005], [0, .04, .04], M.green);
  node(g, 'grip', [0, .04, 0]);
  return g;
}
/** Woven harvest basket. Harvested plants are parented to the "contents" node. */
export function harvestBasket() {
  const g = root('harvest-basket', 'Harvest basket', ['contents', 'handle'], {});
  const wicker = Object.assign(M.hullWarm.clone(), {name: 'wicker'}); wicker.color.set(0xc8955b); wicker.roughness = .9;
  lathe(g, '_basket', [[0, .02], [.2, .02], [.26, .2], [.25, .21], [.19, .04], [0, .04]], [0, 0, 0], wicker, 18);
  for (let i = 0; i < 4; i++) torus(g, '_weave', .2 + i * .015, .008, [0, .06 + i * .045, 0], wicker, [Math.PI / 2, 0, 0]);
  const handle = node(g, 'handle'); torus(handle, '_handle', .24, .015, [0, .2, 0], wicker, [0, 0, 0], Math.PI);
  node(g, 'contents', [0, .08, 0]);
  return g;
}
/** Galley table set for a birthday dinner (empty bowl until the salad arrives). */
export function galleyTable() {
  const g = root('galley-table', 'Galley table with plates, a salad bowl and a tiny birthday cake', ['salad_bowl', 'bowl_contents', 'cake', 'candle_flame'], {});
  rbox(g, '_top', [1.6, .06, .9], [0, .78, 0], M.hullWarm, .03);
  for (const x of [-.7, .7]) for (const z of [-.35, .35]) cyl(g, '_leg', .03, .03, .75, [x, .38, z], M.alu, null, 8);
  for (const [x, z] of [[-.5, -.25], [.5, -.25], [-.5, .25], [.5, .25]]) { cyl(g, '_plate', .12, .1, .015, [x, .82, z], M.hull, null, 18); box(g, '_fork', [.01, .005, .12], [x + .16, .815, z], M.alu); }
  const bowl = node(g, 'salad_bowl', [0, .81, 0]);
  lathe(bowl, '_bowl', [[0, 0], [.1, 0], [.16, .07], [.15, .075], [.09, .01], [0, .01]], [0, 0, 0], M.blue, 20);
  node(bowl, 'bowl_contents', [0, .03, 0]);
  const cake = node(g, 'cake', [.25, .81, .05]); cyl(cake, '_cake', .07, .07, .06, [0, .03, 0], M.hullWarm, null, 16); cyl(cake, '_icing', .072, .072, .015, [0, .065, 0], M.pepper, null, 16);
  cyl(cake, '_candle', .006, .006, .06, [0, .1, 0], M.yellow, null, 6); const flame = node(cake, 'candle_flame', [0, .14, 0]); sphere(flame, '_flame', .012, [0, 0, 0], M.ledAmber, [1, 1.6, 1], 8);
  return g;
}
/** Greenhouse control console: a power-budget screen and a big "end the day" button. */
export function farmConsole() {
  const g = root('farm-console', 'Greenhouse console with power budget screen and day button', ['screen', 'day_button'], {});
  rbox(g, '_body', [1, 1, .5], [0, .5, 0], M.panel, .04);
  rbox(g, '_slope', [1, .08, .55], [0, 1.03, .05], M.dark, .02, [-.3, 0, 0]);
  const screen = node(g, 'screen', [0, 1.42, -.1]); rbox(screen, '_bezel', [.95, .6, .06], [0, 0, 0], M.dark, .03); box(screen, 'display', [.86, .5, .01], [0, 0, .035], M.screen);
  for (let i = 0; i < 3; i++) box(screen, '_bar', [.18, .05 + i * .08, .005], [-.25 + i * .25, -.12 + i * .04, .042], [M.growRed, M.ledGreen, M.ledAmber][i]);
  const button = node(g, 'day_button', [.25, 1.08, .15]); cyl(button, 'day_cap', .07, .08, .04, [0, 0, 0], M.yellow, [-.3, 0, 0], 20);
  sphere(g, '_sun-icon', .03, [-.2, 1.08, .17], M.ledAmber, [1, .3, 1], 10);
  return g;
}
/** Tool shelf with the spare hose rack. */
export function toolShelf() {
  const g = root('tool-shelf', 'Tool shelf with pegboard and spare parts bins', ['hose_hook'], {});
  rbox(g, '_board', [1.4, 1.2, .05], [0, 1.3, 0], M.panel, .02);
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) cyl(g, '_hole', .012, .012, .01, [-.55 + i * .22, .85 + j * .28, .03], M.dark, [Math.PI / 2, 0, 0], 6);
  rbox(g, '_shelf', [1.4, .04, .4], [0, .8, .18], M.alu, .01);
  for (const [x, m] of [[-.45, M.orange], [0, M.blue], [.45, M.green]]) rbox(g, '_bin', [.35, .2, .3], [x, .92, .18], m, .03);
  rbox(g, '_wrench', [.3, .03, .02], [-.35, 1.6, .04], M.steel, .01); rbox(g, '_screwdriver', [.03, .25, .03], [.4, 1.55, .04], M.yellow, .01);
  node(g, 'hose_hook', [0, 1.35, .1]);
  for (const x of [-.25, .25]) cyl(g, '_hook', .015, .015, .12, [x, 1.35, .06], M.steel, [Math.PI / 2, 0, 0], 6);
  return g;
}

export const DESIGNS = {
  'hab-greenhouse-interior': () => habInterior('hab-greenhouse-interior', {length: 16, width: 10, dressing: 'greenhouse'}),
  'grow-bed': growBed, 'lettuce-plant': lettucePlant, 'mizuna-plant': mizunaPlant, 'pepper-plant': pepperPlant,
  'greenhouse-water-tank': waterTank, 'irrigation-line': irrigationLine, 'spare-hose': spareHose, 'harvest-basket': harvestBasket,
  'galley-table': galleyTable, 'farm-console': farmConsole, 'tool-shelf': toolShelf,
};
