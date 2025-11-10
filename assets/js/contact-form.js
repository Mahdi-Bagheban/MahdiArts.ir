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
      errors.push(t('contact.errors.fileType'));
    }
    
    // بررسی حجم فایل (حداکثر 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      errors.push(t('contact.errors.fileSize'));
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
      errors.push(t('contact.errors.nameMin'));
    } else if (name.trim().length > 100) {
      errors.push(t('contact.errors.nameMax'));
    }
    
    // اعتبارسنجی ایمیل
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      errors.push(t('contact.errors.emailInvalid'));
    }
    
    // اعتبارسنجی واتساپ (اختیاری اما اگر وارد شده باشد باید معتبر باشد)
    if (whatsapp && whatsapp.trim().length > 0) {
      const whatsappRegex = /^[\d\s\-\+\(\)]+$/;
      const digitsOnly = whatsapp.replace(/\D/g, '');
      if (!whatsappRegex.test(whatsapp.trim()) || digitsOnly.length < 10) {
        errors.push(t('contact.errors.whatsappInvalid'));
      }
    }
    
    // اعتبارسنجی انتخاب پلن
    const validPlans = ['basic', 'professional', 'enterprise'];
    if (!plan || plan.trim() === '' || !validPlans.includes(plan.trim())) {
      errors.push(t('contact.errors.planInvalid'));
    }
    
    // اعتبارسنجی پیام
    if (!message || message.trim().length < 10) {
      errors.push(t('contact.errors.messageMin'));
    } else if (message.trim().length > 5000) {
      errors.push(t('contact.errors.messageMax'));
    }
    
    // اعتبارسنجی فایل‌ها
    const MAX_FILES = 5;
    if (Array.isArray(files)) {
      if (files.length > MAX_FILES) {
        errors.push(t('contact.errors.maxFiles'));
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
      item.className = 'd-flex align-items-center justify-content-between border rounded p-2 mb-2';
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
      item.appendChild(info);
      item.appendChild(removeBtn);
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
    if (selectBtn && inputEl) {
      selectBtn.addEventListener('click', () => inputEl.click());
    }
    if (dropZone) {
      ['dragenter','dragover'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.style.borderColor = '#0d6efd';
          dropZone.style.background = 'rgba(13,110,253,0.05)';
        });
      });
      ['dragleave','drop'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.style.borderColor = '#6c757d';
          dropZone.style.background = 'transparent';
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

  // هندلرهای کپچا Turnstile برای ذخیره توکن در فیلد مخفی
  window.onTurnstileSuccess = function(token) {
    const el = document.getElementById('captcha-token');
    if (el) el.value = token;
  };
  window.onTurnstileError = function() {
    console.error('Turnstile error');
  };
  window.onTurnstileExpired = function() {
    const el = document.getElementById('captcha-token');
    if (el) el.value = '';
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
      errorDiv.style.display = 'none';
      successDiv.style.display = 'none';
      
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
              const base64Content = await fileToBase64(f);
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
            throw new Error(t('contact.errors.fileProcessing'));
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
          throw new Error(t('contact.errors.invalidServerResponse'));
        }
        
        console.log('Response data:', result);
        
        if (response.ok && result.success) {
          // موفقیت
          loadingDiv.style.display = 'none';
          successDiv.style.display = 'block';
          submitBtn.textContent = originalBtnText;
          
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
          let errorMessage = t('contact.feedback.submitError');
          
          if (response.status === 429) {
            // Rate limiting
            errorMessage = result.error || t('contact.feedback.rateLimited');
          } else if (response.status === 400) {
            // خطای اعتبارسنجی
            errorMessage = result.error || t('contact.feedback.validationError');
          } else if (response.status === 500) {
            // خطای سرور
            errorMessage = result.error || t('contact.feedback.serverError');
          } else if (result.error) {
            errorMessage = result.error;
          }
          
          throw new Error(errorMessage);
        }
      } catch (error) {
        // مدیریت خطا
        console.error('Form submission error:', error);
        loadingDiv.style.display = 'none';
        errorDiv.style.display = 'block';
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          errorDiv.textContent = t('contact.feedback.networkError');
        } else if (error.message) {
          errorDiv.textContent = error.message;
        } else {
          errorDiv.textContent = t('contact.feedback.submitError');
        }
        
        submitBtn.textContent = originalBtnText;
      } finally {
        submitBtn.disabled = false;
        // ریست کردن ویجت کپچا در صورت وجود
        if (window.turnstile) {
          try {
            const widget = this.querySelector('.cf-turnstile');
            if (widget) window.turnstile.reset(widget);
          } catch (e) {}
        }
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
