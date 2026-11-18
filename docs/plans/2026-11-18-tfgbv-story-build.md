# TFGBV Story — First Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static, scroll-driven, illustrated web story of "Nadia's" five-year TFGBV case, ready for editorial review.

**Architecture:**
- One static `site/index.html` holds every chapter's copy and inline SVG illustrations, so the page reads fine without JS.
- A small vanilla ES-module layer adds the scroll behaviour: chapter triggers, sticky-scene progress, the day rail, path drawing, the silence calendar and the dot field.
- Python tools in `tools/` do the work outside the browser: redact the screenshots, build the sources list, render the share card, and run Playwright QA.

**Tech Stack:**
- HTML, CSS and vanilla JS (ES2018, no framework, no bundler).
- Python 3.14 with Pillow, fontTools and Playwright (`channel="chrome"`).
- `npx lighthouse` for audits.

**Spec:** `docs/design.md`. Translation: `02-translation/timeline_en.md`. Sources: `03-research/sources.csv`.

## Global Constraints

- **Browser support:** Chrome 87. No CSS `aspect-ratio`, `:has`, container queries, `scroll-timeline` or View Transitions. Use `clamp()`, flex `gap` and IntersectionObserver. Must work at 320px wide with no horizontal scroll.
- **Self-hosting:** no runtime CDN or external requests.
  - Fonts are copied from `Desktop/Bangladesh Digital Laws/Digital-Frontier-Handoff/04-microsite/assets/fonts/`: `lato-400.woff2`, `lato-700.woff2`, `montserrat-800.woff2`.
  - Roboto is replaced by Lato for UI text (my call: no local Roboto, and it saves ~40 KB).
  - Timestamps use `ui-monospace, Menlo, Consolas, monospace`.
  - Bangla uses the system stack `'Noto Sans Bengali','Nirmala UI',sans-serif`. Android ships Noto Bengali, so no download is needed.
- **Colours:**
  - TGI tokens: Deep Teal `#174D4F`, Teal `#246E72`, Ocean `#1C7D84`, Mint `#8DD8C2`, Aqua `#B9E0DA`, Sage `#B1C9AC`, Navy `#1F2A44`, ink `#2C3B3A`.
  - Night `#0A2223`.
  - Alarm `#C0453B`, used in at most 4 places: the deadline marker, the warrant stamp, her dot in Ch.10, and the "Day N" counter after the deadline.
- **Identity:**
  - Survivor name "Nadia", accused account "Sk Shahed", officers SI Amir Sohel, SI Prosenjit, ADC Taimur.
  - Masked number `+880 1748-1•••••`.
  - All of these are rendered from `site/js/config.js` and from `data-cfg="<key>"` spans in the HTML. The real name "Trishia" and the full number `8801748166020` must never appear in `site/`.
- **Originals:** the original screenshots (`*.jpeg`, `01-source/photos/`) never go into `site/`. Only `site/assets/evidence/*.webp` produced by `tools/redact.py`.
- **Copy:** her words come verbatim from `02-translation/timeline_en.md`. Narrator copy carries `data-draft` on its element. No emoji. Estimates are marked "~". Write "Tk", not the taka sign.
- **Fixed figures:**

  | Figure | Value |
  |---|---|
  | Day 1 | 21 Oct 2021 |
  | Case filed | Day 45 (5 Dec 2021) |
  | Legal investigation deadline | ~Day 150 (~20 Mar 2022) |
  | Charge sheet | Day 256 (4 Jul 2022) |
  | Silence | 1,346 days (4 Jul 2022 → 11 Mar 2026) |
  | First warrant | Day 1,602 (11 Mar 2026) |
  | Court | Day 1,830 (25 Oct 2026) |
  | Next hearing | Day 1,873 (7 Dec 2026) |

