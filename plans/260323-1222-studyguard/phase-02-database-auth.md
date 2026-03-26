# Phase 02: Database & Authentication
Status: ⬜ Pending
Dependencies: Phase 01

## Objective
Tạo database SQLite, bảng users/rooms/sessions. Hệ thống đăng ký, đăng nhập, tạo phòng học.

## Database Schema

### Bảng `users` (Phụ huynh)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | INTEGER PK | Mã phụ huynh |
| username | TEXT | Tên đăng nhập |
| password_hash | TEXT | Mật khẩu đã mã hóa |
| display_name | TEXT | Tên hiển thị |
| created_at | DATETIME | Ngày tạo |

### Bảng `students` (Học sinh)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | INTEGER PK | Mã học sinh |
| parent_id | INTEGER FK | Mã phụ huynh |
| name | TEXT | Tên học sinh |
| room_code | TEXT UNIQUE | Mã phòng học (6 ký tự) |
| created_at | DATETIME | Ngày tạo |

### Bảng `study_sessions` (Buổi học)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | INTEGER PK | Mã buổi học |
| student_id | INTEGER FK | Mã học sinh |
| start_time | DATETIME | Giờ bắt đầu |
| end_time | DATETIME | Giờ kết thúc |
| total_focus_time | INTEGER | Tổng giây tập trung |
| total_distracted_time | INTEGER | Tổng giây mất tập trung |
| violation_count | INTEGER | Số lần vi phạm |

### Bảng `violations` (Vi phạm)
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | INTEGER PK | Mã vi phạm |
| session_id | INTEGER FK | Mã buổi học |
| type | TEXT | 'distracted' hoặc 'not_studying' |
| timestamp | DATETIME | Thời điểm vi phạm |
| duration | INTEGER | Thời lượng (giây) |

## Implementation Steps
1. [ ] Tạo `src/server/db.js` - Khởi tạo SQLite + tạo bảng
2. [ ] Tạo `src/server/routes/auth.js` - Register, Login, Logout
3. [ ] Hash password bằng bcrypt
4. [ ] Session management (express-session)
5. [ ] Tạo trang đăng ký (register.html)
6. [ ] Tạo trang đăng nhập (login.html)
7. [ ] API tạo phòng học cho học sinh (sinh mã 6 ký tự)
8. [ ] Middleware xác thực (auth middleware)

## Files to Create/Modify
- `src/server/db.js` - Database initialization
- `src/server/routes/auth.js` - Auth routes
- `src/server/middleware/auth.js` - Auth middleware
- `src/public/register.html` - Register page
- `src/public/login.html` - Login page
- `src/public/js/auth.js` - Client auth logic

## Test Criteria
- [ ] Đăng ký tài khoản mới thành công
- [ ] Đăng nhập thành công, redirect đến dashboard
- [ ] Mật khẩu sai → báo lỗi
- [ ] Tạo phòng học → sinh mã 6 ký tự

---
Next Phase: phase-03-ai-camera.md
