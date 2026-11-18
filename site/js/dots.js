// Ch.10: she is one of many. A crowd of women seen from behind (IL-12).
// Card 0: close on her (red phone). Card 1: the camera pulls back to the whole crowd
// (42,642 complaints to PCSW; the crowd is not drawn to scale). Card 2: the nearest twenty;
// ~17 phones go dark, ~3 stay lit (ActionAid 2022: >85% stayed silent, 14.9% complained).
import { scene, activeCard, reduced } from './scroll.js';

const ZOOM = 2.4;

export function initDots() {
  const fig = document.querySelector('.crowd');
  if (!fig) return;
  const svg = fig.querySelector('svg');
  const cam = svg && svg.querySelector('.crowd__cam');
  const her = svg && svg.querySelector('.her');
  if (!cam || !her) return;
  if (!reduced) fig.classList.add('crowd--live');
  let state = -1;

  function herPoint() {
    // her figure is translate(x y) scale(s); aim at her head
    const m = /translate\(([-\d.]+) ([-\d.]+)\) scale\(([\d.]+)\)/.exec(her.getAttribute('transform'));
    return m ? [+m[1], +m[2] - 110 * +m[3]] : [500, 760];
  }

  function frame() {
    // where the 1000x1000 viewBox sits in the panel (xMaxYMax meet), so we can aim in viewBox units
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const k = Math.min(r.width, r.height) / 1000;
    const offX = r.width - 1000 * k, offY = r.height - 1000 * k;
    const wide = r.width >= 900;
    const tall = r.height > r.width * 1.2;
    if (state === 2) {
      if (wide) {
        // desktop: fit the label + the nearest twenty (viewBox ~ -20..1020 x 590..960, bodies run off the bottom) into the art area
        // right of the card column (42%), centred and as large as it fits
        const ax0 = (r.width * 0.44 - offX) / k, ax1 = (r.width * 0.98 - offX) / k;
        const ay0 = (r.height * 0.1 - offY) / k, ay1 = (r.height * 0.97 - offY) / k;
        const z = Math.min((ax1 - ax0) / 1040, (ay1 - ay0) / 370);
        const tx = (ax0 + ax1) / 2 - z * 500, ty = (ay0 + ay1) / 2 - z * 775;
        cam.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + z.toFixed(3) + ')';
        return;
      }
      // phones: bring the label up to ~17% of the screen so the cards don't sit on it
      const lift = tall ? 600 - (0.17 * r.height - offY) / k : 110;
      cam.style.transform = 'translate(0px,' + (-lift).toFixed(1) + 'px)';
      return;
    }
    if (state === 1) {
      // the whole crowd. On a tall phone screen, fill the height instead of leaving a strip at the bottom
      const z = tall ? 1.6 : 1;
      cam.style.transform = z === 1 ? '' : 'translate(' + (500 - z * 500) + 'px,' + (1000 - z * 1000) + 'px) scale(' + z + ')';
      return;
    }
    const sx = wide ? r.width * 0.71 : r.width * 0.5;
    const sy = wide ? r.height * 0.55 : r.height * 0.62;
    const tx = (sx - offX) / k, ty = (sy - offY) / k;
    const h = herPoint();
    cam.style.transform = 'translate(' + (tx - ZOOM * h[0]).toFixed(1) + 'px,' + (ty - ZOOM * h[1]).toFixed(1) + 'px) scale(' + ZOOM + ')';
  }

  scene('dots', (p, el) => {
    const a = activeCard(el);
    const s = a >= 2 ? 2 : a >= 1 ? 1 : 0;
    if (s === state) return;
    state = s;
    fig.classList.remove('at-0', 'at-1', 'at-2');
    fig.classList.add('at-' + s);
    window.__crowd = s;
    frame();
  });
  window.addEventListener('resize', frame);
}
