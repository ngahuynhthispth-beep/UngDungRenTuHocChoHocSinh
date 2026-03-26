# 💡 BRIEF: StudyGuard - App Giám Sát Học Sinh Tự Học

**Ngày tạo:** 23/03/2026

---

## 1. VẤN ĐỀ CẦN GIẢI QUYẾT

Phụ huynh không thể luôn ở nhà giám sát con học bài. Trẻ em (đặc biệt tiểu học, THCS) dễ mất tập trung khi tự học: chơi đồ chơi, vẽ linh tinh, nói chuyện, hoặc ngồi thẫn thờ. Phụ huynh cần một cách để **giám sát từ xa** và **nhắc nhở tự động** khi con không tập trung.

## 2. GIẢI PHÁP ĐỀ XUẤT

**Web App** sử dụng camera điện thoại + AI để:
- Nhận diện hành vi học sinh theo thời gian thực
- Phân loại hành vi: **Đúng** (đang học) vs **Sai** (không học)
- Tự động phát cảnh báo bằng giọng nói khi phát hiện hành vi "Sai"
- Gửi thông báo cho phụ huynh trên thiết bị khác

## 3. ĐỐI TƯỢNG SỬ DỤNG

- **Primary:** Phụ huynh - cài đặt, theo dõi từ xa, xem báo cáo
- **Secondary:** Học sinh tiểu học/THCS - đặt camera và tự học

## 4. CÁCH HOẠT ĐỘNG

```
📱 Điện thoại học sinh          ☁️ Server           📱 Điện thoại phụ huynh
┌─────────────────┐         ┌──────────┐        ┌─────────────────┐
│ Camera bật      │────────>│ AI phân  │───────>│ Dashboard       │
│ MediaPipe chạy  │         │ tích     │        │ theo dõi        │
│ trên trình duyệt│<────────│ hành vi  │        │ real-time       │
│                 │         └──────────┘        │                 │
│ ⚠️ Cảnh báo     │                             │ 🔔 Thông báo    │
│ bằng giọng nói  │                             │ khi con ko học  │
└─────────────────┘                             └─────────────────┘
```

### Hành vi được nhận diện:

| Hành vi | Phân loại | Cách nhận diện |
|---------|-----------|----------------|
| Viết bài (tay di chuyển trên bàn) | ✅ Đúng | Pose estimation - tay + đầu cúi |
| Đọc bài (đầu hướng sách) | ✅ Đúng | Pose estimation - đầu cúi, ít di chuyển |
| Chơi đồ chơi | ❌ Sai | Tay di chuyển bất thường, không hướng về bàn |
| Vẽ linh tinh | ❌ Sai | Pattern tay khác viết bài (vòng tròn, ziczac) |
| Nói chuyện | ❌ Sai | Phát hiện môi/hàm di chuyển liên tục |
| Ngồi im > 15 giây | ❌ Sai | Không có chuyển động đáng kể trong 15s |

## 5. TÍNH NĂNG

### 🚀 MVP (Bắt buộc có):
- [ ] **Camera Feed** - Bật camera, hiển thị hình ảnh học sinh
- [ ] **AI Nhận diện hành vi** - Dùng MediaPipe/TensorFlow.js phân tích pose
- [ ] **Phân loại Đúng/Sai** - Thuật toán phân tích hành vi từ pose data
- [ ] **Cảnh báo bằng giọng nói** - Phát "Em hãy học bài thật chăm chỉ" khi Sai
- [ ] **Cảnh báo đỏ trên màn hình** - Hiệu ứng đỏ nhấp nháy khi vi phạm
- [ ] **Timer ngồi im** - Đếm 15 giây không chuyển động → cảnh báo
- [ ] **Gửi thông báo cho phụ huynh** - Push notification hoặc hiển thị trên dashboard
- [ ] **Dashboard phụ huynh** - Xem trạng thái học sinh real-time
- [ ] **Đăng ký / Đăng nhập** - Tài khoản phụ huynh, liên kết với học sinh

