// Montaggio dal vivo: una sequenza di clip con tagli, rallentamenti e dissolvenze,
// calcolata nel browser. Per cambiare il montaggio basta cambiare l'elenco SEQUENZA.
// Ogni clip: src, da (secondo di inizio), a (secondo di fine), vel (velocità di riproduzione).
// Clip generate con Gemini (abbonamento a pagamento). Si aggiungono qui le prossime.
// Il corridoio di Kling (piano gratuito, senza uso commerciale) non è incluso: va rigenerato prima.
export const SEQUENZA = [
  { src: "/assets/video/hero-01-tasto.mp4",  da: 0.0, a: 10.0, vel: 1.0 },
  { src: "/assets/video/hero-02-occhio.mp4", da: 0.0, a: 10.0, vel: 0.9 },
];

export class Regia {
  /** root: elemento che contiene i due video. seq: elenco di clip. fade: secondi di dissolvenza. */
  constructor(root, seq = SEQUENZA, { fade = 1.2, base = "" } = {}) {
    this.seq = seq; this.fade = fade; this.i = 0; this.on = 0; this.vivo = false;
    this.v = [0, 1].map(() => {
      const v = document.createElement("video");
      v.className = "rv"; v.muted = true; v.loop = false; v.playsInline = true;
      v.preload = "auto"; v.disablePictureInPicture = true; v.setAttribute("aria-hidden", "true");
      v.addEventListener("error", () => this.ferma());
      root.appendChild(v);
      return v;
    });
    this.base = base;
    this.tick = this.tick.bind(this);
  }

  carica(v, c) {
    v.src = this.base + c.src;
    v.playbackRate = c.vel;
    v.currentTime = c.da;
  }

  start() {
    if (this.vivo) return;
    this.vivo = true;
    const c = this.seq[0];
    const v = this.v[0];
    this.carica(v, c);
    v.addEventListener("loadeddata", () => { v.currentTime = c.da; v.playbackRate = c.vel; v.play().then(() => v.classList.add("on")).catch(() => {}); }, { once: true });
    requestAnimationFrame(this.tick);
  }

  ferma() {
    this.vivo = false;
    this.v.forEach((v) => { v.pause(); v.classList.remove("on"); });
  }

  tick() {
    if (!this.vivo) return;
    requestAnimationFrame(this.tick);
    if (document.hidden) return;
    const c = this.seq[this.i], v = this.v[this.on];
    // quando manca un secondo di dissolvenza (in tempo di clip) parte la clip successiva
    if (v.currentTime >= c.a - this.fade * c.vel) {
      const j = (this.i + 1) % this.seq.length, n = this.seq[j], w = this.v[1 - this.on];
      this.carica(w, n);
      const via = () => { w.currentTime = n.da; w.playbackRate = n.vel; w.play().then(() => { w.classList.add("on"); v.classList.remove("on"); }).catch(() => {}); };
      if (w.readyState >= 2) via(); else w.addEventListener("loadeddata", via, { once: true });
      const vecchio = v;
      setTimeout(() => vecchio.pause(), this.fade * 1000 + 200);
      this.i = j; this.on = 1 - this.on;
    }
  }
}
