/* به نام خداوند بخشنده مهربان */

/**
 * Cloudflare Worker برای پردازش فرم تماس MahdiArts.ir
 * ساخته شده توسط مهدی باغبان‌پور
 * 
 * ویژگی‌ها:
 * - یکپارچه‌سازی با Resend API برای ارسال ایمیل
 * - اعتبارسنجی و پاکسازی ورودی‌ها
 * - مدیریت CORS
 * - قالب‌های ایمیل حرفه‌ای به فارسی
 * - مدیریت خطاهای جامع
 */

/**
 * پاکسازی و اعتبارسنجی ورودی‌های فرم
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
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * اعتبارسنجی رشته base64
 * از regex و تلاش برای decode جهت بررسی صحت استفاده می‌کند
 */
function isValidBase64(str) {
  // اگر رشته نباشد یا خالی باشد، نامعتبر است
  if (typeof str !== 'string' || str.length === 0) return false;
  // regex برای کاراکترهای مجاز و padding صحیح
  const base64Regex = /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}(?:==)?|[A-Za-z0-9+\/]{3}=)?$/;
  if (!base64Regex.test(str)) return false;
  // تلاش برای decode؛ در صورت خطا یعنی رشته نامعتبر است
  try {
    atob(str);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * اعتبارسنجی کامل فرم
 * فیلدهای مورد نیاز: name, email, whatsapp, plan, message
 */
function validateForm(name, email, whatsapp, plan, message) {
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

  // اعتبارسنجی واتساپ (اختیاری اما اگر وارد شده باشد باید معتبر باشد)
  const sanitizedWhatsapp = sanitizeInput(whatsapp || '');
  if (sanitizedWhatsapp && sanitizedWhatsapp.length > 0) {
    // بررسی فرمت شماره واتساپ (حداقل 10 رقم)
    const whatsappRegex = /^[\d\s\-\+\(\)]+$/;
    if (!whatsappRegex.test(sanitizedWhatsapp) || sanitizedWhatsapp.replace(/\D/g, '').length < 10) {
      errors.push('شماره واتساپ معتبر وارد کنید');
    }
  }

  // اعتبارسنجی پلن
  const validPlans = ['basic', 'professional', 'enterprise'];
  const sanitizedPlan = sanitizeInput(plan || '');
  if (!sanitizedPlan || !validPlans.includes(sanitizedPlan)) {
    errors.push('لطفاً یک پلن معتبر انتخاب کنید');
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
      whatsapp: sanitizedWhatsapp,
      plan: sanitizedPlan,
      message: sanitizedMessage
    }
  };
}

/**
 * تبدیل پلن به موضوع فارسی
 */
function getSubjectFromPlan(plan) {
  const planMap = {
    'basic': 'درخواست پلن پایه',
    'professional': 'درخواست پلن حرفه‌ای',
    'enterprise': 'درخواست پلن سازمانی'
  };
  return planMap[plan] || 'درخواست تماس';
}

/**
 * اعتبارسنجی فایل
 * بررسی نوع و حجم فایل
 */
