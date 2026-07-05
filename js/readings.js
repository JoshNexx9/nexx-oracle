/**
 * NEXX Readings — tarot magick synthesis · mythology · certainty field
 */
(function (global) {
  let mythology = null;

  const QUESTION_TYPES = {
    general: { label: 'General', hint: 'Open reading on any topic.', intro: 'The veil parts.' },
    yesno: { label: 'Yes / No', hint: 'Binary or leaning answer.', intro: 'The cards vote in whispers.' },
    love: { label: 'Love & Connection', hint: 'Relationships, chemistry, boundaries.', intro: 'Heart-lines trace your question.' },
    career: { label: 'Career & Money', hint: 'Work, projects, income, direction.', intro: 'The work-stack speaks.' },
    decision: { label: 'Decision', hint: 'Fork in the road — which way.', intro: 'Two paths shimmer. One brightens.' },
    shadow: { label: 'Shadow / Block', hint: 'What is hidden, stuck, or draining you.', intro: 'What was buried rises gently.' },
    timing: { label: 'Timing', hint: 'When, how fast, what season.', intro: 'The clock-suit reveals pace.' },
    self: { label: 'Self & Healing', hint: 'Inner work, recovery, identity.', intro: 'The mirror card turns inward.' },
    certainty: { label: 'Certainty', hint: 'Not answers — assurance that it works out.', intro: 'You did not come for data. You came to know you are safe.' },
  };

  const CLARITY_LABEL = 'Clarity';

  const MAIN_POSITIONS = {
    1: ['Answer'],
    2: ['Root', 'Path'],
    3: ['Context', 'Signal', 'Move'],
    4: ['Situation', 'Challenge', 'Focus', 'Outcome'],
    5: ['Situation', 'Friction', 'Truth', 'Hidden', 'Path'],
    7: ['Root', 'Now', 'Block', 'Allies', 'Risk', 'Gift', 'Outcome'],
    13: ['Self', 'Home', 'Mind', 'Past', 'Present', 'Future', 'Advice',
      'Environment', 'Hopes', 'Fears', 'Outcome', 'Action', 'Result'],
  };

  const OPENINGS = [
    (card, pos) => `${card.name} enters at ${pos}`,
    (card, pos) => `At ${pos}, ${card.name} speaks`,
    (card, pos) => `${pos} holds ${card.name}`,
    (card, pos) => `Through ${card.name} · ${pos}`,
  ];

  const BODY_GENERAL = [
    (card) => card.keyword.replace(/\.$/, ''),
    (card) => `the field hums: ${card.keyword.toLowerCase()}`,
    (card) => `energy reads ${card.keyword.toLowerCase()}`,
  ];

  const BODY_LOVE = [
    (card) => `the heart-channel carries ${card.keyword.toLowerCase()}`,
    (card) => `connection runs ${card.keyword.toLowerCase()}`,
  ];

  const BODY_CAREER = [
    (card) => `the work-current moves ${card.keyword.toLowerCase()}`,
    (card) => `professional weather: ${card.keyword.toLowerCase()}`,
  ];

  const BODY_SHADOW = [
    (card) => `beneath the surface: ${card.keyword.toLowerCase()}`,
    (card) => `the shadow names ${card.keyword.toLowerCase()}`,
  ];

  const BODY_SELF = [
    (card) => `your system asks for ${card.keyword.toLowerCase()}`,
    (card) => `healing vector: ${card.keyword.toLowerCase()}`,
  ];

  const MOVES = [
    (card) => `▶ ${card.nexx_move}`,
    (card) => `Ritual move: ${card.nexx_move}`,
    (card) => `Carry this: ${card.nexx_move}`,
  ];

  function setMythology(data) {
    mythology = data;
  }

  async function loadMythology() {
    if (mythology) return mythology;
    try {
      const res = await fetch('data/mythology.json');
      mythology = await res.json();
    } catch {
      mythology = { cards: {}, suits: {} };
    }
    return mythology;
  }

  function positionsForSpread(cards, withClarity = true) {
    const n = cards.length;
    const claritySlot = withClarity && n > 0;
    const mainCount = claritySlot ? n - 1 : n;
    let main;
    if (MAIN_POSITIONS[mainCount]) {
      main = [...MAIN_POSITIONS[mainCount]];
    } else {
      const base = MAIN_POSITIONS[7];
      main = [];
      for (let i = 0; i < mainCount; i++) {
        main.push(i < base.length ? base[i] : `Signal ${i + 1}`);
      }
    }
    if (claritySlot) main.push(CLARITY_LABEL);
    return main;
  }

  function isClarityPosition(position) {
    return position === CLARITY_LABEL;
  }

  function cardSeed(card, salt = 0) {
    let h = salt;
    const s = (card.id || '') + (card.name || '');
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function pick(arr, seed) {
    return arr[Math.abs(seed) % arr.length];
  }

  function rankValue(card) {
    const map = { A: 14, J: 11, Q: 12, K: 13 };
    const r = card.rank || card.id;
    if (map[r]) return map[r];
    const n = parseInt(r, 10);
    return Number.isFinite(n) ? n : 7;
  }

  function mythFor(card) {
    if (!mythology) return null;
    const key = card.id?.length <= 2 && /^\d+$/.test(card.id) ? card.id.padStart(2, '0') : card.id;
    return mythology.cards?.[key] || mythology.cards?.[card.id] || mythology.suits?.[card.suit] || null;
  }

  function mythWhisper(card, seed) {
    const m = mythFor(card);
    if (!m?.legend) return '';
    const parts = [m.legend];
    if (m.deity && seed % 3 === 0) parts.push(`(${m.deity})`);
    return parts.join(' ');
  }

  function rankValueScore(card) {
    let score = 0;
    const rv = rankValue(card);
    const suit = card.suit || '';

    if (rv >= 14) score += 2;
    else if (rv >= 11) score += 1;
    else if (rv <= 5) score -= 1;
    else if (rv >= 9) score -= 0.5;
    else score += 0.5;

    if (suit === 'sparks' || suit === 'wands' || suit === 'major') score += 1;
    if (suit === 'signal' || suit === 'cups') score += 0.75;
    if (suit === 'cache' || suit === 'pentacles') score += 0.5;
    if (suit === 'grid' || suit === 'swords') score -= 0.25;

    const positive = ['The Star', 'The Sun', 'The World', 'Wheel of Fortune', 'The Empress', 'Temperance'];
    const heavy = ['The Tower', 'The Devil', 'Three of Swords', 'Ten of Swords'];
    if (positive.includes(card.name)) score += 1.5;
    if (card.name === 'The Moon') score -= 0.5;
    if (heavy.includes(card.name)) score -= 0.75;

    if (global.NexxCertainty) score = NexxCertainty.biasScore(score);
    return score;
  }

  function verdictLabel(score) {
    let v;
    if (score >= 2.5) v = { text: 'LEAN YES', tone: 'yes' };
    else if (score >= 0.75) v = { text: 'YES — WITH PATIENCE', tone: 'yes' };
    else if (score <= -2.5) v = { text: 'LEAN NO', tone: 'no' };
    else if (score <= -0.75) v = { text: 'NOT YET', tone: 'maybe' };
    else v = { text: 'FORMING — LEAN YES', tone: 'yes' };
    if (global.NexxCertainty) v = NexxCertainty.softenVerdict(v);
    return v;
  }

  function questionEcho(question) {
    const q = (question || '').trim();
    return q || 'the thread you carry';
  }

  function weaveLine(type, card, pos, q, seed) {
    if (isClarityPosition(pos)) {
      const myth = mythWhisper(card, seed);
      let line = `${card.name} seals the reading on "${q}". ${card.keyword} `;
      line += pick(MOVES, seed)(card);
      if (myth) line += ` · ${myth}`;
      if (global.NexxCertainty) line = NexxCertainty.resonate(line, card, 'clarity');
      return line;
    }

    const open = pick(OPENINGS, seed)(card, pos);
    const bodies = {
      general: BODY_GENERAL,
      yesno: BODY_GENERAL,
      love: BODY_LOVE,
      career: BODY_CAREER,
      decision: BODY_GENERAL,
      shadow: BODY_SHADOW,
      timing: BODY_GENERAL,
      self: BODY_SELF,
      certainty: BODY_SELF,
    };
    const body = pick(bodies[type] || BODY_GENERAL, seed + 1)(card);
    const move = pick(MOVES, seed + 2)(card);
    const myth = mythWhisper(card, seed + 3);

    let line = `${open} — ${body}. ${move}`;
    if (myth && seed % 2 === 0) line += ` Myth-line: ${myth}`;
    if (type === 'timing') {
      const pace = rankValue(card) <= 5 ? 'swift' : rankValue(card) >= 10 ? 'slow-burn' : 'mid-cycle';
      line += ` Pace: ${pace}.`;
    }
    if (type === 'certainty') {
      line += ' The field already leans toward resolution.';
    }
    if (global.NexxCertainty && !isClarityPosition(pos)) {
      line = NexxCertainty.resonate(line, card, pos);
    }
    return line;
  }

  function synthesize(type, cards, question, clarityCard) {
    const q = questionEcho(question);
    const lead = cards[0];
    const clarity = clarityCard || cards[cards.length - 1];
    const meta = QUESTION_TYPES[type] || QUESTION_TYPES.general;
    const seed = cardSeed(lead, type.length);

    if (type === 'yesno') {
      const mainCards = clarityCard ? cards.slice(0, -1) : cards;
      const total = mainCards.reduce((s, c) => s + rankValueScore(c), 0);
      const clarityWeight = clarityCard ? rankValueScore(clarityCard) * 1.4 : 0;
      const avg = (total + clarityWeight) / (mainCards.length + (clarityCard ? 0.7 : 0));
      const v = verdictLabel(avg);
      const myth = mythWhisper(lead, seed);
      let text = `${meta.intro} Regarding "${q}", the spread returns ${v.text}. `;
      text += `${lead.name} sets the tone — ${lead.keyword.toLowerCase()} `;
      if (myth) text += `${myth} `;
      text += `Clarity ${clarity.name} whispers: ${clarity.nexx_move}`;
      if (global.NexxCertainty) {
        text += ` ${NexxCertainty.closer(q)}`;
      }
      return { verdict: v, text };
    }

    if (type === 'certainty') {
      const text = `${meta.intro} On "${q}", ${lead.name} and ${clarity.name} align. `
        + `${clarity.keyword} You are safe inside this pattern. `
        + `${clarity.nexx_move} `
        + (global.NexxCertainty ? NexxCertainty.closer(q) : 'Hold the certainty.');
      return { verdict: { text: 'CERTAINTY LOCKED', tone: 'yes' }, text };
    }

    const closers = {
      general: `Begin with ${lead.name}. Let ${clarity.name} complete the circuit.`,
      love: `${lead.name} opens the feeling; ${clarity.name} steadies the bond.`,
      career: `${lead.name} headlines the work; ${clarity.name} marks the next quarter.`,
      decision: `The fork favors ${clarity.name}'s counsel over noise.`,
      shadow: `${lead.name} named the load. ${clarity.name} shows the exit.`,
      timing: `${lead.name} marks the season; ${clarity.name} confirms the window.`,
      self: `Recovery starts at ${lead.name}, roots at ${clarity.name}.`,
    };

    let text = `${meta.intro} ${closers[type] || closers.general} `;
    text += `Final seal: ${clarity.nexx_move}`;
    if (global.NexxCertainty) text += ` ${NexxCertainty.whisper(clarity, 'syn')}`;

    return { verdict: null, text };
  }

  function generateReading({ question, questionType, cards, withClarity = true }) {
    const type = QUESTION_TYPES[questionType] ? questionType : 'general';
    const q = questionEcho(question);
    const positions = positionsForSpread(cards, withClarity);
    const clarityCard = withClarity && cards.length > 1 ? cards[cards.length - 1] : null;

    const lines = cards.map((card, i) => ({
      position: positions[i],
      card,
      isClarity: isClarityPosition(positions[i]),
      myth: mythFor(card),
      text: weaveLine(type, card, positions[i], q, cardSeed(card, i + type.length)),
    }));

    const { verdict, text } = synthesize(type, cards, question, clarityCard);

    return {
      questionType: type,
      questionTypeLabel: QUESTION_TYPES[type].label,
      question: q,
      lines,
      synthesis: text,
      verdict,
      clarityCard,
    };
  }

  function formatExport(reading, deckName) {
    const out = [
      `${deckName} · Reading Export`,
      new Date().toISOString(),
      `Type: ${reading.questionTypeLabel}`,
      `Question: ${reading.question}`,
      '',
    ];
    if (reading.verdict) {
      out.push(`VERDICT: ${reading.verdict.text}`);
      out.push('');
    }
    reading.lines.forEach((line, i) => {
      out.push(`${i + 1}. [${line.position}] ${line.card.name}`);
      out.push(`   ${line.text}`);
      if (line.myth?.legend) out.push(`   Myth: ${line.myth.legend}`);
      out.push('');
    });
    out.push('SYNTHESIS');
    out.push(reading.synthesis);
    out.push('');
    return out.join('\n');
  }

  global.NexxReadings = {
    QUESTION_TYPES,
    generateReading,
    formatExport,
    questionEcho,
    setMythology,
    loadMythology,
    mythFor,
  };
})(typeof window !== 'undefined' ? window : globalThis);
