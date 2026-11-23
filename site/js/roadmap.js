// Ch.11 Interactive Legal Roadmap: path highlighter + expand/collapse statute drawers.

const BANNERS = {
  all: null,
  refusal: {
    tone: 'alarm',
    html: '<strong>If the police station refuses to file your FIR:</strong> You do not have to accept a GD as a substitute. Under <strong>Section 40(2)</strong> of the Cyber Security Act, 2026, you can submit a written complaint with an <strong>affidavit</strong> directly to the Cyber Tribunal, which can order police to investigate &mdash; bypassing Step 3.'
  },
  clocks: {
    tone: 'teal',
    html: '<strong>Statutory clocks under the Cyber Security Act, 2026:</strong> <strong>24h + 24h</strong> Magistrate check (Sec 31) &rarr; <strong>90 + 15 + 30 = 135 days</strong> investigation (Sec 32, extendable for technical constraints) &rarr; <strong>180 + 90 = 270 working days</strong> trial from charge framing (Sec 45).'
  }
};

export function initRoadmap() {
  const root = document.getElementById('ch11');
  if (!root) return;

  const chart = root.querySelector('.flow-chart');
  const buttons = root.querySelectorAll('.mode-btn[data-mode]');
  const banner = root.querySelector('.mode-banner');
  const expandBtn = root.querySelector('.expand-all-btn');
  const details = root.querySelectorAll('.stage-detail');

  if (!chart) return;

  function setMode(mode) {
    chart.setAttribute('data-mode', mode);
    buttons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-mode') === mode));
    });
    if (banner) {
      const cfg = BANNERS[mode];
      if (!cfg) {
        banner.hidden = true;
        banner.innerHTML = '';
      } else {
        banner.setAttribute('data-tone', cfg.tone);
        banner.innerHTML = cfg.html;
        banner.hidden = false;
      }
    }
    // Auto-open the most relevant statute drawers when focusing a specific path
    if (mode === 'refusal') {
      root.querySelectorAll('[data-open-on~="refusal"]').forEach((d) => { d.open = true; });
    } else if (mode === 'clocks') {
      root.querySelectorAll('[data-open-on~="clocks"]').forEach((d) => { d.open = true; });
    }
  }

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setMode(btn.getAttribute('data-mode'));
    });
  });

  if (expandBtn && details.length) {
    function syncExpandLabel() {
      const anyClosed = Array.prototype.some.call(details, (d) => !d.open);
      expandBtn.textContent = anyClosed ? 'Expand all legal notes' : 'Collapse all legal notes';
      expandBtn.setAttribute('aria-expanded', String(!anyClosed));
    }

    expandBtn.addEventListener('click', () => {
      const anyClosed = Array.prototype.some.call(details, (d) => !d.open);
      details.forEach((d) => { d.open = anyClosed; });
      syncExpandLabel();
    });

    details.forEach((d) => d.addEventListener('toggle', syncExpandLabel));
    syncExpandLabel();
  }
}