- **Reduced motion and Save-Data:** under `prefers-reduced-motion: reduce` or `navigator.connection.saveData`, every scene shows its final state and the silence section collapses to ~1 screen.
- **SEO:**
  - `<title>`, meta description, canonical `https://example.org/tfgbv/` (placeholder), OG and Twitter tags, a 1200×630 `share.png`.
  - JSON-LD `NewsArticle` with author `Mir Rownak` and publisher `Tech Global Institute`.
- **Workflow:** no git commits or deploys unless Mir asks. The project is not a git repo; each task ends with a QA run instead of a commit.

## Review Focus

1. **Reader scrolls fast, or jumps via the "Skip the wait" link or an anchor:** sticky scenes must land in the correct state for the current scroll position, not stuck half-drawn. Test `test_jump_states` (Task 4).
2. **Old phone at 320px:** no horizontal overflow, the phone frame fits, and speech bubbles don't overlap the text. Test `test_no_overflow_320` (Task 3) plus overlap checks in later tasks.
3. **JS fails or is blocked:** all copy, redacted screenshots and final-state illustrations remain visible. Test `test_no_js_readable` (Task 3).
4. **Tap-to-reveal slurs:** hidden by default, keyboard-operable, and never in the alt text. Test `test_reveal_default_hidden` (Task 6).
5. **Identity leaks:** the real name, the full phone number, or an unredacted image in `site/`. Test `test_no_identity_leak` (Task 2), re-run in final QA.

---

### Task 1: Scaffold, tokens, config, QA harness

**Files:**
- Create: `site/index.html` (skeleton: head, `<main>` with empty `<section id="ch0">`…`<section id="ch12">`, footer)
- Create: `site/css/tokens.css`, `site/css/story.css`
- Create: `site/js/config.js`, `site/js/main.js`
- Create: `site/assets/fonts/*` (copied), `site/assets/logo/tgi-logo-primary.png`, `tgi-logo-white.png`
- Create: `tools/serve.py`, `tools/qa.py`

**Interfaces:**
- Produces:
  - `config.js`: `export const CFG = { survivor:'Nadia', accused:'Sk Shahed', siGd:'SI Amir Sohel', siCase:'SI Prosenjit', adc:'ADC Taimur', callerNumber:'+880 1748-1•••••', day1:'2021-10-21' }` and `export function dayOf(isoDate: string): number`. Day 1 = 21 Oct 2021.
  - `main.js`: `applyConfig(root=document)` fills `[data-cfg]` spans from `CFG`.
  - `qa.py` provides:
    - `serve(port=8765)` as a context manager;
    - `page(width, reduced=False, js=True)` as a context manager yielding a Playwright page on `http://localhost:8765/`;
    - a registry `@check` and a CLI `python tools/qa.py [name...]` that runs the selected checks and exits non-zero on failure.

- [ ] **Step 1:** In `tools/qa.py`, write `test_day_of` (runs `dayOf` in the page: `dayOf('2021-10-21')==1`, `dayOf('2022-07-04')==256`, `dayOf('2026-10-25')==1830`). Also write `test_config_applied`: every `[data-cfg="survivor"]` has text `Nadia`.
- [ ] **Step 2:** Run `python tools/qa.py test_day_of test_config_applied`. Expected: FAIL (no site yet).
- [ ] **Step 3:** Create the files above.
  - `dayOf` uses UTC dates: `Math.round((Date.UTC(y,m-1,d)-Date.UTC(2021,9,21))/864e5)+1`.
  - `tokens.css` copies the TGI colour, spacing and type tokens, adds `--night`, `--alarm`, and `@font-face` for the three woff2 files with `font-display:swap`.
- [ ] **Step 4:** Run the same command. Expected: PASS.

### Task 2: Redaction pipeline and evidence assets

**Files:**
- Create: `tools/redact.py`, `tools/redact_boxes.json`
- Create (output): `site/assets/evidence/msg-1.webp` … `msg-5.webp`, `profile.webp`

