# Business Rules (Quy chuẩn hoạt động StudyGuard)

Dưới đây là các quy chuẩn quan trọng được áp dụng trong ứng dụng để đảm bảo hiệu quả giám sát và động lực học tập.

## 🎯 1. Quy chuẩn AI Giám sát (Strict Mode)

| Hành vi | Timeout (Thời gian chờ) | Trạng thái hiển thị |
|---------|---------|-------------------|
| **Đang học (Lý tưởng)** | -- | ✅ Đang học |
| **Nhìn màn hình (Active)** | 120s (2 phút) | ✅ Đang học |
| **Nhìn màn hình (Idle)** | 45s | ⚠️ Mất tập trung |
| **Chống cằm (Hand on Face)** | 20s | ⚠️ Mất tập trung |
| **Múa máy tay chân (Agitated)** | 7s | ⚠️ Mất tập trung |
| **Quay mặt trái/phải (Side Look)** | 15s | ⚠️ Mất tập trung |
| **Không thấy người (No Pose)** | 20s | ❌ Không học |

## 🎁 2. Quy tắc Nhận thưởng (Reward Policy)

Để nhận được hộp quà bí mật (**Blind Bag**) khi kết thúc buổi học, học sinh cần thỏa mãn đồng thời 2 điều kiện:

1.  **Thời gian học tối thiểu**: Phải học ít nhất **15 phút** (900 giây).
2.  **Số lần vi phạm**: Không được quá **1 lần** (vi phạm 0 hoặc 1 lần thì được nhận thưởng).

### Danh mục quà tặng ngẫu nhiên:
- 🎨 Tặng hộp bút màu mới
- 🤖 Được tặng Robot đồ chơi
- ♟️ Bộ cờ vua xịn xò
- ⏰ Đồng hồ báo thức để dậy sớm
- 📒 Cuốn sổ tay ghi chép đẹp
- 🧸 Gấu bông nhỏ xinh
- 🍦 Được đi ăn kem
- 🍕 Được đi ăn pizza
- 🎨 Được đi tô tượng

## 🔐 3. Quy trình Bảo mật (DevOps)
- Mọi bản cập nhật code phải được đẩy lên GitHub nhánh `main` và deploy qua Render.
- Sử dụng file `.env` để lưu trữ các biến môi trường nhạy cảm (DATABASE_URL, SESSION_SECRET).
