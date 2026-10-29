#!/usr/bin/env python3
"""One-time fix: externalize web media without changing game logic or save keys."""
import base64
import hashlib
import json
import re
import sys
from pathlib import Path

source = Path(sys.argv[1])
root = Path(sys.argv[2])
original = source.read_bytes()
blob_sha = hashlib.sha1(b"blob " + str(len(original)).encode() + b"\0" + original).hexdigest()
expected = "6e9b47e00128c0309282db49e6f8ed03d87b0b58"
if blob_sha != expected:
    raise SystemExit("Safety stop: index.html changed; expected " + expected + " but got " + blob_sha)
text = original.decode("utf-8")
decoder = json.JSONDecoder()
for name, mime, ext, folder, expected_count in [
    ("ASSETS", "image/webp", ".webp", "art/game-assets", 575),
    ("MUS", "audio/mpeg", ".mp3", "audio", 8),
]:
    prefix = "const " + name + "="
    assert text.count(prefix) == 1
    start = text.index(prefix) + len(prefix)
    items, length = decoder.raw_decode(text[start:])
    assert isinstance(items, dict) and len(items) == expected_count, name
    end = start + length
    assert text[end] == ";"
    urls = {}
    for key, value in items.items():
        assert re.fullmatch(r"[A-Za-z0-9_-]+", key), key
        marker = "data:" + mime + ";base64,"
        assert value.startswith(marker), key
        data = base64.b64decode(value[len(marker):], validate=True)
        assert len(data) > 80, key
        if mime == "image/webp":
            assert data[:4] == b"RIFF" and data[8:12] == b"WEBP", key
        filename = folder + "/" + key + ext
        path = root / filename
        assert not path.exists(), "Refuse to overwrite " + filename
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        urls[key] = filename
    text = text[:start] + json.dumps(urls, separators=(",", ":")) + text[end:]
    print(name, len(urls), "files extracted")
assert "const VER='v1.5.2'" in text
assert "const A=k=>ASSETS[k]||'';" in text
assert text.endswith("</script></body></html>")
assert len(text.encode("utf-8")) < 1000000
source.write_text(text, encoding="utf-8")
(root / ".nojekyll").touch()
print("Completed: HTML", source.stat().st_size, "bytes; original HTML retained in Git history.")
