import * as THREE from 'three';

// Restore the window frame and teal dashboard from orbit-demo.js in commit 2792927.
// Attach to the camera with the original pilot eye offset, so the frame stays in view.
export function createLandingCockpit() {
  const cockpit = new THREE.Group();
  cockpit.name = 'Meridian landing cockpit';
  cockpit.position.y = -1.55;
  const frame = new THREE.MeshStandardMaterial({color: 0x172b38, metalness: .5, roughness: .5});
  for (const [x, y, z, w, h, d] of [
    [0, .5, -1.7, 2.2, .5, .2],
    [-1.15, 1.6, -1.8, .12, 2.4, .14],
    [1.15, 1.6, -1.8, .12, 2.4, .14],
    [0, 2.9, -1.8, 2.4, .14, .14],
  ]) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), frame);
    mesh.position.set(x, y, z);
    cockpit.add(mesh);
  }
  const dash = new THREE.Mesh(new THREE.BoxGeometry(1.8, .08, .6),
    new THREE.MeshStandardMaterial({color: 0x245358, emissive: 0x153e45, emissiveIntensity: .8, roughness: .6}));
  dash.position.set(0, .8, -1.6);
  dash.rotation.x = .3;
  cockpit.add(dash);
  cockpit.visible = false;
  return cockpit;
}
