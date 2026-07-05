#!/usr/bin/env python3
"""Reassemble css/nexx-tarot.css from data/css-chunks/*.b64."""
from __future__ import annotations

import base64
import glob
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
parts = [pathlib.Path(p).read_text() for p in sorted(glob.glob(str(ROOT / "data/css-chunks/chunk-*.b64")))]
css = base64.b64decode("".join(parts))
out = ROOT / "css" / "nexx-tarot.css"
out.parent.mkdir(exist_ok=True)
out.write_bytes(css)
print(f"Wrote {len(css)} bytes to {out}")
