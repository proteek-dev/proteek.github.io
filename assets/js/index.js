(() => {
  const portal = document.getElementById("cubePortal");
  const stage  = document.querySelector(".cube-stage");
  if(!stage) return;

  // Gentle camera drift (stage parallax)
  let mx=0,my=0;
  window.addEventListener("mousemove",(e)=>{
    const r = stage.getBoundingClientRect();
    mx = ((e.clientX - (r.left + r.width/2)) / r.width);
    my = ((e.clientY - (r.top  + r.height/2)) / r.height);
    stage.style.transform = `translate3d(${mx*10}px, ${my*10}px, 0)`;
  }, {passive:true});

  // Cube portal expand on click
  document.addEventListener("click",(e)=>{
    const btn = e.target.closest(".cube-btn[data-href]");
    if(!btn) return;
    if(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const href = btn.getAttribute("data-href");
    const mode = btn.getAttribute("data-mode") || "looker";
    sessionStorage.setItem("enterMode", mode);

    const r = btn.getBoundingClientRect();
    const cx = (r.left + r.width/2) + "px";
    const cy = (r.top  + r.height/2) + "px";

    portal.style.setProperty("--cx", cx);
    portal.style.setProperty("--cy", cy);
    portal.classList.add("show");

    const overlay = document.getElementById("pageTransition");
    if(overlay){
      overlay.className = "page-transition fx-" + mode;
      overlay.style.opacity = "1";
    }

    setTimeout(()=> location.href = href, 720);
  });
})();
