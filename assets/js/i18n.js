/* به نام خداوند بخشنده مهربان */

/**
 * سیستم چندزبانه (i18n) برای MahdiArts.ir
 * ساخته شده توسط مهدی باغبان‌پور
 */

class I18n {
  constructor() {
    this.currentLanguage = localStorage.getItem('mahdiarts_lang') || 'fa';
    this.fallbacks = { fa: null, en: null };
    try {
      var urlLang = new URL(window.location.href).searchParams.get('lang');
      if (urlLang && typeof urlLang === 'string' && urlLang.length <= 5) {
        this.currentLanguage = urlLang;
        localStorage.setItem('mahdiarts_lang', urlLang);
      }
    } catch (_) {}
    this.translations = {};
    this.rtlLanguages = ['fa', 'ar', 'he'];
    // Ensure DOM is ready before initializing UI-related features
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  /**
   * مقداردهی اولیه سیستم i18n
   */
  async init() {
    await this.loadLanguage(this.currentLanguage);
    await this.loadFallbacks();
    this.applyLanguage();
    this.createLanguageSelector();
    this.updateLanguageSelector();
  }

  /**
   * بارگذاری فایل ترجمه
   */
  async loadLanguage(lang) {
    try {
      const response = await fetch(`assets/i18n/${lang}.json`);
      if (!response.ok) throw new Error('Language file not found');
      this.translations = await response.json();
      this.currentLanguage = lang;
      localStorage.setItem('mahdiarts_lang', lang);
    } catch (error) {
      console.error('Error loading language:', error);
      // Fallback to English if language file not found
      if (lang !== 'en') {
        await this.loadLanguage('en');
      }
    }
  }

  async loadFallbacks() {
    try {
      if (!this.fallbacks.fa) {
        const rfa = await fetch('assets/i18n/fa.json');
        if (rfa.ok) this.fallbacks.fa = await rfa.json();
      }
      if (!this.fallbacks.en) {
        const ren = await fetch('assets/i18n/en.json');
        if (ren.ok) this.fallbacks.en = await ren.json();
      }
    } catch (_) {}
  }

  /**
   * دریافت متن ترجمه شده
   */
  t(key, defaultValue = '') {
    const keys = key.split('.');
    const dig = (obj) => {
      let v = obj;
      for (const k of keys) {
        if (v && typeof v === 'object' && (k in v)) v = v[k]; else return undefined;
      }
      return v;
    };
    let value = dig(this.translations);
    if (value === undefined && this.currentLanguage !== 'fa' && this.fallbacks.fa) value = dig(this.fallbacks.fa);
    if (value === undefined && this.currentLanguage !== 'en' && this.fallbacks.en) value = dig(this.fallbacks.en);
    return (value !== undefined && value !== null) ? value : (defaultValue || key);
  }

  /**
   * اعمال زبان به صفحه
   */
  async applyLanguage() {
    // تغییر جهت متن برای زبان‌های RTL
    const isRTL = this.rtlLanguages.includes(this.currentLanguage);
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', this.currentLanguage);
    document.body.classList.toggle('rtl', isRTL);
    document.body.classList.toggle('ltr', !isRTL);

    // اعمال فونت Vazirmatn برای فارسی
    if (this.currentLanguage === 'fa') {
      document.body.style.fontFamily = 'Vazirmatn, var(--default-font)';
    } else {
      document.body.style.fontFamily = 'var(--default-font)';
    }

    // به‌روزرسانی تمام عناصر با data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);
      if (typeof translation === 'string' && translation.length > 0) {
        if (element.hasAttribute('data-i18n-html')) {
          element.innerHTML = translation;
        } else {
          element.textContent = translation;
        }
      }
    });

    // به‌روزرسانی alt برای تصاویر در صورت وجود data-i18n-alt
    document.querySelectorAll('[data-i18n-alt]').forEach(element => {
      const key = element.getAttribute('data-i18n-alt');
      const translation = this.t(key);
      if (typeof translation === 'string' && translation.length > 0) {
        element.setAttribute('alt', translation);
      }
    });

