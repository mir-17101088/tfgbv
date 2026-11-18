"""Bake the ch6 chart's final state into index.html so it shows without JS."""
import re, sys, os
sys.path.insert(0, os.path.dirname(__file__))
import qa

with qa.serve():
    # reduced motion draws the final state in the static layout; 480px keeps the type legible on phones
    with qa.page(480, reduced=True) as p:
        p.wait_for_timeout(300)
        inner = p.evaluate("document.querySelector('.pathviz__svg').innerHTML")
        vb = p.evaluate("document.querySelector('.pathviz__svg').getAttribute('viewBox')")
    qa._browser.close(); qa._pw.stop()
s = qa.SITE.joinpath("index.html").read_text(encoding="utf-8")
s = re.sub(r"<!-- @pathsnap -->.*?<!-- /pathsnap -->", lambda m: "<!-- @pathsnap -->" + inner + "<!-- /pathsnap -->", s, flags=re.S)
s = re.sub(r'(<svg class="pathviz__svg" viewBox=")[^"]*', lambda m: m.group(1) + vb, s)
qa.SITE.joinpath("index.html").write_text(s, encoding="utf-8")
print("path snapshot:", len(inner), "chars")
