import {missionById, missionByPath} from './mission-registry.js';

/** A stable, readable URL for each playable mission; the menu lives at the app base path. */
export function journeyUrl(currentUrl, missionId = null, {sampler=false}={}) {
  if (!missionId) return new URL('./', currentUrl);
  const mission=missionById(missionId);
  if (!mission) return new URL('./', currentUrl);
  const url = new URL(`./${mission.path}`, currentUrl);
  if (sampler) url.searchParams.set('sampler','1');
  return url;
}
export function missionFromUrl(currentUrl, lookup) {
  const url = new URL(currentUrl);
  const query=url.searchParams.get('mission');
  if(query&&lookup(query))return query;
  const path=url.pathname.replace(/\/+$/,'').split('/').pop();
  const byPath=missionByPath(path);
  if(byPath&&lookup(byPath.id))return byPath.id;
  if(lookup(path))return path;
  const hash=url.hash.slice(1)==='strom'?'storm':url.hash.slice(1);
  return lookup(hash)?hash:null;
}
