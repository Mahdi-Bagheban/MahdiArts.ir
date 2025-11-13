# گزارش شکست دیپلوی‌های اخیر GitHub Pages

## خلاصه
- الگوی شکست: آماده‌سازی دیرهنگام صفحه یا کش CDN و در نتیجه عدم دریافت وضعیت 200 در بازه کوتاه تست.
- مورد محتمل دیگر: عدم یافتن artifact مورد انتظار (`github-pages`) وقتی مرحله Upload اجرا نشده یا Pages به‌صورت Actions پیکربندی نشده است.

## جزییات هر دیپلوی

### دیپلوی 1
- مرحله: Smoke test
- نشانه‌ها: وضعیت‌های غیر 200 متوالی؛ محتوای اولیه خالی یا HTML ناقص.
- ریشه: تاخیر انتشار GitHub Pages پس از `deploy-pages`.

### دیپلوی 2
- مرحله: Deploy
- نشانه‌ها: پیام «artifact not found» برای `github-pages`.
- ریشه: عدم اجرای «Upload artifact» یا تنظیم نبودن Pages به حالت GitHub Actions.

### دیپلوی 3
- مرحله: Smoke test دامنه سفارشی
- نشانه‌ها: 200 دریافت نمی‌شود؛ محتمل به‌دلیل کش Cloudflare یا انتشار آهسته.
- ریشه: انتشار و کش در لبه‌ها؛ نیاز به تلاش‌های بیشتر و فاصله زمانی طولانی‌تر.

## اقدامات اصلاحی اعمال‌شده
- افزایش تلاش‌های smoke test به 20 بار با فاصله 9 ثانیه و چاپ بخشی از بدنه برای دیباگ.
- حفظ تطبیق `build_sha` فقط روی URL رسمی Pages؛ برای دامنه سفارشی صرفاً بررسی وجود ویجت کپچا و وضعیت 200.

## چک‌لیست پیکربندی
- Settings → Pages: Source = GitHub Actions.
- Repository → Actions permissions: مجوز نوشتن Pages + OIDC فعال.
- اجرای موفق مراحل: Checkout → Configure Pages → Upload artifact → Deploy → Smoke test.

## نحوه استخراج لاگ‌ها
- از صفحه Workflow Run: مراحل را باز کرده و بخش «View raw logs» را دانلود کنید.
- کلیدواژه‌ها: `Deploy to GitHub Pages`, `Upload artifact`, `page_url`, `curl`.

---
این گزارش به‌صورت دوره‌ای به‌روزرسانی می‌شود.
