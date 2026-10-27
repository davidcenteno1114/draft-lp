(function () {
  var root = document.querySelector('.ism');

  // Hero: rotate the "not to ..." phrases; hover (or tap on touch) pauses.
  var h1 = document.querySelector('.hero .h1');
  var phrases = h1 ? h1.querySelectorAll('.rot .ph') : [];
  var i = 0, timer = null, paused = false, reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function show(n) {
    phrases[i].classList.remove('on');
    i = n;
    phrases[i].classList.add('on');
  }
  function queue() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      show((i + 1) % phrases.length);
      queue();
    }, 1500);
  }
  function pause() { clearTimeout(timer); paused = true; }
  function resume() { if (reduced) return; paused = false; queue(); }

  if (phrases.length) {
    if (reduced) {
      show(phrases.length - 1);
    } else {
      queue();
      h1.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') pause(); });
      h1.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') resume(); });
      h1.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'touch') return;
        if (paused) resume(); else pause();
      });
    }
  }

  // Header menu: burger toggles it; a link, Escape or a click outside closes it.
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('site-menu');
  function setMenu(open) {
    menu.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(menu.hidden); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('click', function (e) {
      if (!menu.hidden && !menu.contains(e.target) && !burger.contains(e.target)) setMenu(false);
    });
    [burger, menu].forEach(function (el) {
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); }
      });
    });
  }

  // Doors: remember which one was picked so the booking form can pass it on.
  var form = document.getElementById('book-form');
  document.querySelectorAll('[data-door]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (form) form.elements.door.value = a.getAttribute('data-door');
    });
  });

  // Booking links: land on "Let's Build Together", just under the header.
  var lead = document.querySelector('#book .lead');
  if (lead) {
    document.querySelectorAll('a[href="#book"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        lead.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  // Booking: hand the form off to Calendly with the answers prefilled.
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = new FormData(form);
      var get = function (k) { return String(f.get(k) || '').trim(); };
      var base = (root && root.getAttribute('data-calendly')) || 'https://calendly.com/ismoo/45-minute-call';
      var q = new URLSearchParams({
        name: get('name'), email: get('email'),
        a1: get('company'), a2: get('blocker'), a3: get('source'), a4: get('door')
      });
      var url = base + (base.indexOf('?') > -1 ? '&' : '?') + q.toString();
      var w = null;
      try { w = window.open(url, '_blank'); } catch (err) {}
      if (w) { try { w.opener = null; } catch (err) {} }
      else { window.location.assign(url); }
    });
  }
})();
