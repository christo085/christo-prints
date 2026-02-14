// Mobile navigation — slide animation, overlay, scroll-close
(function () {
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (!toggle || !links) return;

  // Create overlay
  var overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  document.body.appendChild(overlay);

  var menuItems = links.querySelectorAll('li');
  var isOpen = false;
  var scrollStart = 0;

  function openMenu() {
    isOpen = true;
    links.classList.add('open');
    overlay.classList.add('visible');
    toggle.textContent = '\u2715';
    scrollStart = window.scrollY;
    document.body.style.overflow = 'hidden';

    // Stagger fade-in
    menuItems.forEach(function (li, i) {
      li.style.transitionDelay = (i * 0.04) + 's';
      li.classList.add('nav-item-visible');
    });
  }

  function closeMenu() {
    if (!isOpen) return;
    isOpen = false;
    links.classList.remove('open');
    overlay.classList.remove('visible');
    toggle.textContent = '\u2630';
    document.body.style.overflow = '';

    menuItems.forEach(function (li) {
      li.classList.remove('nav-item-visible');
      li.style.transitionDelay = '0s';
    });
  }

  toggle.addEventListener('click', function () {
    isOpen ? closeMenu() : openMenu();
  });

  overlay.addEventListener('click', closeMenu);

  // Close on link click
  links.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  // Close on scroll (50px threshold)
  window.addEventListener('scroll', function () {
    if (isOpen && Math.abs(window.scrollY - scrollStart) > 50) {
      closeMenu();
    }
  }, { passive: true });
})();
