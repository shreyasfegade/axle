import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './style.css';

import { gsap, ScrollTrigger, lenis, reduced } from './motion.js';
import { initCursor, initMagnetic } from './cursor.js';
import { initFilm, playFilmIntro } from './film.js';
import { initRulebook } from './rulebook.js';
import { initFX } from './fx.js';
import { initFleet, getVehicle } from './fleet.js';
import { initDrawer, openDrawer } from './drawer.js';
import { initRentals } from './rentals.js';
import { DEMO } from './api.js';

document.body.classList.add('is-loading');
lenis.stop();
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

initCursor();
initFX();
const firstFrame = initFilm();
initRulebook();
initDrawer();
initAnchors();
initProgress();
initStatement();

const dataReady = Promise.all([initFleet(), initRentals()]).then(([vehicles]) => {
  initMarquee(vehicles);
  initMagnetic();
  ScrollTrigger.refresh();
});

document.getElementById('filmBook').addEventListener('click', () => openDrawer(getVehicle('C-01')));
if (DEMO) {
  document.querySelector('.demo-note').hidden = false;
  document.getElementById('demoReset').addEventListener('click', () => {
    try { localStorage.removeItem('axle-demo-v1'); } catch { /* nothing stored */ }
    location.reload();
  });
}

runLoader();

// ---------------------------------------------------------------------------

async function runLoader() {
  await document.fonts.ready;
  const text = document.querySelector('.loader-mark text');
  const counter = document.querySelector('.loader-count');
  const c = { v: 0 };

  const tl = gsap.timeline({
    onComplete: () => {
      document.querySelector('.loader').remove();
      document.body.classList.remove('is-loading');
      lenis.start();
    },
  });
  if (reduced) tl.timeScale(4);

  tl.to(text, { strokeDashoffset: 0, duration: 1.8 })
    .to(c, {
      v: 100, duration: 1.8,
      onUpdate: () => { counter.textContent = String(Math.round(c.v)).padStart(3, '0'); },
    }, 0)
    .to(text, { fillOpacity: 1, duration: 0.7 }, 1.0)
    // hold here until the first film frame and the data are ready
    .add(() => {
      tl.pause();
      Promise.all([firstFrame, dataReady.catch(() => {})]).then(() => tl.resume());
    }, 1.8)
    .to('.loader-inner', { yPercent: -40, opacity: 0, duration: 0.8 }, 1.9)
    .to('.loader-panel.top', { yPercent: -100, duration: 1.3 }, 2.0)
    .to('.loader-panel.bottom', { yPercent: 100, duration: 1.3 }, 2.0)
    .add(playFilmIntro(), 2.05);
}

function initAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = a.getAttribute('href');
      if (target.length < 2) return;
      e.preventDefault();
      lenis.scrollTo(target === '#top' ? 0 : target, { duration: 1.8, easing: (t) => 1 - Math.pow(2, -10 * t) });
    });
  });
}

function initProgress() {
  gsap.to('.progress span', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: true },
  });
}

// Statement words light up as you scroll past them.
function initStatement() {
  const p = document.querySelector('.statement-text');
  p.innerHTML = p.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
  gsap.to(p.querySelectorAll('.w'), {
    opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: p, start: 'top 80%', end: 'bottom 45%', scrub: true },
  });
  gsap.from('.fleet .sec-title', {
    yPercent: 40, opacity: 0, duration: 1.2,
    scrollTrigger: { trigger: '.fleet', start: 'top 80%', once: true },
  });
}

// Footer: marquee of vehicle names and the giant wordmark that rises as you arrive.
function initMarquee(vehicles) {
  const track = document.getElementById('marquee');
  const names = (vehicles.length ? vehicles.map((v) => v.name) : ['AXLE'])
    .map((n) => `<span>${n}</span>`).join('');
  track.innerHTML = names + names;
  // fx.js drives this timeline's speed and direction from scroll velocity
  window.__marquee = gsap.fromTo(track, { xPercent: 0 }, { xPercent: -50, duration: 60, ease: 'none', repeat: -1 });
  window.__marquee.totalTime(3600); // start deep into the loop so it can also run backwards

  gsap.fromTo('.wordmark span', { yPercent: 60 }, {
    yPercent: 0, ease: 'none',
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
  });
}
