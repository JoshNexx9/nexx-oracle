#!/usr/bin/env python3
"""Reassemble assets/ from data/asset-parts/*.b64 tarball."""
from __future__ import annotations

import base64
import json
import pathlib
import subprocess
import tarfile
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
PARTS_DIR = ROOT / "data" / "asset-parts"


def main() -> None:
    manifest = json.loads((PARTS_DIR / "manifest.json").read_text())
    b64 = "".join((PARTS_DIR / name).read_text() for name in manifest["parts"])
    raw = base64.b64decode(b64)
    if len(raw) != manifest["raw_bytes"]:
        raise SystemExit(f"Size mismatch: got {len(raw)}, expected {manifest['raw_bytes']}")

    with tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False) as tmp:
        tmp.write(raw)
        tmp_path = tmp.name

    assets = ROOT / "assets"
    if assets.exists():
        subprocess.run(["rm", "-rf", str(assets)], check=True)
    with tarfile.open(tmp_path, "r:gz") as tar:
        tar.extractall(ROOT)
    pathlib.Path(tmp_path).unlink(missing_ok=True)
    count = sum(1 for _ in assets.rglob("*") if _.is_file())
    print(f"Restored assets/ ({count} files)")


if __name__ == "__main__":
    main()