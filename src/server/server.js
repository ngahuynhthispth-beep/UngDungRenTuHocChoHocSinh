require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const session = require('express-session');
const { Server } = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { initDB } = require('./db');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const sessionRoutes = require('./routes/sessions');
const adminSystemRoutes = require('./routes/admin_system');
const { setupSocket } = require('./socket');
const rankingService = require('./services/rankingService');
const lockMiddleware = require('./middleware/lockMiddleware');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.set('io', io);

// Database
const db = initDB();
app.set('db', db); // Expose db for lockMiddleware

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Tắt CSP để load thư viện AI MediaPipe từ jsDelivr
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Chống spam API (Brute-force bảo mật)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 200, // Cho phép 200 lượt gọi API mỗi 15 phút thôi
    message: { success: false, message: 'Thao tác quá nhanh, hệ thống bị nghẽn mạng. Xin đợi 15 phút!' }
});
app.use('/api/', apiLimiter);

// Mã hóa khóa bảo mật cho session
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const sessionMiddleware = session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
});
app.use(sessionMiddleware);

// Share session with Socket.io
io.engine.use(sessionMiddleware);

// Middleware kiểm tra trạng thái khóa hệ thống (phải chạy trước static để chặn truy cập HTML)
// lockMiddleware tự động bỏ qua các file có extension (.css, .js, .png...) nên assets vẫn load bình thường
app.use(lockMiddleware);

// Static files (sau lockMiddleware - assets như CSS/JS vẫn được phục vụ vì lockMiddleware cho phép file có extension đi qua)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Make db available to routes
app.use((req, res, next) => {
    req.db = db;
    next();
});


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/admin/system', adminSystemRoutes);

// Page routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'register.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
});

app.get('/student', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'student.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

app.get('/super-admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'super-admin.html'));
});

app.get('/teacher-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'teacher-dashboard.html'));
});

// Socket.io
setupSocket(io, db);

// --- AUTOMATIC WEEKLY RESET TASK ---
// Checks every hour if it is Monday 00:00 and performs reset if not already done.
setInterval(async () => {
    try {
        const now = new Date();
        // 1 is Monday. We check in the first hour of Monday.
        if (now.getDay() === 1 && now.getHours() === 0) {
            console.log('⏰ [StudyGuard] Checking automatic weekly reset...');
            const needed = await rankingService.isResetNeeded(db);
            if (needed) {
                console.log('🧹 [StudyGuard] Performing automatic weekly reset...');
                const result = await rankingService.performWeeklyReset(db);
                console.log(`✅ [StudyGuard] Auto-reset successful. Vinh danh ${result.count} học sinh.`);
            }
        }
    } catch (err) {
        console.error('❌ [StudyGuard] Automatic reset error:', err);
    }
}, 3600000); // 1 hour

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║        📚 StudyGuard Server             ║
║        Running on port ${PORT}              ║
║        http://localhost:${PORT}             ║
╚══════════════════════════════════════════╝
    `);
});
