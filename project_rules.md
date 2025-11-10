# Project Rules - MahdiArts.ir

## معرفی پروژه
- **نام**: MahdiArts.ir
- **نوع**: وب‌سایت شخصی و حرفه‌ای
- **مالک**: مهدی باغبان‌پور
- **تکنولوژی**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Cloudflare Workers
- **Email Service**: Resend API (رایگان)
 

## ساختار فایل‌ها
```
MahdiArts.ir/
├── index.html # صفحه اصلی
├── assets/
│ ├── css/main.css # استایل‌های اصلی
│ ├── fonts/ # فونت Vazirmatn برای فارسی
│ ├── i18n/ # فایل‌های ترجمه 10 زبان
│ │ ├── fa.json (کامل) ✅
│ │ ├── en.json (کامل) ✅
│ │ └── ar,tr,de,fr,es,ru,zh,it (نیاز به تکمیل)
│ ├── img/ # تصاویر
│ └── js/
│ ├── main.js # JavaScript اصلی
│ ├── i18n.js # سیستم چندزبانه
│ └── contact-form.js # مدیریت فرم تماس
├── workers/
│ ├── contact-form.js # Cloudflare Worker (Resend)
│ └── wrangler.toml # تنظیمات Worker
└── wrangler.toml # تنظیمات اصلی Cloudflare
```

text

## ویژگی‌های خاص پروژه

### چندزبانه (i18n)
- **10 زبان**: fa, en, ar, tr, de, fr, es, ru, zh, it
- **RTL Support**: فارسی، عربی
- **فونت فارسی**: Vazirmatn (وزن 400, 500, 700)
- کلاس `rtl` و `ltr` روی body تغییر می‌کند
- ذخیره انتخاب در localStorage با کلید `mahdiarts_lang`

### فرم تماس
- **فیلدها**: name, email, whatsapp, plan (basic/professional/enterprise), message, file
- **Validation**: در frontend (contact-form.js) و backend (workers/contact-form.js)
- **File Upload**: حداکثر 5MB، فرمت‌های مجاز: images, PDF
- **بدون R2**: فایل‌ها به صورت base64 به ایمیل ادمین attach می‌شوند

### Resend Integration
- **API Endpoint**: `https://api.resend.com/emails` 
- **Environment Variables**:
  - `RESEND_API_KEY`: کلید API از resend.com
  - `FROM_EMAIL`: ایمیل فرستنده (مثلاً noreply@mahdiarts.ir)
  - `ADMIN_EMAIL`: ایمیل مهدی (info@mahdiarts.ir)
  - `ALLOWED_ORIGINS`: دامنه‌های مجاز برای CORS
- **دو ایمیل ارسال می‌شود**:
  1. Confirmation به کاربر (بدون attachment)
  2. Notification به ادمین (با attachment در صورت وجود)

## قوانین کدنویسی این پروژه

### HTML
- استفاده از `data-i18n` برای متن‌های قابل ترجمه
- استفاده از `data-i18n-placeholder` برای placeholder ها
- Semantic HTML tags (section, article, header, footer)
- کامنت‌ها به فارسی با `<!-- ... -->`

### CSS
- استفاده از CSS Variables برای رنگ‌ها
- Mobile First approach
- RTL/LTR با تغییر `dir` در html tag
- فونت Vazirmatn فقط برای فارسی

### JavaScript
- استفاده از ES6+ syntax
- Modular code با class ها
- نام کلاس‌ها: PascalCase (مثال: I18n)

 قوانین فرمت JSON برای فایل‌های i18n:
 - از ویرگول انتهایی بعد از آخرین ویژگی آبجکت یا عنصر آرایه استفاده نکنید.
 - همهٔ نام کلیدها باید با دابل‌ کوتیشن باشند.
 - کلیدهای `errors` و `feedback` مربوط به فرم تماس باید داخل `contact.form` باشند تا اسکریپت به‌درستی آن‌ها را بارگذاری کند.
- نام توابع: camelCase (مثال: validateEmail)
- همیشه sanitize input قبل از استفاده

### Workers (Backend)
- **فقط از Resend** استفاده می‌کنیم (نه Mailgun)
- **بدون R2** برای ذخیره فایل
- Attachment ها به صورت base64 در ایمیل
- CORS headers برای دامنه‌های مجاز
- Rate limiting (اختیاری - برای آینده)

## TODO های فعلی
- [ ] تست کامل Resend integration با فایل attachment
- [ ] تکمیل ترجمه‌های ناقص (de, fr, es, ru, zh, it)
- [ ] افزودن reCAPTCHA v3
- [ ] بهینه‌سازی تصاویر
- [ ] ساخت بخش Portfolio
- [ ] افزودن Dark/Light mode

## دستورالعمل‌های توسعه
- هر feature در یک branch جداگانه
- commit های منظم با پیام‌های توضیحی
- تست در حداقل 2 زبان (فارسی + انگلیسی)
- تست فرم با و بدون فایل
- بررسی در DevTools Console

## چک‌لیست Production Deployment
- پیش‌نیازها:
  - دامنه `mahdiarts.ir` روی Cloudflare اضافه و فعال (Orange cloud) باشد.
  - TLS فعال و وب‌سایت از طریق Cloudflare سرو می‌شود.
  - رکورد `www` فعال باشد، اگر از ساب‌دامین استفاده می‌کنید.
  - `wrangler` نصب و لاگین شده است.
  - متغیرها و Secrets برای محیط production ست شده‌اند.
- کارهای قبل از دیپلوی:
  - بررسی `wrangler.toml` برای `[env.production]` و `routes`:
    - `mahdiarts.ir/api/contact`
    - `www.mahdiarts.ir/api/contact`
  - اطمینان از اینکه `ALLOWED_ORIGINS` فقط دامنه‌های production هستند.
  - ست کردن Secrets:
    - `wrangler secret put RESEND_API_KEY --env production`
  - ست کردن متغیرها در صورت نیاز:
    - `FROM_EMAIL` و `ADMIN_EMAIL` در `[env.production.vars]` یا سطح global.
- دستورات دیپلوی:
  - `wrangler deploy --env production`
  - بررسی خروجی برای موفقیت و ثبت Routeها.
- کارهای بعد از دیپلوی:
  - تست CORS با Origin `https://mahdiarts.ir`:
    - `curl.exe -i -X POST https://mahdiarts.ir/api/contact -H "Origin: https://mahdiarts.ir" -H "Content-Type: application/json" --data-binary @payload.json`
  - بررسی هدرها:
    - `Access-Control-Allow-Origin: https://mahdiarts.ir`
    - `Vary: Origin, accept-encoding`
  - تست سناریوهای خطا (validation: فایل غیرمجاز، محتوای غیر-base64).
  - بررسی لاگ‌ها در Cloudflare Dashboard (Workers > Logs).
- مراحل Rollback:
  - بازگشت به نسخه قبلی: اگر نسخه قبلی در دسترس است، `wrangler deploy --env production --dry-run` را بررسی کنید یا نسخه قبلی را مجدد دیپلوی کنید.
  - غیرفعال کردن Routeها در صورت نیاز: موقتاً پاک/ویرایش Route در `wrangler.toml` و دیپلوی.
  - استفاده از `wrangler undeploy --env production` برای حذف Worker از Routeها (در صورت بحرانی بودن).

---

## یادآوری مهم
TRAE هر فایلی که تغییر می‌دی رو **حتماً** با #File یا #Workspace به عنوان Context بهش معرفی کن تا کل پروژه رو درک کنه.

