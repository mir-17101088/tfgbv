"""QA checks for the TFGBV story. Usage: python tools/qa.py [check_name ...]
Serves site/ on :8765 and drives Chrome via Playwright."""
import contextlib, functools, http.server, json, os, re, socketserver, sys, threading, traceback
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
OUT = ROOT / "qa-out"
PORT = 8765
URL = f"http://localhost:{PORT}/"
CHECKS = {}


def check(fn):
    CHECKS[fn.__name__] = fn
    return fn


class _Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(SITE), **k)

    def log_message(self, *a):
        pass


@contextlib.contextmanager
def serve(port=PORT):
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", port), _Quiet)
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    try:
        yield srv
    finally:
        srv.shutdown()
        srv.server_close()


_pw = None
_browser = None


def _get_browser():
    global _pw, _browser
    if _browser is None:
        from playwright.sync_api import sync_playwright
        _pw = sync_playwright().start()
        _browser = _pw.chromium.launch(channel="chrome")
    return _browser


@contextlib.contextmanager
def page(width=375, reduced=False, js=True, height=800):
    ctx = _get_browser().new_context(
        viewport={"width": width, "height": height},
        reduced_motion="reduce" if reduced else "no-preference",
        java_script_enabled=js,
    )
    p = ctx.new_page()
    errors = []
    p.on("pageerror", lambda e: errors.append(str(e)))
    p.goto(URL, wait_until="load")
    if js:
        p.evaluate("document.fonts.ready.then(() => 1)")
    p.wait_for_timeout(150)
    p.errors = errors
    try:
        yield p
    finally:
        ctx.close()


def shot(p, name, full=False):
    OUT.mkdir(exist_ok=True)
    p.screenshot(path=str(OUT / f"{name}.png"), full_page=full)


def scroll_to(p, selector, frac=0.0):
    """Scroll so that `frac` (0..1) of the element's scrollable range has passed."""
    p.evaluate(
        """([s,f]) => { const el=document.querySelector(s); const r=el.getBoundingClientRect();
        const top=r.top+scrollY; const range=Math.max(1, el.offsetHeight-innerHeight);
        scrollTo({top: top + range*f, behavior: "instant"}); }""",
        [selector, frac],
    )
    p.wait_for_timeout(250)


# ---------------- Task 1 ----------------
@check
def test_day_of():
    with page() as p:
        r = p.evaluate("""async () => { const m = await import('./js/config.js');
            return [m.dayOf('2021-10-21'), m.dayOf('2022-07-04'), m.dayOf('2026-03-11'), m.dayOf('2026-10-25'), m.dayOf('2026-12-07')]; }""")
        assert r == [0, 256, 1602, 1830, 1873], r


@check
def test_config_applied():
    with page() as p:
        texts = p.eval_on_selector_all('[data-cfg="survivor"]', "els => els.map(e => e.textContent)")
        assert texts, "no survivor spans"
        assert all(t == "Nadia" for t in texts), texts
        assert not p.errors, p.errors


# ---------------- Task 2 ----------------
LEAKS = ["Trishia", "trishia", "TRISHIA", "Nashtaran", "8801748166020", "1748166020", "1748-166020", "kumkum.mahi"]


@check
def test_no_identity_leak():
    bad = []
    for f in SITE.rglob("*"):
        if f.is_dir():
            continue
        if f.suffix.lower() in (".jpeg", ".jpg"):
            bad.append(f"original-format image: {f}")
        if f.suffix.lower() in (".html", ".css", ".js", ".json", ".svg", ".txt", ".xml"):
            t = f.read_text(encoding="utf-8", errors="ignore")
            bad += [f"{f.name}: {w}" for w in LEAKS if w in t]
    assert not bad, bad


@check
def test_evidence_redacted():
    from PIL import Image, ImageStat
    spec = json.loads((ROOT / "tools" / "redact_boxes.json").read_text(encoding="utf-8"))
    for name, cfg in spec.items():
        if name.startswith("_"):
            continue
        out = SITE / "assets" / "evidence" / f"{name}.webp"
        assert out.exists(), out
        im = Image.open(out).convert("L")
        cx, cy = (cfg.get("crop") or [0, 0])[:2]
        cw = (cfg["crop"][2] - cx) if cfg.get("crop") else Image.open(ROOT / "01-source" / "photos" / cfg["src"]).width
        k = im.width / cw
        for b in cfg["boxes"]:
            if b["kind"] not in ("blur", "bar"):
                continue
            x0, y0, x1, y1 = [(v - o) * k for v, o in zip(b["box"], (cx, cy, cx, cy))]
            if x1 <= 0 or y1 <= 0 or x0 >= im.width or y0 >= im.height:
                continue  # cropped away
            r = (max(0, x0) + 6, max(0, y0) + 6, min(im.width, x1) - 6, min(im.height, y1) - 6)
            sd = ImageStat.Stat(im.crop(tuple(map(int, r)))).stddev[0]
            assert sd < 18, f"{name} {b['box']} stddev {sd:.1f}"


