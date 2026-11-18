// Ch.1 messages (phone + "I don't respond") and Ch.2 checklist.
import { scene, activeCard } from './scroll.js';

function activeStep(p, n) {
  return Math.min(n - 1, Math.max(0, Math.floor(p * n * 0.999 + 0.0001)));
}

export function initMessages() {
  const imgs = document.querySelectorAll('.phone__img');
  const steps = document.querySelectorAll('[data-scene="messages"] .step');
  let last = -1;
  scene('messages', (p) => {
    const i = activeStep(p, steps.length);
    if (i === last) return;
    last = i;
    const shot = steps[i].getAttribute('data-shot');
    imgs.forEach((im) => im.classList.toggle('is-on', im.getAttribute('data-shot') === shot));
  });

  document.querySelectorAll('.reveal').forEach((btn) => {
    btn.addEventListener('click', () => {
      const t = document.getElementById(btn.getAttribute('aria-controls'));
      const open = btn.getAttribute('aria-expanded') !== 'true';
      t.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Hide it again' : 'Show what he wrote';
    });
  });
}

export function initChecklist() {
  // Ch.2: a pair of scales. Each task she is told to do lands on her pan and tips the beam;
  // the replies land on the other pan and weigh nothing.
  const checks = document.querySelectorAll('[data-scene="checklist"] .check');
  const bits = document.querySelectorAll('#IL-03 .c');
  const beam = document.querySelector('#IL-03 .il03-beam');
  const panL = document.querySelector('#IL-03 .il03-pan--l');
  const panR = document.querySelector('#IL-03 .il03-pan--r');
  const date = document.querySelector('#IL-03 .il03-date');
  const friends = document.querySelector('#IL-03 .il03-friends');
  const DATES = ['22 Oct', '22 Oct', '24 Oct', '24 Oct', '28 Oct', '31 Oct', '2 Nov', '17 Nov'];
  // beam angle (deg) after n tasks; the replies (n = 5) add nothing
  const TILT = [0, 0, -3, -6, -9, -9, -12, -14, -16];
  const L = 250; // half-beam, in SVG units
  let last = -1;
  scene('checklist', (p, el) => {
    // one beat per card: the card in view is the one being done
    const done = p >= 0.999 ? checks.length : Math.min(checks.length, activeCard(el) + 1);
    if (done === last) return;
    last = done;
    checks.forEach((c, i) => c.classList.toggle('is-done', i < done));
    bits.forEach((b) => b.classList.toggle('is-on', +b.getAttribute('data-k') < done));
    if (date) date.textContent = DATES[Math.max(0, done - 1)];
    if (friends) friends.classList.toggle('is-on', done >= 1 && done <= 2);
    const a = TILT[done] * Math.PI / 180;
    const dx = (L - L * Math.cos(a)).toFixed(1);
    const dy = (-L * Math.sin(a)).toFixed(1);
    if (beam) beam.style.transform = 'rotate(' + TILT[done] + 'deg)';
    if (panL) panL.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    if (panR) panR.style.transform = 'translate(' + -dx + 'px,' + -dy + 'px)';
  });
}
