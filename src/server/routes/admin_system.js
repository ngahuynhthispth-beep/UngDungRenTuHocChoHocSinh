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

// GET /api/admin/system/students - List all students with study time (Super Admin ONLY)
router.get('/students', requireAdmin, async (req, res) => {
    try {
        const { rows: students } = await req.db.query(`
            SELECT 
                s.id, s.name, s.room_code, u.display_name as parent_name,
                COALESCE(SUM(ss.total_focus_seconds + ss.total_distracted_seconds + ss.total_not_studying_seconds), 0) as total_seconds,
                MAX(ss.start_time) as last_active
            FROM students s
            JOIN users u ON s.parent_id = u.id
            LEFT JOIN study_sessions ss ON s.id = ss.student_id
            GROUP BY s.id, u.display_name
            ORDER BY last_active DESC NULLS LAST
        `);
        res.json({ success: true, students });
    } catch (err) {
        console.error('Super Admin Students Error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy dữ liệu học sinh' });
    }
});

// GET /api/admin/system/online-students - Current monitoring data (Super Admin ONLY)
router.get('/online-students', requireAdmin, async (req, res) => {
    try {
        const io = req.app.get('io');
        const onlineData = io.getOnlineStudents(); // { studentId: { room_code, state } }
        const studentIds = Object.keys(onlineData);

        if (studentIds.length === 0) {
            return res.json({ success: true, students: [] });
        }

        const { rows: students } = await req.db.query(`
            SELECT id, name, avatar_color, room_code 
            FROM students 
            WHERE id = ANY($1::int[])
        `, [studentIds.map(id => parseInt(id))]);

        const studentsWithStatus = students.map(s => ({
            ...s,
            state: onlineData[s.id].state,
            room_code: onlineData[s.id].room_code
        }));

        res.json({ success: true, students: studentsWithStatus });
    } catch (err) {
        console.error('Super Admin Online Students Error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy dữ liệu giám sát' });
    }
});

// GET /api/admin/system/rankings - Daily & Weekly study rankings for all students
router.get('/rankings', requireAdmin, async (req, res) => {
    try {
        // 1. Daily rankings (existing)
        const dailyQuery = `
            SELECT 
                s.name, 
                s.avatar_color,
                DATE(ss.start_time) as study_day, 
                SUM(ss.total_focus_seconds) as total_focus_seconds,
                SUM(ss.violation_count) as total_violations
            FROM study_sessions ss
            JOIN students s ON ss.student_id = s.id
            WHERE ss.start_time >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY s.name, s.avatar_color, study_day
            ORDER BY study_day DESC, total_focus_seconds DESC;
        `;
        
        // 2. Weekly Top 7 (New cumulative)
        const weeklyQuery = `
            SELECT 
                s.name, 
                s.avatar_color,
                SUM(ss.total_focus_seconds) as total_focus_seconds,
                SUM(ss.violation_count) as total_violations
            FROM study_sessions ss
            JOIN students s ON ss.student_id = s.id
            WHERE ss.start_time >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY s.name, s.avatar_color
            ORDER BY total_focus_seconds DESC
            LIMIT 10;
        `;

        const { rows: dailyRankings } = await req.db.query(dailyQuery);
        const { rows: weeklyTop7 } = await req.db.query(weeklyQuery);

        // Group daily rankings by day
        const groupedDaily = dailyRankings.reduce((acc, row) => {
            const day = row.study_day.toISOString().split('T')[0];
            if (!acc[day]) acc[day] = [];
            acc[day].push(row);
            return acc;
        }, {});

        res.json({ 
            success: true, 
            rankings: groupedDaily,
            weeklyTop7: weeklyTop7
        });
    } catch (err) {
        console.error('Rankings Error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy bảng xếp hạng' });
    }
});

module.exports = router;
