import { gsap, ScrollTrigger, shake } from './motion.js';
import { api, money, changed } from './api.js';

const activeList = document.getElementById('activeList');
const historyList = document.getElementById('historyList');
let animating = false;

export async function initRentals() {
  await load();
  window.addEventListener('axle:changed', () => { if (!animating) load(); });
}

async function load() {
  let list;
  try {
    list = await api.bookings();
  } catch {
    return;
  }
  const active = list.filter((b) => b.active);
  const done = list.filter((b) => !b.active).reverse();

  document.getElementById('rentSummary').textContent =
    `${active.length} active · ${done.length} returned`;

  activeList.innerHTML = active.length
    ? active.map(activeRow).join('')
    : '<p class="rent-empty mono">No active rentals. Book something from the fleet.</p>';

  historyList.innerHTML = done.length
    ? done.map(historyRow).join('')
    : '<p class="rent-empty mono">Nothing returned yet.</p>';

  activeList.querySelectorAll('.rent-row').forEach((row) => {
    row.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      returnRow(row);
    });
  });
  ScrollTrigger.refresh();
}

function activeRow(b) {
  return `
  <div class="rent-row" data-id="${b.id}">
    <span class="mono">${b.id}</span>
    <span class="r-vehicle"><img src="${b.vehicle.image}" alt="">${b.vehicle.name}</span>
    <span>${b.customer.name}</span>
    <span class="mono">${b.days}</span>
    <span class="mono r-total">${money(b.total)}</span>
    <form class="rent-return">
      <label class="mono">Days used <input type="number" min="1" max="30" value="${b.days}" aria-label="Days actually used"></label>
      <button class="btn btn-ghost magnetic" type="submit"><span>Return</span></button>
    </form>
    <div class="rent-result"></div>
  </div>`;
}

function historyRow(b) {
  const late = b.lateFee > 0;
  return `
  <div class="rent-row">
    <span class="mono">${b.id}</span>
    <span class="r-vehicle"><img src="${b.vehicle.image}" alt="">${b.vehicle.name}</span>
    <span>${b.customer.name}</span>
    <span class="mono">${b.actualDays} of ${b.days} days</span>
    <span class="mono ${late ? 'r-late' : ''}">${late ? 'Late ' + money(b.lateFee) : 'On time'}</span>
    <span class="mono">${money(b.total + b.lateFee)}</span>
  </div>`;
}

async function returnRow(row) {
  const input = row.querySelector('input');
  const result = row.querySelector('.rent-result');
  animating = true;
  try {
    const b = await api.returnVehicle(row.dataset.id, Number(input.value));
    const late = b.lateFee > 0;
    result.classList.toggle('is-late', late);
    result.textContent = late
      ? `Late by ${b.actualDays - b.days} day${b.actualDays - b.days > 1 ? 's' : ''} · late fee ${money(b.lateFee)} · total ${money(b.total + b.lateFee)}`
      : `Returned on time · total ${money(b.total)}`;

    const tl = gsap.timeline({
      onComplete: () => { animating = false; changed(); },
    });
    tl.fromTo(result, { opacity: 0, xPercent: -4 }, { opacity: 1, xPercent: 0, duration: 0.6 });
    if (late) {
      tl.to(result, {
        keyframes: { backgroundColor: ['#ff5b1f', '#eeeae3', '#ff5b1f', '#eeeae3', '#ff5b1f'] },
        duration: 0.9, ease: 'none',
      });
    }
    tl.to(row, { height: 0, paddingTop: 0, paddingBottom: 0, borderBottomWidth: 0, opacity: 0, duration: 0.9 }, late ? '+=0.9' : '+=1.1');
  } catch (e) {
    animating = false;
    input.setCustomValidity(e.message);
    input.reportValidity();
    setTimeout(() => input.setCustomValidity(''), 2500);
    shake(row);
  }
}
