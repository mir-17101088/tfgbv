import { CFG, dayOf, fmtNum } from './config.js';
import { reduced } from './scroll.js';
import { initRail } from './rail.js';
import { initIllustrations } from './illus.js';
import { initMessages, initChecklist } from './chapters.js';
import { initPath } from './path.js';
import { initSilence } from './silence.js';
import { initDots } from './dots.js';

export function applyConfig(root = document) {
  const els = root.querySelectorAll('[data-cfg]');
  for (let i = 0; i < els.length; i++) {
    const k = els[i].getAttribute('data-cfg');
    if (CFG[k] != null) els[i].textContent = CFG[k];
  }
}

function todayCounter() {
  const el = document.querySelector('.counter__n');
  if (!el) return;
  const t = new Date();
  const iso = t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate();
  el.textContent = fmtNum(dayOf(iso));
}

// Reduced motion / Save-Data: keep the static (no-JS) layout, but still draw charts in their final state.
document.documentElement.classList.add(reduced ? 'reduced' : 'js');
applyConfig();
todayCounter();
initRail();
initIllustrations();
initMessages();
initChecklist();
initPath();
initSilence();
initDots();

