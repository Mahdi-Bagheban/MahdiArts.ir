/* به نام خداوند بخشنده مهربان */

/**
 * Cloudflare Worker برای پردازش فرم تماس MahdiArts.ir
 * ساخته شده توسط مهدی باغبان‌پور
 * 
 * ویژگی‌ها:
 * - یکپارچه‌سازی با Resend API برای ارسال ایمیل
 * - Rate Limiting (حداکثر 5 درخواست در ساعت)
 * - اعتبارسنجی و پاکسازی ورودی‌ها
 * - مدیریت CORS
 * - قالب‌های ایمیل حرفه‌ای به فارسی
 */

// تنظیمات Rate Limiting
const RATE_LIMIT = {
  MAX_REQUESTS: 5,
  WINDOW_HOURS: 1
};

/**
 * پاکسازی و اعتبارسنجی ورودی‌های فرم
 * این تابع تگ‌های HTML و کاراکترهای خطرناک را حذف می‌کند
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  // حذف تگ‌های HTML و کاراکترهای خطرناک
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[<>'"&]/g, '')
    .trim();
}

/**
 * اعتبارسنجی ایمیل
 * بررسی می‌کند که ایمیل وارد شده معتبر باشد
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * اعتبارسنجی کامل فرم
 * تمام فیلدهای مورد نیاز را بررسی می‌کند
 */
function validateForm(name, email, subject, message) {
  const errors = [];

  // اعتبارسنجی نام (2-100 کاراکتر)
  const sanitizedName = sanitizeInput(name);
  if (!sanitizedName || sanitizedName.length < 2) {
    errors.push('نام باید حداقل 2 کاراکتر باشد');
  } else if (sanitizedName.length > 100) {
    errors.push('نام نباید بیشتر از 100 کاراکتر باشد');
  }

  // اعتبارسنجی ایمیل
  const sanitizedEmail = sanitizeInput(email).toLowerCase();
  if (!sanitizedEmail || !validateEmail(sanitizedEmail)) {
    errors.push('ایمیل معتبر وارد کنید');
  }

  // اعتبارسنجی موضوع (5-200 کاراکتر)
  const sanitizedSubject = sanitizeInput(subject);
  if (!sanitizedSubject || sanitizedSubject.length < 5) {
    errors.push('موضوع باید حداقل 5 کاراکتر باشد');
  } else if (sanitizedSubject.length > 200) {
    errors.push('موضوع نباید بیشتر از 200 کاراکتر باشد');
  }

  // اعتبارسنجی پیام (10-5000 کاراکتر)
  const sanitizedMessage = sanitizeInput(message);
  if (!sanitizedMessage || sanitizedMessage.length < 10) {
    errors.push('پیام باید حداقل 10 کاراکتر باشد');
  } else if (sanitizedMessage.length > 5000) {
    errors.push('پیام نباید بیشتر از 5000 کاراکتر باشد');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      name: sanitizedName,
      email: sanitizedEmail,
      subject: sanitizedSubject,
      message: sanitizedMessage
    }
  };
}

/**
 * بررسی Rate Limiting با استفاده از KV Store
 * این تابع تعداد درخواست‌های هر IP را در یک بازه زمانی مشخص بررسی می‌کند
 */
