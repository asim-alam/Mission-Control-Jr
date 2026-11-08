# Supplied reference models

These models were supplied by the user from their Downloads folder. Their embedded GLB `asset.extras` contains the authors, source links, and licenses below. This document reports that embedded information; it does not claim an independent review of the hosting pages. No external assets were downloaded while preparing these derivatives. Original Downloads files were left unchanged.

The models represent terrain or robotic explorers. They are appropriate for labeled educational reference displays. They do not replace the open, human-driven, two-seat Rover Two, and Olympus Mons is not claimed to be the local geography of fictional Outpost Meridian.

## Provenance and credit

**Mars - Olympus Mons** — [SebastianSosnowski](https://sketchfab.com/SebastianSosnowski). [Source model](https://sketchfab.com/3d-models/mars-olympus-mons-53679864b41a43b0ae0459ce99d6adf0). Embedded license: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

**Perseverance - NASA Mars Landing 2021** — [Thomas Flynn](https://sketchfab.com/nebulousflynn). [Source model](https://sketchfab.com/3d-models/perseverance-nasa-mars-landing-2021-c1c94e1f69df45eeae4a0a1d0d27e85b). Embedded license: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). The NASA reference in the supplied title is not a claim that this copy was obtained directly from NASA or that NASA endorses this game.

**Mars Rover** — [Gregori Vorontsov](https://sketchfab.com/vorontsov). [Source model](https://sketchfab.com/3d-models/mars-rover-df65512e57f848fe8107823ad0a45e7d). Embedded license: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

**Mars** — [Akshat](https://sketchfab.com/shooter24994). [Source model](https://sketchfab.com/3d-models/mars-9c7bbc64d8c74acfa9ec344c0fc10e1a). Embedded license: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). This is a spherical planet model with a global map, not local terrain.

For the three CC BY models, retain the author, source, license, and modification statement in a visible credits/details panel and distribution documentation. The same attribution is also preserved inside each derivative's GLB metadata. Retaining attribution for the CC0 model is useful provenance.

Modification statement: Mission Control Jr. prepared static educational display versions. Textures were recompressed and limited to 1024 pixels per dimension, node transforms were baked, compatible geometry was batched by material, unused UV sets were removed, and tangent data was regenerated. The Mars Rover's Sketchfab presentation floor was removed. The Mars globe's legacy zero-specular diffuse material was approximated with core metallic/roughness PBR, keeping its diffuse texture. Mesh shape was retained; there was no geometric decimation. Static batching removes the original scene hierarchy, so these files are intended for static reference displays rather than articulated wheel/arm animation.

## Inspected files and generated derivatives

| Model | Source bytes | Derivative bytes | Triangles (source → derivative) | Geometry draws (source → derivative) | Materials | Embedded images |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Olympus Mons | 4,204,940 | 3,672,664 | 10,662 → 10,662 | 2 → 2 | 2 | 3 |
| Perseverance | 14,909,440 | 10,938,348 | 199,304 → 199,304 | 249 → 48 | 48 | 24 |
| Mars Rover | 44,703,808 | 7,497,972 | 57,310 → 57,308 | 2 → 1 | 2 (1 used) | 4 |
| Mars globe | 5,706,016 | 286,380 | 5,888 → 5,888 | 1 → 1 | 1 | 1 |

These are geometry draw counts before additional passes such as shadows. The Perseverance reference remains relatively expensive; it should be loaded on demand, and can be hidden when the player leaves its exhibit. A single optional reference rover is preferable to rendering both detailed robotic models throughout the mission.

Files:

- `assets/models/reference-olympus-mons.glb`
- `assets/models/reference-perseverance.glb`
- `assets/models/reference-mars-rover.glb`
- `assets/models/reference-mars-globe.glb`
- `assets/models/reference-assets-report.json` — complete sizes, image dimensions, bounds, embedded provenance, and validation results.

All derivatives pass `gltf-validator` with **zero errors and zero warnings**. The Mars Rover has one informational message for its retained, unused presentation-floor material. All textures and geometry are embedded. No external buffer/image URLs, Draco, meshopt, or KTX2 dependencies were found. The Mars Rover uses the optional `KHR_materials_specular` material extension. The original Mars globe requires the legacy `KHR_materials_pbrSpecularGlossiness` extension; its derivative converts the specific supplied matte material to core PBR, so no legacy extension is required at runtime. The other two declare no extensions.

## Placement and loading

Load with the existing Three.js GLTFLoader. Fit the loaded scene from its actual Box3 rather than assuming the author used meters. Its existing transforms are baked into the derivative, and its axes are Y-up.

```js
const box = new THREE.Box3().setFromObject(model);
const size = box.getSize(new THREE.Vector3());
const center = box.getCenter(new THREE.Vector3());
const scale = desiredFootprint / Math.max(size.x, size.z);
model.scale.setScalar(scale);
model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
displayGroup.add(model);
```

Apply scene placement/rotation to `displayGroup`, which now has a centered, ground-seated child. Avoid setting the model's Y to terrain height before centering; that would discard the file's nonzero lower bound.

Measured derivative bounds, before placement:

- Olympus: size `[1.9000943, 0.3143727, 1.9000354]`, center `[0.0000471, -0.0324930, 0.0000176]`, minimum Y `-0.1896793`. For a four-meter table footprint use scale `2.1051586`. Label it **“Olympus Mons · terrain reference model · scale illustrative.”** Do not use the supplied artistic terrain as a validated elevation dataset or assume its vertical scale is quantitative.
- Perseverance: size `[2.7045808, 2.2322255, 4.0887747]`, center `[0, 1.1168909, 0.3080652]`, minimum Y `0.0007781`. For a four-meter exhibit footprint use scale `0.9782882`. Label it **“Perseverance · robotic rover reference.”** It has no seats for Jin and Amara.
- Mars Rover: size `[161000, 59609.9901, 312374.8594]`, center `[0, 29804.6729, 130.9297]`, minimum Y `-0.3221359`. Its authoring units are exceptionally large; a four-meter footprint needs scale `0.00001280513`. Always normalize this model before integrating it. Label it **“Mars rover concept · robotic reference.”** Do not silently identify it as Rover Two or NASA's Perseverance.
- Mars globe: a sphere approximately 200 authoring units across, with 5,888 triangles. Its global map was visually inspected; it has polar caps and planet-scale surface features. Use it in the orbital Mars view or optional 3D reference archive; it is no longer rendered as a physical prop in either surface chapter. The embedded texture is not documented as a validated cartographic dataset.

## Physically visible integration

**20 October update:** the enlarged Olympus surface exhibit has been removed, including its presentation base, sign, collision, camera obstruction, and minimap icon. It remains available only in the optional reference archive. For the proposed space-based use of the planet, see `ORBIT-AND-SURFACE-PLAN.md`; that orbital chapter is not implemented yet.

The normalized robotic Mars Rover occupies a reachable equipment pad east of Meridian, clearly distinguished from the crewed expedition vehicle. Approach it to inspect and switch the display to Perseverance. Only one detailed robotic model occupies the pad at a time. Olympus is confined to its optional labeled archive view; do not enlarge it into the traversable terrain.

The surface globe prop, pedestal, sign, and collision boundary are removed. Its archive display remains available on demand from the operations terminal; the orbital Mars atlas also remains available through its existing controls. Rover labels/credits remain available through nearby interaction and the reference-details panel.

Keep display collisions simple: one circle/box around the pad, never raycast every exhibit triangle for walking or vehicle physics. Disable castShadow on dense reference meshes unless the performance budget justifies it. Use the existing lightweight crewed rover for driving physics, steering, seats, and wheel animation.

## Reproduce

From the project directory, with Python/Pillow and the project's npm dependencies installed:

```powershell
node scripts/inspect-reference-assets.mjs "C:\Users\BMCT LTD\Downloads"
```

The script writes only its four derivatives and inspection report in `assets/models`, uses a temporary folder for texture conversion, and preserves the original Downloads files. It rejects unexpected animated, compressed, external-resource, or non-triangle input instead of quietly flattening unsupported features. Its only special legacy-material conversion is restricted to the inspected, zero-specular Mars globe supplied here; other legacy materials require manual review.

## Orbital planet texture

`assets/mars-orbit.webp` reuses the original **4096 × 2048** embedded diffuse JPEG from the user-supplied `mars.glb`, extracted through its diffuse material/texture/buffer-view references and encoded with Pillow as WebP at quality **88**, without resizing or altering the map. It provides a sharper orbital planet view than the optimized navigation-table globe texture. Credit: **Akshat**, [Mars on Sketchfab](https://sketchfab.com/3d-models/mars-9c7bbc64d8c74acfa9ec344c0fc10e1a), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), as stated in the supplied GLB's embedded metadata. Modification: embedded JPEG extracted and converted to WebP; the original GLB is unchanged. This artistic reference map is not a validated scientific or cartographic dataset.

## Mission expansion models

The original procedural generators `scripts/generate-survival-models.js` and `scripts/generate-lunar-models.js` create the project's fictional teaching hardware. Their generated GLBs in `assets/models/survival/` and `assets/models/lunar/` carry per-model metadata, dimensions, named nodes and collision-proxy descriptions. Generate them with `npm run models:survival` and `npm run models:lunar`; each directory's manifest records geometry counts and validator results. They are educational representations, not NASA flight hardware. Existing astronaut and rover models retain their credits above.
