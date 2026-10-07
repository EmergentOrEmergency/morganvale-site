import { I18N } from "/lingue.js";
import { SEQUENZA } from "/regia.js";

const LANG = I18N[document.documentElement.lang] || I18N.it;
const TEMI = LANG.themes, CASI = LANG.cases, PAGINE = LANG.pages, S = LANG.sala;

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, "0");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(pointer: coarse)").matches;

function fail(msg) {
  const f = $("fail");
  f.prepend(msg + " ");
  f.hidden = false;
  $("intro-msg").hidden = true;
}

async function main() {
  let THREE;
  try {
    THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
  } catch (e) {
    return fail(S.fail_load);
  }
  await Promise.all([
    document.fonts.load('64px "IBM Plex Mono"'),
    document.fonts.load('italic 28px "EB Garamond"'),
  ]).catch(() => {});

  const canvas = $("c");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !coarse });
  } catch (e) {
    return fail(S.fail_gl);
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight, false);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03050a);
  scene.fog = new THREE.FogExp2(0x03050a, 0.085);
  const camera = new THREE.PerspectiveCamera(coarse ? 72 : 65, innerWidth / innerHeight, 0.05, 60);
  camera.rotation.order = "YXZ";

  /* ---------- texture di servizio ---------- */
  const tex = (w, h, draw) => {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return { t, c };
  };

  const floorTex = tex(128, 128, (g, w, h) => {
    g.fillStyle = "#10151f"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#1c2433"; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3);
    g.fillStyle = "#0c1019";
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) g.fillRect(12 + i * 14, 12 + j * 14, 3, 3);
  }).t;
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(6 / 0.6, 45 / 0.6);

  const doorTex = tex(128, 256, (g, w, h) => {
    g.fillStyle = "#0e131c"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#070a10";
    for (let y = 14; y < h - 14; y += 7) g.fillRect(12, y, w - 24, 3);
    g.strokeStyle = "#232c3b"; g.lineWidth = 2; g.strokeRect(2, 2, w - 4, h - 4);
    g.fillStyle = "#2a3445"; g.fillRect(w - 18, h / 2 - 22, 5, 44);
  }).t;

  /* ---------- stanza ---------- */
  const room = new THREE.Mesh(
    new THREE.BoxGeometry(6, 3.2, 41),
    new THREE.MeshStandardMaterial({ color: 0x0b0f17, roughness: 0.9, metalness: 0.1, side: THREE.BackSide })
  );
  room.position.set(0, 1.6, -16.6);
  scene.add(room);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 41),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.38, metalness: 0.25, color: 0xbbbbbb })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.001, -16.6);
  floorTex.repeat.set(6 / 0.6, 41 / 0.6);
  scene.add(floor);

  scene.add(new THREE.HemisphereLight(0x8fa0c0, 0x05070c, 0.35));
  const stripGeo = new THREE.BoxGeometry(0.16, 0.02, 1.4);
  const stripMat = new THREE.MeshBasicMaterial({ color: 0xcdd8ee });
  for (let z = -1; z > -36; z -= 4.5) {
    const s = new THREE.Mesh(stripGeo, stripMat);
    s.position.set(0, 3.17, z);
    scene.add(s);
    const l = new THREE.PointLight(0xbcd0ff, 11, 11, 2);
    l.position.set(0, 2.9, z - 0.4);
    scene.add(l);
  }

  /* ---------- armadi ---------- */
  const rackGeo = new THREE.BoxGeometry(0.95, 2.1, 0.8);
  const rackMat = new THREE.MeshStandardMaterial({ color: 0x0d121b, roughness: 0.55, metalness: 0.7 });
  const doorGeo = new THREE.PlaneGeometry(0.74, 1.95);
  const doorMat = new THREE.MeshStandardMaterial({ map: doorTex, roughness: 0.5, metalness: 0.5 });
  const plateGeo = new THREE.PlaneGeometry(0.66, 0.26);

  const SLOTS = 36, X_FACE = 1.15, DEPTH = 0.95;
  const ledPos = [];
  const picks = [];
  const plates = [];
  const makePlate = (i) => tex(512, 200, (g, w, h) => {
    g.fillStyle = "#090c13"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#8d94a3"; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = "#e8e2d3"; g.textBaseline = "alphabetic";
    g.font = '64px "IBM Plex Mono", monospace';
    g.fillText(pad(i + 1), 28, 96);
    let size = 40; const title = CASI[i][0];
    do { g.font = `italic ${size}px "EB Garamond", Georgia, serif`; size -= 2; } while (g.measureText(title).width > w - 56 && size > 18);
    g.fillText(title, 28, 160);
  }).t;

  const caseSlot = (i) => ({ side: i % 2 === 0 ? -1 : 1, slot: 3 + 3 * Math.floor(i / 2) });
  const caseAt = new Map();
  CASI.forEach((_, i) => { const { side, slot } = caseSlot(i); caseAt.set(`${side}:${slot}`, i); });

  for (const side of [-1, 1]) {
    for (let k = 0; k < SLOTS; k++) {
      const z = -2.2 - k * 0.85;
      const x = side * (X_FACE + DEPTH / 2);
      const body = new THREE.Mesh(rackGeo, rackMat);
      body.position.set(x, 1.05, z);
      scene.add(body);
      const door = new THREE.Mesh(doorGeo, doorMat);
      door.position.set(side * (X_FACE - 0.003), 0.98, z);
      door.rotation.y = side * -Math.PI / 2;
      scene.add(door);
      for (let n = 0; n < 7; n++) ledPos.push([side * (X_FACE - 0.012), 0.25 + Math.random() * 1.45, z + (Math.random() - 0.5) * 0.6, side]);

      const i = caseAt.get(`${side}:${k}`);
      if (i !== undefined) {
        body.userData.i = i;
        picks.push(body);
        const pm = new THREE.MeshBasicMaterial({ map: makePlate(i), color: 0x8e95a3, toneMapped: false });
        const plate = new THREE.Mesh(plateGeo, pm);
        plate.position.set(side * (X_FACE - 0.012), 1.8, z);
        plate.rotation.y = side * -Math.PI / 2;
        plate.userData.i = i;
        scene.add(plate);
        picks.push(plate);
        plates[i] = pm;
      }
    }
  }

  /* LED degli armadi (un solo oggetto istanziato) */
  const ledMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.014, 0.03), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), ledPos.length);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  ledPos.forEach(([x, y, z], n) => {
    m4.makeTranslation(x, y, z);
    ledMesh.setMatrixAt(n, m4);
    ledMesh.setColorAt(n, col.setHex(Math.random() < 0.4 ? 0xc7ccd8 : 0x111418));
  });
  scene.add(ledMesh);
  const ON = new THREE.Color(0xd5dae6), OFF = new THREE.Color(0x0e1116), DIM = new THREE.Color(0x4a505c);

  /* ---------- schermo in fondo al corridoio: la regia dal vivo ---------- */
  const tv = document.createElement("video");
  tv.muted = true; tv.playsInline = true; tv.preload = "auto"; tv.crossOrigin = "anonymous";
  let ti = 0;
  const clip = () => SEQUENZA[ti % SEQUENZA.length];
  function avvia() {
    const c = clip();
    tv.src = c.src;
    tv.addEventListener("loadeddata", () => { tv.currentTime = c.da; tv.playbackRate = c.vel; tv.play().catch(() => {}); }, { once: true });
    tv.load();
  }
  tv.addEventListener("timeupdate", () => { if (tv.currentTime >= clip().a - 0.08) { ti++; avvia(); } });
  tv.addEventListener("ended", () => { ti++; avvia(); });
  if (!reduce) avvia();
  const vt = new THREE.VideoTexture(tv);
  vt.colorSpace = THREE.SRGBColorSpace;
  const totemMat = new THREE.MeshBasicMaterial({ map: vt, color: 0xbfc4cf, toneMapped: false, fog: false });
  const totem = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.47), totemMat);
  totem.position.set(0, 1.55, -36.9);
  scene.add(totem);
  const totemFrame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.57, 0.08), new THREE.MeshBasicMaterial({ color: 0x07090d, fog: false }));
  totemFrame.position.set(0, 1.55, -37.0);
  scene.add(totemFrame);
  const totemLight = new THREE.PointLight(0xc9d4ee, 7, 9, 2);
  totemLight.position.set(0, 1.6, -35.4);
  scene.add(totemLight);

  /* ---------- scrivania ---------- */
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x151a24, roughness: 0.6, metalness: 0.3 });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.8), deskMat);
  desk.position.set(0, 0.74, 3.05);
  scene.add(desk);
  for (const lx of [-0.8, 0.8]) for (const lz of [2.72, 3.38]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.72, 0.04), deskMat);
    leg.position.set(lx, 0.36, lz);
    scene.add(leg);
  }
  const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.06, 20), new THREE.MeshStandardMaterial({ color: 0x10141c, roughness: 0.7 }));
  stool.position.set(0, 0.5, 1.85);
  scene.add(stool);
  const stoolLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), deskMat);
  stoolLeg.position.set(0, 0.25, 1.85);
  scene.add(stoolLeg);

  const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.44, 0.04), new THREE.MeshStandardMaterial({ color: 0x07090d, roughness: 0.5 }));
  bezel.position.set(0, 1.08, 3.3);
  scene.add(bezel);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.05), deskMat);
  stand.position.set(0, 0.87, 3.3);
  scene.add(stand);

  const screen = tex(512, 310, () => {});
  const sg = screen.c.getContext("2d");
  let sent = false, lastScr = 0;
  function drawScreen(now) {
    const w = 512, h = 310;
    sg.fillStyle = "#06080d"; sg.fillRect(0, 0, w, h);
    sg.fillStyle = "#151a24"; sg.fillRect(0, 0, w, 34);
    sg.fillStyle = "#6e7686"; sg.font = '15px "IBM Plex Mono", monospace';
    sg.fillText(S.schermo.nuovo, 16, 22);
    sg.strokeStyle = "#1c2433"; sg.strokeRect(16.5, 56.5, w - 33, 150);
    sg.fillStyle = "#d9d4c6"; sg.font = '26px "IBM Plex Mono", monospace';
    const dots = 1 + Math.floor(now / 500) % 3;
    if (!sent) {
      sg.fillText(S.schermo.l1, 32, 100);
      sg.fillStyle = "#8d94a3"; sg.fillText(S.schermo.l2, 32, 136);
      const t = S.schermo.l3 + (Math.floor(now / 550) % 2 ? "▍" : "");
      sg.fillStyle = "#e8e2d3"; sg.fillText(t, 32, 172);
      sg.fillStyle = "#4b5260";
      for (let d = 0; d < 3; d++) { sg.globalAlpha = d < dots ? 1 : 0.25; sg.beginPath(); sg.arc(w - 90 + d * 22, 238, 6, 0, 7); sg.fill(); }
      sg.globalAlpha = 1;
    } else {
      sg.fillStyle = "#e8e2d3"; sg.fillText(S.schermo.inviato, 32, 110);
    }
    sg.fillStyle = sent ? "#2a3040" : "#e8e2d3";
    sg.fillRect(w - 128, 262, 100, 30);
    sg.fillStyle = "#06080d"; sg.font = '15px "IBM Plex Mono", monospace';
    sg.fillText(S.schermo.invia, w - 100, 282);
    screen.t.needsUpdate = true;
  }
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.387), new THREE.MeshBasicMaterial({ map: screen.t, toneMapped: false }));
  scr.position.set(0, 1.08, 3.277);
  scr.rotation.y = Math.PI;
  scene.add(scr);
  const kb = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.02, 0.16), new THREE.MeshStandardMaterial({ color: 0x0c1017, roughness: 0.5 }));
  kb.position.set(0, 0.775, 2.88);
  scene.add(kb);
  const enter = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.012, 0.035), new THREE.MeshBasicMaterial({ color: 0xe8e2d3, toneMapped: false }));
  enter.position.set(0.17, 0.79, 2.9);
  scene.add(enter);
  const lamp = new THREE.PointLight(0xdfe8ff, 5, 5, 2);
  lamp.position.set(0, 1.5, 2.6);
  scene.add(lamp);

  /* ---------- camera e movimento ---------- */
  let yaw = Math.PI, pitch = -0.05;
  const pos = new THREE.Vector3(0, 1.15, 1.7);
  const vel = new THREE.Vector2();
  const input = { f: 0, s: 0 };
  let state = "intro", tTurn = 0, panelOpen = false;
  const Z_MIN = -34, Z_MAX = 1.2, X_LIM = 0.9;

  function applyCamera() {
    camera.position.copy(pos);
    camera.rotation.set(pitch, yaw, 0);
  }

  function send() {
    if (state !== "intro") return;
    sent = true; drawScreen(performance.now());
    $("intro-msg").classList.add("off");
    state = "turning"; tTurn = 0;
    if (reduce) tTurn = 1;
  }
  $("send").addEventListener("click", send);
  addEventListener("keydown", (e) => {
    if (panelOpen) return;
    if (state === "intro" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); send(); return; }
    if (state !== "free") return;
    const k = e.code;
    if (k === "KeyW" || k === "ArrowUp") input.f = 1;
    else if (k === "KeyS" || k === "ArrowDown") input.f = -1;
    else if (k === "KeyA" || k === "ArrowLeft") input.s = -1;
    else if (k === "KeyD" || k === "ArrowRight") input.s = 1;
  });
  addEventListener("keyup", (e) => {
    const k = e.code;
    if (k === "KeyW" || k === "ArrowUp" || k === "KeyS" || k === "ArrowDown") input.f = 0;
    if (k === "KeyA" || k === "ArrowLeft" || k === "KeyD" || k === "ArrowRight") input.s = 0;
  });
  addEventListener("wheel", (e) => {
    if (state !== "free" || panelOpen) return;
    pos.z = Math.min(Z_MAX, Math.max(Z_MIN, pos.z + e.deltaY * 0.004));   // rotella in avanti = si avanza
  }, { passive: true });

  if (coarse) {
    $("pad").hidden = false;
    const hold = (id, v) => {
      const b = $(id);
      b.addEventListener("pointerdown", (e) => { e.preventDefault(); if (state === "free") input.f = v; });
      for (const ev of ["pointerup", "pointercancel", "pointerleave"]) b.addEventListener(ev, () => { input.f = 0; });
    };
    hold("go-f", 1); hold("go-b", -1);
  }

  /* sguardo: trascinamento; clic: apre l'armadio */
  const ray = new THREE.Raycaster();
  ray.far = 14;
  const ndc = new THREE.Vector2();
  let drag = null, focus = -1;
  const cap = $("caption");
  function setFocus(i) {
    if (i === focus) return;
    if (focus >= 0 && plates[focus]) plates[focus].color.setHex(0x8e95a3);
    focus = i;
    if (i >= 0) {
      plates[i].color.setHex(0xffffff);
      cap.textContent = `${pad(i + 1)} · ${CASI[i][0]} — ${S.apri}`;
      cap.classList.add("on");
      canvas.classList.add("over");
    } else {
      cap.classList.remove("on");
      canvas.classList.remove("over");
    }
  }
  function pickAt(x, y) {
    ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(picks, false)[0];
    return h ? h.object.userData.i : -1;
  }
  canvas.addEventListener("pointerdown", (e) => {
    if (state !== "free" || panelOpen) return;
    drag = { x: e.clientX, y: e.clientY, moved: 0, t: performance.now() };
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("grab");
  });
  canvas.addEventListener("pointermove", (e) => {
    if (state !== "free" || panelOpen) return;
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      drag.x = e.clientX; drag.y = e.clientY;
      yaw -= dx * 0.0042; pitch = Math.max(-0.7, Math.min(0.55, pitch - dy * 0.0042));
    } else if (!coarse) {
      setFocus(pickAt(e.clientX, e.clientY));
    }
  });
  canvas.addEventListener("pointerup", (e) => {
    canvas.classList.remove("grab");
    if (!drag) return;
    const click = drag.moved < 8 && performance.now() - drag.t < 500;
    drag = null;
    if (click && state === "free" && !panelOpen) {
      const i = pickAt(e.clientX, e.clientY);
      if (i >= 0) openPanel(i);
    }
  });

  /* ---------- pannello della storia ---------- */
  const stage = $("stage");
  let cur = 0;
  function show(i) {
    cur = i;
    $("stage-theme").textContent = TEMI[CASI[i][2]];
    $("stage-title").textContent = CASI[i][0];
    $("stage-text").textContent = CASI[i][1];
    $("stage-count").textContent = `${pad(i + 1)} / ${pad(CASI.length)}`;
    const url = PAGINE[i];
    const link = $("stage-link");
    link.hidden = !url;
    if (url) link.href = url;
    $("stage-src").hidden = !!url;
  }
  function openPanel(i) {
    panelOpen = true; input.f = input.s = 0;
    stage.hidden = false; show(i);
    requestAnimationFrame(() => stage.classList.add("open"));
    $("stage-close").focus();
  }
  function closePanel() {
    stage.classList.remove("open"); panelOpen = false;
    setTimeout(() => { stage.hidden = true; }, reduce ? 0 : 350);
    canvas.focus?.();
  }
  $("stage-close").addEventListener("click", closePanel);
  $("stage-prev").addEventListener("click", () => show((cur + CASI.length - 1) % CASI.length));
  $("stage-next").addEventListener("click", () => show((cur + 1) % CASI.length));
  addEventListener("keydown", (e) => {
    if (!panelOpen) return;
    if (e.key === "Escape") closePanel();
    else if (e.key === "ArrowRight") $("stage-next").click();
    else if (e.key === "ArrowLeft") $("stage-prev").click();
  });

  /* ---------- ciclo ---------- */
  addEventListener("resize", () => {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  });
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const raw = (now - last) / 1000, dt = Math.min(0.05, raw); last = now;

    if (now - lastScr > 180) { drawScreen(now); lastScr = now; }

    for (let n = 0; n < 24; n++) {
      const idx = (Math.random() * ledPos.length) | 0;
      const r = Math.random();
      ledMesh.setColorAt(idx, r < 0.35 ? ON : r < 0.6 ? DIM : OFF);
    }
    ledMesh.instanceColor.needsUpdate = true;

    if (state === "turning") {
      tTurn = Math.min(1, tTurn + Math.min(raw, 0.5) / 2.6);
      const e = ease(tTurn);
      yaw = Math.PI * (1 - e);
      pos.z = 1.7 + (0.9 - 1.7) * e;
      pos.y = 1.15 + (1.62 - 1.15) * e;
      pitch = -0.05 * (1 - e);
      if (tTurn >= 1) {
        state = "free";
        $("hint").hidden = false;
        setTimeout(() => $("hint").classList.add("off"), 9000);
      }
    } else if (state === "free" && !panelOpen) {
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
      const tx = (fx * input.f + rx * input.s) * 2.1, tz = (fz * input.f + rz * input.s) * 2.1;
      vel.x += (tx - vel.x) * Math.min(1, dt * 8);
      vel.y += (tz - vel.y) * Math.min(1, dt * 8);
      pos.x = Math.max(-X_LIM, Math.min(X_LIM, pos.x + vel.x * dt));
      pos.z = Math.max(Z_MIN, Math.min(Z_MAX, pos.z + vel.y * dt));
      if (coarse && !drag) setFocus(pickAt(innerWidth / 2, innerHeight / 2));
    }
    applyCamera();
    renderer.render(scene, camera);
  }
  drawScreen(performance.now());
  applyCamera();
  requestAnimationFrame(frame);
}

main().catch((e) => { console.error("sala:", e); fail(S.fail_gen); });
