// Repair equipment for "Message to Earth": a water recycler with swappable parts, a multimeter,
// spare parts, the Earth-link console and a water-saving utility panel.
// Parts sit in named sockets so the game can pull them out and push spares in.
import * as THREE from 'three';
import {M, box, rbox, cyl, sphere, torus, tube, node, bolts, seams, hazard, root, cone, extrude} from './kit.mjs';
import {habInterior} from './mars-hab.mjs';

const brass = Object.assign(M.copper.clone(), {name: 'brass'}); brass.color.set(0xc9a24a);
const scorch = Object.assign(M.dark.clone(), {name: 'scorch'}); scorch.color.set(0x15100c); scorch.roughness = 1;
const grime = Object.assign(M.marsDust.clone(), {name: 'filter-grime'}); grime.color.set(0x6b4a2e);
const pleat = Object.assign(M.fabric.clone(), {name: 'filter-pleat'}); pleat.color.set(0xf4f1e6);
const meterYellow = Object.assign(M.yellow.clone(), {name: 'meter-yellow'}); meterYellow.color.set(0xf2c230);
const lcd = Object.assign(M.screen.clone(), {name: 'meter-lcd'}); lcd.color.set(0x9fb59a); lcd.emissive.set(0x506a4c); lcd.emissiveIntensity = .35;
const earthScreen = Object.assign(M.screen.clone(), {name: 'earth-screen'}); earthScreen.emissive.set(0x0f2a4a); earthScreen.emissiveIntensity = .7;

