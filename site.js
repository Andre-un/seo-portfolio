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
// A masking strip erases the nav's baseline rule from the active tab through
// the gap, so the line only ever runs under the still-unselected tabs.
(function () {
  var nav = document.querySelector('.tab-nav') ? document.querySelector('.tab-nav').closest('nav') : null;
  var list = document.querySelector('.tab-nav');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab-nav .tab'));
  if (!nav || !list || !tabs.length) return;

  var mask = document.createElement('div');
  mask.className = 'nav-line-mask';
  nav.appendChild(mask);

  function updateMask() {
    var navRect = nav.getBoundingClientRect();
    var activeTab = list.querySelector('.tab.active');
    if (!activeTab) { mask.style.width = '0'; return; }
    var others = tabs.filter(function (t) { return t !== activeTab; });
    if (!others.length) { mask.style.width = '0'; return; }
    var clusterStart = others[0].getBoundingClientRect().left;
    var activeRect = activeTab.getBoundingClientRect();
    mask.style.left = (activeRect.left - navRect.left) + 'px';
    mask.style.width = Math.max(0, clusterStart - activeRect.left) + 'px';
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function (e) {
      if (tab.classList.contains('active') || reduceMotion) return;
      e.preventDefault();

      var href = tab.getAttribute('href');
      var item = tab.closest('li');

      // FIRST: record every tab's current position.
      var first = tabs.map(function (t) { return t.getBoundingClientRect(); });

      // Move the clicked tab's <li> to the front of the DOM — CSS then
      // pushes it to the true left edge and shoves the rest to the right.
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      list.insertBefore(item, list.firstChild);

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

      updateMask();

      // Let the shift read before actually navigating.
      window.setTimeout(function () { window.location.href = href; }, 380);
    });
  });

  updateMask();
  window.addEventListener('resize', updateMask);
})();
