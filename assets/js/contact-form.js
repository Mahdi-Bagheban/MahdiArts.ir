/* به نام خداوند بخشنده مهربان */

/**
 * مدیریت فرم تماس با ما
 * ساخته شده توسط مهدی باغبان‌پور
 */

(function() {
  'use strict';

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
   * اعتبارسنجی فرم در سمت کلاینت
   */
  function validateForm(name, email, message, service) {
    const errors = [];
    
    // اعتبارسنجی نام
    if (!name || name.trim().length < 2) {
      errors.push('نام باید حداقل 2 کاراکتر باشد');
    } else if (name.trim().length > 100) {
      errors.push('نام نباید بیشتر از 100 کاراکتر باشد');
    }
    
    // اعتبارسنجی ایمیل
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      errors.push('لطفاً یک ایمیل معتبر وارد کنید');
    }
    
    // اعتبارسنجی پیام
    if (!message || message.trim().length < 10) {
      errors.push('پیام باید حداقل 10 کاراکتر باشد');
    } else if (message.trim().length > 5000) {
      errors.push('پیام نباید بیشتر از 5000 کاراکتر باشد');
    }
    
    // اعتبارسنجی انتخاب پلن
    if (!service || service.trim() === '') {
      errors.push('لطفاً یک پلن را انتخاب کنید');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * تبدیل مقدار پلن به موضوع فارسی
   */
  function getSubjectFromService(service) {
    const serviceMap = {
      'basic': 'درخواست پلن پایه',
      'professional': 'درخواست پلن حرفه‌ای',
      'enterprise': 'درخواست پلن سازمانی'
    };
    return serviceMap[service] || 'درخواست تماس';
  }

  // مدیریت فرم تماس
  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const submitBtn = this.querySelector('button[type="submit"]');
      const loadingDiv = this.querySelector('.loading');
      const errorDiv = this.querySelector('.error-message');
      const successDiv = this.querySelector('.sent-message');
      
      // دریافت مقادیر فرم
      const name = this.querySelector('#name').value.trim();
      const email = this.querySelector('#email').value.trim();
      const message = this.querySelector('#message').value.trim();
      const service = this.querySelector('#service-select').value;
      
      // اعتبارسنجی فرم
      const validation = validateForm(name, email, message, service);
      if (!validation.isValid) {
        errorDiv.style.display = 'block';
        errorDiv.textContent = validation.errors.join(' | ');
        successDiv.style.display = 'none';
        return;
      }
      
      // ایجاد موضوع از پلن انتخابی
      const subject = getSubjectFromService(service);
      
      // نمایش loading
      submitBtn.disabled = true;
      submitBtn.textContent = 'در حال ارسال...';
      loadingDiv.style.display = 'block';
      errorDiv.style.display = 'none';
      successDiv.style.display = 'none';
      
      try {
        // ارسال به Cloudflare Worker
        const workerUrl = 'https://mahdiarts.ir/api/contact';
        const response = await fetch(workerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: name,
            email: email,
            subject: subject,
            message: message
          })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          // موفقیت
          loadingDiv.style.display = 'none';
          successDiv.style.display = 'block';
          submitBtn.textContent = 'ارسال پیام';
          this.reset();
          
          // پاک کردن selected plan از localStorage
          localStorage.removeItem('selectedPlan');
          
          // اسکرول به پیام موفقیت
          successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          // مدیریت خطاهای مختلف
          let errorMessage = 'خطا در ارسال پیام. لطفاً دوباره تلاش کنید.';
          
          if (response.status === 429) {
            // Rate limiting
            errorMessage = result.error || 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً یک ساعت دیگر دوباره تلاش کنید.';
          } else if (response.status === 400) {
            // خطای اعتبارسنجی
            errorMessage = result.error || 'لطفاً تمام فیلدها را به درستی پر کنید.';
          } else if (result.error) {
            errorMessage = result.error;
          }
          
          throw new Error(errorMessage);
        }
      } catch (error) {
        // خطا
        loadingDiv.style.display = 'none';
        errorDiv.style.display = 'block';
        
        if (error.message.includes('fetch') || error.message.includes('network')) {
          errorDiv.textContent = 'خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید.';
        } else {
          errorDiv.textContent = error.message || 'خطا در ارسال پیام. لطفاً دوباره تلاش کنید.';
        }
        
        submitBtn.textContent = 'ارسال پیام';
      } finally {
        submitBtn.disabled = false;
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

