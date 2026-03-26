# Phase 03: AI Camera Engine
Status: ⬜ Pending
Dependencies: Phase 01

## Objective
Tích hợp MediaPipe Pose Landmarker vào browser. Xây dựng thuật toán nhận diện 3 trạng thái: Đang học / Mất tập trung / Không học.

## Kiến trúc AI Engine

```
Camera (getUserMedia)
    ↓
MediaPipe Pose Landmarker
    ↓ (33 keypoints mỗi frame)
Behavior Analyzer
    ├── Head Position (nose, ears vs shoulders)
    ├── Hand Movement (wrist tracking over time)
    ├── Body Presence (visibility of keypoints)
    └── Motion Delta (so sánh frame hiện tại vs trước)
    ↓
State Machine
    ├── STUDYING (xanh)
    ├── DISTRACTED (vàng, >15s idle)
    └── NOT_STUDYING (đỏ)
```

## Thuật toán nhận diện chi tiết

### 1. ĐANG HỌC (STUDYING):
- Nose Y-position > Shoulder Y-position (đầu cúi)
- Wrist keypoints có di chuyển (delta > threshold)
- Cả hai vai (shoulders) visible
- Ít nhất 1 wrist visible

### 2. MẤT TẬP TRUNG (DISTRACTED):
- Body visible NHƯNG wrist motion delta < threshold liên tục >15s
- HOẶC head angle nhìn lên/sang ngang quá lâu (>10s)

### 3. KHÔNG HỌC (NOT_STUDYING):
- Body keypoints visibility < threshold (rời ghế)
- HOẶC shoulders quay ngược (quay lưng)
- HOẶC không phát hiện pose > 5s

## Implementation Steps
1. [ ] Tích hợp MediaPipe Pose Landmarker CDN
2. [ ] Tạo `src/public/js/camera.js` - Bật camera, lấy video stream
3. [ ] Tạo `src/public/js/poseDetector.js` - Chạy MediaPipe, lấy keypoints
4. [ ] Tạo `src/public/js/behaviorAnalyzer.js` - Phân tích keypoints → trạng thái
5. [ ] Implement Head Position Detection (đầu cúi vs ngẩng)
6. [ ] Implement Hand Movement Tracking (tay viết vs im)
7. [ ] Implement Body Presence Detection (có người vs không)
8. [ ] Implement Idle Timer (đếm 15s ngồi im)
9. [ ] Tạo State Machine (chuyển trạng thái mượt, tránh nhấp nháy)
10. [ ] Debug: hiển thị overlay skeleton lên video

## Files to Create
- `src/public/js/camera.js` - Camera management
- `src/public/js/poseDetector.js` - MediaPipe integration
- `src/public/js/behaviorAnalyzer.js` - Behavior classification
- `src/public/js/stateMachine.js` - State management

## Test Criteria
- [ ] Camera bật thành công trên Chrome mobile
- [ ] MediaPipe detect được pose (hiện skeleton overlay)
- [ ] Đầu cúi → STUDYING, đầu ngẩng >10s → DISTRACTED
- [ ] Tay viết → STUDYING, tay im >15s → DISTRACTED
- [ ] Rời ghế → NOT_STUDYING trong vòng 5s
- [ ] Không bị nhấp nháy trạng thái (state debounce)

---
Next Phase: phase-04-student-ui.md
