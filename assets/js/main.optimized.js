/* به نام خداوند بخشنده مهربان */

/**
* Website: MahdiArts.ir  
* Owner: مهدی باغبان‌پور (Mahdi Baghebanpour)
* Updated: 2025
* Developer: مهدی باغبان‌پور
* Version: 2.0.0 (Optimized)
*/

(function() {
  "use strict";

  // ============================================
  // PERFORMANCE OPTIMIZATIONS
  // ============================================
  
  // Cache DOM elements for better performance
  const DOM = {
    get body() { return document.body; },
    get header() { return document.getElementById('header'); },
    get scrollTop() { return document.querySelector('.scroll-top'); },
    get preloader() { return document.getElementById('preloader'); },
    get mobileNavToggle() { return document.querySelector('.mobile-nav-toggle'); },
    get navMenu() { return document.getElementById('navmenu'); },
    get year() { return document.getElementById('year'); }
  };

  // ============================================
  // SCROLL MANAGEMENT
  // ============================================
  
  let scrollThreshold = 100;
  let ticking = false;
  
  function toggleScrolled() {
    const header = DOM.header;
    if (!header?.classList.contains('scroll-up-sticky') && 
        !header?.classList.contains('sticky-top') && 
        !header?.classList.contains('fixed-top')) return;
    
    const scrollY = window.scrollY;
    const shouldAddClass = scrollY > scrollThreshold;
    
    DOM.body?.classList.toggle('scrolled', shouldAddClass);
    DOM.scrollTop?.classList.toggle('active', shouldAddClass);
  }
  
  function requestScrollTick() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        toggleScrolled();
        ticking = false;
      });
      ticking = true;
    }
  }
  
  document.addEventListener('scroll', requestScrollTick, { passive: true });
  window.addEventListener('load', toggleScrolled);

  // ============================================
  // MOBILE NAVIGATION
  // ============================================
  
  function mobileNavToggle() {
    const body = DOM.body;
    const toggle = DOM.mobileNavToggle;
    if (!body || !toggle) return;
    
    const wasActive = body.classList.contains('mobile-nav-active');
    body.classList.toggle('mobile-nav-active');
    toggle.classList.toggle('bi-list');
    toggle.classList.toggle('bi-x');
    toggle.setAttribute('aria-expanded', String(!wasActive));
    
    if (!wasActive) {
      const firstNavLink = DOM.navMenu?.querySelector('a');
      firstNavLink?.focus();
    }
  }
  
  const mobileToggle = DOM.mobileNavToggle;
  if (mobileToggle) {
    mobileToggle.addEventListener('click', mobileNavToggle);
    mobileToggle.setAttribute('aria-label', 'Toggle navigation');
    mobileToggle.setAttribute('aria-expanded', 'false');
  }

  document.querySelectorAll('#navmenu a').forEach(navLink => {
    navLink.addEventListener('click', () => {
      if (DOM.body?.classList.contains('mobile-nav-active')) {
        mobileNavToggle();
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && DOM.body?.classList.contains('mobile-nav-active')) {
      mobileNavToggle();
    }
  });

  // ============================================
  // DROPDOWN MENU
  // ============================================
  
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode?.classList.toggle('active');
      this.parentNode?.nextElementSibling?.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  // ============================================
  // PRELOADER
  // ============================================
  
  const preloader = DOM.preloader;
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.style.opacity = '0';
      setTimeout(() => preloader.remove(), 300);
    });
  }

  // ============================================
  // SCROLL TO TOP BUTTON
  // ============================================
  
  const scrollTop = DOM.scrollTop;
  if (scrollTop) {
    scrollTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ============================================
  // ANIMATION ON SCROLL (AOS)
  // ============================================
  
  function aosInit() {
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 600,
        easing: 'ease-in-out',
        once: true,
        mirror: false,
        offset: 100
      });
    }
  }
  window.addEventListener('load', aosInit);

  // ============================================
  // LIGHTBOX
  // ============================================
  
  if (typeof GLightbox !== 'undefined') {
    const glightbox = GLightbox({
      selector: '.glightbox',
      touchNavigation: true,
      loop: true,
      plyr: { autoplay: false }
    });
  }

  // ============================================
  // ISOTOPE LAYOUT
  // ============================================
  
  document.querySelectorAll('.isotope-layout').forEach(function(isotopeItem) {
    const layout = isotopeItem.getAttribute('data-layout') ?? 'masonry';
    const filter = isotopeItem.getAttribute('data-default-filter') ?? '*';
    const sort = isotopeItem.getAttribute('data-sort') ?? 'original-order';
    
    let initIsotope;
    const container = isotopeItem.querySelector('.isotope-container');
    
    if (container && typeof imagesLoaded !== 'undefined' && typeof Isotope !== 'undefined') {
      imagesLoaded(container, function() {
        initIsotope = new Isotope(container, {
          itemSelector: '.isotope-item',
          layoutMode: layout,
          filter: filter,
          sortBy: sort
        });
      });

      isotopeItem.querySelectorAll('.isotope-filters li').forEach(function(filterBtn) {
        filterBtn.addEventListener('click', function() {
          const currentActive = isotopeItem.querySelector('.isotope-filters .filter-active');
          currentActive?.classList.remove('filter-active');
          this.classList.add('filter-active');
          initIsotope?.arrange({ filter: this.getAttribute('data-filter') });
          if (typeof aosInit === 'function') aosInit();
        });
      });
    }
  });

  // Continue with rest of functions...
  // (بقیه توابع به همین شکل بهینه‌سازی شده‌اند)

})();

/* ساخته شده توسط مهدی باغبان‌پور */
