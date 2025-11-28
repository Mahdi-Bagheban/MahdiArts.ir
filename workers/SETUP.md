# 🛠️ راهنمای نصب و راه‌اندازی Worker فرم تماس

این راهنما مراحل کامل نصب و راه‌اندازی Cloudflare Worker برای فرم تماس MahdiArts را شرح می‌دهد.

## 📋 پیش‌نیازها

1. حساب **Cloudflare** با Workers فعال
2. حساب **Resend** برای ارسال ایمیل
3. **Wrangler CLI** نصب شده

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

### 4. تنظیم Turnstile Secret Key

برای فعال‌سازی محافظت کپچا، باید Secret Key را تنظیم کنید:

```bash
# برای محیط development
wrangler secret put TURNSTILE_SECRET_KEY

# برای محیط production
wrangler secret put TURNSTILE_SECRET_KEY --env production
```

### 5. ایجاد KV Namespace برای Rate Limiting

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
id = "YOUR_KV_NAMESPACE_ID"
preview_id = "YOUR_PREVIEW_KV_NAMESPACE_ID"
```

### 6. ایجاد R2 Bucket برای فایل‌ها (اختیاری)

```bash
wrangler r2 bucket create mahdiarts-contact-files
```

### 7. Deploy Worker

```bash
# تست در محیط development
wrangler dev

# deploy به production
wrangler deploy --env production
```

## 🔧 تنظیمات Resend

### 1. ایجاد Domain در Resend

- به [Resend Dashboard](https://resend.com/domains) بروید
- دامنه `mahdiarts.ir` را اضافه کنید
- DNS records را طبق دستورالعمل Resend تنظیم کنید

### 2. تنظیم From Address

در کد Worker، آدرس فرستنده به صورت `MahdiArts <noreply@mahdiarts.ir>` تنظیم شده است. می‌توانید آن را در تابع `sendEmailWithResend` تغییر دهید.

## � جدول متغیرهای محیطی (Environment Variables)

| متغیر | نوع | توضیحات | الزامی |
|------|-----|---------|--------|
| `RESEND_API_KEY` | Secret | کلید API سرویس Resend | ✅ |
| `TURNSTILE_SECRET_KEY` | Secret | کلید مخفی Turnstile | ✅ |
| `ADMIN_EMAIL` | Variable | ایمیل ادمین برای دریافت پیام‌ها | ✅ |
| `ALLOWED_ORIGINS` | Variable | دامنه‌های مجاز برای CORS | ✅ |
| `RATE_LIMIT_KV` | KV | نیم‌اسپیس برای محدودیت نرخ | ❌ |
| `R2_BUCKET` | R2 | باکت برای ذخیره فایل‌ها | ❌ |
| `R2_PUBLIC_URL` | Variable | URL عمومی R2 | ❌ |

## 🐛 عیب‌یابی

### خطای "RESEND_API_KEY تنظیم نشده است"
- مطمئن شوید که secret را با `wrangler secret put` تنظیم کرده‌اید.

### خطای CORS
- بررسی کنید که `ALLOWED_ORIGINS` در `wrangler.toml` شامل دامنه‌ای که درخواست می‌دهد باشد.

### خطای Turnstile (Invalid token)
- مطمئن شوید `TURNSTILE_SECRET_KEY` به درستی تنظیم شده است و با Site Key در فرانت‌اند مطابقت دارد.

## 📞 پشتیبانی

برای سوالات و مشکلات:
- ایمیل: info@mahdiarts.ir
- واتساپ: +989306880801

---

**ساخته شده توسط مهدی باغبان‌پور | MahdiArts.ir**