async function checkRateLimit(ip, env) {
  if (!env.RATE_LIMIT_KV) {
    // اگر KV موجود نباشد، rate limiting را نادیده می‌گیریم
    return { allowed: true, remaining: RATE_LIMIT.MAX_REQUESTS };
  }

  try {
    const key = `rate_limit:${ip}`;
    const now = Date.now();
    const windowMs = RATE_LIMIT.WINDOW_HOURS * 60 * 60 * 1000;

    // دریافت داده‌های قبلی
    const existing = await env.RATE_LIMIT_KV.get(key, 'json');
    
    if (existing) {
      // حذف درخواست‌های قدیمی (خارج از window)
      const recentRequests = existing.requests.filter(
        timestamp => timestamp > (now - windowMs)
      );

      if (recentRequests.length >= RATE_LIMIT.MAX_REQUESTS) {
        const resetTime = recentRequests[0] + windowMs;
        return {
          allowed: false,
          remaining: 0,
          resetTime
        };
      }

      // اضافه کردن درخواست جدید
      recentRequests.push(now);
      await env.RATE_LIMIT_KV.put(
        key,
        JSON.stringify({ requests: recentRequests }),
        { expirationTtl: RATE_LIMIT.WINDOW_HOURS * 60 * 60 }
      );

      return {
        allowed: true,
        remaining: RATE_LIMIT.MAX_REQUESTS - recentRequests.length
      };
    } else {
      // اولین درخواست
      await env.RATE_LIMIT_KV.put(
        key,
        JSON.stringify({ requests: [now] }),
        { expirationTtl: RATE_LIMIT.WINDOW_HOURS * 60 * 60 }
      );

      return {
        allowed: true,
        remaining: RATE_LIMIT.MAX_REQUESTS - 1
      };
    }
  } catch (error) {
    console.error('Rate limit error:', error);
    // در صورت خطا، اجازه می‌دهیم درخواست ادامه یابد
    return { allowed: true, remaining: RATE_LIMIT.MAX_REQUESTS };
  }
}

/**
 * ایجاد قالب HTML ایمیل تأیید برای کاربر
 * این ایمیل به کاربر ارسال می‌شود تا تأیید کند که پیامش دریافت شده است
 */
