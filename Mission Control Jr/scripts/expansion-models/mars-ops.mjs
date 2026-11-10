// Models for the redesigned Mars campaign: "Arrival at Mars" (orbiter cabin, comms rack, power panel,
// landing planner) — storm and rover models are added below as those missions are rebuilt.
// All models: meters, +Y up, front faces +Z, origin at floor centre.
import {M, box, rbox, cyl, sphere, torus, tube, node, root, bolts, seams, hazard, cone} from './kit.mjs';

// ---- Arrival at Mars ----------------------------------------------------------------------
export const CABIN = {length: 10, width: 3.6, height: 2.6, windowY: 1.45};

/** Orbiter crew cabin: a long module with a big Mars window at -X and the lander hatch at +X. */
export function orbiterCabin() {
  const {length: L, width: W, height: H, windowY: wy} = CABIN;
  const g = root('orbiter-cabin', 'Mars orbiter crew cabin with a large window (-X end) and the lander hatch (+X end)',
    ['window', 'hatch', 'hatch_wheel', 'hatch_light', 'ceiling_lights', 'shadow_lamp'], {footprint: [L, W]});
  // Deck.
  box(g, '_deck', [L, .1, W], [0, .05, 0], M.dark);
  for (let x = -L / 2 + .5; x < L / 2; x += 1) box(g, '_grate', [.9, .02, W - .5], [x, .11, 0], M.floor);
  // Long walls with padded panels, lockers and handrails.
  for (const side of [-1, 1]) {
    const z = side * W / 2;
    box(g, '_wall', [L, H, .08], [0, H / 2, z], M.hull);
    for (let x = -L / 2 + 1; x < L / 2 - .5; x += 2) {
      rbox(g, '_pad', [1.8, .9, .06], [x, 2.0, z - side * .07], M.hullWarm, .03);
      seams(g, 1.8, .9, [x, 2.0, z - side * .1], 3, 1, M.panel);
    }
    tube(g, '_rail', [[-L / 2 + .6, 1.15, z - side * .2], [0, 1.15, z - side * .2], [L / 2 - .6, 1.15, z - side * .2]], .025, M.yellow, 12);
    for (let x = -L / 2 + .6; x <= L / 2 - .5; x += 2.2) cyl(g, '_rail-post', .02, .02, .18, [x, 1.15, z - side * .11], M.steel, [Math.PI / 2, 0, 0], 8);
    box(g, '_kick', [L, .14, .05], [0, .17, z - side * .06], M.steel);
  }
  // Curved shoulders between the walls and the ceiling (cheap bevels).
  for (const side of [-1, 1]) box(g, '_shoulder', [L, .5, .08], [0, H - .1, side * (W / 2 - .2)], M.panel, [side * Math.PI / 4, 0, 0]);
  box(g, '_ceiling', [L, .08, W - .3], [0, H + .04, 0], M.hull);
  const lights = node(g, 'ceiling_lights', [0, H - .01, 0]);
  for (const x of [-3.5, -1, 1.5, 4]) box(lights, '_strip', [1.6, .03, .18], [x, 0, 0], M.lightStrip);
  // A small ring of amber lamps that the game turns on while the orbiter is in Mars' shadow.
  const shadowLamp = node(g, 'shadow_lamp', [0, H - .06, 0]);
  for (const x of [-4, -1.5, 1, 3.5]) sphere(shadowLamp, 'lamp', .05, [x, 0, .45], M.ledAmber, null, 8);
  // -X end: big round window looking at Mars.
  const ex = -L / 2;
  const frameR = .95;
  box(g, '_end-top', [.12, H - (wy + frameR), W], [ex, (H + wy + frameR) / 2, 0], M.hull);
  box(g, '_end-bottom', [.12, wy - frameR, W], [ex, (wy - frameR) / 2, 0], M.hull);
  for (const side of [-1, 1]) box(g, '_end-side', [.12, frameR * 2, W / 2 - frameR], [ex, wy, side * (W / 2 + frameR) / 2], M.hull);
  // Corners of the square hole around the round window.
  for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    const c = node(g, '_corner', [ex, wy + sy * frameR * .86, sz * frameR * .86]);
    box(c, '_corner-fill', [.12, frameR * .28, frameR * .28], [0, 0, 0], M.hull);
  }
  const win = node(g, 'window', [ex + .02, wy, 0]);
  torus(win, '_frame', frameR, .08, [0, 0, 0], M.alu, [0, Math.PI / 2, 0]);
  torus(win, '_frame-inner', frameR - .1, .03, [.06, 0, 0], M.dark, [0, Math.PI / 2, 0]);
  bolts(win, Array.from({length: 16}, (_, i) => [.08, Math.sin(i / 16 * Math.PI * 2) * (frameR + .02), Math.cos(i / 16 * Math.PI * 2) * (frameR + .02)]), .015, M.steel, 'x');
  cyl(win, 'glass', frameR - .04, frameR - .04, .02, [0, 0, 0], M.glass, [0, 0, Math.PI / 2], 40);
  // +X end: round hatch to the lander, with a wheel and a status light.
  const hx = L / 2;
  box(g, '_hatch-wall', [.12, H, W], [hx, H / 2, 0], M.hull);
  hazard(node(g, '_hz', [hx - .07, .35, 0], [0, -Math.PI / 2, 0]), 1.4, .12, [0, 0, 0], 8);
  const hatch = node(g, 'hatch', [hx - .08, 1.25, 0]);
  torus(hatch, '_hatch-ring', .62, .07, [0, 0, 0], M.alu, [0, Math.PI / 2, 0]);
  cyl(hatch, '_hatch-door', .58, .58, .08, [-.02, 0, 0], M.panel, [0, 0, Math.PI / 2], 32);
  cyl(hatch, '_hatch-window', .12, .12, .03, [-.07, .28, 0], M.glass, [0, 0, Math.PI / 2], 16);
  const wheel = node(hatch, 'hatch_wheel', [-.1, -.05, 0]);
  torus(wheel, 'wheel-rim', .22, .025, [0, 0, 0], M.orange, [0, Math.PI / 2, 0]);
  for (let i = 0; i < 3; i++) box(wheel, 'wheel-spoke', [.03, .44, .03], [0, 0, 0], M.steel, [i * Math.PI / 3, 0, 0]);
  sphere(hatch, 'hatch_light', .05, [-.04, .8, 0], M.ledRed, null, 10);
  return g;
}

