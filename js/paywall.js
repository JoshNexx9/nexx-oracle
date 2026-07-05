/**
 * NEXX Premium Paywall — Venmo @nexxsociety · $50/session
 */
(function (global) {
  const STORAGE_KEY = 'nexx-premium-v2';
  const UNLOCK_DAYS = 30;

  let config = null;

  async function loadConfig() {
    if (config) return config;
    const res = await fetch('data/premium.json');
    config = await res.json();
    return config;
  }

  function sessionId() {
    let id = localStorage.getItem('nexx-premium-session-id');
    if (!id) {
      id = 'NX' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
      localStorage.setItem('nexx-premium-session-id', id);
    }
    return id;
  }

  function venmoUrl(note) {
    const cfg = config || { venmo_handle: 'nexxsociety', price: 50 };
    const n = encodeURIComponent(note || `NEXX Premium Reading ${sessionId()}`);
    return `https://venmo.com/${cfg.venmo_handle}?txn=pay&amount=${cfg.price}&note=${n}`;
  }

  function qrUrl(url) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodeURIComponent(url)}`;
  }

  function isUnlocked() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!data || !data.unlockedAt) return false;
      const age = Date.now() - data.unlockedAt;
      return age < UNLOCK_DAYS * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  }

  function unlock(intake = {}) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      unlockedAt: Date.now(),
      sessionId: sessionId(),
      intake,
    }));
  }

  function getUnlockData() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch {
      return null;
    }
  }

  async function submitIntake(form) {
    const payload = {
      sessionId: sessionId(),
      name: form.name?.trim(),
      contact: form.contact?.trim(),
      question: form.question?.trim(),
      questionType: form.questionType || 'general',
      paid: true,
      timestamp: new Date().toISOString(),
    };
    try {
      await fetch('/api/premium/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (_) { /* offline ok */ }
    unlock(payload);
    return payload;
  }

  function renderPaywall(container, onUnlock) {
    loadConfig().then((cfg) => {
      const sid = sessionId();
      const payUrl = venmoUrl(`NEXX Reading ${sid}`);
      container.innerHTML = `
        <div class="paywall-panel panel">
          <div class="premium-badge">◆ PREMIUM · $${cfg.price} / session</div>
          <h2>Extended Personal Reading</h2>
          <p class="paywall-lead">with <strong>${cfg.reader_name}</strong> · cyberpunk NEXX Tarot · live synthesis for <em>your</em> question.</p>
          <ul class="premium-features">${cfg.features.map((f) => `<li>${f}</li>`).join('')}</ul>
          <div class="paywall-grid">
            <div class="venmo-block">
              <h3>Pay via Venmo</h3>
              <p class="venmo-handle">@${cfg.venmo_handle}</p>
              <p class="venmo-price">$${cfg.price}.00</p>
              <img class="venmo-qr" src="${qrUrl(payUrl)}" alt="Venmo QR code $${cfg.price}" width="200" height="200" />
              <a class="primary venmo-btn" href="${payUrl}" target="_blank" rel="noopener">Open Venmo · Pay $${cfg.price}</a>
              <button type="button" class="btn-copy-venmo" id="copy-venmo-link">Copy payment link</button>
              <p class="session-id">Session ID: <code>${sid}</code><br><span class="field-hint">Include in Venmo note if prompted</span></p>
            </div>
            <div class="intake-block">
              <h3>Your reading request</h3>
              <form id="premium-intake-form" class="vault-form">
                <div class="field">
                  <label>Name</label>
                  <input type="text" name="name" required placeholder="Your name" />
                </div>
                <div class="field">
                  <label>Contact (TikTok / email)</label>
                  <input type="text" name="contact" required placeholder="@you or email" />
                </div>
                <div class="field">
                  <label>Question type</label>
                  <select name="questionType" id="premium-qtype"></select>
                </div>
                <div class="field">
                  <label>Your question (be specific)</label>
                  <textarea name="question" rows="4" required maxlength="500"
                    placeholder="What do you need clarity on?"></textarea>
                </div>
                <p class="field-hint paywall-steps">
                  1. Pay $${cfg.price} on Venmo<br>
                  2. Fill this form<br>
                  3. Unlock your extended reading instantly<br>
                  4. Josh follows up personally on <a href="${cfg.tiktok_url}" target="_blank" rel="noopener">${cfg.tiktok}</a>
                </p>
                <button type="submit" class="primary">I've paid — unlock my reading</button>
              </form>
            </div>
          </div>
          <p class="paywall-trust">Secure payment via Venmo · Personal session with ${cfg.reader_name} · Not medical or legal advice.</p>
        </div>
      `;

      if (global.NexxReadings) {
        const sel = container.querySelector('#premium-qtype');
        Object.entries(NexxReadings.QUESTION_TYPES).forEach(([id, m]) => {
          const o = document.createElement('option');
          o.value = id;
          o.textContent = m.label;
          sel.appendChild(o);
        });
      }

      container.querySelector('#copy-venmo-link')?.addEventListener('click', () => {
        const btn = container.querySelector('#copy-venmo-link');
        if (global.NexxCopy) {
          NexxCopy.fromButton(btn, payUrl);
        } else {
          btn.textContent = 'Long-press link above';
        }
      });

      container.querySelector('#premium-intake-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        await submitIntake({
          name: fd.get('name'),
          contact: fd.get('contact'),
          question: fd.get('question'),
          questionType: fd.get('questionType'),
        });
        if (onUnlock) onUnlock();
      });
    });
  }

  global.NexxPaywall = {
    loadConfig,
    sessionId,
    venmoUrl,
    qrUrl,
    isUnlocked,
    unlock,
    getUnlockData,
    submitIntake,
    renderPaywall,
  };
})(typeof window !== 'undefined' ? window : globalThis);
