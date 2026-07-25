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

// Secondary nav tabs: fixed, evenly-split columns that never move. A single
// shared .tab-indicator element (see style.css) slides between columns via
// one CSS transform driven by the --i custom property on .tab-nav — clicking
// a tab just updates --i and swaps .active (for text colour + hiding that
// tab's own grey border so the indicator's ink border shows through).
// Navigation is delayed just long enough for the slide to finish before the
// next page loads.
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab-nav .tab'));
  var tabNav = document.querySelector('.tab-nav');
  if (!tabs.length || !tabNav) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function (e) {
      if (tab.classList.contains('active') || reduceMotion) return;
      e.preventDefault();

      var href = tab.getAttribute('href');

      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      tabNav.style.setProperty('--i', index);

      // Let the indicator finish sliding into place before navigating.
      window.setTimeout(function () { window.location.href = href; }, 420);
    });
  });
})();
