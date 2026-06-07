/**
 * Service to handle rankings, weekly resets and Hall of Fame
 */

async function getWeeklyWinners(db) {
    const { rows } = await db.query(`
        SELECT week_start_date, student_name, avatar_color, total_focus_seconds, rank
        FROM weekly_winners
        WHERE week_start_date = (SELECT MAX(week_start_date) FROM weekly_winners)
        ORDER BY rank ASC
    `);
    return rows;
}

async function performWeeklyReset(db) {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Calculate Top 15 of the CURRENT week
        // We define the week start as the most recent Monday
        const weekStartResult = await client.query("SELECT CURRENT_DATE - (CAST(EXTRACT(DOW FROM CURRENT_DATE) AS INTEGER) + 6) % 7 as week_start");
        const weekStartDate = weekStartResult.rows[0].week_start;

        const top15Query = `
            SELECT 
                s.name as student_name, 
                s.avatar_color,
                SUM(ss.total_focus_seconds) as total_focus_seconds
            FROM study_sessions ss
            JOIN students s ON ss.student_id = s.id
            GROUP BY s.id, s.name, s.avatar_color
            ORDER BY total_focus_seconds DESC
            LIMIT 15;
        `;
        const { rows: top15 } = await client.query(top15Query);

        if (top15.length > 0) {
            // 2. Save to weekly_winners
            const insertQuery = `
                INSERT INTO weekly_winners (week_start_date, student_name, avatar_color, total_focus_seconds, rank)
                VALUES ($1, $2, $3, $4, $5)
            `;

            for (let i = 0; i < top15.length; i++) {
                const s = top15[i];
                await client.query(insertQuery, [
                    weekStartDate,
                    s.student_name,
                    s.avatar_color,
                    Math.round(s.total_focus_seconds),
                    i + 1
                ]);
            }
        }

        // 3. Clear all study data (as requested)
        // Note: study_sessions has foreign keys to students, but violations has foreign key to study_sessions.
        // We must delete violations first.
        await client.query('DELETE FROM violations');
        await client.query('DELETE FROM study_sessions');

        await client.query('COMMIT');
        return { success: true, count: top15.length, week_start: weekStartDate };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Reset Error:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function isResetNeeded(db) {
    try {
        // Find the most recent Monday
        const weekStartResult = await db.query("SELECT CURRENT_DATE - (CAST(EXTRACT(DOW FROM CURRENT_DATE) AS INTEGER) + 6) % 7 as week_start");
        const currentWeekStart = weekStartResult.rows[0].week_start;

        // Check if we already have winners for this week
        const { rows } = await db.query("SELECT id FROM weekly_winners WHERE week_start_date = $1 LIMIT 1", [currentWeekStart]);
        
        return rows.length === 0;
    } catch (err) {
        console.error('Check Reset Need Error:', err);
        return false;
    }
}

module.exports = {
    getWeeklyWinners,
    performWeeklyReset,
    isResetNeeded
};
