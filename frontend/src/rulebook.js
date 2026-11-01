// The rule book: polymorphism as a scene. Same number of days, three classes, three answers from Java.
import { gsap, ScrollTrigger } from './motion.js';
import { api, money } from './api.js';
import { odometer } from './odometer.js';

const section = document.querySelector('.rulebook');
const track = section.querySelector('.rb-track');
const panels = [...section.querySelectorAll('.rb-panel')];
const daysEl = document.getElementById('rbDays');
let days = 5;

export function initRulebook() {
  panels.forEach(prepareCode);

  // Horizontal travel while the stage is pinned (CSS sticky).
  const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 40);
  gsap.to(track, {
    x: () => -distance(), ease: 'none',
    scrollTrigger: {
      trigger: section, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true,
      onUpdate: (self) => {
        const active = Math.min(panels.length - 1, Math.floor(self.progress * panels.length + 0.35));
        panels.forEach((p, i) => {
          p.classList.toggle('is-active', i === active);
          if (i <= active) typeCode(p);
        });
      },
    },
  });

  // Images inside panels drift against the travel (parallax).
  panels.forEach((p) => {
    const img = p.querySelector('.rb-media img');
    if (!img) return;
    gsap.fromTo(img, { xPercent: -8 }, {
      xPercent: 8, ease: 'none',
      scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: true },
    });
  });

  section.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
    days = Math.max(1, Math.min(30, days + Number(b.dataset.step)));
    daysEl.textContent = days;
    gsap.fromTo(daysEl, { yPercent: Number(b.dataset.step) * -60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6 });
    quoteAll();
  }));

  ScrollTrigger.create({ trigger: section, start: 'top 80%', once: true, onEnter: quoteAll });
}

// Each panel asks Java for its own price: Car, Bike and SUV each run their own calculateRent().
let quoteSeq = 0;
async function quoteAll() {
  const seq = ++quoteSeq;
  await Promise.all(panels.filter((p) => p.dataset.id).map(async (p) => {
    try {
      const q = await api.quote(p.dataset.id, days);
      if (seq !== quoteSeq) return; // a newer click already asked again
      odometer(p.querySelector('[data-quote]'), money(q.total));
    } catch { /* server offline: leave blank */ }
  }));
}

function prepareCode(panel) {
  const code = panel.querySelector('code');
  const lines = code.dataset.code.split('\n');
  const hl = (code.dataset.hl || '').split(',').map(Number);
  code.innerHTML = lines.map((_, i) => `<span class="ln${hl.includes(i) ? ' hl' : ''}"></span>`).join('\n');
  code._lines = lines;
}

function typeCode(panel) {
  const code = panel.querySelector('code');
  if (code._typed) return;
  code._typed = true;
  const spans = [...code.querySelectorAll('.ln')];
  const lines = code._lines;
  const total = lines.reduce((n, l) => n + l.length, 0);
  const state = { n: 0 };
  gsap.to(state, {
    n: total, duration: Math.min(2.2, total / 70), ease: 'none',
    onUpdate: () => {
      let left = Math.round(state.n);
      lines.forEach((l, i) => {
        const take = Math.max(0, Math.min(l.length, left));
        spans[i].textContent = l.slice(0, take);
        left -= l.length;
      });
    },
    onComplete: () => code.classList.add('is-done'),
  });
}
