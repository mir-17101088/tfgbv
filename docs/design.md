# Design — TFGBV survivor story (Tech Global Institute)

*v1, 18 Nov 2026. **Approved by Mir 18 Nov 2026** for a first build that goes to heavy editorial review; copy, naming and design may change after that.*

## 1. Intent

One woman reported obscene messages and pornography sent to her on Facebook in October 2021. She did everything the system told her to do. Five years later she has been sent between four police offices, asked for five witnesses, signed her complaint twice, waited years in silence, been served two non-bailable warrants as the **complainant**, and still has no answer. The next hearing is 7 Dec 2026.

The piece must make readers **feel the length and the humiliation** of the process, not just read about it, and show the gap between **what Bangladeshi law promises** and **what happened**. Audience: general readers in Bangladesh and the international digital-rights community; policymakers and police are secondary readers.

**Success:** a reader finishes tired and angry on her behalf, can say in one sentence what went wrong, and shares it. Survivors get a short, practical "if this happens to you" panel.

## 2. Goals / non-goals / anti-goals

**Goals**
- A scroll story built around one signature visual: the law's short promised path against her real, five-year path, drawn to scale.
- Original illustrated scenes for the moments that hurt most, plus her own (redacted) screenshots as evidence.
- Every outside fact is sourced in `03-research/sources.csv` and marked VERIFIED before launch. Her words are used as she wrote them (translated), with the Bangla original available for key quotes.
- It works on old phones (Chrome ~87, 320px, slow networks), meets Lighthouse targets and has full SEO.

**Non-goals (v1)**
- Not a full Bangla edition. Bangla appears only as originals under key quotes; a full toggle can come later.
- Not a legal guide. The "if this happens to you" panel stays short and links out.
- No invented personas or composite characters. "She is one of many" is shown with real, cited counts only.

**Anti-goals: a failure even if it works**
- Anything that could identify her beyond what she consents to, or expose her parents' home.
- Shock for its own sake: showing explicit material, slurs in full by default, or drawing her as a victim figure.
- Making individual officers the villains. The story is about a system. Officials are named (per Mir) but drawn faceless, and the copy blames the process, not personalities.
- Any number not traceable to her timeline or a VERIFIED source.

## 3. Constraints

