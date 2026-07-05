/**
 * NEXX Tarot — Daily Relief Protocol
 * One card per calendar day. Deterministic + persisted.
 */
(function () {
  const STORAGE_KEY = 'nexx-tarot-v1';
  const HISTORY_KEY = 'nexx-tarot-history-v1';
  const QUESTION_KEY = 'nexx-tarot-question-v1';
  const SALT = 'NEXX-RELIEF-2026';

  const $ = (sel) => document.querySelector(sel);

  let deck = [];
  let currentCard = null;

  function todayKey() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  function hashDay(dateStr) {
    let h = 2166136261;
    const s = dateStr + SALT;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h >>> 0);
  }

  function cardForDate(dateStr) {
    const idx = hashDay(dateStr) % deck.length;
    return deck[idx];
  }

  function clarityForDate(dateStr, excludeId) {
    for (let salt = 0; salt < 32; salt++) {
      let h = 2166136261;
      const s = `${dateStr}-CLARITY-${salt}${SALT}`;
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      const idx = Math.abs(h >>> 0) % deck.length;
      const card = deck[idx];
      if (card.id !== excludeId) return card;
    }
    return deck[(hashDay(dateStr) + 1) % deck.length];
  }

  function cardFromQuery() {
    const raw = new URLSearchParams(location.search).get('card');
    if (!raw) return null;
    const key = raw.toLowerCase().trim();
    return deck.find((c) => {
      if (c.id === key || c.id === key.padStart(2, '0')) return true;
      const slug = c.name.toLowerCase().replace(/^the\s+/, '').replace(/\s+/g, '-');
      return slug === key || slug.replace(/-/g, '') === key.replace(/-/g, '');
    }) || null;
  }

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function pushHistory(dateStr, card) {
    const hist = loadHistory().filter((h) => h.date !== dateStr);
    hist.unshift({ date: dateStr, id: card.id, name: card.name });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(0, 30)));
  }

  function artUrl(card) {
    return card.art + (card.art.endsWith('.jpg') ? '' : '');
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

  function getQuestionContext() {
    return {
      question: $('#question-text').value.trim(),
      questionType: $('#question-type').value,
    };
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
    const updateHint = () => {
      const meta = NexxReadings.QUESTION_TYPES[sel.value];
      $('#question-type-hint').textContent = meta ? meta.hint : '';
    };
    updateHint();
    sel.addEventListener('change', () => {
      updateHint();
      saveQuestion();
      if (currentCard) renderReadingPair(currentCard);
    });
    $('#question-text').addEventListener('input', () => {
      saveQuestion();
      if (currentCard) renderReadingPair(currentCard);
    });
  }

  let currentClarity = null;

  function renderReadingPair(mainCard) {
    const dateStr = todayKey();
    const clarity = clarityForDate(dateStr, mainCard.id);
    currentClarity = clarity;
    const reading = NexxReadings.generateReading({
      ...getQuestionContext(),
      cards: [mainCard, clarity],
      withClarity: true,
    });

    const panel = $('#daily-answer');
    panel.hidden = false;
    const mainLine = reading.lines.find((l) => !l.isClarity) || reading.lines[0];
    $('#answer-text').textContent = mainLine.text;

    const badge = $('#verdict-badge');
    if (reading.verdict) {
      badge.hidden = false;
      badge.textContent = reading.verdict.text;
      badge.className = `verdict-badge tone-${reading.verdict.tone}`;
    } else {
      badge.hidden = true;
    }

    const clarityLine = reading.lines.find((l) => l.isClarity);
    const block = $('#clarity-block');
    block.hidden = false;
    $('#clarity-art').src = artUrl(clarity);
    $('#clarity-id').textContent = `${clarity.arcana} · ${clarity.id}`;
    $('#clarity-name').textContent = clarity.name;
    $('#clarity-answer').textContent = clarityLine ? clarityLine.text : clarity.nexx_move;

    return reading;
  }

  function renderMyth(card) {
    const myth = NexxReadings.mythFor(card);
    const block = $('#myth-block');
    if (!myth?.legend) {
      block.hidden = true;
      return;
    }
    block.hidden = false;
    $('#myth-deity').textContent = myth.deity ? `Deity: ${myth.deity}` : (myth.deities || '');
    $('#myth-legend').textContent = myth.legend;
    $('#myth-science').textContent = myth.science ? `Code: ${myth.science}` : '';
  }

  function renderCard(card, dateStr, isNew, mode = 'daily') {
    currentCard = card;
    const panel = $('#reading-panel');
    panel.classList.remove('reveal-anim');
    void panel.offsetWidth;
    panel.classList.add('reveal-anim');

    $('#card-name').textContent = card.name;
    $('#card-id').textContent = `${card.arcana} · ${card.id}${mode === 'extra' ? ' · extra pull' : ''}`;
    $('#card-keyword').textContent = card.keyword || card.meaning;
    $('#nexx-move-text').textContent = card.nexx_move;
    renderMyth(card);
    $('#today-label').textContent = mode === 'extra' ? `${todayKey()} · extra` : dateStr;
    $('#card-art').src = artUrl(card);
    $('#card-art').alt = card.name;

    const cardEl = $('#daily-card');
    cardEl.classList.add('flipped');
    cardEl.setAttribute('aria-label', `Today's card: ${card.name}`);

    renderReadingPair(card);

    if (isNew) {
      pushHistory(dateStr, card);
    }
    renderHistory();
  }

  function renderHistory() {
    const list = $('#history-list');
    list.innerHTML = '';
    loadHistory().forEach((h) => {
      const row = document.createElement('div');
      row.className = 'history-item';
      row.innerHTML = `<span>${h.name}</span><span>${h.date}</span>`;
      list.appendChild(row);
    });
  }

  function drawToday(force = false) {
    const dateStr = todayKey();
    const state = loadState();
    let card;
    let isNew = false;

    if (!force && state.date === dateStr && state.cardId) {
      card = deck.find((c) => c.id === state.cardId) || cardForDate(dateStr);
    } else {
      card = cardForDate(dateStr);
      saveState({ date: dateStr, cardId: card.id });
      isNew = true;
    }

    renderCard(card, dateStr, isNew, 'daily');
    return card;
  }

  function randomCard(excludeId) {
    if (!deck.length) return null;
    const pool = excludeId ? deck.filter((c) => c.id !== excludeId) : deck;
    const pick = pool[Math.floor(Math.random() * pool.length)] || deck[0];
    return pick;
  }

  function pullAgain() {
    const dateStr = todayKey();
    const exclude = currentCard?.id;
    const card = randomCard(exclude);
    renderCard(card, `${dateStr} · fresh pull`, false, 'extra');
    pushHistory(`${dateStr}*`, card);
    renderHistory();
    $('#daily-card').classList.add('flipped');
    const hint = $('#pull-again-hint');
    if (hint) {
      hint.innerHTML = `Fresh card drawn. Your <strong>daily lock</strong> (${loadState().cardId || '—'}) still resets at midnight.`;
    }
    return card;
  }

  function shareText(card) {
    const dateStr = todayKey();
    const reading = NexxReadings.generateReading({
      ...getQuestionContext(),
      cards: [card, currentClarity || clarityForDate(dateStr, card.id)],
      withClarity: true,
    });
    return NexxReadings.formatExport(reading, `NEXX Tarot · ${dateStr}`);
  }

  async function init() {
    const res = await fetch('data/deck.json');
    deck = await res.json();
    await NexxReadings.loadMythology();
    initQuestionTypes();

    $('#daily-card').addEventListener('click', () => {
      $('#daily-card').classList.toggle('flipped');
    });

    $('#btn-reveal').addEventListener('click', () => {
      drawToday(false);
      $('#daily-card').classList.add('flipped');
      const hint = $('#pull-again-hint');
      if (hint) {
        hint.innerHTML = 'Change your question type anytime. <strong>Pull Again</strong> draws a fresh card — daily lock stays until midnight.';
      }
    });

    $('#btn-pull-again').addEventListener('click', () => {
      pullAgain();
    });

    $('#btn-share').addEventListener('click', async () => {
      const dateStr = todayKey();
      const state = loadState();
      const card = deck.find((c) => c.id === state.cardId) || cardForDate(dateStr);
      const text = shareText(card);
      try {
        if (navigator.share) {
          await navigator.share({ title: 'NEXX Tarot', text });
          return;
        }
      } catch (_) { /* user cancelled share */ }
      if (typeof NexxCopy !== 'undefined') {
        const ok = await NexxCopy.fromButton($('#btn-share'), text);
        if (!ok) return;
        setTimeout(() => { $('#btn-share').textContent = 'Share Pull'; }, 2000);
      }
    });

    $('#btn-journal').addEventListener('click', () => {
      const dateStr = todayKey();
      const state = loadState();
      const card = deck.find((c) => c.id === state.cardId) || cardForDate(dateStr);
      const blob = new Blob([shareText(card) + '\n\n---\n'], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `nexx-tarot-${dateStr}.txt`;
      a.click();
      URL.revokeObjectURL(a.href);
    });

    const featured = cardFromQuery();
    setTimeout(() => {
      if (featured) {
        renderCard(featured, todayKey(), false);
        $('#today-label').textContent = `${todayKey()} · featured`;
      } else {
        drawToday(false);
      }
      $('#daily-card').classList.add('flipped');
    }, 600);

    renderHistory();
  }

  document.addEventListener('DOMContentLoaded', init);
})();