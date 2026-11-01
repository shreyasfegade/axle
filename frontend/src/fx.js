// Page-wide finishing: chapter rail, scroll-velocity response, scrambled labels.
import { gsap, ScrollTrigger } from './motion.js';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

gsap.registerPlugin(ScrambleTextPlugin);

const rail = document.querySelector('.rail');
const railNum = rail.querySelector('.rail-num');
const railName = rail.querySelector('.rail-name');
const railBar = rail.querySelector('.rail-bar i');
let railKey = '';

export function initFX() {
  initRail();
  initScramble();
  initVelocity();
}

function setRail(num, name) {
  const key = num + name;
  if (key === railKey) return;
  railKey = key;
  railNum.textContent = String(num).padStart(2, '0');
  gsap.to(railName, { duration: 0.8, scrambleText: { text: name, chars: 'AXLE0123456789', speed: 0.6 } });
}

function initRail() {
  // Film chapters report themselves; other sections are numbered after the film's four.
  window.addEventListener('axle:chapter', (e) => setRail(e.detail.num, e.detail.name));
  [...document.querySelectorAll('.page > section:not(.film), .page > footer')].forEach((sec, i) => {
    ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 55%',
      onToggle: (self) => { if (self.isActive) setRail(5 + i, sec.dataset.chapter); },
    });
  });
  gsap.to(railBar, { scaleY: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });
}

function initScramble() {
  document.querySelectorAll('[data-scramble]').forEach((el) => {
    const text = el.textContent;
    el.addEventListener('pointerenter', () => {
      gsap.to(el, { duration: 0.7, scrambleText: { text, chars: 'AXLE0123456789/', speed: 0.8 }, overwrite: true });
    });
  });
  document.querySelectorAll('.sec-label').forEach((el) => {
    const text = el.textContent;
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => gsap.fromTo(el, { scrambleText: { text: ' ' } }, { duration: 1.2, scrambleText: { text, chars: 'AXLE0123456789()', speed: 0.5 } }),
    });
  });
}

// Fast scrolling leans the fleet photos and speeds the marquee up (and reverses it scrolling up).
function initVelocity() {
  let skew = 0;
  const setters = () => [...document.querySelectorAll('.card-media')].map((el) => gsap.quickSetter(el, 'skewY', 'deg'));
  let set = [];
  window.addEventListener('axle:fleet', () => { set = setters(); });

  let dir = 1;        // marquee direction follows the last scroll direction
  let boost = 0;      // extra marquee speed from scroll velocity, decays back to 0
  let speed = 1;

  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      const v = self.getVelocity();
      const s = gsap.utils.clamp(-4, 4, v / -320);
      if (Math.abs(s) > Math.abs(skew)) skew = s;
      if (Math.abs(v) > 20) dir = v < 0 ? -1 : 1;
      boost = Math.max(boost, gsap.utils.clamp(0, 6, Math.abs(v) / 250));
    },
  });
  gsap.ticker.add(() => {
    skew *= 0.88;
    if (Math.abs(skew) < 0.01) skew = 0;
    set.forEach((fn) => fn(skew));
    boost *= 0.94;
    speed += (dir * (1 + boost) - speed) * 0.12;
    if (window.__marquee) window.__marquee.timeScale(speed);
  });
}
