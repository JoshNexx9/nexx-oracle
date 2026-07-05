/**
 * NEXX Certainty Sanctuary
 */
(function () {
  const $ = (id) => document.getElementById(id);
  let deck = [];

  const AFFIRMATIONS = [
    'You did not come for answers. You came to remember you are safe.',
    'The outcome is already bending toward yes.',
    'What looks like chaos is calibration.',
    'You are held inside this pattern.',
    'Lucky geometry is active on your band.',
    'The arc completes. Rest inside that.',
    'Certainty is not blindness — it is trust in convergence.',
    'Josh Nexx got lucky again. So do you.',
  ];

  function todayCard() {
    const day = new Date().toISOString().slice(0, 10);
    let h = 0;
    for (let i = 0; i < day.length; i++) h = (h * 31 + day.charCodeAt(i)) | 0;
    return deck[Math.abs(h) % deck.length];
  }

  function breathe() {
    const el = $('certainty-breath');
    el.classList.remove('pulse');
    void el.offsetWidth;
    el.classList.add('pulse');
  }

  function seal() {
    const q = $('certainty-question').value.trim() || 'everything ahead';
    const card = todayCard();
    const seed = Date.now();
    const aff = AFFIRMATIONS[seed % AFFIRMATIONS.length];

    const clarity = deck[(deck.indexOf(card) + 7) % deck.length];
    const reading = NexxReadings.generateReading({
      question: q,
      questionType: 'certainty',
      cards: [card, clarity],
      withClarity: true,
    });

    $('certainty-result').hidden = false;
    $('certainty-affirm').textContent = aff;
    $('certainty-card-art').src = card.art;
    $('certainty-card-name').textContent = card.name;
    $('certainty-reading').textContent = reading.synthesis;
    $('certainty-whisper').textContent = NexxCertainty.whisper(card, 'sanctuary');
    breathe();
  }

  async function init() {
    const res = await fetch('data/deck.json');
    deck = await res.json();
    await NexxReadings.loadMythology();
    const card = todayCard();
    $('certainty-hero-art').src = card.art;
    $('btn-seal').addEventListener('click', seal);
    $('btn-copy-seal').addEventListener('click', () => {
      const text = [
        'NEXX CERTAINTY SEAL',
        $('certainty-affirm').textContent,
        $('certainty-reading').textContent,
        $('certainty-whisper').textContent,
      ].join('\n\n');
      NexxCopy.fromButton($('btn-copy-seal'), text);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();