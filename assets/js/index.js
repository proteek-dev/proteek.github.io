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

  function clamp01(v){ return Math.max(0, Math.min(1, v)); }

  // Draw a tiny isometric cube made of 3 faces (top/left/right)
  function drawIsoCube(ctx, x, y, s, a, tiltX, tiltY) {
    // tiltX/tiltY are in [-1..1], derived from velocity direction to sell “3D”
    const tx = tiltX * 0.55;
    const ty = tiltY * 0.55;

    // isometric-ish offsets
    const hx = s * (0.9 + tx * 0.2);
    const hy = s * (0.55 + ty * 0.2);
    const vz = s * 0.9; // vertical edge length

    // Points (screen space)
    // Top diamond
    const p0 = { x: x,       y: y - vz };
    const p1 = { x: x + hx,  y: y - vz + hy };
    const p2 = { x: x,       y: y - vz + hy * 2 };
    const p3 = { x: x - hx,  y: y - vz + hy };

    // Bottom diamond (shifted down)
    const q0 = { x: x,       y: y };
    const q1 = { x: x + hx,  y: y + hy };
    const q2 = { x: x,       y: y + hy * 2 };
    const q3 = { x: x - hx,  y: y + hy };

    // Face alphas (keep subtle)
    const topA   = 0.55 * a;
    const leftA  = 0.35 * a;
    const rightA = 0.45 * a;
    const edgeA  = 0.18 * a;

    // TOP face p0-p1-p2-p3
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.fillStyle = `rgba(255,255,255,${topA})`;
    ctx.fill();

    // RIGHT face p1-q1-q2-p2
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(q1.x, q1.y);
    ctx.lineTo(q2.x, q2.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.closePath();
    ctx.fillStyle = `rgba(255,255,255,${rightA})`;
    ctx.fill();

    // LEFT face p3-p2-q2-q3
    ctx.beginPath();
    ctx.moveTo(p3.x, p3.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(q2.x, q2.y);
    ctx.lineTo(q3.x, q3.y);
    ctx.closePath();
    ctx.fillStyle = `rgba(255,255,255,${leftA})`;
    ctx.fill();

    // Edges
    ctx.strokeStyle = `rgba(255,255,255,${edgeA})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    // top outline
    ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.closePath();
    // verticals
    ctx.moveTo(p1.x, p1.y); ctx.lineTo(q1.x, q1.y);
    ctx.moveTo(p2.x, p2.y); ctx.lineTo(q2.x, q2.y);
    ctx.moveTo(p3.x, p3.y); ctx.lineTo(q3.x, q3.y);
    // bottom partial outline
    ctx.moveTo(q1.x, q1.y); ctx.lineTo(q2.x, q2.y); ctx.lineTo(q3.x, q3.y);
    ctx.stroke();
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function spawnCubelets(x, y, face, amount, strength) {
    const b = faceBias[face] || faceBias.front;

    for (let i = 0; i < amount; i++) {
      if (particles.length >= MAX_PARTICLES) particles.shift();

      // Direction: random + face bias
      let vx = rand(-1, 1) * 0.7 + b.x * 1.3;
      let vy = rand(-1, 1) * 0.7 + b.y * 1.3;

      const dirLen = Math.hypot(vx, vy) || 1;
      const tx = vx / dirLen;  // -1..1
      const ty = vy / dirLen;  // -1..1

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
        tx, ty
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

      // Slight “billow” wobble
      const wobble = Math.sin((p.maxLife - p.life) * 0.35 + p.rot) * 0.18;
      const tiltX = clamp01((p.tx + 1) * 0.5) * 2 - 1; // normalize back to -1..1
      const tiltY = clamp01((p.ty + 1) * 0.5) * 2 - 1;

      drawIsoCube(ctx, p.x, p.y, p.size, a, tiltX + wobble, tiltY - wobble);

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
