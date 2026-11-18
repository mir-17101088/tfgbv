"""Inline site/svg/*.svg into site/index.html at <!-- @svg name --> markers (idempotent:
content between <!-- @svg name --> and <!-- /svg name --> is replaced)."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML = ROOT / "site" / "index.html"
SVG = ROOT / "site" / "svg"


def main():
    s = HTML.read_text(encoding="utf-8")

    def repl(m):
        name = m.group(1)
        f = SVG / f"{name}.svg"
        if not f.exists():
            return f"<!-- @svg {name} --><!-- /svg {name} -->"
        body = f.read_text(encoding="utf-8").strip()
        body = re.sub(r"\s*\n\s*", "\n", body)  # trim indentation
        return f"<!-- @svg {name} -->{body}<!-- /svg {name} -->"

    s = re.sub(r"<!-- @svg ([\w-]+) -->(?:.*?<!-- /svg \1 -->)?", repl, s, flags=re.S)
    HTML.write_text(s, encoding="utf-8")
    print("inlined:", sorted(p.stem for p in SVG.glob("*.svg")))


if __name__ == "__main__":
    main()
