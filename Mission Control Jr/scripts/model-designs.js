import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// Original, meter-scale models inspired by the supplied thumbnail reference.
// All surface details are geometry: the exported GLBs need no external files.
const materials = {
  ceramic: [0xe3e6e4, 0.15, 0.58],
  fabric: [0xcbd0ce, 0, 0.92],
  seam: [0x687579, 0.25, 0.78],
  graphite: [0x20282c, 0.35, 0.65],
  rubber: [0x12181b, 0, 0.95],
  titanium: [0x8e9da2, 0.8, 0.32],
  orange: [0xd97127, 0.22, 0.6],
  visor: [0x091c25, 0.82, 0.13],
  blue: [0x345c76, 0.55, 0.3],
  light: [0x95dedb, 0.2, 0.24, 0x4faaa9],
  red: [0xb53629, 0.25, 0.55],
};
const M = Object.fromEntries(Object.entries(materials).map(([name, [color, metalness, roughness, emissive = 0]]) => {
  const mat = new T.MeshStandardMaterial({ color, metalness, roughness, emissive });
  mat.name = name;
  return [name, mat];
}));
function group(name, parent, position = [0, 0, 0]) {
  const g = new T.Group(); g.name = name; g.position.set(...position); parent?.add(g); return g;
}
function mesh(g, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const m = new T.Mesh(geometry, M[material]);
  m.position.set(...position); m.rotation.set(...rotation); g.add(m); return m;
}
function box(g, size, material, pos, radius = 0.025, rotation) {
  return mesh(g, new RoundedBoxGeometry(...size, 2, radius), material, pos, rotation);
}
function sphere(g, size, material, pos) {
  const m = mesh(g, new T.SphereGeometry(1, 24, 16), material, pos); m.scale.set(...size); return m;
}
function cylinder(g, radius, height, material, pos, axis = 'y', segments = 32) {
  const rotation = axis === 'x' ? [0, 0, -Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0];
  return mesh(g, new T.CylinderGeometry(radius, radius, height, segments), material, pos, rotation);
}
function ring(g, radius, tube, material, pos, axis = 'z', segments = 48) {
  const rotation = axis === 'x' ? [0, Math.PI / 2, 0] : axis === 'y' ? [Math.PI / 2, 0, 0] : [0, 0, 0];
  return mesh(g, new T.TorusGeometry(radius, tube, 8, segments), material, pos, rotation);
}
function beam(g, a, b, radius, material) {
  const from = new T.Vector3(...a), to = new T.Vector3(...b);
  const m = cylinder(g, radius, from.distanceTo(to), material, from.clone().add(to).multiplyScalar(0.5).toArray());
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), to.sub(from).normalize());
  return m;
}
function hose(g, points, radius, material) {
  return mesh(g, new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p))), 32, radius, 8, false), material);
}
function bolts(g, count, radius, x, y, z, axis = 'z', boltSize = 0.025) {
  for (let i = 0; i < count; i++) {
    const a = i * Math.PI * 2 / count;
    cylinder(g, boltSize, boltSize * 0.7, 'titanium', axis === 'x'
      ? [x, y + Math.sin(a) * radius, z + Math.cos(a) * radius]
      : [x + Math.sin(a) * radius, y + Math.cos(a) * radius, z], axis, 6);
  }
}
const alphabet = {
  M: ['10001','11011','10101','10101','10001','10001','10001'],
  E: ['11111','10000','10000','11110','10000','10000','11111'],
  R: ['11110','10001','10001','11110','10100','10010','10001'],
  I: ['111','010','010','010','010','010','111'],
  D: ['11110','10001','10001','10001','10001','10001','11110'],
  A: ['01110','10001','10001','11111','10001','10001','10001'],
  N: ['10001','11001','11001','10101','10011','10011','10001'],
  '0': ['01110','10001','10011','10101','11001','10001','01110'],
  '1': ['010','110','010','010','010','010','111'],
  '2': ['01110','10001','00001','00010','00100','01000','11111'],
  ' ': ['000'],
};
function lettering(parent, word, pixel, material, position, rotation = [0, 0, 0]) {
  const g = group(`Marking ${word}`, parent, position); g.rotation.set(...rotation);
  let offset = 0;
  for (const char of word) {
    const rows = alphabet[char];
    for (let row = 0; row < rows.length; row++) for (let col = 0; col < rows[row].length; col++) {
      if (rows[row][col] === '1') mesh(g, new T.BoxGeometry(pixel * 0.82, pixel * 0.82, pixel * 0.12), material, [offset + col * pixel, -row * pixel, 0]);
    }
    offset += (rows[0].length + 1) * pixel;
  }
}

