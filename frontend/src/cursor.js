import { gsap } from './motion.js';

const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// A dot that tracks the mouse tightly, plus a ring that trails it and grows into a label
// ("View", "Drag") over [data-cursor] elements. The native cursor is only hidden once this works,
// and text fields keep their normal I-beam.
export function initCursor() {
  if (!fine) return;
  const cursor = document.querySelector('.cursor');
  const ring = document.querySelector('.cursor-ring');
  const label = ring.querySelector('.cursor-label');
  document.documentElement.classList.add('has-cursor', 'cursor-off'); // hidden until the first move

  const dx = gsap.quickTo(cursor, 'x', { duration: 0.08, ease: 'power3.out' });
  const dy = gsap.quickTo(cursor, 'y', { duration: 0.08, ease: 'power3.out' });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.35 });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.35 });

  let shown = false;
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!shown) { // first move: jump there instead of flying in from the corner
      gsap.set([cursor, ring], { x: e.clientX, y: e.clientY });
      shown = true;
      document.documentElement.classList.remove('cursor-off');
    }
    dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', () => document.documentElement.classList.add('cursor-off'));
  document.documentElement.addEventListener('pointerenter', () => document.documentElement.classList.remove('cursor-off'));
  window.addEventListener('blur', () => document.documentElement.classList.add('cursor-off'));
  window.addEventListener('pointerdown', () => ring.classList.add('is-down'));
  window.addEventListener('pointerup', () => ring.classList.remove('is-down'));

  document.addEventListener('pointerover', (e) => {
    const t = e.target;
    const labelled = t.closest('[data-cursor]');
    const text = t.closest('input[type=text], input[type=tel], input[type=number], textarea');
    const hot = t.closest('a, button, input[type=range], .chip, .card');
    ring.classList.toggle('is-label', !!labelled && !text);
    cursor.classList.toggle('is-hidden', !!labelled && !text); // the label replaces the dot
    ring.classList.toggle('is-hot', !labelled && !!hot);
    document.documentElement.classList.toggle('cursor-text', !!text);
    if (labelled) label.textContent = labelled.dataset.cursor;
  });
}

// Buttons drift slightly toward the cursor.
export function initMagnetic(root = document) {
  if (!fine) return;
  root.querySelectorAll('.magnetic:not([data-mag])').forEach((el) => {
    el.dataset.mag = '1';
    const x = gsap.quickTo(el, 'x', { duration: 0.8 });
    const y = gsap.quickTo(el, 'y', { duration: 0.8 });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - (r.left + r.width / 2)) * 0.28);
      y((e.clientY - (r.top + r.height / 2)) * 0.38);
    });
    el.addEventListener('pointerleave', () => { x(0); y(0); });
  });
}
