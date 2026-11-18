"""Write the sources list from 03-research/sources.csv into site/index.html (idempotent),
and render the no-JS dot-chart fallback PNG."""
import csv, html, re
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
HTML = ROOT / "site" / "index.html"
CSV = ROOT / "03-research" / "sources.csv"


def sources_html():
    items = []
    for r in csv.DictReader(open(CSV, encoding="utf-8")):
        ok = r["status"].startswith("VERIFIED")
        tag = "" if ok else ' <span class="src-flag">[unverified]</span>'
        title = html.escape(r["source_title"])
        link = f'<a href="{html.escape(r["url"])}" rel="noopener">{title}</a>' if r["url"].startswith("http") else title
        items.append(
            f'<li data-status="{html.escape(r["status"][:40])}">{html.escape(r["publisher"])}, {link} '
            f'({html.escape(r["source_date"])}).{tag}</li>'
        )
    return "<ol>\n" + "\n".join(items) + "\n</ol>"


def fallback_png(n=4264, cols=66, out=ROOT / "site" / "assets" / "dots-fallback.png"):
    size, pad = 640, 8
    cell = (size - 2 * pad) / cols
    im = Image.new("RGB", (size, size), (255, 255, 255))
    d = ImageDraw.Draw(im)
    for i in range(n):
        x, y = pad + (i % cols) * cell, pad + (i // cols) * cell
        d.ellipse([x + 1, y + 1, x + cell - 1, y + cell - 1], fill=(141, 216, 194))
    x, y = pad + (n - 1) % cols * cell, pad + (n - 1) // cols * cell
    d.ellipse([x - 2, y - 2, x + cell + 2, y + cell + 2], outline=(192, 69, 59), width=3)
    im = im.convert("P", palette=Image.ADAPTIVE, colors=8)
    im.save(out, optimize=True)


def main():
    s = HTML.read_text(encoding="utf-8")
    s = re.sub(r"<!-- @sources -->.*?(?=</div>)", "<!-- @sources -->" + sources_html(), s, flags=re.S)
    HTML.write_text(s, encoding="utf-8")
    fallback_png()
    print("sources + fallback written")


if __name__ == "__main__":
    main()
