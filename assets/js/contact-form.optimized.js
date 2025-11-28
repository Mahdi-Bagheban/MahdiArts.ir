/* به نام خداوند بخشنده مهربان */

/**
 * مدیریت فرم تماس با ما - نسخه بهینه‌شده
 * ساخته شده توسط مهدی باغبان‌پور
 * Version: 2.0.0 (Optimized)
 */

(function() {
  'use strict';

  // ============================================
  // CONSTANTS & CONFIGURATION
  // ============================================
  
  const CONFIG = {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_FILES: 5,
    ALLOWED_TYPES: [
      'application/pdf',
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave'
    ],
    ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.txt', '.doc', '.docx', '.mp3', '.wav'],
    VALID_PLANS: ['basic', 'professional', 'enterprise'],
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    WHATSAPP_REGEX: /^[\d\s\-\+\(\)]+$/
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  
  /**
   * Helper function for i18n translations
   * @param {string} key - Translation key
   * @param {string} defaultValue - Default value if translation not found
   * @returns {string} Translated text
   */
  const t = (key, defaultValue = '') => 
    window.i18n?.t?.(key, defaultValue) ?? (defaultValue || key);

  /**
   * تبدیل فایل به base64
   * @param {File} file - فایل برای تبدیل
   * @returns {Promise<string>} Base64 encoded string
   */
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // ============================================
  // VALIDATION
  // ============================================
  
  /**
   * اعتبارسنجی فایل
   * @param {File} file - فایل برای اعتبارسنجی
   * @returns {{isValid: boolean, errors: string[]}}
   */
  function validateFile(file) {
    if (!file) return { isValid: true, errors: [] };
    
    const errors = [];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    // بررسی نوع فایل
    const isValidType = CONFIG.ALLOWED_TYPES.includes(file.type.toLowerCase()) || 
                        CONFIG.ALLOWED_EXTENSIONS.includes(fileExtension);
    
    if (!isValidType) {
      errors.push(t('contact.form.errors.fileType', 'نوع فایل مجاز نیست'));
    }
    
    // بررسی حجم فایل
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      errors.push(t('contact.form.errors.fileSize', 'حجم فایل بیش از حد مجاز است'));
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * اعتبارسنجی فرم
   * @param {Object} formData - داده‌های فرم
   * @returns {{isValid: boolean, errors: string[]}}
   */
  function validateForm(formData) {
    const { name, email, whatsapp, plan, message, files } = formData;
    const errors = [];
    
    // اعتبارسنجی نام
    if (!name || name.trim().length < 2) {
      errors.push(t('contact.form.errors.nameMin', 'نام حداقل 2 کاراکتر باشد'));
    } else if (name.trim().length > 100) {
      errors.push(t('contact.form.errors.nameMax', 'نام حداکثر 100 کاراکتر باشد'));
    }
    
    // اعتبارسنجی ایمیل
    if (!email || !CONFIG.EMAIL_REGEX.test(email.trim())) {
      errors.push(t('contact.form.errors.emailInvalid', 'ایمیل معتبر وارد کنید'));
    }
    
    // اعتبارسنجی واتساپ (اختیاری)
    if (whatsapp?.trim()) {
      const digitsOnly = whatsapp.replace(/\D/g, '');
      if (!CONFIG.WHATSAPP_REGEX.test(whatsapp.trim()) || digitsOnly.length < 10) {
        errors.push(t('contact.form.errors.whatsappInvalid', 'شماره واتساپ معتبر نیست'));
      }
    }
    
    // اعتبارسنجی پلن
    if (!plan || !CONFIG.VALID_PLANS.includes(plan.trim())) {
      errors.push(t('contact.form.errors.planInvalid', 'لطفاً یک پلن انتخاب کنید'));
    }
    
    // اعتبارسنجی پیام
    if (!message || message.trim().length < 10) {
      errors.push(t('contact.form.errors.messageMin', 'پیام حداقل 10 کاراکتر باشد'));
    } else if (message.trim().length > 5000) {
      errors.push(t('contact.form.errors.messageMax', 'پیام حداکثر 5000 کاراکتر باشد'));
    }
    
    // اعتبارسنجی فایل‌ها
    if (Array.isArray(files)) {
      if (files.length > CONFIG.MAX_FILES) {
        errors.push(t('contact.form.errors.maxFiles', `حداکثر ${CONFIG.MAX_FILES} فایل`));
      }
      
      files.forEach(file => {
        const validation = validateFile(file);
        if (!validation.isValid) {
          errors.push(`«${file.name}»: ${validation.errors.join(' | ')}`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ============================================
  // FILE MANAGEMENT
  // ============================================
  
  const selectedFiles = [];
  const fileProgress = new WeakMap();

  /**
   * به‌روزرسانی progress bar فایل
   * @param {File} file - فایل
   * @param {number} percent - درصد پیشرفت
   */
  function updateFileProgress(file, percent) {
    const safePercent = Math.min(100, Math.max(0, Math.round(percent)));
    fileProgress.set(file, safePercent);
    
    const listEl = document.getElementById('file-list');
    if (!listEl) return;
    
    const fileItem = listEl.querySelector(`[data-file-name="${file.name}"]`);
    if (!fileItem) return;
    
    const progressBar = fileItem.querySelector('.progress-bar');
    if (progressBar) {
      progressBar.style.width = `${safePercent}%`;
      progressBar.setAttribute('aria-valuenow', safePercent);
      progressBar.textContent = `${safePercent}%`;
    }
  }

  /**
   * رندر لیست فایل‌ها
   */
  function renderFileList() {
    const listEl = document.getElementById('file-list');
    const errorEl = document.getElementById('file-error');
    
    if (!listEl) return;
    
    listEl.innerHTML = '';
    
    if (selectedFiles.length === 0) {
      if (errorEl) errorEl.style.display = 'none';
      return;
    }
    
    const fragment = document.createDocumentFragment();
    
    selectedFiles.forEach((file, index) => {
      const item = createFileItem(file, index);
      fragment.appendChild(item);
    });
    
    listEl.appendChild(fragment);
  }

  /**
   * ایجاد آیتم فایل
   * @param {File} file - فایل
   * @param {number} index - ایندکس
   * @returns {HTMLElement}
   */
  function createFileItem(file, index) {
    const item = document.createElement('div');
    item.className = 'file-item border rounded p-2 mb-2';
    item.setAttribute('data-file-name', file.name);

    // ایجاد عنصر تصویر پیش‌نمایش برای فایل‌های تصویری
    if (file.type.startsWith('image/')) {
      const preview = document.createElement('img');
      preview.src = URL.createObjectURL(file);
      preview.alt = file.name;
      preview.className = 'file-preview';
      preview.style.cssText = 'width: 40px; height: 40px; object-fit: cover; border-radius: 4px; margin-right: 10px;';
      item.appendChild(preview);
    }

    // اطلاعات فایل
    const info = document.createElement('div');
    info.className = 'file-info flex-grow-1';
    info.innerHTML = `
      <div class="file-name">${file.name}</div>
      <div class="file-size text-muted">${formatFileSize(file.size)}</div>
    `;
    item.appendChild(info);

    // Progress bar
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress mt-2';
    progressContainer.innerHTML = `
      <div class="progress-bar" role="progressbar" style="width: 0%" 
           aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
    `;
    item.appendChild(progressContainer);

    // دکمه حذف
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-sm btn-danger';
    removeBtn.textContent = '×';
    removeBtn.setAttribute('aria-label', `حذف ${file.name}`);
    removeBtn.addEventListener('click', () => removeFile(index));
    item.appendChild(removeBtn);

    return item;
  }

  /**
   * فرمت کردن حجم فایل
   * @param {number} bytes - حجم به بایت
   * @returns {string}
   */
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * حذف فایل از لیست
   * @param {number} index - ایندکس فایل
   */
  function removeFile(index) {
    if (index >= 0 && index < selectedFiles.length) {
      selectedFiles.splice(index, 1);
      renderFileList();
    }
  }

  // ============================================
  // PLAN SELECTION
  // ============================================
  
  /**
   * مدیریت انتخاب پلن از دکمه‌های pricing
   */
  document.querySelectorAll('.select-plan-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      
      const plan = this.getAttribute('data-plan');
      if (!plan) return;
      
      localStorage.setItem('selectedPlan', plan);
      
      // اسکرول به فرم
      const contactSection = document.querySelector('#contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
        
        // انتخاب پلن در فرم با تاخیر
        setTimeout(() => {
          const serviceSelect = document.querySelector('#service-select');
          if (serviceSelect) {
            serviceSelect.value = plan;
            serviceSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, 500);
      }
    });
  });

  /**
   * بارگذاری پلن ذخیره شده
   */
  window.addEventListener('load', () => {
    const savedPlan = localStorage.getItem('selectedPlan');
    if (savedPlan) {
      const serviceSelect = document.querySelector('#service-select');
      if (serviceSelect) {
        serviceSelect.value = savedPlan;
        serviceSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });

  // ============================================
  // FORM SUBMISSION
  // ============================================
  
  /**
   * مدیریت ارسال فرم
   */
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const fileInput = document.getElementById('file-upload');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error-message');
    const successDiv = document.getElementById('success-message');

    // مدیریت انتخاب فایل
    if (fileInput) {
      fileInput.addEventListener('change', function() {
        const newFiles = Array.from(this.files);
        
        newFiles.forEach(file => {
          if (selectedFiles.length < CONFIG.MAX_FILES) {
            selectedFiles.push(file);
          }
        });
        
        renderFileList();
        this.value = ''; // Reset input
      });
    }

    // مدیریت submit فرم
    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      // جمع‌آوری داده‌های فرم
      const name = form.querySelector('#name')?.value?.trim();
      const email = form.querySelector('#email')?.value?.trim();
      const whatsapp = form.querySelector('#whatsapp')?.value?.trim();
      const plan = form.querySelector('#service-select')?.value?.trim();
      const message = form.querySelector('#message')?.value?.trim();
      const files = [...selectedFiles];

      // اعتبارسنجی
      const validation = validateForm({ name, email, whatsapp, plan, message, files });
      
      if (!validation.isValid) {
        errorDiv.style.display = 'block';
        errorDiv.innerHTML = validation.errors.map(err => `<p>${err}</p>`).join('');
        successDiv.style.display = 'none';
        loadingDiv.style.display = 'none';
        return;
      }

      // نمایش loading
      const submitBtn = form.querySelector('[type="submit"]');
      if (!submitBtn) return;
      
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = files.length ? t('contact.form.uploader.uploadingAndSending') : t('contact.form.uploader.sending');
      
      loadingDiv.style.display = 'block';
      errorDiv.style.display = 'none';
      successDiv.style.display = 'none';

      try {
        // دریافت توکن CAPTCHA
        const captchaToken = form.querySelector('[name="cf-turnstile-response"]')?.value || 
                           document.getElementById('captcha-token')?.value || '';
        
        if (!captchaToken) {
          throw new Error(t('contact.form.captcha.verifyRequired', 'لطفاً کپچا را تکمیل کنید'));
        }

        // آماده‌سازی داده‌ها
        const formData = {
          name,
          email,
          whatsapp: whatsapp || '',
          plan,
          message,
          captchaToken
        };

        // پردازش فایل‌ها
        if (files.length > 0) {
          submitBtn.textContent = t('contact.form.uploader.processingFiles');
          
          const encodedFiles = await Promise.all(
            files.map(async (file) => {
              const base64 = await fileToBase64(file);
              updateFileProgress(file, 95);
              
              return {
                name: file.name,
                type: file.type,
                size: file.size,
                content: base64
              };
            })
          );
          
          formData.files = encodedFiles;
          formData.file = encodedFiles[0]; // برای سازگاری
        }

        // ارسال به سرور
        const workerUrl = (location.hostname === 'mahdiarts.ir' || location.hostname === 'www.mahdiarts.ir')
          ? 'https://mahdiarts.ir/api/contact'
          : 'https://mahdiarts-contact-form.mahdi-bagheban-d18.workers.dev/api/contact';
        
        submitBtn.textContent = t('contact.form.uploader.sending');
        
        const response = await fetch(workerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // موفقیت
          loadingDiv.style.display = 'none';
          successDiv.style.display = 'block';
          successDiv.classList.add('success-check');
          
          files.forEach(f => updateFileProgress(f, 100));
          
          form.reset();
          selectedFiles.length = 0;
          renderFileList();
          localStorage.removeItem('selectedPlan');
          
          // اسکرول به پیام موفقیت
          setTimeout(() => {
            successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            showConfetti();
          }, 100);
          
        } else {
          throw new Error(result.error || t('contact.form.feedback.submitError'));
        }

      } catch (error) {
        console.error('Form submission error:', error);
        loadingDiv.style.display = 'none';
        errorDiv.style.display = 'block';
        errorDiv.textContent = error.message || t('contact.form.feedback.submitError');
        
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        
        // ریست کپچا
        try {
          if (window.turnstile) {
            const widget = form.querySelector('.cf-turnstile');
            if (widget) window.turnstile.reset(widget);
          }
        } catch (_) {}
      }
    });
  }

  /**
   * نمایش انیمیشن confetti
   */
  function showConfetti() {
    try {
      const count = 24;
      for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        Object.assign(particle.style, {
          position: 'fixed',
          top: '-10px',
          left: (10 + Math.random() * 80) + '%',
          width: '8px',
          height: '12px',
          background: `hsl(${Math.random() * 360}deg, 85%, 60%)`,
          opacity: '0.9',
          transform: `rotate(${Math.random() * 360}deg)`,
          zIndex: '99999',
          transition: 'all 1.2s ease-out'
        });
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
          particle.style.top = (60 + Math.random() * 30) + '%';
          particle.style.opacity = '0';
        }, 20);
        
        setTimeout(() => {
          particle.remove();
        }, 1400);
      }
    } catch (_) {}
  }

  // Initialize form
  window.addEventListener('load', initContactForm);

})();

/* ساخته شده توسط مهدی باغبان‌پور */
