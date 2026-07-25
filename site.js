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

// Secondary nav tabs: default right-justified. Clicking a tab moves it to the
// front of the list (so margin-right:auto — set in CSS via :has() — pushes it
// flush against the left edge) while the rest stay clustered on the right.
// Movement is horizontal only (translateX) — no vertical shift. The "cut off
// from content" line lives on each unselected tab's own border-bottom in CSS,
// so there's no JS masking involved.
(function () {
  var list = document.querySelector('.tab-nav');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab-nav .tab'));
  if (!list || !tabs.length) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function (e) {
      if (tab.classList.contains('active') || reduceMotion) return;
      e.preventDefault();

      var href = tab.getAttribute('href');
      var item = tab.closest('li');

      // FIRST: record every tab's current horizontal position.
      var first = tabs.map(function (t) { return t.getBoundingClientRect().left; });

      // Move the clicked tab's <li> to the front of the DOM — CSS then
      // pushes it to the true left edge and shoves the rest to the right.
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      list.insertBefore(item, list.firstChild);

      // LAST + INVERT + PLAY: offset each tab back to where it used to be
      // on the X axis only, then release so it eases into its new spot.
      tabs.forEach(function (t, i) {
        var dx = first[i] - t.getBoundingClientRect().left;
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
