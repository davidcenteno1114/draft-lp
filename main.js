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
  // Picking a door (desktop button, or tapping the card on phones) also pre-fills
  // "What's getting in your way?" with its label, unless the visitor has typed there.
  var form = document.getElementById('book-form');
  var doors = document.querySelectorAll('.door');
  var prefilled = '';
  function pickDoor(door) {
    doors.forEach(function (d) {
      var on = d === door;
      d.classList.toggle('is-selected', on);
      var sel = d.querySelector('.door-select');
      if (sel) sel.setAttribute('aria-pressed', String(on));
    });
    if (!form) return;
    var cta = door && door.querySelector('[data-door]');
    var label = door ? door.querySelector('.door-problem').textContent.replace(/\s+/g, ' ').trim() : '';
    form.elements.door.value = cta ? cta.getAttribute('data-door') : '';
    var blocker = form.elements.blocker;
    if (blocker.value === '' || blocker.value === prefilled) {
      blocker.value = label;
      prefilled = label;
      blocker.setCustomValidity('');
      if (label) blocker.classList.remove('is-invalid');
    }
  }
  doors.forEach(function (door) {
    var cta = door.querySelector('[data-door]');
    if (cta) cta.addEventListener('click', function () { pickDoor(door); });
    var sel = door.querySelector('.door-select');
    if (sel) sel.addEventListener('click', function () {
      pickDoor(door.classList.contains('is-selected') ? null : door);
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

  // Mobile booking bar: step aside while the hero (which has its own button)
  // or the booking section is on screen.
  var bar = document.querySelector('.mobile-cta');
  var covered = [document.querySelector('.hero'), document.getElementById('book')].filter(Boolean);
  if (bar && covered.length && 'IntersectionObserver' in window) {
    var showing = [];
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var i = showing.indexOf(en.target);
        if (en.isIntersecting && i < 0) showing.push(en.target);
        if (!en.isIntersecting && i > -1) showing.splice(i, 1);
      });
      bar.classList.toggle('is-hidden', showing.length > 0);
    });
    covered.forEach(function (el) { io.observe(el); });
  }

  // Booking form: friendlier messages than the browser's "Please fill out this field."
  var missed = {
    name: "Oops, you might have missed your name.",
    company: "Oops, you might have missed your company name.",
    email: "Oops, you might have missed your email.",
    blocker: "Oops, you might have missed this. It helps us come to your call prepared."
  };
  if (form) {
    Object.keys(missed).forEach(function (k) {
      var field = form.elements[k];
      if (!field) return;
      field.addEventListener('invalid', function () {
        field.classList.add('is-invalid');
        if (field.validity.valueMissing) field.setCustomValidity(missed[k]);
        else if (field.validity.typeMismatch) field.setCustomValidity("Hmm, that email doesn't look quite right. Mind checking it?");
      });
      field.addEventListener('input', function () {
        field.setCustomValidity('');
        if (field.checkValidity()) field.classList.remove('is-invalid');
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
