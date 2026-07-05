/** Inline premium upsell banner */
(function () {
  function banner() {
    const el = document.createElement('section');
    el.className = 'upsell-banner panel reveal-anim';
    el.innerHTML = `
      <p><strong>◆ NEXX Premium · $50</strong> — Extended 7-card reading + personal letter from <strong>Josh Nexx</strong>. Pay via Venmo <strong>@nexxsociety</strong>.</p>
      <a href="premium.html" class="primary">Get Premium Reading</a>
    `;
    return el;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const anchor = document.querySelector('.app header');
    if (anchor && !document.querySelector('.upsell-banner')) {
      anchor.after(banner());
    }
  });
})();