export function createAstronaut() {
  const g = group('Meridian EVA suit');
  // Insulated torso, pressure yoke, segmented waist, and life-support pack.
  box(g, [0.45, 0.49, 0.32], 'fabric', [0, 1.16, 0], 0.09);
  box(g, [0.42, 0.15, 0.32], 'ceramic', [0, 0.93, 0], 0.04);
  for (const y of [0.91, 0.955]) box(g, [0.43, 0.018, 0.326], 'graphite', [0, y, 0], 0.008);
  box(g, [0.33, 0.47, 0.24], 'ceramic', [0, 1.17, -0.23], 0.045);
  box(g, [0.26, 0.29, 0.022], 'graphite', [0, 1.18, -0.357], 0.012);
  for (let i = 0; i < 6; i++) box(g, [0.23, 0.012, 0.02], 'titanium', [0, 1.06 + i * 0.041, -0.373], 0.004);
  for (const x of [-0.14, 0.14]) {
    cylinder(g, 0.054, 0.32, 'titanium', [x, 1.17, -0.32]);
    ring(g, 0.055, 0.009, 'orange', [x, 1.3, -0.32], 'y');
    box(g, [0.026, 0.39, 0.033], 'orange', [x, 1.16, 0.17], 0.008);
  }
  // Chest computer with switches, connector sockets, and identification patch.
  box(g, [0.28, 0.19, 0.052], 'ceramic', [0, 1.22, 0.185], 0.02);
  box(g, [0.14, 0.085, 0.008], 'visor', [-0.035, 1.235, 0.216], 0.008);
  for (let i = 0; i < 3; i++) box(g, [0.08, 0.006, 0.002], 'light', [-0.045, 1.215 + i * 0.018, 0.222], 0.001);
  for (const y of [1.18, 1.225, 1.27]) cylinder(g, 0.01, 0.008, 'orange', [0.103, y, 0.219], 'z', 12);
  for (const x of [-0.125, 0.125]) {
    cylinder(g, 0.029, 0.022, 'graphite', [x, 1.015, 0.18], 'z');
    ring(g, 0.024, 0.006, 'titanium', [x, 1.015, 0.195]);
  }
  hose(g, [[0.13,1.02,0.2],[0.28,0.9,0.18],[0.3,1.03,-0.07],[0.17,1.08,-0.3]], 0.018, 'orange');
  hose(g, [[-0.13,1.02,0.2],[-0.27,0.92,0.1],[-0.27,1.13,-0.15],[-0.15,1.15,-0.3]], 0.014, 'graphite');

  // Helmet shell, dark curved visor, pressure seals and work lights.
  cylinder(g, 0.165, 0.08, 'graphite', [0, 1.455, 0]);
  ring(g, 0.164, 0.025, 'titanium', [0, 1.49, 0], 'y');
  ring(g, 0.163, 0.013, 'orange', [0, 1.45, 0], 'y');
  sphere(g, [0.225,0.245,0.218], 'ceramic', [0,1.68,0]);
  const rim = mesh(g, new T.SphereGeometry(0.229, 32, 20, Math.PI * 0.1, Math.PI * 0.8, Math.PI * 0.23, Math.PI * 0.54), 'graphite', [0,1.68,0.012]);
  rim.scale.set(1, 1.05, 1);
  const visor = mesh(g, new T.SphereGeometry(0.233, 32, 20, Math.PI * 0.14, Math.PI * 0.72, Math.PI * 0.27, Math.PI * 0.45), 'visor', [0,1.68,0.014]);
  visor.scale.set(1, 1.05, 1);
  hose(g, [[-0.12,1.775,0.18],[-0.05,1.795,0.224],[0.02,1.79,0.24]], 0.004, 'blue');
  for (const s of [-1,1]) {
    cylinder(g, 0.059, 0.032, 'graphite', [s * 0.218,1.68,0], 'x');
    cylinder(g, 0.04, 0.037, 'titanium', [s * 0.224,1.68,0], 'x');
    box(g, [0.062,0.05,0.065], 'ceramic', [s * 0.18,1.83,0.07], 0.012);
    box(g, [0.045,0.025,0.012], 'light', [s * 0.18,1.83,0.108], 0.005);
  }

  for (const s of [-1,1]) {
    const leg = group('Pressure leg', g, [s * 0.115, 0.87, 0]); leg.rotation.z = s * 0.035;
    mesh(leg, new T.CapsuleGeometry(0.112, 0.19, 5, 20), 'fabric', [0,-0.17,0]);
    sphere(leg, [0.113,0.11,0.11], 'graphite', [0,-0.38,0]);
    box(leg, [0.14,0.135,0.048], 'ceramic', [0,-0.38,0.1], 0.025);
    mesh(leg, new T.CapsuleGeometry(0.095, 0.19, 5, 20), 'fabric', [0,-0.56,0]);
    for (const y of [-0.27,-0.31,-0.46,-0.5,-0.64]) ring(leg, 0.098, 0.009, 'seam', [0,y,0], 'y', 24);
    cylinder(leg, 0.104, 0.06, 'orange', [0,-0.69,0]);
    box(leg, [0.2,0.145,0.31], 'ceramic', [0,-0.76,0.06], 0.04);
    box(leg, [0.207,0.035,0.32], 'rubber', [0,-0.825,0.06], 0.015);
    for (let i = 0; i < 4; i++) box(leg, [0.17,0.012,0.014], 'graphite', [0,-0.748,0.115+i*0.035], 0.003);
    box(leg, [0.09,0.125,0.048], 'ceramic', [s*0.08,-0.13,0.057], 0.013);
    const arm = group('Pressure arm', g, [s*0.27,1.33,0]); arm.rotation.z = s*0.18;
    sphere(arm, [0.13,0.135,0.13], 'ceramic', [0,0,0]);
    mesh(arm, new T.CapsuleGeometry(0.086,0.15,5,20), 'fabric', [0,-0.17,0]);
    cylinder(arm, 0.09,0.047,'orange',[0,-0.1,0]);
    sphere(arm, [0.085,0.08,0.085], 'graphite', [0,-0.33,0]);
    mesh(arm, new T.CapsuleGeometry(0.075,0.14,5,20), 'fabric', [0,-0.44,0.012]);
    for (const y of [-0.24,-0.27,-0.38,-0.41]) ring(arm, 0.077,0.008,'seam',[0,y,0.007],'y',24);
    cylinder(arm, 0.079,0.052,'titanium',[0,-0.555,0.013]);
    box(arm, [0.11,0.16,0.11], 'fabric', [0,-0.65,0.018],0.035);
    for (let i=0;i<3;i++) box(arm,[0.085,0.012,0.012],'graphite',[0,-0.61-i*0.03,0.074],0.003);
    sphere(arm,[0.033,0.061,0.038],'fabric',[-s*0.057,-0.645,0.055]);
    box(arm,[0.09,0.055,0.012],'blue',[0,0.025,0.122],0.005);
    box(arm,[0.08,0.013,0.014],'orange',[0,0.026,0.13],0.003);
  }
  return g;
}

