// Shared motion setup: one easing curve (expo.out) everywhere, Lenis driven by GSAP's ticker.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, Flip);
gsap.defaults({ ease: 'expo.out', duration: 1 });

export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const lenis = new Lenis({ lerp: reduced ? 1 : 0.09 });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

// Wraps every character of an element in <span class="ch"> so it can be staggered.
export function splitChars(el, text = el.textContent) {
  el.textContent = '';
  el.setAttribute('aria-label', text);
  for (const c of text) {
    const s = document.createElement('span');
    s.className = 'ch';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = c === ' ' ? ' ' : c;
    el.appendChild(s);
  }
  return [...el.querySelectorAll('.ch')];
}

// Gentle horizontal shake, used when Java says "no".
export function shake(el) {
  return gsap.fromTo(el, { x: 0 }, { keyframes: { x: [0, -10, 9, -6, 4, -2, 0] }, duration: 0.6, ease: 'none' });
}

export { gsap, ScrollTrigger, Flip };
