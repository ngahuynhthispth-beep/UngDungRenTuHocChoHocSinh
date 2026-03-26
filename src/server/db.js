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
    `).then(() => console.log('✅ PostgreSQL Database initialized'))
      .catch(err => console.error('❌ Database initialization error:', err));

    return db;
}

module.exports = { initDB };
