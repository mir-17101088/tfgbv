// "N days since the first message" rail. Sections carry data-day (and data-day-end).
// Uses cached geometry from scroll.js so scrolling triggers zero layout reads.
import { onScroll, onMeasure, progressOf } from './scroll.js';
import { fmtNum } from './config.js';

export const TOTAL = 1873;      // next hearing, 7 Dec 2026
export const DEADLINE = 150;    // ~20 Mar 2022: 75 working days after the case was filed

export function initRail() {
  const rail = document.querySelector('.rail');
  if (!rail) return;
  const n = rail.querySelector('.rail__n');
  const mark = rail.querySelector('.rail__mark');
  const unit = rail.querySelector('.rail__d');
  const hero = document.getElementById('ch0');
  const secs = Array.prototype.slice.call(document.querySelectorAll('[data-day]')).map((el) => ({
    el,
    d0: +el.getAttribute('data-day'),
    d1: el.hasAttribute('data-day-end') ? +el.getAttribute('data-day-end') : +el.getAttribute('data-day'),
    sc: el.querySelector('.scene'),
    top: 0,
    h: 1,
  }));

  let heroBottom = 0;
  let last = -1;
  let lastOn = false;
  let lastLate = false;

  onMeasure((y) => {
    heroBottom = hero ? hero.getBoundingClientRect().bottom + y : 0;
    for (let i = 0; i < secs.length; i++) {
      const s = secs[i];
      const r = s.el.getBoundingClientRect();
      s.top = r.top + y;
      s.h = Math.max(1, s.el.offsetHeight);
    }
  });

  onScroll((y, vh) => {
    const mid = y + vh * 0.5;
    let sec = secs[0];
    for (let i = 0; i < secs.length; i++) {
      if (secs[i].top <= mid) sec = secs[i];
    }
    let f = 0;
    if (sec.d1 !== sec.d0) {
      if (sec.sc) f = progressOf(sec.sc);
      else f = Math.min(1, Math.max(0, (mid - sec.top) / sec.h));
    }
    let day = Math.round(sec.d0 + (sec.d1 - sec.d0) * f);
    // a scene may publish the day it is actually showing (ch6 walks her beat by beat, not linearly)
    if (sec.d1 !== sec.d0 && sec.sc && sec.sc.hasAttribute('data-day-now')) {
      day = +sec.sc.getAttribute('data-day-now');
    }
    const isOn = !hero || heroBottom < y + vh * 0.4;
    if (isOn !== lastOn) {
      lastOn = isOn;
      rail.classList.toggle('is-on', isOn);
    }
    if (day !== last) {
      last = day;
      n.textContent = fmtNum(day);
      if (unit) unit.textContent = day === 1 ? 'day' : 'days';
      rail.style.setProperty('--rail', Math.min(1, day / TOTAL).toFixed(4));
      const late = day > DEADLINE;
      if (late !== lastLate) {
        lastLate = late;
        mark.classList.toggle('is-passed', late);
        rail.classList.toggle('is-late', late);
      }
    }
  });
}