- **Brand (TGI):** Deep Teal #174D4F primary, Teal #246E72, Ocean #1C7D84, Mint/Aqua/Sage accents, Navy text. Montserrat display, Lato long-form body, Roboto UI. No emoji. Understated motion. AI imagery must never depict real or realistic people. TGI logo files only from `Tech Global Institute Design System/assets/logo/`.
- **Agreed creative stretches beyond the brand book:**
  - A dark "night" palette derived from Deep Teal (≈ #0A2223) for the phone and waiting scenes.
  - One alarm colour, TGI danger red #C0453B, used at most 4 times (warrants, deadline-passed marker).
  - A soft phone-glow radial in the hero (the brand says no gradients; this is the single exception).
  - Scroll-driven drawing animations, which are heavier than TGI's "understated" default but always disabled under reduced-motion.
- **Mir's build rules:**
  - Static HTML with all content present in the markup.
  - No runtime CDN: subset fonts and all JS are self-hosted.
  - WebP images with explicit width and height; media lazy-loaded.
  - Meta, OG and Twitter tags, JSON-LD, a 1200×630 share card, Mir Rownak credited and TGI as publisher.
  - Test at 320px. Compare Lighthouse in paired runs. Never deploy or push without asking.
- **Chrome 87 safe:** no CSS `aspect-ratio` (88+); no `:has`, container queries, `scroll-timeline` or View Transitions. Use IntersectionObserver plus rAF scroll maths, `clamp()` (79+) and flex `gap` (84+).
- **Safety:** the original screenshots never ship. Only redacted derivatives are published (see §7).

## 4. Approaches considered

| | Approach | Trade-off | Decision |
|---|---|---|---|
| A | **Illustrations hand-built as inline SVG in code**, animated by scroll | On-brand, tiny, animatable, can be done now. Craft ceiling is lower than a pro illustrator's. | **Chosen by Mir** |
| B | Commissioned illustrator, with coded interactives | Strongest drawings, but needs cost, lead time and a brief cycle | Rejected for v1. The scene briefs in §6 can be reused later. |
| C | AI-generated stylised scenes | Fast, but TGI bans realistic people, so it risks feeling off-brand and generic | Rejected |

Within A, the illustration style is ink-line drawing: strokes with a slight hand-drawn wobble pre-baked into the paths (not generated at runtime), flat teal/mint fills, paper texture done with a tiny SVG noise filter only on large panels. **She is never given a face**: we show her from behind, as a silhouette, or as hands and phone glow. Officials are uniforms, desks and hands holding phones.

## 5. Experience: chapter by chapter

A persistent **day counter rail** runs at the top on phones (left edge on desktop): "Day 1 → Day 1,873". It marks **Legal deadline (investigation)** at ~Day 150, about 20 Mar 2022. That is 75 working days after the case was filed (Sun–Thu, ignoring public holidays, so shown with "~"). When the reader scrolls past that point, the marker turns red and stays red for the rest of the story.

| # | Chapter | What the reader sees | Words (source) |
|---|---|---|---|
| 0 | **Hero** | Dark room, her back, a phone glowing. Notification badge ticks 1→2→3 on load. TGI logo top-left. Headline, dek, byline. | Narrator copy (draft by Claude, edited by Mir) |
| 1 | **10:41 PM** | A phone frame holds the redacted screenshots. Messages arrive as you scroll, with timestamps. After each one, "I don't respond." is repeated in smaller and smaller type. Content-warning gate before it starts. | Her timeline 21–22 Oct |
| 2 | **She does what she is told** | A checklist fills itself in: tell friends ✓, message PCSW ✓, send name, NID and father's name ✓, file a GD ✓, send screenshots ✓, send them again ✓. Each tick, then "No reply." | Her timeline + PCSW's quoted requirements |
| 3 | **"Just block him."** | Full-bleed illustrated moment: a phone screen with the friend's advice, then PCSW: "You can't just say whatever you like because you're upset." | Her quotes, Bangla original beneath |
| 4 | **The promise** | Calm teal diagram of the law's path: complaint → FIR → 30-working-day investigation (max 75) → charge sheet → trial. A short ruler. | Pornography Control Act 2012 s.5, s.10 (VERIFIED). CrPC s.154 (after verification) |
| 5 | **The runaround** (illustrated map) | Four buildings: Darus Salam thana, DMP, DB, back to the thana. A dotted path draws itself across 24 hours with time stamps. Speech bubbles: "Go to DMP." "Go to DB." "Go home. We'll call you." Then the waiting-chair motif: 30 min, 3 hours, 2 signatures. | Her timeline 29 Nov–5 Dec |
| 6 | **The path: signature visual** | A sticky SVG redraws Ch.4's straight path at real-day scale. Her line follows the law's line, overshoots the deadline marker, loops (witnesses: 4 demanded, then "2–3 more"), detours (meeting at a bakery), then reaches the charge sheet at Day 256. | Her timeline; durations computed |
| 7 | **The silence** | A tall section (~4–5 screens on phone). A sticky calendar flips through 1,346 days as you scroll, while a day-grid fills cell by cell. Nothing happens. A counter shows "Day 620… nothing." A "Skip the wait →" link is always visible. Reduced motion shows the finished grid. | Computed: 4 Jul 2022 → 11 Mar 2026 |
| 8 | **The warrant** | Her father's hands holding a paper with the red stamp, the only big red moment. Her words. Then the court during Eid: an empty corridor, one bench. Then October: "You are a woman. How would it look…" | Her timeline Mar & Oct 2026 |
| 9 | **25 October 2026** | A courtroom drawn as an empty space where he stands. "For the first time, I saw his face." No answer, no cross-examination. "Next date: 7 December." A live counter of days since the first message. | Her timeline |
| 10 | **One of many** | A dot field of PCSW complaints (one source, named), with her as a single highlighted dot. ActionAid: "85% of women surveyed stayed silent". Context on conviction odds only if a dated source is VERIFIED. | sources.csv S07–S12 |
| 11 | **If this happens to you** | GD vs case, escalation to SP or magistrate if police refuse, preserve evidence, PCSW contact. Four short points, linked. | S04, S05, S13 (after verification) |
| 12 | **Credits / footer** | Deep Teal footer, TGI logo, methodology and sources list (generated from the CSV), consent note, Mir Rownak credit. | — |

**Bangla originals:** each key quote (Ch.3, 5, 8, 9) shows the Bangla line under the English in smaller type. This needs a Bengali font subset (Noto Sans Bengali, glyphs from those lines only).

## 6. Illustration list (all inline SVG)

| ID | Scene | Motion |
|---|---|---|
| IL-01 | Hero: dark bedroom, her back on the bed edge, phone glow | Glow pulses once; badge counts up |
| IL-02 | Phone frame (container for screenshots) | Messages slide in |
| IL-03 | Hands typing to PCSW, form fields | Checklist ticks |
| IL-04 | Map of Darus Salam → DMP → DB → Darus Salam | Path draws (stroke-dashoffset) |
| IL-05 | Waiting chair, wall clock, stacked papers | Clock hands sweep per wait |
| IL-06 | Bakery first floor, a uniform across a table, three witnesses | Static, small fade |
| IL-07 | Father's hands, warrant with red stamp, door frame | Stamp lands (one motion) |
| IL-08 | Empty court corridor, Eid, one bench | Static |
| IL-09 | Courtroom with an empty silhouette where the accused stands | Slow reveal |

Two motifs recur throughout: the phone glow and the waiting chair.

## 7. Evidence handling (screenshots)

A Python (Pillow) script `tools/redact.py` produces `assets/evidence/*.webp` from `01-source/photos/` using a hand-written JSON of boxes per image:
- heavy blur plus a dark overlay on all pornographic media;
- the celebrity profile photo blurred;
- the account name and URL covered with a label "[account name removed]";
- slurs and explicit text greyed into bars, with an optional tap-to-reveal of the transliterated text behind a warning.

Screenshot 6 (desktop profile page) is used only as a cropped, blurred card showing "Lives in Lucerne, Switzerland" (an obviously fake profile). That is optional.

## 8. Tech

- **Files:**
  - `site/index.html`, plus `site/css/` (tokens copied from TGI, then story CSS) and `site/js/` (one ES-module entry, no framework, ~15 KB).
  - `site/assets/` holds fonts (woff2 subsets), evidence WebP and the share card.
  - `tools/` holds `redact.py`, `subset_fonts.py` and `build_sources.py` (CSV → sources list HTML).
- **Scroll engine:** IntersectionObserver for chapter enter/leave, plus one rAF-throttled scroll handler for progress inside sticky sections. SVG path drawing uses `stroke-dasharray`. Everything is driven by CSS custom properties set from JS.
- **Reduced motion / Save-Data:** static end states with no scroll-scrubbing, and the silence chapter collapsed.
- **Copy:** lives in the HTML so it renders without JS. Narrator copy is marked `data-draft` until Mir signs it off.
- **Identity tokens:** survivor name, accused naming and official names are single variables in one config, so the consent decision is one edit.
- **QA:**
  - Python Playwright (`channel="chrome"`) screenshots at 320, 375, 768 and 1280.
  - Overlap checks with `elementsFromPoint`.
  - Lighthouse in paired runs, with targets Perf ≥ 90 mobile, A11y 100, SEO 100.
  - Serve with `python -m http.server`.

## 9. Defaults I'm taking (Mir can overturn)

1. **(Mir, 18 Nov)** Survivor shown under a placeholder name, **"Nadia"**, behind the config variable. Swap after editorial review / consent.
2. **(Mir, 18 Nov)** **Accused named** as the Facebook account **"Sk Shahed"**, with "the accused" / "allegedly" phrasing because the trial is ongoing. **Officers named as in her account**: SI Amir Sohel (GD), SI Prosenjit (case), ADC Taimur. Caller's phone number shown **partly masked**: `+880 1748-1•••••`. All of this is behind config, pending heavy editorial/legal review.
3. Slurs hidden by default (tap to reveal); explicit media never shown, even blurred beyond recognisability.
4. Headline (draft): **"She Did Everything Right"**. Dek: "In 2021 a stranger flooded her inbox with pornography. She reported it the way the law says to. Five years, four police offices and two arrest warrants later — warrants for *her* — she is still waiting."
5. English, with Bangla originals under key quotes.
6. Launch target before **7 Dec 2026** hearing (if Mir/TGI want the peg).

## 10. Left to the builder

Exact SVG drawing, easing, breakpoint tuning, chapter heights, and final micro-copy within the voice rules (Mir edits all narrator copy).

## 11. Builder-check notes (my calls, marked for review)

- **Voice:** her words in first person (quoted, from the translation); the narrator in third person, in plain TGI voice. No institutional "we" inside the story, only in the footer.
- **Ch.10 dot field:** drawn on `<canvas>` with 1 dot = 10 complaints, so old phones don't render 40k DOM nodes. Her dot is drawn separately in red outline. Static PNG fallback without JS.
- **Ch.6 shape:** x = calendar days (linear), y = "stage reached". Her line goes flat when nothing happens, which makes the stalls visible. The silence (Ch.7) is the same flat line continued, so Ch.6 hands over to Ch.7.
- **Hosting / canonical URL:** placeholder `https://example.org/tfgbv/` until Mir/TGI give the domain. Blocks launch, not the build.
- **Share card:** IL-01 hero illustration with the headline, rendered to 1200×630 PNG via Playwright.
