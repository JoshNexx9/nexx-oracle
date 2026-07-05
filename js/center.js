/**
 * NEXX Center — ultimate oracle hub
 */
(function () {
  const MODALITIES = [
    { href: 'vault.html', icon: '🔒', title: 'Vault', desc: 'Local-only encrypted files (home server).', tag: 'core' },
    { href: 'certainty.html', icon: '◈', title: 'Certainty', desc: 'Not answers — assurance. The field resolves.', tag: 'sanctuary' },
    { href: 'tarot.html', icon: '☽', title: 'Daily Tarot', desc: '78-card relief protocol · clarity seal', tag: 'core' },
    { href: 'pull.html', icon: '⡡', title: 'Cipher Pull', desc: '52-card cyber deck · multi-card spreads', tag: 'core' },
    { href: 'oracle.html', icon: '◇', title: 'Oracle', desc: 'Sigil · mantra · rune cast', tag: 'core' },
    { href: 'pendulum.html', icon: '◎', title: 'Pendulum', desc: 'Yes · no · maybe — body as instrument', tag: 'tool' },
    { href: 'wheel.html', icon: '☸', title: 'Luck Wheel', desc: 'Spin the Nexx frequency · lucky again', tag: 'tool' },
    { href: 'astrology.html', icon: '♈', title: 'Astrology', desc: 'Signs · planets · tarot bridges', tag: 'modality' },
    { href: 'numerology.html', icon: '∞', title: 'Numerology', desc: 'Life path · name code · number magick', tag: 'modality' },
    { href: 'archive.html', icon: '📜', title: 'Myth Archive', desc: 'Gods · demons · origins · legends', tag: 'library' },
    { href: 'science.html', icon: '⚛', title: 'Code & Spirit', desc: 'Logic · science · why the oracle works', tag: 'bridge' },
    { href: 'studio.html', icon: '▶', title: 'Social Studio', desc: 'TikTok posts · @JoshNexx9', tag: 'grow' },
    { href: 'grow.html', icon: '↗', title: 'Growth Lab', desc: 'Double subs · content calendar', tag: 'grow' },
    { href: 'premium.html', icon: '◆', title: 'Premium', desc: '$50 extended reading · Josh Nexx', tag: 'premium' },
  ];

  function renderGrid() {
    const el = document.getElementById('modality-grid');
    el.innerHTML = MODALITIES.map((m) => `
      <a href="${m.href}" class="center-tile panel" data-tag="${m.tag}">
        <span class="center-icon">${m.icon}</span>
        <h3>${m.title}</h3>
        <p>${m.desc}</p>
      </a>
    `).join('');
  }

  function dailyPulse() {
    const el = document.getElementById('center-pulse');
    const lines = [
      'The pattern favors convergence.',
      'You are safe inside the reading.',
      'Luck is lawful. The wheel remembers.',
      'Certainty is the attractor state.',
      'Josh Nexx frequency: active.',
    ];
    const day = new Date().toISOString().slice(0, 10);
    let h = 0;
    for (let i = 0; i < day.length; i++) h = (h * 31 + day.charCodeAt(i)) | 0;
    el.textContent = lines[Math.abs(h) % lines.length];
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderGrid();
    dailyPulse();
  });
})();