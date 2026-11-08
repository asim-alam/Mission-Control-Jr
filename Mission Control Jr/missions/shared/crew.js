// Crew characters built from crew-member.glb: per-person look plus a code-driven walk cycle.
import * as THREE from 'three';
import {loadModel, part} from './engine.js';
import {missionAsset} from './assets.js';

export const CREW_LOOKS = {
  elena: {name: 'Elena', hair: 'hair_bun', suit: 0x3f6fc4, skin: 0xd9a27c, hairColor: 0x3a2416},
  amara: {name: 'Amara', hair: 'hair_curly', suit: 0x8a5cc7, skin: 0x7a4a30, hairColor: 0x1b120c},
  jin: {name: 'Jin', hair: 'hair_short', suit: 0x2f9a83, skin: 0xe6b98f, hairColor: 0x111111},
  luca: {name: 'Luca', hair: 'hair_cap', suit: 0xd0613a, skin: 0xc58b62, hairColor: 0x5a3b22},
};

export async function makeCrew(id, {suitMode = false} = {}) {
  const look = CREW_LOOKS[id];
  const model = await loadModel(missionAsset('crew-member'));
  for (const h of ['hair_short', 'hair_bun', 'hair_curly', 'hair_cap']) part(model, h).visible = !suitMode && h === look.hair;
  part(model, 'helmet').visible = suitMode; part(model, 'pack').visible = suitMode;
  model.traverse(o => {
    if (!o.isMesh) return;
    if (o.material.name === 'crew-suit') o.material.color.set(suitMode ? 0xeeeeea : look.suit);
    if (o.material.name === 'crew-skin') o.material.color.set(look.skin);
    if (o.material.name === 'crew-hair') o.material.color.set(look.hairColor);
  });
  const limbs = Object.fromEntries(['hips', 'torso', 'head', 'arm_l', 'arm_r', 'leg_l', 'leg_r'].map(n => [n, part(model, n)]));
  const person = {
    id, look, model, limbs, target: null, speed: 1.3, mode: 'idle', phase: Math.random() * 6, onArrive: null,
    walkTo(x, z, onArrive) { this.route = []; this.target = new THREE.Vector3(x, 0, z); this.mode = 'walk'; this.onArrive = onArrive || null; },
    /** Follow waypoints [{x,z}] (for example from navigation.planRoute), then call onArrive. */
    walkRoute(points, onArrive) { if (!points.length) { onArrive?.(); return; } this.route = points.slice(1); this.walkTo(points[0].x, points[0].z, onArrive); this.route = points.slice(1); },
    teleport(x, z, yaw = 0) { model.position.set(x, 0, z); model.rotation.y = yaw; this.target = null; this.mode = 'idle'; },
    face(x, z) { model.rotation.y = Math.atan2(x - model.position.x, z - model.position.z); },
    update(dt) {
      this.phase += dt * (this.mode === 'walk' ? 7 : 1.6);
      const s = Math.sin(this.phase);
      if (this.mode === 'walk' && this.target) {
        const d = this.target.clone().sub(model.position); d.y = 0; const dist = d.length();
        if (dist < .06) { if (this.route?.length) { const n = this.route.shift(); this.target.set(n.x, 0, n.z); } else { this.mode = 'idle'; this.target = null; const done = this.onArrive; this.onArrive = null; done?.(); } }
        else {
          const want = Math.atan2(d.x, d.z); let diff = want - model.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          model.rotation.y += diff * Math.min(1, dt * 8); model.position.addScaledVector(d.normalize(), Math.min(dist, dt * this.speed));
        }
      }
      const walk = this.mode === 'walk' ? 1 : 0, wave = this.mode === 'wave' ? 1 : 0, work = this.mode === 'work' ? 1 : 0, sit = this.mode === 'sit' ? 1 : 0;
      limbs.leg_l.rotation.x = walk * s * .6 - sit * 1.45; limbs.leg_r.rotation.x = -walk * s * .6 - sit * 1.45;
      limbs.arm_l.rotation.x = -walk * s * .5 - work * (.9 + Math.sin(this.phase * 3) * .2);
      limbs.arm_r.rotation.x = walk * s * .5 - work * (.9 + Math.cos(this.phase * 3) * .2);
      limbs.arm_r.rotation.z = wave * (2.6 + Math.sin(this.phase * 5) * .35);
      limbs.hips.position.y = .86 + walk * Math.abs(s) * .03 - sit * .36;
      limbs.torso.rotation.x = work * .25 + Math.sin(this.phase) * .015;
      limbs.head.rotation.y = this.mode === 'idle' ? Math.sin(this.phase * .4) * .25 : 0;
    },
  };
  return person;
}
