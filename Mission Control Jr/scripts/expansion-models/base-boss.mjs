// Exterior hardware for the fictional Meridian expedition. Reference figures and
// implementation boundaries are documented in docs/BASE-BOSS-MODEL-REFERENCES.md.
import * as THREE from 'three';
import {M, box, rbox, cyl, torus, lathe, tube, node, root, add, sphere} from './kit.mjs';

const enamel = M.hull.clone();
enamel.name = 'warm-ceramic-insulation';
enamel.color.set(0xdad3c4);
const graphite = M.dark.clone();
graphite.name = 'shadowed-pressure-glass';
graphite.color.set(0x283538);
graphite.roughness = .26;
const blanket = M.fabric.clone();
blanket.name = 'oatmeal-thermal-blanket';
blanket.color.set(0xbcb19d);
const green = M.green.clone();
green.name = 'agriculture-identification';
green.color.set(0x5b7465);
const alongX = [0, 0, Math.PI / 2];
const alongZ = [Math.PI / 2, 0, 0];

function strut(g, a, b, radius, material = M.steel) {
  const start = new THREE.Vector3(...a);
  const direction = new THREE.Vector3(...b).sub(start);
  const center = start.addScaledVector(direction, .5);
  const part = cyl(g, '_strut', radius, radius, direction.length(), center.toArray(), material, null, 8);
  part.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
}

function deck(g, w, d, y = .65) {
  box(g, '_deck', [w, .18, d], [0, y, 0], M.floor);
  for (const x of [-w * .43, w * .43]) for (const z of [-d * .4, d * .4]) {
    strut(g, [x * .78, y, z * .78], [x, .15, z], .11);
    cyl(g, '_shoe', .24, .32, .12, [x, .06, z], M.steel, null, 12);
  }
  for (const x of [-w * .45, w * .45]) box(g, '_edge', [.07, .08, d], [x, y + .11, 0], M.yellow);
}

function roundHatch(g, p, radius) {
  const hatch = node(g, 'pressure_hatch', p);
  cyl(hatch, '_bulkhead', radius, radius, .18, [0, 0, 0], M.alu, alongZ, 24);
  cyl(hatch, '_seal', radius * .83, radius * .83, .20, [0, 0, .025], M.dark, alongZ, 24);
  cyl(hatch, '_plug', radius * .74, radius * .74, .22, [0, 0, .044], enamel, alongZ, 24);
  cyl(hatch, '_port', radius * .23, radius * .23, .05, [0, .18, .17], graphite, alongZ, 18);
  rbox(hatch, '_handle', [.21, .065, .09], [0, -.2, .185], M.yellow, .02);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    cyl(hatch, '_fastener', .026, .026, .05,
      [Math.sin(a) * radius * .89, Math.cos(a) * radius * .89, .105], M.steel, alongZ, 6);
  }
  return hatch;
}

function pressureModule(g, x, z, radius, length, accent, y = radius + .56) {
  const end = length / 2;
  const hull = lathe(g, '_shell', [[0, -end], [radius * .74, -end], [radius * .92, -end + .23],
    [radius, -end + .6], [radius, end - .6], [radius * .92, end - .23], [radius * .74, end], [0, end]],
    [x, y, z], enamel, 36);
  hull.rotation.x = Math.PI / 2;
  for (const offset of [-end + .61, -end / 2, end / 2, end - .61]) {
    torus(g, '_shell-collar', radius, .047, [x, y, z + offset], accent);
  }
  for (const s of [-1, 1]) {
    box(g, '_cradle', [.42, .47, length * .68], [x + s * radius * .44, .46, z], M.steel);
    for (const dz of [-length * .27, 0, length * .27]) {
      const p = node(g, '_external-bay', [x + s * (radius - .05), y - .28, z + dz], [0, s * Math.PI / 2, 0]);
      rbox(p, '_panel', [.91, .57, .16], [0, 0, 0], blanket, .045);
      box(p, '_mount', [.62, .05, .025], [0, -.14, .091], M.dark);
    }
  }
  const front = node(g, '_end-bulkhead', [x, y, z + end + .08]);
  roundHatch(front, [0, -.18, .10], Math.min(.82, radius * .58));
  for (const s of [-1, 1]) {
    cyl(front, '_window-ring', .21, .21, .105, [s * radius * .56, .36, .03], M.alu, alongZ, 16);
    cyl(front, '_window', .155, .155, .112, [s * radius * .56, .36, .06], graphite, alongZ, 16);
  }
  const porch = y - .91;
  box(g, '_porch', [2.1, .14, 1.64], [x, porch, z + end + .82], M.floor);
  for (let i = 0; i < 5; i++) {
    const top = porch * (5 - i) / 5;
    box(g, '_tread', [1.35, .07, .32], [x, top, z + end + 1.59 + i * .28], M.floor);
  }
  for (const s of [-1, 1]) {
    const railX = x + s * .76;
    strut(g, [railX, porch + .68, z + end + 1.31], [railX, .71, z + end + 2.9], .028, M.yellow);
    strut(g, [railX, porch, z + end + 1.31], [railX, porch + .68, z + end + 1.31], .028, M.yellow);
    strut(g, [railX, .12, z + end + 2.9], [railX, .71, z + end + 2.9], .028, M.yellow);
  }
  return {end, y};
}