/** Wall-mounted water recycler. The front access panel hinges open; inside are pump, valve and filter sockets. */
export function waterRecycler() {
  const g = root('water-recycler', 'Wall-mounted water recycler with hinged access panel, four bolts, pump/valve/filter sockets, test pads, flow window and power lever',
    ['access_panel', 'bolt_1', 'bolt_2', 'bolt_3', 'bolt_4', 'pump_socket', 'valve_socket', 'filter_socket', 'test_pump', 'test_valve', 'flow_water', 'power_lever', 'status_lamp', 'outlet'], {});
  // Frame and back box.
  // Back box plus a front frame, so the repair bay is a real recess you can see into.
  rbox(g, '_cabinet', [1.7, 2.05, .42], [0, 1.08, -.1], M.hull, .05);
  rbox(g, '_frame-top', [1.7, .52, .22], [0, 1.82, .2], M.hull, .03);
  rbox(g, '_frame-bottom', [1.7, .44, .22], [0, .27, .2], M.hull, .03);
  box(g, '_frame-left', [.11, 1.14, .22], [-.795, 1.0, .2], M.hull);
  box(g, '_frame-right', [.35, 1.14, .22], [.675, 1.0, .2], M.hull);
  rbox(g, '_plinth', [1.76, .1, .68], [0, .05, 0], M.dark, .02);
  box(g, '_bay', [1.24, 1.14, .02], [-.12, 1.0, .12], M.dark);
  for (const x of [-.6, -.2, .2]) box(g, '_bay-rib', [.03, 1.1, .05], [x, 1.0, .15], M.alu);
  for (const y of [.42, 1.58]) box(g, '_bay-rail', [1.26, .04, .1], [-.12, y, .25], M.alu);
  hazard(g, 1.6, .06, [0, 1.98, .312]);
  rbox(g, '_name-plate', [.62, .12, .01], [-.36, 1.82, .315], M.blue, .01);
  // Hinged access panel (hinge on the left edge, door opens outward to the left).
  const panel = node(g, 'access_panel', [-.74, 1.0, .33]);
  rbox(panel, '_door', [1.26, 1.14, .04], [.63, 0, 0], M.panel, .03);
  seams(panel, 1.1, 1.0, [.63, 0, .022], 2, 2);
  box(panel, '_door-label', [.4, .08, .005], [.63, .44, .023], M.orange);
  box(panel, '_door-grille', [.5, .2, .006], [.63, -.36, .023], M.dark);
  for (let i = 0; i < 3; i++) cyl(panel, '_hinge', .018, .018, .14, [0, -.4 + i * .4, 0], M.steel, null, 10);
  [[.1, .5], [1.16, .5], [.1, -.5], [1.16, -.5]].forEach(([x, y], i) => {
    const b = node(panel, `bolt_${i + 1}`, [x, y, .03]);
    cyl(b, '_bolt-head', .024, .024, .02, [0, 0, 0], M.steel, [Math.PI / 2, 0, 0], 6);
    box(b, '_bolt-slot', [.03, .006, .004], [0, 0, .011], M.dark);
  });
  rbox(panel, '_handle', [.05, .2, .04], [1.12, 0, .04], M.dark, .015);
  // Sockets inside the bay (empty anchors; parts are placed by the game).
  node(g, 'pump_socket', [-.48, .64, .25]);
  node(g, 'valve_socket', [.02, .98, .25]);
  node(g, 'filter_socket', [.3, .64, .25]);
  // Plumbing inside the bay links the three parts.
  tube(g, '_pipe-a', [[-.6, 1.5, .24], [-.48, 1.3, .25], [-.48, .94, .25]], .03, M.alu);
  tube(g, '_pipe-b', [[-.36, .78, .25], [-.15, .86, .25], [-.06, .98, .25]], .03, M.alu);
  tube(g, '_pipe-c', [[.12, .98, .25], [.26, 1.04, .25], [.3, 1.0, .25]], .03, M.alu);
  tube(g, '_pipe-d', [[.3, .52, .25], [.3, .5, .25], [.4, .5, .3], [.56, .5, .34]], .03, M.alu);
  // Test pads with red and black terminals beside the pump and the valve.
  for (const [nm, x, y] of [['test_pump', -.7, .7], ['test_valve', -.2, 1.25]]) {
    const t = node(g, nm, [x, y, .24]);
    rbox(t, '_pad', [.14, .1, .03], [0, 0, 0], M.dark, .01);
    cyl(t, '_term-red', .016, .016, .03, [-.035, 0, .02], M.red, [Math.PI / 2, 0, 0], 10);
    cyl(t, '_term-black', .016, .016, .03, [.035, 0, .02], M.rubber, [Math.PI / 2, 0, 0], 10);
  }
  // Right column: flow window, status lamp, power lever.
  rbox(g, '_column', [.34, 1.7, .08], [.66, 1.04, .3], M.hullWarm, .03);
  cyl(g, '_flow-glass', .07, .07, .8, [.66, 1.32, .36], M.glass, null, 18);
  for (const y of [.9, 1.74]) cyl(g, '_flow-cap', .085, .085, .05, [.66, y, .36], M.alu, null, 18);
  const water = node(g, 'flow_water', [.66, .93, .36]);
  cyl(water, '_flow-water', .06, .06, .78, [0, .39, 0], M.water, null, 16);
  const lamp = node(g, 'status_lamp', [.66, .75, .36]);
  sphere(lamp, 'lamp-dome', .045, [0, 0, 0], M.ledAmber, [1, 1, .6], 14);
  torus(g, '_lamp-ring', .05, .01, [.66, .75, .345], M.alu);
  rbox(g, '_lever-base', [.16, .22, .05], [.66, .42, .35], M.dark, .02);
  const lever = node(g, 'power_lever', [.66, .42, .38]);
  rbox(lever, '_lever-arm', [.035, .2, .035], [0, .1, 0], M.steel, .012);
  sphere(lever, '_lever-knob', .04, [0, .21, 0], M.red, null, 12);
  // Outlet spout feeding the drinking water line.
  const outlet = node(g, 'outlet', [.86, .3, .2]);
  tube(outlet, '_spout', [[0, 0, 0], [.12, 0, 0], [.18, -.06, 0]], .025, M.alu);
  // Rear service pipes into the wall.
  for (const x of [-.6, .5]) cyl(g, '_wall-pipe', .04, .04, .6, [x, 2.2, -.1], M.alu, null, 12);
  bolts(g, [[-.8, .15, .31], [.8, .15, .31], [-.8, 2.0, .31], [.8, 2.0, .31]]);
  return g;
}

/** Pump motor cartridge: motor can, fan, terminal box. "scorch" marks show when it is burnt out. */
export function pumpMotor() {
  const g = root('pump-motor', 'Recycler pump motor cartridge with cooling fan, terminal box and optional scorch marks', ['fan', 'scorch', 'tag'], {});
  cyl(g, '_can', .12, .12, .3, [0, 0, 0], M.steel, null, 24);
  for (let i = 0; i < 6; i++) torus(g, '_rib', .122, .006, [0, -.12 + i * .048, 0], M.alu, [Math.PI / 2, 0, 0]);
  cyl(g, '_end-cap', .13, .13, .04, [0, .17, 0], M.dark, null, 24);
  const fan = node(g, 'fan', [0, -.17, 0]);
  cyl(fan, '_hub', .035, .035, .03, [0, 0, 0], M.dark, null, 12);
  for (let i = 0; i < 5; i++) box(fan, '_blade', [.1, .006, .03], [Math.cos(i * 1.256) * .05, 0, Math.sin(i * 1.256) * .05], M.dark, [0, -i * 1.256, .35]);
  rbox(g, '_terminal-box', [.09, .08, .06], [0, .06, .13], M.dark, .01);
  cyl(g, '_wire-red', .008, .008, .06, [-.02, .12, .14], M.red, null, 8);
  cyl(g, '_wire-black', .008, .008, .06, [.02, .12, .14], M.rubber, null, 8);
  const s = node(g, 'scorch'); sphere(s, '_burn', .07, [0, .04, .1], scorch, [1.2, 1.4, .25], 12); sphere(s, '_burn', .05, [.05, -.06, .095], scorch, [1, 1, .25], 10);
  const tag = node(g, 'tag', [0, .02, .125]); box(tag, '_label', [.1, .05, .004], [0, 0, 0], M.orange);
  return g;
}

