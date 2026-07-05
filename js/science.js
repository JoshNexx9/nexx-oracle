/**
 * NEXX Code & Spirit — science bridge
 */
(function () {
  const $ = (id) => document.getElementById(id);

  async function init() {
    const res = await fetch('data/science.json');
    const data = await res.json();

    $('science-grid').innerHTML = data.bridges.map((b) => `
      <article class="science-card panel">
        <h3>${b.title}</h3>
        <p class="science-spirit"><strong>Spirit:</strong> ${b.spirit}</p>
        <p class="science-sci"><strong>Science:</strong> ${b.science}</p>
        <p class="science-nexx"><strong>NEXX:</strong> ${b.nexx}</p>
      </article>
    `).join('');

    $('doctrine-public').textContent = data.certainty_doctrine.public;
    $('doctrine-practice').textContent = data.certainty_doctrine.practice;

    $('btn-doctrine').addEventListener('click', () => {
      NexxCopy.fromButton($('btn-doctrine'), [
        data.certainty_doctrine.public,
        data.certainty_doctrine.practice,
        '',
        'NEXX Oracle Center · Josh Nexx',
      ].join('\n'));
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();