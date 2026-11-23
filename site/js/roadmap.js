// Ch.11 Interactive Legal Roadmap: clean view filtering + expand/collapse legal notes.

const BANNERS = {
  all: null,
  refusal: {
    tone: 'alarm',
    html: '<strong>Showing the police-refusal route (4 steps):</strong> Under <strong>Section 40(2)</strong>, you can file a written complaint with an <strong>affidavit</strong> directly before the Cyber Tribunal. If satisfied, the Tribunal orders police to investigate &mdash; skipping Steps 3 &amp; 4.'
  },
  clocks: {
    tone: 'teal',
    html: '<strong>Showing only stages with legal deadlines (3 steps):</strong> <strong>24h + 24h</strong> Magistrate screening (Sec 31) &rarr; <strong>90 + 15 + 30 = 135 days</strong> investigation (Sec 32) &rarr; <strong>180 + 90 = 270 working days</strong> trial from charge framing (Sec 45).'
  }
};

export function initRoadmap() {
  const root = document.getElementById('ch11');
  if (!root) return;

  const chart = root.querySelector('.flow-chart');
  const buttons = root.querySelectorAll('.mode-btn[data-mode]');
  const banner = root.querySelector('.mode-banner');
  const bannerText = root.querySelector('.mode-banner__text');
  const resetBtn = root.querySelector('.mode-banner__reset');
  const phaseNav = root.querySelector('.phase-nav');
  const expandBtn = root.querySelector('.expand-all-btn');
  const details = root.querySelectorAll('.stage-detail');

  if (!chart) return;

  function setMode(mode) {
    chart.setAttribute('data-mode', mode);
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', String(buttons[i].getAttribute('data-mode') === mode));
    }
    if (phaseNav) phaseNav.hidden = mode !== 'all';
    if (banner && bannerText) {
      const cfg = BANNERS[mode];
      if (!cfg) {
        banner.hidden = true;
        bannerText.innerHTML = '';
      } else {
        banner.setAttribute('data-tone', cfg.tone);
        bannerText.innerHTML = cfg.html;
        banner.hidden = false;
      }
    }
    if (mode === 'refusal') {
      root.querySelectorAll('[data-open-on~="refusal"]').forEach((d) => { d.open = true; });
    } else if (mode === 'clocks') {
      root.querySelectorAll('[data-open-on~="clocks"]').forEach((d) => { d.open = true; });
    }
  }

  for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', () => {
      setMode(buttons[i].getAttribute('data-mode'));
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => setMode('all'));
  }

  if (expandBtn && details.length) {
    function syncExpandLabel() {
      let anyClosed = false;
      for (let i = 0; i < details.length; i++) {
        if (!details[i].open) { anyClosed = true; break; }
      }
      expandBtn.textContent = anyClosed ? 'Open all legal notes' : 'Close all legal notes';
      expandBtn.setAttribute('aria-expanded', String(!anyClosed));
    }

    expandBtn.addEventListener('click', () => {
      let anyClosed = false;
      for (let i = 0; i < details.length; i++) {
        if (!details[i].open) { anyClosed = true; break; }
      }
      for (let i = 0; i < details.length; i++) details[i].open = anyClosed;
      syncExpandLabel();
    });

    for (let i = 0; i < details.length; i++) details[i].addEventListener('toggle', syncExpandLabel);
    syncExpandLabel();
  }
}
