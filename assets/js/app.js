// Cursor glow
(() => {
  const glow = document.getElementById("cursorGlow");
  if(!glow) return;
  window.addEventListener("mousemove",(e)=>{
    glow.style.left = e.clientX + "px";
    glow.style.top  = e.clientY + "px";
  }, {passive:true});
})();

// Starfield canvas (subtle)
(() => {
  const canvas = document.getElementById("starfield");
  if(!canvas) return;
  const ctx = canvas.getContext("2d");
  let w=0,h=0,stars=[];

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    w = canvas.width  = Math.floor(window.innerWidth * dpr);
    h = canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width  = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";

    const count = Math.floor((window.innerWidth * window.innerHeight) / 17000);
    stars = Array.from({length: count}, () => ({
      x: Math.random()*w,
      y: Math.random()*h,
      z: 0.35 + Math.random()*0.75,
      r: 0.6 + Math.random()*1.6,
      tw: Math.random()*Math.PI*2
    }));
  };

  const draw = () => {
    ctx.clearRect(0,0,w,h);
    const dpr = window.devicePixelRatio || 1;

    for(const s of stars){
      s.y += 0.12 * s.z * dpr;
      s.tw += 0.02;
      if(s.y > h){ s.y = -10; s.x = Math.random()*w; }

      const twinkle = 0.25 + 0.2*Math.sin(s.tw);
      ctx.globalAlpha = twinkle * 0.6 * s.z;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * dpr, 0, Math.PI*2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  };

  window.addEventListener("resize", resize, {passive:true});
  resize(); draw();
})();

// Link transitions: any <a data-mode="...">
(() => {
  const overlay = document.getElementById("pageTransition");
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-mode]");
    if(!a) return;
    if(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    const mode = a.getAttribute("data-mode") || "looker";
    const href = a.getAttribute("href");
    if(!overlay){ location.href = href; return; }

    sessionStorage.setItem("enterMode", mode);
    overlay.className = "page-transition fx-" + mode;
    overlay.style.opacity = "1";
    setTimeout(() => location.href = href, 680);
  });

  // On load: set body mode entry class if needed
  const enterMode = sessionStorage.getItem("enterMode");
  if(enterMode){
    document.body.setAttribute("data-enter", enterMode);
    sessionStorage.removeItem("enterMode");
  }
})();
