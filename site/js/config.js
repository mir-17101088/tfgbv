// Identity + dates for the review build. Every name on the page comes from here
// (HTML spans with data-cfg="<key>"), so editorial changes are one edit.
// Decided by Mir, 18 Nov 2026 — pending editorial/legal review.
export const CFG = {
  survivor: 'Nadia',             // placeholder name for the survivor
  accused: 'Sk Shahed',          // Facebook account name of the accused (trial ongoing)
  siGd: 'SI Amir Sohel',         // officer in charge of the GD
  siCase: 'SI Prosenjit',        // SI in charge of the case
  adc: 'ADC Taimur',
  callerNumber: '+880 1748-1•••••',
  day1: '2021-10-21',
};

const DAY1 = Date.UTC(2021, 9, 21);

// Days elapsed since the first message (21 Oct 2021 = 0). See ledger ruling.
export function dayOf(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - DAY1) / 864e5);
}

// Inverse: day number -> Date (UTC).
export function dateOfDay(n) {
  return new Date(DAY1 + n * 864e5);
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export function fmtDate(dt) {
  return dt.getUTCDate() + ' ' + MONTHS[dt.getUTCMonth()] + ' ' + dt.getUTCFullYear();
}
export function fmtNum(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
