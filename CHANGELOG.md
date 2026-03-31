# Changelog

Tất cả những thay đổi quan trọng đối với dự án StudyGuard (UngdungRenTuHocChoHocSinh) sẽ được ghi lại tại đây.

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
