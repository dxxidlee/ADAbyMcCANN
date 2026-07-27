/* ==========================================================================
   McCANN Design Suite — persistent left menu panel
   Creative Suite language: Inter · soft gray · sentence-case sections
   ========================================================================== */
(function () {
  var TOOLS = [
    { href: 'ada.html',    label: 'ADA' },
    { href: 'export.html', label: 'Export' },
    { href: 'brandboard.html', label: 'Brandboard' },
    { href: 'varlogo.html', label: 'Varlogo' }
  ];

  var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (file === '') file = 'index.html';

  var panel = document.createElement('aside');
  panel.className = 'panel';
  panel.setAttribute('role', 'navigation');
  panel.setAttribute('aria-label', 'Main menu');

  var word = document.createElement('div');
  word.className = 'wordmark';
  word.textContent = 'McCANN Design';
  panel.appendChild(word);

  panel.appendChild(navSection('About', null));

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

  var clock = document.createElement('div');
  clock.className = 'nav-clock';
  var cDate = document.createElement('div');
  cDate.className = 'clock-date';
  var cTime = document.createElement('div');
  cTime.className = 'clock-time';
  clock.appendChild(cDate);
  clock.appendChild(cTime);
  toolsList.appendChild(clock);

  panel.appendChild(navSection('Tools', toolsList));

  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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

  function navSection(title, listEl) {
    var sec = document.createElement('div');
    sec.className = 'nav-sec';

    var bar = document.createElement('div');
    bar.className = 'sec__bar sec__bar--thin';
    sec.appendChild(bar);

    var row = document.createElement('div');
    row.className = 'nav-row';

    var t = document.createElement('span');
    t.className = 'sec__title';
    t.textContent = title;
    row.appendChild(t);

    if (listEl) row.appendChild(listEl);
    sec.appendChild(row);
    return sec;
  }

  function mount() {
    var body = document.body;
    var main = document.createElement('div');
    main.className = 'main';

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
