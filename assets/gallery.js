/* ==========================================================================
   McCANN Design Suite — home work gallery
   Auto-scrolling vertical marquee in suite columns 4–5. Home page only.

   To go live: drop files in assets/work/ and list them in ITEMS below.
   While ITEMS is empty the gallery renders 16:9 placeholder tiles.

     { src:'assets/work/rebrand.gif', alt:'Rebrand loop' }        // image or gif
     { src:'assets/work/spot.mp4', type:'video', alt:'TV spot' }  // muted loop
   ========================================================================== */
(function () {
  var ITEMS = [];

  var SPEED = 30;        /* scroll speed, px per second */
  var RATIO = 9 / 16;    /* tile height ÷ width */
  var MIN_TILES = 3;

  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  function media(item) {
    var wrap = el('div', 'gal__media');
    if (!item) return wrap;

    if (item.type === 'video') {
      var v = el('video');
      v.src = item.src;
      v.muted = true;
      v.loop = true;
      v.autoplay = true;
      v.playsInline = true;
      v.setAttribute('muted', '');
      v.setAttribute('playsinline', '');
      if (item.alt) v.setAttribute('aria-label', item.alt);
      wrap.appendChild(v);
      return wrap;
    }

    var img = el('img');
    img.src = item.src;
    img.alt = item.alt || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    wrap.appendChild(img);
    return wrap;
  }

  function lane(count, hidden) {
    var l = el('div', 'gal__lane');
    if (hidden) l.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < count; i++) {
      var fig = el('figure', 'gal__item');
      fig.appendChild(media(ITEMS.length ? ITEMS[i % ITEMS.length] : null));
      l.appendChild(fig);
    }
    return l;
  }

  function mount() {
    if (!document.body.classList.contains('is-home')) return;
    var layout = document.querySelector('.layout');
    if (!layout || layout.querySelector('.gal')) return;

    var gal = el('section', 'gal');
    gal.setAttribute('aria-label', 'Selected work');
    var track = el('div', 'gal__track');
    gal.appendChild(track);
    layout.appendChild(gal);

    var tiles = 0;

    /* One lane must be at least as tall as the frame, otherwise the clone
       runs out of content before the loop resets. */
    function measure() {
      var w = gal.clientWidth;
      var h = gal.clientHeight;
      if (!w || !h) return;

      var gap = parseFloat(getComputedStyle(track).rowGap) || 0;
      var tileH = w * RATIO;
      var need = Math.max(MIN_TILES, Math.ceil((h + tileH) / (tileH + gap)) + 1);

      if (need !== tiles) {
        tiles = need;
        track.textContent = '';
        track.appendChild(lane(need, false));
        track.appendChild(lane(need, true));
      }

      var laneH = track.firstChild.offsetHeight;
      var shift = laneH + gap;
      gal.style.setProperty('--gal-shift', shift + 'px');
      gal.style.setProperty('--gal-dur', (shift / SPEED).toFixed(2) + 's');
    }

    measure();
    requestAnimationFrame(function () { gal.classList.add('is-in'); });

    if (window.ResizeObserver) {
      var raf = 0;
      new ResizeObserver(function () {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(measure);
      }).observe(gal);
    } else {
      window.addEventListener('resize', measure);
    }
  }

  /* nav.js rebuilds body into .layout — wait for it. */
  if (document.querySelector('.layout')) {
    mount();
  } else {
    document.addEventListener('suite:mounted', mount, { once: true });
    document.addEventListener('DOMContentLoaded', function () {
      requestAnimationFrame(mount);
    });
  }
})();
