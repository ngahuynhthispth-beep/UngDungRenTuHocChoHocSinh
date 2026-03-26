# Phase 06: Real-time Communication & Notifications
Status: ⬜ Pending
Dependencies: Phase 04, Phase 05

## Objective
Kết nối học sinh ↔ phụ huynh real-time qua WebSocket. Gửi thông báo khi vi phạm.

## Kiến trúc Real-time

```
📱 Học sinh (Socket.io client)
    │
    ├── emit('status_update', { state, timestamp })
    ├── emit('violation', { type, timestamp })
    ├── emit('session_start')
    └── emit('session_end', { summary })
    │
    ▼
☁️ Server (Socket.io server)
    │
    ├── Nhận event từ học sinh
    ├── Lưu vào database (violations, sessions)
    └── Forward event đến phụ huynh cùng room
    │
    ▼
📱 Phụ huynh (Socket.io client)
    │
    ├── on('status_update') → Cập nhật UI
    ├── on('violation') → Hiện thông báo 🔔
    ├── on('session_start') → Card chuyển online
    └── on('session_end') → Hiện summary
```

## Implementation Steps
1. [ ] Setup Socket.io server trong `server.js`
2. [ ] Room-based communication (mỗi học sinh = 1 room)
3. [ ] Student emits: status_update, violation, session_start, session_end
4. [ ] Server receives + saves to DB + forwards to parent
5. [ ] Parent receives: cập nhật UI real-time
6. [ ] Notification system: hiện popup/toast khi con vi phạm
7. [ ] Reconnection handling (khi mất mạng tạm thời)

## Files to Create/Modify
- `src/server/socket.js` - Socket.io server logic
- `src/server/server.js` - Thêm Socket.io
- `src/public/js/studentSocket.js` - Student socket client
- `src/public/js/parentSocket.js` - Parent socket client
- `src/public/js/notification.js` - Notification UI

## Test Criteria
- [ ] Học sinh bật camera → Phụ huynh thấy "Online"
- [ ] Học sinh vi phạm → Phụ huynh nhận thông báo trong 2s
- [ ] Mất mạng + nối lại → Tự reconnect
- [ ] Data vi phạm lưu đúng vào database

---
Next Phase: phase-07-integration-testing.md
