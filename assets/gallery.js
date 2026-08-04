/* ==========================================================================
   McCANN Design Suite — home work gallery
   Auto-scrolling vertical marquee in suite columns 4–5. Home page only.

   FILES is the display order — keep it in the numerical order of the files
   in assets/gallery/. Add or remove entries there and the lane rebuilds.
   An entry may also be an object for a muted looping video:

     { src:'assets/gallery/38.mp4', type:'video', alt:'TV spot' }

   With FILES empty the gallery falls back to 16:9 placeholder tiles.
   ========================================================================== */
(function () {
  var DIR = 'assets/gallery/';

  var FILES = [
    '1.gif',  '2.jpg',  '3.gif',  '4.jpg',  '5.jpg',  '6.jpg',  '7.jpg',
    '8.jpg',  '9.jpg',  '10.png', '11.jpg', '12.gif', '13.jpg', '14.png',
    '15.png', '16.png', '17.png', '18.gif', '19.jpg', '20.gif', '21.gif',
    '22.png', '23.gif', '24.jpg', '25.png', '26.png', '27.png', '28.png',
    '29.png', '30.png', '31.png', '32.png', '33.png', '34.png', '35.jpg',
    '36.jpg', '37.png'
  ];

  var ITEMS = FILES.map(function (f) {
    return typeof f === 'string' ? { src: DIR + f } : f;
  });

  var DRIFT = 90;        /* idle scroll speed, px per second */
  var WHEEL_GAIN = 2.2;  /* how hard one wheel/trackpad notch pushes */
  var DAMPING = 2.8;     /* how quickly that push bleeds back to DRIFT, per second */
  var MAX_BOOST = 4800;  /* ceiling on flung velocity, px per second */
  var MAX_STEP = 0.05;   /* clamp dt so a stalled tab can't jump the strip */

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
    var shift = 1;   /* travel of one full pass: lane height + gap */
    var offset = 0;  /* current px scrolled, always wrapped into [0, shift) */
    var boost = 0;   /* velocity from wheel input, decays back to DRIFT */
    var last = 0;
    var loop = 0;

    /* One lane must be at least as tall as the frame, otherwise the clone
       runs out of content before the loop resets. */
    function measure() {
      var w = gal.clientWidth;
      var h = gal.clientHeight;
      if (!w || !h) return;

      var gap = parseFloat(getComputedStyle(track).rowGap) || 0;
      var tileH = w * RATIO;
      var need = Math.max(MIN_TILES, Math.ceil((h + tileH) / (tileH + gap)) + 1);

      /* A lane carries whole passes of the set, so the order continues
         unbroken across the loop seam (…36, 37, 1, 2…). */
      var count = ITEMS.length
        ? ITEMS.length * Math.ceil(need / ITEMS.length)
        : need;

      if (count !== tiles) {
        tiles = count;
        track.textContent = '';
        track.appendChild(lane(count, false));
        track.appendChild(lane(count, true));
      }

      /* Fractional height — offsetHeight rounds, which would leave a
         sub-pixel seam at every wrap. */
      shift = track.firstChild.getBoundingClientRect().height + gap;
      offset = wrap(offset);
      draw();
    }

    function wrap(v) {
      return ((v % shift) + shift) % shift;
    }

    function draw() {
      track.style.transform = 'translate3d(0,' + -offset + 'px,0)';
    }

    function frame(now) {
      loop = requestAnimationFrame(frame);

      /* First frame after a start has no reference point — don't integrate. */
      var dt = last ? Math.min((now - last) / 1000, MAX_STEP) : 0;
      last = now;
      if (!dt) return;

      boost *= Math.exp(-DAMPING * dt);
      if (Math.abs(boost) < 0.5) boost = 0;

      offset = wrap(offset + (DRIFT + boost) * dt);
      draw();
    }

    function start() {
      if (!loop && !reduced()) {
        last = 0;
        loop = requestAnimationFrame(frame);
      }
    }

    function stop() {
      if (loop) {
        cancelAnimationFrame(loop);
        loop = 0;
      }
    }

    /* Wheel and trackpad add momentum; scrolling back runs the strip in
       reverse. deltaMode normalises line- and page-based wheels. */
    gal.addEventListener('wheel', function (e) {
      if (reduced() || e.ctrlKey) return;   /* leave pinch-zoom alone */
      e.preventDefault();

      var d = e.deltaY;
      if (e.deltaMode === 1) d *= 16;
      else if (e.deltaMode === 2) d *= gal.clientHeight;

      boost += d * WHEEL_GAIN;
      if (boost > MAX_BOOST) boost = MAX_BOOST;
      else if (boost < -MAX_BOOST) boost = -MAX_BOOST;

      start();
    }, { passive: false });

    measure();
    requestAnimationFrame(function () { gal.classList.add('is-in'); });
    start();

    /* Don't burn frames on a hidden tab, and don't let the gap turn into a jump. */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      var onPref = function () {
        if (reduced()) {
          stop();
          offset = 0;
          track.style.transform = '';
        } else {
          start();
        }
      };
      if (mq.addEventListener) mq.addEventListener('change', onPref);
      else if (mq.addListener) mq.addListener(onPref);
    }

    if (window.ResizeObserver) {
      var pending = 0;
      new ResizeObserver(function () {
        cancelAnimationFrame(pending);
        pending = requestAnimationFrame(measure);
      }).observe(gal);
    } else {
      window.addEventListener('resize', measure);
    }
  }

  function reduced() {
    return window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
