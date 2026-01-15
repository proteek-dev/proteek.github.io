// Active nav highlight
(function(){
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(a=>{
    const href = a.getAttribute("href");
    if(href === path) a.classList.add("active");
    if(path.startsWith("projects/") && href === "projects.html") a.classList.add("active");
  });
})();

// Command palette data (edit these)
const paletteItems = [
  { title: "Home", desc: "System overview + featured projects", tag: "NAV", href: "index.html" },
  { title: "Projects", desc: "Selected missions + case studies", tag: "NAV", href: "projects.html" },
  { title: "AI Lab", desc: "Interactive demos + prototypes", tag: "NAV", href: "lab.html" },
  { title: "About", desc: "Story + principles + skills", tag: "NAV", href: "about.html" },
  { title: "Contact", desc: "Email + links + message", tag: "NAV", href: "contact.html" },

  { title: "Ask My Work (RAG Portfolio Agent)", desc: "RAG assistant over projects/resume", tag: "PROJECT", href: "projects/ask-my-work-rag-agent.html" },
  { title: "Automated Excel Consolidation Engine", desc: "SharePoint → merged workbook with rules", tag: "PROJECT", href: "projects/excel-consolidation-sharepoint-pipeline.html" },
  { title: "Fleet Telemetry: Engine Runtime Storyboard", desc: "Power BI storytelling for engine use", tag: "PROJECT", href: "projects/fleet-telemetry-engine-runtime-storyboard.html" },
];

function openPalette(){
  const pal = document.getElementById("pal");
  const input = document.getElementById("palInput");
  pal.classList.add("open");
  setTimeout(()=>input.focus(), 40);
  renderPalette("");
}
function closePalette(){
  document.getElementById("pal").classList.remove("open");
}
function renderPalette(q){
  const list = document.getElementById("palList");
  const query = (q||"").toLowerCase().trim();
  const items = paletteItems.filter(i =>
    !query || (i.title.toLowerCase().includes(query) || i.desc.toLowerCase().includes(query) || i.tag.toLowerCase().includes(query))
  );
  list.innerHTML = items.map(i => `
    <div class="palitem" data-href="${i.href}">
      <div class="left">
        <div class="title">${i.title}</div>
        <div class="desc">${i.desc}</div>
      </div>
      <div class="tag">${i.tag}</div>
    </div>
  `).join("") || `<div class="palitem"><div class="left"><div class="title">No results</div><div class="desc">Try another keyword</div></div><div class="tag">—</div></div>`;

  list.querySelectorAll(".palitem[data-href]").forEach(el=>{
    el.addEventListener("click", ()=> location.href = el.dataset.href);
  });
}

document.addEventListener("keydown",(e)=>{
  const isMac = navigator.platform.toLowerCase().includes("mac");
  const cmdk = (isMac && e.metaKey && e.key.toLowerCase()==="k") || (!isMac && e.ctrlKey && e.key.toLowerCase()==="k");
  if(cmdk){ e.preventDefault(); openPalette(); }
  if(e.key === "Escape") closePalette();
});

document.addEventListener("click",(e)=>{
  const btn = e.target.closest("[data-open-palette]");
  if(btn) openPalette();

  const backdrop = e.target.id === "pal";
  if(backdrop) closePalette();
});

document.addEventListener("input",(e)=>{
  if(e.target && e.target.id==="palInput") renderPalette(e.target.value);
});

/* ---------- Cursor glow follow ---------- */
(function(){
  const glow = document.getElementById("cursorGlow");
  if(!glow) return;

  let x = 0, y = 0, tx = 0, ty = 0;
  window.addEventListener("mousemove", (e)=>{
    tx = e.clientX - 260;
    ty = e.clientY - 260;
  });

  function tick(){
    x += (tx - x) * 0.12;
    y += (ty - y) * 0.12;
    glow.style.left = x + "px";
    glow.style.top = y + "px";
    requestAnimationFrame(tick);
  }
  tick();
})();

/* ---------- Reveal on load (stagger) ---------- */
(function(){
  const items = Array.from(document.querySelectorAll("[data-animate]"));
  if(!items.length) return;

  // Apply optional delays
  items.forEach(el=>{
    const d = parseInt(el.getAttribute("data-delay") || "0", 10);
    el.style.transitionDelay = (d/1000) + "s";
  });

  // Intersection observer
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  items.forEach(el=> io.observe(el));
})();

/* ---------- Starfield (optional) ---------- */
(function(){
  const canvas = document.getElementById("starfield");
  if(!canvas) return;

  const ctx = canvas.getContext("2d");
  let w, h, stars;

  function resize(){
    w = canvas.width = window.innerWidth * devicePixelRatio;
    h = canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";

    const count = Math.floor((window.innerWidth * window.innerHeight) / 18000);
    stars = Array.from({length: count}, ()=>({
      x: Math.random()*w,
      y: Math.random()*h,
      z: 0.3 + Math.random()*0.7,
      r: 0.6 + Math.random()*1.4
    }));
  }

  function draw(){
    ctx.clearRect(0,0,w,h);
    // no hard-coded colors; we use subtle white alpha only
    for(const s of stars){
      s.y += 0.15 * s.z * devicePixelRatio;
      if(s.y > h) { s.y = -10; s.x = Math.random()*w; }

      ctx.globalAlpha = 0.35 * s.z;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * devicePixelRatio, 0, Math.PI*2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  draw();
})();

/* ---------- Mode-based transitions ---------- */
(function(){
  const overlay = document.getElementById("pageTransition");

  // Entry animation on load
  const enterMode = sessionStorage.getItem("enterMode");
  if(enterMode){
    document.body.classList.add("enter-" + enterMode);
    sessionStorage.removeItem("enterMode");
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-mode]");
    if(!a) return;

    // allow new tab
    if(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    const mode = a.getAttribute("data-mode");
    const href = a.getAttribute("href");

    if(!overlay){ location.href = href; return; }

    sessionStorage.setItem("enterMode", mode);
    overlay.className = "page-transition fx-" + mode;
    overlay.style.opacity = "1";
    setTimeout(() => { location.href = href; }, 620);
  });
})();

/* ---------- Cube expand navigation ---------- */
(function(){
  const portal = document.getElementById("cubePortal");
  if(!portal) return;

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".cube-wrap[data-href]");
    if(!btn) return;

    // allow new tab
    if(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const href = btn.getAttribute("data-href");
    const mode = btn.getAttribute("data-mode") || "looker";

    // store entry mode for next page animation (if you already use this)
    sessionStorage.setItem("enterMode", mode);

    // burst from cube center
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    const burst = document.createElement("div");
    burst.className = "cube-burst";
    burst.style.left = cx + "px";
    burst.style.top = cy + "px";
    document.body.appendChild(burst);

    // show portal
    portal.classList.add("show");

    // also trigger your existing page transition overlay if present
    const pageOverlay = document.getElementById("pageTransition");
    if(pageOverlay){
      pageOverlay.className = "page-transition fx-" + mode;
      pageOverlay.style.opacity = "1";
    }

    // navigate after animation
    setTimeout(() => { location.href = href; }, 520);

    // cleanup burst
    setTimeout(() => burst.remove(), 650);
  });
})();
