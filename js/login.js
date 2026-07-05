/**
 * NEXX Oracle — Google-style sign-in page
 */
(function () {
  const $ = (id) => document.getElementById(id);
  let step = 'password';
  let pinBuffer = '';
  const MAX_PIN = 4;

  function setError(msg) {
    const el = $('login-error');
    if (el) el.textContent = msg || '';
    const pw = $('password');
    if (pw) pw.classList.toggle('error', !!msg);
  }

  function setEmailError(msg) {
    const el = $('email-error');
    if (el) el.textContent = msg || '';
  }

  function showStep(name) {
    step = name;
    $('password-form').hidden = name !== 'password';
    $('email-form').hidden = name !== 'email';
    $('btn-next').setAttribute('form', name === 'email' ? 'email-form' : 'password-form');
  }

  function updatePinDots() {
    const dots = $('pin-dots').querySelectorAll('span');
    dots.forEach((d, i) => d.classList.toggle('filled', i < pinBuffer.length));
  }

  function openPinPad() {
    pinBuffer = '';
    updatePinDots();
    $('pin-error').textContent = '';
    $('pin-overlay').hidden = false;
    $('password').blur();
  }

  function closePinPad() {
    $('pin-overlay').hidden = true;
    pinBuffer = '';
    updatePinDots();
  }

  async function submitPin() {
    if (pinBuffer.length < MAX_PIN) return;
    $('pin-error').textContent = '';
    try {
      await NexxAuth.loginWithPin(pinBuffer);
      closePinPad();
      NexxAuth.redirectAfterLogin();
    } catch (e) {
      $('pin-error').textContent = e.message || 'Incorrect PIN';
      pinBuffer = '';
      updatePinDots();
    }
  }

  function onPinDigit(d) {
    if (pinBuffer.length >= MAX_PIN) return;
    pinBuffer += d;
    updatePinDots();
    if (pinBuffer.length === MAX_PIN) {
      setTimeout(submitPin, 120);
    }
  }

  async function tryWebAuthn() {
    setError('');
    try {
      const result = await NexxAuth.loginWithPasskey();
      if (result?.ok) {
        NexxAuth.redirectAfterLogin();
        return true;
      }
      if (NexxAuth.isSecure() && window.PublicKeyCredential) {
        const reg = await NexxAuth.registerPasskey();
        if (reg?.ok) {
          NexxAuth.redirectAfterLogin();
          return true;
        }
      }
    } catch (e) {
      if (e.message !== 'Passkey cancelled' && e.message !== 'Passkeys need HTTPS') {
        setError(e.message);
        return true;
      }
    }
    return false;
  }

  async function onPasskeyClick() {
    const used = await tryWebAuthn();
    if (!used) openPinPad();
  }

  async function onPasswordSubmit(e) {
    e.preventDefault();
    setError('');
    const pw = $('password').value;
    $('btn-next').disabled = true;
    try {
      await NexxAuth.loginWithCredentials(NexxAuth.DEFAULT_EMAIL, pw);
      NexxAuth.redirectAfterLogin();
    } catch (err) {
      setError(err.message || 'Sign-in failed');
    } finally {
      $('btn-next').disabled = false;
    }
  }

  async function onEmailSubmit(e) {
    e.preventDefault();
    setEmailError('');
    const email = $('email').value.trim();
    if (!email.includes('@')) {
      setEmailError('Enter a valid email');
      return;
    }
    $('display-email').textContent = email;
    showStep('password');
    $('password').focus();
  }

  function onTryAnother() {
    if (step === 'password') {
      showStep('email');
      $('email').focus();
    } else {
      showStep('password');
      $('password').focus();
    }
    setError('');
    setEmailError('');
  }

  async function boot() {
    if (await NexxAuth.checkServerSession() || NexxAuth.isAuthed()) {
      NexxAuth.redirectAfterLogin();
      return;
    }

    $('password-form').addEventListener('submit', onPasswordSubmit);
    $('email-form').addEventListener('submit', onEmailSubmit);
    $('btn-passkey').addEventListener('click', onPasskeyClick);
    $('btn-try-another').addEventListener('click', onTryAnother);
    $('pin-close').addEventListener('click', closePinPad);
    $('pin-overlay').addEventListener('click', (e) => {
      if (e.target === $('pin-overlay')) closePinPad();
    });

    $('pin-pad').addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const digit = btn.dataset.digit;
      const action = btn.dataset.action;
      if (digit !== undefined) onPinDigit(digit);
      else if (action === 'back') {
        pinBuffer = pinBuffer.slice(0, -1);
        updatePinDots();
      } else if (action === 'clear') {
        pinBuffer = '';
        updatePinDots();
      }
    });

    document.addEventListener('keydown', (e) => {
      if ($('pin-overlay').hidden) return;
      if (e.key >= '0' && e.key <= '9') onPinDigit(e.key);
      else if (e.key === 'Backspace') {
        pinBuffer = pinBuffer.slice(0, -1);
        updatePinDots();
      } else if (e.key === 'Escape') closePinPad();
    });

    $('password').focus();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();