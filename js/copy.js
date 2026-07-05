/**
 * NEXX Copy — works on HTTP LAN (iPhone) where navigator.clipboard is blocked.
 */
(function (global) {
  let toastEl = null;

  function ensureToast() {
    if (toastEl) return toastEl;
    toastEl = document.createElement('div');
    toastEl.id = 'nexx-copy-toast';
    toastEl.className = 'nexx-copy-toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastEl);
    return toastEl;
  }

  function showToast(msg, type) {
    const t = ensureToast();
    t.textContent = msg;
    t.className = 'nexx-copy-toast nexx-copy-toast--' + (type || 'success');
    void t.offsetWidth;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2800);
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;font-size:16px';
    document.body.appendChild(ta);
    const isIOS = /ipad|iphone|ipod/i.test(navigator.userAgent);
    if (isIOS) {
      const range = document.createRange();
      range.selectNodeContents(ta);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      ta.setSelectionRange(0, text.length);
    } else {
      ta.focus();
      ta.select();
    }
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (_) { /* ignore */ }
    document.body.removeChild(ta);
    return ok;
  }

  function ensureOverlay() {
    let overlay = document.getElementById('nexx-copy-overlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'nexx-copy-overlay';
    overlay.innerHTML =
      '<div class="nexx-copy-overlay-inner">' +
      '<p class="nexx-copy-overlay-hint">Long-press the text, then tap <strong>Copy</strong></p>' +
      '<textarea class="nexx-copy-overlay-ta" readonly></textarea>' +
      '<button type="button" class="primary nexx-copy-overlay-close">Done</button>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('.nexx-copy-overlay-close').addEventListener('click', () => {
      overlay.classList.remove('show');
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('show');
    });
    return overlay;
  }

  function showSelectOverlay(text) {
    const overlay = ensureOverlay();
    const ta = overlay.querySelector('.nexx-copy-overlay-ta');
    ta.value = text;
    overlay.classList.add('show');
    ta.focus();
    ta.select();
    if (ta.setSelectionRange) ta.setSelectionRange(0, text.length);
  }

  async function write(text) {
    const str = String(text ?? '');

    if (navigator.clipboard && global.isSecureContext) {
      try {
        await navigator.clipboard.writeText(str);
        showToast('Copied ✓');
        return true;
      } catch (_) { /* fall through */ }
    }

    if (fallbackCopy(str)) {
      showToast('Copied ✓');
      return true;
    }

    showSelectOverlay(str);
    showToast('Select text & copy', 'hint');
    return false;
  }

  function feedbackButton(btn, ok, origMs) {
    if (!btn) return;
    const orig = btn.dataset.origLabel || btn.textContent;
    if (!btn.dataset.origLabel) btn.dataset.origLabel = orig;
    btn.textContent = ok ? 'Copied ✓' : 'Select ↑';
    setTimeout(() => { btn.textContent = orig; }, origMs || 2000);
  }

  async function fromButton(btn, textOrFn) {
    const text = typeof textOrFn === 'function' ? textOrFn() : textOrFn;
    const ok = await write(text);
    feedbackButton(btn, ok);
    return ok;
  }

  function bindPreBlocks(selector) {
    document.querySelectorAll(selector || '.copy-text').forEach((pre) => {
      if (pre.dataset.nexxCopyBound) return;
      pre.dataset.nexxCopyBound = '1';
      pre.classList.add('copy-tap');
      pre.title = 'Tap to copy';
      pre.addEventListener('click', () => write(pre.textContent));
    });
  }

  function init() {
    bindPreBlocks();
    if (typeof MutationObserver !== 'undefined' && document.body) {
      const obs = new MutationObserver(() => bindPreBlocks());
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.NexxCopy = { write, fromButton, bindPreBlocks, showToast, feedbackButton };
})(typeof window !== 'undefined' ? window : global);