# ---------------- Task 3 ----------------
@check
def test_no_overflow_320():
    with page(320) as p:
        p.evaluate("scrollTo(0, document.body.scrollHeight)"); p.wait_for_timeout(200)
        w = p.evaluate("document.documentElement.scrollWidth")
        assert w <= 320, f"scrollWidth {w}"
        wide = p.evaluate("""[...document.querySelectorAll('body *')].filter(e=>{if(e.closest('svg')&&e.tagName!=='svg')return false;const r=e.getBoundingClientRect();return r.right>321 && getComputedStyle(e).position!=='fixed'}).slice(0,5).map(e=>e.tagName+'.'+e.className)""")
        assert not wide, wide


@check
def test_no_js_readable():
    with page(375, js=False) as p:
        body = p.inner_text("body")
        for t in ["I don’t respond", "1,346", "non-bailable", "7 December", "Nadia", "Sk Shahed"]:
            assert t in body, f"missing text: {t}"
        alts = p.eval_on_selector_all("img", "els => els.filter(e => !e.alt).map(e => e.src)")
        assert not alts, alts


@check
def test_hero_rules():
    with page() as p:
        assert p.locator("#ch0 h1").count() == 1
        assert p.locator("#ch0 .dek").count() == 1
        assert p.locator("#ch0 .byline").count() == 1
        assert p.locator("#ch0 img.hero__logo").count() == 1
        assert p.locator("h1").count() == 1
        assert not p.errors, p.errors


# ---------------- Task 4 ----------------
def rail_n(p):
    return int(p.inner_text(".rail__n").replace(",", ""))


@check
def test_rail_days():
    with page() as p:
        scroll_to(p, "#ch9"); p.wait_for_timeout(300)
        n = rail_n(p)
        assert abs(n - 1830) <= 5, n
        assert "is-passed" in p.get_attribute(".rail__mark", "class")
        scroll_to(p, "#ch2"); p.wait_for_timeout(300)
        assert rail_n(p) < 40, rail_n(p)
        assert "is-passed" not in p.get_attribute(".rail__mark", "class")


@check
def test_jump_states():
    with page() as p:
        p.evaluate("scrollTo({top: document.body.scrollHeight, behavior: 'instant'})"); p.wait_for_timeout(200)
        scroll_to(p, '[data-scene="path"]', 0.5); p.wait_for_timeout(300)
        v = float(p.evaluate("""getComputedStyle(document.querySelector('[data-scene="path"]')).getPropertyValue('--p')"""))
        assert 0.4 < v < 0.6, v
        scroll_to(p, '[data-scene="checklist"]', 1.0); p.wait_for_timeout(300)
        v = float(p.evaluate("""getComputedStyle(document.querySelector('[data-scene="checklist"]')).getPropertyValue('--p')"""))
        assert v > 0.95, v


@check
def test_reduced_final():
    with page(reduced=True) as p:
        n = p.evaluate("document.querySelectorAll('.scene').length")
        f = p.evaluate("document.querySelectorAll('.scene.is-final').length")
        assert n > 0 and n == f, (n, f)


# ---------------- Task 5 ----------------
IL_IDS = ["IL-01", "IL-02", "IL-03", "IL-04", "IL-05", "IL-07", "IL-08", "IL-09"]


@check
def test_svgs_inlined():
    with page() as p:
        for i in IL_IDS:
            t = p.evaluate(f"(() => {{ const s = document.querySelector('#{i} svg[role=img]'); return s && s.querySelector('title') ? s.querySelector('title').textContent : '' }})()")
            assert t.strip(), f"{i} missing svg/title"


@check
def test_svg_size():
    import re as _re
    html = (SITE / "index.html").read_text(encoding="utf-8")
    total = sum(len(m.encode("utf-8")) for m in _re.findall(r"<svg.*?</svg>", html, flags=_re.S))
    assert total <= 120_000, total


# ---------------- Task 6 ----------------
@check
def test_reveal_default_hidden():
    with page() as p:
        assert p.evaluate("document.getElementById('r1').hidden") is True
        btn = p.locator(".reveal").first
        btn.focus(); p.keyboard.press("Enter"); p.wait_for_timeout(100)
        assert p.evaluate("document.getElementById('r1').hidden") is False
        assert btn.get_attribute("aria-expanded") == "true"
        alts = " ".join(p.eval_on_selector_all("img", "els => els.map(e => e.alt)"))
        for w in ["vuda", "fuck", "gondho"]:
            assert w not in alts, w


