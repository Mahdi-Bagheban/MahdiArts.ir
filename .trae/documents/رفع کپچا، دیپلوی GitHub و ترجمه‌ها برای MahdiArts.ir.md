## تشخیص فعلی
- کپچا: ویجت Turnstile در `index.html:788–800` وجود دارد و اسکریپت در `index.html:899` لود می‌شود. خطای کنسول «Turnstile error 400020» (Invalid sitekey) مطابق مستندات Cloudflare است.
- توکن کپچا در کلاینت جمع‌آوری می‌شود (`assets/js/contact-form.js:402–413`) و به Worker ارسال می‌گردد.
- سمت سرور، اعتبارسنجی توکن وابسته به `env.TURNSTILE_SECRET_KEY` است (`workers/contact-form.js:662–676`). در `wrangler.toml` هیچ مقدار برای این Secret تنظیم نشده است.
- GitHub Pages workflow وجود دارد (`.github/workflows/deploy.yml`) و smoke test بلافاصله پس از دیپلوی، دو URL را بررسی می‌کند. شکست‌های اخیر محتمل است به‌دلیل آماده‌سازی دیرهنگام Pages/CDN یا artifact mis‑match.
- i18n فعال است (`assets/js/i18n.js`) و فایل‌های ترجمه برای 10 زبان موجود‌اند؛ پیام‌های کپچا هنوز کلیدهای اختصاصی ندارند و در جاوااسکریپت به‌صورت متن ثابت استفاده شده‌اند.

## برنامه رفع مشکل کپچا
1) ایجاد/بازبینی ویجت Turnstile در داشبورد Cloudflare:
- تعریف دامنه‌های مجاز: `mahdiarts.ir` و `www.mahdiarts.ir`.
- دریافت `sitekey` جدید و فعال.
2) جایگزینی `data-sitekey` در `index.html:792–799` با sitekey جدید؛ حفظ سوییچ لوکال به test‑key در `index.html:887–896`.
3) تنظیم Secret سمت سرور:
- مقداردهی `TURNSTILE_SECRET_KEY` در محیط‌های dev و production: `wrangler secret put TURNSTILE_SECRET_KEY --env production` و برای dev.
- تأیید کارکرد verify (`workers/contact-form.js:662–676`).
4) بهبود هندلینگ خطا در کلاینت:
- استفاده از کلیدهای i18n به‌جای متن‌های ثابت در:
  - «لطفاً کپچا را تأیید کنید» (`assets/js/contact-form.js:407–413`).
  - پیام خطای بارگذاری کپچا (`assets/js/contact-form.js:344–348`).
- افزودن راهنمایی برای افزونه‌های مسدودکننده و شبکه (Blocked by client) در پیام‌ها.
5) سازگاری چندزبانه Turnstile:
- تنظیم `data-language` بر اساس زبان فعال از `window.i18n`؛ در زمان رندر، مقداردهی خودکار زبان ویجت.

## برنامه رفع مشکلات دیپلوی GitHub Pages
1) پایدارسازی smoke test:
- افزایش تعداد تلاش‌ها و فاصله زمانی (مثلاً 20 تلاش با 9 ثانیه)، و ثبت بدنه پاسخ محدود برای دیباگ.
- در تست دامنه سفارشی فقط وضعیت 200 و وجود نشانه‌های Turnstile را بررسی کنیم؛ تطبیق SHA فقط روی `page_url` باقی بماند.
2) اطمینان از پیکربندی Pages:
- Settings → Pages: Source = GitHub Actions.
- Actions permissions = خواندن/نوشتن برای Pages و OIDC فعال.
3) بررسی artifact:
- تأیید اجرای «Upload artifact» قبل از «Deploy» و نام پیش‌فرض `github-pages`؛ مسیر `path: '.'` صحیح است.
4) مستندسازی شکست‌های 3 دیپلوی اخیر:
- استخراج لاگ کامل job و مرحله‌ای (Checkout/Upload/Deploy/Smoke) و افزودن خلاصه علّت محتمل (کَش یا propagation).

## برنامه ترجمه پیام‌های سیستم
1) تعریف کلیدهای جدید (نمونه نام‌ها):
- `contact.form.captcha.verifyRequired`, `captcha.loadingError`, `captcha.expired`, `captcha.blockedHint`, `captcha.invalidSiteKey`, `captcha.domainNotAllowed`.
2) افزودن ترجمه دقیق برای همه زبان‌های موجود در `assets/i18n/*.json`.
3) جایگزینی متن‌های ثابت در `assets/js/contact-form.js` با `i18n.t(...)`.
4) تضمین نمایش پیام‌ها بر اساس زبان فعال؛ استفاده از event `languageChanged` در صورت نیاز برای بروزرسانی ویجت.

## تست‌های نهایی
- مرورگرها: Chrome، Firefox، Edge، Safari و Brave؛ حالت معمولی و private.
- سناریوها:
  - لود و نمایش ویجت؛ حل چالش؛ دریافت توکن؛ ارسال فرم؛ پاسخ 200 از Worker.
  - خطاهای رایج: invalid sitekey، domain not allowed، blocked by client؛ مشاهده پیام‌های ترجمه شده.
- API سرور: لاگ verify در Worker و پاسخ‌های خطا/موفقیت.
- GitHub Pages: اجرای workflow؛ عبور smoke test روی `page_url` و `https://mahdiarts.ir/`.

## خروجی‌ها
- کپچا فعال روی دامنه اصلی و قابل مشاهده/تأیید.
- دیپلوی موفق GitHub Pages با smoke test پایدار و لاگ‌های مستند.
- ترجمه‌های کامل پیام‌های کپچا و فرم در 10 زبان و نمایش خودکار بر اساس زبان انتخابی.

## تأیید موردنیاز
- تأیید/ارسال `sitekey` جدید و فعال.
- تأیید دسترسی/افزودن `TURNSTILE_SECRET_KEY` در Cloudflare.
- اجازه به‌روزرسانی `deploy.yml` برای اصلاح smoke test و ثبت لاگ بیشتر.
