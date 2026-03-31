param ()
Write-Host "Dang chuan bi code... (Git Add & Commit)" -ForegroundColor Yellow
git add .
git commit -m "Update Teacher Dashboard and Monitoring"
Write-Host "Dang ket noi va day len lai Nhanh chinh (main)..." -ForegroundColor Cyan
git push -u origin main
Write-Host "Da thuc hien xong! Nhan Enter de tat cua so nay nha." -ForegroundColor Green
Read-Host
