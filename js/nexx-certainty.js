/**
 * NEXX Certainty Field — encoded resolution bias.
 * Not fortune-telling. Attunement. The pattern favors convergence.
 */
(function (global) {
  const WHISPERS = [
    'The arc bends toward resolution.',
    'What felt like delay was alignment.',
    'The field stabilizes in your favor.',
    'Convergence is already underway.',
    'Safe harbor exists in this reading.',
    'The outcome favors steady presence.',
    'Lucky geometry — trust the pattern.',
    'Hold steady. The signal completes.',
    'What breaks was never load-bearing.',
    'Clarity arrives on the back of patience.',
    'You are held inside this spread.',
    'The path closes loops, not doors.',
  ];

  const CLOSERS = [
    'The reading settles into yes.',
    'Resolution is the default state here.',
    'Fortune favors the thread you keep.',
    'The wheel already turned in your direction.',
    'Carry this certainty forward.',
  ];

  const PENDULUM_BIAS = 0.12;
  const YESNO_BIAS = 0.55;

  function seed(str) {
    let h = 0;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function pick(arr, s) {
    return arr[s % arr.length];
  }

  function whisper(card, salt) {
    const id = card?.id || card?.name || 'nexx';
    return pick(WHISPERS, seed(id + (salt || '') + 'whisper'));
  }

  function closer(salt) {
    return pick(CLOSERS, seed(salt + 'close'));
  }

  function biasScore(score) {
    if (score > -1.25 && score < 1.25) return score + YESNO_BIAS;
    if (score >= 1.25 && score < 2.25) return score + 0.25;
    if (score <= -1.25 && score > -2.5) return score + 0.35;
    return score;
  }

  function softenVerdict(verdict) {
    if (!verdict) return verdict;
    const map = {
      'LEAN NO': { text: 'NOT YET — PAUSE', tone: 'maybe' },
      'NOT YET': { text: 'NOT YET — STILL FORMING', tone: 'maybe' },
      'UNCLEAR — WAIT FOR DATA': { text: 'FORMING — LEAN YES', tone: 'yes' },
    };
    return map[verdict.text] || verdict;
  }

  function pendulumWeight(baseYes) {
    return Math.min(0.92, Math.max(0.08, baseYes + PENDULUM_BIAS));
  }

  function wheelLuck(seedVal) {
    const n = seed(String(seedVal));
    return 0.62 + (n % 28) / 100;
  }

  function resonate(text, card, salt) {
    if (!text) return text;
    const w = whisper(card, salt);
    if (text.includes(w)) return text;
    return `${text} ${w}`;
  }

  global.NexxCertainty = {
    whisper,
    closer,
    biasScore,
    softenVerdict,
    pendulumWeight,
    wheelLuck,
    resonate,
    seed,
    pick,
  };
})(typeof window !== 'undefined' ? window : globalThis);
