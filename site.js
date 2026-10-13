// Mind & Matter Gallery: menu button, click-to-enlarge photos, open-now line
(() => {
  // Menu button on phones and tablets
  const btn = document.querySelector('.menu-btn'), nav = document.getElementById('site-nav');
  if (btn && nav) {
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
      btn.querySelector('span').textContent = open ? 'Close' : 'Menu';
    });
  }

  // Click a photo to see it large, with previous / next
  const box = document.getElementById('lightbox');
  if (box) {
    const img = box.querySelector('img'), cap = box.querySelector('figcaption');
    let group = [], i = 0;
    const show = () => { const b = group[i]; img.src = b.dataset.full; img.alt = b.querySelector('img').alt; cap.textContent = b.dataset.caption || b.querySelector('img').alt; };
    document.querySelectorAll('.wall').forEach(wall => {
      const buttons = [...wall.querySelectorAll('button[data-full]')];
      buttons.forEach((b, n) => b.addEventListener('click', () => { group = buttons; i = n; show(); box.showModal(); }));
    });
    box.querySelector('[data-prev]').addEventListener('click', () => { i = (i - 1 + group.length) % group.length; show(); });
    box.querySelector('[data-next]').addEventListener('click', () => { i = (i + 1) % group.length; show(); });
    box.querySelector('[data-close]').addEventListener('click', () => box.close());
    box.addEventListener('click', e => { if (e.target === box) box.close(); });
    box.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') box.querySelector('[data-next]').click();
      if (e.key === 'ArrowLeft') box.querySelector('[data-prev]').click();
    });
  }

  // "Open now" wherever the hours are shown (every day, 12 to 6, Vancouver time)
  document.querySelectorAll('[data-open-now]').forEach(el => {
    try {
      const h = +new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Vancouver', hour: 'numeric', hourCycle: 'h23' }).format(new Date());
      el.textContent = h >= 12 && h < 18 ? 'Open now, until 6 pm' : (h < 12 ? 'Opens today at noon' : 'Closed now. Opens tomorrow at noon');
    } catch (e) {}
  });
})();
