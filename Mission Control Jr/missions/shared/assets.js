// Look up a generated expansion model by its id (see mission-assets.js for the per-mission bundles).
import {missionAssets} from '../../mission-assets.js';
const flat = Object.assign({}, ...Object.values(missionAssets));
export function missionAsset(name) { const url = flat[name]; if (!url) throw new RangeError(`Unknown expansion model: ${name}`); return url; }
