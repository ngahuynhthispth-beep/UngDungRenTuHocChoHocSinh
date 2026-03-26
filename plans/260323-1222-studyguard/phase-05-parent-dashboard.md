# Phase 05: Parent Dashboard (Giao diện Phụ huynh)
Status: ⬜ Pending
Dependencies: Phase 02

## Objective
Xây dựng dashboard cho phụ huynh: quản lý học sinh, xem trạng thái real-time, nhận thông báo.

## Màn hình

### 5.1. Dashboard chính
```
┌─────────────────────────────┐
│  👋 Xin chào, [Tên PH]     │
│                             │
│  📚 CON CỦA BẠN:           │
│  ┌─────────────────────┐    │
│  │ 👦 Minh              │    │
│  │ Mã phòng: ABC123    │    │
│  │ Trạng thái: ✅ Đang  │    │
│  │ học (45 phút)        │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ 👧 Hoa               │    │
│  │ Mã phòng: XYZ789    │    │
│  │ Trạng thái: ⚫ Offline│    │
│  └─────────────────────┘    │
│                             │
│  [ ➕ Thêm học sinh ]       │
│                             │
│  📊 THỐNG KÊ HÔM NAY:     │
│  • Tổng thời gian học: 2h  │
│  • Vi phạm: 5 lần          │
│  • Tập trung: 78%          │
│                             │
│  [⚙️ Cài đặt] [🚪 Đăng xuất]│
└─────────────────────────────┘
```

### 5.2. Chi tiết buổi học (real-time)
```
┌─────────────────────────────┐
│  ← Quay lại    👦 Minh      │
│                             │
│  ✅ ĐANG HỌC               │
│  ⏱ 00:45:12                │
│                             │
│  Tập trung: ████████░░ 80% │
│                             │
│  📋 LỊCH SỬ BUỔI HỌC:     │
│  12:00 ✅ Bắt đầu học       │
│  12:15 ⚠️ Mất tập trung     │
│  12:16 ✅ Tiếp tục học       │
│  12:30 ❌ Rời ghế            │
│  12:31 ✅ Quay lại học       │
│                             │
└─────────────────────────────┘
```

## Implementation Steps
1. [ ] Tạo `dashboard.html` - Layout dashboard phụ huynh
2. [ ] API: GET `/api/students` - Lấy danh sách học sinh
3. [ ] API: POST `/api/students` - Thêm học sinh mới
4. [ ] Hiển thị card mỗi học sinh (tên, mã phòng, trạng thái)
5. [ ] Trang chi tiết buổi học (timeline các sự kiện)
6. [ ] Thống kê tóm tắt hôm nay
7. [ ] Form thêm học sinh mới
8. [ ] Responsive design cho mobile

## Files to Create
- `src/public/dashboard.html` - Parent dashboard
- `src/public/css/dashboard.css` - Dashboard styles
- `src/public/js/dashboard.js` - Dashboard logic
- `src/server/routes/students.js` - Student API routes
- `src/server/routes/sessions.js` - Session API routes

## Test Criteria
- [ ] Đăng nhập → thấy dashboard với danh sách con
- [ ] Thêm học sinh mới → sinh mã phòng
- [ ] Trạng thái real-time cập nhật khi con bật camera
- [ ] Timeline hiển thị đúng các sự kiện

---
Next Phase: phase-06-realtime.md
