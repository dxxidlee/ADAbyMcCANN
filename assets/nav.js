/* ==========================================================================
   McCANN Design Suite — bento menu screen
   Builds the centered menu from the Figma mockup and wires its behavior:
     • On the landing page it is the content and stays put.
     • Selecting a page plays a disappear animation, then routes.
     • On tool pages the menu starts hidden and reappears whenever you scroll
       (auto-hiding again once scrolling stops).
   ========================================================================== */
(function () {
  var TILES = {
    suite:  { href: 'index.html',  label: 'McCANN Design Suite' },
    ada:    { href: 'ada.html',    label: 'ADA' },
    export: { href: 'export.html', label: 'Export' },
    brand:  { href: null,          label: 'Brandboard', soon: true },
    m:      { href: null,          label: 'M',          soon: true }
  };

  // Bento layout, row by row (matches the Figma composition)
  var ROWS = [
    ['suite'],
    ['ada', 'export'],
    ['brand', 'm']
  ];

  var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (file === '') file = 'index.html';
  var isHome = (file === 'index.html');

  var screen = document.createElement('div');
  screen.className = 'menu-screen';
  screen.setAttribute('role', 'navigation');
  screen.setAttribute('aria-label', 'Main menu');
  if (isHome) screen.classList.add('is-home');
  else screen.classList.add('is-hidden');

  var card = document.createElement('div');
  card.className = 'menu-card';

  var bento = document.createElement('div');
  bento.className = 'bento';

  ROWS.forEach(function (row) {
    var r = document.createElement('div');
    r.className = 'bento__row';

    row.forEach(function (key) {
      var t = TILES[key];
      var el;

      if (t.soon || !t.href) {
        el = document.createElement('span');
        el.setAttribute('aria-disabled', 'true');
        el.title = 'Coming soon';
      } else {
        el = document.createElement('a');
        el.href = t.href;
        el.setAttribute('target', '_top');
      }

      el.className = 'tile tile--' + key + (t.soon ? ' tile--soon' : '');
      el.textContent = t.label;

      if (t.href && t.href.toLowerCase() === file) {
        el.classList.add('is-active');
        el.setAttribute('aria-current', 'page');
      }
      r.appendChild(el);
    });

    bento.appendChild(r);
  });

  card.appendChild(bento);
  screen.appendChild(card);

  function navigateWithExit(href) {
    screen.classList.add('is-exiting');
    setTimeout(function () { window.location.href = href; }, 460);
  }

  bento.addEventListener('click', function (e) {
    var a = e.target.closest('a.tile');
    if (!a) return;
    e.preventDefault();
    var href = a.getAttribute('href');
    if (!href || href.toLowerCase() === file) return; // same page → ignore
    navigateWithExit(href);
  });

  function wireReveal() {
    var idle;
    function show() { screen.classList.remove('is-hidden'); }
    function scheduleHide() {
      clearTimeout(idle);
      idle = setTimeout(function () { screen.classList.add('is-hidden'); }, 1900);
    }

    // Reappear on every scroll, then recede once scrolling stops
    window.addEventListener('scroll', function () { show(); scheduleHide(); }, { passive: true });

    // Keep it up while the pointer is moving over it
    window.addEventListener('mousemove', function () {
      if (!screen.classList.contains('is-hidden')) scheduleHide();
    }, { passive: true });

    // Dismiss immediately by clicking the scrim or pressing Escape
    screen.addEventListener('click', function (e) {
      if (e.target === screen) { clearTimeout(idle); screen.classList.add('is-hidden'); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { clearTimeout(idle); screen.classList.add('is-hidden'); }
    });
  }

  function mount() {
    document.body.appendChild(screen);
    if (!isHome) wireReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
