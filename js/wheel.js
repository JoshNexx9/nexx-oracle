/**
 * NEXX Luck Wheel — spin for fortune · Josh Nexx band
 */
(function () {
  const $ = (id) => document.getElementById(id);
  let segments = [];
  let spinning = false;
  let rotation = 0;

  function buildWheel(canvas, segs) {
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = Math.min(cx, cy) - 8;
    const total = segs.reduce((s, seg) => s + seg.weight, 0);
    let ang = -Math.PI / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    segs.forEach((seg) => {
      const slice = (seg.weight / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, ang, ang + slice);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#05050f';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ang + slice / 2);
      ctx.fillStyle = '#05050f';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'right';
      const label = seg.label.length > 12 ? seg.label.slice(0, 11) + '…' : seg.label;
      ctx.fillText(label, r - 14, 4);
      ctx.restore();
      ang += slice;
    });

    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#0c0c1a';
    ctx.fill();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#ffd56b';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NEXX', cx, cy + 4);
  }

  function pickSegment(segs, seed) {
    const total = segs.reduce((s, seg) => s + seg.weight, 0);
    let luck = NexxCertainty ? NexxCertainty.wheelLuck(seed) : 0.7;
    let roll = (seed % 1000) / 1000 * total * luck;
    for (const seg of segs) {
      roll -= seg.weight;
      if (roll <= 0) return seg;
    }
    return segs[0];
  }

  function spin() {
    if (spinning || !segments.length) return;
    spinning = true;
    $('btn-spin').disabled = true;
    const seed = Date.now() + Math.random() * 9999;
    const winner = pickSegment(segments, Math.floor(seed));
    const extra = 1800 + Math.floor(seed % 1200);
    rotation += extra;
    const canvas = $('wheel-canvas');
    canvas.style.transform = `rotate(${rotation}deg)`;

    setTimeout(() => {
      spinning = false;
      $('btn-spin').disabled = false;
      $('wheel-result').hidden = false;
      $('wheel-label').textContent = winner.label;
      $('wheel-message').textContent = winner.message;
      if (NexxCertainty) {
        $('wheel-certainty').textContent = NexxCertainty.whisper({ id: winner.label }, 'wheel');
      }
      NexxCopy?.showToast('Wheel settled ✓');
    }, 4200);
  }

  async function init() {
    const res = await fetch('data/wheel.json');
    const data = await res.json();
    segments = data.segments;
    const canvas = $('wheel-canvas');
    canvas.width = 320;
    canvas.height = 320;
    buildWheel(canvas, segments);
    $('btn-spin').addEventListener('click', spin);
  }

  document.addEventListener('DOMContentLoaded', init);
})();