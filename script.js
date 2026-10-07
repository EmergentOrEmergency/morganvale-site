import { I18N } from "/lingue.js";
import { Regia } from "/regia.js";

const LANG = I18N[document.documentElement.lang] || I18N.it;
const TEMI = LANG.themes, CASI = LANG.cases, PAGINE = LANG.pages;

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const pad = (n) => String(n).padStart(2, "0");

/* ---- schede e filtri ---- */
const ol = document.getElementById("cards");
CASI.forEach(([t, d, tema], i) => {
  const li = document.createElement("li");
  li.tabIndex = 0;
  li.dataset.i = i;
  li.dataset.tema = tema;
  const n = document.createElement("span"); n.className = "n"; n.textContent = pad(i + 1);
  const h = document.createElement("h3"); h.textContent = t;
  const p = document.createElement("p"); p.textContent = d;
  const th = document.createElement("span"); th.className = "t"; th.textContent = TEMI[tema];
  li.append(n, h, p, th);
  li.style.transitionDelay = `${(i % 3) * 90}ms`;
  li.addEventListener("click", () => openStage(i));
  li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openStage(i); } });
  ol.appendChild(li);
});

const filters = document.getElementById("filters");
[["tutti", LANG.all], ...Object.entries(TEMI)].forEach(([k, label], idx) => {
  const b = document.createElement("button");
  b.type = "button"; b.textContent = label; b.dataset.k = k;
  b.setAttribute("aria-pressed", idx === 0 ? "true" : "false");
  b.addEventListener("click", () => {
    filters.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    ol.querySelectorAll("li").forEach((li) => li.classList.toggle("off", k !== "tutti" && li.dataset.tema !== k));
  });
  filters.appendChild(b);
});

/* ---- lettura a schermata ---- */
const stage = document.getElementById("stage");
let cur = 0, lastFocus = null;
const visibili = () => [...ol.querySelectorAll("li:not(.off)")].map((li) => +li.dataset.i);
function show(i) {
  cur = i;
  document.getElementById("stage-theme").textContent = TEMI[CASI[i][2]];
  document.getElementById("stage-title").textContent = CASI[i][0];
  document.getElementById("stage-text").textContent = CASI[i][1];
  document.getElementById("stage-count").textContent = `${pad(i + 1)} / ${pad(CASI.length)}`;
  const url = PAGINE[i];
  const link = document.getElementById("stage-link");
  link.hidden = !url;
  if (url) link.href = url;
  document.getElementById("stage-src").hidden = !!url;
}
function openStage(i) {
  lastFocus = document.activeElement;
  stage.hidden = false;
  document.body.classList.add("lock");
  show(i);
  requestAnimationFrame(() => stage.classList.add("open"));
  document.getElementById("stage-close").focus();
}
function closeStage() {
  stage.classList.remove("open");
  document.body.classList.remove("lock");
  setTimeout(() => { stage.hidden = true; }, reduce ? 0 : 350);
  if (lastFocus) lastFocus.focus();
}
function step(d) {
  const v = visibili();
  if (!v.length) return;
  const pos = Math.max(0, v.indexOf(cur));
  show(v[(pos + d + v.length) % v.length]);
}
document.getElementById("stage-close").addEventListener("click", closeStage);
document.getElementById("stage-prev").addEventListener("click", () => step(-1));
document.getElementById("stage-next").addEventListener("click", () => step(1));
addEventListener("keydown", (e) => {
  if (stage.hidden) return;
  if (e.key === "Escape") closeStage();
  else if (e.key === "ArrowRight") step(1);
  else if (e.key === "ArrowLeft") step(-1);
});

/* ---- apparizione allo scorrimento ---- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal, .cards li").forEach((el) => io.observe(el));

/* ---- sfondo della home: video se c'è, altrimenti grana animata ---- */
const hero = document.getElementById("hero");
const canvas = document.getElementById("grain");
const ctx = canvas.getContext("2d");
const W = 320, H = 180;
canvas.width = W; canvas.height = H;
const img = ctx.createImageData(W, H);
let t = 0, last = 0, visible = true;
new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 }).observe(hero);
function grain(ts) {
  if (!reduce) requestAnimationFrame(grain);
  if (!visible || ts - last < 120) return; // circa 8 fotogrammi al secondo: grana lenta e morbida
  last = ts; t += 0.006;
  const d = img.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = (y * W + x) * 4;
    // luce lenta che si sposta, più grana
    const l = 11 + 8 * Math.sin(x * 0.012 + t * 2) * Math.cos(y * 0.018 - t) + 5 * Math.sin((x + y) * 0.006 + t);
    const g = Math.max(0, Math.min(255, l + (Math.random() - 0.5) * 14));
    d[k] = d[k + 1] = d[k + 2] = g; d[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}
requestAnimationFrame(grain);

// Video montati dal vivo (regia.js): partono solo senza risparmio dati e senza movimento ridotto.
// Il montaggio si cambia in regia.js; se un video manca o non parte resta la grana animata.
const saver = navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || ""));
if (!reduce && !saver) {
  const regia = new Regia(document.getElementById("regia"));
  hero.classList.add("con-video");
  regia.start();
  // il video si ferma quando la home non è più visibile, per non consumare batteria
  new IntersectionObserver(([e]) => {
    document.querySelectorAll("#regia video.on").forEach((v) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()));
  }, { threshold: 0 }).observe(hero);
}

/* ---- frase che si scrive ---- */
const typed = document.getElementById("typed");
const frase = typed.textContent;
if (!reduce) {
  typed.textContent = "";
  let i = 0;
  setTimeout(function tick() {
    typed.textContent = frase.slice(0, ++i);
    if (i < frase.length) setTimeout(tick, 22 + Math.random() * 26);
  }, 900);
}
