require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function lockSystem() {
  const today = new Date().toISOString().slice(0, 10);
  const reason = 'Hệ thống StudyGuard đang tạm khóa theo yêu cầu của Quản trị viên. Vui lòng liên hệ Admin để được mở khóa.';

  // Tạo bảng nếu chưa có
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_config (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('✅ Bảng system_config sẵn sàng.');

  // Upsert trạng thái khoá
  await pool.query(`
    INSERT INTO system_config (key, value, updated_at) VALUES 
      ('locked', 'true', NOW()),
      ('lock_start_date', $1, NOW()),
      ('lock_reason', $2, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `, [today, reason]);

  console.log('🔒 Đã khoá hệ thống thành công!');

  // Xác nhận lại
  const result = await pool.query('SELECT * FROM system_config ORDER BY key');
  console.log('\n📋 Trạng thái hiện tại trong DB:');
  result.rows.forEach(r => console.log(`  ${r.key} = ${r.value}`));

  await pool.end();
}

lockSystem().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