/** Brass check valve with a solenoid coil and a flow arrow. */
export function checkValve() {
  const g = root('check-valve', 'Brass check valve with solenoid coil, flow arrow and stuck-flag node', ['coil', 'stuck_flag'], {});
  cyl(g, '_body', .05, .05, .24, [0, 0, 0], brass, [0, 0, Math.PI / 2], 18);
  for (const x of [-.13, .13]) cyl(g, '_nut', .06, .06, .04, [x, 0, 0], brass, [0, 0, Math.PI / 2], 6);
  const coil = node(g, 'coil', [0, .09, 0]);
  cyl(coil, '_coil', .045, .045, .1, [0, 0, 0], M.blue, null, 16);
  cyl(coil, '_coil-cap', .05, .05, .02, [0, .06, 0], M.dark, null, 16);
  extrude(g, '_arrow', [[-.05, -.01], [.02, -.01], [.02, -.025], [.05, 0], [.02, .025], [.02, .01], [-.05, .01]], .004, [0, 0, .052], M.hull, null, 0);
  const flag = node(g, 'stuck_flag', [0, .17, 0]); box(flag, '_flag', [.06, .04, .004], [0, 0, 0], M.red);
  return g;
}

/** Pleated water filter cartridge; the "grime" node shows a clogged filter. */
export function filterCartridge() {
  const g = root('filter-cartridge', 'Pleated water filter cartridge with end caps, handle and clog grime node', ['grime', 'handle'], {});
  for (const y of [-.17, .17]) cyl(g, '_cap', .085, .085, .04, [0, y, 0], M.blue, null, 24);
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; box(g, '_pleat', [.012, .3, .03], [Math.cos(a) * .065, 0, Math.sin(a) * .065], pleat, [0, -a, 0]); }
  cyl(g, '_core', .04, .04, .3, [0, 0, 0], M.alu, null, 12);
  const grimeNode = node(g, 'grime'); cyl(grimeNode, '_grime', .079, .079, .28, [0, -.01, 0], grime, null, 24);
  const handle = node(g, 'handle', [0, .2, 0]); torus(handle, '_handle', .04, .008, [0, .02, 0], M.dark, [0, 0, 0], Math.PI);
  return g;
}

/** Handheld multimeter with dial, screen and two probes. */
export function multimeter() {
  const g = root('multimeter', 'Handheld multimeter with LCD, rotary dial and red/black probes', ['meter_screen', 'meter_dial', 'probe_red', 'probe_black'], {});
  rbox(g, '_body', [.1, .18, .035], [0, 0, 0], meterYellow, .015);
  rbox(g, '_face', [.085, .16, .01], [0, 0, .016], M.dark, .01);
  const screen = node(g, 'meter_screen', [0, .045, .022]); box(screen, 'meter-lcd', [.07, .04, .004], [0, 0, 0], lcd);
  const dial = node(g, 'meter_dial', [0, -.025, .024]); cyl(dial, '_dial', .022, .022, .01, [0, 0, 0], M.panel, [Math.PI / 2, 0, 0], 16); box(dial, '_pointer', [.004, .018, .004], [0, .008, .006], M.red);
  for (const [nm, x, mat] of [['probe_red', -.03, M.red], ['probe_black', .03, M.rubber]]) {
    const p = node(g, nm, [x, -.14, .02]);
    cyl(p, '_grip', .008, .008, .07, [0, 0, 0], mat, null, 10); cone(p, '_tip', .004, .025, [0, -.047, 0], M.alu, [Math.PI, 0, 0], 8);
    tube(g, '_lead', [[x, -.085, .01], [x * 1.4, -.1, .03], [x, -.105, .02]], .003, mat, 10);
  }
  return g;
}

