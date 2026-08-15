/**
 * Déclenche .is-alive au scroll — l’entrée mot à mot est en CSS.
 */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function activate(figure) {
    if (!figure || figure.dataset.illuMotion === '1') return;
    figure.dataset.illuMotion = '1';
    figure.classList.add('is-alive');
  }

  ready(function () {
    var figures = document.querySelectorAll('figure.media-illu');
    if (!figures.length) return;

    if (
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      figures.forEach(activate);
      return;
    }

    if (!('IntersectionObserver' in window)) {
      figures.forEach(activate);
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            activate(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35, rootMargin: '0px 0px -8% 0px' }
    );

    figures.forEach(function (f) {
      io.observe(f);
    });
  });
})();
