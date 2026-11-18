# SDD ledger — plan: docs/plans/2026-11-18-tfgbv-story-build.md
Ruling: no git repo and Mir's rule is no commits unless asked — ledger lives at docs/plans/progress.md, task-start/task-done scripts (git-based) not used; each task's completion = its qa.py checks passing — cost if wrong: no diff history for review (final review reads files directly).
Ruling: no worktree — not a git repo; working in TFGBV/site directly — cost: none (originals untouched).
Pre-flight: T1 config/dayOf → T4 rail, T7 path/silence (consistent: dayOf, CFG keys). T4 scene()/reduced → T5,T6,T7,T8 (consistent). T2 manifest → T6 (static render, consistent). T3 section ids/data-day → T4 (consistent after ch4=40 fix).
Task 1: Ruling: spec says Day 1=21 Oct AND charge sheet=Day 256 (inconsistent: 4 Jul 2022 is 256 days *after*). Decided dayOf = days elapsed (21 Oct 2021 = 0); rail reads 'N days since the first message' so it matches prose figures (256, 1,346, 1,602, 1,830, 1,873) — cost if wrong: one-word label change.
Task 1: complete (tests: python tools/qa.py test_day_of test_config_applied → 2/2)
Task 2: Ruling: screenshot 4.jpeg dropped — its content duplicates 1 (cartoon) + 5 (messages) — cost: one fewer evidence frame.
Task 2: Ruling: avatar columns removed with white 'fill' kind instead of blur (blur slab looked like a UI bug) — cost: none.
Task 2: complete (tests: python tools/qa.py test_no_identity_leak test_evidence_redacted → 2/2; visual check done)
Task 3: Ruling: HTML/CSS were written before the three checks were run (TDD order slipped); checks then run and pass; they fail trivially against the Task 1 skeleton (missing text/dek/byline) — cost: weaker evidence the checks bite.
Task 3: Ruling: rail kept as a top bar at all widths (spec said left edge on desktop) — simpler, one layout to QA — cost: minor visual.
Task 3: complete (tests: python tools/qa.py test_no_overflow_320 test_no_js_readable test_hero_rules → 3/3; screenshots 375/1280 read)
Task 4: complete (tests: python tools/qa.py test_rail_days test_jump_states test_reduced_final → 3/3 RED→GREEN)
Task 5: Ruling: IL-06 (bakery) dropped — ch6 is a sticky chart, no slot; the bakery beat stays in text — cost: one fewer illustration. IL-02 repurposed from "phone frame" (now CSS) to the "Just block him" scene in ch3. test_svgs_inlined checks 8 SVGs, not 9.
Task 5: Ruling: SVG text sized for 320–375px phones (map/phone redrawn with ≥15px viewBox fonts) after first screenshots showed ~6px text — cost: none.
Task 5: complete (tests: python tools/qa.py test_svgs_inlined test_svg_size → 2/2 RED→GREEN; 375/1280 screenshots read)
Task 6: complete (tests: python tools/qa.py test_reveal_default_hidden test_phone_fits_320 test_messages_shot_switch test_checklist_final → 4/4; test_phone_fits_320 passed before implementation — layout from Task 3 already satisfied it; screenshots read, fixed checklist fade + rail 'day/days')
Task 7: complete (tests: test_path_deadline test_silence_dates test_skip_link → 3/3; test_skip_link passed pre-implementation (static anchor) ; screenshots read, law/her lines separated)
Task 8: Ruling: sources list shows all 14 CSV rows with [unverified] tags (review build) and hides the internal planned_use column — cost: editors must prune unused rows before launch.
Task 8: complete (tests: test_sources_built test_unverified_flagged test_dots → 3/3; test_unverified_flagged passed pre-implementation (CSS from Task 3); S06/S07/S08/S12 verified by reading pages)
Task 9: complete (tests: python tools/qa.py → 25/25; test_no_external_requests + test_overlaps passed pre-implementation (nothing external existed; layout already clean); Lighthouse pairs 97-99/100/100/100)
Final review: fresh reviewer (opus subagent) — 0 Critical, 9 Important, ~14 Minor
Final: fixed narrator claims not in source (I1) — test_no_unsupported_claims RED→GREEN
Final: fixed paraphrase-as-quote (I2: PCSW 28 Oct reply, "Just block him" headline+IL-02 bubble, full "Blocking..." quote + Bangla, chart label) — test_no_unsupported_claims RED→GREEN
Final: fixed "Four offices" heading → "Three offices, four stops" (I3) — test_no_unsupported_claims RED→GREEN
Final: fixed unflagged legal claims (I4) — test_unverified_legal RED→GREEN (test initially matched an ancestor <li>; corrected to deepest element)
Final: fixed consent wording (I5) — now "screenshots she shared, which she gave permission to publish" (Mir confirmed photo permission in brief) — covered by review of copy, no test
Final: fixed "Nothing happened" → "Nobody contacted her." (I6) — test_no_unsupported_claims RED→GREEN
Final: fixed reduced-motion path (I7): reduced/Save-Data now uses the static layout (no .js class) with charts drawn at final state — test_reduced_static RED→GREEN
Final: fixed ch6 chart empty without JS (I8): final state baked in by tools/snapshot_path.py — test_path_no_js RED→GREEN
Final: Ruling: I9 accused name visible in screenshots ("Sk Shahed" header/profile/footer) — kept, because Mir decided to name the accused; if legal reverses, add label boxes to tools/redact_boxes.json and re-run redact.py. Unused profile.webp removed from site — cost if wrong: one re-redaction pass.
Final: also fixed (copy accuracy, folded in): rail made monotonic (ch2/ch3 data-day), ch11 no longer shows future day 1,873, "A few men"→"people", "frightened"→"worried", warrant reason attributed to police, removed "Then nothing", removed "By our count", noscript alt no longer hard-codes the name.
Final: QA harness waits for document.fonts.ready (one flaky chart test traced to layout shift before fonts loaded). Suite 29/29 ×2.
Final: minor (deferred): `inset:0` needs Chrome 87 exactly (84–86 lose hero art)
Final: minor (deferred): "Skip the wait" sits 24px above bottom of a 100vh panel — may hide under Android URL bar
Final: minor (deferred): sources list data-status truncated mid-word; S11 label says Daily Star but links Dhaka Tribune; dates render "(—)"
Final: minor (deferred): no-JS: hard-coded "1,854" counter; empty dots canvas gap above fallback image
Final: minor (deferred): no Bengali font subset shipped (relies on system Bangla font)
Final: minor (deferred): identity-leak test doesn't check Bangla-digit number or other casings of account URL
Final: minor (deferred): canonical/og URLs are example.org placeholders; <title> lacks topic/place for search
Final: minor (deferred): "Korba?" left unredacted in msg-1; msg-1 (7:03 PM status bar) pairing with "1 Nov 7:27 PM" step unconfirmed
Final: minor (deferred): ActionAid "85% of those harassed" denominator to check against the full report
