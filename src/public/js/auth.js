// Auth.js - Handle login and register forms
function showError(msg) {
    const el = document.getElementById('errorMsg');
    el.textContent = msg;
    el.classList.add('show');
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

// Register form
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        btn.disabled = true;
        btn.textContent = 'Đang đăng ký...';

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: document.getElementById('username').value.trim(),
                    password: document.getElementById('password').value,
                    display_name: document.getElementById('displayName').value.trim()
                })
            });

            const data = await res.json();
            if (data.success) {
                showToast('Đăng ký thành công! Đang chuyển hướng...');
                setTimeout(() => window.location.href = '/dashboard', 1000);
            } else {
                showError(data.message);
                btn.disabled = false;
                btn.textContent = '✨ Đăng ký';
            }
        } catch (err) {
            showError('Lỗi kết nối server');
            btn.disabled = false;
            btn.textContent = '✨ Đăng ký';
        }
    });
}

// Login form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        btn.disabled = true;
        btn.textContent = 'Đang đăng nhập...';

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: document.getElementById('username').value.trim(),
                    password: document.getElementById('password').value
                })
            });

            const data = await res.json();
            if (data.success) {
                if (data.user && data.user.is_admin) {
                    window.location.href = '/teacher-dashboard';
                } else {
                    window.location.href = '/dashboard';
                }
            } else {
                showError(data.message);
                btn.disabled = false;
                btn.textContent = '🔑 Đăng nhập';
            }
        } catch (err) {
            showError('Lỗi kết nối server');
            btn.disabled = false;
            btn.textContent = '🔑 Đăng nhập';
        }
    });
}
