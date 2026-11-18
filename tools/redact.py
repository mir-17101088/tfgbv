"""Produce redacted WebP evidence images from the survivor's screenshots.
Usage: python tools/redact.py   (reads tools/redact_boxes.json, writes site/assets/evidence/)"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "01-source" / "photos"
OUT = ROOT / "site" / "assets" / "evidence"
NIGHT = (10, 34, 35)
BAR = (154, 167, 165)


def _font(size):
    for f in ("C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            pass
    return ImageFont.load_default()


def redact(src: Path, boxes: list, out: Path, crop=None, max_w=720) -> tuple:
    im = Image.open(src).convert("RGB")
    for b in boxes:
        x0, y0, x1, y1 = b["box"]
        region = (x0, y0, x1, y1)
        if b["kind"] == "blur":
            patch = im.crop(region)
            # pixelate then blur: irreversible and visually clear
            small = patch.resize((max(1, (x1 - x0) // 14), max(1, (y1 - y0) // 14)), Image.BILINEAR)
            patch = small.resize(patch.size, Image.NEAREST).filter(ImageFilter.GaussianBlur(28))
            overlay = Image.new("RGB", patch.size, NIGHT)
            patch = Image.blend(patch, overlay, 0.6)
            im.paste(patch, region)
        elif b["kind"] == "bar":
            d = ImageDraw.Draw(im)
            d.rounded_rectangle(region, radius=min(14, (y1 - y0) // 2), fill=BAR)
        elif b["kind"] == "fill":  # remove small avatars cleanly (page background is white)
            ImageDraw.Draw(im).rectangle(region, fill=(255, 255, 255))
        elif b["kind"] == "label":
            d = ImageDraw.Draw(im)
            d.rectangle(region, fill=NIGHT)
            f = _font(max(11, int((y1 - y0) * 0.5)))
            d.text((x0 + 8, (y0 + y1) / 2), b.get("text", "[removed]"), fill=(255, 255, 255), font=f, anchor="lm")
    if crop:
        im = im.crop(tuple(crop))
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    out.parent.mkdir(parents=True, exist_ok=True)
    im.save(out, "WEBP", quality=72, method=6)
    return im.size


def main():
    spec = json.loads((ROOT / "tools" / "redact_boxes.json").read_text(encoding="utf-8"))
    manifest = []
    for name, cfg in spec.items():
        if name.startswith("_"):
            continue
        out = OUT / f"{name}.webp"
        w, h = redact(SRC / cfg["src"], cfg["boxes"], out, cfg.get("crop"))
        manifest.append({"file": f"assets/evidence/{name}.webp", "w": w, "h": h, "alt": cfg["alt"]})
        print(name, w, h)
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
