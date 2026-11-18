"""Viewport screenshots of chosen sections. Usage: python tools/shots.py WIDTH selector[@frac] ...
Writes qa-out/<width>-<name>.png"""
import sys
sys.path.insert(0, __import__("os").path.dirname(__file__))
import qa

def main():
    w = int(sys.argv[1])
    reduced = "--reduced" in sys.argv
    targets = [a for a in sys.argv[2:] if not a.startswith("--")]
    with qa.serve():
        with qa.page(w, reduced=reduced, height=800 if w < 700 else 820) as p:
            for t in targets:
                sel, _, frac = t.partition("@")
                qa.scroll_to(p, sel, float(frac or 0))
                p.wait_for_timeout(450)
                name = f"{w}-{__import__('re').sub(r'[^A-Za-z0-9-]+', '_', sel).strip('_')}-{frac or '0'}"
                qa.shot(p, name)
                print("qa-out/" + name + ".png")
            if p.errors:
                print("PAGE ERRORS:", p.errors)

if __name__ == "__main__":
    main()