**Interfaces:**
- Produces: the files above, max 720px wide, quality 72. Each has a sibling entry in `site/assets/evidence/manifest.json`: `{file, w, h, alt}`. The alt text describes the message without the slurs, e.g. "Messenger screenshot, 22 Oct, 7:59 AM: a forwarded pornographic video (blurred) and an obscene message".
- Box kinds in `redact_boxes.json`: `blur` (Gaussian radius 28 plus a 60% night overlay), `bar` (solid `#9AA7A5` bar for explicit text), `label` (night bar with white text, e.g. "[profile photo removed]").

- [ ] **Step 1:** Write `test_no_identity_leak` in `qa.py`. It recursively scans `site/` text files for `Trishia`, `trishia`, `8801748166020`, `1748166020`, `kumkum.mahi`, and asserts that no `.jpeg`/`.jpg` files exist under `site/`.
- [ ] **Step 2:** Write `test_evidence_redacted`. For each box of kind `blur` or `bar`, the pixel standard deviation inside that region in the output must be less than 18. Run it: expected FAIL.
- [ ] **Step 3:** Implement `redact(src: Path, boxes: list[dict], out: Path) -> tuple[int,int]`.
  - Measure boxes by viewing each original. Boxes cover all porn media, the profile photo (all images), the account name in the header, and slur text lines.
  - Screenshots 1 and 4 are the same chat (images at 7:03 PM). Ship 1 and drop 4 if it is a duplicate after cropping.
- [ ] **Step 4:** Run `python tools/redact.py` then `python tools/qa.py test_no_identity_leak test_evidence_redacted`. Expected: PASS.
- [ ] **Step 5:** Visually inspect each WebP (Read the image). Nothing explicit should be legible.

### Task 3: All chapter copy, static layout, hero

**Files:**
- Modify: `site/index.html` (fill ch0–ch12 copy, figure placeholders `<figure class="il" id="IL-0n">`)
- Modify: `site/css/story.css`

**Interfaces:**
- Produces:
  - Section ids `ch0`…`ch12`.
  - Each sticky scene is `<div class="scene" data-scene="<name>">` wrapping `<div class="scene__sticky">` and `<div class="scene__steps">` with `<div class="step" data-step="n">` children. Scene names: `messages`, `checklist`, `runaround`, `path`, `silence`, `dots`.
  - Quote blocks are `<blockquote class="q"><p>EN</p><p class="q__bn" lang="bn">BN</p></blockquote>`.
  - Elements that animate get a class `is-final` state defined in CSS. JS removes `is-final` on load and re-adds it at the end.

Copy rules:
- **Hero:** headline "She Did Everything Right" plus the dek from design §9 item 4 with the name swapped for "Nadia", and a byline "By Mir Rownak · Tech Global Institute · [date]". The logo goes top-left over the hero.
- Content warning before ch1: "This story describes sexual harassment. Explicit images are blurred; offensive words are hidden unless you choose to reveal them."
- Quotes, with Bangla taken from `01-source/timeline_bn.txt`:
  - ch3: "block…" (paraphrase, attributed as her account of what the friend said) and PCSW's "You can't just say whatever you like because you're upset."
  - ch5: "Go home. If a case is to be filed, you will be called." (her account).
  - ch8: "You are a woman. How would it look if we took you to the station and kept you overnight?"
  - ch9: "For the first time, I saw the face of the accused."
- **ch11** (if this happens to you):
  1. A GD is a record, not a case. Ask for a case (FIR) for a cognizable offence.
  2. If the police station refuses, go to the circle ASP/SP or a magistrate.
  3. Keep screenshots with URLs and timestamps; don't delete the chat.
  4. Contact PCSW: facebook.com/cybersupport.women — verify the URL before launch and list it in `sources.csv`.
  - Mark S04/S05/S13-dependent lines `data-unverified` until verified.
- **ch12:** methodology note (translation, consent, "names of the survivor changed; accused and officers named as in the complainant's account; trial ongoing") plus a `<div id="sources">` filled in Task 8.