export function createHabitat() {
  const g = group('Meridian pressure habitat');
  const centerY = 2.55;
  // Rounded barrel shell along X, with individual curved ceramic armor panels.
  const profile = [[0,-3.6],[1.2,-3.6],[1.65,-3.4],[1.9,-3.05],[1.94,-2.8],[1.94,2.8],[1.88,3.05],[1.55,3.32],[0,3.32]].map(([r,x]) => new T.Vector2(r,x));
  mesh(g,new T.LatheGeometry(profile,64),'graphite',[0,centerY,0],[0,0,-Math.PI/2]);
  for (const x of [-2.08,-0.69,0.69,2.08]) for (let i=0;i<12;i++) {
    const panel = mesh(g,new T.CylinderGeometry(1.965,1.965,1.345,64,1,true,i*Math.PI/6+0.012,Math.PI/6-0.024),'ceramic',[x,centerY,0],[0,0,-Math.PI/2]);
    panel.material = M.ceramic;
  }
  for (const x of [-2.83,-1.39,0,1.39,2.83]) {
    ring(g,1.967,0.025,'titanium',[x,centerY,0],'x',64);
    for (let i=0;i<12;i++) {
      const a=i*Math.PI/6;
      sphere(g,[0.028,0.028,0.028],'graphite',[x,centerY+Math.cos(a)*1.982,Math.sin(a)*1.982]);
    }
  }
  for (const x of [-3.02,3.01]) ring(g,1.87,0.11,'ceramic',[x,centerY,0],'x',64);
  ring(g,1.81,0.07,'orange',[-3.15,centerY,0],'x',64);
  sphere(g,[0.55,1.82,1.82],'ceramic',[-3.25,centerY,0]);
  // Forward docking vestibule and radial locking mechanisms.
  cylinder(g,1.45,0.34,'titanium',[3.28,centerY,0],'x',64);
  ring(g,1.42,0.11,'graphite',[3.48,centerY,0],'x',64);
  ring(g,1.23,0.05,'titanium',[3.52,centerY,0],'x',64);
  cylinder(g,1.17,0.06,'graphite',[3.52,centerY,0],'x',64);
  cylinder(g,0.88,0.04,'ceramic',[3.57,centerY,0],'x',48);
  ring(g,0.88,0.038,'orange',[3.6,centerY,0],'x');
  cylinder(g,0.3,0.055,'visor',[3.607,centerY,0],'x');
  ring(g,0.32,0.035,'titanium',[3.63,centerY,0],'x');
  bolts(g,16,1.31,3.56,centerY,0,'x',0.042);
  for (let i=0;i<8;i++) {
    const a=i*Math.PI/4;
    const lock=box(g,[0.14,0.23,0.13],'titanium',[3.62,centerY+1.025*Math.cos(a),1.025*Math.sin(a)],0.02);
    lock.rotation.x=a;
    beam(g,[3.625,centerY+0.42*Math.cos(a),0.42*Math.sin(a)],[3.625,centerY+0.76*Math.cos(a),0.76*Math.sin(a)],0.023,'seam');
  }
  // Portholes, service bays, conduits, and side mission markings.
  for (const s of [-1,1]) {
    for (const x of [-1.85,0.7]) {
      cylinder(g,0.43,0.14,'graphite',[x,centerY+0.1,s*1.94],'z');
      cylinder(g,0.33,0.155,'visor',[x,centerY+0.1,s*1.965],'z');
      ring(g,0.39,0.045,'titanium',[x,centerY+0.1,s*2.03]);
      bolts(g,10,0.39,x,centerY+0.1,s*2.066,'z',0.023);
    }
    box(g,[0.7,0.86,0.11],'graphite',[-0.53,centerY-0.01,s*1.96],0.07);
    box(g,[0.56,0.71,0.08],'ceramic',[-0.53,centerY-0.01,s*2.035],0.04);
    box(g,[0.39,0.22,0.012],'blue',[-0.53,centerY+0.14,s*2.08],0.02);
    for (let i=0;i<3;i++) cylinder(g,0.045,0.02,i===0?'light':'orange',[-0.68+i*0.15,centerY-0.2,s*2.085],'z',16);
    for (const x of [-2.65,2.6]) box(g,[0.07,0.74,0.06],'orange',[x,centerY,s*1.98],0.012);
    hose(g,[[-2.6,1.4,s*1.63],[-1.4,1.29,s*1.67],[1.4,1.29,s*1.67],[2.8,1.55,s*1.58]],0.055,'titanium');
    const plaque=group('Mission identification plate',g,[-0.25,centerY+0.73,s*1.86]);
    const tilt=Math.atan2(0.73,1.86);
    plaque.rotation.set(s===1?-tilt:tilt,s===1?0:Math.PI,0);
    box(plaque,[2.05,0.31,0.06],'ceramic',[0,0,0.012],0.018);
    lettering(plaque,'MERIDIAN 01',0.03,'graphite',[-0.86,0.095,0.047]);
  }
  // Roof radiator with black fins and side plumbing.
  box(g,[3.95,0.18,1.25],'graphite',[0,4.51,0],0.06);
  for(let i=0;i<18;i++) box(g,[0.095,0.12,1.22],'titanium',[-1.8+i*0.212,4.65,0],0.015);
  for(const z of [-0.67,0.67]) beam(g,[-2,4.59,z],[2,4.59,z],0.045,'orange');
  cylinder(g,0.05,0.8,'titanium',[-2.65,4.62,0]);
  sphere(g,[0.08,0.08,0.08],'light',[-2.65,5.04,0]);
  // Landing frame, service steps, and hatch railings.
  for(const x of [-2.3,2.3]) for(const s of [-1,1]) {
    beam(g,[x,1.23,s*1.1],[x,0.3,s*1.7],0.095,'titanium');
    box(g,[0.83,0.13,0.65],'graphite',[x,0.115,s*1.7],0.04);
    box(g,[0.5,0.08,0.42],'orange',[x,0.2,s*1.7],0.02);
  }
  for(let i=0;i<4;i++) {
    const x=3.75+i*0.37, y=1.04-i*0.25;
    box(g,[0.4,0.09,1.15],'titanium',[x,y,0],0.014);
    for(let j=0;j<5;j++) box(g,[0.018,0.01,1.07],'graphite',[x-0.14+j*0.07,y+0.05,0],0.002);
  }
  for(const s of [-1,1]) {
    beam(g,[3.65,1.1,s*0.64],[3.65,2.06,s*0.64],0.027,'orange');
    beam(g,[4.93,0.3,s*0.64],[4.93,1.22,s*0.64],0.027,'orange');
    beam(g,[3.65,2.06,s*0.64],[4.93,1.22,s*0.64],0.032,'orange');
  }
  return g;
}

