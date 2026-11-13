import {collisionAt, facilities, segmentDistance, sites} from './region.js';

export const boardRange = 3.6;
export const contactRange = 2.8;
export const suitRange = 36;
export const rangeBetween = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

// The service beacon stands between the parking pad and the facility.
export const servicePosts = Object.fromEntries(Object.entries(sites).map(([id, site]) => {
  const heading = facilities[id].heading;
  return [id, {x: site.x + Math.sin(heading) * 5, z: site.z + Math.cos(heading) * 5}];
}));

export function stepOut(rover, site) {
  const post = servicePosts[site];
  let fallback = null;
  for (const angle of [Math.PI / 2, -Math.PI / 2, Math.PI, 0]) {
    const direction = rover.heading + angle;
    const x = rover.x + Math.sin(direction) * 2.4;
    const z = rover.z + Math.cos(direction) * 2.4;
    if (collisionAt(x, z)) continue;
    const heading = post ? Math.atan2(post.x - x, post.z - z) : rover.heading;
    const astronaut = {x, z, heading, walking: false};
    if (!post || segmentDistance(rover.x, rover.z, astronaut, post) >= 1.65) return astronaut;
    fallback ??= astronaut;
  }
  return fallback;
}

export function walk(astronaut, rover, {throttle, steer}, dt) {
  astronaut.heading -= steer * 2.2 * dt;
  astronaut.walking = false;
  if (!throttle) return '';
  const step = throttle * (throttle < 0 ? 1.4 : 3.2) * dt;
  const x = astronaut.x + Math.sin(astronaut.heading) * step;
  const z = astronaut.z + Math.cos(astronaut.heading) * step;
  if (rangeBetween({x, z}, rover) > suitRange && rangeBetween({x, z}, rover) >= rangeBetween(astronaut, rover)) return 'range';
  if (collisionAt(x, z) || rangeBetween({x, z}, rover) < 1.65) return 'obstacle';
  Object.assign(astronaut, {x, z, walking: true});
  return '';
}
