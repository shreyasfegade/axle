import { gsap, lenis, shake } from './motion.js';
import { api, money, RULES, changed } from './api.js';
import { cardError } from './fleet.js';
import { odometer } from './odometer.js';

// Vehicles that have a live 3D model. three.js is only downloaded the first time one is opened.
const HAS_3D = ['C-01', 'S-04'];
let viewerMod = null;
const media = document.querySelector('.drawer-media');

const $ = (id) => document.getElementById(id);
const drawer = document.querySelector('.drawer');
const scrim = document.querySelector('.scrim');
const page = document.querySelector('.page');
const track = drawer.querySelector('.track');
const bar = drawer.querySelector('.book-progress span');
const labels = drawer.querySelectorAll('.book-labels li');
const book = drawer.querySelector('.book');
const receipt = drawer.querySelector('.receipt');
const errorBox = drawer.querySelector('.book-error');
const slider = $('days');
const confirmBtn = $('confirmBtn');

let vehicle = null;
let step = 0;
let total = 0;
let isOpen = false;
let quoteSeq = 0;

export function initDrawer() {
  drawer.querySelector('.drawer-close').addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) closeDrawer(); });

  slider.dataset.cursor = 'Drag';
  slider.addEventListener('input', () => {
    $('daysValue').textContent = slider.value;
    updateQuote();
  });

  drawer.querySelectorAll('[data-next]').forEach((b) => b.addEventListener('click', next));
  drawer.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => goTo(step - 1)));
  confirmBtn.addEventListener('click', confirm);

  $('toRentals').addEventListener('click', () => {
    closeDrawer();
    setTimeout(() => lenis.scrollTo('#rentals', { duration: 1.6 }), 450);
  });
  $('bookAnother').addEventListener('click', closeDrawer);

  ['cName', 'cPhone'].forEach((id) => $(id).addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); next(); }
  }));

  // One click fills a believable customer, so a live demo doesn't stall on typing.
  $('demoFill').addEventListener('click', () => {
    $('cName').value = 'Aarav Mehta';
    $('cPhone').value = '9876543210';
    ['cName', 'cPhone'].forEach((id) => $(id).classList.remove('is-invalid'));
    errorBox.textContent = '';
    gsap.fromTo(['#cName', '#cPhone'], { backgroundColor: 'rgba(255,91,31,0.18)' }, { backgroundColor: 'rgba(255,91,31,0)', duration: 1 });
  });
}

export function openDrawer(v, fromImg = null) {
  if (!v || isOpen) return;
  vehicle = v;
  isOpen = true;
  const live = HAS_3D.includes(v.id);
  media.classList.toggle('is-live', live);

  $('dId').textContent = `${v.id} / ${v.type}`;
  $('dImg').src = v.image;
  $('dImg').alt = v.name;
  $('dType').textContent = `${v.type} · ${v.engine}`;
  $('dName').textContent = v.name;
  const status = $('dStatus');
  status.classList.toggle('is-rented', !v.available);
  status.querySelector('b').textContent = v.available ? 'Available now' : 'Currently rented';
  $('rentedHint').hidden = v.available;
  $('sEngine').textContent = v.engine;
  $('sSeats').textContent = v.seats;
  $('sFuel').textContent = v.fuel;
  $('sRate').textContent = money(v.ratePerDay);
  $('sRule').textContent = `${v.type}: ${RULES[v.type]}`;

  // Reset the flow
  book.hidden = false;
  receipt.hidden = true;
  errorBox.textContent = '';
  slider.value = 3;
  $('daysValue').textContent = '3';
  resetConfirm();
  goTo(0, true);
  updateQuote();

  lenis.stop();
  drawer.scrollTop = 0;
  page.style.transformOrigin = `50% ${window.scrollY + window.innerHeight / 2}px`;
  drawer.setAttribute('aria-hidden', 'false');

  const tl = gsap.timeline()
    .set(drawer, { visibility: 'visible' })
    .to(scrim, { autoAlpha: 1, duration: 0.8 }, 0)
    .to(page, { scale: 0.94, duration: 1.1 }, 0)
    .fromTo(drawer, { xPercent: 101 }, { xPercent: 0, x: 0, duration: 1.1 }, 0)
    .fromTo(drawer.querySelectorAll('.drawer-title > *, .spec'), { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.9, stagger: 0.05 }, 0.3)
    .fromTo(book, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.9 }, 0.6);

  if (fromImg) flyImage(fromImg, tl);
  else tl.fromTo($('dImg'), { scale: 1.2, opacity: 1 }, { scale: 1, duration: 1.4 }, 0.1);

  if (live) {
    const go = (m) => { viewerMod = m; return m.showModel($('viewer'), v.id); };
    (viewerMod ? go(viewerMod) : import('./viewer.js').then(go))
      .then(() => gsap.fromTo($('viewer'), { opacity: 0 }, { opacity: 1, duration: 1.2, delay: 0.4 }))
      .catch(() => media.classList.remove('is-live')); // no WebGL: the photo stays
  }
}

