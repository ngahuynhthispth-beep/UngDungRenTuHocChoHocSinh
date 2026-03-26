const express = require('express');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// GET /api/sessions/:studentId - Get study sessions for a student
router.get('/:studentId', requireAuth, async (req, res) => {
    try {
        // Verify parent owns this student
        const student = await req.db.query(
            'SELECT * FROM students WHERE id = $1 AND parent_id = $2',
            [req.params.studentId, req.session.userId]
        );

        if (student.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy học sinh' });
        }

        const { rows: sessions } = await req.db.query(
            'SELECT * FROM study_sessions WHERE student_id = $1 ORDER BY start_time DESC LIMIT 20',
            [req.params.studentId]
        );

        res.json({ success: true, sessions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// GET /api/sessions/:studentId/violations/:sessionId
router.get('/:studentId/violations/:sessionId', requireAuth, async (req, res) => {
    try {
        const { rows: violations } = await req.db.query(
            'SELECT * FROM violations WHERE session_id = $1 ORDER BY started_at ASC',
            [req.params.sessionId]
        );
        res.json({ success: true, violations });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// GET /api/sessions/stats/today
router.get('/stats/today', requireAuth, async (req, res) => {
    const today = new Date().toISOString().split('T')[0];

    try {
        const { rows: students } = await req.db.query(
            'SELECT id FROM students WHERE parent_id = $1',
            [req.session.userId]
        );

        const studentIds = students.map(s => s.id);
        if (studentIds.length === 0) {
            return res.json({
                success: true,
                stats: { total_time: 0, total_violations: 0, focus_percent: 0 }
            });
        }

        const placeholders = studentIds.map((_, i) => '$' + (i + 1)).join(',');
        const { rows: sessions } = await req.db.query(
            `SELECT * FROM study_sessions WHERE student_id IN (${placeholders}) AND DATE(start_time) = $${studentIds.length + 1}`,
            [...studentIds, today]
        );

        let total_focus = 0, total_distracted = 0, total_not_studying = 0, total_violations = 0;
        sessions.forEach(s => {
            total_focus += s.total_focus_seconds || 0;
            total_distracted += s.total_distracted_seconds || 0;
            total_not_studying += s.total_not_studying_seconds || 0;
            total_violations += s.violation_count || 0;
        });

        const total_time = total_focus + total_distracted + total_not_studying;
        const focus_percent = total_time > 0 ? Math.round((total_focus / total_time) * 100) : 0;

        res.json({
            success: true,
            stats: {
                total_time,
                total_violations,
                focus_percent
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// GET /api/sessions/admin/daily-report
router.get('/admin/daily-report', requireAuth, async (req, res) => {
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];
    
    try {
        // Lấy tất cả học sinh của parent này, LEFT JOIN với study_sessions trong ngày mục tiêu
        const query = `
            SELECT 
                s.id, s.name, s.avatar_color,
                COUNT(ss.id) as session_count,
                COALESCE(SUM(ss.total_focus_seconds + ss.total_distracted_seconds + ss.total_not_studying_seconds), 0) as total_time
            FROM students s
            LEFT JOIN study_sessions ss ON s.id = ss.student_id AND DATE(ss.start_time) = $2
            WHERE s.parent_id = $1
            GROUP BY s.id, s.name, s.avatar_color
            ORDER BY total_time DESC, s.name ASC
        `;
        
        const { rows: report } = await req.db.query(query, [req.session.userId, targetDate]);

        res.json({ success: true, date: targetDate, report });
    } catch (err) {
        console.error('Lỗi khi lấy báo cáo ngày:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy báo cáo' });
    }
});

module.exports = router;
