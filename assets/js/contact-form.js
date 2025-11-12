/* به نام خداوند بخشنده مهربان */

/**
 * مدیریت فرم تماس با ما
 * ساخته شده توسط مهدی باغبان‌پور
 */

(function() {
  'use strict';

  // Helper translator
  const t = (key, def = '') => (window.i18n && typeof window.i18n.t === 'function') ? window.i18n.t(key, def) : (def || key);

  // مدیریت انتخاب پلن از دکمه‌های pricing
  document.querySelectorAll('.select-plan-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const plan = this.getAttribute('data-plan');
      localStorage.setItem('selectedPlan', plan);
      
      // اسکرول به فرم تماس
      const contactSection = document.querySelector('#contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
        
        // انتخاب پلن در فرم
        setTimeout(() => {
          const serviceSelect = document.querySelector('#service-select');
          if (serviceSelect) {
            serviceSelect.value = plan;
            serviceSelect.dispatchEvent(new Event('change'));
          }
        }, 500);
      }
    });
  });

  /**
   * اعتبارسنجی فایل در سمت کلاینت
   */
  function validateFile(file) {
    if (!file) return { isValid: true, errors: [] };
    
    const errors = [];
    
    // انواع فایل مجاز
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/wave'
    ];
    
    // پسوندهای مجاز
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.txt', '.doc', '.docx', '.mp3', '.wav'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    // بررسی نوع فایل
    const isValidType = allowedTypes.includes(file.type.toLowerCase()) || 
                        allowedExtensions.includes(fileExtension);
    
    if (!isValidType) {
      errors.push(t('contact.form.errors.fileType'));
    }
    
    // بررسی حجم فایل (حداکثر 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      errors.push(t('contact.form.errors.fileSize'));
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * تبدیل فایل به base64
   */
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // حذف prefix data:type/subtype;base64, از نتیجه
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * اعتبارسنجی فرم در سمت کلاینت
   */
  function validateForm(name, email, whatsapp, plan, message, files) {
    const errors = [];
    
    // اعتبارسنجی نام
    if (!name || name.trim().length < 2) {
      errors.push(t('contact.form.errors.nameMin'));
    } else if (name.trim().length > 100) {
      errors.push(t('contact.form.errors.nameMax'));
    }
    
    // اعتبارسنجی ایمیل
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      errors.push(t('contact.form.errors.emailInvalid'));
    }
    
    // اعتبارسنجی واتساپ (اختیاری اما اگر وارد شده باشد باید معتبر باشد)
    if (whatsapp && whatsapp.trim().length > 0) {
      const whatsappRegex = /^[\d\s\-\+\(\)]+$/;
      const digitsOnly = whatsapp.replace(/\D/g, '');
      if (!whatsappRegex.test(whatsapp.trim()) || digitsOnly.length < 10) {
        errors.push(t('contact.form.errors.whatsappInvalid'));
      }
    }
    
    // اعتبارسنجی انتخاب پلن
    const validPlans = ['basic', 'professional', 'enterprise'];
    if (!plan || plan.trim() === '' || !validPlans.includes(plan.trim())) {
      errors.push(t('contact.form.errors.planInvalid'));
    }
    
    // اعتبارسنجی پیام
    if (!message || message.trim().length < 10) {
      errors.push(t('contact.form.errors.messageMin'));
    } else if (message.trim().length > 5000) {
      errors.push(t('contact.form.errors.messageMax'));
    }
    
    // اعتبارسنجی فایل‌ها
    const MAX_FILES = 5;
    if (Array.isArray(files)) {
      if (files.length > MAX_FILES) {
        errors.push(t('contact.form.errors.maxFiles'));
      }
      files.forEach(f => {
        const v = validateFile(f);
        if (!v.isValid) {
          errors.push(`«${f.name}»: ${v.errors.join(' | ')}`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // مدیریت فرم تماس
  // حالت انتخاب فایل‌ها در UI
  const selectedFiles = [];
  // پیگیری پیشرفت هر فایل با WeakMap (کلید = شیء فایل)
  const fileProgress = new WeakMap();

  function updateFileProgress(file, percent) {
    const safePercent = Math.min(100, Math.max(0, Math.round(percent)));
    fileProgress.set(file, safePercent);
    // به‌روزرسانی UI بدون بازساخت کامل لیست
    const listEl = document.getElementById('file-list');
    if (!listEl) return;
    const items = listEl.querySelectorAll('[data-file-name]');
    items.forEach(el => {
      const name = el.getAttribute('data-file-name');
      if (name === file.name) {
        const bar = el.querySelector('.progress-bar');
        if (bar) {
          bar.style.width = safePercent + '%';
          bar.setAttribute('aria-valuenow', safePercent);
          bar.textContent = safePercent + '%';
        }
      }
    });
  }

  function renderFileList() {
    const listEl = document.getElementById('file-list');
    const errorEl = document.getElementById('file-error');
    if (!listEl) return;
    listEl.innerHTML = '';
    if (selectedFiles.length === 0) {
      errorEl && (errorEl.style.display = 'none');
      return;
    }
    const fragment = document.createDocumentFragment();
    selectedFiles.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'file-item border rounded p-2 mb-2';
      item.setAttribute('data-file-name', file.name);

      const rowTop = document.createElement('div');
      rowTop.className = 'd-flex align-items-center justify-content-between';

      const info = document.createElement('div');
      info.className = 'd-flex align-items-center gap-2';
      if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        img.style.width = '40px';
        img.style.height = '40px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '4px';
        info.appendChild(img);
      }
      const text = document.createElement('div');
      const sizeKB = Math.round(file.size / 1024);
      text.textContent = `${file.name} — ${sizeKB} KB`;
      info.appendChild(text);
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-sm btn-outline-danger';
      removeBtn.textContent = t('contact.form.uploader.remove');
      removeBtn.addEventListener('click', () => {
        selectedFiles.splice(index, 1);
        renderFileList();
      });
      rowTop.appendChild(info);
      rowTop.appendChild(removeBtn);

      const progressWrap = document.createElement('div');
      progressWrap.className = 'progress mt-2';
      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      const current = fileProgress.get(file) || 0;
      progressBar.style.width = current + '%';
      progressBar.setAttribute('role', 'progressbar');
      progressBar.setAttribute('aria-valuemin', '0');
      progressBar.setAttribute('aria-valuemax', '100');
      progressBar.setAttribute('aria-valuenow', String(current));
      progressBar.textContent = current + '%';
      progressWrap.appendChild(progressBar);

      item.appendChild(rowTop);
      item.appendChild(progressWrap);
      fragment.appendChild(item);
    });
    listEl.appendChild(fragment);
  }

  function addFiles(files) {
    const errorEl = document.getElementById('file-error');
    const MAX_FILES = 5;
    const errors = [];
    const incoming = Array.from(files);
    for (const f of incoming) {
      if (selectedFiles.length >= MAX_FILES) {
        errors.push(t('contact.errors.maxFiles'));
        break;
      }
      const v = validateFile(f);
      if (!v.isValid) {
        errors.push(`«${f.name}»: ${v.errors.join(' | ')}`);
        continue;
      }
      selectedFiles.push(f);
      fileProgress.set(f, 0);
    }
    if (errors.length > 0 && errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent = errors.join(' | ');
    } else if (errorEl) {
      errorEl.style.display = 'none';
      errorEl.textContent = '';
    }
    renderFileList();
  }

  // اتصال رویداد‌ها برای درگ‌ودرآپ و انتخاب فایل
  window.addEventListener('load', () => {
    const dropZone = document.getElementById('file-drop-zone');
    const inputEl = document.getElementById('attachments');
    const selectBtn = document.getElementById('file-select-btn');
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true; // فعال‌سازی پس از کپچا
    }
    if (selectBtn && inputEl) {
      selectBtn.addEventListener('click', () => inputEl.click());
    }
    if (dropZone) {
      ['dragenter','dragover'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.add('dragging');
        });
      });
      ['dragleave','drop'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.remove('dragging');
        });
      });
      dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt && dt.files) {
          addFiles(dt.files);
        }
      });
    }
    if (inputEl) {
      inputEl.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files && files.length) {
          addFiles(files);
          inputEl.value = '';
        }
      });
    }
  });

  // سوییچ پویا Site Key کپچا بر اساس دامنه (لوکال/تولید)
  function getTurnstileSiteKey(defaultKey) {
    const host = location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    // Site Key تست Cloudflare برای توسعه محلی
    const testKey = '1x00000000000000000000AA';
    return isLocal ? testKey : (defaultKey || testKey);
  }

  // بارگذاری پویا اسکریپت Turnstile با auto-render
  function loadTurnstileScript() {
    return new Promise((resolve, reject) => {
      if (window.turnstile) return resolve();
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=auto';
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
  }

  // تلاش برای رندر صریح در صورت عدم رندر خودکار
  function ensureTurnstileRendered(widget, options) {
    try {
      const alreadyRendered = widget.dataset.rendered === 'true' || widget.querySelector('iframe');
      if (alreadyRendered) return;
      if (window.turnstile && typeof window.turnstile.render === 'function') {
        widget.innerHTML = '';
        window.turnstile.render(widget, options);
        widget.dataset.rendered = 'true';
      }
    } catch (e) {
      console.error('Turnstile fallback render error:', e);
    }
  }

  window.addEventListener('load', () => {
    const widget = document.querySelector('.cf-turnstile');
    if (!widget) return;
    const currentKey = widget.getAttribute('data-sitekey');
    const desiredKey = getTurnstileSiteKey(currentKey);
    const theme = widget.getAttribute('data-theme') || 'auto';
    const language = widget.getAttribute('data-language') || 'fa';
    // ابتدا Site Key صحیح را روی مارک‌آپ ست می‌کنیم و سپس اسکریپت را بارگذاری/رندر می‌کنیم
    widget.setAttribute('data-sitekey', desiredKey);
    loadTurnstileScript()
      .then(() => {
        // اگر auto-render انجام نشده، fallback به رندر صریح
        const options = {
          sitekey: desiredKey,
          theme: theme,
          language: language,
          callback: window.onTurnstileSuccess,
          'error-callback': window.onTurnstileError,
          'expired-callback': window.onTurnstileExpired
        };
        // کمی صبر می‌کنیم تا auto-render فرصت داشته باشد
        setTimeout(() => ensureTurnstileRendered(widget, options), 600);
      })
      .catch((e) => {
        console.error('Turnstile script load error:', e);
      });
  });

  // هندلرهای کپچا Turnstile برای ذخیره توکن در فیلد مخفی
  window.onTurnstileSuccess = function(token) {
    const el = document.getElementById('captcha-token');
    if (el) el.value = token;
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.disabled = false;
  };

  window.onTurnstileError = function(err) {
    console.error('Turnstile error', err);
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.disabled = true;

    const errorDiv = document.querySelector('#contact-form .error-message');
    if (errorDiv) {
      errorDiv.style.display = 'block';
      errorDiv.textContent = 'بارگذاری کپچا با خطا مواجه شد. لطفاً صفحه را رفرش کنید، افزونه‌های مسدودکننده را غیرفعال کنید یا اتصال اینترنت متفاوتی امتحان کنید.';
    }
    // توجه: دیگر تلاش مجدد رندر خودکار انجام نمی‌دهیم تا از حلقه خطا جلوگیری شود.
  };

  window.onTurnstileExpired = function() {
    const el = document.getElementById('captcha-token');
    if (el) el.value = '';
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.disabled = true;
  };

  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
      // جلوگیری از ارسال پیش‌فرض فرم
      e.preventDefault();
      
      // دریافت عناصر DOM
      const submitBtn = this.querySelector('button[type="submit"]');
      const loadingDiv = this.querySelector('.loading');
      const errorDiv = this.querySelector('.error-message');
      const successDiv = this.querySelector('.sent-message');
      
      // دریافت مقادیر فرم
      const name = (this.querySelector('#name')?.value || '').trim();
      const email = (this.querySelector('#email')?.value || '').trim();
      const whatsapp = (this.querySelector('#whatsapp')?.value || '').trim();
      const plan = (this.querySelector('#service-select')?.value || '').trim();
      const message = (this.querySelector('#message')?.value || '').trim();
      // فایل‌ها از state داخلی انتخاب فایل‌ها خوانده می‌شوند
      const files = selectedFiles.slice();
      
      // اعتبارسنجی فرم (شامل فایل)
      const validation = validateForm(name, email, whatsapp, plan, message, files);
      if (!validation.isValid) {
        errorDiv.style.display = 'block';
        errorDiv.textContent = validation.errors.join(' | ');
        successDiv.style.display = 'none';
        loadingDiv.style.display = 'none';
        return;
      }
      
      // نمایش loading state
      submitBtn.disabled = true;
      const originalBtnText = submitBtn.textContent;
      submitBtn.textContent = files.length ? t('contact.form.uploader.uploadingAndSending') : t('contact.form.uploader.sending');
      loadingDiv.style.display = 'block';
      loadingDiv.classList.remove('fade-out');
      loadingDiv.classList.add('fade-in');
      errorDiv.style.display = 'none';
      errorDiv.classList.remove('fade-in');
      successDiv.style.display = 'none';
      successDiv.classList.remove('fade-in');
      
      try {
        // دریافت توکن Turnstile (اولویت با فیلد پیش‌فرض، سپس fallback به input مخفی)
        const turnstileToken = this.querySelector('[name="cf-turnstile-response"]')?.value
          || document.getElementById('captcha-token')?.value
          || '';
        if (!turnstileToken || turnstileToken.trim() === '') {
          errorDiv.style.display = 'block';
          errorDiv.textContent = 'لطفاً کپچا را تأیید کنید';
          successDiv.style.display = 'none';
          loadingDiv.style.display = 'none';
          return;
        }

        // آماده‌سازی داده‌های JSON
        const formData = {
          name: name,
          email: email,
          whatsapp: whatsapp || '', // اختیاری
          plan: plan,
          message: message,
          captchaToken: turnstileToken
        };
        
        // تبدیل همه فایل‌ها به base64 در صورت وجود
        if (files.length) {
          console.log('Processing files:', files.map(f => f.name));
          submitBtn.textContent = t('contact.form.uploader.processingFiles');
          try {
            const encoded = await Promise.all(files.map(async (f) => {
              // پیشرفت خواندن فایل تا 90%
              const base64Content = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                  const base64 = reader.result.split(',')[1];
                  updateFileProgress(f, 95);
                  resolve(base64);
                };
                reader.onerror = (error) => reject(error);
                reader.onprogress = (e) => {
                  if (e.lengthComputable) {
                    const pct = Math.round((e.loaded / e.total) * 90);
                    updateFileProgress(f, pct);
                  }
                };
                reader.readAsDataURL(f);
              });
              return {
                name: f.name,
                type: f.type,
                size: f.size,
                content: base64Content
              };
            }));
            formData.files = encoded;
            // برای سازگاری عقب‌رو: اولی را به صورت تک‌فایل نیز ارسال می‌کنیم
            formData.file = encoded[0];
          } catch (fileError) {
            console.error('Error converting files to base64:', fileError);
            throw new Error(t('contact.form.errors.fileProcessing'));
          }
        }
        
        console.log('Sending form data:', {
          ...formData,
          file: formData.file ? { name: formData.file.name, size: formData.file.size } : null,
          files: formData.files ? formData.files.map(f => ({ name: f.name, size: f.size })) : null
        });
        
        // ارسال به Cloudflare Worker (انتخاب پویا براساس دامنه)
        const workerUrl = (location.hostname === 'mahdiarts.ir' || location.hostname === 'www.mahdiarts.ir')
          ? 'https://mahdiarts.ir/api/contact'
          : 'https://mahdiarts-contact-form.mahdi-bagheban-d18.workers.dev/api/contact';
        submitBtn.textContent = t('contact.form.uploader.sending');
        const response = await fetch(workerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        console.log('Response status:', response.status);
        
        // دریافت پاسخ
        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          console.error('Error parsing JSON response:', jsonError);
          throw new Error(t('contact.form.errors.invalidServerResponse'));
        }
        
        console.log('Response data:', result);
        
        if (response.ok && result.success) {
          // موفقیت
          loadingDiv.style.display = 'none';
          loadingDiv.classList.add('fade-out');
          successDiv.style.display = 'block';
          successDiv.classList.remove('fade-out');
          successDiv.classList.add('fade-in');
          submitBtn.textContent = originalBtnText;
          // تکمیل نوار پیشرفت فایل‌ها
          files.forEach(f => updateFileProgress(f, 100));
          
          // پاک کردن فرم
          this.reset();
          // پاک کردن فایل‌های انتخاب‌شده
          selectedFiles.length = 0;
          renderFileList();
          
          // پاک کردن selected plan از localStorage
          localStorage.removeItem('selectedPlan');
          
          // اسکرول به پیام موفقیت
          setTimeout(() => {
            successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 100);
        } else {
          // مدیریت خطاهای مختلف
          let errorMessage = t('contact.form.feedback.submitError');
          if (response.status === 429) {
            errorMessage = result.error || t('contact.form.feedback.rateLimited');
          } else if (response.status === 400) {
            errorMessage = result.error || t('contact.form.feedback.validationError');
          } else if (response.status === 500) {
            errorMessage = result.error || t('contact.form.feedback.serverError');
          } else if (result.error) {
            errorMessage = result.error;
          }
          throw new Error(errorMessage);
        }
      } catch (error) {
        // مدیریت خطا
        console.error('Form submission error:', error);
        loadingDiv.style.display = 'none';
        loadingDiv.classList.add('fade-out');
        errorDiv.style.display = 'block';
        errorDiv.classList.remove('fade-out');
        errorDiv.classList.add('fade-in');
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          errorDiv.textContent = t('contact.form.feedback.networkError');
        } else if (error.message) {
          errorDiv.textContent = error.message;
        } else {
          errorDiv.textContent = t('contact.form.feedback.submitError');
        }
        
        submitBtn.textContent = originalBtnText;
      } finally {
        submitBtn.disabled = false;
        // ریست کپچا فقط در صورت وجود و یک‌بار
        try {
          if (window.turnstile) {
            const widget = this.querySelector('.cf-turnstile');
            if (widget) window.turnstile.reset(widget);
          }
        } catch (_) {}
      }
    });
  }

  // تنظیم پلن انتخابی در بارگذاری صفحه
  window.addEventListener('load', function() {
    const selectedPlan = localStorage.getItem('selectedPlan');
    if (selectedPlan) {
      const serviceSelect = document.querySelector('#service-select');
      if (serviceSelect) {
        serviceSelect.value = selectedPlan;
      }
    }
  });

})();

/* ساخته شده توسط مهدی باغبان‌پور */
