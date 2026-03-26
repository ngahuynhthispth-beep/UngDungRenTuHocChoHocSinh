# Phase 04: Student Interface (Giao diện Học sinh)
Status: ⬜ Pending
Dependencies: Phase 01, Phase 03

## Objective
Xây dựng giao diện cho học sinh: nhập mã phòng, bật camera, hiển thị trạng thái, phát cảnh báo.

## Màn hình

### 4.1. Trang nhập mã phòng
```
┌─────────────────────────────┐
│      📚 StudyGuard          │
│                             │
│   Nhập mã phòng học:        │
│   ┌───────────────────┐     │
│   │  A B C 1 2 3      │     │
│   └───────────────────┘     │
│                             │
│   [ 🚀 Bắt đầu học ]       │
│                             │
└─────────────────────────────┘
```

### 4.2. Màn hình học tập (Camera đang chạy)
```
┌─────────────────────────────┐
│  ⏱ 00:45:12   ✅ ĐANG HỌC  │
│ ┌───────────────────────┐   │
│ │                       │   │
│ │    Camera Feed        │   │
│ │    (AI Overlay)       │   │
│ │                       │   │
│ └───────────────────────┘   │
│                             │
│  ████████████░░░░  75%      │
│  Thời gian tập trung        │
│                             │
│  [ ⏹ Kết thúc buổi học ]   │
└─────────────────────────────┘
```

### 4.3. Trạng thái cảnh báo (MÀN HÌNH ĐỎ)
```
┌─────────────────────────────┐
│ ▅▅▅▅▅▅ CẢNH BÁO ▅▅▅▅▅▅▅▅  │ ← Viền đỏ nhấp nháy
│ ┌───────────────────────┐   │
│ │                       │   │
│ │    Camera Feed        │   │
│ │                       │   │
│ └───────────────────────┘   │
│                             │
│  🔊 "Em hãy học bài        │
│      thật chăm chỉ!"       │
│                             │
│  ⚠️ Vi phạm: 3 lần         │
└─────────────────────────────┘
```

## Implementation Steps
1. [ ] Tạo `student.html` - Layout trang học sinh
2. [ ] CSS: trạng thái xanh (studying), vàng (distracted), đỏ (not studying)
3. [ ] CSS: Animation viền đỏ nhấp nháy khi cảnh báo
4. [ ] Tích hợp camera feed vào giao diện
5. [ ] Hiển thị timer buổi học (đếm thời gian)
6. [ ] Thanh tiến trình tập trung (focus bar %)
7. [ ] Implement Web Speech API - Phát "Em hãy học bài thật chăm chỉ"
8. [ ] Xử lý nhập mã phòng + validate
9. [ ] Nút kết thúc buổi học + lưu kết quả

## Files to Create
- `src/public/student.html` - Student page
- `src/public/css/student.css` - Student styles
- `src/public/js/student.js` - Student logic
- `src/public/js/voiceAlert.js` - Voice alert system

## Test Criteria
- [ ] Nhập mã phòng đúng → vào phòng học
- [ ] Nhập mã phòng sai → báo lỗi
- [ ] Camera hiển thị đúng, full-width trên mobile
- [ ] Trạng thái xanh/vàng/đỏ chuyển đổi mượt
- [ ] Cảnh báo giọng nói phát rõ ràng bằng tiếng Việt
- [ ] Viền đỏ nhấp nháy khi vi phạm
- [ ] Timer chạy đúng

---
Next Phase: phase-05-parent-dashboard.md
