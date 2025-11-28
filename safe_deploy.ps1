# safe_deploy.ps1 - اسکریپت دپلوی امن با بک‌آپ‌گیری خودکار

# توقف اسکریپت در صورت بروز خطا
$ErrorActionPreference = 'Stop'

# 1. تولید نام برنچ بر اساس تاریخ و ساعت
$date = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"
$backupBranch = "backup/deploy-$date"

Write-Host "🚀 Starting Safe Deployment Process..." -ForegroundColor Cyan

# 2. بررسی وضعیت گیت
$gitStatus = git status --porcelain
if (-not $gitStatus) {
    Write-Host "ℹ️ No changes detected in files." -ForegroundColor Yellow
}

# 3. ایجاد برنچ بک‌آپ از وضعیت فعلی
Write-Host "📦 Creating backup branch: $backupBranch" -ForegroundColor Green
git checkout -b $backupBranch

# 4. کامیت تغییرات (اگر تغییری باشد)
if ($gitStatus) {
    Write-Host "💾 Committing changes to backup branch..." -ForegroundColor Green
    git add .
    git commit -m "Backup before deploy: $date - Updated documentation and configs"
}

# 5. ارسال برنچ بک‌آپ به گیت‌هاب (ذخیره امن)
Write-Host "☁️ Pushing backup branch to remote..." -ForegroundColor Green
git push origin $backupBranch

# 6. بازگشت به Main و ادغام تغییرات
Write-Host "🔄 Switching back to main and merging..." -ForegroundColor Green
git checkout main
# دریافت آخرین تغییرات سرور برای جلوگیری از تداخل
Write-Host "⬇️ Pulling latest main..." -ForegroundColor Green
git pull origin main 
Write-Host "🔀 Merging backup branch..." -ForegroundColor Green
git merge $backupBranch

# 7. ارسال تغییرات Main به گیت‌هاب
Write-Host "☁️ Pushing main branch..." -ForegroundColor Green
git push origin main

# 8. دپلوی نهایی به Cloudflare
Write-Host "🚀 Deploying to Cloudflare Production..." -ForegroundColor Cyan
npm run deploy:prod

Write-Host "✅ Deployment and Backup Completed Successfully!" -ForegroundColor Green
