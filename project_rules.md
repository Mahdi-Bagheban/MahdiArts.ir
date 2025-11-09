# Project Rules - MahdiArts.ir

## معرفی پروژه
- **نام**: MahdiArts.ir
- **نوع**: وب‌سایت شخصی و حرفه‌ای
- **مالک**: مهدی باغبان‌پور
- **تکنولوژی**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Cloudflare Workers
- **Email Service**: Resend API (رایگان)
- **Template Base**: BootstrapMade Invent

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

---

## یادآوری مهم
TRAE هر فایلی که تغییر می‌دی رو **حتماً** با #File یا #Workspace به عنوان Context بهش معرفی کن تا کل پروژه رو درک کنه.

