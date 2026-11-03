(() => {
  /* ---------- F5: вернуть экран туда, где был ---------- */
  const KEY = 'scatto3-y:' + location.pathname;
  const saveY = () => { try { sessionStorage.setItem(KEY, String(Math.round(scrollY))); } catch (e) {} };
  let savedY = 0;
  try { savedY = +sessionStorage.getItem(KEY) || 0; } catch (e) {}
  if (savedY > 0) scrollTo({ top: savedY, behavior: 'instant' });
  addEventListener('pagehide', saveY);
  addEventListener('beforeunload', saveY);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wide = matchMedia('(min-width: 1100px)');

  /* ---------- ссылки на этой странице: плавно, без якоря в адресе ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    const el = id && document.getElementById(id);
    if (!el) return;
    if (mdl && !mdl.hidden) closeModal(false);
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });

  /* ---------- меню ---------- */
  const burger = document.querySelector('.burger');
  const menu = document.getElementById('menu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    if (open) menu.hidden = false;
    requestAnimationFrame(() => menu.classList.toggle('is-open', open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (!open) setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 800);
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });

  /* ---------- фильтры ---------- */
  const cards = [...document.querySelectorAll('.cg .card')];
  const none = document.getElementById('cg-none');
  const sels = [...document.querySelectorAll('.sel')];
  const state = { seg: '', neck: '', vol: '' };
  const attr = { seg: 'seg', neck: 'neck', vol: 'vol' };
  const closeSels = except => sels.forEach(s => {
    if (s === except) return;
    s.classList.remove('is-open');
    s.querySelector('.sel__b').setAttribute('aria-expanded', 'false');
    s.querySelector('.sel__l').hidden = true;
  });
  const apply = () => {
    let shown = 0;
    cards.forEach(c => {
      const ok = Object.keys(state).every(k => !state[k] || c.dataset[attr[k]] === state[k]);
      c.hidden = !ok;
      if (ok) { shown++; c.classList.add('is-in'); }
    });
    none.hidden = shown > 0;
  };
  sels.forEach(s => {
    const b = s.querySelector('.sel__b');
    const list = s.querySelector('.sel__l');
    const key = s.dataset.f;
    const toggle = open => {
      if (open) closeSels(s);
      s.classList.toggle('is-open', open);
      b.setAttribute('aria-expanded', String(open));
      list.hidden = !open;
      list.querySelectorAll('li').forEach(li => { li.tabIndex = open ? 0 : -1; });
    };
    b.addEventListener('click', () => toggle(list.hidden));
    const pick = li => {
      state[key] = li.dataset.v;
      list.querySelectorAll('li').forEach(x => x.setAttribute('aria-selected', String(x === li)));
      b.firstElementChild.textContent = li.dataset.v ? li.textContent : b.dataset.label;
      s.classList.toggle('is-set', !!li.dataset.v);
      toggle(false);
      b.focus();
      apply();
    };
    list.addEventListener('click', e => { const li = e.target.closest('li'); if (li) pick(li); });
    list.addEventListener('keydown', e => {
      const li = e.target.closest('li');
      if (!li) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(li); }
      if (e.key === 'ArrowDown') { e.preventDefault(); (li.nextElementSibling || li).focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); (li.previousElementSibling || li).focus(); }
    });
  });
  document.addEventListener('click', e => { if (!e.target.closest('.sel')) closeSels(); });

  /* ---------- окно «Подробнее» ---------- */
  const mdl = document.getElementById('mdl');
  const box = mdl.querySelector('.mdl__box');
  const xBtn = mdl.querySelector('.mdl__x');
  const set = (id, v) => { document.getElementById(id).textContent = v; };
  let opener = null;
  const openModal = card => {
    const d = card.dataset;
    const img = document.getElementById('mdl-img');
    img.src = d.img;
    img.alt = card.querySelector('.card__img').alt;
    set('mdl-title', d.name);
    set('m-vol', d.volT); set('m-h', d.h); set('m-d', d.dT); set('m-neck', d.neckT); set('m-m', d.m); set('m-color', d.color); set('m-desc', d.desc);
    opener = document.activeElement;
    mdl.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => { mdl.classList.add('is-open'); xBtn.focus(); });
  };
  function closeModal(restore = true) {
    mdl.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { if (!mdl.classList.contains('is-open')) mdl.hidden = true; }, 360);
    if (restore && opener) opener.focus();
  }
  document.querySelector('.cg').addEventListener('click', e => {
    const b = e.target.closest('.card__more');
    if (b) openModal(b.closest('.card'));
  });
  xBtn.addEventListener('click', () => closeModal());
  mdl.addEventListener('click', e => { if (!box.contains(e.target)) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!mdl.hidden) closeModal();
    else if (burger.getAttribute('aria-expanded') === 'true') setMenu(false);
    else closeSels();
  });
  // фокус не уходит из окна
  mdl.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const f = [...mdl.querySelectorAll('button, a[href]')];
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- чертёж проявляется по блокам ---------- */
  const bands = [...document.querySelectorAll('.decor'), ...document.querySelectorAll('.gauge')];
  const reveal = () => {
    if (!wide.matches || reduce) { bands.forEach(el => el.classList.add('is-drawn')); return; }
    const edge = innerHeight * .88;
    bands.forEach(el => { if (el.classList.contains('is-drawn')) return; const r = el.getBoundingClientRect(); if (r.top < edge && r.bottom > innerHeight * .12) el.classList.add('is-drawn'); });
  };
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; reveal(); });
  }, { passive: true });
  addEventListener('resize', reveal);
  setTimeout(reveal, 300);

  /* ---------- форма ---------- */
  const form = document.querySelector('.form');
  const msg = form.querySelector('.form__msg');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('[required]').forEach(el => {
      const bad = el.type === 'checkbox' ? !el.checked : !el.value.trim();
      el.closest('.fld, .agree').classList.toggle('is-bad', bad);
      if (bad) ok = false;
    });
    msg.textContent = ok
      ? 'Спасибо! Заявка принята, менеджер свяжется с вами в рабочее время.'
      : 'Заполните имя, телефон или e-mail и отметьте согласие.';
    // TODO: подключить отправку на сервер
  });
  form.addEventListener('input', e => e.target.closest('.fld, .agree')?.classList.remove('is-bad'));

  /* ---------- въезд блоков при прокрутке ---------- */
  document.querySelectorAll('[data-d]').forEach(el => el.style.setProperty('--d', el.dataset.d + 'ms'));
  const io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { threshold: .08, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('[data-anim]').forEach(el => io.observe(el));
  document.body.classList.add('is-ready');
})();

(() => {
  const hdr = document.querySelector('.hdr');
  if (!hdr) return;
  const upd = () => hdr.classList.toggle('is-stuck', scrollY > 80);
  addEventListener('scroll', upd, { passive: true });
  upd();
})();
