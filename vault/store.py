"""Encrypted vault storage for NEXX Portal."""
from __future__ import annotations

import base64
import hashlib
import json
import os
import secrets
import time
from pathlib import Path

from cryptography.fernet import Fernet, InvalidToken

VAULT_DIR = Path(os.environ.get("NEXX_VAULT_DIR", Path.home() / ".local/share/nexx-vault"))
DATA_DIR = VAULT_DIR / "blobs"
META_FILE = VAULT_DIR / "files.json"
CONFIG_FILE = VAULT_DIR / "config.json"

PBKDF2_ITERS = 600_000
MAX_FILE_BYTES = int(os.environ.get("NEXX_VAULT_MAX_MB", "200")) * 1024 * 1024


def _ensure_dirs():
    VAULT_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def _load_config() -> dict:
    _ensure_dirs()
    if CONFIG_FILE.exists():
        return json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    return {}


def _save_config(cfg: dict):
    _ensure_dirs()
    CONFIG_FILE.write_text(json.dumps(cfg, indent=2), encoding="utf-8")
    os.chmod(CONFIG_FILE, 0o600)
    os.chmod(VAULT_DIR, 0o700)


def init_vault(username: str, password: str) -> dict:
    """First-run setup: salt, password hash, server secret."""
    cfg = _load_config()
    if cfg.get("initialized"):
        return cfg
    salt = secrets.token_bytes(32)
    cfg = {
        "initialized": True,
        "username": username,
        "salt": base64.b64encode(salt).decode("ascii"),
        "password_hash": _hash_password(password, salt),
        "server_secret": secrets.token_hex(32),
        "created": time.time(),
    }
    _save_config(cfg)
    if not META_FILE.exists():
        META_FILE.write_text("[]", encoding="utf-8")
        os.chmod(META_FILE, 0o600)
    return cfg


def _hash_password(password: str, salt: bytes) -> str:
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERS)
    return base64.b64encode(digest).decode("ascii")


def verify_credentials(username: str, password: str) -> bool:
    cfg = init_vault("nexx", "4891")  # ensure exists with defaults on first call
    if username != cfg.get("username"):
        return False
    salt = base64.b64decode(cfg["salt"])
    return secrets.compare_digest(_hash_password(password, salt), cfg["password_hash"])


def derive_fernet(password: str) -> Fernet:
    cfg = _load_config()
    salt = base64.b64decode(cfg["salt"])
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERS, dklen=32)
    return Fernet(base64.urlsafe_b64encode(key))


def server_secret() -> bytes:
    cfg = init_vault("nexx", "4891")
    return cfg["server_secret"].encode("utf-8")


def _load_meta() -> list[dict]:
    _ensure_dirs()
    if not META_FILE.exists():
        return []
    return json.loads(META_FILE.read_text(encoding="utf-8"))


def _save_meta(items: list[dict]):
    META_FILE.write_text(json.dumps(items, indent=2), encoding="utf-8")
    os.chmod(META_FILE, 0o600)


def list_files() -> list[dict]:
    return sorted(_load_meta(), key=lambda x: x.get("uploaded", 0), reverse=True)


def store_file(fernet: Fernet, filename: str, data: bytes, mime: str = "application/octet-stream") -> dict:
    if len(data) > MAX_FILE_BYTES:
        raise ValueError(f"File exceeds {MAX_FILE_BYTES // (1024*1024)}MB limit")
    safe_name = Path(filename).name
    if not safe_name or safe_name in (".", ".."):
        raise ValueError("Invalid filename")

    file_id = secrets.token_hex(16)
    blob_path = DATA_DIR / f"{file_id}.bin"
    token = fernet.encrypt(data)
    blob_path.write_bytes(token)
    os.chmod(blob_path, 0o600)

    entry = {
        "id": file_id,
        "name": safe_name,
        "size": len(data),
        "mime": mime,
        "uploaded": time.time(),
    }
    meta = _load_meta()
    meta.append(entry)
    _save_meta(meta)
    return entry


def read_file(fernet: Fernet, file_id: str) -> tuple[dict, bytes]:
    meta = _load_meta()
    entry = next((m for m in meta if m["id"] == file_id), None)
    if not entry:
        raise FileNotFoundError("File not found")
    blob_path = DATA_DIR / f"{file_id}.bin"
    if not blob_path.exists():
        raise FileNotFoundError("Blob missing")
    try:
        data = fernet.decrypt(blob_path.read_bytes())
    except InvalidToken:
        raise PermissionError("Decryption failed")
    return entry, data


def delete_file(file_id: str) -> bool:
    meta = _load_meta()
    entry = next((m for m in meta if m["id"] == file_id), None)
    if not entry:
        return False
    meta = [m for m in meta if m["id"] != file_id]
    _save_meta(meta)
    blob_path = DATA_DIR / f"{file_id}.bin"
    if blob_path.exists():
        blob_path.unlink()
    return True