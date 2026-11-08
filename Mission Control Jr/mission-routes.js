/** Physical index entry with a query works on static hosts and in subdirectories. */
export function journeyUrl(currentUrl, missionId = null, {sampler=false}={}) {
  const url = new URL('./index.html', currentUrl);
  if (missionId) url.searchParams.set('mission', missionId);
  if (missionId&&sampler) url.searchParams.set('sampler','1');
  return url;
}
export function missionFromUrl(currentUrl, lookup) {
  const url = new URL(currentUrl);
  const query=url.searchParams.get('mission');
  if(query&&lookup(query))return query;
  const path=url.pathname.replace(/\/+$/,'').split('/').pop();
  if(lookup(path))return path;
  const hash=url.hash.slice(1)==='strom'?'storm':url.hash.slice(1);
  return lookup(hash)?hash:null;
}
