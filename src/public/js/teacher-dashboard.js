// teacher-dashboard.js - Global Monitoring for Teachers
const socket = io();
const onlineStudents = {}; // { student_id: { name, avatar_color, room_code, state } }

// Toast helper
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

// Check Auth
async function checkAuth() {
    try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!data.success || !data.user.is_admin) {
            window.location.href = '/dashboard';
            return;
        }
        document.getElementById('teacherName').textContent = 'Chào thầy/cô, ' + data.user.display_name;
    } catch {
        window.location.href = '/login';
    }
}

// Load Overview
async function loadOverview() {
    try {
        const res = await fetch('/api/admin/system/overview');
        const data = await res.json();
        if (data.success) {
            const { stats } = data;
            document.getElementById('totalStudents').textContent = stats.total_students;
            document.getElementById('totalTime').textContent = Math.round(stats.total_minutes / 60) + ' giờ';
            document.getElementById('activeToday').textContent = stats.active_today;
        }
    } catch (err) {
        console.error('Overview error:', err);
    }
}

// Load All Students
async function loadAllStudents() {
    const list = document.getElementById('studentTableBody');
    try {
        const res = await fetch('/api/admin/system/students');
        const data = await res.json();
        if (data.success && data.students.length > 0) {
            list.innerHTML = data.students.map(s => `
                <tr>
                    <td><strong>${s.name}</strong></td>
                    <td>${s.parent_name}</td>
                    <td style="font-family: monospace; color: var(--primary);">${s.room_code}</td>
                    <td>${formatDuration(s.total_seconds)}</td>
                    <td style="color: var(--text-dark); font-size: 0.8rem;">
                        ${s.last_active ? new Date(s.last_active).toLocaleString('vi-VN') : 'Chưa bắt đầu'}
                    </td>
                </tr>
            `).join('');
        } else {
            list.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Chưa có dữ liệu</td></tr>';
        }
    } catch (err) {
        list.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Lỗi tải dữ liệu</td></tr>';
    }
}

// Load Initial Online Students
async function loadMonitoring() {
    try {
        const res = await fetch('/api/admin/system/online-students');
        const data = await res.json();
        if (data.success) {
            data.students.forEach(s => {
                onlineStudents[s.id] = s;
            });
            renderMonitor();
        }
    } catch (err) {
        console.error('Monitoring error:', err);
    }
}

// Render Monitor Grid
function renderMonitor() {
    const grid = document.getElementById('monitorGrid');
    const ids = Object.keys(onlineStudents);
    
    document.getElementById('onlineCount').textContent = ids.length;

    if (ids.length === 0) {
        grid.innerHTML = '<div class="empty-monitor"><p>Hiện tại không có học sinh nào đang học.</p></div>';
        return;
    }

    grid.innerHTML = ids.map(id => {
        const s = onlineStudents[id];
        let statusClass = 'status-studying';
        let cardClass = '';
        let statusText = 'Đang học';

        if (s.state === 'distracted') {
            statusClass = 'status-distracted';
            cardClass = 'distracted';
            statusText = 'Mất tập trung';
        } else if (s.state === 'not_studying') {
            statusClass = 'status-not-studying';
            cardClass = 'off';
            statusText = 'Không học';
        }

        return `
            <div class="monitor-card ${cardClass}" data-id="${id}">
                <div class="student-head">
                    <div class="student-profile">
                        <div class="avatar" style="background:${s.avatar_color || '#10b981'}">${s.name.charAt(0)}</div>
                        <div>
                            <div class="student-name">${s.name}</div>
                            <div class="room-tag">${s.room_code}</div>
                        </div>
                    </div>
                    <div class="status-indicator ${statusClass}"></div>
                </div>
                <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">
                    ${statusText}
                </div>
            </div>
        `;
    }).join('');
}

// Format Duration
function formatDuration(seconds) {
    if (!seconds || seconds < 0) return '0 phút';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h} giờ ${m} phút`;
    return `${m} phút`;
}

// Socket Events
socket.on('student:online', async (data) => {
    // Optionally fetch full student data if not in memory
    if (!onlineStudents[data.student_id]) {
        // Just reload for now or wait for first status update
        loadMonitoring();
    }
});

socket.on('student:offline', (data) => {
    delete onlineStudents[data.student_id];
    renderMonitor();
});

socket.on('status:changed', (data) => {
    if (onlineStudents[data.student_id]) {
        onlineStudents[data.student_id].state = data.state;
        renderMonitor();
    } else {
        // New student just started
        loadMonitoring();
    }
});

socket.on('violation:alert', (data) => {
    showToast(`⚠️ Cảnh báo: ${data.student_name} (${data.type})`, 'warning');
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
});

// Init
checkAuth();
loadOverview();
loadAllStudents();
loadMonitoring();

// Auto refresh lists periodically
setInterval(loadOverview, 60000);
setInterval(loadAllStudents, 60000);
