/**
 * NEXX Social Studio — TikTok & social post generator
 * @JoshNexx9 · Book a consultation
 */
(function () {
  const TIKTOK = 'https://www.tiktok.com/@JoshNexx9';
  const HANDLE = '@JoshNexx9';

  const $ = (id) => document.getElementById(id);

  let deck = [];
  let currentCard = null;
  let lastPost = null;

  const HOOKS = {
    pov: [
      'POV: you pulled {card} and the algorithm stopped lying.',
      'POV: it\'s 2am and {card} just called you out.',
      'POV: you needed one sign. {card} showed up.',
      'nobody told you {card} hits this hard.',
    ],
    storytime: [
      'storytime: I pulled {card} on a cyberpunk deck and…',
      'so I ran NEXX Tarot and got {card}. here\'s what it means.',
      'the card that broke my spiral: {card}.',
      'let me tell you about {card} and why it matters right now.',
    ],
    hottake: [
      '{card} isn\'t gentle. it\'s a command.',
      'unpopular opinion: {card} is the card you\'ve been avoiding.',
      '{card} said what your group chat won\'t.',
      'if you got {card} today, read this before you scroll.',
    ],
    soft: [
      'gentle reading: {card} is holding space for you.',
      '{card} showed up with medicine, not punishment.',
      'if you\'re tired: {card} sees you. breathe.',
      'soft signal today — {card}.',
    ],
    cta: [
      'I pulled {card} for you. want your own spread?',
      '{card} is today\'s public reading. private ones hit different.',
      'this is {card}. imagine what a full consult unlocks.',
      '{card} — free pull here. depth is in the consultation.',
    ],
    aesthetic: [
      '{card} · neon gospel.',
      'signal received: {card}',
      '{card} // nexx cipher',
      '◈ {card} ◈',
    ],
    premium: [
      'I paid $50 for this reading and {card} did NOT miss.',
      'premium NEXX pull: {card}. Josh Nexx doesn\'t do surface-level.',
      '{card} — this is what $50 cyberpunk tarot hits like.',
      'extended reading energy: {card} · book @JoshNexx9',
    ],
  };

  const SOUNDS = [
    'dark ambient / phonk drift',
    'rain + neon synth (cyberpunk vibe)',
    'soft piano under bass drop at reveal',
    'trending "oh no" or transition sound at card flip',
    'original voiceover only — no music',
  ];

  const BROLL = [
    'slow zoom on card art + scanline overlay',
    'hands shuffling cipher deck, cut to reveal',
    'city rain on window, text overlay sync',
    'screen record of NEXX pull → your face react',
    'candle + laptop glow, gothic cyber mood',
  ];

  function pick(arr, seed) {
    return arr[Math.abs(seed) % arr.length];
  }

  function seedFrom(card, extra = '') {
    let h = 0;
    const s = card.id + card.name + extra + Date.now();
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h;
  }

  function fill(template, card) {
    return template
      .replace(/\{card\}/g, card.name)
      .replace(/\{keyword\}/g, card.keyword.replace(/\.$/, ''))
      .replace(/\{move\}/g, card.nexx_move)
      .replace(/\{handle\}/g, HANDLE);
  }

  function baseHashtags(card) {
    const core = [
      '#nexxtarot', '#cyberpunktarot', '#tarot', '#tarotreading',
      '#spiritualtiktok', '#manifestation', '#dailytarot', '#JoshNexx9',
    ];
    const cardTag = '#' + card.name.toLowerCase().replace(/^the\s+/, '').replace(/\s+/g, '');
    const extra = ['#fyp', '#foryou', '#tarottok', '#oracle', '#sigil', '#neonwitch'];
    return [...new Set([...core, cardTag, ...extra.slice(0, 4)])].join(' ');
  }

  function platformHashtags(platform, card) {
    const base = baseHashtags(card);
    const map = {
      tiktok: base + ' #tiktoktarot #witchtok',
      reels: base + ' #reels #tarotreels #spiritualreels',
      carousel: base + ' #carousel #tarotcards #learnontiktok',
      threads: '#tarot ' + HANDLE + ' ' + card.name.replace(/\s/g, ''),
      story: base,
    };
    return map[platform] || base;
  }

  function onScreenLayers(card, vibe, platform) {
    const lines = [
      `◈ ${card.name.toUpperCase()} ◈`,
      card.keyword,
      `▶ ${card.nexx_move}`,
    ];
    if (vibe === 'aesthetic') {
      return lines.slice(0, 2).join('\n---\n');
    }
    if (platform === 'story') {
      return [
        'SLIDE 1: ' + card.name,
        'SLIDE 2: ' + card.keyword,
        'SLIDE 3: ' + card.nexx_move + '\n' + HANDLE,
      ].join('\n\n');
    }
    if (platform === 'carousel') {
      return [
        'SLIDE 1 — COVER: ' + card.name,
        'SLIDE 2 — MEANING: ' + card.meaning || card.keyword,
        'SLIDE 3 — NEXX MOVE: ' + card.nexx_move,
        'SLIDE 4 — CTA: Book consult · ' + HANDLE,
      ].join('\n\n');
    }
    return lines.map((l, i) => `LAYER ${i + 1} (${['0:00', '0:03', '0:08'][i]}): ${l}`).join('\n');
  }

  function buildCaption(card, vibe, platform, ctaText) {
    const seed = seedFrom(card, vibe);
    const hook = fill(pick(HOOKS[vibe] || HOOKS.pov, seed), card);

    const bodies = {
      pov: `${hook}\n\n${card.name} · ${card.keyword}\n\n${card.nexx_move}\n\nPull your own on NEXX Tarot. Full readings? ${ctaText}`,
      storytime: `${hook}\n\n${card.name} landed and the keyword hit: "${card.keyword}"\n\nMy NEXX move today: ${card.nexx_move}\n\nCyberpunk deck. Real directives. Not vague fluff.\n\n${ctaText}`,
      hottake: `${hook}\n\nKeyword: ${card.keyword}\nNEXX MOVE: ${card.nexx_move}\n\nThis is the relief protocol — one card, one order.\n\n${ctaText}`,
      soft: `${hook}\n\n✦ ${card.name}\n${card.keyword}\n\nTake with you: ${card.nexx_move}\n\n${ctaText}`,
      cta: `${hook}\n\nToday's card: ${card.name}\n${card.keyword}\n\n▶ ${card.nexx_move}\n\n${ctaText}\n\nFollow ${HANDLE} · ${TIKTOK}`,
      aesthetic: `${card.name}\n${card.keyword}\n\n—\nNEXX Tarot · cyberpunk relief\n${HANDLE}`,
      premium: `${hook}\n\n◆ PREMIUM READING ◆\n${card.name} · ${card.keyword}\n\n${card.nexx_move}\n\nPaid session with Josh Nexx · $50 via @nexxsociety\n${ctaText}\n\n${HANDLE} · ${TIKTOK}`,
    };

    let cap = bodies[vibe] || bodies.pov;

    if (platform === 'threads') {
      cap = `${hook}\n\n${card.name} → ${card.keyword}\n${card.nexx_move}\n\n${ctaText} ${HANDLE}`;
      if (cap.length > 500) cap = cap.slice(0, 497) + '…';
    }
    if (platform === 'reels') {
      cap += '\n\n🎬 Save for your daily pull · Share if it found you';
    }
    return cap;
  }

  function buildPin(card, ctaText) {
    return `📌 ${card.name} — ${card.keyword} Want a personal reading? ${ctaText} Follow ${HANDLE}: ${TIKTOK}`;
  }

  function buildExtras(card, platform) {
    const seed = seedFrom(card, 'extras');
    return [
      `SOUND: ${pick(SOUNDS, seed)}`,
      `B-ROLL: ${pick(BROLL, seed + 1)}`,
      `CARD ART: use ${card.art} (screenshot from NEXX Studio)`,
      `TRANSITION: glitch flicker or card flip at 0:02`,
      `END CARD: ${HANDLE} + "Book a consultation" text 2s hold`,
      platform === 'tiktok' ? `DUET/STITCH: enabled — invite pulls` : null,
      `LINK: ${TIKTOK}`,
    ].filter(Boolean).join('\n');
  }

  function buildCtaBlock(ctaText) {
    return [
      ctaText,
      '',
      `Follow on TikTok: ${HANDLE}`,
      TIKTOK,
      '',
      'Book a consultation for:',
      '• Personal 3-card / clarity spreads',
      '• Cyberpunk NEXX Cipher readings',
      '• Sigil + mantra pulls tailored to you',
      '',
      `DM "CONSULT" on TikTok or tap link in bio.`,
    ].join('\n');
  }

  function selectCard(source) {
    if (source === 'pick') {
      const id = $('card-pick').value;
      return deck.find((c) => c.id === id) || deck[0];
    }
    if (source === 'major') {
      const majors = deck.filter((c) => c.arcana === 'major');
      return majors[Math.floor(Math.random() * majors.length)];
    }
    return deck[Math.floor(Math.random() * deck.length)];
  }

  function generate() {
    const platform = $('platform').value;
    const vibe = $('vibe').value;
    if (vibe === 'premium' && typeof NexxPaywall !== 'undefined' && !NexxPaywall.isUnlocked()) {
      if (confirm('Premium Social Pack requires NEXX Premium ($50 via Venmo @nexxsociety). Go to unlock?')) {
        location.href = 'premium.html';
      }
      $('vibe').value = 'cta';
      return;
    }
    const source = $('deck-source').value;
    const ctaText = $('consult-cta').value.trim();

    currentCard = selectCard(source);
    const seed = seedFrom(currentCard, vibe + platform);
    const hook = fill(pick(HOOKS[vibe] || HOOKS.pov, seed), currentCard);

    lastPost = {
      hook,
      onscreen: onScreenLayers(currentCard, vibe, platform),
      caption: buildCaption(currentCard, vibe, platform, ctaText),
      hashtags: platformHashtags(platform, currentCard),
      cta: buildCtaBlock(ctaText),
      extras: buildExtras(currentCard, platform),
      pin: buildPin(currentCard, ctaText),
      card: currentCard,
    };

    $('post-card-art').src = currentCard.art;
    $('post-card-name').textContent = currentCard.name;
    $('post-card-keyword').textContent = currentCard.keyword;

    $('out-hook').textContent = lastPost.hook;
    $('out-onscreen').textContent = lastPost.onscreen;
    $('out-caption').textContent = lastPost.caption;
    $('out-hashtags').textContent = lastPost.hashtags;
    $('out-cta').textContent = lastPost.cta;
    $('out-extras').textContent = lastPost.extras;
    $('out-pin').textContent = lastPost.pin;

    $('studio-output').hidden = false;
    $('studio-output').classList.remove('reveal-anim');
    void $('studio-output').offsetWidth;
    $('studio-output').classList.add('reveal-anim');
  }

  function copyText(text, btn) {
    if (typeof NexxCopy !== 'undefined') {
      return NexxCopy.fromButton(btn, text);
    }
    return Promise.resolve(false);
  }

  async function exportShareCard() {
    if (!lastPost || !currentCard) return;
    const btn = $('btn-export-card');
    const orig = btn.textContent;
    btn.textContent = 'Rendering…';
    btn.disabled = true;

    const W = 1080;
    const H = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#05050f');
    bg.addColorStop(0.45, '#12081f');
    bg.addColorStop(1, '#0a1628');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    for (let x = 0; x < W; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = currentCard.art;
      });
      const cardW = 520;
      const cardH = 780;
      const cx = (W - cardW) / 2;
      ctx.shadowColor = 'rgba(0, 240, 255, 0.45)';
      ctx.shadowBlur = 40;
      ctx.drawImage(img, cx, 180, cardW, cardH);
      ctx.shadowBlur = 0;
    } catch (_) { /* card art optional */ }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 28px ui-monospace, monospace';
    ctx.fillText('◈ NEXX TAROT ◈', W / 2, 80);

    ctx.fillStyle = '#e8f4ff';
    ctx.font = 'bold 56px "Segoe UI", system-ui, sans-serif';
    wrapText(ctx, currentCard.name.toUpperCase(), W / 2, 1020, W - 120, 62);

    ctx.fillStyle = '#7a8fa8';
    ctx.font = '32px "Segoe UI", system-ui, sans-serif';
    wrapText(ctx, currentCard.keyword, W / 2, 1140, W - 140, 42);

    ctx.fillStyle = '#ff2bd6';
    ctx.font = 'italic 34px "Segoe UI", system-ui, sans-serif';
    wrapText(ctx, '▶ ' + currentCard.nexx_move, W / 2, 1280, W - 100, 44);

    ctx.fillStyle = '#ffd56b';
    ctx.font = '28px ui-monospace, monospace';
    wrapText(ctx, lastPost.hook, W / 2, 1520, W - 100, 36);

    ctx.fillStyle = '#8b5cff';
    ctx.font = 'bold 32px ui-monospace, monospace';
    ctx.fillText(HANDLE, W / 2, H - 120);
    ctx.fillStyle = '#00f0ff';
    ctx.font = '24px ui-monospace, monospace';
    ctx.fillText('DM CONSULT · cyberpunk relief', W / 2, H - 70);

    canvas.toBlob((blob) => {
      btn.disabled = false;
      btn.textContent = orig;
      if (!blob) {
        NexxCopy.showToast('Export failed', 'hint');
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `nexx-post-${currentCard.id}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      NexxCopy.showToast('Saved to Photos/Downloads ✓');
    }, 'image/png');
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let dy = y;
    for (let i = 0; i < words.length; i++) {
      const test = line + words[i] + ' ';
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line.trim(), x, dy);
        line = words[i] + ' ';
        dy += lineHeight;
      } else {
        line = test;
      }
    }
    ctx.fillText(line.trim(), x, dy);
  }

  function copyAll() {
    if (!lastPost) return;
    const full = [
      '═══ NEXX SOCIAL POST ═══',
      `Card: ${lastPost.card.name}`,
      '',
      '— HOOK —',
      lastPost.hook,
      '',
      '— ON-SCREEN —',
      lastPost.onscreen,
      '',
      '— CAPTION —',
      lastPost.caption,
      '',
      '— HASHTAGS —',
      lastPost.hashtags,
      '',
      '— CTA —',
      lastPost.cta,
      '',
      '— PIN COMMENT —',
      lastPost.pin,
      '',
      '— PRODUCTION —',
      lastPost.extras,
      '',
      HANDLE + ' · ' + TIKTOK,
    ].join('\n');
    copyText(full, $('btn-copy-all'));
  }

  async function init() {
    const res = await fetch('data/deck.json');
    deck = await res.json();

    const pickSel = $('card-pick');
    deck.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      pickSel.appendChild(opt);
    });

    $('deck-source').addEventListener('change', () => {
      $('card-pick-wrap').hidden = $('deck-source').value !== 'pick';
    });

    const params = new URLSearchParams(location.search);
    if (params.get('vibe')) $('vibe').value = params.get('vibe');
    if (params.get('card')) {
      $('deck-source').value = 'pick';
      $('card-pick-wrap').hidden = false;
      $('card-pick').value = params.get('card');
    }

    $('btn-generate').addEventListener('click', generate);
    $('btn-copy-all').addEventListener('click', copyAll);
    $('btn-export-card')?.addEventListener('click', exportShareCard);
    $('btn-grow')?.addEventListener('click', () => { location.href = 'grow.html'; });

    document.querySelectorAll('.btn-copy').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.target;
        const map = {
          hook: 'out-hook', onscreen: 'out-onscreen', caption: 'out-caption',
          hashtags: 'out-hashtags', cta: 'out-cta', extras: 'out-extras', pin: 'out-pin',
        };
        const el = $(map[key]);
        if (el) copyText(el.textContent, btn);
      });
    });

    generate();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