- [ ] **Step 1:** Write the checks:
  - `test_no_overflow_320`: at width 320, `document.documentElement.scrollWidth <= 320`.
  - `test_no_js_readable`: with JS disabled, the texts "I don't respond", "1,346", "non-bailable" and "7 December" are visible and every `img` has non-empty alt.
  - `test_hero_rules`: `#ch0` contains exactly one `h1`, one dek `.dek` and one `.byline`; the logo `img` is inside `#ch0`.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Write the copy and layout:
  - Reading column `max-width: 36rem`; Lato 18px/1.7.
  - Headlines in Montserrat 800 with clamp sizing.
  - Night sections `background: var(--night)`.
- [ ] **Step 4:** Run the checks. Expected: PASS. Take Playwright screenshots at 320/375/768/1280 into `qa-out/` and Read them.

### Task 4: Scroll engine and day rail

**Files:**
- Create: `site/js/scroll.js`, `site/js/rail.js`
- Modify: `site/js/main.js`, `site/index.html` (rail markup `<div class="rail" aria-hidden="true">`), `story.css`

**Interfaces:**
- Produces:
  - `scroll.js`:
    - `export function scene(name: string, onProgress: (p: number, el: HTMLElement) => void): void`. `p` runs 0..1 across the scene's scroll range, is called on every rAF while the scene is in view, and is also called once on init with the current p.
    - `export function onEnter(selector: string, cb: (el) => void, threshold=0.5)`.
    - `export const reduced: boolean` (true under reduced motion or saveData).
  - `rail.js`: `initRail()`. Each `section` carries `data-day="<n>"`. The rail interpolates the day between sections, shows "Day N" and fills a bar 0→1873. The marker at ~Day 150 turns `--alarm` once the current day exceeds 150.
  - Section `data-day` values: ch0 1, ch1 1, ch2 3, ch3 13, ch4 40, ch5 40, ch6 45→256, ch7 256→1602, ch8 1602, ch9 1830, ch10 1830, ch11 1873.

- [ ] **Step 1:** Write the checks:
  - `test_rail_days`: after `scrollIntoView` of ch9, the rail text contains "Day 1,830" (allow ±5 for interpolation) and the deadline marker has class `is-passed`.
  - `test_jump_states`: jump straight to the bottom then to ch6. `scene('path')` progress is between 0 and 1 and the DOM matches it (the `--p` CSS var on the scene is not stale).
  - `test_reduced_final`: with reduced motion, every `.scene` has class `is-final`.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement.
  - One passive scroll listener sets a `ticking` flag and a single rAF loop.
  - Scene progress is `(scrollY - top) / (height - innerHeight)`, clamped, then written to `el.style.setProperty('--p', p)`.
  - Cache `top`/`height` and recompute on resize and font load.
- [ ] **Step 4:** Run the checks. Expected: PASS.

### Task 5: Illustrations IL-01…IL-09

**Files:**
- Create: `site/svg/il-01.svg` … `il-09.svg` (authoring sources), inlined into `index.html` by `tools/inline_svg.py`. The tool replaces `<!-- @svg il-0n -->` markers.
- Modify: `story.css` (illustration motion classes)

**Interfaces:**
- Consumes: `scene()`/`onEnter()` from Task 4.
- Produces: each SVG has `role="img"`, `<title>`, a `viewBox` and no fixed width (CSS width 100%, height auto). Animated parts carry `class="draw"` (stroke-dasharray drawing driven by `--p`), `class="stamp"` (IL-07) or `class="badge"` (IL-01).
- Style:
  - Strokes `#10201F`, 2.5px, round caps.
  - Wobble is baked into the path points; author with small irregular offsets, nothing generated at runtime.
  - Fills from Mint/Aqua/Sage/Teal; night scenes use Teal/Ocean on Night.
  - People have no facial features: back views, silhouettes, hands.
- Content: per design §6.
  - IL-04 labels the buildings "Darus Salam police station", "DMP", "DB", with times 29 Nov night, 30 Nov 2:00 PM, 2:30 PM, 3:26 PM.
  - IL-05 clock labels "30 min", "3 hours", "50 min".

