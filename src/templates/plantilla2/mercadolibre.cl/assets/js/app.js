/* ============================================================
   app.js — MercadoLibre CL — Migrador #1
   Lógica de navegación: carrusel + menú categorías
   ============================================================ */
(function () {
  'use strict';

  /* ── Carousel ────────────────────────────────────────────── */
  function initCarousels() {
    document.querySelectorAll('[data-andes-carousel-snapped-main="true"]').forEach(function (container) {
      var wrapper = container.querySelector('.andes-carousel-snapped__wrapper');
      if (!wrapper) return;

      var slides = wrapper.querySelectorAll('.andes-carousel-snapped__slide');
      if (slides.length < 2) return;

      var current = 0;
      var total = slides.length;
      var autoTimer = null;

      function goTo(index) {
        current = (index + total) % total;
        var offset = -current * 100;
        wrapper.style.transform = 'translateX(' + offset + '%)';
        updatePagination(container, current);
        updateControls(container, current, total);
      }

      function startAuto() {
        stopAuto();
        autoTimer = setInterval(function () { goTo(current + 1); }, 5000);
      }

      function stopAuto() {
        if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
      }

      /* Prev/Next controls */
      var prevBtn = container.querySelector('[data-andes-carousel-snapped-control="previous"]');
      var nextBtn = container.querySelector('[data-andes-carousel-snapped-control="next"]');

      if (prevBtn) prevBtn.addEventListener('click', function () { stopAuto(); goTo(current - 1); startAuto(); });
      if (nextBtn) nextBtn.addEventListener('click', function () { stopAuto(); goTo(current + 1); startAuto(); });

      /* Pause on hover */
      container.addEventListener('mouseenter', stopAuto);
      container.addEventListener('mouseleave', startAuto);

      /* Pagination dots */
      container.querySelectorAll('[data-andes-carousel-snapped-pagination-action="true"]').forEach(function (dot, idx) {
        dot.addEventListener('click', function () { stopAuto(); goTo(idx); startAuto(); });
      });

      /* Touch/swipe */
      var touchStartX = 0;
      wrapper.addEventListener('touchstart', function (e) { touchStartX = e.touches[0].clientX; }, { passive: true });
      wrapper.addEventListener('touchend', function (e) {
        var diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) { stopAuto(); goTo(diff > 0 ? current + 1 : current - 1); startAuto(); }
      }, { passive: true });

      goTo(0);
      startAuto();
    });
  }

  function updatePagination(container, current) {
    container.querySelectorAll('[data-andes-carousel-snapped-pagination-item="true"]').forEach(function (item, idx) {
      item.dataset.andesCarouselSnappedPaginationItemActive = (idx === current).toString();
    });
  }

  function updateControls(container, current, total) {
    var strict = container.classList.contains('andes-carousel-snapped__container--strict-boundaries');
    if (!strict) return;
    var prevBtn = container.querySelector('[data-andes-carousel-snapped-control="previous"]');
    var nextBtn = container.querySelector('[data-andes-carousel-snapped-control="next"]');
    if (prevBtn) prevBtn.disabled = (current === 0);
    if (nextBtn) nextBtn.disabled = (current === total - 1);
  }

  /* ── Categories dropdown ─────────────────────────────────── */
  function initCategories() {
    var trigger = document.querySelector('[data-js="nav-menu-categories-trigger"]');
    var panel   = document.querySelector('[data-js="nav-categs"]');
    if (!trigger || !panel) return;

    function open() {
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
    }
    function close() {
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    }

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      panel.hidden ? open() : close();
    });

    /* Close when clicking outside */
    document.addEventListener('click', function (e) {
      if (!trigger.contains(e.target) && !panel.contains(e.target)) close();
    });

    /* Keyboard: Escape */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* ── Nav link tag badges ─────────────────────────────────── */
  function initNavBadges() {
    /* already rendered in HTML — nothing to do */
  }

  /* ── Cookie banner dismiss ───────────────────────────────── */
  function initCookieBanner() {
    var banner = document.querySelector('.cookie-consent-banner-opt-out');
    if (!banner) return;
    var acceptBtn = banner.querySelector('[data-testid="action:understood-button"]');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', function () {
        banner.style.display = 'none';
      });
    }
    var customizeBtn = banner.querySelector('[data-testid="action:customize-button"]');
    if (customizeBtn) {
      customizeBtn.addEventListener('click', function () {
        banner.style.display = 'none';
      });
    }
  }

  /* ── Init ────────────────────────────────────────────────── */
  function init() {
    initCarousels();
    initCategories();
    initNavBadges();
    initCookieBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