const insulatedPanels = [0xbfb6a5, 0xa9a394, 0xd3c9b9, 0xc5baaa].map((color, index) => {
  const panel = enamel.clone();
  panel.name = `insulation-tile-${index}`;
  panel.color.set(color);
  panel.roughness = .68;
  return panel;
});
const portGlass = M.screen.clone();
portGlass.name = 'recessed-illuminated-port';
portGlass.color.set(0x164441);
portGlass.emissive.set(0x4de2d5);
portGlass.emissiveIntensity = .34;

function spoke(r, angle) {
  return [r * Math.sin(angle), r * Math.cos(angle)];
}

function aerial(g, x, y, z, height) {
  for (const side of [-1, 1]) {
    strut(g, [x + side * .27, y, z], [x + side * .08, y + height * .83, z], .025, M.alu);
    for (let i = 0; i < 4; i++) {
      const level = y + height * i * .19;
      strut(g, [x + side * .22, level, z], [x - side * .17, level + height * .18, z], .014);
    }
  }
  strut(g, [x, y + height * .72, z], [x, y + height, z], .025, M.alu);
  cyl(g, '_mast-beacon', .065, .065, .095, [x, y + height, z], M.ledAmber, null, 8);
}

function landingStair(g, x, y, z, width = 1.55) {
  const steps = Math.ceil(y / .23);
  const run = steps * .36;
  for (let i = 0; i < steps; i++) {
    box(g, '_grating-step', [width, .075, .29], [x, y * (steps - i) / steps, z + i * .36], M.floor);
  }
  for (const side of [-1, 1]) {
    const edge = x + side * (width / 2 + .055);
    strut(g, [edge, y - .15, z - .28], [edge, .08, z + run], .058);
    strut(g, [edge, y + .78, z - .28], [edge, .85, z + run], .028, M.yellow);
    for (const t of [0, .33, .66, 1]) {
      const postY = Math.max(.07, y * (1 - t));
      strut(g, [edge, postY, z + run * t], [edge, postY + .8, z + run * t], .026, M.steel);
    }
  }
}

function gantryWalk(g, x, y, z, length, width) {
  box(g, '_catwalk', [length, .16, width], [x, y, z], M.floor);
  for (const end of [-1, 1]) {
    const edge = x + end * length * .43;
    strut(g, [edge, .14, z], [edge, y, z], .082);
    strut(g, [edge, .25, z], [x, y, z], .038);
  }
  const count = Math.ceil(length / .95);
  for (const side of [-1, 1]) {
    const edge = z + side * width * .47;
    strut(g, [x - length / 2, y + .85, edge], [x + length / 2, y + .85, edge], .033, M.yellow);
    strut(g, [x - length / 2, y + .42, edge], [x + length / 2, y + .42, edge], .018, M.steel);
    for (let i = 0; i <= count; i++) {
      const post = x - length / 2 + i * length / count;
      strut(g, [post, y + .07, edge], [post, y + .85, edge], .024, M.alu);
    }
  }
}

function pressureBridge(g, a, b, y, radius) {
  const [x, z] = a;
  const dx = b[0] - x, dz = b[1] - z;
  const length = Math.hypot(dx, dz);
  const joint = node(g, '_pressure-bridge', [x + dx / 2, y, z + dz / 2], [0, Math.atan2(dx, dz), 0]);
  cyl(joint, '_tunnel', radius, radius, length, [0, 0, 0], blanket, alongZ, 20);
  for (let offset = -.45 * length; offset < .46 * length; offset += .74) {
    torus(joint, '_expansion-ring', radius + .015, .047, [0, 0, offset], M.steel);
  }
  for (const side of [-1, 1]) {
    strut(joint, [side * .35, -y + .1, 0], [side * radius * .75, -radius * .7, 0], .056);
  }
}

