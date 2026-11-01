// The studio film: 480 frames path-traced in Blender Cycles, drawn to a canvas and scrubbed by scroll.
// Between two rendered frames the canvas cross-fades, so scrubbing stays smooth at any speed.
import { gsap, ScrollTrigger, splitChars, reduced } from './motion.js';

const FRAMES = 480;
// HTML ranges (data-from/to/on) are written in 240-frame story time (0–239).
const SRC_W = 1920;
const SRC_H = 1080;

const film = document.querySelector('.film');
const canvas = film.querySelector('.film-canvas');
const ctx = canvas.getContext('2d');
const chapters = [...film.querySelectorAll('.chapter')];
const callouts = [...film.querySelectorAll('.callout')];
const rig = film.querySelector('.rig');
const rigLights = [...rig.querySelectorAll('li')];
const frameNo = document.getElementById('frameNo');
const headlineInners = [...film.querySelectorAll('.hl-inner')];

const set = window.innerWidth >= 900 ? 'd' : 'm';
const images = new Array(FRAMES);
const loaded = new Uint8Array(FRAMES);
let anchors = null;
let target = 0;      // frame the scroll position asks for
let current = 0;     // frame being shown (eases toward target)
let drawn = -1;
let W = 0, H = 0, scale = 1, offX = 0, offY = 0;
let filmST = null;
let lastChapter = -1;

const src = (i) => `/seq/${set}/${String(i).padStart(4, '0')}.webp`;

export function initFilm() {
  headlineInners.forEach((el) => splitChars(el));
  resize();
  window.addEventListener('resize', resize);

  fetch('/seq/anchors.json').then((r) => r.json()).then((d) => { anchors = d.anchors; }).catch(() => {});
  const ready = loadFrames();

  filmST = ScrollTrigger.create({
    trigger: film,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => { target = self.progress * (FRAMES - 1); },
    onEnterBack: () => { lastChapter = -1; uiFrame = -1; }, // re-announce the chapter on the way back
  });

  // Each chapter fades in over its frame range.
  chapters.forEach((ch) => gsap.set(ch, { autoAlpha: 0 }));
  gsap.ticker.add(tick);
  return ready;
}

// Frame 0 first, then coarse passes (every 16th, 8th, ...) so scrubbing works early, then the rest.
// The returned promise resolves once every 8th frame is in (or after 6 s on a slow connection),
// so the loader never hands over to a choppy film.
function loadFrames() {
  const order = [0];
  const seen = new Uint8Array(FRAMES); seen[0] = 1;
  for (const step of [16, 8, 4, 2, 1]) {
    for (let i = 0; i < FRAMES; i += step) if (!seen[i]) { seen[i] = 1; order.push(i); }
  }
  const coarseCount = Math.ceil(FRAMES / 8);
  let done = 0;
  let resolveReady;
  const ready = new Promise((r) => { resolveReady = r; });
  setTimeout(() => resolveReady(), 6000);

  let next = 0;
  const finish = () => { if (++done >= coarseCount) resolveReady(); pump(); };
  const pump = () => {
    if (next >= order.length) return;
    const i = order[next++];
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      // decode off the main thread before first use, so drawing never stalls
      (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => {
        images[i] = img; loaded[i] = 1;
        drawn = -1;
        finish();
      });
    };
    img.onerror = finish;
    img.src = src(i);
  };
  for (let k = 0; k < 8; k++) pump(); // eight parallel requests
  return ready;
}

function nearestLoaded(i) {
  for (let d = 0; d < FRAMES; d++) {
    if (i - d >= 0 && loaded[i - d]) return i - d;
    if (i + d < FRAMES && loaded[i + d]) return i + d;
  }
  return -1;
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = canvas.clientWidth; H = canvas.clientHeight;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // "cover" fit; on tall screens keep the car (right of centre) in view
  scale = Math.max(W / SRC_W, H / SRC_H);
  const portrait = H > W;
  offX = (W - SRC_W * scale) * (portrait ? 0.78 : 0.5);
  offY = (H - SRC_H * scale) * 0.5;
  drawn = -1;
}

let drawnPos = -1;
let uiFrame = -1;

