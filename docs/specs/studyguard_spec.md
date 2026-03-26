# 📋 SPECS: StudyGuard - App Giám Sát Học Sinh Tự Học

**Ngày tạo:** 23/03/2026
**Dựa trên:** BRIEF.md từ /brainstorm

---

## 1. Executive Summary

StudyGuard là Web App giúp phụ huynh giám sát con tự học ở nhà thông qua camera điện thoại + AI. App nhận diện hành vi học sinh theo thời gian thực, phát cảnh báo bằng giọng nói khi mất tập trung, đồng thời gửi thông báo cho phụ huynh.

## 2. User Stories

### Phụ huynh (Primary User)
- **PH-01:** Là phụ huynh, tôi muốn đăng ký tài khoản và thêm thông tin con
- **PH-02:** Là phụ huynh, tôi muốn xem con có đang học hay không (real-time)
- **PH-03:** Là phụ huynh, tôi muốn nhận thông báo khi con mất tập trung
- **PH-04:** Là phụ huynh, tôi muốn xem dashboard tổng quan trạng thái học của con

### Học sinh (Secondary User)
- **HS-01:** Là học sinh, tôi mở camera và bắt đầu buổi học
- **HS-02:** Là học sinh, tôi nghe cảnh báo khi mất tập trung để điều chỉnh
- **HS-03:** Là học sinh, tôi thấy màn hình đỏ nhấp nháy khi vi phạm

## 3. Hệ Thống Nhận Diện Hành Vi

### 3 Trạng thái chính:

| Trạng thái | Điều kiện AI | Phản hồi |
|------------|-------------|----------|
| ✅ ĐANG HỌC | Pose: tay di chuyển vùng bàn + đầu cúi | Thanh trạng thái xanh |
| ⚠️ MẤT TẬP TRUNG | Ngồi im >15s HOẶC đầu ngẩng lên lâu | Nhắc nhở giọng nói + thông báo PH |
| ❌ KHÔNG HỌC | Rời ghế / quay lưng / không thấy người | Cảnh báo ĐỎ + giọng nói + thông báo PH |

### Thuật toán phát hiện (MediaPipe Pose):
1. **Phát hiện Pose** → 33 keypoints (vai, khuỷu tay, cổ tay, đầu...)
2. **Tính toán góc** → Đầu cúi (nose vs shoulders), tay trên bàn (wrist position)
3. **Theo dõi chuyển động** → So sánh vị trí keypoints giữa các frame
4. **Phân loại trạng thái** → Dựa trên rules engine

## 4. Luồng Hoạt Động Chính

```
┌─────────── PHÍA HỌC SINH ───────────┐    ┌─── PHÍA PHỤ HUYNH ───┐
│                                       │    │                       │
│  Mở web → Đăng nhập bằng mã phòng    │    │  Đăng nhập tài khoản  │
│       ↓                               │    │       ↓               │
│  Bật camera → AI bắt đầu phân tích   │───→│  Dashboard hiện       │
│       ↓                               │    │  trạng thái real-time │
│  ┌── ĐANG HỌC → Thanh xanh ──┐      │    │       ↓               │
│  │                             │      │    │  Nhận thông báo       │
│  │  MẤT TẬP TRUNG (>15s)     │      │───→│  khi con vi phạm      │
│  │  → Giọng nói nhắc nhở     │      │    │                       │
│  │                             │      │    │  Xem lịch sử buổi học │
│  │  KHÔNG HỌC (rời ghế)      │      │    │                       │
│  │  → Cảnh báo đỏ + giọng    │      │    └───────────────────────┘
│  └────────────────────────────┘      │
│                                       │
│  Kết thúc buổi học → Lưu kết quả     │
└───────────────────────────────────────┘
```

## 5. Tính năng MVP

### 🚀 Bắt buộc có:
1. Đăng ký/Đăng nhập phụ huynh
2. Tạo "phòng học" cho con (mã phòng)
3. Màn hình học sinh: bật camera + AI phân tích
4. Nhận diện 3 trạng thái hành vi
5. Cảnh báo giọng nói tiếng Việt
6. Cảnh báo đỏ trên màn hình
7. Dashboard phụ huynh (real-time)
8. Thông báo cho phụ huynh khi vi phạm

### 🎁 Phase 2:
- Báo cáo/thống kê
- Lịch sử buổi học
- Hệ thống thưởng/sao

## 6. Tech Stack

| Layer | Công nghệ | Lý do |
|-------|-----------|-------|
| Frontend | HTML + CSS + JavaScript (Vanilla) | Nhẹ, nhanh, dễ maintain |
| AI Engine | MediaPipe Pose Landmarker | Chạy trên browser, miễn phí, chính xác |
| Voice Alert | Web Speech API (SpeechSynthesis) | Có sẵn trong browser, hỗ trợ tiếng Việt |
| Real-time | WebSocket (Socket.io) | Gửi trạng thái real-time giữa 2 thiết bị |
| Backend | Node.js + Express | Nhẹ, phù hợp real-time |
| Database | SQLite (better-sqlite3) | Đơn giản, không cần server riêng |
| Auth | Session-based (express-session) | Đơn giản cho MVP |

## 7. Tình huống đặc biệt

| Tình huống | Xử lý |
|------------|--------|
| Camera bị che/tối | Cảnh báo "Không thể nhận diện" |
| Mất mạng | Lưu tạm rồi sync lại khi có mạng |
| Học sinh tắt camera | Thông báo phụ huynh ngay |
| Nhiều người xuất hiện | Chỉ theo dõi người gần nhất |
| Điện thoại hết pin | Gửi cảnh báo trước khi tắt |