function drums(g, {x, z, radius, wall, base, crown, steps = true, accent = M.yellow}) {
  const floor = base + .22;
  const top = floor + wall;
  lathe(g, '_pressure-shell', [[0, base], [radius * .89, base], [radius, floor],
    [radius, top], [radius * .97, top + crown * .23], [radius * .78, top + crown * .61],
    [radius * .43, top + crown * .9], [0, top + crown]], [x, 0, z], enamel, 44);
  for (const y of [base + .04, floor + .11, floor + wall * .48, top + .05]) {
    torus(g, '_pressure-flange', radius + .013, y === top + .05 ? .095 : .045, [x, y, z],
      y === floor + .11 ? accent : M.steel, alongZ);
  }
  const segments = 16;
  for (let i = 0; i < segments; i++) {
    const angle = i * Math.PI * 2 / segments;
    const [dx, dz] = spoke(radius - .023, angle);
    const rot = [0, angle, 0];
    const tile = insulatedPanels[(i * 7 + Math.round(radius)) % insulatedPanels.length];
    if (i !== 0) box(g, '_insulation-panel', [radius * .348, wall - .32, .13], [x + dx, floor + wall * .5, z + dz], tile, rot);
    const [px, pz] = spoke(radius + .057, angle);
    const roofRib = [[1.008, 0], [.984, .23], [.793, .61], [.443, .9], [.15, .973]];
    const ribs = roofRib.map(([scale, height]) => {
      const [rx, rz] = spoke(radius * scale, angle);
      return [x + rx, top + crown * height + .026, z + rz];
    });
    for (let j = 1; j < ribs.length; j++) strut(g, ribs[j - 1], ribs[j], .029, M.steel);
    if (i % 3 === 1 || i === 15) {
      const port = node(g, '_pressure-port', [x + px, floor + wall * .68, z + pz], rot);
      cyl(port, '_recess-rim', .215, .215, .10, [0, 0, .029], M.steel, alongZ, 16);
      cyl(port, '_port-glass', .156, .156, .106, [0, 0, .046], portGlass, alongZ, 16);
    }
    if (i % 4 === 2) {
      const [sx, sz] = spoke(radius * .87, angle);
      strut(g, [x + dx, base + .09, z + dz], [x + sx, .10, z + sz], .095);
      strut(g, [x + dx * .78, base + .1, z + dz * .78], [x + sx, .19, z + sz], .059, M.alu);
      cyl(g, '_load-spreader', .29, .37, .12, [x + sx, .06, z + sz], M.steel, null, 12);
    }
  }
  for (const [scale, height] of [[.98, .23], [.79, .61], [.44, .9]]) {
    torus(g, '_roof-seam', radius * scale, .03, [x, top + crown * height + .025, z], M.steel, alongZ);
  }
  const bay = z + radius + .17;
  rbox(g, '_airlock-recess', [1.8, 2.22, .62], [x, floor + 1.09, bay], M.dark, .09);
  rbox(g, '_outer-airlock', [1.43, 1.95, .18], [x, floor + 1.05, bay + .35], blanket, .08);
  rbox(g, '_door-viewport', [.39, .36, .07], [x, floor + 1.55, bay + .47], graphite, .04);
  rbox(g, '_airlock-keypad', [.14, .34, .09], [x + .57, floor + 1.15, bay + .46], M.dark, .018);
  box(g, '_airlock-light', [.75, .08, .11], [x, floor + 2.23, bay + .42], M.lightStrip);
  box(g, '_entry-deck', [2.16, .15, 1.26], [x, floor, bay + .7], M.floor);
  if (steps) landingStair(g, x, floor, bay + 1.46);
  return top + crown;
}

function utilityRun(g, a, b, color = M.orange) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  strut(g, a, b, .074, color);
  for (const t of [.15, .5, .85]) {
    const p = start.clone().lerp(end, t);
    box(g, '_line-saddle', [.32, .12, .28], [p.x, p.y - .1, p.z], M.steel);
  }
}

// Keep the control nodes live while batching the fixed exterior by material.
function bakeArchitecture(g) {
  const live = new Set(g.userData.interactionNodes);
  const meshes = [];
  const decoration = [];
  function collect(parent) {
    for (const part of parent.children) {
      if (live.has(part.name)) continue;
      if (part.isMesh) meshes.push(part);
      else {
        decoration.push(part);
        collect(part);
      }
    }
  }
  g.updateMatrixWorld(true);
  collect(g);
  for (const mesh of meshes) {
    mesh.matrixWorld.decompose(mesh.position, mesh.quaternion, mesh.scale);
    g.add(mesh);
  }
  for (const part of decoration.reverse()) {
    if (!part.children.length) part.removeFromParent();
  }
  return g;
}

