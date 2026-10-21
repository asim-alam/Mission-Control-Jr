const CANDIDATES = [
  '#journey', '#transition', '#opening', '.ui-card', '.ui-scrim',
  '#mission-panel.expanded', '#navigation', '#radio', '#interaction',
  '#map-panel', '#orbital-radio', '#objective.expanded', '#modal-body',
  '#dialog-body', '#left', '#right', '#work', '#log', '#tasks', '#controls',
  '#toast', '#target-description', '#action-help', '.reference-stage',
];

function isScrollable(element) {
  const style = getComputedStyle(element);
  const scrollY = ['auto', 'scroll'].includes(style.overflowY) && element.scrollHeight > element.clientHeight + 1;
  const scrollX = ['auto', 'scroll'].includes(style.overflowX) && element.scrollWidth > element.clientWidth + 1;
  return scrollY || scrollX;
}

function syncScroller(element) {
  if (!(element instanceof HTMLElement) || element.hidden) return;
  const scrollable = isScrollable(element);
  element.classList.toggle('scroll-hidden', scrollable);
  if (scrollable && !element.hasAttribute('tabindex')) element.tabIndex = 0;
  if (scrollable && getComputedStyle(element).position === 'static') {
    element.dataset.scrollUiPosition = element.style.position || '';
    element.style.position = 'relative';
  } else if (!scrollable && 'scrollUiPosition' in element.dataset) {
    element.style.position = element.dataset.scrollUiPosition;
    delete element.dataset.scrollUiPosition;
  }
  if (!scrollable) return;
}

export function installHiddenScrollUI() {
  const scan = () => {
    const found = new Set();
    for (const selector of CANDIDATES) document.querySelectorAll(selector).forEach(el => found.add(el));
    // Catch scroll containers introduced by dialogs and generated checklists.
    document.querySelectorAll('body *').forEach(el => {
      if (el instanceof HTMLElement && isScrollable(el)) found.add(el);
    });
    found.forEach(syncScroller);
  };
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; scan(); });
  };
  document.addEventListener('scroll', event => syncScroller(event.target), true);
  document.addEventListener('wheel', event => {
    const container = event.target instanceof Element ? event.target.closest('.scroll-hidden') : null;
    if (!container) return;
    event.preventDefault();
    event.stopPropagation();
    if (container.scrollHeight > container.clientHeight) container.scrollTop += event.deltaY;
    syncScroller(container);
  }, { capture: true, passive: false });
  document.addEventListener('keydown', event => {
    const container = event.target instanceof Element ? event.target.closest('.scroll-hidden') : null;
    if (!container) return;
    const page = Math.max(40, container.clientHeight * .82);
    const deltas = { ArrowDown: 40, ArrowUp: -40, PageDown: page, PageUp: -page, ' ': page };
    if (!(event.key in deltas) && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    event.stopPropagation();
    if (event.key === 'Home') container.scrollTop = 0;
    else if (event.key === 'End') container.scrollTop = container.scrollHeight;
    else container.scrollTop += deltas[event.key];
    syncScroller(container);
  }, true);
  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'class', 'open'] });
  window.addEventListener('resize', schedule, { passive: true });
  scan();
}