    // به‌روزرسانی placeholder ها
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      const translation = this.t(key);
      element.placeholder = translation;
    });

    // به‌روزرسانی title و meta description
    document.title = this.t('meta.title');
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', this.t('meta.description'));
    }

    // به‌روزرسانی OG/Twitter meta ها
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', this.t('meta.title'));
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', this.t('meta.description'));
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', this.t('meta.title'));
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', this.t('meta.description'));

    // به‌روزرسانی hreflang
    this.updateHreflang();
  }

  /**
   * تغییر زبان
   */
  async changeLanguage(lang) {
    await this.loadLanguage(lang);
    await this.applyLanguage();
    this.updateLanguageSelector();
    
    // Trigger custom event for other scripts
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: lang } 
    }));
  }

  /**
   * ایجاد منوی انتخاب زبان
   */
  createLanguageSelector() {
    const languages = [
      { code: 'fa', name: 'فارسی', shortName: 'فا', flag: '🇮🇷' },
      { code: 'en', name: 'English', shortName: 'En', flag: '🇬🇧' },
      { code: 'ar', name: 'العربية', shortName: 'Ar', flag: '🇸🇦' },
      { code: 'tr', name: 'Türkçe', shortName: 'Tr', flag: '🇹🇷' },
      { code: 'de', name: 'Deutsch', shortName: 'De', flag: '🇩🇪' },
      { code: 'fr', name: 'Français', shortName: 'Fr', flag: '🇫🇷' },
      { code: 'es', name: 'Español', shortName: 'Es', flag: '🇪🇸' },
      { code: 'ru', name: 'Русский', shortName: 'Ru', flag: '🇷🇺' },
      { code: 'zh', name: '中文', shortName: 'Zh', flag: '🇨🇳' },
      { code: 'it', name: 'Italiano', shortName: 'It', flag: '🇮🇹' }
    ];

    // بررسی وجود منوی زبان
    let langSelector = document.querySelector('.language-selector');
    if (!langSelector) {
      langSelector = document.createElement('div');
      langSelector.className = 'language-selector dropdown';
      
      const currentLang = languages.find(l => l.code === this.currentLanguage);
      
      langSelector.innerHTML = `
        <button class="btn btn-link dropdown-toggle" type="button" id="langDropdown" data-bs-toggle="dropdown" aria-expanded="false">
          <span class="lang-flag">${currentLang ? currentLang.flag : '🌐'}</span>
          <span class="lang-name">${currentLang ? currentLang.shortName : 'Language'}</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="langDropdown">
          ${languages.map(lang => `
            <li>
              <a class="dropdown-item ${lang.code === this.currentLanguage ? 'active' : ''}" href="#" data-lang="${lang.code}">
                <span class="lang-flag">${lang.flag}</span>
                <span class="lang-name">${lang.name}</span>
              </a>
            </li>
          `).join('')}
        </ul>
      `;

      // اضافه کردن به header
      const header = document.querySelector('#header .container');
      if (header) {
        const nav = header.querySelector('.navmenu');
        if (nav && nav.nextElementSibling) {
          header.insertBefore(langSelector, nav.nextElementSibling);
        } else {
          header.appendChild(langSelector);
        }
      }

      // اضافه کردن event listener
      langSelector.querySelectorAll('[data-lang]').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const lang = item.getAttribute('data-lang');
          this.changeLanguage(lang);
        });
      });
    }
  }

  /**
   * به‌روزرسانی منوی انتخاب زبان
   */
  updateLanguageSelector() {
    const languages = [
      { code: 'fa', name: 'فارسی', shortName: 'فا', flag: '🇮🇷' },
      { code: 'en', name: 'English', shortName: 'En', flag: '🇬🇧' },
      { code: 'ar', name: 'العربية', shortName: 'Ar', flag: '🇸🇦' },
      { code: 'tr', name: 'Türkçe', shortName: 'Tr', flag: '🇹🇷' },
      { code: 'de', name: 'Deutsch', shortName: 'De', flag: '🇩🇪' },
      { code: 'fr', name: 'Français', shortName: 'Fr', flag: '🇫🇷' },
      { code: 'es', name: 'Español', shortName: 'Es', flag: '🇪🇸' },
      { code: 'ru', name: 'Русский', shortName: 'Ru', flag: '🇷🇺' },
      { code: 'zh', name: '中文', shortName: 'Zh', flag: '🇨🇳' },
      { code: 'it', name: 'Italiano', shortName: 'It', flag: '🇮🇹' }
    ];

    const langSelector = document.querySelector('.language-selector');
    if (langSelector) {
      const currentLang = languages.find(l => l.code === this.currentLanguage);
      const button = langSelector.querySelector('#langDropdown');
      if (button && currentLang) {
        const flagSpan = button.querySelector('.lang-flag');
        const nameSpan = button.querySelector('.lang-name');
        if (flagSpan) flagSpan.textContent = currentLang.flag;
        if (nameSpan) nameSpan.textContent = currentLang.shortName;
      }

      // Update active state in dropdown menu
      langSelector.querySelectorAll('[data-lang]').forEach(item => {
        if (item.getAttribute('data-lang') === this.currentLanguage) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }
  }

  /**
   * به‌روزرسانی hreflang tags
   */
  updateHreflang() {
    var head = document.getElementsByTagName('head')[0];
    if (!head) return;
    Array.prototype.slice.call(head.querySelectorAll('link[rel="alternate"][hreflang]')).forEach(function(el){ el.parentNode.removeChild(el); });
    var origin = location.origin;
    var path = location.pathname;
    var languages = [
      { code: 'fa' }, { code: 'en' }, { code: 'ar' }, { code: 'tr' }, { code: 'de' },
      { code: 'fr' }, { code: 'es' }, { code: 'ru' }, { code: 'zh' }, { code: 'it' }
    ];
    languages.forEach(function(l){
      var link = document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', l.code);
      link.setAttribute('href', origin + path + '?lang=' + l.code);
      head.appendChild(link);
    });
    var xd = document.createElement('link');
    xd.setAttribute('rel', 'alternate');
    xd.setAttribute('hreflang', 'x-default');
    xd.setAttribute('href', origin + path);
    head.appendChild(xd);
  }
}

// ایجاد instance جهانی
window.i18n = new I18n();

/* ساخته شده توسط مهدی باغبان‌پور */

