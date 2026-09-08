const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// ─────────────────────────────────────────────
// QUẢN LÝ CÂU HỎI (chỉ Giáo viên/Admin)
// ─────────────────────────────────────────────

// GET /api/quiz/questions - Lấy danh sách câu hỏi (giáo viên xem tất cả)
router.get('/questions', requireAdmin, async (req, res) => {
    try {
        const { rows } = await req.db.query(
            `SELECT q.*, u.display_name as teacher_name
             FROM questions q
             JOIN users u ON q.teacher_id = u.id
             ORDER BY q.created_at DESC`
        );
        res.json({ success: true, questions: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// POST /api/quiz/questions - Tạo câu hỏi mới (giáo viên)
router.post('/questions', requireAdmin, async (req, res) => {
    const { subject, question, option_a, option_b, option_c, option_d, correct_answer } = req.body;

    if (!question || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
        return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin câu hỏi' });
    }
    if (!['A', 'B', 'C', 'D'].includes(correct_answer.toUpperCase())) {
        return res.status(400).json({ success: false, message: 'Đáp án đúng phải là A, B, C hoặc D' });
    }

    try {
        const { rows } = await req.db.query(
            `INSERT INTO questions (teacher_id, subject, question, option_a, option_b, option_c, option_d, correct_answer)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [req.session.userId, subject || 'Chung', question, option_a, option_b, option_c, option_d, correct_answer.toUpperCase()]
        );
        res.json({ success: true, question: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// PUT /api/quiz/questions/:id - Sửa câu hỏi (giáo viên)
router.put('/questions/:id', requireAdmin, async (req, res) => {
    const { subject, question, option_a, option_b, option_c, option_d, correct_answer } = req.body;

    try {
        const { rows } = await req.db.query(
            `UPDATE questions
             SET subject=$1, question=$2, option_a=$3, option_b=$4, option_c=$5, option_d=$6, correct_answer=$7
             WHERE id=$8 RETURNING *`,
            [subject || 'Chung', question, option_a, option_b, option_c, option_d, correct_answer.toUpperCase(), req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' });
        }
        res.json({ success: true, question: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// DELETE /api/quiz/questions/:id - Xóa câu hỏi (giáo viên)
router.delete('/questions/:id', requireAdmin, async (req, res) => {
    try {
        const result = await req.db.query(
            'DELETE FROM questions WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// ─────────────────────────────────────────────
// LẤY CÂU HỎI NGẪU NHIÊN (dùng nội bộ bởi Socket)
// ─────────────────────────────────────────────

// GET /api/quiz/random?count=5 - Lấy câu hỏi ngẫu nhiên từ pool chung
router.get('/random', async (req, res) => {
    const count = parseInt(req.query.count) || 5;
    try {
        const { rows } = await req.db.query(
            'SELECT * FROM questions ORDER BY RANDOM() LIMIT $1',
            [count]
        );
        // Ẩn đáp án đúng khi gửi về client
        const safeQuestions = rows.map(q => ({
            id: q.id,
            subject: q.subject,
            question: q.question,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d
            // correct_answer được giữ ở server, không gửi xuống client
        }));
        res.json({ success: true, questions: safeQuestions, total: rows.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// ─────────────────────────────────────────────
// KẾT QUẢ QUIZ
// ─────────────────────────────────────────────

// GET /api/quiz/results/:studentId - Xem kết quả quiz của học sinh (phụ huynh hoặc giáo viên)
router.get('/results/:studentId', requireAuth, async (req, res) => {
    try {
        // Phụ huynh chỉ xem con mình; Admin xem tất cả
        if (!req.session.isAdmin) {
            const student = await req.db.query(
                'SELECT id FROM students WHERE id = $1 AND parent_id = $2',
                [req.params.studentId, req.session.userId]
            );
            if (student.rows.length === 0) {
                return res.status(403).json({ success: false, message: 'Không có quyền xem' });
            }
        }

        const { rows } = await req.db.query(
            `SELECT qr.*, q.question, q.subject, q.correct_answer,
                    q.option_a, q.option_b, q.option_c, q.option_d
             FROM quiz_results qr
             JOIN questions q ON qr.question_id = q.id
             WHERE qr.student_id = $1
             ORDER BY qr.answered_at DESC
             LIMIT 100`,
            [req.params.studentId]
        );
        res.json({ success: true, results: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// GET /api/quiz/summary - Tổng kết điểm quiz tất cả học sinh (giáo viên)
router.get('/summary', requireAdmin, async (req, res) => {
    try {
        const { rows } = await req.db.query(
            `SELECT 
                s.id as student_id,
                s.name as student_name,
                s.avatar_color,
                qr.quiz_type,
                COUNT(*) as total,
                SUM(CASE WHEN qr.is_correct THEN 1 ELSE 0 END) as correct
             FROM quiz_results qr
             JOIN students s ON qr.student_id = s.id
             GROUP BY s.id, s.name, s.avatar_color, qr.quiz_type
             ORDER BY s.name`
        );
        res.json({ success: true, summary: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;