- [ ] **Step 1:** Write the checks:
  - `test_svgs_inlined`: 9 `svg[role=img]` with non-empty `title`.
  - `test_svg_size`: total inline SVG bytes ≤ 120 KB.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Draw each SVG and run `python tools/inline_svg.py`. After each SVG, screenshot it at 375 and 1280 and Read it to judge the drawing. Redraw anything that reads as clip-art or shows a face.
- [ ] **Step 4:** Run the checks. Expected: PASS.

### Task 6: Ch.1 messages and Ch.2 checklist

**Files:**
- Create: `site/js/messages.js`, `site/js/checklist.js`
- Modify: `index.html` ch1/ch2 markup, `story.css`

**Interfaces:**
- Consumes: `scene`, `reduced`, `manifest.json` entries (rendered into the HTML statically, not fetched).
- Produces:
  - ch1 is a phone-frame sticky with the evidence images and the timeline steps (21 Oct 10:41 PM; 22 Oct 7:59 AM, 5:01 PM, 6:30 PM, 7:30 PM; 30 Oct 1:31 PM; 1 Nov 7:27 PM). After each step, "I don't respond." appears at font sizes stepping down from 1.5rem to 0.75rem.
  - Slur reveal: `<button class="reveal" aria-expanded="false" aria-controls="r1">Show what he wrote</button>` with `<span id="r1" hidden>` holding the transliterated text from the screenshots.
  - ch2 is a checklist with 8 items, ticked by step: told friends; messaged PCSW; sent name/address/age/profession, father's name, NID; filed GD (24 Oct); sent GD copy; asked for update ×6 (26, 27, 28, 31 Oct, 2 Nov, 17 Nov); sent screenshots again; blocked and reported. Each tick is followed by the reply text from her timeline ("No reply.", "Fact-finding takes time.", …).

- [ ] **Step 1:** Write the checks:
  - `test_reveal_default_hidden`: `#r1` is hidden; pressing Enter on the button shows it and sets `aria-expanded=true`.
  - `test_phone_fits_320`: the phone frame's bounding box is inside the viewport width at 320.
  - `test_checklist_final`: at scene end, 8 `.check.is-done`.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement. Map the step index to `is-done` classes via `scene('checklist', p => …)`.
- [ ] **Step 4:** Run the checks. Expected: PASS. Take 320/1280 screenshots and Read them.

### Task 7: Ch.4 promise, Ch.6 path, Ch.7 silence

**Files:**
- Create: `site/js/path.js`, `site/js/silence.js`
- Modify: `index.html`, `story.css`

**Interfaces:**
- Consumes: `scene`, `dayOf`, `reduced`.
- Produces:
  - **Ch.4:** a static SVG of five labelled stops: Complaint → FIR → Investigation (30 working days, max 75) → Charge sheet → Trial. Caption cites the Pornography Control Act 2012 s.5.
  - **Ch.6 (`path`):**
    - SVG with x = day (linear, 0…1873) and y = stage index 0..4. The law's line runs from Day 45 to ~Day 150 at the charge-sheet stage.
    - Her events, as `[day, stage, label]`:
      | Day | Stage | Label |
      |---|---|---|
      | 1 | 0 | First message |
      | 4 | 0 | GD filed (a record, not a case) |
      | 40 | 0 | Told the accused was found |
      | 41 | 0 | Sent to DMP, then DB, then back |
      | 45 | 1 | Case filed |
      | 49 | 1 | Asked for 4 witnesses |
      | 60 | 1 | Met ADC: "settled within a month" |
      | 205 | 2 | Asked for 2–3 more witnesses |
      | 208 | 2 | Meeting at a bakery |
      | 256 | 3 | Charge sheet |
    - Her line is drawn by `--p`. When it crosses ~Day 150, the deadline marker label "Legal deadline passed" appears in alarm red.
    - The x-axis shows only Days 0–300 here; Ch.7 continues the timeline.
  - **Ch.7 (`silence`):**
    - Section height `max(400vh, 2400px)` (1 screen when `reduced`).
    - The sticky panel holds a big date (from 4 Jul 2022 to 11 Mar 2026 as p goes 0→1), "Day N", the line "Nothing happened.", and a `<canvas>` grid of 1,346 cells that fill as p rises.
    - A "Skip the wait →" link (`href="#ch8"`) is always visible.
    - At p>0.98, show "Then, on 11 March 2026, the police came to her door — for her."

