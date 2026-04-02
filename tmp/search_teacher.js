require('dotenv').config();
const { Pool } = require('pg');

async function searchTeacher() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const res = await pool.query("SELECT id, username, display_name, is_admin FROM users WHERE username ILIKE '%admin%' OR display_name ILIKE '%gv%' OR display_name ILIKE '%giáo viên%'");
        console.log('Potential Teacher Accounts:');
        res.rows.forEach(u => {
            console.log(`ID: ${u.id} | User: ${u.username} | Name: ${u.display_name} | Admin: ${u.is_admin}`);
        });
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

searchTeacher();