@check
def test_phone_fits_320():
    with page(320) as p:
        scroll_to(p, '[data-scene="messages"]', 0.5)
        r = p.evaluate("(() => { const b = document.querySelector('.phone').getBoundingClientRect(); return [b.left, b.right, b.top, b.bottom, innerHeight]; })()")
        assert r[0] >= 0 and r[1] <= 320, r
        assert r[2] >= 30 and r[3] <= r[4], r


@check
def test_messages_shot_switch():
    with page() as p:
        scroll_to(p, '[data-scene="messages"]', 0.0)
        a = p.evaluate("document.querySelector('.phone__img.is-on').dataset.shot")
        scroll_to(p, '[data-scene="messages"]', 1.0)
        b = p.evaluate("document.querySelector('.phone__img.is-on').dataset.shot")
        assert a == "0" and b == "3", (a, b)


@check
def test_checklist_final():
    with page() as p:
        scroll_to(p, '[data-scene="checklist"]', 0.02)
        n0 = p.evaluate("document.querySelectorAll('.check.is-done').length")
        scroll_to(p, '[data-scene="checklist"]', 1.0)
        n1 = p.evaluate("document.querySelectorAll('.check.is-done').length")
        assert n0 <= 1 and n1 == 8, (n0, n1)


# ---------------- Task 7 ----------------
@check
def test_path_deadline():
    with page() as p:
        scroll_to(p, '[data-scene="path"]', 0.1); p.wait_for_timeout(200)
        assert "is-passed" not in (p.get_attribute(".pathviz__deadline", "class") or "")
        scroll_to(p, '[data-scene="path"]', 1.0); p.wait_for_timeout(200)
        assert "is-passed" in p.get_attribute(".pathviz__deadline", "class")
        assert p.text_content(".pathviz__now").strip() == "Charge sheet"


@check
def test_silence_dates():
    with page() as p:
        scroll_to(p, '[data-scene="silence"]', 0.0); p.wait_for_timeout(200)
        assert p.inner_text(".silence__date").strip() == "4 July 2022"
        scroll_to(p, '[data-scene="silence"]', 1.0); p.wait_for_timeout(300)
        assert p.inner_text(".silence__date").strip() == "11 March 2026"
        assert p.evaluate("window.__silenceDrawn") == 1346
        assert "is-end" in p.get_attribute(".silence", "class")


@check
def test_skip_link():
    with page() as p:
        scroll_to(p, '[data-scene="silence"]', 0.2)
        p.click(".skip-wait"); p.wait_for_timeout(1500)
        top = p.evaluate("document.getElementById('ch8').getBoundingClientRect().top")
        assert abs(top) < 60, top


# ---------------- Task 8 ----------------
@check
def test_sources_built():
    import csv as _csv
    n = len(list(_csv.DictReader(open(ROOT / "03-research" / "sources.csv", encoding="utf-8"))))
    with page() as p:
        assert p.locator("#sources li").count() == n, (p.locator("#sources li").count(), n)


@check
def test_unverified_flagged():
    with page() as p:
        bad = p.evaluate("""[...document.querySelectorAll('[data-unverified]')].filter(e => !getComputedStyle(e, '::after').content.includes('unverified')).length""")
        assert bad == 0, bad
        tags = p.evaluate("[...document.querySelectorAll('#sources li')].filter(li => !/VERIFIED/.test(li.dataset.status)).every(li => li.textContent.includes('[unverified]'))")
        assert tags, "unverified sources not tagged"


@check
def test_dots():
    # v3: ch10 is a crowd of women (IL-12), no dot field. Card 0 = close on her, card 2 = the nearest twenty.
    with page() as p:
        scroll_to(p, '[data-scene="dots"]', 0.0); p.wait_for_timeout(300)
        assert p.evaluate("window.__crowd") == 0, p.evaluate("window.__crowd")
        scroll_to(p, '[data-scene="dots"]', 1.0); p.wait_for_timeout(900)
        assert p.evaluate("window.__crowd") == 2, p.evaluate("window.__crowd")
        assert "at-2" in p.get_attribute(".crowd", "class")
        assert p.locator("#IL-12 .tw").count() == 20
        assert p.locator("#IL-12 .tw-c").count() == 3
        assert p.locator("#IL-12 .her").count() == 1
        assert float(p.evaluate("getComputedStyle(document.querySelector('.crowd__label')).opacity")) > 0.9
    with page(375, js=False) as p:  # no-JS shows the final state
        assert "at-2" in p.get_attribute(".crowd", "class")


