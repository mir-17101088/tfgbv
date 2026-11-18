"""Render site/assets/share.png (1200x630) from IL-01 + headline via Playwright."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
svg = (SITE / "svg" / "il-01.svg").read_text(encoding="utf-8")
css = (SITE / "css" / "tokens.css").read_text(encoding="utf-8").replace("../assets/", (SITE / "assets").as_uri() + "/")
story = (SITE / "css" / "story.css").read_text(encoding="utf-8")
html = f"""<!doctype html><html><head><style>{css}{story}
body{{margin:0;width:1200px;height:630px;overflow:hidden;background:#0A2223}}
.card{{position:relative;width:1200px;height:630px}}
.card .il{{position:absolute;inset:0}} .card .il svg{{width:1200px;height:630px}}
.card::after{{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#0A2223 0,rgba(10,34,35,.92) 38%,rgba(10,34,35,0) 70%)}}
.txt{{position:absolute;left:64px;bottom:72px;z-index:2;width:600px}}
h1{{font:800 84px/1.02 var(--font-display);color:#fff;letter-spacing:-.02em;margin:0 0 20px}}
p{{font:700 22px/1.3 var(--font-body);color:#8DD8C2;margin:0}}
img{{position:absolute;left:64px;top:52px;width:170px;z-index:2}}
</style></head><body><div class="card"><div class="il">{svg}</div>
<img src="{(SITE/'assets/logo/tgi-logo-white.png').as_uri()}">
<div class="txt"><h1>She Did Everything Right</h1><p>Five years, four police offices, two warrants &mdash; for her.</p></div></div></body></html>"""
tmp = ROOT / "qa-out" / "share.html"
tmp.parent.mkdir(exist_ok=True)
tmp.write_text(html, encoding="utf-8")
with sync_playwright() as pw:
    b = pw.chromium.launch(channel="chrome")
    pg = b.new_page(viewport={"width": 1200, "height": 630})
    pg.goto(tmp.as_uri()); pg.wait_for_timeout(500)
    pg.evaluate("document.querySelector('.badge__n').textContent='3'")
    pg.screenshot(path=str(SITE / "assets" / "share.png"))
    b.close()
# favicon from TGI icon
ico = Image.open(ROOT.parent / "Tech Global Institute Design System" / "assets" / "logo" / "tgi-icon.png").convert("RGBA")
ico.thumbnail((64, 64)); canvas = Image.new("RGBA", (64, 64), (0, 0, 0, 0)); canvas.paste(ico, ((64 - ico.width) // 2, (64 - ico.height) // 2))
canvas.save(SITE / "assets" / "logo" / "favicon.png", optimize=True)
print("share.png + favicon written")
