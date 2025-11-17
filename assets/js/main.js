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

  document.addEventListener('scroll', toggleScrolled, { passive: true });
  window.addEventListener('load', toggleScrolled);

  /**
   * Mobile nav toggle
   * مدیریت منوی موبایل
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  function mobileNavToogle() {
    var body = document.querySelector('body');
    var wasActive = body.classList.contains('mobile-nav-active');
    body.classList.toggle('mobile-nav-active');
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
    mobileNavToggleBtn.setAttribute('aria-expanded', String(!wasActive));
    if (!wasActive) {
      var first = document.querySelector('#navmenu a');
      if (first) first.focus();
    }
  }
  if (mobileNavToggleBtn) {
    mobileNavToggleBtn.addEventListener('click', mobileNavToogle);
    mobileNavToggleBtn.setAttribute('aria-label', 'Toggle navigation');
    mobileNavToggleBtn.setAttribute('aria-expanded', 'false');
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

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && document.body.classList.contains('mobile-nav-active')) {
      mobileNavToogle();
    }
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
  document.addEventListener('scroll', toggleScrollTop, { passive: true });

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
    selector: '.glightbox',
    touchNavigation: true,
    loop: true,
    plyr: {
      autoplay: false
    }
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

  function initFaqAccordion() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.faq-accordion .faq-item'));
    var current = null;
    function typewrite(el, text, cps) {
      var speed = Math.max(50, Math.min(70, cps || 60));
      var i = 0;
      el.textContent = '';
      if (el._tw) clearInterval(el._tw);
      el._tw = setInterval(function () {
        if (i >= text.length) { clearInterval(el._tw); return; }
        el.textContent += text.charAt(i++);
      }, Math.round(1000 / speed));
    }
    items.forEach(function (item) {
      var header = item.querySelector('.faq-header');
      var content = item.querySelector('.faq-content');
      var p = content ? content.querySelector('p') : null;
      if (!header || !p) return;
      var full = p.getAttribute('data-full');
      if (!full) { p.setAttribute('data-full', p.textContent); full = p.textContent; }
      header.setAttribute('role', 'button');
      header.setAttribute('tabindex', '0');
      function open() {
        if (current && current !== item) {
          current.classList.remove('faq-active');
          var prevP = current.querySelector('.faq-content p');
          if (prevP) {
            if (prevP._tw) clearInterval(prevP._tw);
            var prevFull = prevP.getAttribute('data-full') || prevP.textContent;
            prevP.textContent = prevFull;
          }
        }
        item.classList.add('faq-active');
        typewrite(p, full, 60);
        current = item;
      }
      function close() {
        item.classList.remove('faq-active');
        if (p._tw) clearInterval(p._tw);
        p.textContent = full;
        if (current === item) current = null;
      }
      header.addEventListener('click', function () {
        if (item.classList.contains('faq-active')) close(); else open();
      }, { passive: true });
      header.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (item.classList.contains('faq-active')) close(); else open(); }
      });
    });
  }
  window.addEventListener('load', initFaqAccordion);

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
  document.addEventListener('scroll', navmenuScrollspy, { passive: true });

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
          var successMap = { NEWSLETTER_SUBSCRIBED: 'newsletter.success.subscribed', NEWSLETTER_UNSUBSCRIBED: 'newsletter.success.unsubscribed', NEWSLETTER_PUBLISHED: 'newsletter.success.published' };
          var sKey = (data && data.message_code && successMap[data.message_code]) ? successMap[data.message_code] : 'newsletter.success';
          result.textContent = (window.i18n ? window.i18n.t(sKey) : 'عضویت شما با موفقیت ثبت شد');
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

  function initAboutLazyImages() {
    var images = document.querySelectorAll('.about .about-images img');
    images.forEach(function(img){
      if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
      if (!img.getAttribute('decoding')) img.setAttribute('decoding', 'async');
    });
  }
  window.addEventListener('load', initAboutLazyImages);

  function initAboutReadMore() {
    var btn = document.querySelector('.about .content .read-more-toggle');
    var text = document.querySelector('.about .content .more-text');
    if (!btn || !text) return;
    var t = (window.i18n && typeof window.i18n.t === 'function') ? window.i18n.t.bind(window.i18n) : null;
    var expandText = t ? t('about.readMoreExpand', 'مطالعه بیشتر') : 'مطالعه بیشتر';
    var collapseText = t ? t('about.readMoreCollapse', 'کمتر') : 'کمتر';
    btn.textContent = expandText;
    btn.addEventListener('click', function(){
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      text.classList.toggle('collapsed');
      btn.textContent = expanded ? expandText : collapseText;
    }, { passive: true });
  }
  window.addEventListener('load', initAboutReadMore);

  function animateScrollTo(y, duration) {
    var start = window.pageYOffset;
    var diff = y - start;
    var startTime;
    function ease(t){ return t<0.5 ? 2*t*t : -1+(4-2*t)*t; }
    function step(ts){
      if (!startTime) startTime = ts;
      var t = Math.min(1, (ts - startTime) / duration);
      window.scrollTo(0, start + diff * ease(t));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initHeroCTA() {
    var btn = document.querySelector('.cta-scroll');
    if (!btn) return;
    btn.addEventListener('click', function(e){
      e.preventDefault();
      var target = document.querySelector('#about .who-we-are') || document.querySelector('#about');
      if (!target) return;
      var header = document.querySelector('#header');
      var offset = header ? header.offsetHeight : 0;
      var y = target.getBoundingClientRect().top + window.pageYOffset - offset;
      animateScrollTo(y, 500);
    });
  }
  window.addEventListener('load', initHeroCTA);

  function typewrite(el, text, cps) {
    var speed = Math.max(50, Math.min(70, cps||60));
    var i = 0;
    el.textContent = '';
    if (el._tw) { clearInterval(el._tw); }
    el._tw = setInterval(function(){
      if (i >= text.length) { clearInterval(el._tw); return; }
      el.textContent += text.charAt(i++);
    }, Math.round(1000/speed));
  }

  function initProcessExpand() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.how-we-work .process-item'));
    var current;
    items.forEach(function(item){
      var content = item.querySelector('.content');
      var summary = item.querySelector('.step-summary');
      var detail = item.querySelector('.step-detail');
      if (!content || !summary || !detail) return;
      content.setAttribute('role','button');
      content.setAttribute('tabindex','0');
      function expand(){
        if (current && current !== item) {
          current.classList.remove('expanded');
          var cd = current.querySelector('.step-detail');
          if (cd) cd.textContent = cd.textContent;
          current.querySelector('.content').setAttribute('aria-expanded','false');
        }
        item.classList.add('expanded');
        content.setAttribute('aria-expanded','true');
        var key = detail.getAttribute('data-i18n');
        var txt = (window.i18n && key) ? window.i18n.t(key, detail.textContent) : detail.textContent;
        typewrite(detail, txt, 60);
        current = item;
      }
      function collapse(){
        item.classList.remove('expanded');
        content.setAttribute('aria-expanded','false');
        detail.textContent = detail.textContent;
        if (current === item) current = null;
      }
      content.addEventListener('click', function(){
        if (item.classList.contains('expanded')) collapse(); else expand();
      });
      content.addEventListener('keydown', function(e){
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (item.classList.contains('expanded')) collapse(); else expand(); }
      });
    });
  }
  window.addEventListener('load', initProcessExpand);

})();

/* ساخته شده توسط مهدی باغبان‌پور */
