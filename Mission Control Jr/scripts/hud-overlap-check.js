/**
 * Browser-console HUD collision audit for the active Mission Control Jr. chapter.
 * Open a chapter at a chosen viewport, open each HUD state, then paste/run:
 *   import('./scripts/hud-overlap-check.js').then(m => m.checkHudOverlaps())
 * It checks the named screen-edge slots and ignores intentional parent/child containment.
 */
const HUD_SLOTS = [
  ['campaign header', '#campaign-bar'],
  ['chapter header', '#hud #topbar'],
  ['orbital header', 'body:has(#space) > header'],
  ['objective panel', '#hud #mission-panel'],
  ['orbital objective', 'body:has(#space) #objective'],
  ['crew radio', '#hud #radio'],
  ['orbital radio', 'body:has(#space) #orbital-radio'],
  ['interaction prompt', '#hud #interaction'],
  ['vehicle instruments', '#hud #vehicle-instruments'],
  ['route map', '#hud #map-panel'],
  ['orbital telemetry', 'body:has(#space) #telemetry'],
  ['orbital progress', 'body:has(#space) #progress'],
  ['toast', '#hud #toast'],
  ['control hint', '#hud #controls'],
  ['dialog card', '#dialog:not([hidden]) .dialog-card'],
  ['orbital modal', '#modal:not([hidden]) article'],
];

const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
const contains = (a, b) => a.left <= b.left && a.top <= b.top && a.right >= b.right && a.bottom >= b.bottom;

export function hudRectangles(doc = document) {
  return HUD_SLOTS.flatMap(([name, selector]) => [...doc.querySelectorAll(selector)].map(element => {
    const style = getComputedStyle(element), rect = element.getBoundingClientRect();
    if (element.hidden || style.display === 'none' || style.visibility === 'hidden' || rect.width < 1 || rect.height < 1) return null;
    return { name, rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom } };
  }).filter(Boolean));
}

export function checkHudOverlaps(doc = document) {
  const items = hudRectangles(doc), collisions = [];
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j];
    if (contains(a.rect, b.rect) || contains(b.rect, a.rect)) continue;
    if (intersects(a.rect, b.rect)) collisions.push(`${a.name} intersects ${b.name}`);
  }
  if (collisions.length) throw new Error(`HUD overlap audit failed:\n- ${collisions.join('\n- ')}`);
  console.info(`HUD overlap audit passed (${items.length} visible edge slots).`);
  return items;
}
