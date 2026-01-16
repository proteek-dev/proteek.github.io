(function () {
  const warp = document.getElementById("portalWarp");
  const fx = document.getElementById("cubeFx");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!fx) return;

  const ctx = fx.getContext("2d", { alpha: true });

  // ----- Canvas sizing -----
  function resizeFx() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    fx.width = Math.floor(window.innerWidth * dpr);
    fx.height = Math.floor(window.innerHeight * dpr);
    fx.style.width = "100vw";
    fx.style.height = "100vh";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeFx();
  window.addEventListener("resize", resizeFx, { passive: true });

  // ----- Particle system -----
  const particles = [];
  const MAX_PARTICLES = 1400;

  // Face “normal” mapped to 2D screen bias (sells the 3D face illusion)
  const faceBias = {
    front:  { x: 0.0, y: 0.0 },
    back:   { x: 0.0, y: 0.0 },
    right:  { x: 1.0, y: 0.0 },
    left:   { x: -1.0, y: 0.0 },
    top:    { x: 0.0, y: -1.0 },
    bottom: { x: 0.0, y: 1.0 },
  };

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function spawnCubelets(x, y, face, amount, strength) {
    const b = faceBias[face] || faceBias.front;

    for (let i = 0; i < amount; i++) {
      if (particles.length >= MAX_PARTICLES) particles.shift();

      // Direction: random + face bias
      let vx = rand(-1, 1) * 0.7 + b.x * 1.3;
      let vy = rand(-1, 1) * 0.7 + b.y * 1.3;

      // Back face feels “pulled inward” instead of blown out
      if (face === "back") {
        vx *= 0.55;
        vy *= 0.55;
      }

      const speed = strength * rand(0.6, 1.25);

      const size = rand(2, 5);
      const life = rand(18, 34); // frames-ish feel, we’ll decrement by dt
      const rot = rand(0, Math.PI * 2);
      const spin = rand(-0.18, 0.18);

      particles.push({
        x, y,
        vx: vx * speed,
        vy: vy * speed,
        size,
        life,
        maxLife: life,
        rot,
        spin,
        shrink: (face === "back") ? rand(0.015, 0.03) : rand(0.004, 0.014),
      });
    }
  }

  function draw(dt) {
    // Clear
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Update + draw
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      p.life -= dt;
      if (p.life <= 0 || p.size <= 0.2) {
        particles.splice(i, 1);
        continue;
      }

      // Movement with a little drag
      p.vx *= (1 - 0.018 * dt);
      p.vy *= (1 - 0.018 * dt);

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Float up a touch (vapor feel) unless it’s bottom face
      p.vy -= 0.012 * dt;

      // Size decay
      p.size -= p.shrink * (dt * 16);

      // Fade
      const a = Math.max(0, Math.min(1, p.life / p.maxLife));

      p.rot += p.spin * dt;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);

      // Colorless “glass cubelets” feel: white with alpha
      ctx.fillStyle = `rgba(255,255,255,${0.65 * a})`;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);

      // Slight edge highlight
      ctx.strokeStyle = `rgba(255,255,255,${0.25 * a})`;
      ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size);

      ctx.restore();
    }

    requestAnimationFrame(tick);
  }

  // ----- Hover tracking per lens -----
  let lastT = performance.now();
  let ticking = false;

  // store per-lens hover state
  const hoverState = new Map(); // lensEl -> {x,y,face,active}

  function getFaceFromEl(el) {
    if (!el || !el.classList) return "front";
    for (const name of ["front","back","right","left","top","bottom"]) {
      if (el.classList.contains(name)) return name;
    }
    return "front";
  }

  function ensureRunning() {
    if (!ticking) {
      ticking = true;
      lastT = performance.now();
      requestAnimationFrame(tick);
    }
  }

  function tick(now) {
    const dtMs = now - lastT;
    lastT = now;

    // dt in “frames” (1 ~= 16ms)
    const dt = Math.max(0.5, Math.min(2.2, dtMs / 16.67));

    // Emit hover particles
    for (const st of hoverState.values()) {
      if (!st.active) continue;
      // emission: small continuous stream
      spawnCubelets(st.x, st.y, st.face, 3, 0.55);
    }

    draw(dt);

    // stop loop if nothing to do
    if (particles.length === 0) {
      let anyHover = false;
      for (const st of hoverState.values()) {
        if (st.active) { anyHover = true; break; }
      }
      if (!anyHover) ticking = false;
    }
  }

  // ----- Wire up faces + click -----
  document.querySelectorAll(".lens").forEach(btn => {
    const faces = btn.querySelectorAll(".cube .face");
    hoverState.set(btn, { x: 0, y: 0, face: "front", active: false });

    // Pointer movement on each face = true “3D-ish” hotspot origin
    faces.forEach(faceEl => {
      faceEl.addEventListener("pointerenter", (e) => {
        if (prefersReduced) return;
        const st = hoverState.get(btn);
        st.active = true;
        st.face = getFaceFromEl(faceEl);
        st.x = e.clientX;
        st.y = e.clientY;
        ensureRunning();
      }, { passive: true });

      faceEl.addEventListener("pointermove", (e) => {
        if (prefersReduced) return;
        const st = hoverState.get(btn);
        st.active = true;
        st.face = getFaceFromEl(faceEl);
        st.x = e.clientX;
        st.y = e.clientY;
        ensureRunning();
      }, { passive: true });

      faceEl.addEventListener("pointerleave", () => {
        const st = hoverState.get(btn);
        st.active = false;
      }, { passive: true });
    });

    // Click = burst + vapor + warp navigation (keeps your timing vibe)
    btn.addEventListener("click", () => {
      const href = btn.getAttribute("data-href");
      if (!href) return;

      if (prefersReduced) {
        location.href = href;
        return;
      }

      const st = hoverState.get(btn);
      let cx = st?.x, cy = st?.y, face = st?.face || "front";

      // Fallback if click happens without prior hover move
      if (!cx || !cy) {
        const cube = btn.querySelector(".cube");
        const r = cube?.getBoundingClientRect();
        if (r) { cx = r.left + r.width / 2; cy = r.top + r.height / 2; }
        else { cx = window.innerWidth / 2; cy = window.innerHeight / 2; }
      }

      btn.classList.add("disintegrating");

      // Stronger burst
      spawnCubelets(cx, cy, face, 160, 2.2);
      ensureRunning();

      // Warp + navigate (slightly longer than hover; feels like “vapor then jump”)
      warp.classList.add("on");
      setTimeout(() => { location.href = href; }, 520);
    });
  });
})();
