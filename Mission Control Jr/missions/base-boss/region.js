import {jezeroHeight, distance} from '../../expedition-terrain.js';

export const bounds = {minX: -216, maxX: 216, minZ: -194, maxZ: 165};
export const sites = {
  meridian: {name: 'Meridian', role: 'Command & life support', x: -70, z: 52, model: 'habitat', contact: 'Reyes', code: 'M01', color: '#efc888', y: 1.5},
  forge: {name: 'Forge', role: 'Freight depot', x: -153, z: -45, model: 'forge', contact: 'Jin', code: 'F02', color: '#ee9d62', y: 5},
  kestrel: {name: 'Kestrel', role: 'Ridge relay', x: 8, z: -127, model: 'kestrel', contact: 'Noor', code: 'K03', color: '#9dc9e5', y: 16},
  pathfinder: {name: 'Pathfinder', role: 'Science & shelter', x: 148, z: -72, model: 'pathfinder', contact: 'Luca', code: 'P04', color: '#d9abdc', y: 7},
  verdant: {name: 'Verdant', role: 'Water & food', x: 122, z: 58, model: 'verdant', contact: 'Amara', code: 'V05', color: '#a6d9ac', y: 2.5},
  cache: {name: 'Landing Cache', role: 'Pre-landed cargo', x: -7, z: 111, model: 'landing-cache', contact: 'Cargo beacon', code: 'C06', color: '#efd06d', y: 2},
};
const point = (x, z) => ({x, z});
const roads = [
  ['meridian', 'forge', [point(-111, 25), point(-137, -4)]],
  ['forge', 'kestrel', [point(-128, -81), point(-74, -105), point(-38, -116)]],
  ['kestrel', 'pathfinder', [point(48, -137), point(98, -127), point(128, -106)]],
  ['pathfinder', 'verdant', [point(166, -27), point(154, 22)]],
  ['meridian', 'cache', [point(-56, 86), point(-33, 103)]],
  ['cache', 'verdant', [point(37, 92), point(78, 77)], 'Service cut'],
  ['cache', 'verdant', [point(35, 136), point(95, 132), point(130, 101)], 'Wash bypass'],
  ['meridian', 'kestrel', [point(-52, -6), point(-19, -60), point(-2, -95)]],
];
export const routes = roads.map(([from, to, waypoints, name]) =>
  ({from, to, name, points: [sites[from], ...waypoints, sites[to]]}));

const campusFootprints = {
  meridian: {minX: -7.8, maxX: 8.8, minZ: -12.7, maxZ: 7.5},
  verdant: {minX: -8.2, maxX: 8.1, minZ: -9.6, maxZ: 6.1},
};
function occupies(facility, x, z, clearance = 0) {
  const dx = x - facility.x, dz = z - facility.z;
  if (!facility.footprint) return Math.hypot(dx, dz) < facility.radius + clearance;
  const cos = Math.cos(facility.heading), sin = Math.sin(facility.heading);
  const east = dx * cos - dz * sin;
  const north = dx * sin + dz * cos;
  const {minX, maxX, minZ, maxZ} = facility.footprint;
  return east > minX - clearance && east < maxX + clearance &&
    north > minZ - clearance && north < maxZ + clearance;
}
const roadSamples = routes.flatMap(route => route.points.slice(1).flatMap((b, i) => {
  const a = route.points[i];
  const n = Math.max(1, Math.ceil(distance(a, b)));
  return Array.from({length: n + 1}, (_, j) => point(a.x + (b.x - a.x) * j / n, a.z + (b.z - a.z) * j / n));
}));

