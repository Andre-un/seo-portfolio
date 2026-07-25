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

// Toothed tab nav: the tabs keep a fixed order (Home, Work, About, Shop) —
// clicking one only opens a gap after it (margin-right:auto pushes the
// remaining tabs to the right edge), so the active tab reads as pulled
// toward the left without ever swapping places with its neighbours.
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab-nav .tab'));
  if (!tabs.length) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function (e) {
      if (tab.classList.contains('active') || reduceMotion) return;
      e.preventDefault();

      var href = tab.getAttribute('href');

      // FIRST: record every tab's current position.
      var first = tabs.map(function (t) { return t.getBoundingClientRect(); });

      // Swap which tab is active and which one owns the justifying gap —
      // order in the DOM never changes.
      tabs.forEach(function (t) {
        t.classList.remove('active');
        t.closest('li').style.marginRight = '';
      });
      tab.classList.add('active');
      tab.closest('li').style.marginRight = 'auto';

      // LAST + INVERT + PLAY: offset each tab back to where it used to be,
      // then release on the next frame so it eases into its new spot.
      tabs.forEach(function (t, i) {
        var last = t.getBoundingClientRect();
        var dx = first[i].left - last.left;
        if (dx) {
          t.style.transition = 'none';
          t.style.transform = 'translateX(' + dx + 'px)';
          t.getBoundingClientRect(); // force reflow
          t.style.transition = '';
          t.style.transform = '';
        }
      });

      // Let the shift read before actually navigating.
      window.setTimeout(function () { window.location.href = href; }, 380);
    });
  });
})();
