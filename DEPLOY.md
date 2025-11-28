# 🚀 راهنمای Deploy پروژه MahdiArts.ir

این راهنما مراحل کامل استقرار پروژه در GitHub Pages و تنظیم Cloudflare Workers را پوشش می‌دهد.

## 📦 مراحل Deploy روی GitHub Pages

### 1. ایجاد Repository در GitHub
1. به [GitHub.com](https://github.com) بروید
2. روی "New repository" کلیک کنید
3. نام repository را وارد کنید (مثلاً `mahdiarts.ir`)
4. Repository را **Public** کنید (برای GitHub Pages رایگان)
5. روی "Create repository" کلیک کنید

### 2. اتصال به GitHub و Push
```bash
# اضافه کردن remote repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# تغییر نام branch به main (اختیاری)
git branch -M main

# Push به GitHub
git push -u origin main
```

### 3. فعال‌سازی GitHub Pages
1. به Settings > Pages بروید
2. Source را روی "Deploy from a branch" تنظیم کنید
3. Branch را "main" و folder را "/ (root)" انتخاب کنید
4. Save کنید
5. بعد از چند دقیقه، سایت شما در `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME` در دسترس خواهد بود

## ☁️ تنظیمات Cloudflare Worker

### 1. نصب Wrangler CLI
```bash
npm install -g wrangler
```

### 2. Login به Cloudflare
```bash
wrangler login
```

### 3. تنظیم Environment Variables
در Cloudflare Dashboard:
- Workers & Pages > Your Worker > Settings > Variables
- متغیرهای زیر را اضافه کنید:

| متغیر | نوع | توضیحات | الزامی |
|------|-----|---------|--------|
| `RESEND_API_KEY` | Secret | کلید API سرویس Resend | ✅ |
| `ADMIN_EMAIL` | Variable | ایمیل ادمین برای دریافت پیام‌ها | ✅ |
| `TURNSTILE_SECRET_KEY` | Secret | کلید مخفی Cloudflare Turnstile | ✅ |
| `ALLOWED_ORIGINS` | Variable | دامنه‌های مجاز برای CORS (با کاما جدا شوند) | ✅ |
| `RATE_LIMIT_KV` | KV | نیم‌اسپیس KV برای محدودیت نرخ ارسال | ❌ |
| `R2_BUCKET` | R2 | باکت R2 برای ذخیره فایل‌های آپلودی | ❌ |

### 4. Deploy Worker
```bash
# تست در محیط لوکال
wrangler dev

# استقرار نهایی
wrangler deploy --env production
```

### 5. تنظیم Route در Cloudflare
- Workers & Pages > Routes
- Route را تنظیم کنید: `mahdiarts.ir/api/contact`
- Worker مربوطه را انتخاب کنید

## 🌐 تنظیمات Cloudflare برای دامنه

### 1. DNS Settings
- A Record: `@` → `192.0.2.1` (Proxied)
- CNAME Record: `www` → `mahdiarts.ir` (Proxied)

### 2. SSL/TLS
- Settings > SSL/TLS
- Encryption mode: **Full (strict)**

### 3. Caching
- Caching > Configuration
- Browser Cache TTL: 4 hours
- Edge Cache TTL: 2 hours

### 4. Page Rules
- Page Rules > Create Page Rule
- URL: `mahdiarts.ir/*`
- Settings: Cache Level: Standard, Browser Cache TTL: 4 hours

## ✅ تست نهایی

### 1. تست فرم تماس
- فرم را پر کنید و ارسال کنید
- بررسی کنید که ایمیل‌ها از طریق Resend ارسال می‌شوند
- بررسی کنید که Turnstile به درستی کار می‌کند

### 2. تست چندزبانه
- زبان‌های مختلف را تست کنید
- بررسی کنید که RTL برای فارسی و عربی کار می‌کند

### 3. تست SEO
- از [Google Search Console](https://search.google.com/search-console) استفاده کنید
- sitemap.xml را submit کنید

## ⚠️ نکات مهم

1. **Worker URL**: بعد از deploy Worker، URL را در `assets/js/contact-form.js` بررسی کنید
2. **Turnstile**: کلیدهای Turnstile را در HTML (Site Key) و Worker (Secret Key) تنظیم کنید
3. **Email Service**: سرویس Resend برای ارسال ایمیل استفاده می‌شود (Mailgun حذف شده است)
4. **Backup**: به‌طور منظم از پروژه backup بگیرید

## 📞 پشتیبانی

برای سوالات و مشکلات:
- Email: info@mahdiarts.ir
- WhatsApp: +989306880801

---
**ساخته شده با ❤️ توسط مهدی باغبان‌پور**

