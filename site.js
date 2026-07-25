// Shared behaviour across all pages of The SEO Dictionary

// Keep footer copyright year current automatically.
document.querySelectorAll('#cur-year').forEach(function (el) {
  el.textContent = new Date().getFullYear();
});

// Make [data-def] tooltips usable on touch devices (hover doesn't exist there).
document.querySelectorAll('[data-def]').forEach(function (el) {
  el.setAttribute('tabindex', '0');
  el.addEventListener('click', function (e) {
    if (window.matchMedia('(hover: none)').matches) {
      e.stopPropagation();
      var wasOpen = el.classList.contains('tapped');
      document.querySelectorAll('[data-def].tapped').forEach(function (o) { o.classList.remove('tapped'); });
      if (!wasOpen) el.classList.add('tapped');
    }
  });
});
document.addEventListener('click', function () {
  document.querySelectorAll('[data-def].tapped').forEach(function (o) { o.classList.remove('tapped'); });
});

// Secondary nav tabs: fixed, evenly-split columns that never move. Clicking a
// tab does not reorder or translate anything — it only swaps which tab has
// the .active class. Each tab gets 4 injected "stroke" spans (see .tab-stroke
// rules in style.css) that progressively draw the ink outline around the
// newly active tab — up both sides from the baseline, then sweeping across
// the top to meet in the middle — instead of the border just fading in.
// Navigation is delayed just long enough for that draw-in to finish reading
// before the next page loads.
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab-nav .tab'));
  if (!tabs.length) return;

  // Inject the stroke spans once, up front, so they're already in their
  // resting (undrawn) state before any click — this is what makes the
  // outline animate in on click rather than just appearing.
  tabs.forEach(function (tab) {
    ['l', 'r', 'tl', 'tr'].forEach(function (pos) {
      var s = document.createElement('span');
      s.className = 'tab-stroke tab-stroke-' + pos;
      tab.appendChild(s);
    });
  });

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function (e) {
      if (tab.classList.contains('active') || reduceMotion) return;
      e.preventDefault();

      var href = tab.getAttribute('href');

      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');

      // Let the outline finish drawing around the new tab before navigating.
      window.setTimeout(function () { window.location.href = href; }, 460);
    });
  });
})();
