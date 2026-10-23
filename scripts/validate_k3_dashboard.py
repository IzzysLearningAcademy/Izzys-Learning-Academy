#!/usr/bin/env python3
"""Static PR acceptance gates for the K-3 dashboard; not a browser/device test."""
from pathlib import Path
import re
import subprocess
import tempfile

page=Path("courses/little-learners.html")
assert page.exists(), "Missing K-3 dashboard page"
s=page.read_text(encoding="utf-8")
assert 'id="ila-k3-final-scenes"' in s, "Full-scene CSS missing"
assert '--ila-k3-scene' in s, "Scene image variable missing"
assert 'aspect-ratio:2400/633' in s, "Scene proportions not preserved"
assert 'id="ila-k3-scene-viewer"' in s, "Full scene viewer missing"
assert 'els.workspace.hidden=!activityOpen' in s, "Dashboard coursework gating missing"
assert 'ila-k3-dashboard-integration' in s, "Grade subject cards missing"
for name in ("k-banner.webp","g1-banner.webp","g2-banner.webp","g3-banner.webp"):
    p=Path("assets/k3")/name
    assert p.is_file() and p.stat().st_size>1000, f"Missing illustration: {p}"
scripts=re.findall(r'<script\b([^>]*)>(.*?)</script\s*>',s,re.I|re.S)
checked=0
with tempfile.TemporaryDirectory() as d:
    for i,(attrs,body) in enumerate(scripts):
        if re.search(r'\bsrc\s*=',attrs,re.I): continue
        typ=re.search(r'\btype\s*=\s*["\\\']([^"\\\']+)',attrs,re.I)
        if typ and typ.group(1).lower() not in ("text/javascript","application/javascript","module"): continue
        if not body.strip(): continue
        p=Path(d)/f"script-{i}.js"
        p.write_text(body,encoding="utf-8")
        result=subprocess.run(["node","--check",str(p)],capture_output=True,text=True)
        assert result.returncode==0, f"JavaScript syntax error in block {i}: {result.stderr}"
        checked+=1
assert checked>=5, f"Too few JavaScript blocks checked: {checked}"
print(f"PASS: illustrations, dashboard gating, and {checked} JavaScript blocks")
print("NOTE: Interactive navigation, backup and mobile Safari require manual testing.")
