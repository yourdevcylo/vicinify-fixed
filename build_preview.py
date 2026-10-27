#!/usr/bin/env python3
"""Rebuild Vicinify single-file preview + distributable ZIP.
Recreated 2026-10-05 (v53 audit) after /tmp was wiped on VM replacement.
Original lived at /tmp/build_vicinify.py.
"""
import os
import re
import zipfile

SRC = os.path.expanduser("~/workspace/vicinify-final")
PREVIEW = os.path.expanduser("~/workspace/vicinify-final-preview.html")
ZIP = os.path.expanduser("~/workspace/VICIN3_FINAL_2026.zip")
VERSION_TAG = "v53"

with open(os.path.join(SRC, "index.html"), encoding="utf-8") as f:
    html = f.read()

# Inline CSS
with open(os.path.join(SRC, "css", "style.css"), encoding="utf-8") as f:
    css = f.read()
css_link_re = re.compile(
    r'[ \t]*<link rel="stylesheet" href="css/style\.css\?v=[^"]*" />[ \t]*\n?')
css_block = "<!-- css inlined -->\n<style>\n/* inlined " + VERSION_TAG + " */\n" + css + "\n</style>"
html, n_css = css_link_re.subn(css_block, html, count=1)
assert n_css == 1, "css link tag not found"

# Inline each local JS file (keep CDN scripts untouched)
def inline_js(m):
    name = m.group(1)
    with open(os.path.join(SRC, "js", name), encoding="utf-8") as f:
        js = f.read()
    assert "</script" not in js.lower(), f"{name} contains </script>"
    return "<!-- js inlined: " + name + " -->\n<script>\n" + js + "\n</script>"

js_re = re.compile(r'[ \t]*<script src="js/([a-z]+\.js)\?v=[^"]*"></script>[ \t]*\n?')
html, n_js = js_re.subn(inline_js, html)
assert n_js == 6, f"expected 6 js inlines, got {n_js}"

with open(PREVIEW, "w", encoding="utf-8") as f:
    f.write(html)

# ZIP the whole folder under VICIN3/
with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED) as z:
    for root, _dirs, files in os.walk(SRC):
        for fn in sorted(files):
            full = os.path.join(root, fn)
            arc = "VICIN3/" + os.path.relpath(full, SRC).replace(os.sep, "/")
            z.write(full, arc)

suki_markers = html.count("suki")
print(f"preview bytes: {os.path.getsize(PREVIEW)}")
print(f"zip bytes: {os.path.getsize(ZIP)}")
print(f"suki markers in preview: {suki_markers}")
with zipfile.ZipFile(ZIP) as z:
    print(f"zip entries: {len(z.namelist())}")