# ---------------- Task 9 ----------------
@check
def test_meta():
    from PIL import Image
    with page() as p:
        g = lambda sel, a="content": p.get_attribute(sel, a)
        assert g('meta[property="og:title"]')
        img = g('meta[property="og:image"]')
        assert img and img.endswith("share.png"), img
        assert Image.open(SITE / "assets" / "share.png").size == (1200, 630)
        assert g('meta[name="twitter:card"]') == "summary_large_image"
        assert g('link[rel="canonical"]', "href")
        assert g('meta[name="description"]')
        ld = json.loads(p.text_content('script[type="application/ld+json"]'))
        assert ld["@type"] == "NewsArticle"
        assert ld["author"]["name"] == "Mir Rownak", ld["author"]
        assert ld["publisher"]["name"] == "Tech Global Institute"


@check
def test_no_external_requests():
    from playwright.sync_api import sync_playwright  # noqa
    ctx = _get_browser().new_context(viewport={"width": 375, "height": 800})
    p = ctx.new_page()
    urls = []
    p.on("request", lambda r: urls.append(r.url))
    p.goto(URL, wait_until="load")
    p.evaluate("scrollTo({top: document.body.scrollHeight, behavior: 'instant'})"); p.wait_for_timeout(800)
    ctx.close()
    ext = [u for u in urls if not u.startswith(f"http://localhost:{PORT}") and not u.startswith("data:")]
    assert not ext, ext


@check
def test_overlaps():
    for w in (320, 375):
        with page(w) as p:
            ids = p.evaluate("[...document.querySelectorAll('.step')].filter(s=>s.children.length).map((s,i)=>i)")
            for i in ids:
                p.evaluate(f"(() => {{ const s=[...document.querySelectorAll('.step')].filter(s=>s.children.length)[{i}]; const r=s.getBoundingClientRect(); scrollTo({{top: scrollY + r.top + r.height/2 - innerHeight/2, behavior:'instant'}}); }})()")
                p.wait_for_timeout(120)
                ok = p.evaluate(f"""(() => {{ const s=[...document.querySelectorAll('.step')].filter(s=>s.children.length)[{i}];
                    const r=s.getBoundingClientRect(); const e=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2);
                    return s.contains(e); }})()""")
                assert ok, f"step {i} covered at {w}px"


# ---------------- Final review fixes ----------------
BANNED = ["never heard of him", "Nobody told her that", "an education", "police officers in the room", "young woman",
          "Four offices", "Nothing happened", "Then nothing", "By our count", "A few men", "frightened",
          "“You will be informed", "“Just block him"]


@check
def test_no_unsupported_claims():
    html = (SITE / "index.html").read_text(encoding="utf-8")
    js = (SITE / "js" / "path.js").read_text(encoding="utf-8")
    hits = [b for b in BANNED if b in html]
    assert not hits, hits
    assert '"Settled' not in js


@check
def test_unverified_legal():
    with page() as p:
        # v3: ch4's stacked list of law stops (which held 'police must record it') was cut on Mir's instruction
        assert p.evaluate("!document.body.textContent.includes('police must record it')")
        r = p.evaluate("""['record a case (FIR)'].map(t => {
            const el = [...document.querySelectorAll('small, li, p')].filter(e => e.textContent.includes(t)).pop();
            return !!(el && el.closest('[data-unverified]')); })""")
        assert all(r), r


@check
def test_reduced_static():
    with page(375, reduced=True) as p:
        h = p.evaluate("document.querySelector('[data-scene=\"silence\"]').offsetHeight / innerHeight")
        assert h < 2, h
        vis = p.evaluate("[...document.querySelectorAll('.phone__img')].filter(i => getComputedStyle(i).opacity === '1' && getComputedStyle(i).display !== 'none').length")
        assert vis == 4, vis


@check
def test_path_no_js():
    with page(375, js=False) as p:
        n = p.evaluate("document.querySelector('.pathviz__svg').children.length")
        assert n > 10, n


def run(names):
    names = names or list(CHECKS)
    failed = 0
    with serve():
        for n in names:
            try:
                CHECKS[n]()
                print(f"PASS {n}")
            except Exception as e:
                failed += 1
                print(f"FAIL {n}: {type(e).__name__}: {e}")
                if os.environ.get("QA_TRACE"):
                    traceback.print_exc()
    if _pw:
        _browser.close()
        _pw.stop()
    print(f"{len(names)-failed}/{len(names)} passed")
    return failed


if __name__ == "__main__":
    sys.exit(1 if run(sys.argv[1:]) else 0)
