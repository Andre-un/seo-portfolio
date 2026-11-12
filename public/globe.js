// Rotating dotted globe for home-globe.html.
// Big close-up: the sphere's centre sits below-left of the viewport, so only its
// upper-right limb shows, inside the bottom-left quarter of the first screen.
// Land = dots sampled from Natural Earth (world-atlas, via jsDelivr). No build step.
//
// Topic tags (SEO, AEO, GEO, AI, B2B) pop up pinned to the globe with a glitch.
// Hovering (or tapping) one slows the globe down and swaps the entry panel to that
// topic — content lives in .g-topics in home-globe.html.
(function () {
  var canvas = document.getElementById('globe');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');

  var css = getComputedStyle(document.documentElement);
  var INK = (css.getPropertyValue('--ink') || '#1a1a1a').trim();
  var RULE = (css.getPropertyValue('--rule') || '#ddd8d0').trim();
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var DEG = Math.PI / 180;
  var TILT = 4 * DEG;             // latitude at the centre of the view (low = pole sits on the horizon)
  var MAX_LAT = 66;               // nothing is drawn above the Arctic Circle (or below the Antarctic one)
  var SPEED = 6 * DEG;            // degrees of rotation per second at full speed
  var SLOW = 0.3;                 // speed factor while a topic is hovered/open
  var speedFactor = 1, speedTarget = 1;
  var lambda0 = -10 * DEG;        // starting longitude offset

  var W = 0, H = 0, R = 0, CX = 0, CY = 0, DPR = 1;
  var dots = [];                  // [lonRad, latRad]
  // Only one place is shown at a time. A dashed arc "hops" from the current place to the
  // next visible one; the new place appears just before the arc lands, the old one fades.
  // labelLeft: put the label on the left of the marker.
  var places = [
    { name: 'WARSAW', lon: 21.01, lat: 52.23 },
    { name: 'INDIANA, U.S.', lon: -86.16, lat: 39.77 },
    { name: 'BRUSSELS', lon: 4.35, lat: 50.85, labelLeft: true },
    { name: 'RIYADH', lon: 46.68, lat: 24.71 }
  ];

  function isWide() { return W >= 760; }

  function layout() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (isWide()) { R = H * 0.66; CX = W * 0.03; CY = H * 1.14; }
    else { R = Math.min(W * 1.0, H * 0.5); CX = -W * 0.02; CY = H * 1.06; }
  }

  // ---- projection (orthographic, manual for speed) ----
  var sinT = Math.sin(TILT), cosT = Math.cos(TILT);
  function project(lon, lat, out) {
    var l = lon + lambda0, cl = Math.cos(lat);
    out.z = sinT * Math.sin(lat) + cosT * cl * Math.cos(l);
    out.x = CX + R * cl * Math.sin(l);
    out.y = CY - R * (cosT * Math.sin(lat) - sinT * cl * Math.cos(l));
    return out;
  }

  // ---- land mask: rasterise land into an equirectangular bitmap, then sample ----
  function buildDots(land) {
    var mw = 720, mh = 360, mask = null;
    if (land && window.d3 && d3.geoPath) {
      var off = document.createElement('canvas'); off.width = mw; off.height = mh;
      var octx = off.getContext('2d');
      var proj = d3.geoEquirectangular().scale(mw / (2 * Math.PI)).translate([mw / 2, mh / 2]);
      octx.fillStyle = '#000'; octx.beginPath(); d3.geoPath(proj, octx)(land); octx.fill();
      mask = octx.getImageData(0, 0, mw, mh).data;
    }
    var step = mask ? 1.25 : 3.2;  // denser on land; sparse uniform sphere as fallback
    dots = [];
    for (var lat = -MAX_LAT; lat <= MAX_LAT; lat += step) {
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

  var p = { x: 0, y: 0, z: 0 }, q = { x: 0, y: 0, z: 0 };

  function drawLine(points) {          // [[lonRad, latRad], ...]; skips the far side
    var pen = false;
    ctx.beginPath();
    for (var i = 0; i < points.length; i++) {
      project(points[i][0], points[i][1], p);
      if (p.z > 0) { if (pen) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); pen = true; }
      else pen = false;
    }
    ctx.stroke();
  }

  function greatCircle(a, b, n) {      // slerp between two lon/lat points (radians)
    function v(lon, lat) { return [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)]; }
    var A = v(a[0], a[1]), B = v(b[0], b[1]);
    var w = Math.acos(A[0] * B[0] + A[1] * B[1] + A[2] * B[2]), s = Math.sin(w), out = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n, k1 = Math.sin((1 - t) * w) / s, k2 = Math.sin(t * w) / s;
      var x = k1 * A[0] + k2 * B[0], y = k1 * A[1] + k2 * B[1], z = k1 * A[2] + k2 * B[2];
      var lift = 1 + (0.03 + 0.09 * w / Math.PI) * Math.sin(Math.PI * t), len = Math.sqrt(x * x + y * y + z * z);
      out.push([Math.atan2(y, x), Math.asin(z / len), lift]);
    }
    return out;
  }
  // ---- city hops: state machine ----
  var HOLD = 1800, FLY = 1700, LAND = 650, APPEAR_AT = 0.82;   // ms / fraction of the flight
  var ARC_N = 80;
  var hop = { from: 0, to: -1, phase: 'hold', t0: 0, arc: null };
  function ease(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  function placeVisible(i, minZ) {
    project(places[i].lon * DEG, places[i].lat * DEG, q);
    return q.z > minZ && q.x > 10 && q.x < W - 10 && q.y > 10 && q.y < H - 10;
  }
  function pickNext(from) {
    for (var k = 1; k < places.length; k++) {           // keep a fixed order, skip hidden ones
      var i = (from + k) % places.length;
      if (placeVisible(i, 0.3)) return i;
    }
    return -1;
  }
  function updateHop(now) {
    if (hop.phase === 'hold' && now - hop.t0 > HOLD) {
      var nxt = pickNext(hop.from);
      if (nxt >= 0) {
        hop.to = nxt; hop.phase = 'fly'; hop.t0 = now;
        hop.arc = greatCircle([places[hop.from].lon * DEG, places[hop.from].lat * DEG],
                              [places[nxt].lon * DEG, places[nxt].lat * DEG], ARC_N);
      }
    } else if (hop.phase === 'fly' && now - hop.t0 >= FLY) {
      hop.phase = 'land'; hop.t0 = now;
    } else if (hop.phase === 'land' && now - hop.t0 >= LAND) {
      hop.from = hop.to; hop.to = -1; hop.phase = 'hold'; hop.t0 = now; hop.arc = null;
    }
  }
  function arcPoint(f, out) {                           // point at fraction f of the arc
    var x = f * ARC_N, i = Math.min(Math.floor(x), ARC_N - 1), u = x - i, a = hop.arc[i], b = hop.arc[i + 1];
    project(a[0], a[1], p); var ax = CX + (p.x - CX) * a[2], ay = CY + (p.y - CY) * a[2], az = p.z;
    project(b[0], b[1], p); var bx = CX + (p.x - CX) * b[2], by = CY + (p.y - CY) * b[2];
    out.x = ax + (bx - ax) * u; out.y = ay + (by - ay) * u; out.z = az;
    return out;
  }
  function drawArc(f0, f1, t) {                         // dashed arc between two fractions
    if (f1 <= f0) return;
    ctx.setLineDash([4, 4]); ctx.lineDashOffset = -t / 60;   // dashes flow towards the target
    ctx.lineWidth = 1.2; ctx.strokeStyle = INK;
    ctx.beginPath(); var pen = false, steps = Math.max(2, Math.ceil((f1 - f0) * ARC_N)), pt = { x: 0, y: 0, z: 0 };
    for (var s2 = 0; s2 <= steps; s2++) {
      arcPoint(f0 + (f1 - f0) * s2 / steps, pt);
      if (pt.z > 0) { if (pen) ctx.lineTo(pt.x, pt.y); else ctx.moveTo(pt.x, pt.y); pen = true; }
      else pen = false;
    }
    ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
  }
  function drawPlace(i, alpha, t, burst) {
    project(places[i].lon * DEG, places[i].lat * DEG, q);
    if (q.z <= 0.05 || alpha <= 0) return;
    var a = alpha * Math.min(1, q.z * 1.6);
    var pulse = reduceMotion ? 0 : (t / 1600) % 1;
    ctx.globalAlpha = a; ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(q.x, q.y, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = a * (1 - pulse);
    ctx.beginPath(); ctx.arc(q.x, q.y, 4 + pulse * 14, 0, Math.PI * 2); ctx.stroke();
    if (burst > 0 && burst < 1) {                        // landing ring
      ctx.globalAlpha = a * (1 - burst); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(q.x, q.y, 4 + burst * 26, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
    }
    ctx.globalAlpha = a;
    ctx.font = '600 10.5px "Helvetica Neue", Arial, sans-serif';
    if (places[i].labelLeft) { ctx.textAlign = 'right'; ctx.fillText(places[i].name, q.x - 9, q.y - 7); ctx.textAlign = 'left'; }
    else ctx.fillText(places[i].name, q.x + 9, q.y - 7);
    ctx.globalAlpha = 1;
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(240,237,232,.55)'; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = INK; ctx.globalAlpha = .55; ctx.stroke(); ctx.globalAlpha = 1;

    ctx.strokeStyle = RULE; ctx.lineWidth = .8;
    var lon, lat, line;
    for (lon = -180; lon < 180; lon += 15) {
      line = []; for (lat = -MAX_LAT; lat <= MAX_LAT; lat += 3) line.push([lon * DEG, lat * DEG]); drawLine(line);
    }
    for (lat = -60; lat <= 60; lat += 15) {
      line = []; for (lon = -180; lon <= 180; lon += 3) line.push([lon * DEG, lat * DEG]); drawLine(line);
    }

    ctx.fillStyle = INK;
    var r0 = Math.max(1.1, R / 420);
    for (var i = 0; i < dots.length; i++) {
      project(dots[i][0], dots[i][1], p);
      if (p.z <= 0.02 || p.x < -4 || p.y < -4 || p.x > W + 4 || p.y > H + 4) continue;
      ctx.globalAlpha = 0.18 + 0.62 * p.z;
      ctx.beginPath(); ctx.arc(p.x, p.y, r0 * (0.55 + 0.45 * p.z), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // one place at a time, with a hopping arc between them
    if (!reduceMotion) updateHop(t);
    var el = t - hop.t0;
    if (hop.phase === 'hold') {
      drawPlace(hop.from, 1, t, 0);
    } else if (hop.phase === 'fly') {
      var f = ease(Math.min(1, el / FLY));
      drawArc(0, f, t);
      var head = arcPoint(f, { x: 0, y: 0, z: 0 });      // travelling head
      if (head.z > 0) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(head.x, head.y, 2.4, 0, Math.PI * 2); ctx.fill(); }
      var k2 = Math.max(0, (f - APPEAR_AT) / (1 - APPEAR_AT));   // 0→1 over the last part of the flight
      drawPlace(hop.from, 1 - k2, t, 0);
      drawPlace(hop.to, k2, t, k2 > 0 ? k2 * 0.6 : 0);
    } else {                                             // land: tail retracts into the new place
      var g = ease(Math.min(1, el / LAND));
      drawArc(g, 1, t);
      drawPlace(hop.to, 1, t, 0.6 + 0.4 * g);
    }
  }

  // ======================================================================
  // Topic panel: swap the entry box between the default entry and a topic
  // ======================================================================
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
    panel.classList.remove('is-swapping'); void panel.offsetWidth;   // restart glitch
    panel.classList.add('is-swapping');
    panel.innerHTML = html;
    panel.classList.toggle('is-topic', !!topic);
    setTimeout(function () { panel.classList.remove('is-swapping'); }, 420);
  }
  function holdTopic(topic, tag) {
    clearTimeout(restoreTimer);
    tags.forEach(function (t) { t.el.classList.toggle('is-active', t === tag); t.active = (t === tag); });
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
  if (panel) {   // keep the topic open while the reader is in the panel (to click its buttons)
    panel.addEventListener('mouseenter', function () { if (currentTopic) clearTimeout(restoreTimer); });
    panel.addEventListener('mouseleave', function () { if (currentTopic) releaseSoon(1600); });
    panel.addEventListener('focusin', function () { if (currentTopic) clearTimeout(restoreTimer); });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && currentTopic) releaseSoon(0); });
  document.addEventListener('click', function (e) {     // tap outside closes on touch screens
    if (!currentTopic) return;
    if (e.target.closest('.gtag') || e.target.closest('#g-entry')) return;
    releaseSoon(0);
  });

  // ======================================================================
  // Glitchy pop-up tags pinned to the globe
  // ======================================================================
  // One new tag every SPAWN_EVERY ms. A tag never times out: it rides the globe,
  // shrinks as it nears the horizon, and glitches out only once it goes over it.
  // B2B is listed twice on purpose, so it shows up twice as often.
  var WORDS = ['SEO', 'AEO', 'GEO', 'AI', 'B2B', 'B2B'];
  var SPAWN_EVERY = 7000, FIRST_SPAWN = 800;
  var HORIZON = 0.06;                       // z below this = over the horizon
  var tagLayer = document.getElementById('globe-tags');
  var tags = [], nextSpawn = FIRST_SPAWN, deck = [];
  var LABEL_W = 70;

  function nextWord() {                     // shuffled deck so every topic gets its turn
    if (!deck.length) {
      deck = WORDS.slice();
      for (var i = deck.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
    }
    return deck.pop();
  }

  function blockedRect() {                  // the entry panel, in canvas coordinates
    if (!panel || !isWide()) return null;
    var r = panel.getBoundingClientRect(), c = canvas.getBoundingClientRect();
    return { l: r.left - c.left - 16, t: r.top - c.top - 16, r: r.right - c.left + 16, b: r.bottom - c.top + 16 };
  }
  function hitsRect(x, y, b, s) {           // tag = dot at (x,y), label up-right of it
    if (!b) return false;
    s = s || 1;
    var l = x - 6, t = y - 48 * s, r = x + (14 + LABEL_W) * s, bt = y + 6;
    return !(r < b.l || l > b.r || bt < b.t || t > b.b);
  }

  function pickAnchor() {
    // Start on the "near" side (left part of the visible arc), so the tag has
    // the whole trip across the globe before it reaches the horizon.
    var wide = isWide();
    var xMin = 24, xMax = wide ? W * 0.24 : W * 0.4, yMin = H * (wide ? 0.52 : 0.64), yMax = H * 0.84;
    var block = blockedRect();
    for (var tries = 0; tries < 600; tries++) {
      var d = dots[(Math.random() * dots.length) | 0];
      if (!d) break;
      project(d[0], d[1], p);
      if (p.z < 0.5 || p.x < xMin || p.x > xMax || p.y < yMin || p.y > yMax) continue;
      if (hitsRect(p.x, p.y, block)) continue;
      var clash = false;
      for (var i = 0; i < tags.length; i++) {
        project(tags[i].lon, tags[i].lat, q);
        if (Math.abs(q.x - p.x) < 100 && Math.abs(q.y - p.y) < 56) { clash = true; break; }
      }
      if (!clash) return d;
    }
    return null;
  }

  function spawnTag() {
    if (!tagLayer || !dots.length) return false;
    var d = pickAnchor(); if (!d) return false;
    var word = nextWord();

    var el = document.createElement('div');
    el.className = 'gtag is-in';
    el.innerHTML = '<div class="gtag-inner"><span class="gtag-dot"></span><span class="gtag-line"></span>' +
      '<button type="button" class="gtag-label" data-text="' + word + '" aria-label="Show ' + word + '">' + word + '</button></div>';
    tagLayer.appendChild(el);
    var tag = { el: el, inner: el.firstChild, word: word, lon: d[0], lat: d[1], stage: 'in', hover: false, active: false, burstAt: 0 };
    tags.push(tag);
    setTimeout(function () { el.classList.remove('is-in'); }, 520);

    var btn = el.querySelector('.gtag-label');
    function enter() { tag.hover = true; holdTopic(word, tag); }
    function leave() { tag.hover = false; speedTarget = 1; releaseSoon(2200); }   // speed back up right away
    btn.addEventListener('mouseenter', enter);
    btn.addEventListener('mouseleave', leave);
    btn.addEventListener('focus', enter);
    btn.addEventListener('blur', leave);
    btn.addEventListener('click', function () { holdTopic(word, tag); speedTarget = 1; releaseSoon(6000); });  // touch
    return true;
  }

  function goOut(t, now) {
    t.stage = 'out'; t.outAt = now; t.el.classList.add('is-out');
    if (t.active) { t.active = false; }
  }

  function updateTags(now, dt) {
    if (!tagLayer) return;
    if (now >= nextSpawn) {
      // if no good spot right now, try again shortly instead of waiting a full cycle
      nextSpawn = now + (spawnTag() ? SPAWN_EVERY : 1000);
    }
    var block = blockedRect();
    for (var i = tags.length - 1; i >= 0; i--) {
      var t = tags[i];
      project(t.lon, t.lat, q);
      // shrink towards the horizon (foreshortening), full size on the near side
      var s = Math.max(0.3, Math.min(1, (q.z - HORIZON) / 0.45 + 0.3));
      t.el.style.transform = 'translate3d(' + q.x.toFixed(1) + 'px,' + q.y.toFixed(1) + 'px,0)';
      t.inner.style.transform = 'scale(' + s.toFixed(3) + ')';
      // never draw over the entry text (only possible on narrower screens)
      var under = hitsRect(q.x, q.y, block, s);
      if (t.stage === 'in') t.el.style.opacity = under ? 0 : 1;
      if (t.stage === 'in' && !t.hover && t.burstAt === 0 && q.z < 0.3) {   // flicker as it starts to sink
        t.burstAt = now; t.el.classList.add('is-burst');
        (function (el) { setTimeout(function () { el.classList.remove('is-burst'); }, 220); })(t.el);
      }
      var gone = q.z < HORIZON || q.x > W + 40 || q.y > H + 40 || q.y < -40;
      if (t.stage === 'in' && gone) goOut(t, now);
      if (t.stage === 'out' && now - t.outAt > 420) { t.el.remove(); tags.splice(i, 1); }
    }
  }

  // ---- loop: only animate while the hero is on screen ----
  var running = true, last = 0, rafId = 0;
  function frame(t) {
    var dt = last ? Math.min(t - last, 100) : 0;
    speedFactor += (speedTarget - speedFactor) * Math.min(1, dt / (speedTarget > speedFactor ? 450 : 250));   // ease in/out of slow-mo
    lambda0 += SPEED * speedFactor * dt / 1000;
    last = t; draw(t); updateTags(t, dt);
    rafId = running ? requestAnimationFrame(frame) : 0;
  }
  function staticTags() {                    // reduced motion: three calm, still tags
    if (!tagLayer) return;
    tags.forEach(function (t) { t.el.remove(); }); tags = [];
    for (var i = 0; i < 3; i++) spawnTag();
    tags.forEach(function (t) { t.el.classList.remove('is-in'); });
    nextSpawn = Infinity; updateTags(-1, 0);
  }
  function start() {
    if (reduceMotion) { draw(0); staticTags(); return; }
    if (!rafId) { running = true; last = 0; rafId = requestAnimationFrame(frame); }
  }
  function stop() { running = false; }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { e[0].isIntersecting ? start() : stop(); }).observe(canvas);
  }
  window.addEventListener('resize', function () { layout(); if (reduceMotion || !running) { draw(0); updateTags(-1, 0); } });

  layout();
  buildDots(null); start();   // draw immediately with the fallback sphere…

  if (window.d3 && window.topojson) {   // …then swap in real land when the data arrives
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json')
      .then(function (r) { return r.json(); })
      .then(function (topo) { buildDots(topojson.feature(topo, topo.objects.land)); if (reduceMotion) { draw(0); staticTags(); } })
      .catch(function () { /* keep fallback */ });
  }
})();