### 🎁 Phase 2 (Làm sau):
- [ ] Báo cáo thống kê (bao nhiêu phút học, bao nhiêu lần vi phạm)
- [ ] Lịch sử học tập theo ngày/tuần/tháng
- [ ] Đặt lịch học (7h-8h tối phải ngồi học)
- [ ] Quản lý nhiều con (nhiều học sinh)
- [ ] Hệ thống thưởng/sao khi học tập trung tốt

### 💭 Backlog (Cân nhắc):
- [ ] Xem camera trực tiếp từ xa (live stream)
- [ ] Ghi lại video khi vi phạm
- [ ] AI nhận diện khuôn mặt (xác nhận đúng học sinh)
- [ ] Chế độ offline

## 6. CÔNG NGHỆ DỰ KIẾN

| Thành phần | Công nghệ | Lý do |
|------------|-----------|-------|
| Frontend | HTML/CSS/JavaScript | Web App, chạy trên mọi thiết bị |
| AI/Camera | **MediaPipe Pose Landmarker** | Chạy trực tiếp trên trình duyệt, không cần server AI, miễn phí |
| Pose Analysis | TensorFlow.js | Phân tích dữ liệu pose để xác định hành vi |
| Giọng nói | Web Speech API | Phát cảnh báo bằng giọng tiếng Việt |
| Thông báo | Web Push / WebSocket | Gửi cảnh báo real-time cho phụ huynh |
| Backend | Node.js + Express | API server |
| Database | SQLite / Firebase | Lưu tài khoản, lịch sử |

## 7. ƯỚC TÍNH ĐỘ KHÓ

### 🟢 DỄ LÀM (vài ngày):
- Giao diện Dashboard, Đăng ký/Đăng nhập
- Phát cảnh báo giọng nói
- Timer ngồi im 15 giây

### 🟡 TRUNG BÌNH (1-2 tuần):
- Tích hợp MediaPipe camera trong trình duyệt
- Dashboard phụ huynh real-time
- Hệ thống thông báo push

### 🔴 KHÓ (nhiều tuần):
- **Thuật toán phân loại hành vi** - Phân biệt viết bài vs vẽ linh tinh, đọc bài vs ngồi im
- **Độ chính xác AI** - Cần train/tune model cho từng trường hợp cụ thể

### ⚠️ Rủi ro cần lưu ý:
1. **Độ chính xác AI:** Phân biệt "viết bài" vs "vẽ linh tinh" rất khó vì pose tương tự → MVP nên đơn giản hóa: chỉ phát hiện **có chuyển động tay viết** vs **không hoạt động / rời khỏi bàn**
2. **Ánh sáng & góc camera:** AI hoạt động tốt khi ánh sáng đủ và camera ổn định
3. **Hiệu năng:** MediaPipe chạy trên trình duyệt tốn pin và CPU điện thoại
4. **Quyền riêng tư:** Video xử lý trên thiết bị, không gửi lên server → bảo mật tốt

## 8. ĐỀ XUẤT ĐƠN GIẢN HÓA CHO MVP

> **Em đề xuất:** Ở bản MVP, thay vì phân biệt chi tiết từng hành vi, mình tập trung vào **3 trạng thái chính**:

| Trạng thái | Điều kiện | Phản hồi |
|------------|-----------|----------|
| ✅ **ĐANG HỌC** | Tay di chuyển trên bàn + đầu cúi nhìn xuống | Không làm gì |
| ⚠️ **MẤT TẬP TRUNG** | Ngồi im > 15s HOẶC nhìn lên/sang ngang quá lâu | Nhắc nhở nhẹ |
| ❌ **KHÔNG HỌC** | Rời khỏi ghế HOẶC quay lưng HOẶC không thấy người | Cảnh báo đỏ + thông báo phụ huynh |

→ Cách này **đơn giản hơn**, **chính xác hơn**, và vẫn giải quyết được vấn đề chính!

## 9. BƯỚC TIẾP THEO

→ Chạy `/plan` để lên thiết kế chi tiết (database, API, giao diện)