function habitat() {
  const g = root('base-boss-habitat', 'Meridian campus with tiered pressure modules, connected locks and a raised utility deck', ['site_status']);
  const towerTop = drums(g, {x: 1.7, z: -5.0, radius: 3.25, base: .86, wall: 4.4, crown: 1.86, steps: false});
  const controlTop = drums(g, {x: -4.3, z: .2, radius: 2.81, base: .82, wall: 2.52, crown: 1.55});
  pressureModule(g, 6.9, -5.1, 1.42, 7.0, blanket, 1.97);
  pressureModule(g, -3.85, -8.7, 1.73, 6.5, blanket, 2.20);
  pressureBridge(g, [-4.0, -.45], [1.65, -3.85], 2.04, .78);
  pressureBridge(g, [1.77, -5.65], [6.95, -5.65], 2.17, .87);
  pressureBridge(g, [-4, -7.1], [1.05, -6.3], 2.14, .81);
  gantryWalk(g, 2.4, 1.08, .1, 7.2, 1.68);
  landingStair(g, 5.2, 1.08, 1.04);
  aerial(g, 2.25, towerTop - .08, -4.9, 2.62);
  aerial(g, -4.7, controlTop - .17, .02, 1.5);
  const radio = node(g, '_roof-antenna', [-3.8, controlTop + .24, .5], [.52, .28, 0]);
  lathe(radio, '_reflector', [[0, 0], [.58, .07], [.82, .21], [.83, .18], [.57, .04], [0, -.035]], [0, 0, 0], M.alu, 24);
  strut(radio, [0, 0, 0], [0, .54, 0], .033, M.steel);
  for (const x of [-1.1, -.36, .38]) {
    cyl(g, '_buffer-tank', .31, .31, 1.66, [x, 1.27, 2.15], blanket, null, 16);
    torus(g, '_buffer-band', .315, .033, [x, 1.6, 2.15], M.steel, alongZ);
    cyl(g, '_tank-valve', .064, .08, .27, [x, 2.2, 2.15], M.yellow, null, 8);
  }
  box(g, '_tank-service-skid', [2.41, .24, 1.05], [-.36, .22, 2.15], M.floor);
  utilityRun(g, [-1.76, .36, 2.15], [-2.28, .36, -.45]);
  utilityRun(g, [1.19, .32, 2.52], [7.67, .32, 2.52], M.dark);
  for (const x of [6.45, 7.67]) {
    rbox(g, '_external-rack', [.98, .88, 1.42], [x, .59, 3.77], M.steel, .055);
    box(g, '_service-lid', [1.03, .17, 1.49], [x, 1.06, 3.77], blanket);
    for (const offset of [-.26, .26]) box(g, '_restraint-strap', [.067, .029, 1.42], [x + offset, 1.155, 3.77], M.orange);
  }
  const status = node(g, 'site_status', [-4.3, 2.1, 3.7]);
  box(status, '_entry-lamp', [.18, .075, .08], [0, 0, 0], M.ledGreen);
  return bakeArchitecture(g);
}

const observationGlass = M.glass.clone();
observationGlass.name = 'greenhouse-view-panels';
observationGlass.color.set(0xaec4aa);
observationGlass.opacity = .27;
observationGlass.roughness = .16;
const growDeck = M.lightStrip.clone();
growDeck.name = 'crop-worklight';
growDeck.color.set(0xe6d899);
growDeck.emissive.set(0xffdd82);
growDeck.emissiveIntensity = .55;

function solarTable(g, x, z, width = 3.7) {
  for (const end of [-1, 1]) strut(g, [x + end * width * .34, .06, z], [x + end * width * .34, .82, z], .07);
  const angle = -.26;
  box(g, '_array-rack', [width + .14, .095, 1.64], [x, .85, z], M.alu, [angle, 0, 0]);
  for (let i = 0; i < 8; i++) {
    box(g, '_photovoltaic-panel', [width / 8 - .028, .035, 1.5],
      [x + width * ((i + .5) / 8 - .5), .916, z], M.solar, [angle, 0, 0]);
  }
}

