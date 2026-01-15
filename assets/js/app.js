(function () {
  const glow = document.getElementById("cursorGlow");
  if (glow) {
    window.addEventListener("pointermove", (e) => {
      glow.style.left = e.clientX + "px";
      glow.style.top = e.clientY + "px";
    }, { passive: true });
  }

  // Starfield (lightweight)
  const canvas = document.getElementById("starfield");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  const stars = [];
  const N = prefersReduced ? 120 : 220;

  for (let i = 0; i < N; i++) {
    stars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.3 + 0.2,
      a: Math.random() * 0.6 + 0.15,
      v: (Math.random() * 0.22 + 0.05) * (Math.random() > 0.5 ? 1 : -1)
    });
  }

  let t = 0;
  function tick() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    t += 0.01;

    for (const s of stars) {
      s.y += s.v;
      if (s.y < -10) s.y = window.innerHeight + 10;
      if (s.y > window.innerHeight + 10) s.y = -10;

      const tw = Math.sin(t + s.x * 0.01) * 0.15;
      ctx.globalAlpha = Math.max(0, Math.min(1, s.a + tw));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    if (!prefersReduced) requestAnimationFrame(tick);
  }
  tick();
})();
