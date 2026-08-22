require('dotenv').config();
const { Pool } = require('pg');

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function unlock() {
    try {
        await db.query(`
            INSERT INTO system_config (key, value, updated_at) VALUES 
                ('locked', 'false', NOW()),
                ('lock_start_date', '', NOW()),
                ('lock_reason', '', NOW())
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `);
        console.log('✅ Đã mở khóa hệ thống thành công!');

        // Xác nhận lại
        const { rows } = await db.query("SELECT key, value FROM system_config WHERE key IN ('locked', 'lock_start_date', 'lock_reason')");
        console.log('📊 Trạng thái hiện tại:');
        rows.forEach(r => console.log(`  ${r.key} = ${r.value}`));
    } catch (err) {
        console.error('❌ Lỗi:', err.message);
    } finally {
        await db.end();
    }
}

unlock();