function greenhouse() {
  const g = root('base-boss-verdant', 'Verdant pressurized crop campus and inspection hall under a ribbed service canopy',
    ['recycler_mount', 'service_indicator', 'grow_lights']);
  const cx = -.75, cz = -1.9, y = 1.48, radius = 4.05;
  const hall = node(g, '_inspection-hall', [cx, 0, cz]);
  deck(hall, 7.35, 7.25, .59);
  cyl(hall, '_pressure-drum', radius, radius, .92, [0, 1.0, 0], blanket, null, 40);
  torus(hall, '_base-flange', radius, .073, [0, y, 0], M.steel, alongZ);
  // A limited viewing band surrounds the fictional service canopy.
  const segments = 16, topAngle = Math.PI * .28;
  for (let i = 0; i < segments; i++) {
    const angle = Math.PI * 2 * i / segments;
    const pane = new THREE.SphereGeometry(radius, 5, 7, angle, Math.PI * 2 / segments - .008,
      topAngle, Math.PI * .5 - topAngle);
    pane.scale(1, .64, 1);
    const shell = new THREE.Mesh(pane, observationGlass);
    shell.name = '_observation-pane';
    shell.position.y = y;
    add(hall, shell);
    const points = [];
    for (let step = 0; step <= 5; step++) {
      const theta = topAngle + (Math.PI * .5 - topAngle) * step / 5;
      points.push([-radius * Math.sin(theta) * Math.cos(angle), y + radius * .64 * Math.cos(theta),
        radius * Math.sin(theta) * Math.sin(angle)]);
    }
    tube(hall, '_canopy-rib', points, .047, M.steel, 8);
    const mid = (angle + Math.PI / segments);
    const [dx, dz] = spoke(radius - .11, mid);
    box(hall, '_thermal-skirt-panel', [1.4, .71, .12], [dx, 1.04, dz],
      insulatedPanels[i % insulatedPanels.length], [0, mid, 0]);
    if (i % 4 === 1) {
      const [ox, oz] = spoke(radius + .38, mid);
      strut(hall, [dx * .93, 1.69, dz * .93], [ox, .15, oz], .096);
      cyl(hall, '_support-shoe', .24, .30, .15, [ox, .08, oz], M.steel, null, 10);
    }
  }
  const roof = new THREE.SphereGeometry(radius, 40, 10, 0, Math.PI * 2, 0, topAngle);
  roof.scale(1, .64, 1);
  const cover = new THREE.Mesh(roof, enamel);
  cover.name = '_opaque-canopy';
  cover.position.y = y;
  add(hall, cover);
  torus(hall, '_thermal-collar', radius * Math.sin(topAngle), .059,
    [0, y + radius * .64 * Math.cos(topAngle), 0], M.alu, alongZ);
  cyl(hall, '_vent-drum', .65, .82, .26, [0, 4.03, 0], M.steel, null, 24);
  for (let i = 0; i < 7; i++) box(hall, '_roof-vent', [.05, .075, .8], [i * .13 - .39, 4.192, 0], M.alu);

  const lights = node(g, 'grow_lights', [cx, 0, cz]);
  for (const x of [-2.47, 2.47]) {
    for (const z of [-1.37, 1.35]) {
      for (const height of [1.63, 2.16]) {
        box(hall, '_enclosed-crop-rack', [.71, .15, 1.8], [x, height, z], M.floor);
        box(lights, '_grow-strip', [.63, .027, 1.65], [x, height + .36, z], growDeck);
        for (let i = 0; i < 7; i++) {
          sphere(hall, '_leaf-cluster', 1, [x + (i % 2 - .5) * .29, height + .16, z + i * .22 - .65],
            i % 3 ? M.leafDark : M.leaf, [.21, .105, .16], 8);
        }
      }
    }
  }
  const entrance = node(hall, '_service-lock', [0, .96, radius - .15]);
  rbox(entrance, '_lock-collar', [1.96, 1.95, 1.22], [0, .7, .37], M.steel, .24);
  roundHatch(entrance, [0, .66, 1], .73);
  box(entrance, '_entry-deck', [1.86, .15, 1.2], [0, -.1, 1.64], M.floor);
  // The hall deck is elevated; stair geometry is placed in ground coordinates.
  landingStair(hall, 0, .86, radius + 2.05);
  pressureModule(g, -6.25, -5.0, 1.43, 7.2, green);
  pressureModule(g, 4.85, -5.3, 1.36, 7.1, green);
  pressureBridge(g, [cx, cz - 1.3], [-6.1, -4.8], 1.9, .79);
  pressureBridge(g, [cx, cz - 1.3], [4.72, -4.8], 1.9, .75);
  for (const x of [5.25, 6.9]) {
    for (const z of [-.5, 1.15]) {
      cyl(g, '_water-cylinder', .39, .39, .93, [x, .63, z], M.panel, null, 16);
      torus(g, '_tank-collar', .397, .031, [x, .88, z], green, alongZ);
    }
  }
  solarTable(g, -6.15, -.17, 3.3);
  solarTable(g, -6.15, 1.87, 3.3);
  solarTable(g, -6.15, 3.91, 3.3);
  utilityRun(g, [4.66, .24, 1.72], [6.9, .24, 1.72], green);
  node(g, 'recycler_mount', [4.05, .1, 2.44]);
  const status = node(g, 'service_indicator', [cx + .65, 2.66, cz + radius + 1.04]);
  box(status, '_status-lamp', [.18, .085, .1], [0, 0, 0], M.ledAmber);
  return bakeArchitecture(g);
}

function valveCrate() {
  const g = root('base-boss-valve-crate', 'Strapped logistics case and replacement-valve storage',
    ['crate_lid', 'carry_grip', 'valve_stowage']);
  rbox(g, '_case-base', [.83, .10, .62], [0, .05, 0], blanket, .035);
  for (const x of [-.387, .387]) rbox(g, '_case-side', [.056, .32, .62], [x, .245, 0], blanket, .018);
  for (const z of [-.282, .282]) rbox(g, '_case-side', [.76, .32, .056], [0, .245, z], blanket, .018);
  box(g, '_case-lining', [.69, .042, .48], [0, .12, 0], M.foam);
  const lid = node(g, 'crate_lid', [0, .40, -.30]);
  rbox(lid, '_lid', [.86, .09, .65], [0, .05, .3], enamel, .025);
  for (const x of [-.26, .26]) {
    box(g, '_webbing', [.09, .40, .025], [x, .22, .32], M.orange);
    box(lid, '_webbing', [.09, .018, .61], [x, .097, .3], M.orange);
    box(g, '_buckle', [.13, .08, .03], [x, .34, .342], M.steel);
  }
  node(g, 'valve_stowage', [0, .21, 0]);
  node(g, 'carry_grip', [0, .53, 0]);
  return g;
}

