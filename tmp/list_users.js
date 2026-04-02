require('dotenv').config();
const { Pool } = require('pg');

async function listUsers() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const res = await pool.query('SELECT id, username, display_name, is_admin FROM users ORDER BY id ASC LIMIT 50');
        res.rows.forEach(u => {
            console.log(`ID: ${u.id} | User: ${u.username} | Name: ${u.display_name} | Admin: ${u.is_admin}`);
        });
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

listUsers();
