document.addEventListener('DOMContentLoaded', () => {
    const reportDateInput = document.getElementById('reportDate');
    const reportContainer = document.getElementById('reportContainer');

    // Set today's date as default
    const today = new Date();
    // Adjust for timezone to get local YYYY-MM-DD
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    reportDateInput.value = localDate;

    // Load initial data
    loadReport(localDate);

    // Listen for date changes
    reportDateInput.addEventListener('change', (e) => {
        loadReport(e.target.value);
    });

    async function loadReport(date) {
        try {
            reportContainer.innerHTML = '<div class="empty-state">Đang tải dữ liệu...</div>';
            
            const req = await fetch(`/api/sessions/admin/daily-report?date=${date}`);
            const res = await req.json();

            if (!res.success) {
                if (req.status === 401) {
                    window.location.href = '/login';
                }
                reportContainer.innerHTML = `<div class="empty-state" style="color:#ef4444">Lỗi: ${res.message}</div>`;
                return;
            }

            const reportData = res.report;
            renderLeaderboard(reportData);
            renderSummary(reportData);
        } catch (error) {
            console.error(error);
            reportContainer.innerHTML = '<div class="empty-state" style="color:#ef4444">Không thể kết nối với server</div>';
        }
    }

    function formatTime(totalSeconds) {
        if (totalSeconds === 0) return '0s';
        if (totalSeconds < 60) return `${totalSeconds}s`;
        const minutes = Math.floor(totalSeconds / 60);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) {
            const mins = minutes % 60;
            return `${hours}h ${mins}p`;
        }
        return `${minutes} phút`;
    }

    function renderSummary(students) {
        if (!students) return;
        
        const total = students.length;
        const active = students.filter(s => parseInt(s.session_count) > 0).length;
        const totalSecs = students.reduce((sum, s) => sum + (parseInt(s.total_time) || 0), 0);
        
        document.getElementById('totalStudents').textContent = total;
        document.getElementById('activeStudents').textContent = active;
        document.getElementById('combinedTime').textContent = formatTime(totalSecs);
    }

    function renderLeaderboard(students) {
        if (!students || students.length === 0) {
            reportContainer.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 3rem; margin-bottom: 10px;">📭</div>
                    <p>Chưa có dữ liệu học sinh.<br>Hãy thêm học sinh bên trang Dashboard.</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="report-header">
                <h3>Thống kê ngày</h3>
                <div class="date-picker-container">
                    <label for="reportDate">Chọn ngày:</label>
                    <input type="date" id="reportDate" class="date-input">
                </div>
            </div>

            <!-- Summary Stats -->
            <div id="summaryStats" class="admin-stats">
                <div class="stat-card">
                    <div class="value" id="totalStudents">0</div>
                    <div class="label">Tổng học sinh</div>
                </div>
                <div class="stat-card">
                    <div class="value" id="activeStudents">0</div>
                    <div class="label">Đã vào học</div>
                </div>
                <div class="stat-card">
                    <div class="value" id="combinedTime">0h</div>
                    <div class="label">Tổng thời gian</div>
                </div>
            </div>
            <table class="leaderboard">
                <thead>
                    <tr>
                        <th style="width: 50px; text-align: center;">Hạng</th>
                        <th>Học sinh</th>
                        <th>Trạng thái</th>
                        <th style="text-align: right;">Thời gian học</th>
                    </tr>
                </thead>
                <tbody>
        `;

        students.forEach((student, index) => {
            const rank = index + 1;
            let rankClass = '';
            if (rank === 1) rankClass = 'rank-1';
            else if (rank === 2) rankClass = 'rank-2';
            else if (rank === 3) rankClass = 'rank-3';

            const rankDisplay = rank <= 3 ? 
                (rank === 1 ? '🥇' : (rank === 2 ? '🥈' : '🥉')) : 
                rank;

            const totalTime = parseInt(student.total_time) || 0;
            const sessionCount = parseInt(student.session_count) || 0;
            
            let statusHtml = '';
            if (sessionCount > 0) {
                statusHtml = '<span class="status-badge status-active">Đã vào học</span>';
            } else {
                statusHtml = '<span class="status-badge status-inactive">Chưa mở app</span>';
            }

            html += `
                <tr>
                    <td class="rank ${rankClass}">${rankDisplay}</td>
                    <td>
                        <div class="student-cell">
                            <div class="avatar" style="background-color: ${student.avatar_color || '#10b981'}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                                ${student.name.charAt(0).toUpperCase()}
                            </div>
                            <span style="font-weight: 500;">${student.name}</span>
                        </div>
                    </td>
                    <td>${statusHtml}</td>
                    <td class="time-cell" style="text-align: right; color: ${totalTime > 0 ? '#10b981' : 'rgba(255,255,255,0.3)'}">
                        ${totalTime > 0 ? formatTime(totalTime) : '0s'}
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
            <style>
                .empty-state {
                    text-align: center;
                    padding: 40px 20px;
                    color: rgba(255,255,255,0.6);
                }
                
                /* Stats summary in admin */
                .admin-stats {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                    margin-bottom: 30px;
                }
                .stat-card {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 15px;
                    border-radius: 12px;
                    text-align: center;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .stat-card .value { font-size: 1.5rem; font-weight: 700; color: #10b981; }
                .stat-card .label { font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-top: 5px; }

                @media (max-width: 600px) {
                    .admin-stats { grid-template-columns: 1fr; }
                }
            </style>
        `;

        reportContainer.innerHTML = html;
    }
});
