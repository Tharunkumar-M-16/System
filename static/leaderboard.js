const API_BASE = "";

const ICONS = {
    gold: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#fcd34d" stroke="#b45309" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    silver: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#e2e8f0" stroke="#64748b" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    bronze: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#fb923c" stroke="#9a3412" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
};

let bgmPlayer = null;
const BGM_URL = '/static/dark_aira.mp3'; 

let bgmInterval = null;

function initBGM() {
    if (!bgmPlayer) {
        bgmPlayer = new Audio(BGM_URL);
        bgmPlayer.loop = true;
        bgmPlayer.volume = 0.2;
    }
}

function startBGM() {
    initBGM();
    const savedTime = localStorage.getItem('sl-bgm-time');
    if (savedTime && parseFloat(savedTime) > 0) {
        bgmPlayer.currentTime = parseFloat(savedTime);
    }
    
    bgmPlayer.play().then(() => {
        if (!bgmInterval) {
            bgmInterval = setInterval(() => {
                if (bgmPlayer && !bgmPlayer.paused) {
                    localStorage.setItem('sl-bgm-time', bgmPlayer.currentTime);
                }
            }, 1000);
        }
    }).catch(err => {
        document.addEventListener('click', () => {
            bgmPlayer.play();
            if (!bgmInterval) {
                bgmInterval = setInterval(() => {
                    if (bgmPlayer && !bgmPlayer.paused) {
                        localStorage.setItem('sl-bgm-time', bgmPlayer.currentTime);
                    }
                }, 1000);
            }
        }, { once: true });
    });
}

async function initLeaderboard() {
    startBGM();
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
        if (index === 0) {
            rankClass = "sl-lb-gold";
            rankIcon = `<span style="margin-right:8px; display:inline-flex; align-items:center;">${ICONS.gold}</span>`;
        } else if (index === 1) {
            rankClass = "sl-lb-silver";
            rankIcon = `<span style="margin-right:8px; display:inline-flex; align-items:center;">${ICONS.silver}</span>`;
        } else if (index === 2) {
            rankClass = "sl-lb-bronze";
            rankIcon = `<span style="margin-right:8px; display:inline-flex; align-items:center;">${ICONS.bronze}</span>`;
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