function landingCache() {
  const g = root('base-boss-landing-cache', 'Pre-landed cargo transfer skid with locking guides and a locator mast',
    ['cache_slot_a', 'cache_slot_b', 'locator_light']);
  deck(g, 5.0, 4.2);
  for (const x of [-1.76, 1.76]) {
    box(g, '_strap-rail', [.13, .09, 3.94], [x, .79, 0], M.alu);
    for (const z of [-1.55, 1.52]) strut(g, [x, .74, z], [x * 1.22, .22, z * 1.16], .10);
  }
  rbox(g, '_avionics', [1.44, .77, .88], [0, 1.15, -1.42], enamel, .07);
  for (const x of [-.82, .82]) {
    box(g, '_slot-pallet', [1.21, .09, 1.25], [x, .79, .12], M.panel);
    box(g, '_slot-cleat', [1.19, .08, .06], [x, .85, -.44], M.orange);
  }
  node(g, 'cache_slot_a', [-.82, .84, .12]);
  node(g, 'cache_slot_b', [.82, .84, .12]);
  strut(g, [1.83, .75, -1.65], [1.83, 3.65, -1.65], .057, M.alu);
  const locator = node(g, 'locator_light', [1.83, 3.71, -1.65]);
  cyl(locator, '_beacon', .085, .085, .13, [0, 0, 0], M.ledAmber, null, 12);
  return g;
}

function depot() {
  const g = root('base-boss-forge', 'Cargo operations module with a freight gantry and restraint deck', []);
  pressureModule(g, -2.25, -1.9, 1.45, 6.7, M.orange);
  const dock = node(g, '_freight-deck', [2.55, 0, .2]);
  deck(dock, 4.4, 6.8);
  for (const x of [-1.98, 1.98]) {
    box(dock, '_upright', [.18, 3.6, .20], [x, 2.15, -.72], M.orange);
    strut(dock, [x, 3.4, -.73], [x, .78, -2.76], .08);
  }
  box(dock, '_gantry-crossbar', [4.6, .23, .25], [0, 3.98, -.72], M.orange);
  box(dock, '_hoist', [.62, .33, .47], [.72, 3.72, -.72], M.dark);
  strut(dock, [.72, 3.57, -.72], [.72, 2.34, -.72], .02, M.alu);
  for (const x of [1.02, 2.3, 3.62]) {
    rbox(g, '_sealed-cargo', [1.06, .73, 1.15], [x, 1.1, 1.74], blanket, .055);
    for (const offset of [-.32, .32]) box(g, '_cargo-strap', [.055, .04, 1.18], [x + offset, 1.49, 1.74], M.orange);
  }
  rbox(g, '_workshop', [3.16, 2.15, 2.22], [2.52, 1.25, -3.95], enamel, .18);
  box(g, '_workshop-door', [1.6, 1.63, .12], [2.51, 1.07, -2.8], M.steel);
  for (let i = 0; i < 7; i++) box(g, '_workshop-shutter', [1.45, .038, .045], [2.51, .49 + i * .2, -2.72], M.alu);
  utilityRun(g, [-.56, .32, -3.68], [1.1, .32, -3.68]);
  return bakeArchitecture(g);
}

function relay() {
  const g = root('base-boss-kestrel', 'High-gain relay on a braced pedestal with an electronics shelter',
    ['dish_azimuth', 'relay_status']);
  deck(g, 4.1, 4.25, .36);
  rbox(g, '_radio-rack', [2.48, 1.31, 1.06], [0, 1.12, 1.12], enamel, .065);
  for (const x of [-1.13, 1.13]) {
    strut(g, [x, .5, -1.14], [0, 4.22, -1.14], .089);
    strut(g, [x, .5, -.22], [0, 4.22, -1.14], .075);
  }
  cyl(g, '_mast', .16, .22, 3.9, [0, 2.43, -1.14], M.alu, null, 16);
  const dish = node(g, 'dish_azimuth', [0, 4.51, -1.14], [.51, -.5, 0]);
  const face = lathe(dish, '_reflector', [[0, -.038], [.73, .02], [1.28, .21], [1.72, .47],
    [1.72, .50], [1.28, .26], [.73, .072], [0, .02]], [0, 0, 0], enamel, 48);
  face.rotation.x = Math.PI / 2;
  torus(dish, '_dish-rim', 1.72, .033, [0, 0, .49], M.steel);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + .35;
    strut(dish, [1.6 * Math.cos(a), 1.6 * Math.sin(a), .43], [0, 0, 1.15], .029, M.alu);
  }
  cyl(dish, '_feed', .13, .16, .27, [0, 0, 1.13], M.panel, alongZ, 16);
  const lamp = node(g, 'relay_status', [.83, 1.52, 1.69]);
  box(lamp, '_indicator', [.16, .085, .05], [0, 0, 0], M.ledAmber);
  const top = drums(g, {x: -3.25, z: -1.2, radius: 1.33, base: .27, wall: 1.87, crown: .51, steps: false});
  aerial(g, -3.24, top, -1.25, 1.94);
  utilityRun(g, [-2.23, .22, -.23], [-.77, .22, -.23]);
  solarTable(g, 3.09, -.41, 2.51);
  solarTable(g, 3.09, -2.25, 2.51);
  return bakeArchitecture(g);
}

