/**
 * NEXX Growth Lab — double your TikTok subs @JoshNexx9
 */
(function () {
  const TIKTOK = 'https://www.tiktok.com/@JoshNexx9';
  const HANDLE = '@JoshNexx9';
  const STORAGE = 'nexx-grow-v1';

  const $ = (id) => document.getElementById(id);

  const BIOS = [
    {
      label: 'Direct · consult funnel',
      text: '◈ cyberpunk tarot · real directives not vague fluff\nDaily pulls · cipher deck · oracle sigils\n▶ DM "CONSULT" for your personal reading\n$50 premium sessions ↓ link in bio',
    },
    {
      label: 'Mystic · aesthetic',
      text: 'neon gospel tarot ◈ @JoshNexx9\none card · one NEXX move · relief protocol\nfree pulls in bio · $50 extended reads available',
    },
    {
      label: 'Relatable · spiral breaker',
      text: 'I pull cards so you don\'t spiral alone\nNEXX Tarot · Cipher · Oracle · Josh Nexx\nDM CONSULT · premium readings $50',
    },
  ];

  const PILLARS = [
    { name: 'Daily Pull POV', pct: 35, desc: '15–30s card reveal + NEXX move. Highest FYP potential.' },
    { name: 'Storytime Reading', pct: 25, desc: 'You react to a pull. Builds trust + watch time.' },
    { name: 'Hot Take / Cipher', pct: 15, desc: 'Bold keyword takes. Comment bait = algorithm fuel.' },
    { name: 'Oracle / Sigil', pct: 15, desc: 'Visual variety. Differentiates from generic tarot.' },
    { name: 'Premium CTA', pct: 10, desc: '1×/week $50 session tease. Converts followers to paid.' },
  ];

  const CHECKLIST = [
    { id: 'post', label: 'Post today\'s content (use Studio)' },
    { id: 'hook3', label: 'Hook lands in first 3 seconds' },
    { id: 'cta', label: 'CTA: DM CONSULT or link in bio' },
    { id: 'pin', label: 'Pin comment with consult link' },
    { id: 'reply', label: 'Reply to 10+ comments within 1hr' },
    { id: 'duet', label: 'Enable duet/stitch on pull videos' },
    { id: 'bio', label: 'Bio has CONSULT + premium mention' },
    { id: 'cross', label: 'Cross-post hook to Stories/Threads' },
  ];

  const DAY_THEMES = [
    { theme: 'POV Daily Pull', vibe: 'pov', format: 'TikTok 15–30s', tip: 'Film card flip at 0:02. Text overlay = card name only first.' },
    { theme: 'Storytime Reading', vibe: 'storytime', format: 'TikTok 45–60s', tip: 'Start mid-sentence: "so I pulled [card] and—" cuts scroll.' },
    { theme: 'Hot Take Cipher', vibe: 'hottake', format: 'TikTok 20s', tip: 'Controversial keyword line. Ask "agree?" in caption.' },
    { theme: 'Soft Sunday Signal', vibe: 'soft', format: 'TikTok/Reels', tip: 'Gentle voice. Saves + shares spike on soft content.' },
    { theme: 'Oracle Sigil Cast', vibe: 'aesthetic', format: 'TikTok 30s', tip: 'Screen-record oracle.html sigil pull + glitch transition.' },
    { theme: 'CTA Consult Push', vibe: 'cta', format: 'TikTok 25s', tip: 'Show 3-card spread tease. "Full reading = DM CONSULT."' },
    { theme: 'Premium Showcase', vibe: 'premium', format: 'TikTok 40s', tip: 'Blurred premium letter reveal. $50 via @nexxsociety.' },
  ];

  const HOOK_PACK = [
    'POV: the algorithm sent you this card for a reason.',
    'nobody talks about what {card} actually means.',
    'if you\'re seeing this, you needed {card} today.',
    'storytime: I paid $50 for a reading and got {card}.',
    'unpopular opinion: {card} is the card you\'ve been avoiding.',
    '2am scroll stopper: {card} just called you out.',
    'comment your sign if {card} found you.',
    'this is your sign to DM CONSULT. but first — {card}.',
    'cyberpunk tarot hits different. today: {card}.',
    'save this if {card} is your 2026 energy.',
  ];

  let deck = [];
  let state = loadState();

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE) || '{}');
    } catch {
      return {};
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE, JSON.stringify(state));
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function seedFrom(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function pick(arr, seed) {
    return arr[seed % arr.length];
  }

  function cardForDay(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const key = d.toISOString().slice(0, 10);
    return deck[seedFrom(key) % deck.length];
  }

  function renderBios() {
    const el = $('bio-variants');
    el.innerHTML = BIOS.map((b, i) => `
      <article class="grow-bio panel">
        <div class="copy-block-head">
          <h3>${b.label}</h3>
          <button type="button" class="btn-copy" data-bio="${i}">Copy bio</button>
        </div>
        <pre class="copy-text">${b.text}</pre>
      </article>
    `).join('');
    el.querySelectorAll('[data-bio]').forEach((btn) => {
      btn.addEventListener('click', () => {
        NexxCopy.fromButton(btn, BIOS[Number(btn.dataset.bio)].text);
      });
    });
  }

  function renderPillars() {
    $('pillar-bars').innerHTML = PILLARS.map((p) => `
      <div class="grow-pillar">
        <div class="grow-pillar-head">
          <span>${p.name}</span>
          <strong>${p.pct}%</strong>
        </div>
        <div class="grow-pillar-bar"><span style="width:${p.pct}%"></span></div>
        <p>${p.desc}</p>
      </div>
    `).join('');
  }

  function renderCalendar() {
    const el = $('content-calendar');
    el.innerHTML = DAY_THEMES.map((day, i) => {
      const card = cardForDay(i);
      const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i];
      return `
        <article class="grow-day panel">
          <div class="grow-day-head">
            <span class="grow-day-num">Day ${i + 1}</span>
            <span class="grow-day-name">${dayName}</span>
          </div>
          <h3>${day.theme}</h3>
          <p class="grow-day-card">◈ ${card.name} · ${card.keyword}</p>
          <p class="grow-day-format">${day.format}</p>
          <p class="grow-day-tip">▶ ${day.tip}</p>
          <button type="button" class="btn-studio-day" data-vibe="${day.vibe}" data-card="${card.id}">Open in Studio →</button>
        </article>
      `;
    }).join('');

    el.querySelectorAll('.btn-studio-day').forEach((btn) => {
      btn.addEventListener('click', () => {
        const vibe = btn.dataset.vibe;
        const card = btn.dataset.card;
        location.href = `studio.html?vibe=${vibe}&card=${card}`;
      });
    });
  }

  function renderTodayMove() {
    const card = cardForDay(0);
    const seed = seedFrom(todayKey());
    const hook = HOOK_PACK[seed % HOOK_PACK.length].replace(/\{card\}/g, card.name);
    const dayIdx = new Date().getDay();
    const theme = DAY_THEMES[(dayIdx + 6) % 7];

    $('today-move-card').textContent = card.name;
    $('today-move-keyword').textContent = card.keyword;
    $('today-move-hook').textContent = hook;
    $('today-move-action').textContent = theme.tip;
    $('today-move-theme').textContent = theme.theme;
    $('today-move-art').src = card.art;
  }

  function renderHooks() {
    const card = cardForDay(0);
    const hooks = HOOK_PACK.map((h) => h.replace(/\{card\}/g, card.name));
    $('hook-pack').innerHTML = hooks.map((h, i) => `
      <div class="grow-hook-row">
        <span>${h}</span>
        <button type="button" class="btn-copy" data-hook="${i}">Copy</button>
      </div>
    `).join('');
    elBindHooks(hooks);
  }

  function elBindHooks(hooks) {
    $('hook-pack').querySelectorAll('[data-hook]').forEach((btn) => {
      btn.addEventListener('click', () => {
        NexxCopy.fromButton(btn, hooks[Number(btn.dataset.hook)]);
      });
    });
  }

  function renderLinkPack() {
    const pack = [
      'TikTok: ' + TIKTOK,
      'DM keyword: CONSULT',
      'Premium $50: https://venmo.com/nexxsociety?txn=pay&amount=50&note=NEXX%20Premium%20Reading',
      'Free daily pull: [your LAN URL]/tarot.html',
      'Cipher pull: [your LAN URL]/pull.html',
      'Oracle: [your LAN URL]/oracle.html',
    ].join('\n');
    $('link-pack-text').textContent = pack.replace(/\[your LAN URL\]/g, location.origin);
  }

  function renderChecklist() {
    const done = state.checklist || {};
    $('grow-checklist').innerHTML = CHECKLIST.map((c) => `
      <label class="grow-check">
        <input type="checkbox" data-check="${c.id}" ${done[c.id] ? 'checked' : ''} />
        <span>${c.label}</span>
      </label>
    `).join('');

    $('grow-checklist').querySelectorAll('input').forEach((cb) => {
      cb.addEventListener('change', () => {
        state.checklist = state.checklist || {};
        state.checklist[cb.dataset.check] = cb.checked;
        saveState();
        updateCheckProgress();
      });
    });
    updateCheckProgress();
  }

  function updateCheckProgress() {
    const done = state.checklist || {};
    const n = CHECKLIST.filter((c) => done[c.id]).length;
    $('check-progress').textContent = `${n} / ${CHECKLIST.length}`;
    $('check-bar').style.width = `${(n / CHECKLIST.length) * 100}%`;
  }

  function updateSubGoal() {
    const current = Math.max(0, parseInt($('sub-current').value, 10) || 0);
    const goal = current * 2;
    $('sub-goal').textContent = goal.toLocaleString();
    $('sub-remaining').textContent = goal > current ? (goal - current).toLocaleString() : '0';
    $('sub-progress-bar').style.width = current && goal ? `${Math.min(100, (current / goal) * 100)}%` : '0%';
    state.subs = current;
    saveState();
  }

  function renderFunnel() {
    $('funnel-stats').innerHTML = `
      <div class="grow-funnel-step"><span>Views (FYP)</span><strong>100%</strong></div>
      <div class="grow-funnel-step"><span>Profile visits</span><strong>8–12%</strong></div>
      <div class="grow-funnel-step"><span>New follows</span><strong>15–25% of visits</strong></div>
      <div class="grow-funnel-step"><span>DM CONSULT</span><strong>2–5% of followers</strong></div>
      <div class="grow-funnel-step gold"><span>Premium $50</span><strong>10–20% of consults</strong></div>
    `;
  }

  function copyLinkPack() {
    NexxCopy.fromButton($('btn-copy-links'), $('link-pack-text').textContent);
  }

  function copyAllHooks() {
    const text = Array.from($('hook-pack').querySelectorAll('.grow-hook-row span'))
      .map((s) => s.textContent)
      .join('\n');
    NexxCopy.fromButton($('btn-copy-hooks'), text);
  }

  function regenCalendar() {
    renderCalendar();
    NexxCopy.showToast('Calendar refreshed');
  }

  async function init() {
    const res = await fetch('data/deck.json');
    deck = await res.json();

    if (state.subs) $('sub-current').value = state.subs;

    renderBios();
    renderPillars();
    renderCalendar();
    renderTodayMove();
    renderHooks();
    renderLinkPack();
    renderChecklist();
    renderFunnel();
    updateSubGoal();

    $('sub-current').addEventListener('input', updateSubGoal);
    $('btn-copy-links').addEventListener('click', copyLinkPack);
    $('btn-copy-hooks').addEventListener('click', copyAllHooks);
    $('btn-regen-calendar').addEventListener('click', regenCalendar);
    $('btn-open-studio').addEventListener('click', () => {
      location.href = 'studio.html';
    });
    $('btn-copy-today').addEventListener('click', () => {
      const text = [
        'TODAY\'S GROWTH MOVE — ' + todayKey(),
        '',
        'Theme: ' + $('today-move-theme').textContent,
        'Card: ' + $('today-move-card').textContent,
        $('today-move-keyword').textContent,
        '',
        'Hook: ' + $('today-move-hook').textContent,
        '',
        'Action: ' + $('today-move-action').textContent,
        '',
        HANDLE + ' · ' + TIKTOK,
      ].join('\n');
      NexxCopy.fromButton($('btn-copy-today'), text);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();