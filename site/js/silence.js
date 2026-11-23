// Ch.7: 1,346 days of nothing (4 Jul 2022 -> 11 Mar 2026), then the knock at the door.
// The date races, each calendar year she waits through is struck off, the door stays shut;
// at the end two shadows of feet break the light under the door (IL-11).
import { scene } from './scroll.js';
import { dateOfDay, fmtDate, fmtNum } from './config.js';

const START = 256, DAYS = 1346;
const RUN = 0.8;   // share of the scroll spent counting the days; the rest holds the knock
const KNOCK = 0.86;

export function initSilence() {
  const root = document.querySelector('.silence');
  if (!root) return;
  const date = root.querySelector('.silence__date');
  const n = root.querySelector('.silence__n');
  const years = root.querySelectorAll('.years__y');
  const art = document.getElementById('IL-11');
  let last = -1;

  scene('silence', (p) => {
    const k = Math.floor(Math.min(1, p / RUN) * DAYS + 1e-6);
    window.__silenceDrawn = k;
    if (k !== last) {
      last = k;
      const d = dateOfDay(START + k);
      date.textContent = fmtDate(d);
      n.textContent = fmtNum(START + k);
      const y = d.getUTCFullYear();
      for (let i = 0; i < years.length; i++) {
        const yi = +years[i].getAttribute('data-y');
        years[i].classList.toggle('is-past', yi < y);
        years[i].classList.toggle('is-now', yi === y);
      }
    }
    const end = p >= KNOCK;
    root.classList.toggle('is-end', end);
    if (art) art.classList.toggle('is-end', end);
  });
}
