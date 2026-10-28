(function () {
  var root = document.querySelector('.ism');

  // Footer copyright year stays current.
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // Hero: rotate the "not to ..." phrases; hover (or tap on touch) pauses.
  var h1 = document.querySelector('.hero .h1');
  var phrases = h1 ? h1.querySelectorAll('.rot .ph') : [];
  var i = 0, timer = null, paused = false, reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  // Desktop keeps "not to" and the phrase on one centred line: the phrase box
  // eases to each phrase's width so the line re-centres instead of leaving a gap.
  var rot = h1 && h1.querySelector('.rot');
  var wide = window.matchMedia('(min-width: 900px)');
  function fitRot() {
    if (!rot || !phrases.length) return;
    rot.style.width = wide.matches ? phrases[i].offsetWidth + 'px' : '';
  }
  function show(n) {
    phrases[i].classList.remove('on');
    i = n;
    phrases[i].classList.add('on');
    fitRot();
  }
  fitRot();
  window.addEventListener('resize', fitRot);
  // Re-measure when a phrase changes size, e.g. once the heading font has loaded.
  if (rot && 'ResizeObserver' in window) {
    var ro = new ResizeObserver(fitRot);
    phrases.forEach(function (ph) { ro.observe(ph); });
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

  // Scroll progress: the bar under the header shows how far down the page you are.
  // On mobile the floating "Learn more" cue leaves once the problem section is on screen.
  var progress = document.querySelector('.scroll-progress');
  var cue = document.querySelector('.scroll-cue');
  var problemTitle = document.getElementById('the-problem');
  var problem = problemTitle && problemTitle.closest('section');
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    if (cue && problem) cue.classList.toggle('is-gone', problem.getBoundingClientRect().top < window.innerHeight * 0.85);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty('--progress', max > 0 ? Math.min(1, y / max) : 0);
    }
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

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

  // Booking: open times come from the Google Apps Script web app (apps-script/booking.gs),
  // which also creates the calendar invite. Without it, booking falls back to email.
  var endpoint = (root && root.getAttribute('data-booking-endpoint')) || '';
  var picker = document.getElementById('slot-picker');
  var done = document.getElementById('book-done');
  if (form && picker) {
    var daysEl = picker.querySelector('.slot-days');
    var timesEl = picker.querySelector('.slot-times');
    var statusEl = picker.querySelector('.slot-status');
    var submitBtn = form.querySelector('button[type="submit"]');
    var submitHTML = submitBtn.innerHTML;
    var TZ = 'Asia/Manila';
    var fmtDay = new Intl.DateTimeFormat('en-PH', { timeZone: TZ, weekday: 'short' });
    var fmtDate = new Intl.DateTimeFormat('en-PH', { timeZone: TZ, month: 'short', day: 'numeric' });
    var fmtKey = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
    var fmtTime = new Intl.DateTimeFormat('en-PH', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
    var fmtFull = new Intl.DateTimeFormat('en-PH', { timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    var byDay = {}, dayKeys = [], online = false;

    var setStatus = function (msg) { statusEl.textContent = msg; };
    var selectedSlot = function () {
      var r = timesEl.querySelector('input[name="slot"]:checked');
      return r ? r.value : '';
    };

    function renderTimes(key) {
      timesEl.textContent = '';
      daysEl.querySelectorAll('.slot-day').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.key === key));
      });
      (byDay[key] || []).forEach(function (s) {
        var label = document.createElement('label');
        label.className = 'slot-time';
        var input = document.createElement('input');
        input.type = 'radio';
        input.name = 'slot';
        input.value = s.start;
        input.addEventListener('change', function () { picker.classList.remove('is-invalid'); setStatus(''); });
        var span = document.createElement('span');
        span.textContent = fmtTime.format(new Date(s.start));
        label.appendChild(input);
        label.appendChild(span);
        timesEl.appendChild(label);
      });
    }

    function renderSlots(slots) {
      byDay = {}; dayKeys = [];
      slots.forEach(function (s) {
        var k = fmtKey.format(new Date(s.start));
        if (!byDay[k]) { byDay[k] = []; dayKeys.push(k); }
        byDay[k].push(s);
      });
      daysEl.textContent = '';
      timesEl.textContent = '';
      if (!dayKeys.length) {
        online = false;
        setStatus("We're fully booked for the next few weeks. Send the form and we'll email you to find a time.");
        return;
      }
      dayKeys.forEach(function (k) {
        var d = new Date(byDay[k][0].start);
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'slot-day';
        b.dataset.key = k;
        b.setAttribute('aria-pressed', 'false');
        var w = document.createElement('span');
        w.textContent = fmtDay.format(d);
        var n = document.createElement('strong');
        n.textContent = fmtDate.format(d);
        b.appendChild(w);
        b.appendChild(n);
        b.addEventListener('click', function () { renderTimes(k); });
        daysEl.appendChild(b);
      });
      online = true;
      setStatus('');
      renderTimes(dayKeys[0]);
    }

    function offline() {
      online = false;
      daysEl.textContent = '';
      timesEl.textContent = '';
      setStatus("Online booking isn't available right now. Send the form and we'll email you to find a time.");
    }

    function loadSlots(note) {
      if (!endpoint) { offline(); return; }
      setStatus('Loading available times…');
      fetch(endpoint + (endpoint.indexOf('?') > -1 ? '&' : '?') + 'action=slots')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.ok) { renderSlots(data.slots || []); if (note && online) setStatus(note); } else offline();
        })
        .catch(offline);
    }
    loadSlots();

    function details() {
      var f = new FormData(form);
      var get = function (k) { return String(f.get(k) || '').trim(); };
      return {
        name: get('name'), company: get('company'), email: get('email'), blocker: get('blocker'),
        source: get('source'), door: get('door'), website: get('website'), start: selectedSlot()
      };
    }

    // No live calendar: open an email to the team with everything filled in.
    function emailFallback(d) {
      var body = [
        'Name: ' + d.name, 'Company: ' + d.company, 'Email: ' + d.email,
        "What's getting in our way: " + d.blocker,
        'How we found you: ' + (d.source || '-'), 'Door: ' + (d.door || '-'),
        '', 'Please suggest a time for a Discovery Call.'
      ].join('\n');
      window.location.href = 'mailto:letsbuild@ismoo.tech?subject=' +
        encodeURIComponent('Discovery Call request: ' + d.company) + '&body=' + encodeURIComponent(body);
    }

    function busy(on) {
      submitBtn.disabled = on;
      submitBtn.innerHTML = on ? 'Booking your call…' : submitHTML;
    }

    function showDone(d, start) {
      done.querySelector('.done-when').textContent = fmtFull.format(new Date(start)) + ' (Philippine time)';
      done.querySelector('.done-email').textContent = d.email;
      form.hidden = true;
      done.hidden = false;
      done.focus({ preventScroll: true });
      done.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = details();
      if (!online) { emailFallback(d); return; }
      if (!d.start) {
        picker.classList.add('is-invalid');
        setStatus('Oops, pick a time that works for you.');
        picker.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        return;
      }
      busy(true);
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(d) })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          busy(false);
          if (res && res.ok) { showDone(d, res.start || d.start); return; }
          var err = res && res.error;
          if (err === 'slot_taken') {
            picker.classList.add('is-invalid');
            loadSlots('That time was just taken. Please pick another.');
          } else if (err === 'already_booked') {
            setStatus("You've just booked a call. Check your inbox for the invite, or email letsbuild@ismoo.tech to change it.");
          } else {
            setStatus("Something went wrong on our side. Please try again, or email letsbuild@ismoo.tech.");
          }
        })
        .catch(function () {
          busy(false);
          setStatus("We couldn't reach our calendar. Please try again, or email letsbuild@ismoo.tech.");
        });
    });
  }
})();