/** Comms rack: the signal goes antenna feed → amplifier → controller card → radio. Each stage has a light. */
export function commRack() {
  const g = root('comm-rack', 'Radio rack with four stages (feed cable, amplifier, controller card, radio), stage lights, test button and tester port',
    ['feed_plug', 'feed_cable', 'amp_slot', 'amp_module', 'controller_card', 'card_handle', 'radio_screen', 'led_feed', 'led_amp', 'led_card', 'led_radio', 'test_button', 'tester_port', 'smoke_point']);
  const w = 1.2, h = 1.95, d = .5;
  rbox(g, '_cabinet', [w, h, d], [0, h / 2, 0], M.panel, .03);
  box(g, '_face', [w - .1, h - .1, .02], [0, h / 2, d / 2 + .005], M.dark);
  hazard(node(g, '_hz', [0, .08, d / 2 + .02]), w - .2, .06, [0, 0, 0], 7);
  // Stage 1 (top): antenna feed cable coming down from the ceiling into a plug.
  const y1 = 1.68;
  rbox(g, '_bay1', [w - .2, .32, .06], [0, y1, d / 2 + .02], M.steel, .02);
  tube(g, 'feed_cable', [[.35, h + .7, -.1], [.35, h + .1, .15], [.3, y1 + .12, d / 2 + .1], [.12, y1, d / 2 + .1]], .03, M.orange, 16);
  const plug = node(g, 'feed_plug', [.08, y1, d / 2 + .1]);
  cyl(plug, 'plug-body', .05, .05, .12, [0, 0, 0], M.alu, [0, 0, Math.PI / 2], 14);
  cyl(plug, 'plug-nut', .065, .065, .04, [-.06, 0, 0], M.steel, [0, 0, Math.PI / 2], 6);
  cyl(g, '_socket', .07, .07, .05, [-.03, y1, d / 2 + .06], M.dark, [Math.PI / 2, 0, 0], 14);
  // Stage 2: amplifier slot with a removable module.
  const y2 = 1.28;
  box(g, '_bay2', [w - .2, .34, .04], [0, y2, d / 2 + .02], M.steel);
  const slot = node(g, 'amp_slot', [0, y2, d / 2 + .02]);
  const amp = node(slot, 'amp_module', [0, 0, 0]);
  rbox(amp, 'amp-body', [.6, .26, .14], [0, 0, .04], M.alu, .02);
  for (let i = 0; i < 7; i++) box(amp, 'amp-fin', [.012, .2, .05], [-.24 + i * .08, 0, .13], M.steel);
  cyl(amp, 'amp-handle', .015, .015, .4, [0, -.17, .12], M.dark, [0, 0, Math.PI / 2], 8);
  node(g, 'smoke_point', [0, y2 + .18, d / 2 + .15]);
  // Stage 3: controller card with a pull handle.
  const y3 = .9;
  box(g, '_bay3', [w - .2, .26, .04], [0, y3, d / 2 + .02], M.steel);
  const card = node(g, 'controller_card', [0, y3, d / 2 + .04]);
  box(card, 'card-board', [.7, .18, .02], [0, 0, 0], M.green);
  for (let i = 0; i < 5; i++) box(card, 'card-chip', [.08, .06, .015], [-.26 + i * .13, .02, .015], M.dark);
  const handle = node(card, 'card_handle', [.4, 0, .03]);
  box(handle, 'handle-grip', [.06, .2, .05], [0, 0, 0], M.orange);
  // Stage 4: radio unit with a screen and the big test button.
  const y4 = .5;
  rbox(g, '_radio', [w - .2, .36, .08], [0, y4, d / 2 + .03], M.steel, .02);
  box(g, 'radio_screen', [.55, .24, .01], [-.15, y4, d / 2 + .075], M.screen);
  const btn = node(g, 'test_button', [.35, y4, d / 2 + .08]);
  cyl(btn, 'button-cap', .07, .07, .05, [0, 0, 0], M.green, [Math.PI / 2, 0, 0], 18);
  torus(btn, 'button-ring', .08, .012, [0, 0, -.01], M.steel);
  // Stage lights in a column on the left edge.
  for (const [name, y] of [['led_feed', y1], ['led_amp', y2], ['led_card', y3], ['led_radio', y4]]) {
    cyl(g, '_led-bezel', .035, .035, .02, [-w / 2 + .1, y, d / 2 + .04], M.steel, [Math.PI / 2, 0, 0], 12);
    sphere(g, name, .026, [-w / 2 + .1, y, d / 2 + .055], M.ledAmber, null, 10);
  }
  // Port where the signal tester clips on.
  const port = node(g, 'tester_port', [w / 2 - .02, 1.1, d / 2 - .05]);
  box(port, '_port', [.04, .12, .08], [0, 0, 0], M.dark);
  bolts(g, [[-w / 2 + .05, h - .05, d / 2 + .01], [w / 2 - .05, h - .05, d / 2 + .01], [-w / 2 + .05, .15, d / 2 + .01], [w / 2 - .05, .15, d / 2 + .01]]);
  return g;
}

