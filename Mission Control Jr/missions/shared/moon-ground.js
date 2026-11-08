// The made-up Moon south-pole site shared by the three lunar missions.
// One height function feeds the GLB terrain generator, the 3D scene (placing things on the ground)
// and the game rules (sunlight and radio line of sight), so what you see is what the rules use.
//
// Layout (metres, +x east, -z north):
//   Horizon Base sits on a flat pad at the origin.
//   A long ridge ("Long Ridge") runs east–west about 45 m north of the base, 10 m high.
//   A rocky knob on the ridge crest stands west of the ridge pad.
//   A small hill ("East Hill") sits east of the near pad.
//   Beyond the ridge lies the far science site (Shadow Hollow).
// The SOURCED facts used with this map are elsewhere: LOLA sunlight averages, the Sun's low path
// near the pole, and the Earth–Moon light time. The terrain itself is fictional.

export const SITE = {
  size: 170,                    // terrain square, metres
  base: {x: 0, z: 0},
  powerPort: {x: -.8, z: -2.45},
  ridge: {z: -45, height: 10, halfWidth: 7.5, x0: -70, x1: 70},
  knob: {x: -27, z: -46.5, height: 6.4, radius: 5},
  eastHill: {x: 28, z: -18, height: 7.4, radius: 7},
  pads: {near: {x: 12, z: -17}, ridge: {x: -12, z: -44}},
  relay: {near: {x: -8, z: -22}, saddle: {x: 14, z: -41.8}, far: {x: 16, z: -78}},
};

const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const bump = (x, z, cx, cz, r, h) => { const d = Math.hypot(x - cx, z - cz) / r; return d >= 1 ? 0 : h * (Math.cos(d * Math.PI) * .5 + .5); };
const crater = (x, z, cx, cz, r, depth) => {
  const d = Math.hypot(x - cx, z - cz) / r;
  if (d > 1.6) return 0;
  if (d < 1) return -depth * (1 - d * d) + depth * .25 * d ** 6;
  return depth * .25 * Math.cos((d - 1) / .6 * Math.PI / 2) ** 2;
};
// Gentle deterministic ripples so the ground never looks flat.
const ripple = (x, z) => .22 * Math.sin(x * .21 + z * .07) * Math.cos(z * .18 - x * .05) + .12 * Math.sin(x * .53 + 1.3) * Math.sin(z * .47 + .4);

/** Ground height (metres) at (x, z). Pure and deterministic. */
export function groundHeight(x, z) {
  const {ridge, knob, eastHill} = SITE;
  // Long Ridge: a smooth east–west wall that fades at its ends, with a low saddle where the relay goes.
  const across = Math.abs(z - ridge.z) / ridge.halfWidth;
  const along = smooth((x - ridge.x0) / 12) * smooth((ridge.x1 - x) / 12);
  const saddle = 1 - .2 * Math.exp(-(((x - SITE.relay.saddle.x) / 9) ** 2));
  let h = across < 1 ? ridge.height * along * saddle * (Math.cos(across * Math.PI) * .5 + .5) : 0;
  h += crater(x, z, 16, -80, 11, 3);
  h += bump(x, z, knob.x, knob.z, knob.radius, knob.height);
  h += bump(x, z, eastHill.x, eastHill.z, eastHill.radius, eastHill.height);
  // Craters and rolling ground.
  h += crater(x, z, -26, -10, 7, 1.6) + crater(x, z, 34, 14, 9, 2) + crater(x, z, -40, 30, 12, 2.4) + crater(x, z, 40, -70, 10, 1.8) + crater(x, z, -10, -82, 6, 1.2);
  h += bump(x, z, 4.6, -13, 3.6, 5.6); // a rubble mound south-west of the near pad
  h += bump(x, z, -48, -16, 14, 2.2) + bump(x, z, 52, 34, 18, 3) + bump(x, z, -10, 50, 20, 2.5);
  h += ripple(x, z);
  // Flatten the base pad and the two solar pads (crews level them).
  const flat = (cx, cz, r, level) => { const d = Math.hypot(x - cx, z - cz); const k = 1 - smooth((d - r) / 4); h = h * (1 - k) + level * k; };
  flat(0, 0, 9, 0);
  flat(SITE.pads.near.x, SITE.pads.near.z, 2.2, groundRaw(SITE.pads.near.x, SITE.pads.near.z));
  flat(SITE.pads.ridge.x, SITE.pads.ridge.z, 2.2, groundRaw(SITE.pads.ridge.x, SITE.pads.ridge.z));
  return h;
}
// Height without the levelling step (used to set each pad's level).
function groundRaw(x, z) {
  const {ridge, knob, eastHill} = SITE;
  const across = Math.abs(z - ridge.z) / ridge.halfWidth;
  const along = smooth((x - ridge.x0) / 12) * smooth((ridge.x1 - x) / 12);
  const saddle = 1 - .2 * Math.exp(-(((x - SITE.relay.saddle.x) / 9) ** 2));
  let h = across < 1 ? ridge.height * along * saddle * (Math.cos(across * Math.PI) * .5 + .5) : 0;
  return h + bump(x, z, knob.x, knob.z, knob.radius, knob.height) + bump(x, z, eastHill.x, eastHill.z, eastHill.radius, eastHill.height);
}

/**
 * Distant mountains around the site, as the angle (degrees) they rise above a flat horizon,
 * for a compass direction. Azimuth: 0 = north (-z), 90 = east (+x).
 * Fictional, but like the real pole: far massifs stand about 1–2 degrees high.
 */
export function farHorizonDeg(azimuthDeg) {
  const a = ((azimuthDeg % 360) + 360) % 360;
  const peak = (c, w, h) => { const d = Math.min(Math.abs(a - c), 360 - Math.abs(a - c)); return d > w ? 0 : h * (Math.cos(d / w * Math.PI) * .5 + .5); };
  return .6 + peak(205, 12, 1.4) + peak(300, 15, .5) + peak(60, 12, .4);
}

/** Direction vector (x, z) for a compass azimuth. */
export const azimuthDir = deg => ({x: Math.sin(deg * Math.PI / 180), z: -Math.cos(deg * Math.PI / 180)});

/**
 * Is a point at height `eyeH` above the ground at (x, z) in sunlight, for a Sun at this azimuth and elevation?
 * Marches across the terrain toward the Sun, then checks the far horizon.
 */
export function sunlit(x, z, eyeH, azimuthDeg, elevationDeg) {
  if (farHorizonDeg(azimuthDeg) >= elevationDeg) return false;
  const d = azimuthDir(azimuthDeg), y0 = groundHeight(x, z) + eyeH, slope = Math.tan(elevationDeg * Math.PI / 180);
  for (let s = 1.5; s < SITE.size * .75; s += 1.5) {
    const px = x + d.x * s, pz = z + d.z * s;
    if (Math.abs(px) > SITE.size / 2 || Math.abs(pz) > SITE.size / 2) break;
    if (groundHeight(px, pz) > y0 + s * slope) return false;
  }
  return true;
}

/** Can two points see each other (radio line of sight)? Heights are above the local ground. */
export function lineOfSight(a, aH, b, bH, step = 1) {
  const ya = groundHeight(a.x, a.z) + aH, yb = groundHeight(b.x, b.z) + bH, dist = Math.hypot(b.x - a.x, b.z - a.z);
  let clearance = Infinity;
  for (let s = step; s < dist - step; s += step) {
    const t = s / dist, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
    clearance = Math.min(clearance, ya + (yb - ya) * t - groundHeight(x, z));
  }
  return {clear: clearance > 0, clearance: +clearance.toFixed(2), distance: +dist.toFixed(1)};
}
