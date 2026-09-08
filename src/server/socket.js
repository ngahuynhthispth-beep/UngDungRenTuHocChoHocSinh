function setupSocket(io, db) {
    // Track online students: { room_code: { socketId, studentId, state, sessionId, parentId, quizTimer } }
    const onlineStudents = new Map();

    // ─────────────────────────────────────────────
    // Helper: Lấy câu hỏi ngẫu nhiên từ DB
    // ─────────────────────────────────────────────
    async function getRandomQuestions(count = 1) {
        try {
            const { rows } = await db.query(
                'SELECT * FROM questions ORDER BY RANDOM() LIMIT $1',
                [count]
            );
            return rows;
        } catch (err) {
            console.error('[Quiz] Error fetching questions:', err.message);
            return [];
        }
    }

    // Helper: Lưu kết quả quiz vào DB
    async function saveQuizResult(studentId, sessionId, questionId, quizType, answer, correctAnswer) {
        const isCorrect = answer && answer.toUpperCase() === correctAnswer.toUpperCase();
        try {
            await db.query(
                `INSERT INTO quiz_results (student_id, session_id, question_id, quiz_type, answer, is_correct)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [studentId, sessionId, questionId, quizType, answer || null, isCorrect]
            );
            return isCorrect;
        } catch (err) {
            console.error('[Quiz] Error saving result:', err.message);
            return false;
        }
    }

    // ─────────────────────────────────────────────
    // Quiz bất ngờ giữa buổi (mỗi 30 phút)
    // ─────────────────────────────────────────────
    function startMidSessionQuizTimer(socket, room_code) {
        const QUIZ_INTERVAL_MS = 30 * 60 * 1000; // 30 phút
        const ANSWER_TIMEOUT_MS = 60 * 1000;      // 60 giây để trả lời

        const timer = setInterval(async () => {
            const studentInfo = onlineStudents.get(room_code);
            if (!studentInfo || studentInfo.socketId !== socket.id) {
                clearInterval(timer);
                return;
            }

            // Lấy 1 câu ngẫu nhiên
            const questions = await getRandomQuestions(1);
            if (questions.length === 0) return; // Không có câu hỏi nào

            const q = questions[0];
            studentInfo.pendingMidQuiz = {
                questionId: q.id,
                correctAnswer: q.correct_answer,
                answered: false,
                timeout: null
            };

            // Gửi quiz đến học sinh (không kèm đáp án)
            socket.emit('quiz:popup', {
                questionId: q.id,
                subject: q.subject,
                question: q.question,
                option_a: q.option_a,
                option_b: q.option_b,
                option_c: q.option_c,
                option_d: q.option_d,
                timeLimit: 60 // giây
            });

            console.log(`[Quiz] Mid-session quiz sent to room ${room_code}`);

            // Đếm ngược — nếu không trả lời sau 60s thì tính vi phạm
            studentInfo.pendingMidQuiz.timeout = setTimeout(async () => {
                const info = onlineStudents.get(room_code);
                if (!info || !info.pendingMidQuiz || info.pendingMidQuiz.answered) return;

                info.pendingMidQuiz.answered = true;

                // Lưu kết quả: không trả lời
                await saveQuizResult(info.studentId, info.sessionId, q.id, 'mid_session', null, q.correct_answer);

                // Tính vi phạm
                await db.query(
                    'INSERT INTO violations (session_id, type, started_at) VALUES ($1, $2, NOW())',
                    [info.sessionId, 'quiz_timeout']
                );
                await db.query(
                    'UPDATE study_sessions SET violation_count = violation_count + 1 WHERE id = $1',
                    [info.sessionId]
                );

                // Thông báo học sinh hết giờ
                socket.emit('quiz:timeout', { questionId: q.id, correctAnswer: q.correct_answer });

                // Thông báo phụ huynh
                const { rows } = await db.query('SELECT name FROM students WHERE id = $1', [info.studentId]);
                io.emit('violation:alert', {
                    student_id: info.studentId,
                    student_name: rows[0]?.name || 'Học sinh',
                    room_code,
                    type: 'quiz_timeout',
                    timestamp: new Date().toISOString()
                });
            }, ANSWER_TIMEOUT_MS);

        }, QUIZ_INTERVAL_MS);

        return timer;
    }

    // ─────────────────────────────────────────────
    // Socket Events
    // ─────────────────────────────────────────────
    io.on('connection', (socket) => {
        console.log('🔌 Socket connected:', socket.id);

        // Student joins room
        socket.on('session:start', async (data) => {
            const { room_code, student_id } = data;
            if (!room_code || !student_id) return;

            try {
                // Create study session in DB
                const result = await db.query(
                    "INSERT INTO study_sessions (student_id, start_time) VALUES ($1, CURRENT_TIMESTAMP) RETURNING id",
                    [student_id]
                );

                const sessionId = result.rows[0].id;

                // Lấy parent_id của học sinh (dùng để lấy câu hỏi)
                const studentData = await db.query('SELECT parent_id FROM students WHERE id = $1', [student_id]);
                const parentId = studentData.rows[0]?.parent_id;

                // Track online student
                onlineStudents.set(room_code, {
                    socketId: socket.id,
                    studentId: student_id,
                    state: 'studying',
                    sessionId,
                    parentId,
                    pendingMidQuiz: null,
                    quizTimer: null
                });

                // Join socket room
                socket.join(`room:${room_code}`);
                socket.join(`student:${student_id}`);

                // Bắt đầu timer quiz bất ngờ
                const timer = startMidSessionQuizTimer(socket, room_code);
                onlineStudents.get(room_code).quizTimer = timer;

                // Notify parent
                io.emit('student:online', { student_id, room_code, session_id: sessionId });

                console.log(`📚 Student ${student_id} started studying in room ${room_code}`);
            } catch (err) {
                console.error('Socket session:start error:', err);
            }
        });

        // ─── Trả lời Quiz bất ngờ giữa buổi ───
        socket.on('quiz:answer', async (data) => {
            const { room_code, questionId, answer } = data;
            const studentInfo = onlineStudents.get(room_code);
            if (!studentInfo || !studentInfo.pendingMidQuiz) return;
            if (studentInfo.pendingMidQuiz.answered) return;

            studentInfo.pendingMidQuiz.answered = true;

            // Xóa timeout
            if (studentInfo.pendingMidQuiz.timeout) {
                clearTimeout(studentInfo.pendingMidQuiz.timeout);
            }

            const isCorrect = await saveQuizResult(
                studentInfo.studentId, studentInfo.sessionId,
                questionId, 'mid_session',
                answer, studentInfo.pendingMidQuiz.correctAnswer
            );

            // Gửi kết quả về học sinh
            socket.emit('quiz:result', {
                questionId,
                isCorrect,
                correctAnswer: studentInfo.pendingMidQuiz.correctAnswer
            });
        });

        // ─── Học sinh yêu cầu Quiz cuối buổi ───
        socket.on('quiz:final:request', async (data) => {
            const { room_code } = data;
            const studentInfo = onlineStudents.get(room_code);
            if (!studentInfo) return;

            // Lấy 5 câu ngẫu nhiên
            const questions = await getRandomQuestions(5);
            if (questions.length === 0) {
                // Không có câu hỏi → cho phép kết thúc luôn
                socket.emit('quiz:final:questions', { questions: [], canSkip: true });
                return;
            }

            // Lưu câu hỏi + đáp án đúng ở server để chấm điểm
            studentInfo.finalQuizQuestions = questions.map(q => ({
                id: q.id,
                correctAnswer: q.correct_answer
            }));

            // Gửi câu hỏi (không kèm đáp án)
            socket.emit('quiz:final:questions', {
                canSkip: false,
                questions: questions.map(q => ({
                    id: q.id,
                    subject: q.subject,
                    question: q.question,
                    option_a: q.option_a,
                    option_b: q.option_b,
                    option_c: q.option_c,
                    option_d: q.option_d
                }))
            });
        });

        // ─── Nộp bài Quiz cuối buổi ───
        socket.on('quiz:final:submit', async (data) => {
            const { room_code, answers } = data; // answers: { questionId: 'A'/'B'/'C'/'D' }
            const studentInfo = onlineStudents.get(room_code);
            if (!studentInfo) return;

            const finalQuestions = studentInfo.finalQuizQuestions || [];
            let correct = 0;

            // Chấm điểm và lưu từng câu
            for (const q of finalQuestions) {
                const userAnswer = answers[q.id] || null;
                const isCorrect = await saveQuizResult(
                    studentInfo.studentId, studentInfo.sessionId,
                    q.id, 'end_session',
                    userAnswer, q.correctAnswer
                );
                if (isCorrect) correct++;
            }

            const total = finalQuestions.length;
            const score = total > 0 ? Math.round((correct / total) * 100) : 0;

            // Gửi kết quả về học sinh
            socket.emit('quiz:final:result', {
                correct,
                total,
                score,
                correctAnswers: finalQuestions.reduce((acc, q) => {
                    acc[q.id] = q.correctAnswer;
                    return acc;
                }, {})
            });

            console.log(`[Quiz] End-session quiz: student ${studentInfo.studentId} scored ${correct}/${total}`);
        });

        // ─── Kết thúc buổi học (sau khi quiz cuối xong) ───
        socket.on('session:end', async (data) => {
            const { room_code, summary } = data;
            const studentInfo = onlineStudents.get(room_code);
            if (!studentInfo) return;

            // Dừng timer quiz bất ngờ
            if (studentInfo.quizTimer) {
                clearInterval(studentInfo.quizTimer);
            }

            try {
                // Update session in DB
                await db.query(`
                    UPDATE study_sessions SET 
                        end_time = CURRENT_TIMESTAMP,
                        total_focus_seconds = $1,
                        total_distracted_seconds = $2,
                        total_not_studying_seconds = $3,
                        status = 'completed'
                    WHERE id = $4
                `, [
                    summary.focus_seconds || 0,
                    summary.distracted_seconds || 0,
                    summary.not_studying_seconds || 0,
                    studentInfo.sessionId
                ]);

                // Notify parent
                io.emit('student:offline', {
                    student_id: studentInfo.studentId,
                    room_code,
                    summary
                });

                // Cleanup
                onlineStudents.delete(room_code);
                socket.leave(`room:${room_code}`);

                console.log(`📕 Student ${studentInfo.studentId} ended session in room ${room_code}`);
            } catch (err) {
                console.error('Socket session:end error:', err);
            }
        });

        // Status update from student
        socket.on('status:update', (data) => {
            const { room_code, state, timestamp } = data;
            const studentInfo = onlineStudents.get(room_code);
            if (!studentInfo) return;

            studentInfo.state = state;

            // Broadcast to all (parent will filter)
            io.emit('status:changed', {
                student_id: studentInfo.studentId,
                room_code,
                state,
                timestamp
            });
        });

        // Violation from student
        socket.on('violation:new', async (data) => {
            const { room_code, type, timestamp } = data;
            const studentInfo = onlineStudents.get(room_code);
            if (!studentInfo) return;

            try {
                // Save violation to DB
                await db.query(
                    'INSERT INTO violations (session_id, type, started_at) VALUES ($1, $2, $3)',
                    [studentInfo.sessionId, type, timestamp || new Date().toISOString()]
                );

                // Update violation count
                await db.query(
                    'UPDATE study_sessions SET violation_count = violation_count + 1 WHERE id = $1',
                    [studentInfo.sessionId]
                );

                // Get student name
                const { rows } = await db.query('SELECT name FROM students WHERE id = $1', [studentInfo.studentId]);
                const student = rows[0];

                // Notify parent
                io.emit('violation:alert', {
                    student_id: studentInfo.studentId,
                    student_name: student ? student.name : 'Học sinh',
                    room_code,
                    type,
                    timestamp
                });
            } catch (err) {
                console.error('Socket violation:new error:', err);
            }
        });

        // Time tracking updates (periodic)
        socket.on('time:update', async (data) => {
            const { room_code, focus_seconds, distracted_seconds, not_studying_seconds } = data;
            const studentInfo = onlineStudents.get(room_code);
            if (!studentInfo) return;

            try {
                await db.query(`
                    UPDATE study_sessions SET 
                        total_focus_seconds = $1,
                        total_distracted_seconds = $2,
                        total_not_studying_seconds = $3
                    WHERE id = $4
                `, [focus_seconds, distracted_seconds, not_studying_seconds, studentInfo.sessionId]);
            } catch (err) {
                console.error('Socket time:update error:', err);
            }
        });

        // Disconnect
        socket.on('disconnect', async () => {
            // Find and cleanup student
            for (const [room_code, info] of onlineStudents.entries()) {
                if (info.socketId === socket.id) {
                    // Dừng timer quiz
                    if (info.quizTimer) clearInterval(info.quizTimer);
                    if (info.pendingMidQuiz?.timeout) clearTimeout(info.pendingMidQuiz.timeout);

                    io.emit('student:offline', {
                        student_id: info.studentId,
                        room_code,
                        reason: 'disconnected'
                    });

                    // End session
                    try {
                        await db.query(`
                            UPDATE study_sessions SET end_time = CURRENT_TIMESTAMP, status = 'completed'
                            WHERE id = $1 AND status = 'active'
                        `, [info.sessionId]);
                    } catch (err) {
                        console.error('Socket disconnect DB error:', err);
                    }

                    onlineStudents.delete(room_code);
                    break;
                }
            }
            console.log('🔌 Socket disconnected:', socket.id);
        });
    });

    // Helper: get online students
    io.getOnlineStudents = () => {
        const result = {};
        for (const [room_code, info] of onlineStudents.entries()) {
            result[info.studentId] = { room_code, state: info.state };
        }
        return result;
    };
}

module.exports = { setupSocket };
