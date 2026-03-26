# Phase 01: Project Setup
Status: ⬜ Pending
Dependencies: None

## Objective
Khởi tạo project, cài đặt dependencies, tạo folder structure chuẩn.

## Implementation Steps
1. [ ] Khởi tạo Node.js project (`npm init`)
2. [ ] Cài đặt dependencies: express, socket.io, better-sqlite3, express-session, bcrypt
3. [ ] Tạo folder structure:
   ```
   src/
   ├── server/          # Backend
   │   ├── server.js    # Entry point
   │   ├── db.js        # Database setup
   │   └── routes/      # API routes
   ├── public/          # Frontend (static files)
   │   ├── index.html   # Landing page
   │   ├── css/         # Stylesheets
   │   ├── js/          # Client-side JS
   │   └── assets/      # Images, sounds
   └── package.json
   ```
4. [ ] Setup Express server cơ bản (port 3000)
5. [ ] Tạo landing page đơn giản (kiểm tra server chạy)
6. [ ] Tạo .env.example với các biến môi trường
7. [ ] Tạo .gitignore

## Files to Create
- `package.json` - Project config
- `src/server/server.js` - Express server
- `src/public/index.html` - Landing page
- `.env.example` - Environment variables
- `.gitignore` - Git ignore rules

## Test Criteria
- [ ] `npm run dev` chạy thành công
- [ ] Mở http://localhost:3000 thấy landing page

---
Next Phase: phase-02-database-auth.md