export const facilities = Object.fromEntries(Object.entries(sites).map(([id, site]) => {
  const radius = id === 'cache' ? 3.6 : 7;
  const footprint = campusFootprints[id];
  const range = id === 'cache' ? 10 : footprint ? 20.5 : 15.5;
  // Choose a pad edge away from every incoming track, then face the docking apron.
  const candidates = Array.from({length: 32}, (_, i) => {
    const angle = i * Math.PI / 16;
    const x = site.x + Math.sin(angle) * range;
    const z = site.z - Math.cos(angle) * range;
    return {x, z, radius, footprint, heading: Math.atan2(site.x - x, site.z - z)};
  });
  const safe = candidates.find(candidate => !roadSamples.some(p => occupies(candidate, p.x, p.z, 2)));
  return [id, safe ?? candidates.reduce((best, next) => {
    const count = candidate => roadSamples.filter(p => occupies(candidate, p.x, p.z, 2)).length;
    return count(next) < count(best) ? next : best;
  })];
}));

export function collisionAt(x, z) {
  const margin = 8;
  if (x < bounds.minX + margin || x > bounds.maxX - margin ||
      z < bounds.minZ + margin || z > bounds.maxZ - margin) return true;
  return Object.values(facilities).some(facility => occupies(facility, x, z, .5));
}

export const quests = {
  valve: {
    title: 'One Crate Before Dark', from: 'meridian', pickup: 'cache', to: 'verdant', cargo: 'Recycler valve',
    brief: 'Reyes: “Amara’s water recycler needs a valve. Pick one up at Landing Cache and take it to Verdant. The short, rough cut is quicker. The longer wash bypass is an easier drive.”',
    pickupBrief: 'Cargo beacon: “This is the spare for Verdant. Load it and check your route. The wash bypass is smoother, but takes longer.”',
    deliveryBrief: 'Amara: “You found the valve! Help me fit it so we can reuse our water and get the plants growing.”',
    pickupAction: 'Load the valve crate', deliveryAction: 'Install the spare valve',
    source: 'dust',
  },
  relay: {
    title: 'A Signal from the Ridge', from: 'forge', pickup: 'forge', to: 'kestrel', cargo: 'Relay amplifier',
    brief: 'Jin: “Kestrel’s radio can’t reach the orbiter. I have a spare amplifier here at Forge. Take it to Noor on the ridge.”',
    deliveryBrief: 'Noor: “Let’s fit Jin’s spare, then send a test message. The reply takes time because the signal has to travel all the way to Earth and back.”',
    pickupAction: 'Load the amplifier', deliveryAction: 'Fit the amplifier',
    outcome: 'Kestrel can reach the orbiter again. Send Earth a test message while you keep working.',
    source: 'delay',
  },
  sample: {
    title: 'Read the Rock Layers', from: 'pathfinder', pickup: 'pathfinder', to: 'meridian', cargo: 'Sealed geology sample',
    brief: 'Luca: “See the stripes in that rock? Each layer might tell a different part of Mars’s story. Take our sealed sample to Meridian’s lab with its field notes.”',
    pickupAction: 'Collect the sealed sample', deliveryAction: 'Hand the sample to the lab',
    outcome: 'Meridian has the sealed rock and its survey notes. Scientists can compare it with samples from other layers.',
    source: 'terrain',
  },
  food: {
    title: 'A Fresh Delivery', from: 'verdant', pickup: 'verdant', to: 'forge', cargo: 'Fresh greens',
    brief: 'Amara: “The recycler kept our plants watered. Forge sent us spare parts, so let’s share our first fresh harvest with their crew.”',
    requires: 'valve', pickupAction: 'Load the harvest', deliveryAction: 'Deliver fresh food',
    outcome: 'Forge has fresh greens alongside its packed meals. The harvest depended on the water repair.',
    source: 'food',
  },
  shelter: {
    title: 'Make Room to Shelter', from: 'meridian', pickup: 'meridian', to: 'pathfinder', cargo: 'Shelter supplies',
    brief: 'Reyes: “A space weather alert is coming. Take shelter supplies to Pathfinder so Luca’s team can stop work outside and wait it out inside.”',
    pickupAction: 'Load the shelter supplies', deliveryAction: 'Stock the field shelter',
    outcome: 'Pathfinder paused outdoor work and stocked its refuge. Extra shielding can reduce exposure during a solar particle event.',
    source: 'radiation',
  },
};

