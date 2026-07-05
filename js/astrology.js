/**
 * NEXX Astrology — signs · planets · daily bridge
 */
(function () {
  const $ = (id) => document.getElementById(id);
  let data = null;

  function sunSignFromDate(month, day) {
    const md = month * 100 + day;
    if (md >= 321 && md <= 419) return 'aries';
    if (md >= 420 && md <= 520) return 'taurus';
    if (md >= 521 && md <= 620) return 'gemini';
    if (md >= 621 && md <= 722) return 'cancer';
    if (md >= 723 && md <= 822) return 'leo';
    if (md >= 823 && md <= 922) return 'virgo';
    if (md >= 923 && md <= 1022) return 'libra';
    if (md >= 1023 && md <= 1121) return 'scorpio';
    if (md >= 1122 && md <= 1221) return 'sagittarius';
    if (md >= 1222 || md <= 119) return 'capricorn';
    if (md >= 120 && md <= 218) return 'aquarius';
    return 'pisces';
  }

  function renderSigns() {
    $('sign-grid').innerHTML = data.signs.map((s) => `
      <button type="button" class="astro-sign panel" data-id="${s.id}">
        <span class="astro-glyph">${s.symbol}</span>
        <strong>${s.id}</strong>
        <span>${s.element}</span>
      </button>
    `).join('');

    $('sign-grid').querySelectorAll('.astro-sign').forEach((btn) => {
      btn.addEventListener('click', () => showSign(btn.dataset.id));
    });
  }

  function showSign(id) {
    const s = data.signs.find((x) => x.id === id);
    if (!s) return;
    $('astro-readout').hidden = false;
    $('astro-title').textContent = `${s.symbol} ${s.id.charAt(0).toUpperCase() + s.id.slice(1)}`;
    $('astro-meta').textContent = `${s.element} · ${s.modality} · ${s.ruler}`;
    $('astro-keyword').textContent = s.keyword;
    $('astro-tarot').textContent = `Tarot bridge: ${s.tarot}`;
    $('astro-myth').textContent = s.myth;
    let reading = `${s.keyword} The sky maps ${s.element} through ${s.ruler}. `;
    reading += `Myth-line: ${s.myth}. Tarot echoes: ${s.tarot}.`;
    if (NexxCertainty) reading = NexxCertainty.resonate(reading, { id: s.id }, 'astro');
    $('astro-reading').textContent = reading;
  }

  function renderPlanets() {
    $('planet-list').innerHTML = data.planets.map((p) => `
      <article class="planet-row panel">
        <strong>${p.id}</strong>
        <span>${p.keyword}</span>
        <p>Tarot: ${p.tarot} · ${p.science}</p>
      </article>
    `).join('');
  }

  function birthRead() {
    const val = $('birth-date').value;
    if (!val) return;
    const d = new Date(val + 'T12:00:00');
    showSign(sunSignFromDate(d.getMonth() + 1, d.getDate()));
  }

  async function init() {
    const res = await fetch('data/astrology.json');
    data = await res.json();
    renderSigns();
    renderPlanets();
    const today = new Date();
    const sid = sunSignFromDate(today.getMonth() + 1, today.getDate());
    showSign(sid);
    $('btn-birth').addEventListener('click', birthRead);
  }

  document.addEventListener('DOMContentLoaded', init);
})();