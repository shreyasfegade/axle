// Talks to the Java server. Every number on the site comes from here.
import { demoApi } from './demo.js';

async function call(path, method = 'GET') {
  const res = await fetch(path, { method });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

const enc = encodeURIComponent;

// The Vercel build (VITE_DEMO=1) has no Java server, so it uses demo.js, a mirror of the Java rules.
export const DEMO = import.meta.env.VITE_DEMO === '1';

const javaApi = {
  vehicles: (type = 'All') => call(`/api/vehicles?type=${enc(type)}`),
  quote: (id, days) => call(`/api/quote?id=${enc(id)}&days=${days}`),
  book: (id, name, phone, days) =>
    call(`/api/book?id=${enc(id)}&name=${enc(name)}&phone=${enc(phone)}&days=${days}`, 'POST'),
  returnVehicle: (bookingId, days) => call(`/api/return?booking=${enc(bookingId)}&days=${days}`, 'POST'),
  bookings: () => call('/api/bookings'),
};

export const api = DEMO ? demoApi : javaApi;

export const money = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

export const RULES = {
  Car: 'Standard rate',
  Bike: '−20% from 7 days',
  SUV: '+15% SUV premium',
};

// Tell every section that bookings or availability changed.
export const changed = () => window.dispatchEvent(new CustomEvent('axle:changed'));
