function setupSocket(io, db) {
    // Track online students: { room_code: { socketId, studentId, state, sessionId } }
    const onlineStudents = new Map();

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

                // Track online student
                onlineStudents.set(room_code, {
                    socketId: socket.id,
                    studentId: student_id,
                    state: 'studying',
                    sessionId
                });

                // Join socket room
                socket.join(`room:${room_code}`);
                socket.join(`student:${student_id}`);

                // Notify parent
                io.emit('student:online', { student_id, room_code, session_id: sessionId });

                console.log(`📚 Student ${student_id} started studying in room ${room_code}`);
            } catch (err) {
                console.error('Socket session:start error:', err);
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

        // Session end
        socket.on('session:end', async (data) => {
            const { room_code, summary } = data;
            const studentInfo = onlineStudents.get(room_code);
            if (!studentInfo) return;

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
