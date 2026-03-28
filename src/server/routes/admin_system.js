const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

// GET /api/admin/overview - Get platform-wide statistics (Super Admin ONLY)
router.get('/overview', requireAdmin, async (req, res) => {
    try {
        // 1. Total Parents
        const { rows: parentCount } = await req.db.query('SELECT COUNT(*) as total FROM users');
        
        // 2. Total Students
        const { rows: studentCount } = await req.db.query('SELECT COUNT(*) as total FROM students');
        
        // 3. Total Sessions & Time
        const { rows: sessionStats } = await req.db.query(`
            SELECT 
                COUNT(*) as total_sessions,
                COALESCE(SUM(total_focus_seconds + total_distracted_seconds + total_not_studying_seconds), 0) as total_seconds
            FROM study_sessions
        `);

        // 4. Active Today
        const today = new Date().toISOString().split('T')[0];
        const { rows: activeToday } = await req.db.query(
            'SELECT COUNT(DISTINCT student_id) as total FROM study_sessions WHERE DATE(start_time) = $1',
            [today]
        );

        res.json({
            success: true,
            stats: {
                total_parents: parseInt(parentCount[0].total),
                total_students: parseInt(studentCount[0].total),
                total_sessions: parseInt(sessionStats[0].total_sessions),
                total_minutes: Math.round(parseInt(sessionStats[0].total_seconds) / 60),
                active_today: parseInt(activeToday[0].total)
            }
        });
    } catch (err) {
        console.error('Super Admin Overview Error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy dữ liệu tổng quát' });
    }
});

// GET /api/admin/parents - List all parents for management
router.get('/parents', requireAdmin, async (req, res) => {
    try {
        const { rows: parents } = await req.db.query(`
            SELECT 
                u.id, u.username, u.display_name, u.created_at,
                COUNT(s.id) as student_count
            FROM users u
            LEFT JOIN students s ON u.id = s.parent_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);
        res.json({ success: true, parents });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;
