require('dotenv').config();
const { Pool } = require('pg');

async function searchUser() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const username = 'huynhnga';
        const res = await pool.query('SELECT username FROM users WHERE username ILIKE $1', [`%${username}%`]);
        console.log('Search results for huynhnga:');
        res.rows.forEach(u => console.log(`- ${u.username}`));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

searchUser();
