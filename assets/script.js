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
