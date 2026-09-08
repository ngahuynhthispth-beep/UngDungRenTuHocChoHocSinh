const { Pool } = require('pg');

function initDB() {
    const db = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Essential for Neon/Supabase cloud connections
    });

    // Create tables
    db.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            display_name TEXT NOT NULL,
            is_admin BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS students (
            id SERIAL PRIMARY KEY,
            parent_id INTEGER NOT NULL REFERENCES users(id),
            name TEXT NOT NULL,
            room_code TEXT UNIQUE NOT NULL,
            avatar_color TEXT DEFAULT '#10b981',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS study_sessions (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES students(id),
            start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            end_time TIMESTAMP,
            total_focus_seconds INTEGER DEFAULT 0,
            total_distracted_seconds INTEGER DEFAULT 0,
            total_not_studying_seconds INTEGER DEFAULT 0,
            violation_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'active'
        );

        CREATE TABLE IF NOT EXISTS violations (
            id SERIAL PRIMARY KEY,
            session_id INTEGER NOT NULL REFERENCES study_sessions(id),
            type TEXT NOT NULL,
            started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            duration_seconds INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS weekly_winners (
            id SERIAL PRIMARY KEY,
            week_start_date DATE NOT NULL,
            student_name TEXT NOT NULL,
            avatar_color TEXT,
            total_focus_seconds INTEGER NOT NULL,
            rank INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS system_config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        INSERT INTO system_config (key, value) VALUES ('locked', 'true'), ('lock_start_date', '2026-06-07'), ('lock_reason', 'Hệ thống tự học StudyGuard đang tạm khóa theo yêu cầu của Quản trị viên. Vui lòng liên hệ Admin để được mở khóa.')
        ON CONFLICT (key) DO NOTHING;

        CREATE TABLE IF NOT EXISTS questions (
            id SERIAL PRIMARY KEY,
            teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            subject TEXT DEFAULT 'Chung',
            question TEXT NOT NULL,
            option_a TEXT NOT NULL,
            option_b TEXT NOT NULL,
            option_c TEXT NOT NULL,
            option_d TEXT NOT NULL,
            correct_answer TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS quiz_results (
            id SERIAL PRIMARY KEY,
            session_id INTEGER REFERENCES study_sessions(id) ON DELETE SET NULL,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
            quiz_type TEXT NOT NULL,
            answer TEXT,
            is_correct BOOLEAN,
            answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `).then(() => console.log('✅ PostgreSQL Database initialized'))
      .catch(err => console.error('❌ Database initialization error:', err));

    return db;
}

module.exports = { initDB };
