// Rotating dotted globe for the homepage (src/pages/index.astro).
//
// How it works, in one place:
//  • The globe rotates; land is dots sampled from Natural Earth (world-atlas via jsDelivr).
//  • ROUTE: a dashed line travels a fixed loop of cities and never goes back:
//      Warsaw → Brussels → Indiana → Tokyo → Tbilisi → Warsaw …
//    Only one city marker is on the globe at a time. The line leaves when the city has been
//    shown for HOLD ms, or earlier as soon as the city starts to shrink near the horizon.
//  • TAGS (SEO, AEO, GEO, AI, B2B) appear only right after the line lands in a visible city,
//    never twice at once, never on top of another marker. Hovering one slows the globe and
//    swaps the entry panel to that topic (content: .g-topics in index.astro).
//  • ONE GLITCH: every marker (city or tag) appears and disappears with the same glitch —
//    the CSS classes .is-in / .is-out on the marker, .glitch on its label (style.css).
(function () {
  var canvas = document.getElementById('globe');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');

  // ---------------------------------------------------------------- settings
  var DEG = Math.PI / 180;
  var TILT = 4 * DEG;              // latitude at the centre of the view
  var SPEED = 6 * DEG;             // rotation per second at full speed
  var SLOW = 0.3;                  // speed factor while a topic is hovered
  var ROUTE = [                    // the loop, in order (labelLeft: label on the left of the dot)
    { name: 'WARSAW', lon: 21.01, lat: 52.23 },
    { name: 'BRUSSELS', lon: 4.35, lat: 50.85, labelLeft: true },
    { name: 'INDIANA, U.S.', lon: -86.16, lat: 39.77 },
    { name: 'TOKYO', lon: 139.69, lat: 35.69 },
    { name: 'TBILISI', lon: 44.79, lat: 41.72 }
  ];
  var HOLD = 1800, FLY = 1700, LAND = 650;   // ms: city shown, line flying, line tail retracting
  var SWITCH_AT = 0.82;            // fraction of the flight when the next city glitches in
  var GLITCH = 420;                // ms, must match the .is-in / .is-out animations in style.css
  var WORDS = ['SEO', 'AEO', 'GEO', 'AI', 'B2B', 'B2B'];   // B2B twice = twice as often
  var SPAWN_WINDOW = 1500;         // after a landing, keep looking this long for a free spot
  var GAP = 8;                     // px of free space kept around every marker
  var HORIZON = 0.06;              // z below this = behind the globe
  var SHRINK_Z = HORIZON + 0.45 * 0.7;       // markers start shrinking below this z

  var css = getComputedStyle(document.documentElement);
  var INK = (css.getPropertyValue('--ink') || '#1a1a1a').trim();
  var RULE = (css.getPropertyValue('--rule') || '#ddd8d0').trim();
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------- geometry
  var W = 0, H = 0, R = 0, CX = 0, CY = 0, DPR = 1;
  var lambda0 = -10 * DEG, speedFactor = 1, speedTarget = 1;
  var dots = [];                   // land dots: [lonRad, latRad]
  var p = { x: 0, y: 0, z: 0 }, q = { x: 0, y: 0, z: 0 };

  function isWide() { return W > 760; }

  function layout() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    // Phones: the globe sits in its own strip below the hero (CSS vars used by all globe layers).
    var root = document.documentElement, entry = document.getElementById('g-entry');
    if (canvas.clientWidth <= 760 && entry) {
      root.style.setProperty('--globe-h', Math.round(Math.min(canvas.clientWidth * 0.8, 360)) + 'px');
      root.style.setProperty('--globe-top', Math.round(entry.getBoundingClientRect().bottom + window.scrollY + 24) + 'px');
    } else {
      root.style.removeProperty('--globe-h'); root.style.removeProperty('--globe-top');
    }
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (isWide()) { R = H * 0.66; CX = W * 0.03; CY = H * 1.14; }   // upper-right limb, bottom-left quarter
    else { R = W * 0.95; CX = W * 0.1; CY = H * 0.12 + R; }          // a cap rising from the strip
  }

  var sinT = Math.sin(TILT), cosT = Math.cos(TILT);
  function project(lon, lat, out) {                  // orthographic projection
    var l = lon + lambda0, cl = Math.cos(lat);
    out.z = sinT * Math.sin(lat) + cosT * cl * Math.cos(l);
    out.x = CX + R * cl * Math.sin(l);
    out.y = CY - R * (cosT * Math.sin(lat) - sinT * cl * Math.cos(l));
    return out;
  }
  function markerScale(z) { return Math.max(0.3, Math.min(1, (z - HORIZON) / 0.45 + 0.3)); }

  function buildDots(land) {                         // rasterise land, then sample a dot grid
    var mw = 720, mh = 360, mask = null;
    if (land && window.d3 && d3.geoPath) {
      var off = document.createElement('canvas'); off.width = mw; off.height = mh;
      var octx = off.getContext('2d');
      var proj = d3.geoEquirectangular().scale(mw / (2 * Math.PI)).translate([mw / 2, mh / 2]);
      octx.fillStyle = '#000'; octx.beginPath(); d3.geoPath(proj, octx)(land); octx.fill();
      mask = octx.getImageData(0, 0, mw, mh).data;
    }
    var step = mask ? 1.25 : 3.2;                    // sparse uniform sphere if land data is missing
    dots = [];
    for (var lat = -84; lat <= 84; lat += step) {
      var lonStep = step / Math.max(Math.cos(lat * DEG), 0.15);
      for (var lon = -180; lon < 180; lon += lonStep) {
        if (mask) {
          var px = Math.floor((lon + 180) / 360 * mw), py = Math.floor((90 - lat) / 180 * mh);
          if (mask[(py * mw + px) * 4 + 3] < 128) continue;
        }
        dots.push([lon * DEG, lat * DEG]);
      }
    }
  }

  function drawLine(points) {                        // polyline on the sphere, near side only
    var pen = false;
    ctx.beginPath();
    for (var i = 0; i < points.length; i++) {
      project(points[i][0], points[i][1], p);
      if (p.z > 0) { if (pen) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); pen = true; } else pen = false;
    }
    ctx.stroke();
  }

  function drawGlobe() {
    ctx.clearRect(0, 0, W, H);
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(240,237,232,.55)'; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = INK; ctx.globalAlpha = .55; ctx.stroke(); ctx.globalAlpha = 1;

    ctx.strokeStyle = RULE; ctx.lineWidth = .8;
    var lon, lat, line;
    for (lon = -180; lon < 180; lon += 15) { line = []; for (lat = -90; lat <= 90; lat += 3) line.push([lon * DEG, lat * DEG]); drawLine(line); }
    for (lat = -75; lat <= 75; lat += 15) { line = []; for (lon = -180; lon <= 180; lon += 3) line.push([lon * DEG, lat * DEG]); drawLine(line); }

    ctx.fillStyle = INK;
    var r0 = Math.max(1.1, R / 420);
    for (var i = 0; i < dots.length; i++) {
      project(dots[i][0], dots[i][1], p);
      if (p.z <= 0.02 || p.x < -4 || p.y < -4 || p.x > W + 4 || p.y > H + 4) continue;
      ctx.globalAlpha = 0.18 + 0.62 * p.z;
      ctx.beginPath(); ctx.arc(p.x, p.y, r0 * (0.55 + 0.45 * p.z), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- markers (shared by cities and tags)
  // A marker is a DOM element pinned to a lon/lat. It glitches in, follows the rotation,
  // shrinks near the horizon, and glitches out — the same way for cities and tags.
  function makeLayer(cls, existing) {
    var el = existing || document.createElement('div');
    if (!existing) { el.className = cls; el.setAttribute('aria-hidden', 'true'); canvas.parentNode.insertBefore(el, canvas.nextSibling); }
    return el;
  }
  function glitchIn(m) {
    m.out = false; m.el.style.display = '';
    m.el.classList.remove('is-out'); void m.el.offsetWidth; m.el.classList.add('is-in');
    clearTimeout(m.timer); m.timer = setTimeout(function () { m.el.classList.remove('is-in'); }, GLITCH);
  }
  function glitchOut(m, done) {
    if (m.out) return; m.out = true;
    m.el.classList.remove('is-in'); m.el.classList.add('is-out');
    clearTimeout(m.timer); m.timer = setTimeout(function () { m.el.style.display = 'none'; if (done) done(); }, GLITCH);
  }
  function placeMarker(m) {                          // follow the globe; returns the projected point
    project(m.lon, m.lat, q);
    m.el.style.transform = 'translate3d(' + q.x.toFixed(1) + 'px,' + q.y.toFixed(1) + 'px,0)';
    m.inner.style.transform = 'scale(' + markerScale(q.z).toFixed(3) + ')';
    return q;
  }
  function boxOf(m) {                                // on-screen box (canvas coords) + GAP
    if (m.el.style.display === 'none') return null;
    var c = canvas.getBoundingClientRect(), parts = m.inner.children, l = 1e9, t = 1e9, r = -1e9, b = -1e9;
    for (var i = 0; i < parts.length; i++) {
      var e = parts[i].getBoundingClientRect();
      if (!e.width && !e.height) continue;
      l = Math.min(l, e.left); t = Math.min(t, e.top); r = Math.max(r, e.right); b = Math.max(b, e.bottom);
    }
    return l > r ? null : { l: l - c.left - GAP, t: t - c.top - GAP, r: r - c.left + GAP, b: b - c.top + GAP };
  }
  function overlaps(a, b) { return !!(a && b) && !(a.r < b.l || a.l > b.r || a.b < b.t || a.t > b.b); }

  // ---------------------------------------------------------------- cities on the route
  var placeLayer = makeLayer('globe-places');
  var cities = ROUTE.map(function (c) {
    var el = document.createElement('div');
    el.className = 'gplace' + (c.labelLeft ? ' is-left' : '');
    el.style.display = 'none';
    el.innerHTML = '<div class="gplace-inner"><span class="gplace-dot"></span><span class="gplace-name glitch" data-text="' + c.name + '">' + c.name + '</span></div>';
    placeLayer.appendChild(el);
    return { el: el, inner: el.firstChild, lon: c.lon * DEG, lat: c.lat * DEG, out: true, timer: 0, shown: false, blocked: false };
  });
  function cityVisible(i) { project(cities[i].lon, cities[i].lat, q); return q.z > HORIZON; }
  function setCityShown(i, on) {                     // the one city marker on the globe (or none)
    var c = cities[i];
    c.shown = on;
    if (on && cityVisible(i) && !c.blocked) glitchIn(c); else glitchOut(c);
  }
  function updateCities() {
    cities.forEach(function (c, i) {
      if (c.el.style.display === 'none' && c.out) return;
      var pt = placeMarker(c);
      if (!c.out && pt.z < HORIZON) glitchOut(c);                       // over the horizon
    });
    cities.forEach(function (c, i) {                                    // came back into view
      if (c.shown && c.out && !c.blocked && cityVisible(i) && c.el.style.display === 'none') { placeMarker(c); glitchIn(c); }
    });
  }

  // ---------------------------------------------------------------- the route (fixed loop)
  var ARC_N = 80;
  var route = { i: 0, phase: 'hold', t0: 0, arc: null, switched: false };
  var landedAt = 0;
  function next(i) { return (i + 1) % ROUTE.length; }
  function ease(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  function greatCircle(a, b, n) {                    // lifted arc between two cities
    function v(c) { return [Math.cos(c.lat) * Math.cos(c.lon), Math.cos(c.lat) * Math.sin(c.lon), Math.sin(c.lat)]; }
    var A = v(a), B = v(b), w = Math.acos(Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2])), s = Math.sin(w), out = [];
    for (var k = 0; k <= n; k++) {
      var t = k / n, k1 = Math.sin((1 - t) * w) / s, k2 = Math.sin(t * w) / s;
      var x = k1 * A[0] + k2 * B[0], y = k1 * A[1] + k2 * B[1], z = k1 * A[2] + k2 * B[2], len = Math.sqrt(x * x + y * y + z * z);
      out.push([Math.atan2(y, x), Math.asin(z / len), 1 + (0.03 + 0.09 * w / Math.PI) * Math.sin(Math.PI * t)]);
    }
    return out;
  }
  function arcPoint(f, out) {
    var x = f * ARC_N, k = Math.min(Math.floor(x), ARC_N - 1), u = x - k, a = route.arc[k], b = route.arc[k + 1];
    project(a[0], a[1], p); var ax = CX + (p.x - CX) * a[2], ay = CY + (p.y - CY) * a[2], az = p.z;
    project(b[0], b[1], p); var bx = CX + (p.x - CX) * b[2], by = CY + (p.y - CY) * b[2];
    out.x = ax + (bx - ax) * u; out.y = ay + (by - ay) * u; out.z = az;
    return out;
  }
  function drawArc(f0, f1, t) {
    if (f1 <= f0) return;
    ctx.setLineDash([4, 4]); ctx.lineDashOffset = -t / 60;            // dashes flow towards the target
    ctx.lineWidth = 1.2; ctx.strokeStyle = INK;
    ctx.beginPath(); var pen = false, steps = Math.max(2, Math.ceil((f1 - f0) * ARC_N)), pt = { x: 0, y: 0, z: 0 };
    for (var k = 0; k <= steps; k++) {
      arcPoint(f0 + (f1 - f0) * k / steps, pt);
      if (pt.z > 0) { if (pen) ctx.lineTo(pt.x, pt.y); else ctx.moveTo(pt.x, pt.y); pen = true; } else pen = false;
    }
    ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
  }
  function stepRoute(t) {
    var el = t - route.t0, cur = route.i, nxt = next(cur);
    if (route.phase === 'hold') {
      project(cities[cur].lon, cities[cur].lat, q);
      if (el > HOLD || q.z < SHRINK_Z) {                               // time's up, or the city is shrinking
        route.phase = 'fly'; route.t0 = t; route.switched = false;
        route.arc = greatCircle(cities[cur], cities[nxt], ARC_N);
      }
    } else if (route.phase === 'fly') {
      var f = ease(Math.min(1, el / FLY));
      drawArc(0, f, t);
      var head = arcPoint(f, { x: 0, y: 0, z: 0 });
      if (head.z > 0) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(head.x, head.y, 2.4, 0, Math.PI * 2); ctx.fill(); }
      if (!route.switched && f >= SWITCH_AT) { route.switched = true; setCityShown(cur, false); setCityShown(nxt, true); }
      if (el >= FLY) { route.phase = 'land'; route.t0 = t; }
    } else {                                                            // land: the tail retracts into the city
      drawArc(ease(Math.min(1, el / LAND)), 1, t);
      if (el >= LAND) {
        route.i = nxt; route.phase = 'hold'; route.t0 = t; route.arc = null;
        if (cityVisible(nxt)) landedAt = t;                             // a visible landing releases one tag
      }
    }
  }

  // ---------------------------------------------------------------- topic panel
  var panel = document.getElementById('g-entry');
  var topicSrc = {};
  document.querySelectorAll('.g-topics [data-topic]').forEach(function (n) { topicSrc[n.getAttribute('data-topic')] = n.innerHTML; });
  var defaultHTML = panel ? panel.innerHTML : '';
  var currentTopic = null, restoreTimer = 0;

  function setPanel(topic) {
    if (!panel || topic === currentTopic) return;
    var html = topic ? topicSrc[topic] : defaultHTML;
    if (!html) return;
    currentTopic = topic;
    panel.classList.remove('is-swapping'); void panel.offsetWidth;    // same glitch as the markers
    panel.classList.add('is-swapping');
    panel.innerHTML = html;
    panel.classList.toggle('is-topic', !!topic);
    setTimeout(function () { panel.classList.remove('is-swapping'); }, GLITCH);
  }
  function holdTopic(topic, tag) {
    clearTimeout(restoreTimer);
    tags.forEach(function (t) { t.active = (t === tag); t.el.classList.toggle('is-active', t.active); });
    speedTarget = SLOW;
    setPanel(topic);
  }
  function releaseSoon(ms) {
    clearTimeout(restoreTimer);
    restoreTimer = setTimeout(function () {
      tags.forEach(function (t) { t.active = false; t.el.classList.remove('is-active'); });
      if (!tags.some(function (t) { return t.hover; })) speedTarget = 1;
      setPanel(null);
    }, ms);
  }
  if (panel) {
    panel.addEventListener('mouseenter', function () { if (currentTopic) clearTimeout(restoreTimer); });
    panel.addEventListener('mouseleave', function () { if (currentTopic) releaseSoon(1600); });
    panel.addEventListener('focusin', function () { if (currentTopic) clearTimeout(restoreTimer); });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && currentTopic) releaseSoon(0); });
  document.addEventListener('click', function (e) {
    if (currentTopic && !e.target.closest('.gtag') && !e.target.closest('#g-entry')) releaseSoon(0);
  });

  // ---------------------------------------------------------------- topic tags
  var tagLayer = makeLayer('globe-tags', document.getElementById('globe-tags'));
  var tags = [], deck = [];

  function nextWord() {                              // shuffled deck; a topic is never on the globe twice
    var onGlobe = {};
    tags.forEach(function (t) { onGlobe[t.word] = true; });
    for (var round = 0; round < 2; round++) {
      if (!deck.length) {
        deck = WORDS.slice();
        for (var i = deck.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, s = deck[i]; deck[i] = deck[j]; deck[j] = s; }
      }
      for (var k = deck.length - 1; k >= 0; k--) if (!onGlobe[deck[k]]) return deck.splice(k, 1)[0];
      deck = [];
    }
    return null;
  }
  function panelBox() {                              // the entry text, in canvas coordinates
    if (!panel || !isWide()) return null;
    var r = panel.getBoundingClientRect(), c = canvas.getBoundingClientRect();
    return { l: r.left - c.left - 16, t: r.top - c.top - 16, r: r.right - c.left + 16, b: r.bottom - c.top + 16 };
  }
  function tagFootprint(x, y) { return { l: x - 6 - GAP, t: y - 48 - GAP, r: x + 84 + GAP, b: y + 6 + GAP }; }

  function spawnTag() {
    if (!dots.length) return false;
    var word = nextWord(); if (!word) return false;
    var wide = isWide(), xMax = wide ? W * 0.24 : W * 0.85, yMin = H * (wide ? 0.52 : 0.3), yMax = H * (wide ? 0.84 : 0.75);
    var avoid = [panelBox()].concat(cities.map(boxOf), tags.map(boxOf)), spot = null;
    for (var tries = 0; tries < 600 && !spot; tries++) {   // near side of the arc: the longest ride
      var d = dots[(Math.random() * dots.length) | 0];
      project(d[0], d[1], p);
      if (p.z < 0.5 || p.x < 24 || p.x > xMax || p.y < yMin || p.y > yMax) continue;
      var fp = tagFootprint(p.x, p.y);
      if (!avoid.some(function (b) { return overlaps(fp, b); })) spot = d;
    }
    if (!spot) { deck.push(word); return false; }

    var el = document.createElement('div');
    el.className = 'gtag';
    el.innerHTML = '<div class="gtag-inner"><span class="gtag-dot"></span><span class="gtag-line"></span>' +
      '<button type="button" class="gtag-label glitch" data-text="' + word + '" aria-label="Show ' + word + '">' + word + '</button></div>';
    tagLayer.appendChild(el);
    var tag = { el: el, inner: el.firstChild, word: word, lon: spot[0], lat: spot[1], out: true, timer: 0, hover: false, active: false };
    tags.push(tag);
    placeMarker(tag); glitchIn(tag);

    var btn = el.querySelector('.gtag-label');
    function enter() { tag.hover = true; holdTopic(word, tag); }
    function leave() { tag.hover = false; speedTarget = 1; releaseSoon(2200); }
    btn.addEventListener('mouseenter', enter);
    btn.addEventListener('mouseleave', leave);
    btn.addEventListener('focus', enter);
    btn.addEventListener('blur', leave);
    btn.addEventListener('click', function () { holdTopic(word, tag); speedTarget = 1; releaseSoon(6000); });
    return true;
  }
  function removeTag(tag) {
    glitchOut(tag, function () { tag.el.remove(); tags.splice(tags.indexOf(tag), 1); });
  }

  function updateTags(t) {
    if (landedAt && (t - landedAt > SPAWN_WINDOW || spawnTag())) landedAt = 0;
    var block = panelBox();
    tags.forEach(function (tag) {
      var pt = placeMarker(tag);
      if (tag.out) return;
      var held = tag.hover || tag.active;
      if (!held && (pt.z < HORIZON || pt.x > W + 40 || pt.y > H + 40)) removeTag(tag);   // over the horizon
      else if (!held && overlaps(tagFootprint(pt.x, pt.y), block)) removeTag(tag);       // drifted under the text
    });
    resolveOverlaps();
  }

  // Markers never overlap: a tag that runs into the city or another tag glitches out
  // (the newer one first). A hovered tag wins — then the city glitches out until it's clear.
  function resolveOverlaps() {
    var live = tags.filter(function (t) { return !t.out; }), boxes = live.map(boxOf);
    var city = cities[route.phase === 'hold' || !route.switched ? route.i : next(route.i)];
    var cityBox = boxOf(city), cityBlocked = false;
    for (var i = 0; i < live.length; i++) {
      var held = live[i].hover || live[i].active;
      if (overlaps(boxes[i], cityBox)) { if (held) cityBlocked = true; else { removeTag(live[i]); boxes[i] = null; continue; } }
      for (var j = 0; j < i; j++) {
        if (!boxes[j] || !boxes[i] || !overlaps(boxes[i], boxes[j])) continue;
        if (!held) { removeTag(live[i]); boxes[i] = null; }
        else if (!(live[j].hover || live[j].active)) { removeTag(live[j]); boxes[j] = null; }
      }
    }
    if (cityBlocked && !city.blocked) { city.blocked = true; glitchOut(city); }
    else if (!cityBlocked && city.blocked) { city.blocked = false; if (city.shown && cityVisible(cities.indexOf(city))) glitchIn(city); }
  }

  // ---------------------------------------------------------------- loop
  var running = true, last = 0, rafId = 0;
  function frame(t) {
    var dt = last ? Math.min(t - last, 100) : 0;
    speedFactor += (speedTarget - speedFactor) * Math.min(1, dt / (speedTarget > speedFactor ? 450 : 250));
    lambda0 += SPEED * speedFactor * dt / 1000;
    last = t;
    drawGlobe(); stepRoute(t); updateCities(); updateTags(t);
    rafId = running ? requestAnimationFrame(frame) : 0;
  }
  function still() {                                 // reduced motion: first city + three calm tags
    drawGlobe(); updateCities();
    if (!tags.length) { for (var i = 0; i < 3; i++) spawnTag(); }
    tags.forEach(function (t) { placeMarker(t); t.el.classList.remove('is-in'); });
  }
  function start() {
    if (reduceMotion) { still(); return; }
    if (!rafId) { running = true; last = 0; rafId = requestAnimationFrame(frame); }
  }
  function stop() { running = false; }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { e[0].isIntersecting ? start() : stop(); }).observe(canvas);
  }
  function refresh() { layout(); if (reduceMotion || !running) { drawGlobe(); updateCities(); tags.forEach(placeMarker); } }
  window.addEventListener('load', refresh);
  window.addEventListener('resize', refresh);

  layout();
  buildDots(null);
  setCityShown(0, true);
  start();

  if (window.d3 && window.topojson) {                // swap in real land when the data arrives
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json')
      .then(function (r) { return r.json(); })
      .then(function (topo) { buildDots(topojson.feature(topo, topo.objects.land)); if (reduceMotion) still(); })
      .catch(function () { /* keep the dotted sphere */ });
  }
})();
