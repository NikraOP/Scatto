/* Страницы статей: нарочно ES5 и проверки возможностей, чтобы работало и в старых браузерах */
(function () {
  var doc = document, root = doc.documentElement;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  var all = function (sel, el) { return (el || doc).querySelectorAll(sel); };
  var one = function (sel, el) { return (el || doc).querySelector(sel); };
  var mq = function (q) { return window.matchMedia ? window.matchMedia(q) : { matches: false }; };
  var reduce = mq('(prefers-reduced-motion: reduce)').matches;
  var wide = mq('(min-width: 1100px)');
  var scrollPos = function () { return window.pageYOffset || root.scrollTop || 0; };
  var raf = window.requestAnimationFrame || function (f) { return setTimeout(f, 16); };

  /* ---------- F5: вернуть экран туда, где был ---------- */
  var KEY = 'scatto3-y:' + location.pathname;
  var store = function (fn) { try { return fn(window.sessionStorage); } catch (e) { return null; } };
  var saveY = function () { store(function (s) { s.setItem(KEY, String(Math.round(scrollPos()))); }); };
  var savedY = +store(function (s) { return s.getItem(KEY); }) || 0;
  if (savedY > 0) window.scrollTo(0, savedY);
  window.addEventListener('pagehide', saveY);
  window.addEventListener('beforeunload', saveY);

  /* ---------- ссылки по странице: плавно, без якоря в адресе ---------- */
  var smooth = 'scrollBehavior' in root.style && !reduce;
  doc.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var el = id && doc.getElementById(id);
    e.preventDefault();
    if (!el) return;
    if (smooth) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); else el.scrollIntoView(true);
  });

  /* ---------- меню ---------- */
  var burger = one('.burger'), menu = doc.getElementById('menu');
  var setMenu = function (open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    if (open) menu.hidden = false;
    raf(function () { raf(function () {
      if (open) menu.classList.add('is-open'); else menu.classList.remove('is-open');
    }); });
    doc.body.style.overflow = open ? 'hidden' : '';
    if (!open) setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 800);
  };
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  menu.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) setMenu(false); });
  doc.addEventListener('keydown', function (e) {
    if ((e.key === 'Escape' || e.key === 'Esc') && burger.getAttribute('aria-expanded') === 'true') setMenu(false);
  });

  /* ---------- шапка при прокрутке ---------- */
  var hdr = one('.hdr');
  var stuck = function () { if (scrollPos() > 80) hdr.classList.add('is-stuck'); else hdr.classList.remove('is-stuck'); };

  /* ---------- переключатель вариантов: новый вариант открывается сверху ---------- */
  each(all('.vsw__a'), function (a) {
    a.addEventListener('click', function () {
      store(function (s) { s.removeItem('scatto3-y:' + a.pathname); });
    });
  });

  /* ---------- вариант 1: темы ---------- */
  var tabs = all('.tabs__b');
  if (tabs.length) {
    var items = all('#ag > li'), none = doc.getElementById('ag-none');
    each(tabs, function (b) {
      b.addEventListener('click', function () {
        var th = b.getAttribute('data-th'), shown = 0;
        each(tabs, function (x) {
          var on = x === b;
          if (on) x.classList.add('is-on'); else x.classList.remove('is-on');
          x.setAttribute('aria-pressed', String(on));
        });
        each(items, function (li) {
          var ok = !th || li.getAttribute('data-th') === th;
          li.hidden = !ok;
          if (ok) { shown++; li.classList.add('is-in'); }
        });
        none.hidden = shown > 0;
      });
    });
  }

  /* ---------- вариант 2: буква-окно показывает фото строки и ездит за мышью ---------- */
  var win = one('.awin'), media = doc.getElementById('awin-m');
  if (win && media) {
    var rows = all('.ar'), section = one('.ax'), pics = {}, active = null;
    each(all('img', media), function (im) { pics[im.getAttribute('src')] = im; });
    var show = function (li) {
      if (li === active) return;
      var src = li.getAttribute('data-pic');
      var im = pics[src];
      if (!im) {
        im = doc.createElement('img');
        im.className = 'awin__i' + (li.getAttribute('data-b') === '1' ? ' awin__i--b' : '');
        im.alt = '';
        im.src = src;
        media.appendChild(im);
        pics[src] = im;
      }
      each(rows, function (r) { r.classList.remove('is-act'); });
      li.classList.add('is-act');
      each(all('.awin__i', media), function (x) { x.classList.remove('is-on'); });
      setTimeout(function () { im.classList.add('is-on'); }, 20);
      active = li;
    };
    active = rows[0];
    each(rows, function (li) {
      li.addEventListener('mouseenter', function () { if (wide.matches) show(li); });
      li.addEventListener('focusin', function () { if (wide.matches) show(li); });
    });
    if (!reduce) {
      section.addEventListener('mousemove', function (e) {
        if (!wide.matches) return;
        var r = section.getBoundingClientRect();
        win.style.setProperty('--mx', (((e.clientX - r.left) / r.width - .5) * 2).toFixed(3));
      });
      section.addEventListener('mouseleave', function () { win.style.setProperty('--mx', '0'); });
    }
  }

  /* ---------- шаблон статьи: «Все статьи» ведёт на вариант, с которого пришли ---------- */
  var back = doc.getElementById('st-back');
  if (back) {
    var from = /[?&]v=([23])/.exec(location.search);
    if (from) {
      back.href = 'stati-' + from[1] + '.html';
      each(all('.ag--rel a'), function (a) { a.href = 'statya.html?v=' + from[1]; });
    }
  }

  /* ---------- чертёж проявляется по блокам, фото едут при прокрутке ---------- */
  var bands = all('.decor, .gauge'), photos = all('.pxl img');
  var reveal = function () {
    if (!wide.matches || reduce) { each(bands, function (el) { el.classList.add('is-drawn'); }); return; }
    var h = window.innerHeight;
    each(bands, function (el) {
      if (el.classList.contains('is-drawn')) return;
      var r = el.getBoundingClientRect();
      if (r.top < h * .88 && r.bottom > h * .12) el.classList.add('is-drawn');
    });
  };
  var parallax = function () {
    if (!wide.matches || reduce) return;
    var h = window.innerHeight;
    each(photos, function (im) {
      var r = im.parentNode.getBoundingClientRect();
      if (r.bottom < -100 || r.top > h + 100) return;
      var t = (r.top + r.height / 2 - h / 2) / h;
      var v = 'translate3d(0,' + (t * -50).toFixed(1) + 'px,0)';
      im.style.webkitTransform = v;
      im.style.transform = v;
    });
  };
  var ticking = false;
  var onScroll = function () {
    if (ticking) return;
    ticking = true;
    raf(function () { ticking = false; stuck(); reveal(); parallax(); });
  };
  window.addEventListener('scroll', onScroll, window.addEventListener && { passive: true });
  window.addEventListener('resize', onScroll);
  stuck();
  setTimeout(function () { reveal(); parallax(); }, 300);

  /* ---------- форма ---------- */
  var form = one('.form');
  if (form) {
    var msg = one('.form__msg', form);
    var box = function (el) { return el.closest('.fld') || el.closest('.agree'); };
    form.addEventListener('submit', function (e) {
      var ok = true;
      e.preventDefault();
      each(all('[required]', form), function (el) {
        var bad = el.type === 'checkbox' ? !el.checked : !el.value.replace(/\s/g, '');
        if (bad) { box(el).classList.add('is-bad'); ok = false; } else box(el).classList.remove('is-bad');
      });
      msg.textContent = ok
        ? 'Спасибо! Заявка принята, менеджер свяжется с вами в рабочее время.'
        : 'Заполните имя, телефон или e-mail и отметьте согласие.';
      // TODO: подключить отправку на сервер
    });
    form.addEventListener('input', function (e) { var b = box(e.target); if (b) b.classList.remove('is-bad'); });
  }

  /* ---------- въезд блоков при прокрутке ---------- */
  each(all('[data-d]'), function (el) { el.style.setProperty('--d', el.getAttribute('data-d') + 'ms'); });
  var targets = all('[data-anim], [data-lines]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting || e.intersectionRatio > 0) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: .08, rootMargin: '0px 0px -6% 0px' });
    each(targets, function (el) { io.observe(el); });
  } else {
    each(targets, function (el) { el.classList.add('is-in'); });
  }
  doc.body.classList.add('is-ready');
})();
