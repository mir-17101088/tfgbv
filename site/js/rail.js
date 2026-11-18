// "N days since the first message" rail. Sections carry data-day (and data-day-end).
import { onScroll, progressOf } from './scroll.js';
import { fmtNum } from './config.js';

export const TOTAL = 1873;      // next hearing, 7 Dec 2026
export const DEADLINE = 150;    // ~20 Mar 2022: 75 working days after the case was filed

export function initRail() {
  const rail = document.querySelector('.rail');
  if (!rail) return;
  const n = rail.querySelector('.rail__n');
  const mark = rail.querySelector('.rail__mark');
  const unit = rail.querySelector('.rail__d');
  const secs = Array.prototype.slice.call(document.querySelectorAll('[data-day]'));
  const hero = document.getElementById('ch0');
  let last = -1;

  onScroll((y, vh) => {
    const mid = vh * 0.5;
    let sec = secs[0];
    for (let i = 0; i < secs.length; i++) {
      if (secs[i].getBoundingClientRect().top <= mid) sec = secs[i];
    }
    const d0 = +sec.getAttribute('data-day');
    const d1 = sec.hasAttribute('data-day-end') ? +sec.getAttribute('data-day-end') : d0;
    let f = 0;
    if (d1 !== d0) {
      const sc = sec.querySelector('.scene');
      if (sc) f = progressOf(sc);
      else {
        const r = sec.getBoundingClientRect();
        f = Math.min(1, Math.max(0, (mid - r.top) / r.height));
      }
    }
    let day = Math.round(d0 + (d1 - d0) * f);
    // a scene may publish the day it is actually showing (ch6 walks her beat by beat, not linearly)
    const now = d1 !== d0 && sec.querySelector('[data-day-now]');
    if (now) day = +now.getAttribute('data-day-now');
    rail.classList.toggle('is-on', !hero || hero.getBoundingClientRect().bottom < vh * 0.4);
    if (day !== last) {
      last = day;
      n.textContent = fmtNum(day);
      if (unit) unit.textContent = day === 1 ? 'day' : 'days';
      rail.style.setProperty('--rail', Math.min(1, day / TOTAL).toFixed(4));
      const late = day > DEADLINE;
      mark.classList.toggle('is-passed', late);
      rail.classList.toggle('is-late', late);
    }
  });
}
