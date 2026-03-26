# Phase 07: Integration & Testing
Status: ⬜ Pending
Dependencies: All previous phases

## Objective
Kết nối tất cả các phần, test end-to-end, fix bug, polish UI.

## Integration Checklist
1. [ ] Flow hoàn chỉnh: Đăng ký → Đăng nhập → Tạo phòng → Học sinh vào phòng
2. [ ] AI Camera → Status Update → WebSocket → Dashboard cập nhật
3. [ ] Vi phạm → Cảnh báo giọng nói + Màn hình đỏ + Thông báo PH
4. [ ] Kết thúc buổi học → Lưu summary vào DB → Hiển thị trên Dashboard

## End-to-End Test Scenarios

### Scenario 1: Happy Path
1. PH đăng ký tài khoản
2. PH đăng nhập, thêm 1 học sinh "Minh"
3. HS mở trang student, nhập mã phòng
4. Camera bật, AI phát hiện ngồi học → Dashboard PH hiện "Đang học"
5. HS ngừng viết >15s → Cảnh báo giọng nói + PH nhận thông báo
6. HS viết tiếp → Trạng thái quay về "Đang học"
7. HS rời ghế → Cảnh báo đỏ + PH nhận thông báo
8. HS nhấn "Kết thúc" → Summary buổi học hiện trên Dashboard

### Scenario 2: Edge Cases
- [ ] Camera permission denied → Hiện hướng dẫn bật camera
- [ ] Ánh sáng yếu → "Không thể nhận diện, vui lòng bật đèn"
- [ ] Mất mạng giữa chừng → Reconnect + sync data
- [ ] 2 tab cùng lúc → Chỉ cho phép 1 session
- [ ] Đóng tab → PH nhận thông báo "Học sinh đã tắt camera"

## Polish & Optimization
5. [ ] Responsive design: test trên iPhone SE, Samsung Galaxy
6. [ ] Performance: MediaPipe chạy mượt (>15 FPS)
7. [ ] CSS animations mượt (không giật)
8. [ ] Loading states cho mọi async operation

## Files to Modify
- Tất cả files từ Phase 01-06 (bug fixes, polish)

## Test Criteria
- [ ] Happy Path chạy hoàn chỉnh không lỗi
- [ ] Edge cases xử lý đúng
- [ ] Mobile responsive trên 3+ thiết bị
- [ ] Không có console errors

---
🎉 HOÀN THÀNH! App sẵn sàng để deploy.
