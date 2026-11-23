import { CFG, dayOf, fmtNum } from './config.js';
import { reduced } from './scroll.js';
import { initRail } from './rail.js';
import { initIllustrations } from './illus.js';
import { initMessages, initChecklist } from './chapters.js';
import { initPath } from './path.js';
import { initSilence } from './silence.js';
import { initDots } from './dots.js';
import { initRoadmap } from './roadmap.js';

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

function initSources() {
  const btn = document.querySelector('.sources-btn');
  const panel = document.getElementById('sources');
  if (!btn || !panel) return;
  const label = btn.querySelector('.sources-btn__label');
  const icon = btn.querySelector('.sources-btn__icon');
  const count = panel.querySelectorAll('ol > li').length;
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    if (label) {
      label.innerHTML = (open ? 'Hide sources ' : 'View sources ') +
        '<span class="sources-btn__count">(' + count + ')</span>';
    }
    if (icon) icon.textContent = open ? '\u2212' : '+';
  });
}

// Reduced motion / Save-Data: keep the static (no-JS) layout, but still draw charts in their final state.
document.documentElement.classList.add(reduced ? 'reduced' : 'js');
applyConfig();
todayCounter();
initSources();
initRail();
initIllustrations();
initMessages();
initChecklist();
initPath();
initSilence();
initDots();
initRoadmap();
