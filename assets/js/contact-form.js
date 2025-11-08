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
  function validateForm(name, email, whatsapp, plan, message) {
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
    
    // اعتبارسنجی واتساپ (اختیاری اما اگر وارد شده باشد باید معتبر باشد)
    if (whatsapp && whatsapp.trim().length > 0) {
      const whatsappRegex = /^[\d\s\-\+\(\)]+$/;
      const digitsOnly = whatsapp.replace(/\D/g, '');
      if (!whatsappRegex.test(whatsapp.trim()) || digitsOnly.length < 10) {
        errors.push('شماره واتساپ معتبر وارد کنید');
      }
    }
    
    // اعتبارسنجی انتخاب پلن
    const validPlans = ['basic', 'professional', 'enterprise'];
    if (!plan || plan.trim() === '' || !validPlans.includes(plan.trim())) {
      errors.push('لطفاً یک پلن معتبر انتخاب کنید');
    }
    
    // اعتبارسنجی پیام
    if (!message || message.trim().length < 10) {
      errors.push('پیام باید حداقل 10 کاراکتر باشد');
    } else if (message.trim().length > 5000) {
      errors.push('پیام نباید بیشتر از 5000 کاراکتر باشد');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // مدیریت فرم تماس
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
      
      // اعتبارسنجی فرم
      const validation = validateForm(name, email, whatsapp, plan, message);
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
      submitBtn.textContent = 'در حال ارسال...';
      loadingDiv.style.display = 'block';
      errorDiv.style.display = 'none';
      successDiv.style.display = 'none';
      
      try {
        // آماده‌سازی داده‌های JSON
        const formData = {
          name: name,
          email: email,
          whatsapp: whatsapp || '', // اختیاری
          plan: plan,
          message: message
        };
        
        console.log('Sending form data:', formData);
        
        // ارسال به Cloudflare Worker
        const workerUrl = 'https://mahdiarts.ir/api/contact';
        const response = await fetch(workerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        console.log('Response status:', response.status);
        
        // دریافت پاسخ
        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          console.error('Error parsing JSON response:', jsonError);
          throw new Error('پاسخ نامعتبر از سرور دریافت شد. لطفاً دوباره تلاش کنید.');
        }
        
        console.log('Response data:', result);
        
        if (response.ok && result.success) {
          // موفقیت
          loadingDiv.style.display = 'none';
          successDiv.style.display = 'block';
          submitBtn.textContent = originalBtnText;
          
          // پاک کردن فرم
          this.reset();
          
          // پاک کردن selected plan از localStorage
          localStorage.removeItem('selectedPlan');
          
          // اسکرول به پیام موفقیت
          setTimeout(() => {
            successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 100);
        } else {
          // مدیریت خطاهای مختلف
          let errorMessage = 'خطا در ارسال پیام. لطفاً دوباره تلاش کنید.';
          
          if (response.status === 429) {
            // Rate limiting
            errorMessage = result.error || 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً یک ساعت دیگر دوباره تلاش کنید.';
          } else if (response.status === 400) {
            // خطای اعتبارسنجی
            errorMessage = result.error || 'لطفاً تمام فیلدها را به درستی پر کنید.';
          } else if (response.status === 500) {
            // خطای سرور
            errorMessage = result.error || 'خطا در سرور. لطفاً بعداً دوباره تلاش کنید.';
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
          errorDiv.textContent = 'خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید.';
        } else if (error.message) {
          errorDiv.textContent = error.message;
        } else {
          errorDiv.textContent = 'خطا در ارسال پیام. لطفاً دوباره تلاش کنید.';
        }
        
        submitBtn.textContent = originalBtnText;
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

