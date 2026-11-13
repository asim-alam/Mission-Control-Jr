const HUD_STYLE_CLASSES = ['minimal-hud', 'photo-mode'];

/** Add keyboard and clickable display modes to a playable mission HUD. */
export function installHudPresentation({ hud, toolbar, onHelp, onJourney, menu, menuItems = [] } = {}) {
  if (!hud) return;
  installDialogCaptionTransfer();
  if (!menu && toolbar) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.textContent = 'Menu';
    toggle.setAttribute('aria-controls', 'mission-tools');
    toggle.setAttribute('aria-expanded', 'false');
    menu = document.createElement('div');
    menu.id = 'mission-tools';
    menu.className = 'mission-tools';
    menu.hidden = true;
    for (const id of menuItems) menu.append(document.getElementById(id));
    toolbar.append(toggle, menu);
    const setMenu = open => {
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.onclick = () => setMenu(menu.hidden);
    menu.addEventListener('click', event => {
      if (event.target.closest('button')) setMenu(false);
    });
    document.addEventListener('click', event => {
      if (!menu.contains(event.target) && !toggle.contains(event.target)) setMenu(false);
    });
    document.addEventListener('keydown', event => {
      if (event.code === 'Escape' && !menu.hidden) setMenu(false);
    });
  }
  const syncCampaignFrame = () => {
    if (window.parent !== window) {
      const mode = HUD_STYLE_CLASSES.find(name => hud.classList.contains(name)) || 'normal';
      window.parent.postMessage({ source: 'mission-control-jr-hud', mode }, location.origin);
    }
  };

  const modes = [
    { className: 'minimal-hud', label: 'HUD', title: 'Toggle minimal HUD (F2)' },
    { className: 'photo-mode', label: 'Photo', title: 'Toggle photo mode (F3)' },
  ];
  const modeButtons = [];
  for (const mode of modes) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hud-mode-button';
    button.textContent = mode.label;
    button.title = mode.title;
    button.setAttribute('aria-label', mode.title);
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      const active = !hud.classList.contains(mode.className);
      HUD_STYLE_CLASSES.forEach(name => hud.classList.toggle(name, name === mode.className && active));
      modes.forEach(({ className }) => toolbar?.querySelector(`[data-hud-mode="${className}"]`)?.setAttribute('aria-pressed', String(className === mode.className && active)));
      for (const control of modeButtons) (active ? toolbar : menu ?? toolbar)?.append(control);
      syncCampaignFrame();
      button.blur();
    });
    button.dataset.hudMode = mode.className;
    modeButtons.push(button);
    (menu ?? toolbar)?.append(button);
  }
  syncCampaignFrame();

  if (toolbar && window.parent !== window) {
    const journey = document.createElement('button');
    journey.type = 'button';
    journey.textContent = 'Journey';
    journey.title = 'Open the connected expedition menu';
    journey.setAttribute('aria-label', 'Open the connected expedition menu');
    journey.addEventListener('click', () => onJourney?.());
    (menu ?? toolbar).prepend(journey);
  }

  window.addEventListener('keydown', event => {
    if (event.code === 'F2' || event.code === 'F3') {
      if (document.querySelector('#dialog:not([hidden]), #modal:not([hidden])')) return;
      event.preventDefault();
      toolbar?.querySelector(`[data-hud-mode="${event.code === 'F2' ? 'minimal-hud' : 'photo-mode'}"]`)?.click();
    } else if (event.key === '?' && !document.querySelector('#dialog:not([hidden]), #modal:not([hidden])')) {
      onHelp?.();
    }
  });
}

/** Move a live radio subtitle into the active shared modal instead of leaving it behind the scrim. */
function installDialogCaptionTransfer() {
  const sync = () => {
    const modal = document.querySelector('#dialog:not([hidden]), #modal:not([hidden])');
    const radio = document.querySelector('#radio, #orbital-radio');
    const body = modal?.querySelector('#dialog-body, #modal-body');
    const actions = modal?.querySelector('#dialog-actions, #modal-actions');
    if (!modal || !body || !actions) return;

    // The Mission 2 opening briefing already contains the authoritative commander
    // transcript, so don't append the live radio copy a second time.
    if (modal.querySelector('.briefing-transcript')) {
      modal.querySelector('.ui-dialog-caption')?.remove();
      return;
    }

    let caption = modal.querySelector('.ui-dialog-caption');
    if (radio && !radio.hidden) {
      const speaker = radio.querySelector('#speaker, #radio-speaker')?.textContent.trim();
      const line = radio.querySelector('#subtitle, #radio-subtitle')?.textContent.trim();
      const text = [speaker, line].filter(Boolean).join(': ');
      if (text) {
        if (!caption) {
          caption = document.createElement('p');
          caption.className = 'ui-dialog-caption';
          caption.setAttribute('aria-live', 'polite');
          actions.before(caption);
        }
        if (caption.textContent !== text) caption.textContent = text;
        return;
      }
    }
    caption?.remove();
  };
  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
  sync();
}