function tick() {
  const delta = target - current;
  current = Math.abs(delta) < 0.01 ? target : current + delta * (reduced ? 1 : 0.14);
  const pos = Math.max(0, Math.min(FRAMES - 1, current));

  // Redraw only when the position moved (or a newly loaded frame can improve the picture).
  if (Math.abs(pos - drawnPos) > 0.004 || drawn === -1) {
    const a = Math.floor(pos);
    const b = Math.min(FRAMES - 1, a + 1);
    const t = pos - a;
    const ia = loaded[a] ? a : nearestLoaded(a);
    if (ia >= 0) {
      ctx.globalAlpha = 1;
      ctx.drawImage(images[ia], offX, offY, SRC_W * scale, SRC_H * scale);
      // cross-fade toward the next rendered frame: sub-frame smoothness
      if (t > 0.02 && loaded[b] && b !== ia) {
        ctx.globalAlpha = t;
        ctx.drawImage(images[b], offX, offY, SRC_W * scale, SRC_H * scale);
        ctx.globalAlpha = 1;
      }
      drawnPos = pos;
      drawn = loaded[a] ? a : -1;
    }
  }

  const f = Math.round(pos);
  if (f !== uiFrame) {
    uiFrame = f;
    frameNo.textContent = String(f).padStart(3, '0');
    updateUI((f / (FRAMES - 1)) * 239); // first and last rendered frames = story frames 0 and 239
  }
  placeCallouts(pos);
}

function inRange(el, f) {
  return f >= Number(el.dataset.from) && f <= Number(el.dataset.to);
}

function updateUI(f) {
  chapters.forEach((ch) => {
    const on = inRange(ch, f);
    if (on !== ch._on) {
      ch._on = on;
      gsap.to(ch, { autoAlpha: on ? 1 : 0, y: on ? 0 : -16, duration: on ? 1 : 0.5, overwrite: true });
      if (on && !ch._played) {
        ch._played = true;
        gsap.from(ch.querySelectorAll('.ch-kicker, .ch-title, .ch-specs > div, .ch-price, .ch-actions'),
          { y: 30, opacity: 0, duration: 1.1, stagger: 0.08 });
      }
    }
  });

  const rigOn = inRange(rig, f);
  if (rigOn !== rig._on) { rig._on = rigOn; gsap.to(rig, { autoAlpha: rigOn ? 1 : 0, duration: 0.6 }); }
  rigLights.forEach((li) => li.classList.toggle('is-on', f >= Number(li.dataset.on)));

  callouts.forEach((c) => {
    const on = inRange(c, f);
    if (on !== c._on) {
      c._on = on;
      c.classList.toggle('is-on', on);
    }
  });

  const names = ['Lights on', 'Walkaround', 'Details', 'Yours'];
  const idx = f < 60 ? 0 : f < 120 ? 1 : f < 180 ? 2 : 3;
  if (idx !== lastChapter && (!filmST || filmST.isActive || window.scrollY < 10)) {
    lastChapter = idx;
    window.dispatchEvent(new CustomEvent('axle:chapter', { detail: { num: idx + 1, name: names[idx] } }));
  }
}

// Leader-line callouts stay glued to the car part they describe (positions exported from Blender).
function placeCallouts(f) {
  if (!anchors) return;
  const i = Math.max(0, Math.min(FRAMES - 1, Math.round(f)));
  callouts.forEach((c) => {
    if (!c._on) return;
    const p = anchors[c.dataset.anchor][i];
    if (!p) return;
    const x = offX + p[0] * SRC_W * scale;
    const y = offY + p[1] * SRC_H * scale;
    c.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  });
}

export function playFilmIntro() {
  const tl = gsap.timeline();
  const hero = film.querySelector('.ch-hero');
  hero._on = true; hero._played = true;
  gsap.set(hero, { autoAlpha: 1 });
  headlineInners.forEach((el, i) => {
    tl.from(el.querySelectorAll('.ch'), { yPercent: 110, duration: 1.2, stagger: 0.035 }, i * 0.12);
  });
  tl.from('.film .eyebrow, .film-foot, .rig', { opacity: 0, y: 16, duration: 1, stagger: 0.1 }, 0.4);
  tl.from(canvas, { scale: 1.12, duration: 2.2 }, 0);
  return tl;
}
