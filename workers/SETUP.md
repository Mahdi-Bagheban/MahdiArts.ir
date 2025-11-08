# راهنمای نصب و راه‌اندازی Worker فرم تماس

این راهنما مراحل کامل نصب و راه‌اندازی Cloudflare Worker برای فرم تماس MahdiArts را شرح می‌دهد.

## 📋 پیش‌نیازها

1. حساب Cloudflare با Workers فعال
2. حساب Resend برای ارسال ایمیل
3. Wrangler CLI نصب شده

```bash
npm install -g wrangler
```

## 🚀 مراحل نصب

### 1. ورود به Cloudflare

```bash
wrangler login
```

### 2. تنظیم Account ID

در فایل `wrangler.toml`، `YOUR_ACCOUNT_ID` را با Account ID خود از Cloudflare Dashboard جایگزین کنید.

### 3. تنظیم Resend API Key

```bash
# برای محیط development
wrangler secret put RESEND_API_KEY

# برای محیط production
wrangler secret put RESEND_API_KEY --env production
```

هنگام اجرای دستور، API Key خود را از [Resend Dashboard](https://resend.com/api-keys) وارد کنید.

### 4. ایجاد KV Namespace برای Rate Limiting

```bash
# برای محیط development
wrangler kv:namespace create "RATE_LIMIT_KV"

# برای محیط production
wrangler kv:namespace create "RATE_LIMIT_KV" --env production
```

سپس ID های دریافت شده را در `wrangler.toml` قرار دهید:

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "YOUR_KV_NAMESPACE_ID"  # از خروجی دستور بالا
preview_id = "YOUR_PREVIEW_KV_NAMESPACE_ID"  # از خروجی دستور بالا
```

### 5. ایجاد R2 Bucket برای فایل‌ها

```bash
wrangler r2 bucket create mahdiarts-contact-files
```

اگر می‌خواهید فایل‌ها به صورت عمومی قابل دسترسی باشند، یک Custom Domain در Cloudflare R2 تنظیم کنید و URL آن را در `wrangler.toml` به عنوان `R2_PUBLIC_URL` اضافه کنید.

### 6. تنظیم Route در Cloudflare

در Cloudflare Dashboard:
1. به Workers & Pages بروید
2. Worker خود را انتخاب کنید
3. در تب "Triggers" روی "Add Route" کلیک کنید
4. Route را اضافه کنید: `mahdiarts.ir/api/contact`

یا از طریق `wrangler.toml` (که قبلاً تنظیم شده است).

### 7. Deploy Worker

```bash
# برای تست در محیط development
wrangler dev

# برای deploy به production
wrangler deploy --env production
```

## 🔧 تنظیمات Resend

### 1. ایجاد Domain در Resend

- به [Resend Dashboard](https://resend.com/domains) بروید
- دامنه `mahdiarts.ir` را اضافه کنید
- DNS records را طبق دستورالعمل Resend تنظیم کنید

### 2. Verify Domain

پس از تنظیم DNS، دامنه را verify کنید.

### 3. تنظیم From Address

در کد Worker، آدرس فرستنده به صورت `MahdiArts <noreply@mahdiarts.ir>` تنظیم شده است. می‌توانید آن را در تابع `sendEmailWithResend` تغییر دهید.

## 📧 تست ارسال ایمیل

برای تست، می‌توانید از curl استفاده کنید:

```bash
curl -X POST https://mahdiarts.ir/api/contact \
  -F "name=تست کاربر" \
  -F "email=test@example.com" \
  -F "whatsapp=+989123456789" \
  -F "service=basic" \
  -F "message=این یک پیام تست است"
```

## 🔒 امنیت

### Rate Limiting
- حداکثر 5 درخواست در ساعت از هر IP
- در صورت عدم تنظیم KV، rate limiting غیرفعال می‌شود

### اعتبارسنجی
- تمام ورودی‌ها پاکسازی و اعتبارسنجی می‌شوند
- فایل‌ها محدود به 5MB و فقط تصاویر و PDF

### CORS
- فقط دامنه‌های مجاز در `ALLOWED_ORIGINS` می‌توانند درخواست ارسال کنند

## 📝 Environment Variables

| متغیر | نوع | توضیحات | الزامی |
|------|-----|---------|--------|
| `RESEND_API_KEY` | Secret | API Key از Resend | ✅ |
| `ADMIN_EMAIL` | Variable | ایمیل ادمین | ✅ |
| `ALLOWED_ORIGINS` | Variable | دامنه‌های مجاز (با کاما) | ✅ |
| `RATE_LIMIT_KV` | KV Namespace | برای Rate Limiting | ❌ |
| `R2_BUCKET` | R2 Bucket | برای ذخیره فایل‌ها | ❌ |
| `R2_PUBLIC_URL` | Variable | URL عمومی R2 | ❌ |

## 🐛 عیب‌یابی

### خطای "RESEND_API_KEY تنظیم نشده است"
- مطمئن شوید که secret را با `wrangler secret put` تنظیم کرده‌اید

### خطای CORS
- بررسی کنید که `ALLOWED_ORIGINS` در `wrangler.toml` صحیح است
- Origin درخواست باید دقیقاً با یکی از دامنه‌های مجاز مطابقت داشته باشد

### فایل آپلود نمی‌شود
- بررسی کنید که R2 Bucket ایجاد شده است
- اگر `R2_PUBLIC_URL` تنظیم نشده باشد، فقط نام فایل برگردانده می‌شود

### Rate Limiting کار نمی‌کند
- مطمئن شوید که KV Namespace ایجاد و در `wrangler.toml` تنظیم شده است

## 📞 پشتیبانی

برای سوالات و مشکلات:
- ایمیل: info@mahdiarts.ir
- واتساپ: +989306880801

---

**ساخته شده توسط مهدی باغبان‌پور | MahdiArts.ir**