export function createRover() {
  const g=group('Meridian six-wheel survey rover');
  box(g,[3.65,0.34,1.52],'graphite',[0,1.01,0],0.13);
  box(g,[3.78,0.23,1.56],'ceramic',[0,1.29,0],0.11);
  for(const z of [-0.8,0.8]) {
    box(g,[3.65,0.055,0.055],'orange',[0,1.31,z],0.018);
    beam(g,[-1.88,1.07,z],[1.88,1.07,z],0.065,'titanium');
    for(const x of [-1.5,0,1.5]) {
      beam(g,[x-0.25,1.01,z],[x,0.5,z*1.44],0.065,'titanium');
      beam(g,[x+0.33,1.03,z],[x,0.5,z*1.44],0.06,'graphite');
      beam(g,[x-0.15,1.16,z],[x+0.12,0.61,z*1.35],0.037,'orange');
      const wheel=group('All-terrain wheel',g,[x,0.51,Math.sign(z)*1.16]);
      cylinder(wheel,0.49,0.31,'rubber',[0,0,0],'z',40);
      for(const side of [-1,1]) {
        ring(wheel,0.39,0.083,'rubber',[0,0,side*0.154],'z',40);
        cylinder(wheel,0.27,0.028,'titanium',[0,0,side*0.172],'z',24);
        cylinder(wheel,0.19,0.033,'graphite',[0,0,side*0.189],'z',24);
        cylinder(wheel,0.089,0.042,'orange',[0,0,side*0.21],'z',16);
        bolts(wheel,6,0.225,0,0,side*0.195,'z',0.022);
      }
      for(let i=0;i<24;i++) {
        const a=i*Math.PI/12;
        const tread=box(wheel,[0.047,0.027,0.33],'seam',[Math.sin(a)*0.493,Math.cos(a)*0.493,0],0.006);
        tread.rotation.z=-a;
      }
    }
  }
  // Low wedge-shaped equipment shell and large forward windscreen.
  const hull=box(g,[2.25,0.55,1.33],'ceramic',[0.61,1.61,0],0.19);
  hull.rotation.z=-0.075;
  box(g,[0.69,0.4,1.28],'visor',[1.51,1.63,0],0.12,[0,0,-0.22]);
  for(const s of [-1,1]) {
    box(g,[0.96,0.25,0.025],'visor',[0.77,1.65,s*0.67],0.06);
    box(g,[1.8,0.05,0.04],'orange',[0.66,1.42,s*0.69],0.01);
    box(g,[0.43,0.15,0.05],'graphite',[-0.62,1.56,s*0.75],0.025);
    for(let i=0;i<5;i++) box(g,[0.018,0.1,0.015],'titanium',[-0.77+i*0.072,1.56,s*0.785],0.003);
    cylinder(g,0.092,0.04,'graphite',[1.76,1.35,s*0.62],'x');
    cylinder(g,0.064,0.06,'light',[1.79,1.35,s*0.62],'x');
    cylinder(g,0.04,0.05,'red',[-1.91,1.21,s*0.61],'x');
  }
  // Rear instrument deck, sample containers, and a small segmented solar panel.
  box(g,[1.05,0.08,1.23],'titanium',[-1.22,1.48,0],0.025);
  for(const z of [-0.36,0.36]) {
    box(g,[0.74,0.32,0.42],'ceramic',[-1.15,1.67,z],0.06);
    for(const x of [-1.37,-0.92]) box(g,[0.038,0.33,0.44],'orange',[x,1.67,z],0.01);
  }
  box(g,[1.4,0.06,0.87],'graphite',[0.37,1.947,0],0.025);
  for(let x=0;x<5;x++) for(let z=0;z<3;z++) box(g,[0.243,0.012,0.236],'blue',[-0.16+x*0.264,1.982,-0.258+z*0.258],0.006);
  // Articulated sensor mast with stereo cameras, antenna and cabling.
  cylinder(g,0.16,0.09,'graphite',[-0.82,1.98,0]);
  cylinder(g,0.052,0.81,'titanium',[-0.82,2.39,0]);
  cylinder(g,0.072,0.1,'orange',[-0.82,2.48,0]);
  box(g,[0.32,0.2,0.27],'ceramic',[-0.82,2.86,0],0.055);
  for(const z of [-0.09,0.09]) {
    cylinder(g,0.063,0.07,'graphite',[-0.63,2.875,z],'x');
    cylinder(g,0.042,0.074,'visor',[-0.61,2.875,z],'x');
  }
  hose(g,[[-0.72,1.7,-0.11],[-0.73,2.17,-0.09],[-0.76,2.55,-0.085],[-0.74,2.8,-0.09]],0.019,'graphite');
  cylinder(g,0.014,0.67,'titanium',[-1.69,2.13,-0.58]);
  sphere(g,[0.035,0.035,0.035],'orange',[-1.69,2.48,-0.58]);
  for(const x of [-1.95,1.95]) {
    beam(g,[x,1.04,-0.75],[x,1.04,0.75],0.045,'titanium');
    for(const z of [-0.69,0.69]) beam(g,[x,1.04,z],[x*0.86,1.27,z],0.038,'orange');
  }
  box(g,[0.68,0.31,0.032],'ceramic',[-0.31,1.6,0.71],0.012);
  lettering(g,'M 02',0.025,'graphite',[-0.575,1.684,0.731]);
  return g;
}

export function optimizeModel(source, normalize = true) {
  source.updateMatrixWorld(true);
  const batches=new Map();
  source.traverse(obj => {
    if(!obj.isMesh) return;
    let geometry=obj.geometry.clone().applyMatrix4(obj.matrixWorld);
    if(geometry.index) geometry=geometry.toNonIndexed();
    if(!batches.has(obj.material)) batches.set(obj.material,[]);
    batches.get(obj.material).push(geometry);
  });
  const result=group(source.name);
  for(const [material, geometries] of batches) {
    const geometry=mergeVertices(mergeGeometries(geometries),1e-5);
    const part=new T.Mesh(geometry,material); part.name=material.name; result.add(part);
    geometries.forEach(g => g.dispose());
  }
  // Standardize the origin at the center of the footprint, on the ground.
  const bounds=new T.Box3().setFromObject(result);
  const center=bounds.getCenter(new T.Vector3());
  if (normalize) for(const obj of result.children) obj.geometry.translate(-center.x,-bounds.min.y,-center.z);
  result.userData={description:'Original reference-inspired Mission Control Jr. model',units:'meters',static:true};
  return result;
}
