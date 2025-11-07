/* به نام خداوند بخشنده مهربان */

/**
 * Cloudflare Worker برای پردازش فرم تماس
 * ساخته شده توسط مهدی باغبان‌پور
 */

export default {
  async fetch(request, env) {
    // مدیریت CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, message: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const formData = await request.formData();
      const name = formData.get('name');
      const email = formData.get('email');
      const whatsapp = formData.get('whatsapp');
      const service = formData.get('service');
      const message = formData.get('message');
      const file = formData.get('file');

      // Validation
      if (!name || !email || !whatsapp || !service || !message) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'تمام فیلدهای الزامی را پر کنید' 
        }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // دریافت IP کاربر
      const clientIP = request.headers.get('CF-Connecting-IP') || 'Unknown';
      const userAgent = request.headers.get('User-Agent') || 'Unknown';
      const timestamp = new Date().toISOString();

      // TODO: آپلود فایل به Cloudflare R2 (اگر وجود دارد)
      let fileUrl = null;
      if (file && file.size > 0) {
        // پیاده‌سازی آپلود به R2
        // fileUrl = await uploadToR2(file, env);
      }

      // TODO: ارسال ایمیل با Mailgun یا SendGrid
      // await sendEmailToUser(email, name, service, env);
      // await sendEmailToAdmin(name, email, whatsapp, service, message, fileUrl, clientIP, timestamp, env);

      // پاسخ موفقیت
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'پیام شما با موفقیت ارسال شد' 
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (error) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'خطا در پردازش درخواست: ' + error.message 
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};

/* ساخته شده توسط مهدی باغبان‌پور */