export const POWER_LOADS = ['life', 'heat', 'radio', 'amp', 'motor', 'charger', 'camera'];
/** Power panel: seven load switches with lamps, a main breaker and a power gauge. */
export function powerPanel() {
  const g = root('power-panel', 'Orbiter power panel: seven load switches with lamps, main breaker handle and a power-use gauge',
    [...POWER_LOADS.flatMap(l => [`switch_${l}`, `toggle_${l}`, `lamp_${l}`, `label_${l}`]), 'main_breaker', 'main_lamp', 'power_gauge', 'power_needle', 'budget_mark']);
  const w = 1.6, h = 1.25, y0 = .85;
  rbox(g, '_box', [w, h, .16], [0, y0 + h / 2, 0], M.panel, .03);
  box(g, '_face', [w - .1, h - .1, .01], [0, y0 + h / 2, .085], M.dark);
  POWER_LOADS.forEach((l, i) => {
    const x = -w / 2 + .17 + i * .19, y = y0 + .45;
    const sw = node(g, `switch_${l}`, [x, y, .09]);
    box(sw, 'switch-plate', [.13, .24, .02], [0, 0, 0], M.steel);
    const t = node(sw, `toggle_${l}`, [0, 0, .02]);
    box(t, 'toggle-lever', [.04, .12, .04], [0, .05, .02], l === 'life' ? M.red : M.hull);
    sphere(g, `lamp_${l}`, .025, [x, y + .19, .1], M.ledGreen, null, 10);
    node(g, `label_${l}`, [x, y - .19, .1]);
  });
  // Main breaker on the right side of the gauge.
  const mb = node(g, 'main_breaker', [w / 2 - .22, y0 + .95, .1]);
  box(mb, 'breaker-body', [.16, .2, .04], [0, 0, 0], M.steel);
  box(mb, 'breaker-handle', [.06, .14, .06], [0, .04, .04], M.yellow);
  sphere(g, 'main_lamp', .03, [w / 2 - .22, y0 + 1.1, .1], M.ledGreen, null, 10);
  // Gauge: a half dial. The game rotates the needle; the budget mark shows today's limit.
  const gauge = node(g, 'power_gauge', [-.2, y0 + .95, .095]);
  cyl(gauge, '_dial', .26, .26, .01, [0, 0, 0], M.hull, [Math.PI / 2, 0, 0], 28);
  torus(gauge, '_dial-rim', .26, .015, [0, 0, .01], M.alu, [0, 0, 0], Math.PI);
  const needle = node(gauge, 'power_needle', [0, 0, .015]);
  box(needle, 'needle', [.012, .22, .008], [0, .11, 0], M.red);
  const mark = node(gauge, 'budget_mark', [0, 0, .016]);
  box(mark, 'mark', [.03, .07, .006], [0, .22, 0], M.orange);
  return g;
}

