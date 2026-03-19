const API_BASE = "";

async function initLeaderboard() {
    try {
        const res = await fetch(`${API_BASE}/api/leaderboard`);
        const data = await res.json();
        
        if (data.success) {
            renderLeaderboard(data.leaderboard);
        } else {
            document.getElementById('leaderboard-list').innerHTML = `
                <div style="text-align: center; color: #ef4444; padding: 20px; font-size: 10px; font-weight: 600;">
                    FAILED TO LOAD LEADERBOARD
                </div>
            `;
        }
    } catch (err) {
        console.error("Leaderboard fetch failed:", err);
        document.getElementById('leaderboard-list').innerHTML = `
            <div style="text-align: center; color: #ef4444; padding: 20px; font-size: 10px; font-weight: 600;">
                SERVER ERROR
            </div>
        `;
    }
}

function renderLeaderboard(leaderboardData) {
    const listContainer = document.getElementById('leaderboard-list');
    
    if (!leaderboardData || leaderboardData.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; color: #94a3b8; padding: 20px; font-size: 10px;">
                NO HUNTERS FOUND
            </div>
        `;
        return;
    }

    const html = leaderboardData.map((hunter, index) => {
        let rankClass = "";
        let rankIcon = "";
        
        if (index === 0) {
            rankClass = "sl-lb-gold";
            rankIcon = "👑 ";
        } else if (index === 1) {
            rankClass = "sl-lb-silver";
            rankIcon = "🥈 ";
        } else if (index === 2) {
            rankClass = "sl-lb-bronze";
            rankIcon = "🥉 ";
        }

        return `
            <div class="sl-lb-item ${rankClass}">
                <div class="sl-lb-pos">#${hunter.lb_rank}</div>
                <div class="sl-lb-info">
                    <div class="sl-lb-name">${rankIcon}${hunter.hunter_name.toUpperCase()}</div>
                    <div class="sl-lb-rank-badge ${hunter.hunter_rank === 'MONARCH' || hunter.hunter_rank === 'S-Rank' ? 'sl-lb-elite' : ''}">${hunter.hunter_rank.toUpperCase()}</div>
                </div>
                <div class="sl-lb-stats">
                    <div class="sl-lb-level">LVL ${hunter.level}</div>
                    <div class="sl-lb-xp">${hunter.xp} XP</div>
                </div>
            </div>
        `;
    }).join("");

    listContainer.innerHTML = html;
}

// Initialize on load
initLeaderboard();
