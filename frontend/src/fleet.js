import { gsap, Flip, ScrollTrigger, shake } from './motion.js';
import { api, money } from './api.js';
import { openDrawer } from './drawer.js';

const grid = document.getElementById('fleetGrid');
let vehicles = [];

export async function initFleet() {
  try {
    vehicles = await api.vehicles();
  } catch {
    document.querySelector('.fleet-offline').hidden = false;
    return [];
  }
  render();
  updateCounts();
  initChips();

  window.addEventListener('axle:changed', refresh);
  window.dispatchEvent(new CustomEvent('axle:fleet'));
  setInterval(refresh, 6000); // keep the availability dots live
  return vehicles;
}

export function getVehicle(id) {
  return vehicles.find((v) => v.id === id);
}

function cardHTML(v) {
  return `
  <article class="card ${v.available ? '' : 'is-rented'}" data-id="${v.id}" data-type="${v.type}" data-cursor="View" tabindex="0" aria-label="${v.name}, ${v.type}">
    <div class="card-media">
      <img src="${v.image}" alt="${v.name}" loading="lazy">
      <div class="card-error"></div>
    </div>
    <div class="card-meta mono">
      <span>${v.id} · ${v.type}</span>
      <span class="status"><i class="dot"></i><b>${v.available ? 'Available' : 'Rented'}</b></span>
    </div>
    <h3 class="card-name">${v.name}</h3>
    <div class="card-row">
      <span class="card-type mono">${v.engine}</span>
      <span class="card-price"><span><span class="mono signal">${money(v.ratePerDay)}</span><small>/ day</small></span></span>
    </div>
  </article>`;
}

function render() {
  grid.innerHTML = vehicles.map(cardHTML).join('');

  grid.querySelectorAll('.card').forEach((card) => {
    const open = () => openDrawer(getVehicle(card.dataset.id), card.querySelector('.card-media img'));
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });

    // Image reveals with a bottom-to-top wipe as it scrolls in.
    const media = card.querySelector('.card-media');
    gsap.fromTo(media, { clipPath: 'inset(100% 0 0 0)' }, {
      clipPath: 'inset(0% 0 0 0)', duration: 1.3,
      scrollTrigger: { trigger: card, start: 'top 92%', once: true },
    });
    gsap.fromTo(media.querySelector('img'), { scale: 1.25 }, {
      scale: 1, duration: 1.6, clearProps: 'transform',
      scrollTrigger: { trigger: card, start: 'top 92%', once: true },
    });
  });
}

function initChips() {
  const chips = document.querySelectorAll('.chip');
  chips.forEach((chip) => chip.addEventListener('click', async () => {
    chips.forEach((c) => c.classList.toggle('is-active', c === chip));
    // The filtering itself is done by RentalService.filterByType() in Java.
    const list = await api.vehicles(chip.dataset.type);
    const ids = list.map((v) => v.id);

    const cards = [...grid.children];
    const state = Flip.getState(cards);
    const before = grid.offsetHeight;
    cards.forEach((c) => c.classList.toggle('is-hidden', !ids.includes(c.dataset.id)));
    const after = grid.offsetHeight;
    // Cards go absolute while they glide, so hold the grid's height and ease it instead.
    gsap.fromTo(grid, { height: before }, { height: after, duration: 1, clearProps: 'height' });
    Flip.from(state, {
      duration: 1, ease: 'expo.out', absolute: true, scale: false,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, duration: 0.5 }),
      onComplete: () => ScrollTrigger.refresh(),
    });
  }));
}

async function refresh() {
  try {
    vehicles = await api.vehicles();
  } catch {
    return;
  }
  vehicles.forEach((v) => {
    const card = grid.querySelector(`.card[data-id="${v.id}"]`);
    if (!card) return;
    card.classList.toggle('is-rented', !v.available);
    card.querySelector('.status b').textContent = v.available ? 'Available' : 'Rented';
  });
  updateCounts();
}

function updateCounts() {
  const free = vehicles.filter((v) => v.available).length;
  document.getElementById('liveCount').textContent = `${free}/${vehicles.length}`;
  document.querySelectorAll('[data-count]').forEach((el) => {
    const t = el.dataset.count;
    el.textContent = vehicles.filter((v) => t === 'All' || v.type === t).length;
  });
  // The film's closing card shows the AMG's live price and status.
  const amg = getVehicle('C-01');
  if (amg) {
    document.getElementById('filmPrice').textContent = money(amg.ratePerDay);
    document.getElementById('filmStatus').textContent = amg.available ? 'available now' : 'currently rented';
  }
}

// The custom exception's message, shown on the card itself.
export function cardError(id, message) {
  const card = grid.querySelector(`.card[data-id="${id}"]`);
  if (!card) return;
  const box = card.querySelector('.card-error');
  box.textContent = message;
  card.classList.add('is-rented');
  card.querySelector('.status b').textContent = 'Rented';
  shake(card);
  gsap.timeline()
    .fromTo(box, { yPercent: -101 }, { yPercent: 0, duration: 0.8 })
    .to(box, { yPercent: -101, duration: 0.8 }, '+=3.2');
}
