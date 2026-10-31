#!/usr/bin/env python3
"""Rebuild the delivered v2.5.0 in a generated preview directory; never alter root index."""
from pathlib import Path
import hashlib,shutil,subprocess,sys
root=Path(__file__).resolve().parent
source=root/'input/index.html'
expected_input='70c67195ced9633eea4aed993743c1d1f9f83f7a820855e9978661edadd4a3fb'
expected_output='48affa41e0241ed3bdf536a7fc31ff3d0d126d9aca4022b576f3077aa3c9f029'
if not source.is_file():raise SystemExit('Missing v2.4.1 baseline. Read RESTORE_FROM_GIT.md; do not use v2.5 as input.')
if hashlib.sha256(source.read_bytes()).hexdigest()!=expected_input:raise SystemExit('Wrong baseline; expected v2.4.1 exactly.')
art=root.parent/'art'
if art.is_dir():shutil.copytree(art,root/'preview/dist/art',dirs_exist_ok=True)
for script in ['build.py','fixtures.py','remote-fixture.py']:subprocess.run([sys.executable,str(root/script)],cwd=root,check=True)
output=root/'preview/dist/index.html'
actual=hashlib.sha256(output.read_bytes()).hexdigest()
if actual!=expected_output:raise SystemExit('Rebuild differs from delivered index: '+actual)
node=shutil.which('node')
if node:subprocess.run([node,'--check',str(root/'game.js')],check=True)
manifest=root/'preview/.openai/hosting.json';manifest.parent.mkdir(parents=True,exist_ok=True);manifest.write_text('{"static":{"directory":"dist"}}')
print('Exact rebuild verified:',actual)
print('Serve source/preview/dist with a static server; inspect qa.html and regression.html in a browser.')
