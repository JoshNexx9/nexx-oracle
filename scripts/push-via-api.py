#!/usr/bin/env python3
"""Push site to GitHub via API token (GITHUB_TOKEN or gh auth token)."""
from __future__ import annotations

import base64
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OWNER = "JoshNexx9"
REPO = "nexx-oracle"
BRANCH = "main"
SKIP = {".git", "__pycache__", ".pyc", "vault/server.py", "vault/store.py"}


def token() -> str:
    t = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if t:
        return t.strip()
    try:
        out = subprocess.check_output(
            ["gh", "auth", "token"], text=True, stderr=subprocess.DEVNULL
        )
        return out.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass
    raise SystemExit("No GitHub token. Run: gh auth login")


def api(method: str, path: str, data: dict | None = None) -> dict:
    tok = token()
    url = f"https://api.github.com{path}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(
        url,
        data=body,
        method=method,
        headers={
            "Authorization": f"Bearer {tok}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "nexx-oracle-deploy",
        },
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode())


def should_skip(p: Path) -> bool:
    parts = set(p.parts)
    if ".git" in parts:
        return True
    if "__pycache__" in parts:
        return True
    s = str(p)
    if s.endswith(".pyc"):
        return True
    return False


def collect_files() -> list[Path]:
    files = []
    for p in ROOT.rglob("*"):
        if p.is_file() and not should_skip(p.relative_to(ROOT)):
            files.append(p)
    return sorted(files)


def file_content_b64(path: Path) -> str:
    raw = path.read_bytes()
    if len(raw) > 900_000:
        raise SystemExit(f"File too large for API batch: {path}")
    return base64.b64encode(raw).decode()


def get_ref_sha() -> str | None:
    try:
        ref = api("GET", f"/repos/{OWNER}/{REPO}/git/ref/heads/{BRANCH}")
        return ref["object"]["sha"]
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def push_batch(files: list[tuple[str, str]], message: str, parent_sha: str | None) -> str:
    blobs = []
    for path, b64 in files:
        blob = api("POST", f"/repos/{OWNER}/{REPO}/git/blobs", {
            "content": b64,
            "encoding": "base64",
        })
        blobs.append({"path": path, "mode": "100644", "type": "blob", "sha": blob["sha"]})

    if parent_sha:
        parent_commit = api("GET", f"/repos/{OWNER}/{REPO}/git/commits/{parent_sha}")
        base_tree = parent_commit["tree"]["sha"]
        tree = api("POST", f"/repos/{OWNER}/{REPO}/git/trees", {
            "base_tree": base_tree,
            "tree": blobs,
        })
    else:
        tree = api("POST", f"/repos/{OWNER}/{REPO}/git/trees", {"tree": blobs})

    commit = api("POST", f"/repos/{OWNER}/{REPO}/git/commits", {
        "message": message,
        "tree": tree["sha"],
        **({"parents": [parent_sha]} if parent_sha else {}),
    })

    if parent_sha:
        api("PATCH", f"/repos/{OWNER}/{REPO}/git/refs/heads/{BRANCH}", {
            "sha": commit["sha"],
            "force": True,
        })
    else:
        api("POST", f"/repos/{OWNER}/{REPO}/git/refs", {
            "ref": f"refs/heads/{BRANCH}",
            "sha": commit["sha"],
        })
    return commit["sha"]


def enable_pages():
    payload = {
        "build_type": "workflow",
        "source": {"branch": BRANCH, "path": "/"},
    }
    try:
        api("POST", f"/repos/{OWNER}/{REPO}/pages", payload)
    except urllib.error.HTTPError as e:
        if e.code not in (409, 422):
            body = e.read().decode()
            print("Pages enable:", e.code, body[:200])


def main():
    all_files = collect_files()
    print(f"Deploying {len(all_files)} files to {OWNER}/{REPO}…")
    parent = get_ref_sha()
    batch_size = 40
    for i in range(0, len(all_files), batch_size):
        chunk = all_files[i : i + batch_size]
        batch = []
        for p in chunk:
            rel = p.relative_to(ROOT).as_posix()
            batch.append((rel, file_content_b64(p)))
        msg = f"Deploy NEXX Oracle ({i + 1}-{i + len(chunk)}/{len(all_files)})"
        parent = push_batch(batch, msg, parent)
        print(f"  ✓ {msg}")

    enable_pages()
    print("\nLive soon at: https://joshnexx9.github.io/nexx-oracle/")
    print("Custom domain: GitHub → Settings → Pages → Add domain")


if __name__ == "__main__":
    main()