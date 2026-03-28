// Dashboard.js - Parent Dashboard
const socket = io();
let students = [];
const onlineStudents = {};

// Toast helper
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

// Check auth
async function checkAuth() {
    try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.success) {
            document.getElementById('userName').textContent = data.user.display_name;
            // Hiển thị nút Quản trị tổng nếu là Admin
            if (data.user.is_admin) {
                const adminBtn = document.getElementById('superAdminBtn');
                if (adminBtn) adminBtn.style.display = 'flex';
            }
        } else {
            window.location.href = '/login';
        }
    } catch {
        window.location.href = '/login';
    }
}

// Load students
async function loadStudents() {
    try {
        const res = await fetch('/api/students');
        const data = await res.json();
        if (data.success) {
            students = data.students;
            renderStudents();
        }
    } catch (err) {
        console.error('Load students error:', err);
    }
}

// Load today stats
async function loadStats() {
    try {
        const res = await fetch('/api/sessions/stats/today');
        const data = await res.json();
        if (data.success) {
            const { total_time, total_violations, focus_percent } = data.stats;
            const minutes = Math.round(total_time / 60);
            document.getElementById('statTime').textContent = minutes > 60 ? `${Math.floor(minutes/60)}h${minutes%60}p` : `${minutes}p`;
            document.getElementById('statViolations').textContent = total_violations;
            document.getElementById('statFocus').textContent = `${focus_percent}%`;
        }
    } catch (err) {
        console.error('Load stats error:', err);
    }
}

// Render student cards
function renderStudents() {
    const list = document.getElementById('studentList');
    const empty = document.getElementById('emptyState');

    if (students.length === 0) {
        list.innerHTML = '';
        list.appendChild(empty);
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    list.innerHTML = students.map(s => {
        const online = onlineStudents[s.id];
        const statusClass = online ? (online.state === 'not_studying' ? 'violation' : 'online') : '';
        const statusBadge = online
            ? (online.state === 'studying'
                ? '<span class="status-badge status-studying">✅ Đang học</span>'
                : online.state === 'distracted'
                    ? '<span class="status-badge status-distracted">⚠️ Mất tập trung</span>'
                    : '<span class="status-badge status-not-studying">❌ Không học</span>')
            : '<span class="status-badge status-offline">⚫ Offline</span>';

        const initial = s.name.charAt(0).toUpperCase();

        return `
            <div class="student-card ${statusClass}" data-id="${s.id}">
                <div class="student-card-header">
                    <div class="student-info">
                        <div class="student-avatar" style="background:${s.avatar_color}">${initial}</div>
                        <div>
                            <div class="student-name">${s.name}</div>
                            <div class="room-code">🔑 ${s.room_code}</div>
                        </div>
                    </div>
                    ${statusBadge}
                </div>
                <div class="student-card-body">
                    <div class="study-time">
                        ${online ? '⏱ Đang học...' : ''}
                    </div>
                    <button class="delete-student-btn" onclick="deleteStudent(${s.id}, event)" title="Xóa">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

// Delete student
async function deleteStudent(id, event) {
    event.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa học sinh này?')) return;

    try {
        const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast('Đã xóa học sinh');
            loadStudents();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Lỗi kết nối', 'error');
    }
}

// Add student modal
const addModal = document.getElementById('addModal');
const addBtn = document.getElementById('addStudentBtn');
const cancelBtn = document.getElementById('cancelAddBtn');
const confirmBtn = document.getElementById('confirmAddBtn');
const roomCodeResult = document.getElementById('roomCodeResult');

addBtn.addEventListener('click', () => {
    addModal.classList.add('show');
    document.getElementById('studentNameInput').value = '';
    roomCodeResult.style.display = 'none';
    confirmBtn.style.display = 'block';
    document.getElementById('studentNameInput').focus();
});

cancelBtn.addEventListener('click', () => {
    addModal.classList.remove('show');
    loadStudents();
});

confirmBtn.addEventListener('click', async () => {
    const name = document.getElementById('studentNameInput').value.trim();
    if (!name) {
        showToast('Vui lòng nhập tên', 'error');
        return;
    }

    confirmBtn.disabled = true;
    try {
        const res = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('generatedCode').textContent = data.student.room_code;
            roomCodeResult.style.display = 'block';
            confirmBtn.style.display = 'none';
            showToast(`Đã thêm ${name}!`);
            loadStudents();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Lỗi kết nối', 'error');
    }
    confirmBtn.disabled = false;
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
});

// Socket.io events
socket.on('student:online', (data) => {
    onlineStudents[data.student_id] = { state: 'studying' };
    renderStudents();
    showToast('📚 Con đã bắt đầu học!');
});

socket.on('student:offline', (data) => {
    delete onlineStudents[data.student_id];
    renderStudents();
    if (data.reason === 'disconnected') {
        showToast('⚠️ Con đã tắt camera', 'warning');
    }
    loadStats();
});

socket.on('status:changed', (data) => {
    onlineStudents[data.student_id] = { state: data.state };
    renderStudents();
});

socket.on('violation:alert', (data) => {
    const msg = data.type === 'distracted'
        ? `⚠️ ${data.student_name} đang mất tập trung!`
        : `❌ ${data.student_name} không học!`;
    showToast(msg, 'warning');

    // Browser notification
    if (Notification.permission === 'granted') {
        new Notification('StudyGuard', { body: msg, icon: '📚' });
    }
});

socket.on('session:summary', (data) => {
    loadStats();
});

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Init
checkAuth();
loadStudents();
loadStats();

// Refresh stats every 30s
setInterval(loadStats, 30000);
