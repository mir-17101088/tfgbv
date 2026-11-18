# v3 redesign brief: shared by the three designers (19 Nov 2026)

## The story
`site/` is a static scroll story for **Tech Global Institute** (not Daily Star). One Bangladeshi woman ("Nadia", a pseudonym) reported online sexual harassment in Oct 2021, did everything the system told her to do, and five years later has been sent between police offices, waited years in silence, and been served two warrants as the *complainant*. Read `HANDOVER.md` and skim `docs/design.md` §1–4 first.

## What Mir (the owner) said about the current build, in his words
Screenshots of his complaints: `C:\Users\Asus\AppData\Local\Temp\claude\caa024cc500608f5\d0fb3b63-5701-4e81-8f55-5183d4ced38e\images\1.png` … `8.png` (1 = ch2, 2–3 = ch4, 4 = ch5, 5 = ch6, 6–7 = ch7, 8 = ch10). Look at them.
- ch2: "the graphics is way too small and there's alignment issue in the text box and the page looks nearly empty — which looks really bad."
- ch4: "there's overlap" (the call illustration overlaps the pinned title) and the stacked list of law stops "looks unnecessary so cut it. Just pin the title and the graphics and run the scrolly."
- ch6: "the graphics is waayyyy too small, specially the timeline bar. Redesign the timeline bar to make it stand out and not feel boring at all — this current timeline graphic looks so average."
- ch7: "so much overlap and also so much empty space and the whole thing doesn't make sense at all"; the day-square grid "is soo unnecessary".
- ch10: "the lower portion [the crowd of women seen from behind] is such a nice design but the upper dots are soo stupid and just feel dumb — remove the dots and focus on the lower portion where people can be seen."
- Overall: "stop redoing the old designs again and again and come up with some fresh designs." The sections he loves and that set the bar: ch1 (sticky phone with her real redacted screenshots, cards scrolling over), ch5 (map IL-04, the route draws, speech bubbles appear per beat), ch8/ch9 (big full-width illustrations IL-07, IL-08, IL-09).

**So: do not iterate on what's there. Throw out the current design of your sections and come up with a genuinely fresh, bold concept**, then build it. Big, edge-to-edge, gut-punching, compact (no long dead scroll, no half-empty viewport at 1440 or 1920), story told *through* the illustration, readers can see what she went through.

## Hard rules
1. **Copy is verbatim.** Every word of the existing prose, card, quote and caption text in your sections stays, in order. You may move text into cards or into the illustration's layout, but not reword, cut or add facts. The **only** thing you may cut is what Mir explicitly said to cut (ch4 stacked list of stops; ch7 day grid; ch10 dots). Keep any `data-unverified` / `data-cfg` / `data-draft` attributes on text you keep. Any new label you write inside an illustration must be traceable to text already on the page, and must be marked in your final report.
2. **Never invent facts.** No new dates, numbers, people, places or events. She never gets a face (from behind, hands, silhouette). Officials are faceless. No explicit material.
3. **Brand:** TGI palette in `site/css/tokens.css` (deep teal, teal, ocean, mint, aqua, sage, navy), Montserrat 800 display, Lato body. Night palette `--night`. One alarm red `#C0453B`, used as a scalpel. Illustration language = the existing ink-line + flat fills (see IL-04, IL-07, IL-08, IL-09 in `site/svg/`), but you may push it further (bigger scale, bolder compositions, perspective, more drama).
4. **Phones first:** old Android Chrome ~87 at 320–375px wide, slow networks, no runtime CDN, no new libraries. Chrome-87-safe CSS/JS only (no `aspect-ratio`, `:has`, container queries, `inset`, scroll-timeline, View Transitions). Use `var(--vh,1vh)` instead of `vh` for anything sized to the screen height (it fixes the Android URL bar cropping). Respect reduced motion (`html.reduced`) and no-JS (`html:not(.js)`): both must show a sensible static final state.
5. **Wide screens are reviewed by the desk at 1280–1920**: no big empty halves, nothing tiny.

## Mechanics you can use
- Scroll engine `site/js/scroll.js`: `scene(name, cb(p, el))` gives progress 0..1 for a `[data-scene]` block; `activeCard(el)` gives the index of the card in view; `onEnter`. Scene markup pattern: `.scene > .scene__sticky` (sticky panel) + `.scene__steps > .step` (cards that scroll over it). Desktop ≥900px puts the sticky on the right 58% and cards on the left 42% (see `.scene` rules in `site/css/story.css`); you may override this for your scenes (e.g. full-bleed art with cards over it, or cards inside the art).
- Illustrations: write SVG in `site/svg/<name>.svg` and put `<!-- @svg name --><!-- /svg name -->` in index.html, then run `python tools/inline_svg.py` (it fills every marker; it is safe to run while others work, as it only replaces between markers, but re-read index.html before you Edit it afterwards). SVG vocabulary classes (`.s`, `.s-th`, `.f-teal`, `.t`, …) are at the end of `site/css/story.css`.
- Look at your work: `python tools/shots.py 1440 "#ch2@0.3" "#ch2@0.8"` writes `qa-out/1440-ch2-0.3.png` etc. (starts its own server). Check 1440, 375 and 320, several scroll fractions each, plus `--reduced`. Use contact sheets (PIL) to keep image count down. Prefix your own temp files with your section ids.
- Checks: `python tools/qa.py` (29 checks; some reference old selectors: `.check.is-done` count 8 for checklist, `window.__silenceDrawn`, `.silence__date`, `window.__dots`, `IL_IDS`). If your redesign legitimately removes something a check tests, **update that one check in tools/qa.py** to test the new design's equivalent (re-read the file right before editing; others may edit other checks), and say so in your report. Every other check must still pass.

## File ownership (three designers work at the same time)
- **Designer A — ch2 + ch4:** owns `site/css/ch2-ch4.css`, `site/js/chapters.js` (only `initChecklist`; leave `initMessages`), the promise scene in `site/js/illus.js` (leave the other code), `site/svg/il-03.svg`, `site/svg/il-10.svg`, and any new `site/svg/il-2*.svg` you create.
- **Designer B — ch6:** owns `site/css/ch6.css`, `site/js/path.js`, `site/svg/il-06.svg`, and new `site/svg/il-6*.svg`.
- **Designer C — ch7 + ch10:** owns `site/css/ch7-ch10.css`, `site/js/silence.js`, `site/js/dots.js`, `site/svg/il-11.svg`, `il-12.svg`, `il-13.svg`, and new `site/svg/il-7*.svg`.
- **index.html:** edit **only inside your own `<section id="chN">…</section>`** blocks, and always re-read the region right before each Edit (other designers are editing other sections of the same file). Don't touch `story.css`, `tokens.css`, `scroll.js`, `main.js` except: if you truly need a shared change, put the override in your own CSS file instead. You may add a new JS module and import it from `main.js` (add one line, re-read first).
- Don't commit, push or deploy. Don't delete the other designers' files.

## Deliverable
Build it fully (not a mockup), verify with screenshots at 1440/375/320 + reduced, run `tools/qa.py`. Final report (≤300 words): the concept in two sentences, what changed per section, any new label text you wrote, any qa.py check you changed, and anything you're unsure of.
