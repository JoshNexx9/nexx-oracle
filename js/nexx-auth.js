/**
 * NEXX Oracle — shared session auth (local server + static fallback)
 */
(function (global) {
  const SESSION_KEY = 'nexx_oracle_session';
  const WEBAUTHN_KEY = 'nexx_webauthn_cred';
  const SESSION_HOURS = 12;
  const VALID_PIN = '4891';
  const DEFAULT_EMAIL = 'jnexsociety@gmail.com';
  const DEFAULT_USER = 'nexx';

  const EMAIL_ALIASES = {
    'jnexsociety@gmail.com': DEFAULT_USER,
    nexx: DEFAULT_USER,
  };

  function normalizeUser(input) {
    const v = String(input || '').trim().toLowerCase();
    return EMAIL_ALIASES[v] || v;
  }

  function hasLocalApi() {
    const host = location.hostname;
    return (
      location.protocol !== 'file:' &&
      (host === 'localhost' ||
        host === '127.0.0.1' ||
        host.startsWith('192.168.') ||
        host.startsWith('10.') ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
        location.port === '8765')
    );
  }

  function isSecure() {
    return location.protocol === 'https:' || location.hostname === 'localhost';
  }

  function readSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data.expires || Date.now() > data.expires) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  function writeSession(user, method) {
    const data = {
      user: user || DEFAULT_EMAIL,
      method: method || 'password',
      expires: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    return data;
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function isAuthed() {
    if (readSession()) return true;
    return false;
  }

  async function checkServerSession() {
    if (!hasLocalApi()) return false;
    try {
      const res = await fetch('/api/vault/session', { credentials: 'same-origin' });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.ok) {
        writeSession(data.user || DEFAULT_USER, 'server');
        return true;
      }
    } catch {
      /* static host */
    }
    return false;
  }

  async function loginWithCredentials(username, password) {
    const user = normalizeUser(username);
    const secret = String(password);

    if (hasLocalApi()) {
      try {
        const res = await fetch('/api/vault/login', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user, password: secret }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          writeSession(data.user || user, 'server');
          return { ok: true, user: data.user || user };
        }
        if (res.status !== 404) {
          throw new Error(data.error || 'Sign-in failed');
        }
      } catch (e) {
        if (e.message && !e.message.includes('Failed to fetch')) throw e;
      }
    }

    if (secret === VALID_PIN) {
      writeSession(DEFAULT_EMAIL, 'pin');
      return { ok: true, user: DEFAULT_EMAIL };
    }

    throw new Error('Wrong password. Try again or use a passkey.');
  }

  function bufferToBase64(buf) {
    const bytes = new Uint8Array(buf);
    let s = '';
    bytes.forEach((b) => { s += String.fromCharCode(b); });
    return btoa(s);
  }

  function base64ToBuffer(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }

  async function registerPasskey() {
    if (!isSecure() || !window.PublicKeyCredential) {
      throw new Error('Passkeys need HTTPS');
    }
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'NEXX Oracle', id: location.hostname },
        user: {
          id: userId,
          name: DEFAULT_EMAIL,
          displayName: 'Josh Nexx',
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    });
    if (!cred) throw new Error('Passkey setup cancelled');
    localStorage.setItem(
      WEBAUTHN_KEY,
      JSON.stringify({ id: cred.id, rawId: bufferToBase64(cred.rawId) }),
    );
    writeSession(DEFAULT_EMAIL, 'passkey');
    return { ok: true, user: DEFAULT_EMAIL };
  }

  async function loginWithPasskey() {
    if (!isSecure() || !window.PublicKeyCredential) {
      return null;
    }

    const stored = localStorage.getItem(WEBAUTHN_KEY);
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const opts = {
      challenge,
      rpId: location.hostname,
      timeout: 60000,
      userVerification: 'required',
    };

    if (stored) {
      try {
        const { id, rawId } = JSON.parse(stored);
        opts.allowCredentials = [{
          id: base64ToBuffer(rawId),
          type: 'public-key',
        }];
      } catch {
        localStorage.removeItem(WEBAUTHN_KEY);
      }
    }

    try {
      const assertion = await navigator.credentials.get({ publicKey: opts });
      if (assertion) {
        if (!stored) {
          localStorage.setItem(
            WEBAUTHN_KEY,
            JSON.stringify({ id: assertion.id, rawId: bufferToBase64(assertion.rawId) }),
          );
        }
        writeSession(DEFAULT_EMAIL, 'passkey');
        return { ok: true, user: DEFAULT_EMAIL };
      }
    } catch (e) {
      if (e.name === 'NotAllowedError') throw new Error('Passkey cancelled');
      if (stored) throw e;
    }

    return null;
  }

  async function loginWithPin(pin) {
    if (String(pin) === VALID_PIN) {
      writeSession(DEFAULT_EMAIL, 'pin');
      return { ok: true, user: DEFAULT_EMAIL };
    }
    throw new Error('Incorrect PIN');
  }

  function redirectAfterLogin() {
    const params = new URLSearchParams(location.search);
    const dest = params.get('redirect') || 'index.html';
    const safe = dest.startsWith('/') || !dest.includes('://') ? dest : 'index.html';
    location.replace(safe);
  }

  function requireAuth(loginPath) {
    const login = loginPath || 'login.html';
    if (location.pathname.endsWith(login)) return;

    if (isAuthed()) return;

    checkServerSession().then((ok) => {
      if (!ok) {
        const dest = location.pathname.split('/').pop() || 'index.html';
        const qs = dest !== 'index.html' ? `?redirect=${encodeURIComponent(dest)}` : '';
        location.replace(`${login}${qs}`);
      }
    });
  }

  global.NexxAuth = {
    DEFAULT_EMAIL,
    VALID_PIN,
    hasLocalApi,
    isSecure,
    isAuthed,
    readSession,
    writeSession,
    clearSession,
    checkServerSession,
    loginWithCredentials,
    loginWithPasskey,
    loginWithPin,
    registerPasskey,
    redirectAfterLogin,
    requireAuth,
  };
})(window);
