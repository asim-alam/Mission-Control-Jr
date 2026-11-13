import {collisionAt, terrainFactor, travelCost} from './region.js';

export function move(state, x, z) {
  if (collisionAt(x, z)) return {metres: 0, stopped: 'obstacle'};
  const travel = travelCost(state, {x, z});
  state.minutes += travel.minutes;
  state.x = x;
  state.z = z;
  return travel;
}

export function driveManual(state, motion, input, dt) {
  const traction = terrainFactor(state.x, state.z) > 1.8 ? .66 : 1;
  const goal = input.brake ? 0 : input.throttle * (input.throttle < 0 ? 5 : 13) * traction;
  const change = (input.brake ? 26 : input.throttle ? 10 : 5.5) * dt;
  motion.speed += Math.max(-change, Math.min(change, goal - motion.speed));
  motion.steer = -input.steer;
  if (Math.abs(motion.speed) < .001) return {metres: 0};
  state.heading += motion.steer * Math.min(1, Math.abs(motion.speed) / 3.4) * Math.sign(motion.speed) * 1.48 * dt;
  const travelled = motion.speed * dt;
  const result = move(state, state.x + Math.sin(state.heading) * travelled, state.z + Math.cos(state.heading) * travelled);
  if (result.stopped) motion.speed = 0;
  return result;
}

export function driveAssisted(state, trip, dt) {
  let budget = dt * 18;
  let metres = 0;
  while (trip.index < trip.points.length && budget > .0001) {
    const next = trip.points[trip.index];
    const dx = next.x - state.x, dz = next.z - state.z;
    const distance = Math.hypot(dx, dz);
    if (distance < .001) {
      trip.index++;
      continue;
    }
    const step = Math.min(budget, distance);
    state.heading = Math.atan2(dx, dz);
    const result = move(state, state.x + dx * step / distance, state.z + dz * step / distance);
    if (result.stopped) return {metres, stopped: result.stopped};
    budget -= step;
    metres += step;
    if (step === distance) trip.index++;
  }
  return {metres, done: trip.index === trip.points.length};
}
