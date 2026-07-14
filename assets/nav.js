/* ==========================================================================
   McCANN Design Suite — persistent left menu panel
   Always present on the left. Hover between pages using it.
   Default #000 · hover / active #A9A9A9. IBM Plex Mono Medium + SemiBold.
   ========================================================================== */
(function () {
  var TOOLS = [
    { href: 'ada.html',    label: 'ADA' },
    { href: 'export.html', label: 'EXPORT' },
    { href: null,          label: 'BRANDBOARD', soon: true },
    { href: 'varlogo.html', label: 'VARLOGO' }
  ];

  var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (file === '') file = 'index.html';

  var panel = document.createElement('aside');
  panel.className = 'panel';
  panel.setAttribute('role', 'navigation');
  panel.setAttribute('aria-label', 'Main menu');

  /* wordmark */
  var word = document.createElement('div');
  word.className = 'wordmark';
  word.textContent = 'McCANN Design';
  panel.appendChild(word);

  /* ---- ABOUT (I) ---- */
  panel.appendChild(navSection('I', 'ABOUT', null, false));

  /* ---- TOOLS (II) ---- */
  var toolsList = document.createElement('div');
  toolsList.className = 'nav-list';

  TOOLS.forEach(function (t) {
    var el;
    if (t.soon || !t.href) {
      el = document.createElement('span');
      el.className = 'nav-item nav-item--soon';
      el.setAttribute('aria-disabled', 'true');
      el.title = 'Coming soon';
    } else {
      el = document.createElement('a');
      el.className = 'nav-item';
      el.href = t.href;
      el.setAttribute('target', '_top');
      if (t.href.toLowerCase() === file) {
        el.classList.add('is-active');
        el.setAttribute('aria-current', 'page');
      }
    }
    el.textContent = t.label;
    toolsList.appendChild(el);
  });

  /* live clock lives under the tool list, same column */
  var clock = document.createElement('div');
  clock.className = 'nav-clock';
  var cDate = document.createElement('div');
  cDate.className = 'clock-date';
  var cTime = document.createElement('div');
  cTime.className = 'clock-time';
  clock.appendChild(cDate);
  clock.appendChild(cTime);
  toolsList.appendChild(clock);

  panel.appendChild(navSection('II', 'TOOLS', toolsList, true));

  /* ---- clock ticker ---- */
  var DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  var MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function tick() {
    var d = new Date();
    cDate.textContent = DAYS[d.getDay()] + ' ' + MONTHS[d.getMonth()] + ' ' + d.getDate();
    var h = d.getHours();
    var ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    cTime.textContent = h + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + ' ' + ap;
  }
  tick();
  setInterval(tick, 1000);

  /* ---- helpers ---- */
  function navSection(mark, title, listEl, thick) {
    var sec = document.createElement('div');
    sec.className = 'nav-sec';

    var bar = document.createElement('div');
    bar.className = 'sec__bar' + (thick ? '' : ' sec__bar--thin');
    sec.appendChild(bar);

    var row = document.createElement('div');
    row.className = 'nav-row';

    var m = document.createElement('span');
    m.className = 'sec__mark';
    m.textContent = mark;
    row.appendChild(m);

    var t = document.createElement('span');
    t.className = 'sec__title';
    t.textContent = title;
    row.appendChild(t);

    if (listEl) row.appendChild(listEl);
    sec.appendChild(row);
    return sec;
  }

  /* ---- mount: wrap existing body content into the layout ---- */
  function mount() {
    var body = document.body;
    var main = document.createElement('div');
    main.className = 'main';

    // move everything already in <body> into the main area
    while (body.firstChild) {
      main.appendChild(body.firstChild);
    }

    var layout = document.createElement('div');
    layout.className = 'layout';
    layout.appendChild(panel);
    layout.appendChild(main);
    body.appendChild(layout);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
