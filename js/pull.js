/**
 * NEXX Cipher — 52-card pull engine + question readings
 */
(function () {
  const STORAGE_KEY = 'nexx-cipher-v1';
  const QUESTION_KEY = 'nexx-cipher-question-v1';

  const $ = (sel) => document.querySelector(sel);

  let deck = [];
  let remaining = [];
  let currentSpread = [];
  let currentReading = null;
  let lineByCardId = new Map();

  function loadRemaining() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && Array.isArray(saved.remaining) && saved.remaining.length) {
        const valid = saved.remaining.every((id) => deck.some((c) => c.id === id));
        if (valid && saved.remaining.length <= 52) return saved.remaining;
      }
    } catch (_) { /* fresh deck */ }
    return deck.map((c) => c.id);
  }

  function saveRemaining() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      remaining,
      lastPull: currentSpread.map((c) => c.id),
      updated: new Date().toISOString(),
    }));
  }

  function loadQuestion() {
    try {
      return JSON.parse(localStorage.getItem(QUESTION_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveQuestion() {
    localStorage.setItem(QUESTION_KEY, JSON.stringify({
      type: $('#question-type').value,
      text: $('#question-text').value.trim(),
    }));
  }

  function initQuestionTypes() {
    const sel = $('#question-type');
    Object.entries(NexxReadings.QUESTION_TYPES).forEach(([id, meta]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = meta.label;
      sel.appendChild(opt);
    });
    const saved = loadQuestion();
    if (saved.type) sel.value = saved.type;
    if (saved.text) $('#question-text').value = saved.text;
    updateTypeHint();
    sel.addEventListener('change', () => { updateTypeHint(); saveQuestion(); });
    $('#question-text').addEventListener('input', saveQuestion);
  }

  function updateTypeHint() {
    const type = $('#question-type').value;
    const meta = NexxReadings.QUESTION_TYPES[type];
    $('#question-type-hint').textContent = meta ? meta.hint : '';
  }

  function getQuestionContext() {
    return {
      question: $('#question-text').value.trim(),
      questionType: $('#question-type').value,
    };
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function cardById(id) {
    return deck.find((c) => c.id === id);
  }

  function updateDeckStatus() {
    $('#deck-status').textContent = `${remaining.length} / 52 ready`;
    const hint = $('#pull-hint');
    if (remaining.length === 0) {
      hint.textContent = 'Deck empty. Reshuffle to pull again.';
    } else if (remaining.length < 52) {
      hint.textContent = `${52 - remaining.length} card(s) already pulled this cycle. Reshuffle to reset.`;
    } else {
      hint.textContent = 'Set your question, then pull. Every reading adds a final Clarity card (+1).';
    }
  }

  function setPullCount(n) {
    const clamped = Math.max(1, Math.min(52, n));
    $('#pull-count').value = clamped;
    $('#pull-count-label').textContent = String(clamped);
  }

  function renderReading(reading) {
    currentReading = reading;
    lineByCardId = new Map(reading.lines.map((l) => [l.card.id, l]));

    const panel = $('#answer-panel');
    panel.hidden = false;
    panel.classList.remove('reveal-anim');
    void panel.offsetWidth;
    panel.classList.add('reveal-anim');

    $('#answer-question').textContent =
      `${reading.questionTypeLabel} · "${reading.question}"`;

    const badge = $('#verdict-badge');
    if (reading.verdict) {
      badge.hidden = false;
      badge.textContent = reading.verdict.text;
      badge.className = `verdict-badge tone-${reading.verdict.tone}`;
    } else {
      badge.hidden = true;
    }

    const linesEl = $('#answer-lines');
    linesEl.innerHTML = '';
    reading.lines.forEach((line) => {
      const row = document.createElement('div');
      row.className = `answer-line${line.isClarity ? ' clarity-line' : ''}`;
      row.innerHTML = `
        <span class="answer-pos">${line.position}</span>
        <div>
          <strong>${line.card.name}</strong>
          <p>${line.text}</p>
        </div>
      `;
      linesEl.appendChild(row);
    });

    $('#answer-synthesis').textContent = reading.synthesis;
  }

  function showDetail(card) {
    const panel = $('#card-detail');
    panel.hidden = false;
    panel.classList.remove('reveal-anim');
    void panel.offsetWidth;
    panel.classList.add('reveal-anim');
    $('#detail-id').textContent = `${card.suit_label} ${card.suit_symbol} · ${card.rank}`;
    $('#detail-name').textContent = card.name;
    $('#detail-keyword').textContent = card.keyword;
    $('#detail-move').textContent = card.nexx_move;

    const line = lineByCardId.get(card.id);
    const ans = $('#detail-answer');
    if (line) {
      ans.hidden = false;
      ans.textContent = line.text;
    } else {
      ans.hidden = true;
    }
  }

  function renderSpread(cards) {
    const section = $('#spread-section');
    const grid = $('#spread-grid');
    grid.innerHTML = '';
    section.hidden = false;

    const reading = NexxReadings.generateReading({
      ...getQuestionContext(),
      cards,
    });
    renderReading(reading);

    const now = new Date().toLocaleString();
    const mainN = reading.clarityCard ? cards.length - 1 : cards.length;
    const spreadLabel = reading.clarityCard && mainN > 0
      ? `${mainN} + Clarity`
      : `${cards.length} card${cards.length === 1 ? '' : 's'}`;
    $('#spread-meta').textContent =
      `${spreadLabel} · ${reading.questionTypeLabel} · ${now}`;

    cards.forEach((card, i) => {
      const line = reading.lines[i];
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = `spread-card reveal-anim${line && line.isClarity ? ' clarity-card' : ''}`;
      tile.style.animationDelay = `${i * 0.04}s`;
      tile.innerHTML = `
        <span class="spread-pos">${line ? line.position : i + 1}</span>
        <img src="${card.art}" alt="${card.name}" loading="lazy" />
        <span class="spread-label">${card.rank}${card.suit_symbol}</span>
        <span class="spread-name">${card.name}</span>
      `;
      tile.addEventListener('click', () => {
        document.querySelectorAll('.spread-card').forEach((el) => el.classList.remove('selected'));
        tile.classList.add('selected');
        showDetail(card);
      });
      grid.appendChild(tile);
    });

    if (cards.length) showDetail(cards[0]);
  }

  function pull(count) {
    if (!remaining.length) {
      $('#pull-hint').textContent = 'Deck empty — hit Reshuffle first.';
      return [];
    }
    saveQuestion();
    let main = Math.min(count, Math.max(0, remaining.length - 1));
    if (remaining.length === 1) main = 0;
    const total = main + 1;
    const shuffled = shuffle(remaining);
    const ids = shuffled.slice(0, total);
    remaining = shuffled.slice(total);
    const cards = ids.map(cardById).filter(Boolean);
    currentSpread = cards;
    saveRemaining();
    updateDeckStatus();
    renderSpread(cards);
    return cards;
  }

  function reshuffle() {
    remaining = shuffle(deck.map((c) => c.id));
    currentSpread = [];
    currentReading = null;
    lineByCardId = new Map();
    saveRemaining();
    updateDeckStatus();
    $('#spread-section').hidden = true;
    $('#card-detail').hidden = true;
    $('#answer-panel').hidden = true;
    $('#pull-hint').textContent = 'Fresh shuffle. All 52 cards back in play.';
  }

  function exportSpread() {
    if (!currentSpread.length) return;
    const text = currentReading
      ? NexxReadings.formatExport(currentReading, 'NEXX Cipher')
      : buildBasicExport();
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nexx-cipher-reading-${currentSpread.length}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function buildBasicExport() {
    const lines = [
      'NEXX Cipher · Spread Export',
      new Date().toISOString(),
      `${currentSpread.length} cards · ${remaining.length} left in deck`,
      '',
    ];
    currentSpread.forEach((c, i) => {
      lines.push(`${i + 1}. ${c.name} (${c.id})`);
      lines.push(`   ${c.keyword}`);
      lines.push(`   ▶ NEXX MOVE: ${c.nexx_move}`);
      lines.push('');
    });
    return lines.join('\n');
  }

  async function init() {
    const res = await fetch('data/cipher-deck.json');
    deck = await res.json();
    await NexxReadings.loadMythology();
    remaining = loadRemaining();
    initQuestionTypes();
    updateDeckStatus();

    const slider = $('#pull-count');
    slider.addEventListener('input', () => {
      $('#pull-count-label').textContent = slider.value;
    });

    document.querySelectorAll('.preset').forEach((btn) => {
      btn.addEventListener('click', () => setPullCount(Number(btn.dataset.count)));
    });

    $('#btn-pull').addEventListener('click', () => {
      pull(Number($('#pull-count').value));
    });

    $('#btn-reshuffle').addEventListener('click', reshuffle);
    $('#btn-export').addEventListener('click', exportSpread);

    const params = new URLSearchParams(location.search);
    const countParam = params.get('count') || params.get('pull');
    if (countParam) {
      const n = Math.min(52, Math.max(1, parseInt(countParam, 10) || 5));
      setPullCount(n);
      if (params.get('auto') === '1') {
        reshuffle();
        pull(n);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
