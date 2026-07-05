/**
 * NEXX Premium Extended Reading — 7-card Celtic + Clarity
 */
(function () {
  const PREMIUM_POSITIONS = [
    'Present', 'Challenge', 'Root', 'Recent Past',
    'Crown', 'Near Future', 'Higher Self',
  ];

  const $ = (id) => document.getElementById(id);

  let deck = [];
  let currentReading = null;

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function deepSynthesis(reading, intake) {
    const cards = reading.lines.map((l) => l.card);
    const clarity = reading.clarityCard || cards[cards.length - 1];
    const present = cards[0];
    const challenge = cards[1];
    const name = intake?.name || 'seeker';
    const q = reading.question;

    return [
      `Dear ${name},`,
      '',
      `Your question — "${q}" — opened on ${present.name} in the Present position. `
      + `${present.keyword} This is where your energy lives right now.`,
      '',
      `The Challenge crossing you is ${challenge.name}: ${challenge.nexx_move}`,
      '',
      `Root cause runs through ${cards[2].name}. Crown aspiration: ${cards[4].name}. `
      + `Near future trends toward ${cards[5].name}.`,
      '',
      `Your Higher Self speaks through ${cards[6].name} — ${cards[6].nexx_move}`,
      '',
      `◆ CLARITY SEAL: ${clarity.name}`,
      clarity.nexx_move,
      '',
      `This is your extended NEXX reading. Josh Nexx may follow up personally via ${intake?.contact || 'your contact'} for deeper consultation.`,
      '',
      `— Josh Nexx · NEXX Tarot Premium · @JoshNexx9`,
    ].join('\n');
  }

  function generatePremiumReading(intake) {
    const picked = shuffle(deck).slice(0, 8);
    const main = picked.slice(0, 7);
    const clarity = picked[7];
    const cards = [...main, clarity];

    const reading = NexxReadings.generateReading({
      question: intake?.question || 'my path',
      questionType: intake?.questionType || 'general',
      cards,
      withClarity: true,
    });

    reading.lines.forEach((line, i) => {
      if (i < PREMIUM_POSITIONS.length && !line.isClarity) {
        const pos = PREMIUM_POSITIONS[i];
        line.position = pos;
        const q = intake?.question || 'your path';
        line.text = `${pos}: ${line.card.name} speaks to "${q}" — ${line.card.keyword.toLowerCase()} ${line.card.nexx_move}`;
      }
    });

    reading.premiumLetter = deepSynthesis(reading, intake);
    return reading;
  }

  function renderReading(reading) {
    currentReading = reading;
    const grid = $('premium-spread');
    grid.innerHTML = '';

    reading.lines.forEach((line, i) => {
      const tile = document.createElement('div');
      tile.className = `premium-card-tile${line.isClarity ? ' clarity-card' : ''}`;
      tile.innerHTML = `
        <span class="spread-pos">${line.position}</span>
        <img src="${line.card.art}" alt="${line.card.name}" />
        <strong>${line.card.name}</strong>
        <p>${line.card.keyword}</p>
      `;
      grid.appendChild(tile);
    });

    const linesEl = $('premium-lines');
    linesEl.innerHTML = reading.lines.map((l) => `
      <div class="answer-line${l.isClarity ? ' clarity-line' : ''}">
        <span class="answer-pos">${l.position}</span>
        <div><strong>${l.card.name}</strong><p>${l.text}</p></div>
      </div>
    `).join('');

    $('premium-synthesis').textContent = reading.synthesis;
    $('premium-letter').textContent = reading.premiumLetter;
  }

  function exportReading() {
    if (!currentReading) return;
    const intake = NexxPaywall.getUnlockData()?.intake || {};
    const text = [
      'NEXX PREMIUM EXTENDED READING',
      `Session: ${NexxPaywall.sessionId()}`,
      `Date: ${new Date().toISOString()}`,
      `Seeker: ${intake.name || '—'}`,
      `Question: ${currentReading.question}`,
      '',
      ...currentReading.lines.map((l) => `[${l.position}] ${l.card.name}\n${l.text}\n`),
      'SYNTHESIS',
      currentReading.synthesis,
      '',
      'PERSONAL LETTER',
      currentReading.premiumLetter,
      '',
      'Book follow-up: Venmo @nexxsociety · TikTok @JoshNexx9',
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = `nexx-premium-${NexxPaywall.sessionId()}.txt`;
    a.click();
  }

  function showApp() {
    $('paywall-mount').hidden = true;
    $('premium-app').hidden = false;
    const intake = NexxPaywall.getUnlockData()?.intake;
    if (intake?.question) {
      $('intake-question').textContent = `"${intake.question}"`;
      $('intake-name').textContent = intake.name || 'Seeker';
    }
    renderReading(generatePremiumReading(intake));
  }

  function showPaywall() {
    $('paywall-mount').hidden = false;
    $('premium-app').hidden = true;
    NexxPaywall.renderPaywall($('paywall-mount'), showApp);
  }

  async function init() {
    const res = await fetch('data/deck.json');
    deck = await res.json();
    await NexxPaywall.loadConfig();

    if (NexxPaywall.isUnlocked()) {
      showApp();
    } else {
      showPaywall();
    }

    $('btn-regenerate').addEventListener('click', () => {
      const intake = NexxPaywall.getUnlockData()?.intake;
      renderReading(generatePremiumReading(intake));
    });
    $('btn-export-premium').addEventListener('click', exportReading);
    $('btn-new-session').addEventListener('click', () => {
      if (confirm('Start new session? You will need to pay again for a new premium reading.')) {
        localStorage.removeItem('nexx-premium-v2');
        localStorage.removeItem('nexx-premium-session-id');
        showPaywall();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();