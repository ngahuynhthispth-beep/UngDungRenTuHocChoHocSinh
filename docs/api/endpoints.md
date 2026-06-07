# API Documentation - StudyGuard Rankings

Ngày cập nhật: 2026-04-10
Base URL: `http://localhost:3000/api/admin/system`

---

## 🏆 Rankings & Leaderboard

### GET `/rankings`
Lấy dữ liệu bảng xếp hạng ngày (tuần hiện tại), Top 15 tuần này và Bảng Vàng (Tuần trước).

**Phản hồi (200 OK):**
```json
{
  "success": true,
  "rankings": {
    "2026-04-10": [ { "name": "...", "total_focus_seconds": 3600, ... } ]
  },
  "weeklyTop7": [ { "name": "...", "total_focus_seconds": 15000, ... } ],
  "hallOfFame": [ { "student_name": "...", "total_focus_seconds": 25000, "rank": 1, ... } ]
}
```

---

## 🧹 Maintenance

### POST `/reset-weekly`
Thực hiện reset thủ công hệ thống vinh danh. 
1. Tổng hợp Top 15 tuần này vào bảng `weekly_winners`.
2. Xoá sạch bảng `study_sessions` và `violations`.

**Yêu cầu:** Quyền Admin (`is_admin: true`).

**Phản hồi (200 OK):**
```json
{
  "success": true,
  "message": "Hệ thống đã reset thành công. Đã vinh danh 15 học sinh cho tuần bắt đầu từ 2026-04-06.",
  "data": { "count": 15, "week_start": "2026-04-06" }
}
```

---

## ⏰ Automatic Tasks
- **Weekly Reset**: Tự động chạy định kỳ mỗi giờ. Nếu phát hiện là ngày Thứ Hai (00:00) và chưa reset cho tuần mới, hệ thống sẽ tự động gọi logic Reset.
