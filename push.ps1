param ()
Write-Host "Dang chuan bi code... (Git Add & Commit)" -ForegroundColor Yellow
git add .
git commit -m "Update Teacher Dashboard and Monitoring"
Write-Host "Dang ket noi voi GitHub... Vui long cho cua so dang nhap hien ra..." -ForegroundColor Cyan
cd c:\Users\Admin\Desktop\UngdungRenTuHocChoHocSinh
git push -u origin main
Write-Host "Hoan tat quá trinh đẩy code! Nhan Enter de thoat." -ForegroundColor Green
Read-Host
