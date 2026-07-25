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
// tab only swaps which tab has the .active class — the ink outline itself
// (a ::before pseudo-element sized to sit exactly on top of the tab's own
// resting border, see style.css) clip-path-animates in around the newly
// active tab. Navigation is delayed just long enough for that to finish
// reading before the next page loads.
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab-nav .tab'));
  if (!tabs.length) return;

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