/** Landing planner table: the game builds the live hologram map on holo_surface. */
export function landingPlanner() {
  const g = root('landing-planner', 'Landing planner table with a hologram surface, side screen and lamp ring', ['holo_surface', 'planner_screen', 'holo_ring']);
  cyl(g, '_base', .45, .55, .12, [0, .06, 0], M.steel, null, 24);
  cyl(g, '_post', .14, .18, .72, [0, .48, 0], M.panel, null, 16);
  cyl(g, '_top', .78, .72, .1, [0, .88, 0], M.panel, null, 36);
  cyl(g, '_top-glass', .7, .7, .015, [0, .94, 0], M.screenDark, null, 36);
  torus(g, 'holo_ring', .72, .02, [0, .945, 0], M.ledGreen, [Math.PI / 2, 0, 0]);
  node(g, 'holo_surface', [0, .96, 0]);
  const screen = node(g, '_screen-arm', [0, .95, -.72]);
  box(screen, '_arm', [.06, .4, .06], [0, .2, 0], M.steel);
  box(g, 'planner_screen', [.7, .42, .03], [0, 1.55, -.75], M.screen, [-.25, 0, 0]);
  return g;
}

/** Wall locker with spare parts: an amplifier and the signal tester sit on its shelf. */
export function sparesCase() {
  const g = root('spares-case', 'Spare-parts locker with a hinged door and two shelf slots', ['case_door', 'slot_amp', 'slot_tester']);
  const w = 1.1, h = 1.1, d = .45, y0 = .55;
  box(g, '_back', [w, h, .04], [0, y0 + h / 2, -d / 2], M.panel);
  for (const sx of [-1, 1]) box(g, '_side', [.04, h, d], [sx * w / 2, y0 + h / 2, 0], M.panel);
  box(g, '_top', [w, .04, d], [0, y0 + h, 0], M.panel); box(g, '_bottom', [w, .04, d], [0, y0, 0], M.panel);
  box(g, '_shelf', [w - .08, .03, d - .04], [0, y0 + .5, 0], M.steel);
  box(g, '_legs', [w, y0, .05], [0, y0 / 2, -d / 2 + .05], M.steel);
  node(g, 'slot_amp', [-.24, y0 + .52, .02]);
  node(g, 'slot_tester', [.28, y0 + .52, .02]);
  const door = node(g, 'case_door', [-w / 2, y0 + h / 2, d / 2]);
  rbox(door, 'door-panel', [w, h - .02, .03], [w / 2, 0, 0], M.hullWarm, .015);
  box(door, 'door-window', [w * .6, h * .3, .01], [w / 2, .2, .02], M.glass);
  box(door, 'door-handle', [.04, .2, .04], [w - .08, 0, .04], M.orange);
  hazard(node(door, '_hz', [w / 2, -h / 2 + .1, .02]), w - .1, .06, [0, 0, 0], 6);
  return g;
}

/** Spare signal amplifier (same shape as the one in the rack). */
export function ampModule() {
  const g = root('amp-module', 'Spare radio signal amplifier module', ['amp_body']);
  const b = node(g, 'amp_body', [0, .13, 0]);
  rbox(b, 'amp-body', [.6, .26, .14], [0, 0, 0], M.alu, .02);
  for (let i = 0; i < 7; i++) box(b, 'amp-fin', [.012, .2, .05], [-.24 + i * .08, 0, .09], M.steel);
  box(b, 'amp-tag', [.16, .06, .005], [.18, .08, .072], M.green);
  return g;
}

/** Hand-held signal tester with a clip lead and a little screen. */
export function signalTester() {
  const g = root('signal-tester', 'Hand-held signal tester with a clip lead', ['tester_screen', 'clip']);
  rbox(g, '_body', [.16, .26, .06], [0, .13, 0], M.yellow, .02);
  box(g, 'tester_screen', [.11, .08, .005], [0, .19, .032], M.screen);
  for (let i = 0; i < 3; i++) cyl(g, '_btn', .012, .012, .01, [-.04 + i * .04, .08, .032], M.dark, [Math.PI / 2, 0, 0], 8);
  tube(g, '_lead', [[0, .26, 0], [.05, .34, .02], [.14, .3, .04], [.2, .22, .04]], .008, M.red, 10);
  const clip = node(g, 'clip', [.2, .2, .04]);
  box(clip, 'clip-jaw', [.03, .06, .02], [0, 0, 0], M.red);
  return g;
}

export const DESIGNS = {
  'orbiter-cabin': orbiterCabin, 'comm-rack': commRack, 'power-panel': powerPanel, 'landing-planner': landingPlanner,
  'spares-case': sparesCase, 'amp-module': ampModule, 'signal-tester': signalTester,
};