function createUserConfirmationEmail(name, subject, message) {
  const date = new Date().toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Vazirmatn', 'Tahoma', Arial, sans-serif;
      line-height: 1.8;
      color: #333;
      background-color: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #5d57f4 0%, #6c63ff 100%);
      color: #ffffff;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
      font-weight: bold;
    }
    .header p {
      font-size: 16px;
      opacity: 0.95;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 20px;
      color: #5d57f4;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .message {
      font-size: 16px;
      color: #555;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .details-box {
      background-color: #f8f9fa;
      border-right: 4px solid #5d57f4;
      padding: 20px;
      border-radius: 8px;
      margin: 30px 0;
    }
    .detail-row {
      margin: 15px 0;
      padding-bottom: 15px;
      border-bottom: 1px solid #e0e0e0;
    }
    .detail-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .detail-label {
      font-weight: bold;
      color: #5d57f4;
      display: inline-block;
      min-width: 120px;
      margin-left: 10px;
    }
    .detail-value {
      color: #333;
    }
    .message-text {
      background-color: #ffffff;
      padding: 15px;
      border-radius: 6px;
      margin-top: 10px;
      border: 1px solid #e0e0e0;
      white-space: pre-wrap;
      line-height: 1.8;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      color: #666;
      font-size: 14px;
      margin: 5px 0;
    }
    .footer .contact-info {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
    .footer .contact-info a {
      color: #5d57f4;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MahdiArts</h1>
      <p>پیام شما با موفقیت دریافت شد</p>
    </div>
    
    <div class="content">
      <div class="greeting">سلام ${name} عزیز،</div>
      
      <div class="message">
        با تشکر از تماس شما با MahdiArts. پیام شما با موفقیت دریافت شد و در اسرع وقت با شما تماس خواهیم گرفت.
      </div>
      
      <div class="details-box">
        <div class="detail-row">
          <span class="detail-label">موضوع:</span>
          <span class="detail-value">${subject}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">متن پیام:</span>
        </div>
        <div class="message-text">${message}</div>
        <div class="detail-row">
          <span class="detail-label">تاریخ و زمان:</span>
          <span class="detail-value">${date}</span>
        </div>
      </div>
      
      <div class="message">
        ما در تلاش هستیم تا در کمتر از 24 ساعت کاری به درخواست شما پاسخ دهیم.
      </div>
    </div>
    
    <div class="footer">
      <p><strong>با تشکر از انتخاب شما</strong></p>
      <p>تیم MahdiArts</p>
      <div class="contact-info">
        <p>📧 ایمیل: <a href="mailto:info@mahdiarts.ir">info@mahdiarts.ir</a></p>
        <p>🌐 وب‌سایت: <a href="https://mahdiarts.ir">mahdiarts.ir</a></p>
      </div>
      <p style="margin-top: 20px; font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} MahdiArts.ir - تمام حقوق محفوظ است
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * ایجاد قالب HTML ایمیل اطلاع‌رسانی برای ادمین
 * این ایمیل به ادمین ارسال می‌شود و شامل تمام جزئیات فرم است
 */
function createAdminNotificationEmail(name, email, subject, message, ip, timestamp) {
  const date = new Date(timestamp).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Vazirmatn', 'Tahoma', Arial, sans-serif;
      line-height: 1.8;
      color: #333;
      background-color: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 700px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: #ffffff;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
      font-weight: bold;
    }
    .alert {
      background-color: #fff3cd;
      border: 2px solid #ffc107;
      color: #856404;
      padding: 20px;
      margin: 20px;
      border-radius: 8px;
      text-align: center;
      font-weight: bold;
      font-size: 18px;
    }
    .content {
      padding: 30px;
    }
    .details-box {
      background-color: #f8f9fa;
      border-right: 4px solid #dc3545;
      padding: 25px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .detail-row {
      margin: 18px 0;
      padding-bottom: 18px;
      border-bottom: 1px solid #e0e0e0;
    }
    .detail-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .detail-label {
      font-weight: bold;
      color: #dc3545;
      display: inline-block;
      min-width: 150px;
      margin-left: 10px;
    }
    .detail-value {
      color: #333;
    }
    .detail-value a {
      color: #5d57f4;
      text-decoration: none;
    }
    .detail-value a:hover {
      text-decoration: underline;
    }
    .message-box {
      background-color: #ffffff;
      padding: 20px;
      border-radius: 6px;
      margin-top: 15px;
      border: 1px solid #e0e0e0;
      white-space: pre-wrap;
      line-height: 1.8;
      font-size: 15px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 25px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
      color: #666;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MahdiArts</h1>
      <p>پیام جدید از فرم تماس</p>
    </div>
    
    <div class="alert">
      ⚠️ پیام جدید از فرم تماس دریافت شد
    </div>
    
    <div class="content">
      <div class="details-box">
        <h2 style="margin-bottom: 20px; color: #dc3545; font-size: 20px;">جزئیات پیام:</h2>
        
        <div class="detail-row">
          <span class="detail-label">نام:</span>
          <span class="detail-value">${name}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">ایمیل:</span>
          <span class="detail-value"><a href="mailto:${email}">${email}</a></span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">موضوع:</span>
          <span class="detail-value"><strong>${subject}</strong></span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">متن پیام:</span>
        </div>
        <div class="message-box">${message}</div>
        
        <div class="detail-row">
          <span class="detail-label">آی‌پی کاربر:</span>
          <span class="detail-value">${ip}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">تاریخ و زمان:</span>
          <span class="detail-value">${date}</span>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>MahdiArts Contact Form</strong></p>
      <p style="margin-top: 10px;">این ایمیل به صورت خودکار از سیستم فرم تماس ارسال شده است</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * ارسال ایمیل با استفاده از Resend API
 * این تابع از Resend API برای ارسال ایمیل استفاده می‌کند
 */
async function sendEmailWithResend(to, subject, html, env) {
  const resendApiKey = env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY تنظیم نشده است');
  }

  const fromEmail = env.FROM_EMAIL || 'noreply@mahdiarts.ir';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject: subject,
      html: html
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Resend API error:', errorData);
    throw new Error(`خطا در ارسال ایمیل: ${response.status}`);
  }

  return await response.json();
}

/**
 * تابع اصلی Worker
 * این تابع تمام درخواست‌ها را پردازش می‌کند
 */
export default {
  async fetch(request, env) {
    // دریافت Origin برای CORS
    const origin = request.headers.get('Origin');
    const allowedOrigins = (env.ALLOWED_ORIGINS || 'https://mahdiarts.ir,https://www.mahdiarts.ir').split(',');
    const isAllowedOrigin = allowedOrigins.some(allowed => 
      origin && origin.trim() === allowed.trim()
    );
    const corsOrigin = isAllowedOrigin ? origin : allowedOrigins[0]?.trim() || '*';

    // مدیریت CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': corsOrigin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // فقط POST مجاز است
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Method not allowed' 
        }),
        {
          status: 405,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': corsOrigin
          }
        }
      );
    }

    // بررسی مسیر درخواست
    const url = new URL(request.url);
    if (url.pathname !== '/api/contact') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Not found' 
        }),
        {
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': corsOrigin
          }
        }
      );
    }

    try {
      // دریافت IP کاربر برای rate limiting
      const clientIP = request.headers.get('CF-Connecting-IP') || 
                          request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 
                          'unknown';

      // بررسی Rate Limiting
      const rateLimit = await checkRateLimit(clientIP, env);
      if (!rateLimit.allowed) {
        const resetDate = rateLimit.resetTime 
          ? new Date(rateLimit.resetTime).toLocaleTimeString('fa-IR')
          : 'بعداً';
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً بعد از ${resetDate} دوباره تلاش کنید.` 
          }),
          {
            status: 429,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': corsOrigin,
              'Retry-After': '3600'
            }
          }
        );
      }

      // دریافت و پردازش JSON body
      let body;
      try {
        body = await request.json();
      } catch (jsonError) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'فرمت JSON نامعتبر است' 
          }),
          {
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': corsOrigin
            }
          }
        );
      }

      const { name, email, subject, message } = body;

      // اعتبارسنجی و پاکسازی ورودی‌ها
      const validation = validateForm(name, email, subject, message);
      
      if (!validation.isValid) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: validation.errors.join(' | ') 
          }),
          {
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': corsOrigin
            }
          }
        );
      }

      const { sanitized } = validation;
      const timestamp = new Date().toISOString();

      // ارسال ایمیل تأیید به کاربر
      try {
        const userEmailHTML = createUserConfirmationEmail(
          sanitized.name,
          sanitized.subject,
          sanitized.message
        );
        
        await sendEmailWithResend(
          sanitized.email,
          'پیام شما با موفقیت دریافت شد - MahdiArts',
          userEmailHTML,
          env
        );
        
        console.log('User confirmation email sent successfully');
      } catch (emailError) {
        console.error('Error sending user email:', emailError);
        // ادامه می‌دهیم حتی اگر ایمیل کاربر ارسال نشود
      }

      // ارسال ایمیل اطلاع‌رسانی به ادمین
      const adminEmail = env.ADMIN_EMAIL || 'info@mahdiarts.ir';
      const adminEmailHTML = createAdminNotificationEmail(
        sanitized.name,
        sanitized.email,
        sanitized.subject,
        sanitized.message,
        clientIP,
        timestamp
      );
      
      await sendEmailWithResend(
        adminEmail,
        `پیام جدید از فرم تماس - ${sanitized.name}`,
        adminEmailHTML,
        env
      );
      
      console.log('Admin notification email sent successfully');

      // پاسخ موفقیت
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'پیام شما با موفقیت ارسال شد' 
        }),
        {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': corsOrigin
          }
        }
      );

    } catch (error) {
      console.error('Contact form error:', error);
      
      // مدیریت خطاها
      let errorMessage = 'خطا در پردازش درخواست';
      
      if (error.message.includes('RESEND')) {
        errorMessage = 'خطا در ارسال ایمیل. لطفاً دوباره تلاش کنید.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'تعداد درخواست‌های شما بیش از حد مجاز است.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage 
        }),
        {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': corsOrigin
          }
        }
      );
    }
  }
};
