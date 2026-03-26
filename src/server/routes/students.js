const express = require('express');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Generate random 6-char room code
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// GET /api/students - List parent's students
router.get('/', requireAuth, async (req, res) => {
    try {
        const { rows: students } = await req.db.query(
            'SELECT * FROM students WHERE parent_id = $1 ORDER BY created_at DESC',
            [req.session.userId]
        );
        res.json({ success: true, students });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// POST /api/students - Add new student
router.post('/', requireAuth, async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập tên học sinh' });
    }

    try {
        // Generate unique room code
        let room_code;
        let attempts = 0;
        do {
            room_code = generateRoomCode();
            const existing = await req.db.query('SELECT id FROM students WHERE room_code = $1', [room_code]);
            if (existing.rows.length === 0) break;
            attempts++;
        } while (attempts < 10);

        const colors = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        const avatar_color = colors[Math.floor(Math.random() * colors.length)];

        const result = await req.db.query(
            'INSERT INTO students (parent_id, name, room_code, avatar_color) VALUES ($1, $2, $3, $4) RETURNING id',
            [req.session.userId, name, room_code, avatar_color]
        );

        const student = await req.db.query('SELECT * FROM students WHERE id = $1', [result.rows[0].id]);
        res.json({ success: true, student: student.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// DELETE /api/students/:id
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const student = await req.db.query(
            'SELECT * FROM students WHERE id = $1 AND parent_id = $2',
            [req.params.id, req.session.userId]
        );

        if (student.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy học sinh' });
        }

        await req.db.query('DELETE FROM violations WHERE session_id IN (SELECT id FROM study_sessions WHERE student_id = $1)', [req.params.id]);
        await req.db.query('DELETE FROM study_sessions WHERE student_id = $1', [req.params.id]);
        await req.db.query('DELETE FROM students WHERE id = $1', [req.params.id]);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// POST /api/students/join - Student joins room
router.post('/join', async (req, res) => {
    const { room_code } = req.body;
    if (!room_code) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập mã phòng' });
    }

    try {
        const student = await req.db.query(
            'SELECT s.*, u.display_name as parent_name FROM students s JOIN users u ON s.parent_id = u.id WHERE s.room_code = $1',
            [room_code.toUpperCase()]
        );

        if (student.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Mã phòng không tồn tại' });
        }

        const data = student.rows[0];
        res.json({ success: true, student: { id: data.id, name: data.name, room_code: data.room_code } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;
