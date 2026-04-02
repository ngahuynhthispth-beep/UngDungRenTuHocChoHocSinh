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

// Load Rankings
async function loadRankings() {
    const container = document.getElementById('rankingsContainer');
    try {
        const res = await fetch('/api/admin/system/rankings');
        const data = await res.json();
        
        if (data.success && Object.keys(data.rankings).length > 0) {
            container.innerHTML = Object.keys(data.rankings).map(day => {
                const dayRankings = data.rankings[day];
                const dateStr = new Date(day).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                
                const tableRows = dayRankings.map((s, index) => {
                    const rank = index + 1;
                    let medal = `<div class="rank-medal">${rank}</div>`;
                    if (rank === 1) medal = `<div class="rank-medal">🥇</div>`;
                    else if (rank === 2) medal = `<div class="rank-medal">🥈</div>`;
                    else if (rank === 3) medal = `<div class="rank-medal">🥉</div>`;
                    
                    const rowClass = rank <= 3 ? `row-rank-${rank}` : '';
                    
                    return `
                        <tr class="${rowClass}">
                            <td>${medal}</td>
                            <td>
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <div class="avatar" style="background:${s.avatar_color || '#10b981'}; width:30px; height:30px; font-size:0.8rem;">${s.name.charAt(0)}</div>
                                    <strong>${s.name}</strong>
                                </div>
                            </td>
                            <td><span style="color:var(--primary); font-weight:700;">${formatDuration(s.total_focus_seconds)}</span></td>
                            <td style="color:var(--warning);">${s.total_violations} lần</td>
                        </tr>
                    `;
                }).join('');

                return `
                    <div class="daily-rank-container">
                        <h4 class="rank-day-title">📅 ${dateStr}</h4>
                        <div class="table-card" style="padding:0;">
                            <table>
                                <thead>
                                    <tr>
                                        <th style="width:60px;">Hạng</th>
                                        <th>Học sinh</th>
                                        <th>Thời gian tập trung</th>
                                        <th>Vi phạm</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tableRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<div class="empty-monitor"><p>Chưa có dữ liệu vinh danh cho tuần này.</p></div>';
        }
    } catch (err) {
        console.error('Rankings load error:', err);
        container.innerHTML = '<div class="empty-monitor"><p style="color:red;">Lỗi khi tải bảng vinh danh</p></div>';
    }
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
loadRankings();
loadAllStudents();
loadMonitoring();

// Auto refresh lists periodically
setInterval(loadOverview, 60000);
setInterval(loadRankings, 120000); // 2 mins for rankings
setInterval(loadAllStudents, 60000);
