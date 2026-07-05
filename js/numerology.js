/**
 * NEXX Numerology — life path · name code
 */
(function () {
  const $ = (id) => document.getElementById(id);
  let data = null;

  const LETTER_MAP = {};
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((ch, i) => {
    LETTER_MAP[ch] = (i % 9) + 1;
  });

  function reduce(n, keepMaster) {
    if (keepMaster && (n === 11 || n === 22 || n === 33)) return n;
    while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
      n = String(n).split('').reduce((s, d) => s + parseInt(d, 10), 0);
    }
    return n;
  }

  function lifePath(dateStr) {
    const digits = dateStr.replace(/\D/g, '').split('').map(Number);
    return reduce(digits.reduce((a, b) => a + b, 0), true);
  }

  function nameCode(name) {
    const sum = name.toUpperCase().replace(/[^A-Z]/g, '').split('')
      .reduce((s, ch) => s + (LETTER_MAP[ch] || 0), 0);
    return reduce(sum, true);
  }

  function digitInfo(n) {
    return data.digits[String(n)] || data.digits[String(reduce(n))];
  }

  function renderDigits() {
    $('digit-grid').innerHTML = Object.entries(data.digits).map(([n, d]) => `
      <article class="num-tile panel">
        <span class="num-big">${n}</span>
        <p>${d.keyword}</p>
        <span class="meta">${d.tarot}</span>
      </article>
    `).join('');
  }

  function calculate() {
    const name = $('num-name').value.trim() || 'Josh Nexx';
    const birth = $('num-birth').value;
    const lp = birth ? lifePath(birth) : 7;
    const nc = nameCode(name);
    const lpInfo = digitInfo(lp);
    const ncInfo = digitInfo(nc);

    $('num-result').hidden = false;
    $('num-lp').textContent = lp;
    $('num-nc').textContent = nc;
    $('num-lp-mean').textContent = data.life_path_meanings[String(lp)] || lpInfo?.keyword || '—';
    $('num-nc-mean').textContent = ncInfo?.keyword || '—';
    let syn = `Life Path ${lp}: ${$('num-lp-mean').textContent} Expression ${nc}: ${$('num-nc-mean').textContent}. `;
    if (lpInfo?.myth) syn += `Myth: ${lpInfo.myth}. `;
    if (lpInfo?.science) syn += `Science: ${lpInfo.science}.`;
    if (NexxCertainty) syn = NexxCertainty.resonate(syn, { id: String(lp) }, 'num');
    $('num-synthesis').textContent = syn;
  }

  async function init() {
    const res = await fetch('data/numerology.json');
    data = await res.json();
    renderDigits();
    $('num-name').value = 'Josh Nexx';
    $('btn-calc').addEventListener('click', calculate);
    calculate();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
