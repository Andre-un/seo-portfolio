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
// the .active class, and CSS transitions the border color/width so the single
// continuous ink line appears to lift up and wrap around the newly active
// tab instead of the tab travelling to the line. Navigation is delayed just
// long enough for that line transition to read before the next page loads.
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

      // Let the line finish redrawing around the new tab before navigating.
      window.setTimeout(function () { window.location.href = href; }, 380);
    });
  });
})();
