"""Preview server for site/ with caching disabled, so edits show on a normal reload.
Usage: python tools/serve.py [port]"""
import sys, functools, http.server
from pathlib import Path

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
site = str(Path(__file__).resolve().parent.parent / "site")
http.server.ThreadingHTTPServer(("", port), functools.partial(NoCache, directory=site)).serve_forever()