/** Earth-link console: desk, big wall screen and a glowing SEND button. */
export function commConsole() {
  const g = root('earth-link-console', 'Earth-link communications desk with large screen, send button, microphone and antenna status lamp', ['screen', 'send_button', 'antenna_lamp'], {});
  rbox(g, '_desk', [1.6, .08, .7], [0, .78, 0], M.hullWarm, .02);
  for (const x of [-.72, .72]) rbox(g, '_leg', [.08, .78, .6], [x, .39, 0], M.panel, .02);
  rbox(g, '_screen-frame', [1.5, .92, .06], [0, 1.62, -.28], M.dark, .03);
  const screen = node(g, 'screen', [0, 1.62, -.245]); box(screen, 'earth-screen', [1.4, .82, .01], [0, 0, 0], earthScreen);
  rbox(g, '_keyboard', [.5, .03, .18], [-.2, .835, .08], M.dark, .01);
  const send = node(g, 'send_button', [.42, .84, .1]);
  cyl(send, '_button-base', .07, .08, .03, [0, 0, 0], M.dark, null, 20); cyl(send, 'send-cap', .055, .055, .03, [0, .025, 0], M.ledGreen, null, 20);
  tube(g, '_mic-arm', [[.6, .83, -.1], [.62, 1.0, -.05], [.5, 1.08, .05]], .008, M.steel, 16);
  sphere(g, '_mic', .025, [.5, 1.08, .05], M.dark, null, 10);
  const lamp = node(g, 'antenna_lamp', [.68, 2.12, -.28]); sphere(lamp, 'antenna-dome', .04, [0, 0, 0], M.ledAmber, null, 12);
  box(g, '_headset-hook', [.04, .1, .02], [-.74, 1.0, .2], M.steel);
  torus(g, '_headset', .07, .012, [-.74, .94, .23], M.dark, [0, 0, 0], Math.PI);
  return g;
}

/** Wall shelf of spare parts with labelled spots and a hook for the multimeter. */
export function partsShelf() {
  const g = root('parts-shelf', 'Spare-parts shelf with labelled spots for pump, valve, filters and a multimeter hook', ['spare_pump', 'spare_valve', 'spare_filter_1', 'spare_filter_2', 'meter_hook'], {});
  for (const x of [-.78, .78]) rbox(g, '_upright', [.05, 1.7, .4], [x, .85, 0], M.alu, .01);
  for (const y of [.5, 1.05, 1.6]) rbox(g, '_shelf', [1.62, .04, .42], [0, y, 0], M.panel, .01);
  rbox(g, '_backboard', [1.6, 1.4, .02], [0, 1.0, -.2], M.hullWarm, .01);
  const spots = [['spare_pump', -.45, .52 + .15], ['spare_valve', .35, .52 + .05], ['spare_filter_1', -.4, 1.07 + .19], ['spare_filter_2', .1, 1.07 + .19], ['meter_hook', .55, 1.25]];
  for (const [nm, x, y] of spots) { node(g, nm, [x, y, .02]); if (nm !== 'meter_hook') box(g, '_spot-label', [.18, .04, .004], [x, y < 1 ? .54 : 1.09, .21], nm.includes('filter') ? M.blue : nm.includes('pump') ? M.orange : M.yellow); }
  box(g, '_hook', [.02, .06, .06], [.55, 1.36, -.17], M.steel);
  rbox(g, '_tool-tray', [.5, .08, .25], [.4, 1.66, 0], M.dark, .01);
  return g;
}

/** Utility panel with the big "save water" switch and a flow gauge. */
export function utilityPanel() {
  const g = root('utility-panel', 'Base utilities wall panel with a guarded save-water switch and a water-flow gauge', ['save_switch', 'gauge_needle', 'save_lamp'], {});
  rbox(g, '_panel', [.7, .9, .08], [0, 1.35, 0], M.panel, .03);
  hazard(g, .6, .05, [0, 1.75, .042]);
  rbox(g, '_guard', [.24, .28, .06], [0, 1.2, .07], M.yellow, .02);
  const sw = node(g, 'save_switch', [0, 1.2, .1]);
  rbox(sw, '_switch-arm', [.06, .16, .04], [0, .06, 0], M.red, .015);
  cyl(g, '_gauge', .11, .11, .02, [0, 1.5, .05], M.hull, [Math.PI / 2, 0, 0], 28);
  torus(g, '_gauge-ring', .11, .012, [0, 1.5, .06], M.alu);
  box(g, '_gauge-green', [.08, .015, .004], [-.04, 1.55, .062], M.green, [0, 0, -.5]);
  box(g, '_gauge-red', [.06, .015, .004], [.05, 1.56, .062], M.red, [0, 0, .5]);
  const needle = node(g, 'gauge_needle', [0, 1.5, .066]); box(needle, '_needle', [.008, .09, .004], [0, .045, 0], M.dark);
  const lamp = node(g, 'save_lamp', [.24, 1.05, .05]); sphere(lamp, 'save-dome', .03, [0, 0, 0], M.ledAmber, null, 12);
  for (let i = 0; i < 3; i++) cyl(g, '_conduit', .02, .02, 1.0, [-.2 + i * .2, .45, -.02], M.steel, null, 8);
  return g;
}

export const DESIGNS = {
  'water-recycler': waterRecycler, 'pump-motor': pumpMotor, 'check-valve': checkValve, 'filter-cartridge': filterCartridge,
  multimeter, 'earth-link-console': commConsole, 'parts-shelf': partsShelf, 'utility-panel': utilityPanel,
};
