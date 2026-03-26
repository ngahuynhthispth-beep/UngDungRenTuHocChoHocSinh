param ()
Write-Host "Dang cap nhat ban ve (Them goi Mien Phi de luot qua buoc add The)..." -ForegroundColor Yellow
cd c:\Users\Admin\Desktop\UngdungRenTuHocChoHocSinh
git add render.yaml
git commit -m "Set plan to free"
git push -u origin main
Write-Host "Da xong! Nhan Enter de tat." -ForegroundColor Green
Read-Host
