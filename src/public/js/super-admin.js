document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check if user is admin (redirect if not)
    try {
        const authReq = await fetch('/api/auth/me');
        const authRes = await authReq.json();
        
        if (!authRes.success || !authRes.user.is_admin) {
            window.location.href = '/dashboard';
            return;
        }
        
        // 2. Load Overview Stats
        loadOverview();
        
        // 3. Load Parent List
        loadParents();
        
        // 4. Load Student List
        loadStudents();

    } catch (error) {
        console.error('Super Admin Init Error:', error);
        window.location.href = '/login';
    }

    function formatDuration(seconds) {
        if (!seconds || seconds < 0) return '0 phút';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h} giờ ${m} phút`;
        return `${m} phút`;
    }

    async function loadOverview() {
        try {
            const req = await fetch('/api/admin/system/overview');
            const res = await req.json();
            
            if (res.success) {
                const { stats } = res;
                document.getElementById('totalParents').textContent = stats.total_parents;
                document.getElementById('totalStudents').textContent = stats.total_students;
                document.getElementById('totalTime').textContent = Math.round(stats.total_minutes / 60) + ' giờ';
                document.getElementById('activeToday').textContent = stats.active_today;
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function loadParents() {
        const list = document.getElementById('parentsList');
        try {
            const req = await fetch('/api/admin/system/parents');
            const res = await req.json();
            
            if (res.success && res.parents.length > 0) {
                list.innerHTML = res.parents.map(p => `
                    <tr>
                        <td><strong>${p.display_name}</strong></td>
                        <td style="color: var(--text-dark);">${p.username}</td>
                        <td>${p.student_count} con</td>
                        <td style="color: var(--text-dark); font-size: 0.8rem;">
                            ${new Date(p.created_at).toLocaleDateString('vi-VN')}
                        </td>
                    </tr>
                `).join('');
            } else {
                list.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Chưa có gia đình nào đăng ký</td></tr>';
            }
        } catch (err) {
            list.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Lỗi tải danh sách</td></tr>';
        }
    }

    async function loadStudents() {
        const list = document.getElementById('studentsList');
        try {
            const req = await fetch('/api/admin/system/students');
            const res = await req.json();
            
            if (res.success && res.students.length > 0) {
                list.innerHTML = res.students.map(s => `
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
                list.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Chưa có học sinh nào trong hệ thống</td></tr>';
            }
        } catch (err) {
            list.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Lỗi tải danh sách học sinh</td></tr>';
        }
    }
});
