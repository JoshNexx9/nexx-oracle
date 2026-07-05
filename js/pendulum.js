/**
 * NEXX Pendulum — physics swing · yes / no / forming
 */
(function () {
  const $ = (id) => document.getElementById(id);

  const ANSWERS = {
    yes: {
      label: 'YES',
      tone: 'yes',
      msg: 'The bob settles right — the field affirms. Proceed.',
    },
    no: {
      label: 'NOT YET',
      tone: 'no',
      msg: 'The bob settles left — pause, not denial. Alignment still forming.',
    },
    maybe: {
      label: 'FORMING',
      tone: 'maybe',
      msg: 'The bob holds center — hold steady. The pattern has not locked.',
    },
  };

  let animId = null;
  let phase = 'idle';
  let target = null;
  let physics = null;
  let canvas = null;
  let ctx = null;
  let dims = { w: 320, h: 400, cx: 160, top: 48, len: 280 };
  let tiltNudge = 0;
  let trail = [];
  let swingStart = 0;

  function hashQuestion(q) {
    let h = 0;
    const s = q + '|nexx-pendulum';
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function decide(question) {
    const h = hashQuestion(question);
    const r = (h % 1000) / 1000;
    const yesW = NexxCertainty ? NexxCertainty.pendulumWeight(0.55) : 0.55;
    if (r < yesW) return 'yes';
    if (r < yesW + 0.2) return 'maybe';
    return 'no';
  }

  function targetAngle(ans) {
    if (ans === 'yes') return 0.42;
    if (ans === 'no') return -0.42;
    return 0;
  }

  function initPhysics(ans) {
    const kick = 0.14 + (hashQuestion($('pendulum-question').value) % 80) / 400;
    physics = {
      angle: (Math.random() > 0.5 ? 1 : -1) * kick * 3,
      velocity: (Math.random() > 0.5 ? 1 : -1) * kick,
      gravity: 0.32,
      damping: 0.992,
      bias: 0,
      settleStart: null,
    };
    target = ans;
    trail = [];
  }

  function resizeCanvas() {
    if (!canvas) return;
    const wrap = canvas.parentElement;
    const w = Math.min(360, wrap?.clientWidth || 360);
    const h = Math.round(w * 1.15);
    canvas.width = w;
    canvas.height = h;
    dims = { w, h, cx: w / 2, top: h * 0.12, len: h * 0.68 };
  }

  function bobPos(angle) {
    return {
      x: dims.cx + Math.sin(angle) * dims.len,
      y: dims.top + Math.cos(angle) * dims.len,
    };
  }

  function drawScene(angle, glowing) {
    const { w, h, cx, top, len } = dims;
    ctx.clearRect(0, 0, w, h);

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(8, 12, 28, 0.95)');
    grad.addColorStop(1, 'rgba(4, 6, 14, 0.98)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(cx, top, 20 + i * 18, 0, Math.PI * 2);
      ctx.stroke();
    }

    const zones = [
      { label: 'NOT YET', angle: -0.42, color: 'rgba(180, 190, 210, 0.35)' },
      { label: 'FORMING', angle: 0, color: 'rgba(255, 213, 107, 0.4)' },
      { label: 'YES', angle: 0.42, color: 'rgba(0, 240, 255, 0.45)' },
    ];
    zones.forEach((z) => {
      const zx = cx + Math.sin(z.angle) * (len + 28);
      const zy = top + Math.cos(z.angle) * (len + 28);
      ctx.fillStyle = z.color;
      ctx.font = '600 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(z.label, zx, zy);
    });

    ctx.strokeStyle = 'rgba(139, 92, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - len * 0.55, top + len);
    ctx.lineTo(cx + len * 0.55, top + len);
    ctx.stroke();

    const bob = bobPos(angle);
    trail.push({ x: bob.x, y: bob.y });
    if (trail.length > 24) trail.shift();
    trail.forEach((p, i) => {
      const a = (i + 1) / trail.length;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 * a, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 43, 214, ${a * 0.35})`;
      ctx.fill();
    });

    ctx.beginPath();
    ctx.moveTo(cx, top);
    ctx.lineTo(bob.x, bob.y);
    ctx.strokeStyle = glowing ? '#b794ff' : '#8b5cff';
    ctx.lineWidth = glowing ? 3 : 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, top, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd56b';
    ctx.fill();

    const rg = ctx.createRadialGradient(bob.x, bob.y, 2, bob.x, bob.y, glowing ? 28 : 20);
    rg.addColorStop(0, '#fff8e7');
    rg.addColorStop(0.35, '#ffd56b');
    rg.addColorStop(1, glowing ? '#ff2bd6' : '#c58af9');
    ctx.beginPath();
    ctx.arc(bob.x, bob.y, glowing ? 20 : 16, 0, Math.PI * 2);
    ctx.fillStyle = rg;
    ctx.fill();
    if (glowing) {
      ctx.shadowColor = '#ff2bd6';
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function tick() {
    if (!physics) return;
    const p = physics;
    const g = p.gravity / dims.len;
    p.velocity += (-g * Math.sin(p.angle) + tiltNudge * 0.002) * 0.85;
    p.velocity *= p.damping;

    if (phase === 'settling') {
      if (!p.settleStart) p.settleStart = performance.now();
      const t = (performance.now() - p.settleStart) / 1000;
      const goal = targetAngle(target);
      p.bias = goal * Math.min(1, t * 0.8);
      p.velocity += (goal - p.angle) * 0.018;
      p.velocity *= 0.96;
    }

    p.angle += p.velocity;
    drawScene(p.angle, phase === 'settling' && p.settleStart && performance.now() - p.settleStart > 1.2);
  }

  function loop(onDone) {
    tick();
    if (phase === 'swinging') {
      const swung = performance.now() - swingStart > 1400;
      if (swung && Math.abs(physics.velocity) < 0.008) {
        phase = 'settling';
      }
      animId = requestAnimationFrame(() => loop(onDone));
      return;
    }
    if (phase === 'settling') {
      const elapsed = performance.now() - (physics.settleStart || 0);
      if (elapsed > 2200) {
        phase = 'idle';
        onDone();
        return;
      }
      animId = requestAnimationFrame(() => loop(onDone));
      return;
    }
  }

  function showResult(ans) {
    const a = ANSWERS[ans];
    $('pendulum-result').hidden = false;
    $('pendulum-answer').textContent = a.label;
    $('pendulum-answer').className = `pendulum-answer tone-${a.tone}`;
    $('pendulum-msg').textContent = a.msg;
    if (NexxCertainty) {
      $('pendulum-whisper').textContent = NexxCertainty.whisper({ id: ans }, 'pend');
    }
  }

  function setBusy(busy) {
    const btn = $('btn-pendulum');
    btn.disabled = busy;
    btn.textContent = busy ? 'Reading…' : 'Ask Again';
    $('pendulum-stage')?.classList.toggle('is-reading', busy);
  }

  function ask() {
    if (phase !== 'idle') return;
    const q = $('pendulum-question').value.trim() || 'the path ahead';
    const ans = decide(q);
    $('pendulum-result').hidden = true;
    setBusy(true);
    phase = 'swinging';
    initPhysics(ans);
    tiltNudge = 0;
    swingStart = performance.now();
    loop(() => {
      setBusy(false);
      showResult(target);
      drawScene(targetAngle(target), true);
    });
  }

  function bindTilt() {
    if (!window.DeviceOrientationEvent) return;
    const handler = (e) => {
      if (phase === 'idle') return;
      const g = e.gamma;
      if (typeof g === 'number') tiltNudge = Math.max(-1, Math.min(1, g / 45));
    };
    window.addEventListener('deviceorientation', handler, { passive: true });
  }

  function bindTouch() {
    if (!canvas) return;
    let dragging = false;
    canvas.addEventListener('pointerdown', (e) => {
      if (phase !== 'idle') return;
      dragging = true;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging || phase !== 'idle' || !physics) return;
      const rect = canvas.getBoundingClientRect();
      const dx = (e.clientX - rect.left - dims.cx) / dims.len;
      physics.angle = Math.max(-0.7, Math.min(0.7, dx));
      drawScene(physics.angle, false);
    });
    canvas.addEventListener('pointerup', () => { dragging = false; });
  }

  document.addEventListener('DOMContentLoaded', () => {
    canvas = $('pendulum-canvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    physics = { angle: 0.08, velocity: 0, gravity: 0.32, damping: 0.992, bias: 0, settleStart: null };
    drawScene(physics.angle, false);
    bindTilt();
    bindTouch();
    $('btn-pendulum').addEventListener('click', ask);
    $('pendulum-question').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && phase === 'idle') ask();
    });
  });
})();
