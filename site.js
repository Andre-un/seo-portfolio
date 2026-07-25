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
// flush against the left edge) while the rest stay clustered on the right, in
// one fixed global order (matching the order every page's own HTML uses) —
// never just "whatever order they happened to be in" on the page you clicked
// from, so the layout never jumps again once the next page finishes loading.
// Movement is horizontal only (translateX) — no vertical shift.
(function () {
  var list = document.querySelector('.tab-nav');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab-nav .tab'));
  if (!list || !tabs.length) return;

  var canonicalOrder = ['index.html', 'work.html', 'about.html', 'shop.html'];
  function rank(t) {
    var i = canonicalOrder.indexOf(t.getAttribute('href'));
    return i === -1 ? canonicalOrder.length : i;
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function (e) {
      if (tab.classList.contains('active') || reduceMotion) return;
      e.preventDefault();

      var href = tab.getAttribute('href');

      // FIRST: record every tab's current horizontal position.
      var first = tabs.map(function (t) { return t.getBoundingClientRect().left; });

      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');

      // Rebuild the DOM order from scratch: clicked tab first, then the rest
      // sorted by the same fixed sequence every page's own markup follows.
      var sorted = tabs.slice().sort(function (a, b) {
        if (a === tab) return -1;
        if (b === tab) return 1;
        return rank(a) - rank(b);
      });
      sorted.forEach(function (t) { list.appendChild(t.closest('li')); });

      // LAST + INVERT: offset each tab back to where it used to be on the X
      // axis only, then force a single reflow before releasing.
      tabs.forEach(function (t, i) {
        var dx = first[i] - t.getBoundingClientRect().left;
        t.style.transition = 'none';
        t.style.transform = dx ? 'translateX(' + dx + 'px)' : '';
      });
      void list.offsetWidth; // force reflow

      // PLAY: the active tab eases into place immediately; the unselected,
      // now-overlapping tabs settle a beat later each — in the order they
      // land — for a staggered cascade instead of one flat slide.
      var baseTransition = 'color .35s ease,border-color .35s ease,border-width .35s ease';
      var otherIndex = 0;
      sorted.forEach(function (t) {
        if (t === tab) {
          t.style.transition = 'transform .4s cubic-bezier(.4,0,.2,1),' + baseTransition;
        } else {
          var delay = (0.1 + otherIndex * 0.06).toFixed(2);
          t.style.transition = 'transform .4s cubic-bezier(.4,0,.2,1) ' + delay + 's,' + baseTransition;
          otherIndex++;
        }
        t.style.transform = '';
      });

      // Let the cascade read before actually navigating.
      window.setTimeout(function () { window.location.href = href; }, 620);
    });
  });
})();
