# PRODUCTION Deployment Guide - MahdiArts.ir

این راهنما برای دیپلوی امن و پایدار Cloudflare Worker فرم تماس در محیط Production نوشته شده است. دستورات و کدها انگلیسی هستند؛ توضیحات فارسی.

## پیش‌نیازها
- دامنه `mahdiarts.ir` روی Cloudflare اضافه و فعال باشد (Orange cloud برای رکوردهای مرتبط).
- سایت از طریق Cloudflare پروکسی می‌شود و TLS فعال است.
- `wrangler` نصب، به‌روز، و با اکانت Cloudflare لاگین شده است.
- دسترسی به `RESEND_API_KEY` برای Production دارید.

## تنظیمات ضروری در wrangler.toml
- مسیرهای Production:
  - `mahdiarts.ir/api/contact`
  - `www.mahdiarts.ir/api/contact`
- فقط دامنه‌های Production در CORS:
  - `ALLOWED_ORIGINS = "https://mahdiarts.ir,https://www.mahdiarts.ir"`
- وجود `FROM_EMAIL` برای Production:
  - `FROM_EMAIL = "noreply@mahdiarts.ir"`

نمونه بخش Production:
```
[env.production]
name = "mahdiarts-contact-form"
routes = [
  { pattern = "mahdiarts.ir/api/contact", zone_name = "mahdiarts.ir" },
  { pattern = "www.mahdiarts.ir/api/contact", zone_name = "mahdiarts.ir" }
]

[env.production.vars]
ALLOWED_ORIGINS = "https://mahdiarts.ir,https://www.mahdiarts.ir"
FROM_EMAIL = "noreply@mahdiarts.ir"
```

## تنظیمات DNS موردنیاز
- اگر سایت شما قبلاً روی Cloudflare است، معمولاً نیازی به تغییر DNS ندارید.
- اطمینان از فعال بودن رکوردهای زیر با وضعیت Orange cloud:
  - `A/AAAA` یا `CNAME` برای `mahdiarts.ir`
  - `CNAME` برای `www` به `mahdiarts.ir` (اختیاری اما توصیه‌شده)
- اگر Cloudflare روی دامنه فعال نیست، ابتدا NS دامنه را به Cloudflare تغییر دهید.

## تنظیم Secrets برای Production
- مقداردهی `RESEND_API_KEY` در محیط Production:
```
wrangler secret put RESEND_API_KEY --env production
```
- بررسی یا مقداردهی سایر متغیرها در صورت نیاز:
  - در `wrangler.toml` یا به‌صورت Secret/Vars به ازای محیط.

## مراحل دیپلوی Production
1) اعتبارسنجی تنظیمات:
```
wrangler whoami
wrangler versions
```
2) دیپلوی:
```
wrangler deploy --env production
```
3) بررسی خروجی برای ثبت Routeها و عدم خطا.

## تست‌های Production پس از دیپلوی
- تست موفقیت درخواست و CORS:
```
curl.exe -i -X POST https://mahdiarts.ir/api/contact \
  -H "Origin: https://mahdiarts.ir" \
  -H "Content-Type: application/json" \
  --data-binary @payload.json
```
- انتظار می‌رود:
  - Status: 200
  - Header: `Access-Control-Allow-Origin: https://mahdiarts.ir`
  - Header: `Vary: Origin, accept-encoding`
  - Body: پیام موفقیت فارسی
- تست سناریوی خطا (مثلاً فایل غیرمجاز یا محتوای غیر-base64) برای اعتبارسنجی.

## عملیات پس از دیپلوی
- بررسی لاگ‌ها در Cloudflare Dashboard (Workers > Logs).
- مانیتورینگ خطاها و پاسخ‌ها در Analytics.
- بررسی نرخ درخواست‌ها و احتمال Rate Limiting.

## Rollback در صورت مشکل
- دیپلوی نسخه قبلی (اگر نسخه پایدار قبلاً دیپلوی شده):
```
# در صورت داشتن نسخه قبلی، مجدداً deploy انجام دهید یا از تاریخچه استفاده کنید
wrangler deploy --env production
```
- غیرفعال‌سازی موقت Routeها:
  - ویرایش `wrangler.toml` و حذف/غیرفعال کردن Route مشکل‌دار، سپس دیپلوی.
- حذف Worker از روی Routeها در شرایط بحرانی:
```
wrangler undeploy --env production
```

## Troubleshooting رایج
- `503 Service Unavailable` روی پروکسی محلی:
  - Worker ممکن است هنگام ری‌لود/شروع دوباره قطع شود؛ تست را مجدداً انجام دهید یا روی دامنه اصلی تست کنید.
- `curl` در PowerShell:
  - از `curl.exe` استفاده کنید تا با alias داخلی PowerShell تداخل نداشته باشد.
- مشکل CORS:
  - بررسی کنید Origin دقیقاً یکی از `ALLOWED_ORIGINS` باشد.
  - هدرهای `Origin` و `Content-Type` را تنظیم کنید.
- خطای فایل:
  - حجم فایل <= 5MB، فرمت مجاز: تصاویر و PDF.
  - محتوای `file.content` باید base64 معتبر باشد.
- عدم اتصال به workers.dev:
  - برای Production از Routeهای دامنه استفاده کنید؛ workers.dev برای Dev مناسب است.

## نکات امنیتی
- Secrets را هرگز در ریپو نگه ندارید؛ فقط از `wrangler secret` استفاده کنید.
- مبداها را محدود نگه دارید (`ALLOWED_ORIGINS`).
- پیام‌های خطا را ساده و بدون افشای جزئیات داخلی ارسال کنید.

---

این راهنما به‌روز نگه‌داری می‌شود؛ در صورت تغییرات در Cloudflare یا Resend، بخش‌های مرتبط را به‌روزرسانی کنید.

