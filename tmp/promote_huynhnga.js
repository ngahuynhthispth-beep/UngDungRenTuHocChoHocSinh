require('dotenv').config();
const { Pool } = require('pg');

async function promote() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const username = 'huynhnga';
        const res = await pool.query('UPDATE users SET is_admin = true WHERE username = $1', [username]);
        if (res.rowCount > 0) {
            console.log(`✅ Đã cấp quyền Giáo viên cho ${username} thành công!`);
        } else {
            console.log(`❌ Không tìm thấy user ${username} trong hệ thống.`);
        }
    } catch (err) {
        console.error('Lỗi khi cập nhật:', err);
    } finally {
        await pool.end();
    }
}

promote();
