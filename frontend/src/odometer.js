// Rolling digit counter: each digit is a 0–9 column that slides to its value.
export function odometer(el, text) {
  const chars = [...text];
  if (el._len !== chars.length || el._shape !== shape(chars)) build(el, chars);
  el.setAttribute('aria-label', text);
  [...el.children].forEach((col, i) => {
    const c = chars[i];
    if (col.classList.contains('odo-col')) {
      col.firstChild.style.transform = `translateY(${-Number(c) * 10}%)`;
    }
  });
}

const shape = (chars) => chars.map((c) => (/\d/.test(c) ? 'd' : c)).join('');

function build(el, chars) {
  el._len = chars.length;
  el._shape = shape(chars);
  el.innerHTML = chars.map((c, i) => (/\d/.test(c)
    ? `<span class="odo-col" aria-hidden="true"><span class="odo-strip" style="transition-delay:${i * 28}ms">${'0123456789'.split('').map((d) => `<span>${d}</span>`).join('')}</span></span>`
    : `<span class="odo-sym" aria-hidden="true">${c}</span>`)).join('');
  // start from zero so the first value rolls in
  el.querySelectorAll('.odo-strip').forEach((s) => { s.style.transform = 'translateY(0)'; });
  void el.offsetWidth;
}
