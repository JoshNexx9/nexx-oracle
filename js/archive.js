/**
 * NEXX Myth Archive — gods · demons · origins
 */
(function () {
  const $ = (id) => document.getElementById(id);
  let mythology = null;
  let deck = [];

  function renderSuits() {
    const el = $('suit-archive');
    el.innerHTML = Object.entries(mythology.suits).map(([key, s]) => `
      <article class="archive-card panel">
        <h3>${key} · ${s.element}</h3>
        <p class="archive-realm">${s.realm}</p>
        <p><strong>Deities:</strong> ${s.deities}</p>
        <p class="archive-legend">${s.legend}</p>
      </article>
    `).join('');
  }

  function cardById(id) {
    return deck.find((c) => c.id === id || c.id === id.replace(/^0/, ''));
  }

  function renderMajors(filter) {
    const el = $('major-archive');
    const q = (filter || '').toLowerCase();
    const entries = Object.entries(mythology.cards).filter(([id, m]) => {
      if (!q) return true;
      const card = cardById(id);
      const blob = [id, card?.name, m.deity, m.legend, m.origin, m.demon].join(' ').toLowerCase();
      return blob.includes(q);
    });

    el.innerHTML = entries.map(([id, m]) => {
      const card = cardById(id);
      const art = card?.art || 'assets/card-back.jpg';
      return `
        <article class="archive-major panel">
          <img src="${art}" alt="${card?.name || id}" loading="lazy" />
          <div>
            <h3>${card?.name || id}</h3>
            <p class="meta">${m.origin}</p>
            <p><strong>Deity:</strong> ${m.deity}</p>
            <p class="archive-legend">${m.legend}</p>
            <p><strong>Shadow:</strong> ${m.demon}</p>
            <p class="archive-science"><strong>Code:</strong> ${m.science}</p>
            ${card ? `<a href="tarot.html?card=${card.id}" class="archive-link">Pull this card →</a>` : ''}
          </div>
        </article>
      `;
    }).join('');
  }

  async function init() {
    const [mRes, dRes] = await Promise.all([
      fetch('data/mythology.json'),
      fetch('data/deck.json'),
    ]);
    mythology = await mRes.json();
    deck = await dRes.json();
    renderSuits();
    renderMajors();
    $('archive-search').addEventListener('input', (e) => renderMajors(e.target.value));
  }

  document.addEventListener('DOMContentLoaded', init);
})();