// The card's photo flies from the grid into the drawer (shared-element transition).
function flyImage(fromImg, tl) {
  const from = fromImg.getBoundingClientRect();
  const target = $('dImg');
  gsap.set(drawer, { xPercent: 0 });
  const to = target.getBoundingClientRect();
  gsap.set(drawer, { xPercent: 101 });

  const ghost = fromImg.cloneNode();
  ghost.className = 'fly-ghost';
  Object.assign(ghost.style, { left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px' });
  document.body.appendChild(ghost);
  gsap.set(target, { opacity: 0 });
  tl.to(ghost, {
    left: to.left, top: to.top, width: to.width, height: to.height, duration: 1.1,
    onComplete: () => { gsap.set(target, { opacity: 1, scale: 1 }); ghost.remove(); },
  }, 0);
}

export function closeDrawer() {
  if (!isOpen) return;
  isOpen = false;
  drawer.setAttribute('aria-hidden', 'true');
  gsap.timeline({
    onComplete: () => {
      lenis.start(); gsap.set(page, { clearProps: 'transform' });
      if (viewerMod) viewerMod.stop(); // stop rendering 3D while hidden
      gsap.set($('viewer'), { opacity: 0 });
    },
  })
    .to(drawer, { xPercent: 101, duration: 0.9 }, 0)
    .to(scrim, { autoAlpha: 0, duration: 0.7 }, 0)
    .to(page, { scale: 1, duration: 0.9 }, 0)
    .set(drawer, { visibility: 'hidden' });
}

function goTo(i, instant = false) {
  step = Math.max(0, Math.min(2, i));
  const d = instant ? 0 : 1;
  gsap.to(track, { xPercent: (-100 / 3) * step, duration: d });
  gsap.to(bar, { scaleX: (step + 1) / 3, duration: d });
  labels.forEach((l, k) => l.classList.toggle('is-active', k <= step));
  errorBox.textContent = '';
}

async function next() {
  if (step === 0) await updateQuote(); // make sure the total matches the slider before moving on
  if (step === 1) {
    const name = $('cName');
    const phone = $('cPhone');
    const nameOk = name.value.trim().length >= 2;
    const phoneOk = /^\d{10}$/.test(phone.value.replace(/\D/g, ''));
    name.classList.toggle('is-invalid', !nameOk);
    phone.classList.toggle('is-invalid', !phoneOk);
    if (!nameOk || !phoneOk) {
      errorBox.textContent = !nameOk ? 'Please enter your name.' : 'Phone needs 10 digits.';
      shake(drawer.querySelectorAll('.step')[1]);
      return;
    }
    $('sumVehicle').textContent = vehicle.name;
    $('sumCustomer').textContent = `${name.value.trim()} · ${phone.value.trim()}`;
    $('sumDays').textContent = slider.value;
    $('sumTotal').textContent = money(total);
  }
  goTo(step + 1);
}

// The total is calculated by Java (/api/quote). This is where polymorphism shows:
// the same days give a different price for a Car, a Bike and an SUV.
async function updateQuote() {
  const days = Number(slider.value);
  const seq = ++quoteSeq;
  try {
    const q = await api.quote(vehicle.id, days);
    if (seq !== quoteSeq) return; // an older answer arrived late
    total = q.total;
    odometer($('quoteTotal'), money(total));
    let line = `${money(vehicle.ratePerDay)} × ${days} day${days > 1 ? 's' : ''}`;
    if (vehicle.type === 'SUV') line += ' × 1.15 SUV premium';
    if (vehicle.type === 'Bike') line += days >= 7 ? ' − 20% long ride discount' : ' · 7+ days gets −20%';
    $('quoteLine').textContent = line;
  } catch (e) {
    $('quoteLine').textContent = e.message;
  }
}

function resetConfirm() {
  confirmBtn.disabled = false;
  confirmBtn.classList.remove('is-loading', 'is-done');
  gsap.set(confirmBtn, { clearProps: 'width,flex' });
  gsap.set(confirmBtn.querySelector('.confirm-label'), { opacity: 1 });
  gsap.set(confirmBtn.querySelector('.confirm-check'), { opacity: 0 });
  gsap.set(confirmBtn.querySelector('.confirm-check path'), { strokeDashoffset: 24 });
}

async function confirm() {
  const label = confirmBtn.querySelector('.confirm-label');
  const check = confirmBtn.querySelector('.confirm-check');
  confirmBtn.disabled = true;

  // Button morphs into a square spinner...
  const w = confirmBtn.offsetWidth;
  gsap.set(confirmBtn, { width: w, flex: 'none' });
  gsap.to(label, { opacity: 0, duration: 0.3 });
  gsap.to(confirmBtn, { width: 46, duration: 0.7 });
  confirmBtn.classList.add('is-loading');

  const wait = new Promise((r) => setTimeout(r, 900));
  try {
    const [booking] = await Promise.all([
      api.book(vehicle.id, $('cName').value.trim(), $('cPhone').value.trim(), Number(slider.value)),
      wait,
    ]);
    // ...then into a checkmark...
    confirmBtn.classList.remove('is-loading');
    confirmBtn.classList.add('is-done');
    gsap.set(check, { opacity: 1 });
    await gsap.to(check.querySelector('path'), { strokeDashoffset: 0, duration: 0.6 });
    await new Promise((r) => setTimeout(r, 350));
    showReceipt(booking);
    changed();
  } catch (e) {
    await wait;
    confirmBtn.classList.remove('is-loading');
    gsap.to(confirmBtn, { width: w, duration: 0.7, onComplete: () => gsap.set(confirmBtn, { clearProps: 'width,flex' }) });
    gsap.to(label, { opacity: 1, duration: 0.4, delay: 0.3 });
    confirmBtn.disabled = false;
    errorBox.textContent = (e.status === 409 ? 'VehicleNotAvailableException: ' : '') + e.message;
    errorBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    shake(book);
    if (e.status === 409) {
      // VehicleNotAvailableException from Java
      $('dStatus').classList.add('is-rented');
      $('dStatus').querySelector('b').textContent = 'Currently rented';
      $('rentedHint').hidden = false;
      cardError(vehicle.id, e.message);
    }
  }
}

function showReceipt(b) {
  $('tId').textContent = b.id;
  $('tVehicle').textContent = b.vehicle.name;
  $('tCustomer').textContent = b.customer.name;
  $('tDays').textContent = b.days;
  $('tTotal').textContent = money(b.total);

  gsap.to(book, {
    opacity: 0, y: -10, duration: 0.5,
    onComplete: () => {
      book.hidden = true;
      receipt.hidden = false;
      gsap.fromTo(receipt.querySelector('.ticket'),
        { y: -120, rotate: -4, opacity: 0 },
        { y: 0, rotate: 0, opacity: 1, duration: 1.3 });
      gsap.fromTo(receipt.querySelector('.step-actions'), { opacity: 0 }, { opacity: 1, duration: 1, delay: 0.5 });
      receipt.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },
  });
}
