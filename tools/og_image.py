"""Render the hero illustration, without any text, as the 1200x630 social share image.
Usage: python tools/og_image.py  -> site/assets/og-image.jpg"""
import io, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import qa
from PIL import Image

OUT = Path(__file__).resolve().parent.parent / "site" / "assets" / "og-image.jpg"
with qa.serve():
    with qa.page(1200, height=630) as p:
        p.add_style_tag(content=".hero__text,.hero__logo,.rail,.skip,.hero::after{display:none!important}"
                                ".hero{min-height:630px!important;height:630px}")
        p.wait_for_timeout(3000)  # let the notification badge finish counting
        png = p.locator("header").first.screenshot()
im = Image.open(io.BytesIO(png)).convert("RGB").crop((0, 0, 1200, 630))
im.save(OUT, "JPEG", quality=86, optimize=True, progressive=True)
print(OUT, im.size, OUT.stat().st_size // 1024, "KB")
