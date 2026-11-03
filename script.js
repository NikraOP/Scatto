(() => {
  /* ---------- F5: вернуть экран туда, где был, мгновенно, без проезда по странице ---------- */
  const KEY = 'scatto3-y:' + location.pathname;
  const saveY = () => { try { sessionStorage.setItem(KEY, String(Math.round(scrollY))); } catch (e) {} };
  let savedY = 0;
  try { savedY = +sessionStorage.getItem(KEY) || 0; } catch (e) {}
  if (savedY > 0) scrollTo({ top: savedY, behavior: 'instant' });
  addEventListener('pagehide', saveY);
  addEventListener('beforeunload', saveY);

  /* ---------- ссылки по странице: плавно, без якоря в адресе ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    const el = id && document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wide = matchMedia('(min-width: 1100px)');
  const mobile = matchMedia('(max-width: 767px)');

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
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') setMenu(false); });

  /* ---------- первый экран: слайдер в окне-букве ----------
     На странице только два <video>: новый ролик грузится во второй, плавно сменяет первый,
     старый выгружается (src убирается) — иначе каждый ролик держит свой аппаратный декодер,
     и на ноутбуках с двумя видеокартами Edge зависает целиком. */
  const hero = document.querySelector('.hero');
  const vids = [...hero.querySelectorAll('.hero__video')];
  const slides = [...hero.querySelectorAll('.slide')];
  const hole = hero.querySelector('.hero__win');
  const LEFT = [1, 3];                 // слайды 2 и 4: буква слева, текст справа
  const SHOW = 5.5;                    // секунд на слайд: короткие ролики слегка замедляются, без повторов
  const bar = hero.querySelector('.hero__progress i');
  const count = hero.querySelector('.hero__count b');
  let cur = 0, front = 0, visible = true, fallback = 0, token = 0;

  const srcOf = i => (mobile.matches ? slides[i].dataset.videoM : slides[i].dataset.video);
  const rate = v => (Number.isFinite(v.duration) && v.duration > 0 ? Math.max(.75, Math.min(1, v.duration / SHOW)) : 1);
  const unload = v => { v.pause(); v.removeAttribute('src'); v.load(); };

  // полоса прогресса = размерная линия чертежа под текстом; CSS-анимация на длину ролика, без JS на каждом кадре
  const runBar = v => {
    if (!bar) return;
    bar.classList.remove('is-run'); void bar.offsetWidth;
    bar.style.setProperty('--dur', ((v.duration - v.currentTime) / v.playbackRate || 6) + 's');
    bar.parentElement.classList.remove('is-paused');
    bar.classList.add('is-run');
  };
  const play = () => {
    const v = vids[front];
    if (!v.getAttribute('src')) { v.src = srcOf(cur); }
    const start = () => { v.playbackRate = rate(v); const p = v.play(); if (p) p.catch(() => {}); if (v.currentTime < .05) runBar(v); else bar?.parentElement.classList.remove('is-paused'); };
    if (v.readyState >= 1) start(); else v.addEventListener('loadedmetadata', start, { once: true });
    clearTimeout(fallback);
    fallback = setTimeout(() => go(cur + 1), reduce ? 8000 : 12000);   // страховка, если ролик не загрузился
  };
  const stop = () => { clearTimeout(fallback); vids[front].pause(); bar?.parentElement.classList.add('is-paused'); };

  const go = n => {
    const next = (n + slides.length) % slides.length;
    if (next === cur) return;
    const prev = cur, my = ++token;
    cur = next;
    clearTimeout(fallback);
    slides[prev].classList.remove('is-on');
    slides[prev].classList.add('is-out');
    slides[prev].setAttribute('aria-hidden', 'true');
    setTimeout(() => slides[prev].classList.remove('is-out'), 700);
    hero.classList.toggle('is-left', LEFT.includes(cur));
    if (bar) bar.classList.remove('is-run');
    if (count) count.textContent = String(cur + 1).padStart(2, '0');

    const oldV = vids[front], newV = vids[1 - front];
    let done = false;
    newV.dataset.s = cur + 1;
    newV.poster = slides[cur].dataset.poster;
    newV.preload = 'auto';
    newV.src = srcOf(cur);
    const swap = () => {
      if (my !== token || done) return;
      done = true;
      front = 1 - front;
      const oldS = oldV.dataset.s;
      newV.classList.add('is-on');
      oldV.classList.remove('is-on');
      if (visible) play();
      // выгрузить старый ролик, если его за это время не взяли под следующий слайд
      setTimeout(() => { if (oldV !== vids[front] && oldV.dataset.s === oldS) unload(oldV); }, 1150);
    };
    if (newV.readyState >= 2) swap();
    else {
      newV.addEventListener('canplay', swap, { once: true });
      setTimeout(swap, 900);           // не ждать дольше: постер уже показан
    }
    // текст нового слайда въезжает чуть позже, когда старый ушёл
    setTimeout(() => { if (my === token) { slides[cur].classList.add('is-on'); slides[cur].removeAttribute('aria-hidden'); } }, 350);
  };
  vids.forEach(v => v.addEventListener('ended', () => { if (v === vids[front] && visible) go(cur + 1); }));
  hero.querySelector('.hero__arr--prev').addEventListener('click', () => go(cur - 1));
  hero.querySelector('.hero__arr--next').addEventListener('click', () => go(cur + 1));

  let sx = 0, sy = 0;
  hero.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  hero.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });

  let started = false;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !started) { started = true; (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(start)); return; }
    if (!started) return;
    if (visible) play(); else stop();
  }, { threshold: .1 }).observe(hero);
  document.addEventListener('visibilitychange', () => {
    if (!started) return;
    if (document.hidden) stop(); else if (visible) play();
  });

  // появление при загрузке: окно-буква открывается, строки заголовка выезжают
  slides[0].classList.remove('is-on');
  const start = () => {
    document.body.classList.add('is-ready');
    hero.classList.add('is-ready');
    setTimeout(() => slides[0].classList.add('is-on'), 450);
    play();
  };

  /* ---------- буква-окно ездит за мышью (как у nikoland: окно ходит до ±100 px макета, видео стоит) ---------- */
  if (!reduce && hole) {
    hero.addEventListener('mousemove', e => {
      if (!wide.matches) return;
      const r = hero.getBoundingClientRect();
      hole.style.setProperty('--mx', (((e.clientX - r.left) / r.width - .5) * 2).toFixed(3));
    });
    hero.addEventListener('mouseleave', () => hole.style.setProperty('--mx', '0'));
  }

  /* ---------- глобус: маршруты прорисовываются один раз при появлении ---------- */
  const globe = document.querySelector('.logi__video');
  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting) return;
    obs.disconnect();
    globe.src = globe.dataset.src;
    if (reduce) { globe.addEventListener('loadedmetadata', () => { globe.currentTime = globe.duration - .05; }, { once: true }); return; }
    setTimeout(() => globe.play().catch(() => {}), 500);
  }, { threshold: .4 }).observe(globe);

  /* ---------- чертёж проявляется по блокам, фото едут при прокрутке ---------- */
  const bands = [...document.querySelectorAll('.decor'), ...document.querySelectorAll('.gauge')];
  const photos = [...document.querySelectorAll('.why__photo img')];
  const reveal = () => {
    if (!wide.matches || reduce) { bands.forEach(el => el.classList.add('is-drawn')); return; }
    const edge = innerHeight * .88;
    bands.forEach(el => { if (el.classList.contains('is-drawn')) return; const r = el.getBoundingClientRect(); if (r.top < edge && r.bottom > innerHeight * .12) el.classList.add('is-drawn'); });
  };
  const parallax = () => {
    if (!wide.matches || reduce) return;
    photos.forEach(img => {
      const r = img.parentElement.getBoundingClientRect();
      const t = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      img.style.transform = `translate3d(0, ${(t * -70).toFixed(1)}px, 0)`;
    });
  };
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; reveal(); parallax(); });
  }, { passive: true });
  addEventListener('resize', () => { reveal(); parallax(); });
  setTimeout(() => { reveal(); parallax(); }, 600);

  /* ---------- вопросы ---------- */
  document.querySelectorAll('.qa__q').forEach(btn => btn.addEventListener('click', () => {
    const item = btn.closest('.qa');
    const open = !item.classList.contains('is-open');
    item.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
  }));

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
  }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-anim]').forEach(el => io.observe(el));
})();

(() => {
  const hdr = document.querySelector('.hdr');
  if (!hdr) return;
  const upd = () => hdr.classList.toggle('is-stuck', scrollY > 80);
  addEventListener('scroll', upd, { passive: true });
  upd();
})();

/* страховка: если первый экран не успел запуститься (медленная сеть, старый браузер), всё равно показать шапку */
setTimeout(() => { document.body.classList.add('is-ready'); const h = document.querySelector('.hero'); if (h) h.classList.add('is-ready'); }, 4000);
