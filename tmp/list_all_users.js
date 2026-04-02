require('dotenv').config();
const { Pool } = require('pg');

async function listAll() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const res = await pool.query('SELECT id, username, display_name, is_admin FROM users ORDER BY username ASC');
        console.log('All Users:');
        res.rows.forEach(u => {
            console.log(`- User: [${u.username}] | Name: [${u.display_name}] | Admin: ${u.is_admin}`);
        });
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

listAll();
