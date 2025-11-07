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

  // مدیریت فرم تماس
  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const submitBtn = this.querySelector('button[type="submit"]');
      const loadingDiv = this.querySelector('.loading');
      const errorDiv = this.querySelector('.error-message');
      const successDiv = this.querySelector('.sent-message');
      
      // نمایش loading
      submitBtn.disabled = true;
      loadingDiv.style.display = 'block';
      errorDiv.style.display = 'none';
      successDiv.style.display = 'none';
      
      try {
        // ارسال به Cloudflare Worker
        // TODO: آدرس Worker را بعد از deploy تنظیم کنید
        const workerUrl = 'https://mahdiarts.ir/api/contact'; // یا URL Worker شما
        const response = await fetch(workerUrl, {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          // موفقیت
          loadingDiv.style.display = 'none';
          successDiv.style.display = 'block';
          this.reset();
          
          // پاک کردن selected plan از localStorage
          localStorage.removeItem('selectedPlan');
        } else {
          throw new Error(result.message || 'خطا در ارسال پیام');
        }
      } catch (error) {
        // خطا
        loadingDiv.style.display = 'none';
        errorDiv.style.display = 'block';
        errorDiv.textContent = error.message || 'خطا در ارسال پیام. لطفاً دوباره تلاش کنید.';
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

