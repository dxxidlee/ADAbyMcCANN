/* ==========================================================================
   McCANN Design Suite — horizontal entrance menu
   Figma Creative Suite 91:3 (collapsed) · 91:58 (Tools open)
   ========================================================================== */
(function () {
  var TOOLS = [
    { href: 'ada.html',        label: 'Color-check' },
    { href: 'export.html',     label: 'Multi-export' },
    { href: 'brandboard.html', label: 'Mesh-gradient' },
    { href: 'varlogo.html',    label: 'Logo-variant' },
    { href: 'recolor.html',    label: 'Color-swap' }
  ];

  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (file === '') file = 'index.html';
  var isHome = (file === 'index.html');

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---- build menu ---- */
  var menu = el('nav', 'menu');
  menu.setAttribute('role', 'navigation');
  menu.setAttribute('aria-label', 'Main menu');

  var brand = el('a', 'menu__brand', 'McCann Design');
  brand.href = 'index.html';
  brand.setAttribute('target', '_top');
  menu.appendChild(brand);

  var cluster = el('div', 'menu__cluster');

  var toolsBlock = el('div', 'menu__tools-block');
  var toolsBtn = el('button', 'menu__tools-label', 'Tools');
  toolsBtn.type = 'button';
  toolsBtn.setAttribute('aria-expanded', 'false');
  toolsBtn.setAttribute('aria-controls', 'menuTools');
  toolsBlock.appendChild(toolsBtn);

  var toolsSlot = el('div', 'menu__tools-slot');
  var toolsInner = el('div', 'menu__tools-inner');
  var toolsList = el('ul', 'menu__tools');
  toolsList.id = 'menuTools';

  TOOLS.forEach(function (t) {
    var li = document.createElement('li');
    var a = el('a', 'menu__tool', t.label);
    a.href = t.href;
    a.setAttribute('target', '_top');
    if (t.href.toLowerCase() === file) {
      a.classList.add('is-active');
      a.setAttribute('aria-current', 'page');
    }
    a.addEventListener('click', onToolClick);
    li.appendChild(a);
    toolsList.appendChild(li);
  });

  toolsInner.appendChild(toolsList);
  toolsSlot.appendChild(toolsInner);
  toolsBlock.appendChild(toolsSlot);
  cluster.appendChild(toolsBlock);

  var info = el('span', 'menu__info', 'Information');
  info.title = 'Coming soon';
  info.setAttribute('aria-disabled', 'true');
  info.setAttribute('aria-label', 'Information, coming soon');
  cluster.appendChild(info);

  var clock = el('div', 'menu__clock');
  clock.setAttribute('aria-live', 'off');
  cluster.appendChild(clock);

  menu.appendChild(cluster);

  function tick() {
    var d = new Date();
    var h = d.getHours();
    var ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    clock.textContent =
      DAYS[d.getDay()] + ' ' + MONTHS[d.getMonth()] + ' ' + d.getDate() +
      ' ' + h + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + ' ' + ap;
  }
  tick();
  setInterval(tick, 1000);

  /* ---- Tools open / close ---- */
  var leaving = false;

  function setOpen(open) {
    if (leaving && open) return;
    menu.classList.toggle('is-open', open);
    toolsBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  toolsBlock.addEventListener('mouseenter', function () { setOpen(true); });
  toolsBlock.addEventListener('mouseleave', function () { setOpen(false); });
  toolsBlock.addEventListener('focusin', function () { setOpen(true); });
  toolsBlock.addEventListener('focusout', function (e) {
    if (!toolsBlock.contains(e.relatedTarget)) setOpen(false);
  });

  /* ---- click → rise + enter tool ---- */
  function onToolClick(e) {
    var href = e.currentTarget.getAttribute('href');
    if (!href) return;

    // Already on this tool — just ensure docked
    if (href.toLowerCase() === file) {
      e.preventDefault();
      return;
    }

    e.preventDefault();

    /* Snap Tools closed first so the rise isn’t fighting the retract */
    leaving = true;
    menu.classList.add('is-leaving');
    setOpen(false);
    menu.offsetWidth; /* flush instant collapse before rise starts */

    menu.classList.add('is-rising');
    document.body.classList.add('is-rising');

    try { sessionStorage.setItem('mccann-menu-enter', isHome ? '0' : '1'); } catch (err) {}

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* Home: play the rise before navigating. Tool→tool: enter page handles rise. */
    var delay = reduce ? 0 : (isHome ? 620 : 0);
    setTimeout(function () {
      location.href = href;
    }, delay);
  }

  /* ---- mount ---- */
  function mount() {
    var body = document.body;
    body.classList.add(isHome ? 'is-home' : 'is-tool');

    var main = el('div', 'main');
    while (body.firstChild) main.appendChild(body.firstChild);

    var layout = el('div', 'layout');
    layout.appendChild(menu);
    layout.appendChild(main);
    body.appendChild(layout);

    if (isHome) {
      // Centered entrance — bar stays mid-viewport
      menu.classList.add('is-centered');
      requestAnimationFrame(function () {
        body.classList.add('is-ready');
      });
      return;
    }

    // Tool pages: play rise when arriving from another tool (home already rose before nav).
    var fromMenu = false;
    try {
      fromMenu = sessionStorage.getItem('mccann-menu-enter') === '1';
      sessionStorage.removeItem('mccann-menu-enter');
    } catch (err) {}

    if (fromMenu && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      menu.classList.add('is-centered');
      main.classList.add('is-entering');
      menu.offsetHeight;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          menu.classList.add('is-rising');
          body.classList.add('is-rising');
          setTimeout(function () {
            menu.classList.remove('is-centered', 'is-rising');
            body.classList.remove('is-rising');
            menu.classList.add('is-docked');
            body.classList.add('is-ready');
            main.classList.remove('is-entering');
            main.classList.add('is-entered');
          }, 620);
        });
      });
    } else {
      menu.classList.add('is-docked');
      body.classList.add('is-ready');
      main.classList.add('is-entered');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
