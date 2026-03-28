const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, password, display_name } = req.body;

        if (!username || !password || !display_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải ít nhất 6 ký tự' });
        }

        // Check if username exists
        const existing = await req.db.query('SELECT id FROM users WHERE username = $1', [username]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const result = await req.db.query(
            'INSERT INTO users (username, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id',
            [username, password_hash, display_name]
        );

        req.session.userId = result.rows[0].id;
        req.session.displayName = display_name;

        res.json({ success: true, message: 'Đăng ký thành công!' });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
        }

        const { rows } = await req.db.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = rows[0];
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        req.session.userId = user.id;
        req.session.displayName = user.display_name;
        req.session.isAdmin = user.is_admin || false;

        res.json({ 
            success: true, 
            user: { 
                id: user.id, 
                display_name: user.display_name,
                is_admin: user.is_admin || false
            } 
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({
            success: true,
            user: { 
                id: req.session.userId, 
                display_name: req.session.displayName,
                is_admin: req.session.isAdmin || false
            }
        });
    } else {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }
});

module.exports = router;
