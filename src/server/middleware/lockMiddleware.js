const fs = require('fs');
const path = require('path');

function getLockPageHTML(reason, startDate) {
    // Format date DD/MM/YYYY for Vietnamese display
    let displayDate = startDate;
    if (startDate) {
        const parts = startDate.split('-');
        if (parts.length === 3) {
            displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
    }

    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hệ Thống Tạm Khóa - StudyGuard</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #090d16;
            --card-bg: rgba(17, 25, 40, 0.75);
            --card-border: rgba(255, 255, 255, 0.08);
            --primary-glow: #6366f1;
            --secondary-glow: #a855f7;
            --danger-color: #f43f5e;
            --danger-glow: rgba(244, 63, 94, 0.15);
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: var(--bg-color);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
        }

        /* Ambient glowing background */
        .ambient-bg {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1;
            overflow: hidden;
        }

        .blob {
            position: absolute;
            border-radius: 50%;
            filter: blur(120px);
            opacity: 0.15;
            animation: float-blob 20s infinite alternate ease-in-out;
        }

        .blob-1 {
            width: 500px;
            height: 500px;
            background-color: var(--primary-glow);
            top: -100px;
            left: -100px;
        }

        .blob-2 {
            width: 400px;
            height: 400px;
            background-color: var(--secondary-glow);
            bottom: -500px;
            right: -100px;
            animation-delay: -5s;
        }

        .blob-3 {
            width: 300px;
            height: 300px;
            background-color: var(--danger-color);
            top: 40%;
            right: 15%;
            opacity: 0.08;
            animation-delay: -10s;
        }

        @keyframes float-blob {
            0% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(30px, -50px) scale(1.1); }
            100% { transform: translate(-20px, 20px) scale(0.95); }
        }

        /* Container & Card */
        .container {
            width: 100%;
            max-width: 480px;
            padding: 24px;
            z-index: 10;
        }

        .card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 24px;
            padding: 40px 32px;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 
                        inset 0 1px 0 rgba(255, 255, 255, 0.1);
            text-align: center;
            position: relative;
            overflow: hidden;
            animation: card-appear 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes card-appear {
            0% { transform: translateY(30px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
        }

        /* Card Light Border Animation Effect */
        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -150%;
            width: 50%;
            height: 100%;
            background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.05),
                transparent
            );
            transform: skewX(-25deg);
            transition: 0.75s;
        }

        .card:hover::before {
            left: 150%;
            transition: 0.75s;
        }

        /* Lock Icon Container */
        .icon-wrapper {
            width: 96px;
            height: 96px;
            margin: 0 auto 24px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .icon-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(244, 63, 94, 0.08);
            border-radius: 50%;
            border: 1px solid rgba(244, 63, 94, 0.2);
            animation: pulse-ring 2.5s infinite;
        }

        .icon-bg-inner {
            position: absolute;
            top: 10px;
            left: 10px;
            width: 76px;
            height: 76px;
            background: rgba(244, 63, 94, 0.12);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        @keyframes pulse-ring {
            0% { transform: scale(0.95); opacity: 1; box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.4); }
            70% { transform: scale(1.15); opacity: 0.5; box-shadow: 0 0 0 15px rgba(244, 63, 94, 0); }
            100% { transform: scale(0.95); opacity: 0; box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
        }

        .lock-icon {
            width: 36px;
            height: 36px;
            fill: var(--danger-color);
            z-index: 2;
            animation: lock-wiggle 4s infinite ease-in-out;
        }

        @keyframes lock-wiggle {
            0%, 90%, 100% { transform: rotate(0); }
            92% { transform: rotate(-8deg); }
            94% { transform: rotate(8deg); }
            96% { transform: rotate(-5deg); }
            98% { transform: rotate(5deg); }
        }

        /* Status Badge */
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(244, 63, 94, 0.1);
            border: 1px solid rgba(244, 63, 94, 0.2);
            padding: 6px 14px;
            border-radius: 100px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: var(--danger-color);
            margin-bottom: 20px;
        }

        .status-dot {
            width: 6px;
            height: 6px;
            background-color: var(--danger-color);
            border-radius: 50%;
            box-shadow: 0 0 8px var(--danger-color);
            animation: blink 1.5s infinite;
        }

        @keyframes blink {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
        }

        /* Typography */
        h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 26px;
            font-weight: 800;
            letter-spacing: -0.5px;
            margin-bottom: 12px;
            background: linear-gradient(135deg, #f8fafc 30%, #94a3b8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .subtitle {
            font-size: 14px;
            color: var(--text-muted);
            line-height: 1.6;
            margin-bottom: 28px;
            padding: 0 10px;
        }

        /* Reason Box */
        .reason-box {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.04);
            border-radius: 16px;
            padding: 16px;
            font-size: 13px;
            color: #cbd5e1;
            margin-bottom: 28px;
            line-height: 1.5;
            text-align: left;
            position: relative;
        }

        .reason-box::before {
            content: '';
            position: absolute;
            left: 0;
            top: 15%;
            height: 70%;
            width: 3px;
            background-color: var(--danger-color);
            border-radius: 0 4px 4px 0;
        }

        .reason-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-muted);
            margin-bottom: 6px;
            display: block;
        }

        /* Info items */
        .info-group {
            display: flex;
            justify-content: space-between;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            padding-top: 16px;
            margin-bottom: 28px;
            font-size: 12px;
        }

        .info-item {
            text-align: left;
        }

        .info-item.right {
            text-align: right;
        }

        .info-title {
            color: var(--text-muted);
            margin-bottom: 4px;
            font-weight: 500;
        }

        .info-val {
            font-weight: 600;
            color: #cbd5e1;
        }

        /* Buttons */
        .btn-check {
            width: 100%;
            padding: 14px 24px;
            border-radius: 16px;
            border: none;
            background: linear-gradient(135deg, var(--primary-glow), var(--secondary-glow));
            color: #ffffff;
            font-family: inherit;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }

        .btn-check:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
            filter: brightness(1.1);
        }

        .btn-check:active {
            transform: translateY(0);
            box-shadow: 0 2px 10px rgba(99, 102, 241, 0.2);
        }

        .btn-check:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
        }

        .spinner {
            width: 18px;
            height: 18px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            display: none;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Toast message */
        .toast {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: rgba(15, 23, 42, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.15);
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 600;
            color: #fff;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            z-index: 100;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            opacity: 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .toast.show {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }

        .toast-success-icon {
            fill: #10b981;
            width: 16px;
            height: 16px;
        }

        .toast-error-icon {
            fill: var(--danger-color);
            width: 16px;
            height: 16px;
        }

        /* Footer watermark */
        .watermark {
            margin-top: 24px;
            font-size: 10px;
            color: rgba(255, 255, 255, 0.15);
            letter-spacing: 2px;
            font-weight: 800;
        }
    </style>
</head>
<body>
    <div class="ambient-bg">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>
    </div>

    <div class="container">
        <div class="card">
            <div class="icon-wrapper">
                <div class="icon-bg"></div>
                <div class="icon-bg-inner">
                    <svg class="lock-icon" viewBox="0 0 24 24">
                        <path d="M18,8H17V6A5,5,0,0,0,7,6V8H6a3,3,0,0,0,-3,3v8a3,3,0,0,0,3,3H18a3,3,0,0,0,3,-3V11A3,3,0,0,0,18,8ZM9,6a3,3,0,0,1,6,0V8H9ZM12,17a1.5,1.5,0,1,1,1.5,-1.5A1.5,1.5,0,0,1,12,17Z"/>
                    </svg>
                </div>
            </div>

            <div class="status-badge">
                <div class="status-dot"></div>
                <span>Hệ thống đang khóa</span>
            </div>

            <h1>StudyGuard Lockout</h1>
            <p class="subtitle">Ứng dụng đã hết thời gian sử dụng.</p>

            <div class="reason-box">
                <span class="reason-label">Lý do khóa</span>
                ${reason || 'Không có lý do cụ thể.'}
            </div>

            <div class="info-group">
                <div class="info-item">
                    <div class="info-title">Ngày bắt đầu khóa</div>
                    <div class="info-val">${displayDate}</div>
                </div>
                <div class="info-item right">
                    <div class="info-title">Mở khóa bởi</div>
                    <div class="info-val">AI Agent (khi có lệnh)</div>
                </div>
            </div>

            <button class="btn-check" id="btnCheck">
                <span class="spinner" id="spinner"></span>
                <span id="btnText">Kiểm tra trạng thái</span>
            </button>

            <div class="watermark">STUDYGUARD SECURITY SYSTEM</div>
        </div>
    </div>

    <div class="toast" id="toast"></div>

    <script>
        const btnCheck = document.getElementById('btnCheck');
        const spinner = document.getElementById('spinner');
        const btnText = document.getElementById('btnText');
        const toast = document.getElementById('toast');

        function showToast(message, isSuccess = false) {
            const iconHTML = isSuccess 
                ? '<svg class="toast-success-icon" viewBox="0 0 24 24"><path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm-2,15L5,12l1.41-1.41L10,14.17l7.59-7.59L19,8Z"/></svg>'
                : '<svg class="toast-error-icon" viewBox="0 0 24 24"><path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm1,14H11V12h2Zm0-6H11V7h2Z"/></svg>';
            
            toast.innerHTML = iconHTML + ' ' + message;
            toast.className = 'toast show';
            
            setTimeout(() => {
                toast.className = 'toast';
            }, 3000);
        }

        btnCheck.addEventListener('click', async () => {
            btnCheck.disabled = true;
            spinner.style.display = 'block';
            btnText.textContent = 'Đang kiểm tra...';

            try {
                // Fetch dynamic lock status
                const res = await fetch('/api/lock-status');
                const data = await res.json();

                // Wait 800ms for nice animation effect
                await new Promise(resolve => setTimeout(resolve, 800));

                if (data.locked) {
                    showToast('Hệ thống vẫn đang bị khóa bởi Quản trị viên.', false);
                } else {
                    showToast('Mở khóa thành công! Đang tải lại ứng dụng...', true);
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                }
            } catch (err) {
                console.error(err);
                showToast('Lỗi kết nối máy chủ. Vui lòng thử lại sau.', false);
            } finally {
                btnCheck.disabled = false;
                spinner.style.display = 'none';
                btnText.textContent = 'Kiểm tra trạng thái';
            }
        });
    </script>
</body>
</html>`;
}

// ============================================================
// Cache trạng thái lock trong memory để giảm query DB
// ============================================================
let lockCache = null;
let lockCacheTime = 0;
const CACHE_TTL_MS = 5000; // 5 giây cache

/**
 * Đọc cấu hình khóa theo thứ tự ưu tiên:
 * 1. Biến môi trường (SYSTEM_LOCKED) — override cứng
 * 2. Database PostgreSQL (bảng system_config) — production Render
 * 3. File lock_config.json — local dev fallback
 */
async function getLockConfigAsync(db) {
    // Ưu tiên 1: Biến môi trường override cứng
    if (process.env.SYSTEM_LOCKED === 'true') {
        return {
            locked: true,
            lock_start_date: process.env.LOCK_START_DATE || new Date().toISOString().slice(0, 10),
            reason: process.env.LOCK_REASON || 'Hệ thống đã bị tạm khóa theo yêu cầu của Quản trị viên.'
        };
    }

    // Cache hit
    const now = Date.now();
    if (lockCache && (now - lockCacheTime) < CACHE_TTL_MS) {
        return lockCache;
    }

    // Ưu tiên 2: Database PostgreSQL
    if (db) {
        try {
            const { rows } = await db.query(
                "SELECT key, value FROM system_config WHERE key IN ('locked', 'lock_start_date', 'lock_reason')"
            );
            if (rows.length > 0) {
                const cfg = {};
                rows.forEach(r => { cfg[r.key] = r.value; });
                const result = {
                    locked: cfg.locked === 'true',
                    lock_start_date: cfg.lock_start_date || '',
                    reason: cfg.lock_reason || ''
                };
                lockCache = result;
                lockCacheTime = now;
                return result;
            }
        } catch (e) {
            console.error('[LockMiddleware] DB read error:', e.message);
        }
    }

    // Ưu tiên 3: File lock_config.json (local fallback)
    try {
        const configPath = path.join(__dirname, '..', '..', '..', 'lock_config.json');
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            return {
                locked: !!config.locked,
                lock_start_date: config.lock_start_date || '',
                reason: config.reason || ''
            };
        }
    } catch (e) {
        console.error('[LockMiddleware] Error reading lock_config.json:', e);
    }

    return { locked: false, lock_start_date: '', reason: '' };
}

/**
 * Cập nhật trạng thái khóa vào database và xóa cache
 */
async function setLockState(db, locked, reason, startDate) {
    const lockedVal = locked ? 'true' : 'false';
    const dateVal = startDate || new Date().toISOString().slice(0, 10);
    const reasonVal = reason || (locked ? 'Hệ thống đang tạm khóa theo yêu cầu Quản trị viên.' : '');

    await db.query(`
        INSERT INTO system_config (key, value, updated_at) VALUES 
            ('locked', $1, NOW()),
            ('lock_start_date', $2, NOW()),
            ('lock_reason', $3, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `, [lockedVal, dateVal, reasonVal]);

    // Xóa cache để lần sau đọc mới
    lockCache = null;
    lockCacheTime = 0;
}

module.exports = function lockMiddleware(req, res, next) {
    const db = req.app.get('db') || null;

    // 1. API lấy trạng thái khóa (không cần auth)
    if (req.path === '/api/lock-status') {
        return getLockConfigAsync(db).then(config => {
            res.json({
                locked: config.locked,
                lock_start_date: config.lock_start_date,
                reason: config.reason
            });
        }).catch(() => {
            res.json({ locked: false });
        });
    }

    // 2. API khóa hệ thống (Super Admin)
    if (req.path === '/api/admin/system/set-lock' && req.method === 'POST') {
        if (!req.session || !req.session.isAdmin) {
            return res.status(403).json({ success: false, message: 'Quyền truy cập bị từ chối' });
        }
        const { locked, reason, start_date } = req.body || {};
        if (typeof locked !== 'boolean') {
            return res.status(400).json({ success: false, message: 'Thiếu trường locked (true/false)' });
        }
        return setLockState(db, locked, reason, start_date)
            .then(() => {
                res.json({ success: true, message: locked ? '🔒 Đã khóa hệ thống.' : '🔓 Đã mở khóa hệ thống.' });
            })
            .catch(err => {
                console.error('[LockMiddleware] setLockState error:', err);
                res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái khóa.' });
            });
    }

    // 3. Kiểm tra trạng thái khóa cho các request thông thường
    getLockConfigAsync(db).then(config => {
        if (config.locked) {
            const now = new Date();
            const tzOffset = now.getTimezoneOffset() * 60000;
            const localDateStr = (new Date(now - tzOffset)).toISOString().slice(0, 10);

            if (!config.lock_start_date || localDateStr >= config.lock_start_date) {
                // API request → JSON lỗi
                if (req.path.startsWith('/api/')) {
                    return res.status(423).json({
                        success: false,
                        message: config.reason || 'Hệ thống đã bị tạm khóa theo yêu cầu của Quản trị viên.'
                    });
                }

                // Page request → HTML trang khóa
                const acceptHeader = req.headers.accept || '';
                if (acceptHeader.includes('text/html') || !req.path.includes('.')) {
                    res.status(423);
                    return res.send(getLockPageHTML(config.reason, config.lock_start_date));
                }
            }
        }
        next();
    }).catch(err => {
        console.error('[LockMiddleware] Unexpected error:', err);
        next();
    });
};

module.exports.setLockState = setLockState;
module.exports.getLockConfigAsync = getLockConfigAsync;