- [ ] **Step 1:** Write the checks:
  - `test_path_deadline`: at path p=1, the marker has `is-passed` and the last label text is "Charge sheet".
  - `test_silence_dates`: at silence p=0 the date shows "4 July 2022"; at p=1 it shows "11 March 2026"; the cell count drawn equals 1346.
  - `test_skip_link`: clicking the skip link scrolls ch8 into view.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement. The canvas is sized to devicePixelRatio, with redraws limited to cells that changed.
- [ ] **Step 4:** Run the checks. Expected: PASS. Take 320/1280 screenshots at p = 0, 0.5, 1 and Read them.

### Task 8: Ch.10 dot field, sources list, footer

**Files:**
- Create: `site/js/dots.js`, `tools/build_sources.py`
- Modify: `index.html` (ch10, ch12, footer), `story.css`

**Interfaces:**
- Produces:
  - **Ch.10:** a `<canvas>` with 1 dot = 10 complaints, for the PCSW figure **only if** S07 is VERIFIED in `sources.csv`. Otherwise it renders with label "[figure pending verification]" and `data-unverified`.
    - Her dot is outlined in alarm red.
    - The ActionAid line "Of the women ActionAid surveyed in 2022, ~85% stayed silent" carries the same gate on S08.
    - A static PNG fallback `site/assets/dots-fallback.png` sits in `<noscript>`.
  - `build_sources.py`: reads `03-research/sources.csv` and writes an `<ol>` into `<!-- @sources -->` in `index.html` with publisher, title, date, link and status. Non-VERIFIED rows get a visible "[unverified]" tag for the review build.
  - **Footer:** Deep Teal background, TGI white logo on the left, "Tech Global Institute" links on the right (website only; no social URLs are invented), credit "Story & development: Mir Rownak".

- [ ] **Step 1:** Write the checks:
  - `test_sources_built`: the `#sources li` count equals the row count in the CSV.
  - `test_unverified_flagged`: every `[data-unverified]` element is visibly tagged.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement. Before building, open the S07, S08 and S12 URLs and update their status in the CSV (VERIFIED, or note the discrepancy).
- [ ] **Step 4:** Run the checks. Expected: PASS.

### Task 9: SEO, share card, final QA

**Files:**
- Create: `tools/share_card.py` → `site/assets/share.png` (1200×630, IL-01 plus headline, rendered via Playwright)
- Modify: `index.html` head
- Create: `qa-out/lighthouse-*.json`, `qa-out/REPORT.md`

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1:** Write the checks:
  - `test_meta`: og:title, og:image (→ share.png 1200×630), twitter:card=summary_large_image, canonical, JSON-LD parses, `author.name=='Mir Rownak'`, `publisher.name=='Tech Global Institute'`.
  - `test_no_external_requests`: during load, every request URL starts with `http://localhost:8765`.
  - `test_overlaps`: at 320 and 375, use `elementsFromPoint` at the centre of each `.step` card. Its topmost element must be inside the card.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement the head tags and the share card.
- [ ] **Step 4:** Run `python tools/qa.py` (all checks). Expected: all PASS.
- [ ] **Step 5:** Run `npx lighthouse http://localhost:8765/ --preset=perf --form-factor=mobile --output=json` twice. Record the median in `qa-out/REPORT.md`. Targets: Perf ≥ 90, A11y 100, SEO 100. Fix and re-run in pairs if below target.
- [ ] **Step 6:** Update `HANDOVER.md`: what was built, what is unverified, and the open editorial questions.
