// Lettore a pagine per l'estratto: le colonne CSS impaginano il testo, ogni "pagina" è una colonna.
(() => {
  const root = document.getElementById("ereader");
  if (!root) return;
  const $ = (id) => document.getElementById(id);
  const view = $("er-view"), flow = $("er-flow");
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  let size = Math.min(30, Math.max(15, +store.get("er-size") || 19));
  let page = 0, pages = 1, step = 1, last = null;

  function build() {
    flow.replaceChildren();
    document.querySelectorAll(".testo > p:not(.estratto-nota):not(.continua), .testo > blockquote, .testo > h3")
      .forEach((n) => flow.appendChild(n.cloneNode(true)));
    flow.appendChild($("er-fine-tpl").content.cloneNode(true));
  }

  function layout() {
    const pad = Math.max(16, Math.min(40, view.clientWidth * 0.06));
    const w = view.clientWidth - pad * 2;
    flow.style.width = w + "px";
    flow.style.marginLeft = pad + "px";
    flow.style.height = Math.max(120, view.clientHeight - 24) + "px";
    flow.style.columnWidth = w + "px";
    flow.style.columnGap = pad * 2 + "px";
    flow.style.fontSize = size + "px";
    step = w + pad * 2;
    pages = Math.max(1, Math.round((flow.scrollWidth + pad * 2) / step));
    page = Math.min(page, pages - 1);
    go(page, true);
  }

  function go(p, quiet) {
    page = Math.max(0, Math.min(pages - 1, p));
    flow.style.transform = `translateX(${-page * step}px)`;
    $("er-pos").textContent = `Pagina ${page + 1} di ${pages}`;
    $("er-pct").textContent = Math.round(((page + 1) / pages) * 100) + "%";
    $("er-prog").style.width = ((page + 1) / pages) * 100 + "%";
    if (!quiet) last = performance.now();
  }

  function open() {
    build();
    root.hidden = false;
    document.body.classList.add("er-lock");
    layout();
    void root.offsetWidth;            // forza il calcolo prima di far partire la dissolvenza
    root.classList.add("open");
    $("er-close").focus();
  }
  function close() {
    root.classList.remove("open");
    document.body.classList.remove("er-lock");
    setTimeout(() => { root.hidden = true; }, 250);
    $("er-open").focus();
  }
  function resize(d) {
    // si resta sulla stessa percentuale del testo quando cambia la dimensione
    const ratio = pages > 1 ? page / (pages - 1) : 0;
    size = Math.min(30, Math.max(15, size + d));
    store.set("er-size", size);
    layout();
    go(Math.round(ratio * (pages - 1)));
  }

  $("er-open").addEventListener("click", open);
  $("er-close").addEventListener("click", close);
  $("er-prev").addEventListener("click", () => go(page - 1));
  $("er-next").addEventListener("click", () => go(page + 1));
  $("er-minus").addEventListener("click", () => resize(-1));
  $("er-plus").addEventListener("click", () => resize(1));
  addEventListener("resize", () => { if (!root.hidden) layout(); });
  addEventListener("keydown", (e) => {
    if (root.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight" || e.key === "PageDown" || (e.key === " " && !e.shiftKey)) { e.preventDefault(); go(page + 1); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp" || (e.key === " " && e.shiftKey)) { e.preventDefault(); go(page - 1); }
  });
  let x0 = null;
  view.addEventListener("touchstart", (e) => { x0 = e.changedTouches[0].clientX; }, { passive: true });
  view.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) go(page + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();
