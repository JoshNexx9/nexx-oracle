#!/usr/bin/env python3
"""NEXX unified server — encrypted vault portal + static tarot/oracle."""
from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import mimetypes
import os
import re
import secrets
import sys
import time
from http import HTTPStatus
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "vault"))
import store  # noqa: E402

SESSION_TTL = 60 * 60 * 12  # 12 hours
SESSIONS: dict[str, dict] = {}
LOGIN_ATTEMPTS: dict[str, list[float]] = {}
PREMIUM_INTAKES = store.VAULT_DIR / "premium-intakes.jsonl"
PREMIUM_RATE: dict[str, list[float]] = {}


def _client_ip(handler: SimpleHTTPRequestHandler) -> str:
    return handler.client_address[0]


def _rate_limit(ip: str) -> bool:
    now = time.time()
    attempts = LOGIN_ATTEMPTS.setdefault(ip, [])
    LOGIN_ATTEMPTS[ip] = [t for t in attempts if now - t < 300]
    return len(LOGIN_ATTEMPTS[ip]) >= 8


def _sign_session(sid: str, expires: int) -> str:
    msg = f"{sid}.{expires}".encode()
    sig = hmac.new(store.server_secret(), msg, hashlib.sha256).hexdigest()
    return f"{sid}.{expires}.{sig}"


def _verify_session(token: str) -> str | None:
    parts = token.split(".")
    if len(parts) != 3:
        return None
    sid, expires_s, sig = parts
    try:
        expires = int(expires_s)
    except ValueError:
        return None
    if time.time() > expires:
        return None
    expected = hmac.new(store.server_secret(), f"{sid}.{expires}".encode(), hashlib.sha256).hexdigest()
    if not secrets.compare_digest(sig, expected):
        return None
    sess = SESSIONS.get(sid)
    if not sess:
        return None
    return sid


def _parse_multipart(body: bytes, boundary: bytes) -> list[dict]:
    parts = []
    delim = b"--" + boundary
    for chunk in body.split(delim):
        chunk = chunk.strip(b"\r\n")
        if not chunk or chunk == b"--":
            continue
        header_end = chunk.find(b"\r\n\r\n")
        if header_end < 0:
            continue
        headers = chunk[:header_end].decode("utf-8", errors="replace")
        data = chunk[header_end + 4:]
        if data.endswith(b"\r\n"):
            data = data[:-2]
        name = None
        filename = None
        content_type = "application/octet-stream"
        for line in headers.split("\r\n"):
            if line.lower().startswith("content-disposition:"):
                m = re.search(r'name="([^"]+)"', line)
                if m:
                    name = m.group(1)
                m = re.search(r'filename="([^"]*)"', line)
                if m:
                    filename = m.group(1)
            if line.lower().startswith("content-type:"):
                content_type = line.split(":", 1)[1].strip()
        parts.append({"name": name, "filename": filename, "content_type": content_type, "data": data})
    return parts


class NexxHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - [%s] %s\n" % (self.address_string(), self.log_date_time_string(), fmt % args))

    def _json(self, code: int, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self) -> bytes:
        length = int(self.headers.get("Content-Length", 0))
        return self.rfile.read(length) if length else b""

    def _session_from_cookie(self) -> dict | None:
        cookie = self.headers.get("Cookie", "")
        for part in cookie.split(";"):
            part = part.strip()
            if part.startswith("nexx_session="):
                token = part.split("=", 1)[1]
                sid = _verify_session(token)
                if sid:
                    return SESSIONS.get(sid)
        return None

    def _require_auth(self) -> dict | None:
        sess = self._session_from_cookie()
        if not sess:
            self._json(HTTPStatus.UNAUTHORIZED, {"error": "login required"})
            return None
        return sess

    def do_GET(self):
        path = urlparse(self.path).path
        if path.startswith("/api/vault/") or path.startswith("/api/premium/"):
            return self._api_get(path)
        if path in ("/", "/index.html"):
            return self._serve_portal()
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        if path.startswith("/api/vault/") or path.startswith("/api/premium/"):
            return self._api_post(path)
        self.send_error(HTTPStatus.METHOD_NOT_ALLOWED)

    def do_DELETE(self):
        path = urlparse(self.path).path
        if path.startswith("/api/vault/"):
            return self._api_delete(path)
        self.send_error(HTTPStatus.METHOD_NOT_ALLOWED)

    def _serve_portal(self):
        portal = ROOT / "index.html"
        data = portal.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def _api_get(self, path: str):
        if path == "/api/vault/session":
            sess = self._session_from_cookie()
            if sess:
                return self._json(HTTPStatus.OK, {"ok": True, "user": store._load_config().get("username")})
            return self._json(HTTPStatus.UNAUTHORIZED, {"ok": False})

        if path == "/api/vault/files":
            sess = self._require_auth()
            if not sess:
                return
            files = store.list_files()
            return self._json(HTTPStatus.OK, {"files": files})

        if path == "/api/vault/download":
            sess = self._require_auth()
            if not sess:
                return
            fid = parse_qs(urlparse(self.path).query).get("id", [None])[0]
            if not fid:
                return self._json(HTTPStatus.BAD_REQUEST, {"error": "missing id"})
            try:
                entry, data = store.read_file(sess["fernet"], fid)
            except FileNotFoundError:
                return self._json(HTTPStatus.NOT_FOUND, {"error": "not found"})
            except PermissionError:
                return self._json(HTTPStatus.FORBIDDEN, {"error": "decrypt failed"})
            mime = entry.get("mime") or mimetypes.guess_type(entry["name"])[0] or "application/octet-stream"
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Content-Disposition", f'attachment; filename="{entry["name"]}"')
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)
            return

        if path == "/api/vault/info":
            import socket
            import subprocess
            ips = []
            try:
                out = subprocess.check_output(["hostname", "-I"], text=True, timeout=2).strip()
                ips = [x for x in out.split() if not x.startswith("127.")]
            except (OSError, subprocess.SubprocessError):
                pass
            if not ips:
                try:
                    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                    s.connect(("8.8.8.8", 80))
                    ips = [s.getsockname()[0]]
                    s.close()
                except OSError:
                    ips = ["127.0.0.1"]
            wifi = next((ip for ip in ips if ip.startswith(("192.168.", "10.", "172."))), ips[0])
            return self._json(HTTPStatus.OK, {
                "vault": True,
                "encrypted_at_rest": True,
                "port": self.server.server_address[1],
                "lan_ip": wifi,
                "all_ips": ips,
            })

        self._json(HTTPStatus.NOT_FOUND, {"error": "unknown endpoint"})

    def _api_post(self, path: str):
        if path == "/api/vault/login":
            ip = _client_ip(self)
            if _rate_limit(ip):
                return self._json(HTTPStatus.TOO_MANY_REQUESTS, {"error": "too many attempts"})
            try:
                payload = json.loads(self._read_body().decode("utf-8"))
            except json.JSONDecodeError:
                return self._json(HTTPStatus.BAD_REQUEST, {"error": "invalid json"})
            username = str(payload.get("username", "")).strip()
            password = str(payload.get("password", ""))
            if username.lower() in ("jnexsociety@gmail.com", "josh@nexx"):
                username = "nexx"
            store.init_vault("nexx", "4891")
            if not store.verify_credentials(username, password):
                LOGIN_ATTEMPTS.setdefault(ip, []).append(time.time())
                return self._json(HTTPStatus.UNAUTHORIZED, {"error": "invalid credentials"})
            sid = secrets.token_hex(24)
            expires = int(time.time()) + SESSION_TTL
            SESSIONS[sid] = {
                "user": username,
                "fernet": store.derive_fernet(password),
                "expires": expires,
            }
            token = _sign_session(sid, expires)
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json")
            body = json.dumps({"ok": True, "user": username}).encode()
            self.send_header("Content-Length", str(len(body)))
            self.send_header(
                "Set-Cookie",
                f"nexx_session={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age={SESSION_TTL}",
            )
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
            return

        if path == "/api/vault/logout":
            cookie = self.headers.get("Cookie", "")
            for part in cookie.split(";"):
                if part.strip().startswith("nexx_session="):
                    token = part.split("=", 1)[1]
                    sid = _verify_session(token)
                    if sid:
                        SESSIONS.pop(sid, None)
            self.send_response(HTTPStatus.OK)
            self.send_header("Set-Cookie", "nexx_session=; HttpOnly; Path=/; Max-Age=0")
            self.send_header("Content-Type", "application/json")
            body = b'{"ok":true}'
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if path == "/api/premium/intake":
            ip = _client_ip(self)
            now = time.time()
            PREMIUM_RATE.setdefault(ip, [])
            PREMIUM_RATE[ip] = [t for t in PREMIUM_RATE[ip] if now - t < 3600]
            if len(PREMIUM_RATE[ip]) >= 5:
                return self._json(HTTPStatus.TOO_MANY_REQUESTS, {"error": "rate limited"})
            try:
                payload = json.loads(self._read_body().decode("utf-8"))
            except json.JSONDecodeError:
                return self._json(HTTPStatus.BAD_REQUEST, {"error": "invalid json"})
            entry = {
                "sessionId": payload.get("sessionId"),
                "name": payload.get("name"),
                "contact": payload.get("contact"),
                "question": payload.get("question"),
                "questionType": payload.get("questionType"),
                "timestamp": payload.get("timestamp") or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "ip": ip,
            }
            store.VAULT_DIR.mkdir(parents=True, exist_ok=True)
            with PREMIUM_INTAKES.open("a", encoding="utf-8") as f:
                f.write(json.dumps(entry) + "\n")
            os.chmod(PREMIUM_INTAKES, 0o600)
            PREMIUM_RATE[ip].append(now)
            return self._json(HTTPStatus.OK, {"ok": True, "sessionId": entry["sessionId"]})

        if path == "/api/vault/upload":
            sess = self._require_auth()
            if not sess:
                return
            ctype = self.headers.get("Content-Type", "")
            if "multipart/form-data" not in ctype:
                return self._json(HTTPStatus.BAD_REQUEST, {"error": "multipart required"})
            boundary = ctype.split("boundary=", 1)[1].strip().encode()
            body = self._read_body()
            parts = _parse_multipart(body, boundary)
            uploaded = []
            for part in parts:
                if part.get("filename"):
                    try:
                        entry = store.store_file(
                            sess["fernet"],
                            part["filename"],
                            part["data"],
                            part.get("content_type", "application/octet-stream"),
                        )
                        uploaded.append(entry)
                    except ValueError as e:
                        return self._json(HTTPStatus.BAD_REQUEST, {"error": str(e)})
            return self._json(HTTPStatus.OK, {"uploaded": uploaded})

        self._json(HTTPStatus.NOT_FOUND, {"error": "unknown endpoint"})

    def _api_delete(self, path: str):
        if path == "/api/vault/file":
            sess = self._require_auth()
            if not sess:
                return
            fid = parse_qs(urlparse(self.path).query).get("id", [None])[0]
            if not fid:
                return self._json(HTTPStatus.BAD_REQUEST, {"error": "missing id"})
            if store.delete_file(fid):
                return self._json(HTTPStatus.OK, {"ok": True})
            return self._json(HTTPStatus.NOT_FOUND, {"error": "not found"})
        self._json(HTTPStatus.NOT_FOUND, {"error": "unknown endpoint"})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=int(os.environ.get("NEXX_TAROT_PORT", "8765")))
    parser.add_argument("--bind", default=os.environ.get("NEXX_BIND", "0.0.0.0"))
    args = parser.parse_args()

    store.init_vault("nexx", "4891")
    os.chdir(ROOT)
    server = ThreadingHTTPServer((args.bind, args.port), NexxHandler)
    print(f"NEXX Portal listening on http://{args.bind}:{args.port}")
    print(f"Vault data: {store.VAULT_DIR}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.server_close()


if __name__ == "__main__":
    main()