function fieldCamp() {
  const g = root('base-boss-pathfinder', 'Field pressure refuge, geology rack and tripod instruments',
    ['shelter_status', 'sample_bay']);
  pressureModule(g, -1.4, -1.5, 1.48, 5.8, M.orange);
  const mast = node(g, '_instrument-tripod', [2.35, 0, .9]);
  for (const angle of [0, 2.0944, 4.1888]) strut(mast, [Math.cos(angle) * .85, .05, Math.sin(angle) * .85], [0, 1.9, 0], .035);
  rbox(mast, '_science-head', [.55, .22, .35], [0, 1.93, 0], enamel, .035);
  cyl(mast, '_lens', .068, .068, .06, [0, 1.93, .2], graphite, alongZ, 14);
  box(g, '_sealed-sample-rack', [1.4, .58, .59], [2.1, .33, 2.4], blanket);
  node(g, 'sample_bay', [2.1, .63, 2.4]);
  const status = node(g, 'shelter_status', [-1.4, 2.76, 1.55]);
  box(status, '_status-lamp', [.24, .085, .10], [0, 0, 0], M.ledAmber);
  pressureBridge(g, [-1.43, -1.92], [1.8, -2.52], 1.45, .57);
  pressureModule(g, 1.86, -2.57, .92, 3.75, blanket, 1.43);
  for (const x of [-3.45, -2.86, -2.14, -1.36, -.61]) {
    sphere(g, '_berm-cover', 1, [x, .34, -3.73], M.marsDust, [.73, .86 + Math.abs(x) * .19, 1.2], 10);
  }
  utilityRun(g, [1.2, .28, .12], [2.82, .28, .12], M.dark);
  return bakeArchitecture(g);
}

function powerAnnex() {
  const g = root('base-boss-power-annex', 'Shielded fission surface power exterior and finned radiators', []);
  deck(g, 3.5, 2.3, .36);
  cyl(g, '_shielded-enclosure', .55, .67, 1.68, [0, 1.28, 0], enamel, null, 20);
  for (const side of [-1, 1]) {
    const radiator = node(g, '_radiator-bank', [side * 2.17, 1.4, 0], [0, 0, side * .12]);
    box(radiator, '_frame', [2.85, .11, 1.74], [0, 0, 0], M.steel);
    for (let i = 0; i < 14; i++) box(radiator, '_fin', [2.75, .10, .038], [0, .1, -.76 + i * .116], M.panel);
    strut(g, [side * 2.9, .1, 0], [side * 2.9, 1.38, 0], .055);
  }
  return g;
}

