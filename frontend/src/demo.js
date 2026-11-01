// DEMO MODE (the Vercel build only). The real project runs these rules in Java on a local server.
// Online there is no Java, so this file mirrors the Java classes one for one, starting from a
// snapshot of the Java server's data. Bookings are kept in this browser only.
import fleetSnapshot from './demo-vehicles.json';
import bookingSnapshot from './demo-bookings.json';

const KEY = 'axle-demo-v1';
const LATE_MULTIPLIER = 1.5; // RentalService.LATE_MULTIPLIER

let state = load();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && saved.fleet && saved.bookings) return saved;
  } catch { /* storage blocked: start fresh */ }
  return { fleet: structuredClone(fleetSnapshot), bookings: structuredClone(bookingSnapshot), next: 1002 };
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* fine without it */ }
}

function fail(status, message) {
  const e = new Error(message);
  e.status = status;
  throw e;
}

const find = (id) => state.fleet.find((v) => v.id === id);

// Car.java / Bike.java / SUV.java -> calculateRent(days)
function calculateRent(v, days) {
  const base = v.ratePerDay * days;
  if (v.type === 'SUV') return Math.round(base * 1.15);
  if (v.type === 'Bike') return Math.round(days >= 7 ? base * 0.8 : base);
  return base;
}

function checkDays(days) {
  if (!Number.isInteger(days) || days < 1 || days > 30) fail(400, 'Days must be between 1 and 30.');
}

const delay = (value) => new Promise((r) => setTimeout(() => r(structuredClone(value)), 120));

export const demoApi = {
  vehicles: async (type = 'All') => delay(state.fleet.filter((v) => type === 'All' || v.type === type)),

  quote: async (id, days) => {
    const v = find(id);
    if (!v) fail(400, 'No vehicle with id ' + id);
    checkDays(days);
    return delay({ id, type: v.type, days, total: calculateRent(v, days) });
  },

  book: async (id, name, phone, days) => {
    const v = find(id);
    if (!v) fail(400, 'No vehicle with id ' + id);
    if (!name.trim() || !phone.trim()) fail(400, 'Name and phone are required.');
    checkDays(days);
    // Vehicle.rent() -> VehicleNotAvailableException
    if (!v.available) fail(409, `${v.name} is already rented. Pick another vehicle.`);
    v.available = false;
    const b = {
      id: 'AX-' + state.next++, vehicle: structuredClone(v), customer: { name: name.trim(), phone: phone.trim() },
      days, total: calculateRent(v, days), active: true, actualDays: 0, lateFee: 0,
    };
    state.bookings.push(b);
    save();
    return delay(b);
  },

  returnVehicle: async (bookingId, days) => {
    const b = state.bookings.find((x) => x.id === bookingId);
    if (!b) fail(400, 'No booking with id ' + bookingId);
    if (!b.active) fail(400, `Booking ${bookingId} was already returned.`);
    checkDays(days);
    const extra = days - b.days; // RentalService.calculateLateFee()
    b.lateFee = extra > 0 ? extra * b.vehicle.ratePerDay * LATE_MULTIPLIER : 0;
    b.actualDays = days;
    b.active = false;
    const v = find(b.vehicle.id);
    if (v) v.available = true;
    save();
    return delay(b);
  },

  bookings: async () => {
    // keep each booking's vehicle in sync with the fleet's availability
    state.bookings.forEach((b) => { const v = find(b.vehicle.id); if (v) b.vehicle.available = v.available; });
    return delay(state.bookings);
  },
};
