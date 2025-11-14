/* به نام خداوند بخشنده مهربان */

/**
* Website: MahdiArts.ir
* Owner: مهدی باغبان‌پور (Mahdi Baghebanpour)
* Updated: 2025
* Developer: مهدی باغبان‌پور
*/

(function() {
  "use strict";

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top')) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }

  document.addEventListener('scroll', toggleScrolled);
  window.addEventListener('load', toggleScrolled);

  /**
   * Mobile nav toggle
   * مدیریت منوی موبایل
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  function mobileNavToogle() {
    document.querySelector('body').classList.toggle('mobile-nav-active');
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
  }
  if (mobileNavToggleBtn) {
    mobileNavToggleBtn.addEventListener('click', mobileNavToogle);
  }

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.mobile-nav-active')) {
        mobileNavToogle();
      }
    });

  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  scrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);

  /**
   * Initiate glightbox
   */
  const glightbox = GLightbox({
    selector: '.glightbox'
  });

  /**
   * Init isotope layout and filters
   */
  document.querySelectorAll('.isotope-layout').forEach(function(isotopeItem) {
    let layout = isotopeItem.getAttribute('data-layout') ?? 'masonry';
    let filter = isotopeItem.getAttribute('data-default-filter') ?? '*';
    let sort = isotopeItem.getAttribute('data-sort') ?? 'original-order';

    let initIsotope;
    imagesLoaded(isotopeItem.querySelector('.isotope-container'), function() {
      initIsotope = new Isotope(isotopeItem.querySelector('.isotope-container'), {
        itemSelector: '.isotope-item',
        layoutMode: layout,
        filter: filter,
        sortBy: sort
      });
    });

    isotopeItem.querySelectorAll('.isotope-filters li').forEach(function(filters) {
      filters.addEventListener('click', function() {
        isotopeItem.querySelector('.isotope-filters .filter-active').classList.remove('filter-active');
        this.classList.add('filter-active');
        initIsotope.arrange({
          filter: this.getAttribute('data-filter')
        });
        if (typeof aosInit === 'function') {
          aosInit();
        }
      }, false);
    });

  });

  /**
   * Frequently Asked Questions Toggle
   */
  document.querySelectorAll('.faq-item h3, .faq-item .faq-toggle, .faq-item .faq-header').forEach((faqItem) => {
    faqItem.addEventListener('click', () => {
      faqItem.parentNode.classList.toggle('faq-active');
    });
  });

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  window.addEventListener("load", initSwiper);

  /**
   * Correct scrolling position upon page load for URLs containing hash links.
   * اصلاح موقعیت اسکرول هنگام بارگذاری صفحه برای URL های حاوی hash
   */
  window.addEventListener('load', function(e) {
    if (window.location.hash) {
      if (document.querySelector(window.location.hash)) {
        setTimeout(() => {
          let section = document.querySelector(window.location.hash);
          let scrollMarginTop = getComputedStyle(section).scrollMarginTop;
          window.scrollTo({
            top: section.offsetTop - parseInt(scrollMarginTop),
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  });

  /**
   * Navmenu Scrollspy
   */
  let navmenulinks = document.querySelectorAll('.navmenu a');

  function navmenuScrollspy() {
    navmenulinks.forEach(navmenulink => {
      if (!navmenulink.hash) return;
      let section = document.querySelector(navmenulink.hash);
      if (!section) return;
      let position = window.scrollY + 200;
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        document.querySelectorAll('.navmenu a.active').forEach(link => link.classList.remove('active'));
        navmenulink.classList.add('active');
      } else {
        navmenulink.classList.remove('active');
      }
    })
  }
  window.addEventListener('load', navmenuScrollspy);
  document.addEventListener('scroll', navmenuScrollspy);

  /**
   * Dynamic copyright year
   */
  window.addEventListener('load', function() {
    var y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  });

  /**
   * Contact form progress bar
   */
  function initFormProgress() {
    var form = document.getElementById('contact-form');
    if (!form) return;
    var bar = form.parentElement.querySelector('.form-progress .progress-bar');
    if (!bar) return;
    var fields = [
      form.querySelector('#name'),
      form.querySelector('#email'),
      form.querySelector('#service-select'),
      form.querySelector('#message')
    ];
    function update() {
      var total = fields.length;
      var filled = fields.reduce(function(sum, el){
        return sum + ((el && String(el.value || '').trim().length) ? 1 : 0);
      }, 0);
      var percent = Math.round((filled / total) * 100);
      bar.style.width = percent + '%';
    }
    fields.forEach(function(el){
      if (el) {
        el.addEventListener('input', update);
        el.addEventListener('change', update);
      }
    });
    update();
  }
  window.addEventListener('load', initFormProgress);

  /**
   * Newsletter form (client-side only)
   */
  function initNewsletter() {
    var form = document.getElementById('newsletter-form');
    var email = document.getElementById('newsletter-email');
    var result = document.querySelector('.newsletter-result');
    if (!form || !email || !result) return;
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var value = String(email.value || '').trim();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if (!ok) {
        result.textContent = (window.i18n ? window.i18n.t('newsletter.invalidEmail') : 'ایمیل معتبر وارد کنید');
        result.style.color = 'red';
        return;
      }
      result.textContent = '';
      var lang = (window.i18n && window.i18n.currentLanguage) ? window.i18n.currentLanguage : 'fa';
      fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, lang: lang })
      }).then(function(res){ return res.json().catch(function(){ return { success:false, error_code:'SERVER_ERROR' }; }); })
      .then(function(data){
        if (data && data.success) {
          result.textContent = (window.i18n ? window.i18n.t('newsletter.success') : 'عضویت شما با موفقیت ثبت شد');
          result.style.color = 'green';
          form.reset();
        } else {
          var codeMap = { NEWSLETTER_INACTIVE: 'inactive', INVALID_EMAIL: 'invalidEmail', UNAUTHORIZED: 'unauthorized', SERVER_ERROR: 'serverError', NETWORK_ERROR: 'networkError' };
          var key = data && data.error_code ? ('newsletter.errors.' + (codeMap[data.error_code] || 'serverError')) : null;
          var msg = key && window.i18n ? window.i18n.t(key) : (data && data.error ? data.error : (window.i18n ? window.i18n.t('contact.form.feedback.serverError') : 'خطای سرور'));
          result.textContent = msg;
          result.style.color = 'red';
        }
      }).catch(function(){
        var msg = (window.i18n ? window.i18n.t('newsletter.errors.networkError') : 'خطا در اتصال');
        result.textContent = msg;
        result.style.color = 'red';
      });
    });
  }
  window.addEventListener('load', initNewsletter);

})();

/* ساخته شده توسط مهدی باغبان‌پور */
