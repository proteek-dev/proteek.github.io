(function () {
  const warp = document.getElementById("portalWarp");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll(".lens").forEach(btn => {
    btn.addEventListener("click", () => {
      const href = btn.getAttribute("data-href");
      if (!href) return;

      // Reduced motion: just navigate
      if (prefersReduced) {
        location.href = href;
        return;
      }

      // Cinematic warp
      warp.classList.add("on");

      // tiny delay feels “intentional”
      setTimeout(() => {
        location.href = href;
      }, 460);
    });
  });
})();
