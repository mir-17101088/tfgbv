# TFGBV story — handover

Client: **Tech Global Institute** (not Daily Star — don't use the daily-star-story kit). Builder: Mir Rownak.
Brief: interactive, punchy scroll story of one survivor's real TFGBV case in Bangladesh — what the law says should happen vs. what actually happened — showing how long and demoralising the process is. Illustrations encouraged. TGI brand, but push past it creatively.

## Folder map
- `TFGBV Timeline.docx`, `1–6.jpeg` — originals from the survivor (untouched).
- `01-source/timeline_bn.txt` — extracted Bangla text. `01-source/photos/` — copies of the screenshots.
- `02-translation/timeline_en.md` — full English translation with [TN] translator's notes.
- `03-research/sources.csv` — every outside fact, with status (VERIFIED / SEARCH-SNIPPET / TO VERIFY). **Nothing goes in the story unless it's VERIFIED here.**
- `03-research/story-concept.md` — first concept draft (superseded by `docs/design.md`).
- `site/` — **the review build** (static; open via `python -m http.server 8765 -d site` → http://localhost:8765/). Never open via file://.
- `tools/` — `qa.py` (25 checks: `python tools/qa.py`), `shots.py` (screenshots), `redact.py` + `redact_boxes.json` (evidence), `inline_svg.py` (site/svg → index.html), `build_sources.py` (CSV → sources list + dots fallback), `share_card.py`.
- `docs/plans/` — build plan + `progress.md` ledger (every Ruling made during the build). `qa-out/REPORT.md` — QA + Lighthouse.
- `docs/design.md` — **the design doc** (approach A: coded SVG illustrations). Awaiting approval.
- TGI design system: `C:\Users\Asus\Desktop\Tech Global Institute Design System` (tokens, logo, voice rules).
- Official statute texts already saved in the Digital Frontier project: `Desktop\Bangladesh Digital Laws\Digital-Frontier-Handoff\02-provenance\official-statutes\` (PORN.txt = Pornography Control Act 2012, CPA.txt, PEN.txt).

## Session log
### Session 1 — 18 Nov 2026
- Read timeline (Oct 2021 → Oct 2026) and screenshots. Translated in full.
- Researched law vs reality; logged 14 sources. Statute facts from official text are VERIFIED; news figures are snippet-level and must be opened before use.
- Computed durations from her timeline (45 days to case; 211 days / ~151 working days to charge sheet vs 75-working-day legal max; 1,346 days of silence; 1,830 days to first court sight of accused).
- Drafted concept. **No code written** — awaiting Mir's approval of concept + answers below.

### Session 1b — 18 Nov 2026
- Mir chose **Approach A: inline SVG illustrations in code**. Wrote full design doc `docs/design.md` (12 chapters, 9 illustrations, redaction pipeline, Chrome-87-safe stack, defaults in §9, builder-check calls in §11).
- Legal investigation deadline computed: 75 working days after 5 Dec 2021 ≈ 20 Mar 2022 (~Day 150, holidays ignored). Charge sheet = Day 256.
- Mir approved design (18 Nov). Decisions: survivor placeholder name **"Nadia"**; **accused account "Sk Shahed" and officers named**; caller number partly masked. All behind `site/js/config.js`. Build goes to heavy editorial review.
- Implementation plan: `docs/plans/2026-11-18-tfgbv-story-build.md` (9 tasks). Next: Mir picks execution method → build Task 1.

### Session 2 — 18 Nov 2026 (build)
- Built the full review build per the plan (9 tasks, all checks green): hero, 12 chapters, 8 inline SVG illustrations, redacted evidence, day rail ("N days since the first message"), law-vs-her path chart, 1,346-day silence counter, PCSW dot field, guide, sources, footer, SEO/OG/JSON-LD, share card.
- Verified S06, S07 (PCSW 42,642 complaints 16 Nov 2020–31 Dec 2024), S08 (ActionAid 2022 via TBS), S12 by reading the pages.
- Lighthouse mobile pairs: 97–99 / 100 / 100 / 100.
- **How to change things:** names → `site/js/config.js` AND the static fallback text in `index.html` spans `data-cfg` (keep both in sync). Illustrations → edit `site/svg/*.svg` then `python tools/inline_svg.py`. Sources → edit CSV then `python tools/build_sources.py`. Always re-run `python tools/qa.py`.
- Copy marked `data-draft` = narrator text written by Claude, needs Mir/editor sign-off. `data-unverified` shows an orange tag in the page until verified.

- Final fresh review (opus): 0 critical, 9 important — all fixed or ruled (see `docs/plans/progress.md` 'Final:' lines); 10 minors deferred and listed there.
- Preview: `.claude/launch.json` → "tfgbv-story" (python http.server on :8765).

### Session 3 — 19 Nov 2026 (illustration-led redesign of ch2, ch4, ch6, ch7, ch10)
- Mir: these five felt empty on wide screens; the story should play through the illustrations; text unchanged.
- Each is now a sticky illustrated scene with the verbatim text as cards (the ch1/ch5 pattern). ch2: checklist items are cards over her phone (IL-03), with the chat filling, a status-bar date and the grip tightening. ch4: the Satkhira call, then the statute book (IL-10), then the law's road lighting up. ch6: one vignette per beat (IL-06) above the chart. ch7: the silent room (IL-11): calendar, falling pages, dark phone, light under the door at the end; scroll ~220vh. ch10: crowd (IL-12) + dot field; her dot moved to the Oct 2021 position (index 963); last beat IL-13 "Of every 20 harassed online, ~17 stay silent" (scaled from ActionAid 85% / 14.9%; approved by Mir 19 Nov 2026).
- New draft copy (data-draft): IL-13 labels; "Each square is one day." legend in ch7.
- Two Opus critics reviewed it (storytelling; craft and layout); most of their fixes are applied. Not done: --vh for the Android URL bar; dots-fallback.png (no-JS) still shows her dot at the end; the red light under the door may read as menace (critic's flag; kept in line with the warrant red).
- QA 29/29.

### Session 3b — 19 Nov 2026 (v3: fresh designs by three Opus designers)
- Mir rejected the v2 pass ("stop redoing the old designs"). Brief: `docs/plans/v3-redesign-brief.md`. Section CSS now lives in its own files: `css/ch2-ch4.css`, `css/ch6.css`, `css/ch7-ch10.css`.
- ch2: a pair of scales; her tasks pile up on one pan, replies that weigh nothing on the other. ch4: title pinned; the Satkhira call (her hand holding the phone), then the law as handcuffs (s.10) + a ruler of 30+15+30 = 75 working days; the list of stops is cut (Mir).
- ch6: two roads to scale (the law's pale lane ends at a barrier at ~day 150; her dark road is drawn as she walks it); a comic panel per beat; it turns red after the limit; ends on the whole road, day 0–256. rail.js reads `data-day-now`.
- ch7: her front door at night, years struck off, feet shadows and knocks at the end; the day grid is cut (Mir). ch10: a crowd of women from behind, her phone red; it pulls back for 42,642; the nearest 20, 17 of them dark; the dots are cut (Mir).
- Android URL bar: `--vh` set from innerHeight in scroll.js (refreshed only when the width changes); CSS uses `var(--vh,1vh)`. ch5 map fills its panel.
- qa.py changes: test_unverified_legal ("police must record it" was cut with the list); test_dots rewritten for the crowd. 29/29.
- To review: the scales and handcuffs are the designers' symbols; feet shadows and knocks dramatise "came to her door"; the crowd is not to scale; new in-art labels are all taken from existing page text. Unused: il-13.svg, assets/dots-fallback.png, old .promise rules in story.css. Not tested on a real Android phone.

### Session 3c — 19 Nov 2026
- Mir's name is removed from the visible byline and footer (it stays in meta and JSON-LD); the date is removed from the hero. The hero type scales with the screen. Scroll pacing is tighter (page ~12% shorter).
- Footer in TGI house style: logo, tagline, social icons, copyright.
- SEO: full meta, OG and Twitter tags, plus a JSON-LD @graph (NewsArticle + Organization). Share image `site/assets/og-image.jpg` is the hero without text (regenerate with `python tools/og_image.py`). **Canonical/OG base URL is assumed: https://investigations.techglobalinstitute.com/tfgbv/ — confirm before launch.**
- Preview: `python tools/serve.py 8765` (no-cache). Repo: github.com/mir-17101088/tfgbv (survivor originals are gitignored).

## Open questions (need Mir / survivor / TGI)
1. ~~Naming~~ (interim decided — see session 1b). **Naming the survivor**: she is named in the doc (and spoke publicly at ActionAid/Prothom Alo and Naripokkho events). Real name, first name only, or pseudonym? Her written consent should cover the name too, not just photos.
2. **Naming the accused / officials**: accused not convicted (trial ongoing) — recommend not naming him or showing his account URL; recommend titles only for police (SI, ADC), no names. Phone number in the timeline must never be published. TGI legal sign-off?
3. **Screenshots**: contain explicit porn and a stolen celebrity profile photo. Plan: blur all media, grey out slurs (or show them behind a tap-to-reveal content warning), crop out account URL/name. OK?
4. **"Case filed under section 54"** (6 Dec 2021) — probably the case number, not a section. Need the FIR / charge sheet copy to state the charge correctly (which subsection of s.8).
5. **Timeline oddities** to confirm with her: 12 Dec 2021 call at 3:17 AM (PM?); 11 Feb 2022 call times out of order; whether every 22 Oct message included a video.
6. **Copies of the two warrants** (Mar 2026, Oct 2026) — to verify wording ("ধরে নিয়ে"/"গ্রেফতার") and court name.
7. Language: English only, or English + Bangla toggle? (v1: English with Bangla originals under key quotes.)
8. Unverified items still shown with tags: ch11 escalation advice (S04/S05/S13), PCSW hotline currency (2020 number), sources S09–S11, S13 unused in copy — prune before launch.
9. Canonical URL is a placeholder (`https://example.org/tfgbv/`) in `index.html` meta + JSON-LD.
10. Not done: real old-Android test; screen-reader pass; IL-06 (bakery) dropped.
8. Hosting/domain and launch date (next hearing is 7 Dec 2026 — natural news peg).

## Rules carried from Mir's global notes
Phones first, old Chrome ~87, test at 320px; no runtime CDN (self-host subset fonts/libs); WebP/AVIF; full SEO/OG/JSON-LD with Mir Rownak credited; Lighthouse paired runs; never deploy/push without asking; estimates marked "~".