export function segmentDistance(x, z, a, b) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx ** 2 + dz ** 2 || 1)));
  return Math.hypot(x - a.x - dx * t, z - a.z - dz * t);
}

const siteEntries = Object.entries(sites);
const cut = routes.find(route => route.name === 'Service cut').points;
const hills = [
  [-178, -150, 28, 58, 27], [-90, -156, 34, 40, 29], [12, -168, 27, 62, 39],
  [122, -163, 37, 55, 37], [204, -132, 44, 39, 41], [199, 3, 25, 33, 47],
  [-208, 38, 30, 32, 65], [-99, 145, 22, 58, 32], [39, 80, 8, 36, 26],
  [58, -47, 19, 38, 36], [-87, -51, 12, 26, 33],
];
function smooth(t) {
  const n = Math.max(0, Math.min(1, t));
  return n * n * (3 - 2 * n);
}
export function ground(x, z) {
  let height = jezeroHeight(x * .43, z * .62 - 70) * .56 + 1.7;
  for (const [cx, cz, h, rx, rz] of hills) {
    height += h * Math.exp(-(((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2));
  }
  for (const [id, site] of siteEntries) {
    const nearPad = Math.hypot(x - site.x, z - (site.z - 5));
    const base = facilities[id];
    const nearCampus = base.footprint ? Math.hypot(x - base.x, z - base.z) + 3 : Infinity;
    const flat = smooth((Math.min(nearPad, nearCampus) - 18) / 17);
    if (flat < 1) height = site.y * (1 - flat) + height * flat;
  }
  return height;
}

export function nearestSite(position) {
  return siteEntries.reduce((nearest, [id, site]) =>
    distance(position, site) < distance(position, sites[nearest]) ? id : nearest, 'meridian');
}

export function terrainFactor(x, z) {
  if (cut.slice(1).some((b, i) => segmentDistance(x, z, cut[i], b) < 12) &&
      distance({x, z}, sites.cache) > 17 && distance({x, z}, sites.verdant) > 17) return 2.15;
  return Math.abs(ground(x + .6, z) - ground(x - .6, z)) +
    Math.abs(ground(x, z + .6) - ground(x, z - .6)) > .43 ? 1.3 : 1;
}
export const minutesPerMetre = .067;
export function travelCost(a, b) {
  const metres = distance(a, b);
  const count = Math.max(1, Math.ceil(metres / 1.5));
  let terrain = 0;
  for (let i = 0; i < count; i++) {
    const t = (i + .5) / count;
    terrain += metres / count * terrainFactor(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t);
  }
  return {minutes: metres * minutesPerMetre, metres, terrain};
}

export function routeStats(points) {
  return points.slice(1).reduce((total, next, i) => {
    const step = travelCost(points[i], next);
    return {minutes: total.minutes + step.minutes, metres: total.metres + step.metres, terrain: total.terrain + step.terrain};
  }, {minutes: 0, metres: 0, terrain: 0});
}

export function planRoute(position, destination, preference = 'fast') {
  const origin = nearestSite(position);
  const entry = distance(position, sites[origin]) < .02 ? [position] : [position, sites[origin]];
  const paths = {[origin]: {score: 0, points: entry, name: ''}};
  const unvisited = new Set(Object.keys(sites));
  while (unvisited.size) {
    const current = [...unvisited].filter(id => paths[id]).sort((a, b) => paths[a].score - paths[b].score)[0];
    if (!current) break;
    if (current === destination) {
      return {...paths[current], ...routeStats(paths[current].points)};
    }
    unvisited.delete(current);
    for (const route of routes) {
      const next = route.from === current ? route.to : route.to === current ? route.from : null;
      if (!unvisited.has(next)) continue;
      const points = route.from === current ? route.points : [...route.points].reverse();
      const stats = routeStats(points);
    const score = paths[current].score + (preference === 'eco' ? stats.terrain : stats.minutes);
      if (!paths[next] || score < paths[next].score) {
        paths[next] = {score, points: [...paths[current].points, ...points.slice(1)], name: route.name || paths[current].name};
      }
    }
  }
  return null;
}
