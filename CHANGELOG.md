# Changelog

Tất cả những thay đổi quan trọng đối với dự án StudyGuard (UngdungRenTuHocChoHocSinh) sẽ được ghi lại tại đây.

---

## [2026-04-10] - v1.5.0 (Weekly Reset & Hall of Fame)

### 🚀 Added
- **Automatic Weekly Reset**: Tự động reset bảng vinh danh vào 00:00 sáng Thứ Hai hàng tuần.
- **Hall of Fame (Bảng Vàng)**: Lưu trữ và hiển thị Top 15 học sinh xuất sắc của tuần trước.
- **Manual Reset**: Thêm nút "Reset Tuần Mới" cho giáo viên để chủ động làm mới hệ thống.
- **Data Cleanup**: Tính năng xoá sạch dữ liệu học tập tuần cũ (study_sessions & violations) sau khi đã lưu vinh danh.

---

## [2026-04-10] - v1.4.0 (Leaderboard Expansion)

### 🚀 Added
- **Leaderboard Expansion**: Mở rộng bảng vinh danh từ Top 10 lên **Top 15** học sinh có thời gian học tập tập trung nhất.
- **UI Update**: Cập nhật nhãn hiển thị tại Teacher Dashboard để đồng bộ với số lượng vinh danh thực tế.
- **Business Rules & API**:
  ```json
  [
    { "id": "BR-03", "name": "Institutional Access", "logic": "Admin/Teacher accounts (is_admin=true) to /teacher-dashboard" },
    { "id": "BR-04", "name": "Leaderboard Logic", "logic": "Rank students by daily focused study time with medals (Gold, Silver, Bronze)" },
    { "id": "BR-05", "name": "Weekly Reset Policy", "logic": "Reset every Monday 00:00. Save Top 15 to weekly_winners, then clear study_sessions." }
  ],
  "api_endpoints": [
    { "path": "/api/students/join", "desc": "Học sinh vào phòng" },
    { "path": "/teacher-dashboard", "desc": "Giao diện quản lý tập trung cho giáo viên" },
    { "path": "/api/admin/system/overview", "desc": "Thống kê tổng quát" },
    { "path": "/api/admin/system/rankings", "desc": "Lấy bảng xếp hạng ngày, tuần và Hall of Fame" },
    { "path": "/api/admin/system/reset-weekly", "desc": "Reset thủ công bảng vinh danh (Admin only)" },
    { "path": "/api/analytics/daily", "desc": "Lấy dữ liệu tập trung hàng ngày cho Leaderboard" }
  ]
  ```

---

## [2026-03-31] - v1.3.0 (Teacher Dashboard & Admin Access)

### 🚀 Added
- **Teacher Dashboard**: Giao diện quản trị viên chuyên nghiệp với Sidebar, giám sát Real-time toàn hệ thống và thống kê tổng quát.
- **Role-based Redirection**: Tự động chuyển hướng người dùng có quyền `is_admin` sang `/teacher-dashboard` sau khi đăng nhập.

### 🐛 Fixed
- **Authentication**: Sửa lỗi tài khoản Giáo viên bị chuyển hướng nhầm về trang Phụ huynh do thiếu quyền `is_admin` trong cơ sở dữ liệu.
- **Production Access**: Khôi phục quyền truy cập Admin cho tài khoản `admin` trên môi trường Production (Neon Postgres).

---

## [2026-03-28] - v1.2.0 (Strict AI & Rewards Update)

### 🚀 Added
- **AI Behavior Engine (Strict Mode)**:
  - **Hand on Face (Chống cằm)**: Tự động phát hiện khi cổ tay ở gần mặt (>20s).
  - **Idle Staring (Ngồi im)**: Cảnh báo sau 45s nếu không có hoạt động tay/miệng khi nhìn màn hình.
  - **Unified Agitation (Múa máy)**: Cảnh báo sau 7s bất kể hướng nhìn.
- **Rewards Expansion**:
  - Thêm 6 món quà mới (Robot, Cờ vua, Hộp bút màu, Đồng hồ báo thức, Sổ tay, Gấu bông).

### ⚙️ Changed
- **Reward Policy**: Giảm thời gian học tối thiểu để nhận quà từ **30 phút** xuống **15 phút** (theo yêu cầu của người dùng).
- **Lookup Threshold**: Giảm thời gian nhìn màn hình tối đa (staring) xuống còn 2 phút (cho tích cực) và 45s (cho thụ động).

### 🐛 Fixed
- **DevOps**: Lỗi PowerShell `ExecutionPolicy` ngăn cản chạy file `push2.ps1` để deploy.
- **Git**: Đồng bộ hóa thành công nhánh `main` và đẩy code lên Render.

---

## [2026-03-26] - v1.1.0
- Triển khai Dashbaord cho PH và Super Admin.
- Tích hợp PostgreSQL cho Production.
- Branding: Thêm chữ ký bản quyền "H.NGA".
