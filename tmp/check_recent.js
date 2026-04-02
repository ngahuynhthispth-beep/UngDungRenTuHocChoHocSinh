require('dotenv').config();
const { Pool } = require('pg');

async function checkLateUsers() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const res = await pool.query('SELECT id, username, display_name, is_admin, created_at FROM users ORDER BY created_at DESC LIMIT 5');
        console.log('Recent Users:');
        res.rows.forEach(u => {
            console.log(`ID: ${u.id} | User: ${u.username} | Name: ${u.display_name} | Admin: ${u.is_admin} | Created: ${u.created_at}`);
        });
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkLateUsers();
