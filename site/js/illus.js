import { scene, onEnter, reduced, activeCard } from './scroll.js';

// Cumulative "at-N" classes for a stepped scene; returns the active index.
export function stepClasses(el, p, n) {
  const at = Math.min(n - 1, Math.floor(p * n * 0.999 + 0.0001));
  for (let i = 0; i < n; i++) el.classList.toggle('at-' + i, i <= at);
  return at;
}

export function initIllustrations() {
  // hero badge 1 -> 2 -> 3
  const b = document.querySelector('#IL-01 .badge__n');
  if (b) {
    if (reduced) b.textContent = '3';
    else [1, 2, 3].forEach((n, i) => setTimeout(() => { b.textContent = String(n); }, 600 + i * 700));
  }
  onEnter('.il', (el) => {
    el.classList.add('is-in');
    el.querySelectorAll('.reveal-in').forEach((g) => g.classList.add('is-in'));
  }, 0.35);
  scene('runaround', (p, el) => stepClasses(el, p, 4));
  // Ch.4: the call from Satkhira, then the law (handcuffs for s.10, the ruler for s.5)
  scene('promise', (p, el) => {
    el.classList.toggle('at-1', activeCard(el) >= 1);
  });
}
