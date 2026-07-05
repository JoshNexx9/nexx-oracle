/**
 * NEXX Oracle — sigil pull, mantra pull, rune throwing
 */
(function () {
  const STORAGE_KEY = 'nexx-oracle-v1';
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  let sigils = [];
  let mantras = [];
  let runes = [];
  let runeCount = 1;
  let lastSigil = null;
  let lastMantra = null;
  let lastRuneCast = null;

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function hashSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h >>> 0);
  }

  function getIntention() {
    return {
      question: ($('#question-text').value || '').trim(),
      type: $('#question-type').value,
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
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (saved.type) sel.value = saved.type;
      if (saved.question) $('#question-text').value = saved.question;
      if (saved.tab) switchTab(saved.tab);
    } catch (_) { /* */ }
    const hint = () => {
      const m = NexxReadings.QUESTION_TYPES[sel.value];
      $('#question-type-hint').textContent = m ? m.hint : '';
    };
    hint();
    sel.addEventListener('change', savePrefs);
    $('#question-text').addEventListener('input', savePrefs);
  }

  function savePrefs() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      type: $('#question-type').value,
      question: $('#question-text').value,
      tab: document.querySelector('.oracle-tab.active')?.dataset.tab || 'sigil',
    }));
  }

  function switchTab(tab) {
    $$('.oracle-tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    $$('.oracle-panel').forEach((p) => {
      const on = p.id === `panel-${tab}`;
      p.hidden = !on;
      p.classList.toggle('active', on);
    });
    $('#oracle-status').textContent = tab;
    savePrefs();
  }

  /* ── SIGIL ── */
  function drawSigil(canvas, sigil, seed) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    ctx.clearRect(0, 0, w, h);

    const bg = ctx.createRadialGradient(cx, cy, 20, cx, cy, w * 0.7);
    bg.addColorStop(0, '#1a1030');
    bg.addColorStop(1, '#05050f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    for (let i = 0; i < w; i += 24) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
    }
    for (let j = 0; j < h; j += 24) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(w, j); ctx.stroke();
    }

    const rng = (n) => (Math.sin(seed * n * 12.9898) * 43758.5453) % 1;
    const glyphs = {
      break: () => {
        ctx.strokeStyle = '#ff2bd6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 90, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - 70, cy - 70);
        ctx.lineTo(cx + 70, cy + 70);
        ctx.moveTo(cx + 70, cy - 70);
        ctx.lineTo(cx - 70, cy + 70);
        ctx.stroke();
      },
      shield: () => {
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i - Math.PI / 2;
          const x = cx + 100 * Math.cos(a);
          const y = cy + 100 * Math.sin(a);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, 40, 0, Math.PI * 2);
        ctx.stroke();
      },
      star: () => {
        ctx.strokeStyle = '#ffd56b';
        ctx.fillStyle = 'rgba(255, 213, 107, 0.2)';
        const pts = [];
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI / 4) * i - Math.PI / 2;
          const r = i % 2 === 0 ? 100 : 42;
          pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
        }
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      },
      raven: () => {
        ctx.fillStyle = '#8b5cff';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 10, 50, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 40, cy - 10);
        ctx.lineTo(cx + 80, cy - 50);
        ctx.lineTo(cx + 55, cy);
        ctx.fill();
      },
      lantern: () => {
        ctx.strokeStyle = '#00f0ff';
        ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
        ctx.fillRect(cx - 30, cy - 20, 60, 80);
        ctx.strokeRect(cx - 30, cy - 20, 60, 80);
        ctx.beginPath();
        ctx.arc(cx, cy - 30, 25, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, cy - 55);
        ctx.lineTo(cx, cy - 90);
        ctx.stroke();
      },
      moon: () => {
        ctx.strokeStyle = '#c8d8ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx - 15, cy, 70, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#05050f';
        ctx.beginPath();
        ctx.arc(cx + 10, cy - 10, 60, 0, Math.PI * 2);
        ctx.fill();
      },
      flame: () => {
        ctx.fillStyle = '#ff2bd6';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 90);
        ctx.quadraticCurveTo(cx + 60, cy, cx, cy + 80);
        ctx.quadraticCurveTo(cx - 60, cy, cx, cy - 90);
        ctx.fill();
        ctx.strokeStyle = '#ffd56b';
        ctx.stroke();
      },
      eye: () => {
        ctx.strokeStyle = '#00f0ff';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 100, 50, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ff2bd6';
        ctx.beginPath();
        ctx.arc(cx, cy, 28, 0, Math.PI * 2);
        ctx.fill();
      },
      root: () => {
        ctx.strokeStyle = '#5dffb0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 80);
        ctx.lineTo(cx, cy + 60);
        for (let i = -2; i <= 2; i++) {
          ctx.moveTo(cx, cy + 20);
          ctx.quadraticCurveTo(cx + i * 40, cy + 80, cx + i * 55, cy + 100);
        }
        ctx.stroke();
      },
      spiral: () => {
        ctx.strokeStyle = '#00f0ff';
        ctx.beginPath();
        for (let t = 0; t < 40; t++) {
          const a = t * 0.35;
          const r = 8 + t * 2.2;
          const x = cx + r * Math.cos(a);
          const y = cy + r * Math.sin(a);
          if (t === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      },
    };

    const drawExtra = glyphs[sigil.glyph] || glyphs.spiral;
    drawExtra();

    const ringCount = 3 + Math.floor(rng(1) * 4);
    for (let r = 0; r < ringCount; r++) {
      ctx.strokeStyle = `rgba(255, 43, 214, ${0.15 + r * 0.08})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 50 + r * 22 + rng(2) * 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    const dots = 8 + Math.floor(rng(3) * 8);
    ctx.fillStyle = '#00f0ff';
    for (let i = 0; i < dots; i++) {
      const a = rng(i + 4) * Math.PI * 2;
      const rad = 60 + rng(i + 5) * 80;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(255, 213, 107, 0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, w - 24, h - 24);
  }

  function castSigil() {
    const { question, type } = getIntention();
    const seed = hashSeed(`${Date.now()}-${question}-${type}`);
    const sigil = sigils[seed % sigils.length];
    lastSigil = { sigil, seed, question, type };
    drawSigil($('#sigil-canvas'), sigil, seed);

    const q = question || 'your intention';
    const typeLabel = NexxReadings.QUESTION_TYPES[type]?.label || 'General';
    $('#sigil-readout').innerHTML = `
      <p class="meta">${typeLabel} · ${sigil.intent}</p>
      <h2>${sigil.name}</h2>
      <p class="keyword">${sigil.keyword} For "${q}".</p>
      <div class="nexx-move">
        <h3>▶ NEXX Move</h3>
        <p>${sigil.nexx_move}</p>
      </div>
      <div class="actions">
        <button type="button" class="primary" id="btn-sigil">Cast Again</button>
        <button type="button" id="btn-sigil-save">Save Sigil</button>
      </div>
    `;
    $('#btn-sigil').addEventListener('click', castSigil);
    $('#btn-sigil-save').addEventListener('click', saveSigil);
    $('#oracle-status').textContent = 'sigil cast';
  }

  function saveSigil() {
    const canvas = $('#sigil-canvas');
    const a = document.createElement('a');
    a.download = `nexx-sigil-${lastSigil?.sigil?.id || 'cast'}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  }

  /* ── MANTRA ── */
  function castMantra() {
    const { question, type } = getIntention();
    const idx = Math.floor(Math.random() * mantras.length);
    const mantra = mantras[idx];
    lastMantra = { mantra, question, type };

    $('#mantra-display').textContent = `"${mantra.mantra}"`;
    $('#breath-guide').textContent = `breath · ${mantra.breath} (in-hold-out)`;
    $('#mantra-tone').textContent = mantra.tone.toUpperCase();
    $('#mantra-note').textContent = mantra.mantra;
    $('#mantra-move').textContent = mantra.nexx_move;

    const ring = $('#mantra-ring');
    ring.classList.remove('pulse');
    void ring.offsetWidth;
    ring.classList.add('pulse');
    ring.textContent = mantra.tone;

    $('#oracle-status').textContent = 'mantra pulled';
  }

  function copyMantra() {
    if (!lastMantra) return;
    const t = `${lastMantra.mantra.mantra}\n\nBreath: ${lastMantra.mantra.breath}\n▶ ${lastMantra.mantra.nexx_move}`;
    if (typeof NexxCopy !== 'undefined') {
      NexxCopy.fromButton($('#btn-mantra-copy'), t);
    }
  }

  /* ── RUNES ── */
  function throwRunes() {
    const { question, type } = getIntention();
    const main = runeCount;
    const total = main + 1;
    const bag = shuffle(runes);
    const picked = bag.slice(0, total).map((r) => ({
      ...r,
      reversed: Math.random() < 0.28,
    }));

    const cloth = $('#rune-cloth');
    cloth.innerHTML = '<p class="cloth-label">casting cloth</p>';
    $('#rune-readout').hidden = false;

    const positions = [];
    const cw = cloth.clientWidth || 600;
    const ch = cloth.clientHeight || 280;
    for (let i = 0; i < total; i++) {
      positions.push({
        x: 40 + Math.random() * (cw - 120),
        y: 40 + Math.random() * (ch - 100),
        rot: (Math.random() - 0.5) * 50,
      });
    }

    picked.forEach((rune, i) => {
      const isClarity = i === total - 1;
      const pos = positions[i];
      const tile = document.createElement('div');
      tile.className = `rune-stone reveal-anim${isClarity ? ' clarity-rune' : ''}${rune.reversed ? ' reversed' : ''}`;
      tile.style.left = `${pos.x}px`;
      tile.style.top = `${pos.y}px`;
      tile.style.transform = `rotate(${pos.rot}deg)`;
      tile.style.animationDelay = `${i * 0.12}s`;
      tile.innerHTML = `
        <span class="rune-char">${rune.rune}</span>
        <span class="rune-pos">${isClarity ? 'Clarity' : ['Cast', 'Weave', 'Bind', 'Mark', 'Seal', 'Thread'][i] || `Rune ${i + 1}`}</span>
        <span class="rune-name">${rune.name}${rune.reversed ? ' ↓' : ''}</span>
      `;
      tile.addEventListener('click', () => showRuneDetail(rune, isClarity));
      cloth.appendChild(tile);
    });

    const clarity = picked[picked.length - 1];
    const q = question || 'your path';
    const lines = picked.map((r, i) => {
      const pos = i === total - 1 ? 'Clarity' : `Rune ${i + 1}`;
      const dir = r.reversed ? ' (reversed)' : '';
      return `${pos}: ${r.name}${dir} — ${r.reversed ? 'Internalize: ' : ''}${r.keyword} ${r.nexx_move}`;
    });

    $('#rune-results').innerHTML = picked.map((r, i) => {
      const pos = i === total - 1 ? 'Clarity' : `Rune ${i + 1}`;
      const cls = i === total - 1 ? ' clarity-line' : '';
      return `<div class="answer-line${cls}">
        <span class="answer-pos">${pos}</span>
        <div><strong>${r.rune} ${r.name}</strong>
        <p>${r.reversed ? '↓ reversed · ' : ''}${r.meaning}</p></div>
      </div>`;
    }).join('');

    $('#rune-synthesis').textContent =
      `On "${q}", the cast opens with ${picked[0].name} and seals with Clarity rune ${clarity.name}. `
      + `${clarity.nexx_move}`;

    lastRuneCast = { picked, question: q, type, lines };
    $('#oracle-status').textContent = `${main} + clarity`;
  }

  function showRuneDetail(rune, isClarity) {
    $('#rune-synthesis').textContent =
      `${isClarity ? 'Clarity · ' : ''}${rune.name}: ${rune.meaning} ▶ ${rune.nexx_move}`;
  }

  function exportRunes() {
    if (!lastRuneCast) return;
    const text = [
      'NEXX Oracle · Rune Cast',
      new Date().toISOString(),
      `Question: ${lastRuneCast.question}`,
      '',
      ...lastRuneCast.lines,
      '',
      'SYNTHESIS',
      $('#rune-synthesis').textContent,
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = 'nexx-rune-cast.txt';
    a.click();
  }

  async function init() {
    const [s, m, r] = await Promise.all([
      fetch('data/sigils.json').then((x) => x.json()),
      fetch('data/mantras.json').then((x) => x.json()),
      fetch('data/runes.json').then((x) => x.json()),
    ]);
    sigils = s;
    mantras = m;
    runes = r;
    initQuestionTypes();

    $$('.oracle-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    $('#btn-sigil').addEventListener('click', castSigil);
    $('#btn-sigil-save').addEventListener('click', saveSigil);
    $('#btn-mantra').addEventListener('click', castMantra);
    $('#btn-mantra-copy').addEventListener('click', copyMantra);
    $('#btn-runes').addEventListener('click', throwRunes);
    $('#btn-runes-top').addEventListener('click', throwRunes);
    $('#btn-runes-export').addEventListener('click', exportRunes);

    $$('.rune-preset').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('.rune-preset').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        runeCount = Number(btn.dataset.count);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
