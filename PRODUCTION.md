# 🚀 راهنمای استقرار Production - MahdiArts.ir

این راهنما مراحل کامل و امن برای استقرار Cloudflare Worker در محیط Production را پوشش می‌دهد.

## 📋 پیش‌نیازها

1. دامنه `mahdiarts.ir` در Cloudflare فعال باشد (Orange cloud ☁️).
2. سایت از طریق Cloudflare پروکسی شده و **SSL/TLS** فعال باشد.
3. **Wrangler CLI** نصب و با اکانت لاگین شده باشد.
4. دسترسی به API Keys سرویس‌های جانبی (Resend, Turnstile).

## 🔧 تنظیمات wrangler.toml

اطمینان حاصل کنید که بخش `[env.production]` شامل موارد زیر است:

```toml
[env.production]
name = "mahdiarts-contact-form"
routes = [
  { pattern = "mahdiarts.ir/api/contact", zone_name = "mahdiarts.ir" },
  { pattern = "www.mahdiarts.ir/api/contact", zone_name = "mahdiarts.ir" }
]

[env.production.vars]
ALLOWED_ORIGINS = "https://mahdiarts.ir,https://www.mahdiarts.ir"
FROM_EMAIL = "noreply@mahdiarts.ir"
ADMIN_EMAIL = "info@mahdiarts.ir"
```

## 🔐 تنظیم Secrets

متغیرهای حساس باید از طریق دستور `wrangler secret put` برای محیط Production تنظیم شوند:

```bash
# تنظیم کلید API سرویس Resend
wrangler secret put RESEND_API_KEY --env production

# تنظیم کلید مخفی Turnstile
wrangler secret put TURNSTILE_SECRET_KEY --env production
```

## 📦 مراحل استقرار (Deploy)

### 1. اعتبارسنجی تنظیمات
```bash
wrangler whoami
```

### 2. اجرای دستور Deploy
```bash
wrangler deploy --env production
```

### 3. بررسی خروجی
مطمئن شوید که Worker با موفقیت آپلود شده و Routeهای تعریف شده فعال شده‌اند.

## ✅ تست‌های پس از استقرار

### تست ارسال درخواست (Curl)
```bash
curl.exe -i -X POST https://mahdiarts.ir/api/contact \
  -H "Origin: https://mahdiarts.ir" \
  -H "Content-Type: application/json" \
  --data-binary @payload.json
```
- **انتظار:** Status 200 و دریافت پاسخ موفقیت‌آمیز.

### تست فرم در سایت
- به سایت بروید و فرم تماس را پر کنید.
- بررسی کنید ایمیل دریافت می‌شود.
- بررسی کنید کپچا (Turnstile) به درستی عمل می‌کند.

## 🛠️ عیب‌یابی (Troubleshooting)

- **خطای 503 Service Unavailable:** ممکن است Worker در حال ریستارت باشد؛ چند لحظه صبر کنید.
- **خطای CORS:** بررسی کنید Origin درخواست در `ALLOWED_ORIGINS` باشد.
- **عدم دریافت ایمیل:** لاگ‌های Worker را در داشبورد Cloudflare بررسی کنید.

## ⚠️ نکات امنیتی

- هرگز Secrets را در فایل‌های متنی یا مخزن Git ذخیره نکنید.
- همیشه `ALLOWED_ORIGINS` را محدود به دامنه‌های خود نگه دارید.
- از `wrangler tail --env production` برای مشاهده لاگ‌های زنده استفاده کنید.

---

**نگهداری و توسعه توسط مهدی باغبان‌پور**