function validateFile(file) {
  const errors = [];
  
  if (!file || !file.name || !file.type || !file.size || !file.content) {
    errors.push('اطلاعات فایل ناقص است');
    return { isValid: false, errors };
  }

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
    errors.push('نوع فایل مجاز نیست. فقط اسناد (PDF/DOC/DOCX/TXT)، تصاویر (JPG/PNG/GIF) و صوتی (MP3/WAV) مجاز هستند');
  }

  // بررسی حجم فایل (حداکثر 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    errors.push('حجم فایل نباید بیشتر از 5 مگابایت باشد');
  }

  // بررسی base64 content
  if (!file.content || typeof file.content !== 'string') {
    errors.push('محتوای فایل نامعتبر است');
  }

  // اعتبارسنجی صحت base64
  if (file.content && typeof file.content === 'string' && !isValidBase64(file.content)) {
    errors.push('محتوای فایل به‌صورت base64 نامعتبر است');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * ایجاد قالب HTML ایمیل تأیید برای کاربر
 */
function createUserConfirmationEmail(name, plan, message) {
  const date = new Date().toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const subject = getSubjectFromPlan(plan);

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
          <span class="detail-label">پلن انتخابی:</span>
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
 */
function createAdminNotificationEmail(name, email, whatsapp, plan, message, ip, timestamp, hasFile = false, fileName = null) {
  const date = new Date(timestamp).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const subject = getSubjectFromPlan(plan);

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
        
        ${whatsapp ? `
        <div class="detail-row">
          <span class="detail-label">واتساپ:</span>
          <span class="detail-value">${whatsapp}</span>
        </div>
        ` : ''}
        
        <div class="detail-row">
          <span class="detail-label">پلن انتخابی:</span>
          <span class="detail-value"><strong>${subject}</strong></span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">متن پیام:</span>
        </div>
        <div class="message-box">${message}</div>
        
        ${hasFile && Array.isArray(fileName) ? `
        <div class="detail-row">
          <span class="detail-label">فایل‌های ضمیمه:</span>
          <span class="detail-value">
            ${fileName.length === 1 
              ? `<strong>${fileName[0]}</strong>` 
              : fileName.map(fn => `<div><strong>${fn}</strong></div>`).join('')}
            <div>(فایل‌ها در attachment ایمیل موجود است)</div>
          </span>
        </div>
        ` : ''}
        
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
 * @param {string} to - آدرس ایمیل گیرنده
 * @param {string} subject - موضوع ایمیل
 * @param {string} html - محتوای HTML ایمیل
 * @param {object} env - Environment variables
 * @param {array} attachments - آرایه فایل‌های ضمیمه (اختیاری)
 */
async function sendEmailWithResend(to, subject, html, env, attachments = null) {
  console.log(`[Resend] Attempting to send email to: ${to}`);
  console.log(`[Resend] Subject: ${subject}`);
  
  const resendApiKey = env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.error('[Resend] ERROR: RESEND_API_KEY is not set');
    throw new Error('RESEND_API_KEY تنظیم نشده است');
  }

  const fromEmail = env.FROM_EMAIL || 'noreply@mahdiarts.ir';
  console.log(`[Resend] From email: ${fromEmail}`);

  const requestBody = {
    from: fromEmail,
    to: [to],
    subject: subject,
    html: html
  };

  // اضافه کردن attachments در صورت وجود
  if (attachments && Array.isArray(attachments) && attachments.length > 0) {
    requestBody.attachments = attachments;
    console.log(`[Resend] Adding ${attachments.length} attachment(s) to email`);
  }

  // Log request payload before sending for debugging
  const requestPayload = JSON.stringify(requestBody);
  console.log(`[Resend] Request payload (before sending):`, {
    from: fromEmail,
    to: to,
    subject: subject,
    htmlLength: html.length,
    payloadLength: requestPayload.length
  });
  console.log(`[Resend] Full request payload:`, requestPayload.substring(0, 500) + (requestPayload.length > 500 ? '...' : ''));

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: requestPayload
    });

    console.log(`[Resend] Response status: ${response.status}`);
    console.log(`[Resend] Response status text: ${response.statusText}`);
    console.log(`[Resend] Response headers:`, Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log(`[Resend] Response body (full):`, responseText);
    console.log(`[Resend] Response body length: ${responseText.length}`);

    if (!response.ok) {
      // Log full error details
      console.error(`[Resend] ERROR - Status: ${response.status}`);
      console.error(`[Resend] ERROR - Status Text: ${response.statusText}`);
      console.error(`[Resend] ERROR - Response Body:`, responseText);
      
      let errorMessage = `خطا در ارسال ایمیل: ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        console.error('[Resend] ERROR - Parsed error data:', JSON.stringify(errorData, null, 2));
        if (errorData.message) {
          errorMessage = `خطا در ارسال ایمیل: ${errorData.message}`;
        } else if (errorData.error) {
          errorMessage = `خطا در ارسال ایمیل: ${errorData.error}`;
        }
      } catch (parseError) {
        console.error('[Resend] ERROR - Could not parse error response:', parseError);
        console.error('[Resend] ERROR - Raw response text:', responseText);
        errorMessage = `خطا در ارسال ایمیل: ${response.status} - ${responseText.substring(0, 200)}`;
      }
      throw new Error(errorMessage);
    }

    const result = JSON.parse(responseText);
    console.log('[Resend] SUCCESS - Email sent successfully:', JSON.stringify(result, null, 2));
    return result;

  } catch (error) {
    console.error('[Resend] Exception during email send:', error);
    if (error.message) {
      throw error;
    }
    throw new Error(`خطا در ارسال ایمیل: ${error.toString()}`);
  }
}

/**
 * تابع اصلی Worker
 */
export default {
  async fetch(request, env) {
    console.log(`[Worker] New request: ${request.method} ${request.url}`);
    
    // دریافت Origin برای CORS
    const origin = request.headers.get('Origin');
    console.log(`[Worker] Origin: ${origin}`);
    
    const allowedOrigins = (env.ALLOWED_ORIGINS || 'https://mahdiarts.ir,https://www.mahdiarts.ir').split(',').map(o => o.trim());
    const isAllowedOrigin = origin && allowedOrigins.includes(origin);
    const corsOrigin = isAllowedOrigin ? origin : '*'; // اگر Origin نامعتبر باشد، از wildcard استفاده شود
    
    console.log(`[Worker] CORS origin: ${corsOrigin}`);

    // مدیریت CORS Preflight
    if (request.method === 'OPTIONS') {
      console.log('[Worker] Handling OPTIONS preflight request');
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': corsOrigin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With', // گسترش هدرهای مجاز برای درخواست‌های AJAX
          'Vary': 'Origin', // پاسخ‌ها بسته به Origin متفاوت است
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // فقط POST مجاز است
    if (request.method !== 'POST') {
      console.log(`[Worker] Method not allowed: ${request.method}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'فقط درخواست POST مجاز است' 
        }),
        {
          status: 405,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': corsOrigin,
            'Vary': 'Origin'
          }
        }
      );
    }

    // بررسی مسیر درخواست
    const url = new URL(request.url);
    console.log(`[Worker] Path: ${url.pathname}`);
    
    if (url.pathname !== '/api/contact') {
      console.log(`[Worker] Path not found: ${url.pathname}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'مسیر یافت نشد' 
        }),
        {
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': corsOrigin,
            'Vary': 'Origin'
          }
        }
      );
    }

    try {
      // دریافت IP کاربر
      const clientIP = request.headers.get('CF-Connecting-IP') || 
                          request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 
                          'unknown';
      console.log(`[Worker] Client IP: ${clientIP}`);

      // دریافت Content-Type
      const contentType = request.headers.get('Content-Type') || '';
      console.log(`[Worker] Content-Type: ${contentType}`);

      // دریافت و پردازش JSON body
      let body;
      try {
        const bodyText = await request.text();
        console.log(`[Worker] Request body received (length: ${bodyText.length})`);
        console.log(`[Worker] Request body preview: ${bodyText.substring(0, 200)}`);
        // محدودیت حجم بدنه: افزایش برای پشتیبانی از چند فایل
        const MAX_BODY_BYTES = 40_000_000; // ~40MB
        const bodyBytes = new TextEncoder().encode(bodyText).length;
        if (bodyBytes > MAX_BODY_BYTES) {
          console.error(`[Worker] Request body too large: ${bodyBytes} bytes`);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'حجم بدنه درخواست بیش از حد مجاز (40MB) است.' 
            }),
            {
              status: 413,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': corsOrigin,
                'Vary': 'Origin'
              }
            }
          );
        }
        
        body = JSON.parse(bodyText);
        console.log(`[Worker] Parsed body:`, JSON.stringify(body));
      } catch (jsonError) {
        console.error('[Worker] JSON parse error:', jsonError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'فرمت JSON نامعتبر است. لطفاً مطمئن شوید که داده‌ها به صورت JSON ارسال شده‌اند.' 
          }),
          {
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': corsOrigin,
              'Vary': 'Origin'
            }
          }
        );
      }

      // استخراج فیلدها
      const { name, email, whatsapp, plan, message, file, files } = body;
      console.log(`[Worker] Extracted fields:`, { 
        name: name ? 'present' : 'missing',
        email: email ? 'present' : 'missing',
        whatsapp: whatsapp ? 'present' : 'missing',
        plan: plan ? 'present' : 'missing',
        message: message ? 'present' : 'missing',
        file: file ? 'present' : 'missing'
      });

      // اعتبارسنجی فایل در صورت وجود
      let fileAttachment = null;
      let fileNames = [];
      if (Array.isArray(files) && files.length > 0) {
        console.log(`[Worker] Validating ${files.length} files...`);
        if (files.length > 5) {
          return new Response(
            JSON.stringify({ success: false, error: 'حداکثر ۵ فایل قابل آپلود است' }),
            { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsOrigin, 'Vary': 'Origin' } }
          );
        }
        for (const f of files) {
          const v = validateFile(f);
          if (!v.isValid) {
            return new Response(
              JSON.stringify({ success: false, error: v.errors.join(' | ') }),
              { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsOrigin, 'Vary': 'Origin' } }
            );
          }
        }
        fileAttachment = files.map(f => ({ filename: f.name, content: f.content }));
        fileNames = files.map(f => f.name);
        console.log(`[Worker] Files validated:`, fileNames);
      } else if (file) {
        console.log('[Worker] Validating single file...');
        const fileValidation = validateFile(file);
        if (!fileValidation.isValid) {
          console.error('[Worker] File validation failed:', fileValidation.errors);
          return new Response(
            JSON.stringify({ success: false, error: fileValidation.errors.join(' | ') }),
            { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsOrigin, 'Vary': 'Origin' } }
          );
        }
        fileAttachment = [{ filename: file.name, content: file.content }];
        fileNames = [file.name];
        console.log(`[Worker] File validated: ${file.name} (${file.size} bytes)`);
      }

      // اعتبارسنجی و پاکسازی ورودی‌ها
      console.log('[Worker] Validating form data...');
      const validation = validateForm(name, email, whatsapp, plan, message);
      
      if (!validation.isValid) {
        console.error('[Worker] Validation failed:', validation.errors);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: validation.errors.join(' | ') 
          }),
          {
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': corsOrigin,
              'Vary': 'Origin'
            }
          }
        );
      }

      console.log('[Worker] Validation passed');
      const { sanitized } = validation;
      const timestamp = new Date().toISOString();
      const subject = getSubjectFromPlan(sanitized.plan);

      // ارسال ایمیل تأیید به کاربر
      console.log('[Worker] Sending user confirmation email...');
      try {
        const userEmailHTML = createUserConfirmationEmail(
          sanitized.name,
          sanitized.plan,
          sanitized.message
        );
        
        const userEmailResult = await sendEmailWithResend(
          sanitized.email,
          'پیام شما با موفقیت دریافت شد - MahdiArts',
          userEmailHTML,
          env
        );
        
        console.log('[Worker] User confirmation email sent successfully:', userEmailResult);
      } catch (emailError) {
        console.error('[Worker] Error sending user email:', emailError);
        // ادامه می‌دهیم حتی اگر ایمیل کاربر ارسال نشود
      }

      // ارسال ایمیل اطلاع‌رسانی به ادمین (با attachment در صورت وجود)
      console.log('[Worker] Sending admin notification email...');
      const adminEmail = env.ADMIN_EMAIL || 'info@mahdiarts.ir';
      const adminEmailHTML = createAdminNotificationEmail(
        sanitized.name,
        sanitized.email,
        sanitized.whatsapp,
        sanitized.plan,
        sanitized.message,
        clientIP,
        timestamp,
        !!fileAttachment,
        fileNames
      );
      
      // اضافه کردن اطلاعات فایل به ایمیل ادمین در صورت وجود
      let adminEmailSubject = `پیام جدید از فرم تماس - ${sanitized.name} (${subject})`;
      if (fileAttachment) {
        adminEmailSubject += fileNames.length > 1 ? ` [با ${fileNames.length} فایل]` : ` [با فایل: ${fileNames[0]}]`;
      }
      
      const adminEmailResult = await sendEmailWithResend(
        adminEmail,
        adminEmailSubject,
        adminEmailHTML,
        env,
        fileAttachment // ارسال attachment فقط به ادمین
      );
      
      console.log('[Worker] Admin notification email sent successfully:', adminEmailResult);

      // پاسخ موفقیت
      console.log('[Worker] Request processed successfully');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'پیام شما با موفقیت ارسال شد. به زودی با شما تماس خواهیم گرفت.' 
        }),
        {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': corsOrigin,
            'Vary': 'Origin'
          }
        }
      );

    } catch (error) {
      console.error('[Worker] Unhandled error:', error);
      console.error('[Worker] Error stack:', error.stack);
      
      // مدیریت خطاها
      let errorMessage = 'خطا در پردازش درخواست. لطفاً دوباره تلاش کنید.';
      
      if (error.message) {
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
            'Access-Control-Allow-Origin': corsOrigin,
            'Vary': 'Origin'
          }
        }
      );
    }
  }
};
