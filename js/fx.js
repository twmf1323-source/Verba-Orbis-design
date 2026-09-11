(function (global) {
  const VA = (global.VerbaAthanor = global.VerbaAthanor || {});

  const GOLD = ['#f0d78c', '#d4b15a', '#ffe9a8', '#c45c4a', '#7d9e8a'];

  function create(canvas) {
    const ctx = canvas.getContext('2d');
    const particles = [];
    let raf = 0;
    let running = false;
    let burstUntil = 0;
    let originX = 0;
    let originY = 0;

    function origin() {
      const canvasR = canvas.getBoundingClientRect();
      const art = document.querySelector('.circle-art');
      if (art) {
        const cr = art.getBoundingClientRect();
        if (cr.width > 40) {
          return {
            x: cr.left - canvasR.left + cr.width / 2,
            y: cr.top - canvasR.top + cr.height / 2,
          };
        }
      }
      return {
        x: canvasR.width * 0.38,
        y: canvasR.height * 0.46,
      };
    }

    function setOrigin(x, y) {
      if (x != null && y != null && Number.isFinite(x) && Number.isFinite(y)) {
        originX = x;
        originY = y;
        return;
      }
      const o = origin();
      originX = o.x;
      originY = o.y;
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(r.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      setOrigin();
    }

    function spawn(x, y, n, speed) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = (speed || 1) * (0.4 + Math.random() * 1.4);
        particles.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - 0.4,
          life: 1,
          decay: 0.006 + Math.random() * 0.012,
          size: 1 + Math.random() * 2.4,
          color: GOLD[(Math.random() * GOLD.length) | 0],
        });
      }
    }

    function mote() {
      const r = canvas.getBoundingClientRect();
      particles.push({
        x: Math.random() * r.width,
        y: r.height + 4,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.25 - Math.random() * 0.55,
        life: 0.8,
        decay: 0.0015 + Math.random() * 0.002,
        size: 0.8 + Math.random() * 1.6,
        color: GOLD[(Math.random() * 3) | 0],
      });
    }

    function burst(x, y) {
      setOrigin(x, y);
      spawn(originX, originY, 48, 2.6);
      burstUntil = performance.now() + 900;
    }

    function ember(x, y) {
      setOrigin(x, y);
      spawn(originX, originY, 3, 0.8);
    }

    function tick() {
      const r = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, r.width, r.height);
      if (Math.random() < 0.35) mote();
      if (performance.now() < burstUntil && Math.random() < 0.5) {
        spawn(originX, originY, 2, 1.2);
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.008;
        p.life -= p.decay;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (running) raf = requestAnimationFrame(tick);
    }

    function start() {
      if (running) return;
      running = true;
      resize();
      setOrigin();
      tick();
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    window.addEventListener('resize', resize);
    return { start, stop, resize, burst, ember, spawn };
  }

  VA.fx = { create };
})(typeof window !== 'undefined' ? window : globalThis);