function crewRover() {
  const g = root('base-boss-utility-rover', 'Pressurized six-wheel expedition rover with metal cleated wheels and two payload stations',
    ['steer_left', 'steer_right', 'wheel_fl', 'wheel_fr', 'wheel_ml', 'wheel_mr',
      'wheel_rl', 'wheel_rr', 'cargo_slot_a', 'cargo_slot_b', 'charge_port'],
    {wheelRadiusMeters: .53});
  rbox(g, '_chassis', [2.32, .38, 4.93], [0, .94, .03], M.steel, .11);
  rbox(g, '_pressure-cabin', [2.3, 1.67, 3.88], [0, 1.85, .37], enamel, .53);
  rbox(g, '_front-windscreen', [1.62, .58, .13], [0, 2.19, 2.272], graphite, .10, [-.19, 0, 0]);
  box(g, '_windscreen-divider', [.044, .51, .044], [0, 2.19, 2.339], enamel, [-.19, 0, 0]);
  const rear = node(g, '_aft-bulkhead', [0, 1.82, -1.57], [0, Math.PI, 0]);
  roundHatch(rear, [0, 0, 0], .58);
  for (const side of [-1, 1]) {
    const visor = node(g, '_corner-window', [side * .92, 2.16, 2.13], [0, side * .68, 0]);
    rbox(visor, '_side-visor', [.45, .51, .085], [0, 0, 0], graphite, .07);
    rbox(g, '_side-window', [.10, .46, .88], [side * 1.15, 2.15, 1.02], graphite, .065);
    rbox(g, '_stowed-equipment', [.22, .62, 1.05], [side * 1.11, 1.64, -.48], blanket, .08);
    strut(g, [side * 1.19, 1.93, -1.12], [side * 1.19, 1.93, 1.42], .037, M.yellow);
    box(g, '_fender-marker', [.11, .14, 2.21], [side * 1.15, 1.04, -.25], M.orange);
    rbox(g, '_driving-light', [.32, .15, .085], [side * .68, 1.45, 2.21], M.lightStrip, .028);
    strut(g, [side * .92, .84, .4], [side * 1.27, .55, 1.77], .10);
    strut(g, [side * .92, .84, .4], [side * 1.28, .67, -.87], .088);
    strut(g, [side * 1.28, .67, -.87], [side * 1.31, .53, -2.02], .084);
    strut(g, [side * 1.28, .67, -.87], [side * 1.31, .53, -.18], .084);
    for (const [axle, z] of [['f', 1.77], ['m', -.18], ['r', -2.02]]) {
      const pos = [side * 1.39, .53, z];
      const suffix = side < 0 ? 'l' : 'r';
      const pivot = axle === 'f' ? node(g, side < 0 ? 'steer_left' : 'steer_right', pos) : g;
      const wheel = node(pivot, `wheel_${axle}${suffix}`, pivot === g ? pos : [0, 0, 0]);
      cyl(wheel, '_cleated-drum', .515, .515, .31, [0, 0, 0], M.steel, alongX, 28);
      cyl(wheel, '_rim-recess', .37, .37, .324, [0, 0, 0], M.dark, alongX, 22);
      cyl(wheel, '_hub', .127, .127, .39, [0, 0, 0], M.alu, alongX, 14);
      for (let i = 0; i < 24; i++) {
        const angle = i * Math.PI / 12;
        box(wheel, '_grouser', [.31, .031, .049], [0, Math.cos(angle) * .514, Math.sin(angle) * .514],
          M.panel, [angle, 0, 0]);
        if (i % 4 === 0) {
          const a = angle + .24;
          strut(wheel, [side * .18, Math.cos(angle) * .12, Math.sin(angle) * .12],
            [side * .17, Math.cos(a) * .36, Math.sin(a) * .36], .035, M.alu);
        }
      }
    }
  }
  rbox(g, '_rear-payload-deck', [2.04, .13, 1.26], [0, 1.06, -2.16], M.floor, .04);
  for (const x of [-1.0, 0, 1.0]) box(g, '_payload-guide', [.05, .11, 1.1], [x, 1.15, -2.16], M.orange);
  node(g, 'cargo_slot_a', [-.5, 1.13, -2.27]);
  node(g, 'cargo_slot_b', [.5, 1.13, -2.27]);
  node(g, 'charge_port', [1.25, 1.32, -.7]);
  strut(g, [.64, 2.58, .14], [.64, 3.23, .14], .024, M.alu);
  cyl(g, '_navigation-head', .12, .12, .14, [.64, 3.22, .14], graphite, null, 12);
  for (const x of [-.68, -.43, -.18]) box(g, '_roof-rack', [.055, .095, 1.48], [x, 2.69, -.15], M.panel);
  return g;
}

function charger() {
  const g = root('base-boss-charge-post', 'Surface distribution pedestal with a stowed rover power lead',
    ['charge_handle', 'charge_status']);
  rbox(g, '_plinth', [1.1, .19, .77], [0, .095, 0], M.floor, .035);
  rbox(g, '_cabinet', [.7, 1.31, .45], [0, .80, 0], enamel, .055);
  box(g, '_front', [.5, .32, .06], [0, 1.14, .228], M.dark);
  const status = node(g, 'charge_status', [0, 1.16, .264]);
  box(status, '_status-strip', [.34, .048, .02], [0, 0, 0], M.ledGreen);
  tube(g, '_power-lead', [[.25, .4, .16], [.46, .24, .22], [.59, .43, .25],
    [.52, .8, .27], [.37, .91, .28]], .026, M.rubber, 22);
  const plug = node(g, 'charge_handle', [.37, .91, .28]);
  rbox(plug, '_plug', [.088, .09, .17], [0, 0, .065], M.orange, .02);
  return g;
}

export const DESIGNS = {
  'base-boss-habitat': habitat,
  'base-boss-verdant': greenhouse,
  'base-boss-forge': depot,
  'base-boss-kestrel': relay,
  'base-boss-pathfinder': fieldCamp,
  'base-boss-power-annex': powerAnnex,
  'base-boss-landing-cache': landingCache,
  'base-boss-valve-crate': valveCrate,
  'base-boss-utility-rover': crewRover,
  'base-boss-charge-post': charger,
};
