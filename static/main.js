const API_BASE = "";

let state = {
    profile: null,
    checked: [],
    claiming: false,
    rewardData: null,
    bgmPlayer: null,
    authMode: 'login',
    loggedIn: false
};

const SFX_URLS = {
    'stat_up': 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Digital blip
    'level_up': 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Level up fanfare
    'quest_complete': 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Success
    'error': 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3', // Error buzz
    'click': 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3' // Subtle click
};

// Local BGM: Place your "dark_aira.mp3" in the static folder
const BGM_URL = '/static/dark_aira.mp3'; 

function initBGM() {
    if (!state.bgmPlayer) {
        state.bgmPlayer = new Audio(BGM_URL);
        state.bgmPlayer.loop = true;
        state.bgmPlayer.volume = 0.2;
    }
}

// Global click listener to unlock audio (browser requirement)
document.addEventListener('click', () => {
    initBGM();
    if (state.bgmPlayer) {
        // Resume from last known position
        const savedTime = localStorage.getItem('sl-bgm-time');
        if (savedTime) state.bgmPlayer.currentTime = parseFloat(savedTime);
        
        state.bgmPlayer.play().catch(e => {
            console.error("BGM Play Error: Make sure /static/dark_aira.mp3 exists.", e);
        });

        // Sync time to localStorage every second
        setInterval(() => {
            if (state.bgmPlayer && !state.bgmPlayer.paused) {
                localStorage.setItem('sl-bgm-time', state.bgmPlayer.currentTime);
            }
        }, 1000);
    }
}, { once: true });


async function init() {
    await checkAuth();
}

async function checkAuth() {
    try {
        const res = await fetch(`${API_BASE}/api/check-auth`);
        const data = await res.json();
        if (data.logged_in) {
            state.loggedIn = true;
            await fetchProfile();
        } else {
            state.loggedIn = false;
        }
    } catch (err) {
        console.error("Auth check failed:", err);
    }
    render();
}

async function fetchProfile() {
    try {
        const res = await fetch(`${API_BASE}/api/status`);
        if (res.status === 401) {
            state.loggedIn = false;
            return;
        }
        state.profile = await res.json();
        state.checked = [];
        state.rewardData = null;
    } catch (err) {
        console.error("Failed to fetch profile:", err);
    }
}

async function handleAuth(e) {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
    const endpoint = state.authMode === 'login' ? '/api/login' : '/api/register';

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
            if (state.authMode === 'register') {
                alert("Hunter profile created! Please login.");
                state.authMode = 'login';
                render();
            } else {
                state.loggedIn = true;
                await fetchProfile();
                render();
            }
        } else {
            playSFX('error');
            alert(data.error || "Authentication failed");
        }
    } catch (err) {
        alert("Server error");
    }
}

async function logout() {
    await fetch(`${API_BASE}/api/logout`, { method: 'POST' });
    state.loggedIn = false;
    state.profile = null;
    state.rewardData = null;
    state.checked = [];
    render();
}

function switchAuthMode() {
    state.authMode = state.authMode === 'login' ? 'register' : 'login';
    render();
}

function toggleQuest(id) {
    if (state.rewardData) return;
    playSFX('click');
    if (state.checked.includes(id)) {
        state.checked = state.checked.filter(x => x !== id);
    } else {
        state.checked.push(id);
    }
    render();
}

async function claimRewards() {
    const quests = state.profile.current_phase.quests;
    if (state.checked.length !== quests.length || state.claiming || state.rewardData) return;

    state.claiming = true;
    render();

    try {
        const res = await fetch(`${API_BASE}/api/complete-daily`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pushups_done: 25, run_done: true }),
        });
        const data = await res.json();
        if (data.success) {
            state.rewardData = data;
            const oldLevel = state.profile.level;
            await fetchProfile();
            
            if (state.profile.level > oldLevel) {
                playSFX('level_up');
            } else {
                playSFX('quest_complete');
            }

            // Check for Special Quest Trigger
            if (data.special_trigger) {
                showSpecialQuestPopup(data.special_quest_data);
            }

            // Keep rewardData visible after profile refresh
            state.rewardData = data;
        } else {
            alert("Error: " + data.error);
        }
    } catch (err) {
        console.error("Failed to claim rewards:", err);
    } finally {
        state.claiming = false;
        render();
    }
}

function showSpecialQuestPopup(quest) {
    const existing = document.getElementById('special-popup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'special-popup';
    popup.className = 'sl-special-popup-overlay';
    popup.innerHTML = `
        <div class="sl-special-popup">
            <div class="sl-popup-warning">⚠️ SPECIAL QUEST DETECTED ⚠️</div>
            <h2 class="sl-popup-title">${quest.title}</h2>
            <p class="sl-popup-cat">[TYPE: ${quest.category}]</p>
            <p class="sl-popup-desc">${quest.desc}</p>
            <div class="sl-popup-footer">
                <button class="sl-popup-btn sl-btn-accept" onclick="acceptSpecialQuest()">ACCEPT</button>
                <button class="sl-popup-btn sl-btn-ignore" onclick="this.parentElement.parentElement.parentElement.remove()">IGNORE</button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
    playSFX('error'); // Use system buzz for warning
}

async function assignStat(stat) {
    try {
        const res = await fetch(`${API_BASE}/api/assign-stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stat })
        });
        const data = await res.json();
        if (data.success) {
            state.profile.stats = data.stats;
            state.profile.stat_points = data.stat_points;
            playSFX('stat_up');
            render();
        }
    } catch (err) {
        console.error("Failed to assign stat:", err);
    }
}

async function acceptSpecialQuest() {
    try {
        const res = await fetch(`${API_BASE}/api/accept-special-quest`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            await fetchProfile();
            render();
            // Close any popups if they exist
            const popup = document.getElementById('special-popup');
            if (popup) popup.remove();
        }
    } catch (err) {
        console.error("Failed to accept special quest:", err);
    }
}

async function completeSpecialQuest() {
    try {
        playSFX('click');
        const res = await fetch(`${API_BASE}/api/complete-special-quest`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            playSFX('level_up'); // Use level up sound for item gain
            alert(`OBTAINED: ${data.item.icon} ${data.item.name}!`);
            await fetchProfile();
            render();
        }
    } catch (err) {
        console.error("Failed to complete special quest:", err);
    }
}

function playSFX(type) {
    if (!SFX_URLS[type]) return;
    const audio = new Audio(SFX_URLS[type]);
    audio.volume = 0.4;
    audio.play().catch(e => console.log("Audio play blocked: ", e));
}

function render() {
    const authRoot = document.getElementById('auth-root');
    const hunterContainer = document.getElementById('hunter-container');

    if (!state.loggedIn) {
        authRoot.style.display = 'block';
        hunterContainer.style.display = 'none';
        renderAuth(authRoot);
    } else {
        authRoot.style.display = 'none';
        hunterContainer.style.display = 'flex';
        renderDashboard(hunterContainer);
    }
}

function renderAuth(container) {
    container.innerHTML = `
        <section class="sl-card auth-card">
            <div class="sl-auth-logo">⚔️</div>
            <h2 class="sl-section-title" style="justify-content: center; margin-bottom: 5px;">
                ${state.authMode === 'login' ? 'IDENTITY VERIFICATION' : 'HUNTER REGISTRATION'}
            </h2>
            <p class="sl-auth-subtitle">${state.authMode === 'login' ? 'Authenticate to access your System' : 'Initialize a new 100-Day Hunter Profile'}</p>
            <form id="auth-form" onsubmit="handleAuth(event)">
                <div class="sl-form-group">
                    <label class="sl-label">HUNTER NAME</label>
                    <input type="text" name="username" class="sl-input" required placeholder="Enter your name">
                </div>
                <div class="sl-form-group">
                    <label class="sl-label">PASSCODE</label>
                    <input type="password" name="password" class="sl-input" required placeholder="Enter your secret">
                </div>
                <button type="submit" class="sl-claim-btn sl-claim-active" style="margin-top: 20px;">
                    ${state.authMode === 'login' ? '✦ AUTHENTICATE ✦' : '✦ INITIALIZE PROFILE ✦'}
                </button>
            </form>
            <p class="sl-auth-toggle">
                ${state.authMode === 'login' ? "No profile yet?" : "Already a hunter?"}
                <span onclick="switchAuthMode()">${state.authMode === 'login' ? 'REGISTER HERE' : 'LOGIN HERE'}</span>
            </p>
        </section>
    `;
}

function renderDashboard(container) {
    if (!state.profile) return;

    const p = state.profile;
    const phase = p.current_phase;
    if (!phase || !phase.quests) return;
    const quests = phase.quests;
    const day = p.current_day;
    const xpPct = Math.min(100, (p.xp / p.xp_to_next) * 100);
    const allDone = state.checked.length === quests.length;
    const progressPct = Math.min(100, Math.round((p.daily_completed_streak / 100) * 100));

    const uiStats = [
        { key: "STR", label: "STRENGTH", value: p.stats.STR, icon: "⚔️" },
        { key: "INT", label: "INTELLIGENCE", value: p.stats.INT, icon: "🧠" },
        { key: "AGI", label: "AGILITY", value: p.stats.AGI, icon: "💨" },
        { key: "VIT", label: "VITALITY", value: p.stats.VIT, icon: "❤️" },
        { key: "WIL", label: "WILLPOWER", value: p.stats.WIL, icon: "🔥" },
    ];

    const shadowArmy = p.shadow_army || [];
    const points = p.stat_points || 0;
    
    // Generate 100-day history grid
    const historyGrid = Array.from({ length: 100 }, (_, i) => {
        const day = i + 1;
        const completed = p.daily_completed_streak >= day;
        return `<div class="sl-history-square ${completed ? 'sl-history-done' : ''}" title="Day ${day}"></div>`;
    }).join("");

    container.innerHTML = `
        <!-- ── Profile Card ── -->
        <section class="sl-card sl-profile-card">
          <div class="sl-top-nav">
            <div class="sl-nav-row">
                <div class="sl-logout-btn" onclick="logout()">LOGOUT</div>
            </div>
            <div class="sl-nav-btn" onclick="window.location.href='/leaderboard'">⚔ LEADERBOARD</div>
          </div>
          <div class="sl-profile-header">
            <div class="sl-avatar">
              <div class="sl-avatar-inner">
                <svg viewBox="0 0 60 60" fill="none" class="sl-avatar-svg">
                  <circle cx="30" cy="20" r="12" stroke="currentColor" stroke-width="1.5" />
                  <path d="M10 58 C10 40 50 40 50 58" stroke="currentColor" stroke-width="1.5" />
                </svg>
              </div>
              <div class="sl-avatar-ring"></div>
            </div>
            <div class="sl-profile-info">
              <p class="sl-subtitle">PLAYER STATUS · DAY ${p.daily_completed_streak} / 100</p>
              <h1 class="sl-name">HUNTER <span class="sl-name-accent">${p.hunter_name.toUpperCase()}</span></h1>
              <div class="sl-badges">
                <span class="sl-badge sl-badge-rank">${phase.rank.toUpperCase()}</span>
                <span class="sl-badge sl-badge-level">LVL ${p.level}</span>
                <span class="sl-badge sl-badge-phase">PHASE ${phase.phase_id}</span>
              </div>
            </div>
          </div>

          <div class="sl-title-row">
            <span class="sl-title-label">PHASE</span>
            <span class="sl-title-value">${phase.title.toUpperCase()}</span>
          </div>

          <div class="sl-xp-section">
            <div class="sl-xp-header">
              <span class="sl-xp-label">EXPERIENCE POINTS</span>
              <span class="sl-xp-value">${p.xp} / ${p.xp_to_next} XP</span>
            </div>
            <div class="sl-xp-track">
              <div class="sl-xp-fill" style="width: ${xpPct}%"></div>
              <div class="sl-xp-glow" style="width: ${xpPct}%"></div>
            </div>
          </div>

          <!-- 100-Day Progress Bar -->
          <div class="sl-xp-section" style="margin-top: 12px;">
            <div class="sl-xp-header">
              <span class="sl-xp-label">100-DAY PROGRESS</span>
              <span class="sl-xp-value">${p.daily_completed_streak} / 100 DAYS</span>
            </div>
            <div class="sl-xp-track">
              <div class="sl-xp-fill" style="width: ${progressPct}%; background: linear-gradient(90deg, #06b6d4, #8b5cf6);"></div>
            </div>
          </div>

          <!-- History Grid -->
          <div class="sl-history-grid">
            ${historyGrid}
          </div>
        </section>

        <!-- ── Phase Info Card ── -->
        <section class="sl-card sl-phase-card">
          <h2 class="sl-section-title">
            <span class="sl-section-line"></span>
            ${phase.rank.toUpperCase()} · ${phase.days.toUpperCase()}
            <span class="sl-section-line"></span>
          </h2>
          <p class="sl-phase-focus">
            <span class="sl-phase-focus-label">FOCUS:</span> ${phase.focus}
          </p>
          <div class="sl-levelup-req">
            <span class="sl-levelup-label">⚡ LEVEL-UP REQUIREMENT (Day ${phase.levelup_day})</span>
            <span class="sl-levelup-text">${phase.levelup_req}</span>
          </div>
        </section>

        <!-- ── Stats Card ── -->
        <section class="sl-card sl-stats-card">
          <h2 class="sl-section-title">
            <span class="sl-section-line"></span>
            BASE STATS
            <span class="sl-section-line"></span>
          </h2>
          <div class="sl-stats-grid">
            ${points > 0 ? `
              <div class="sl-points-alert">
                 <span class="sl-points-glow">✦ ${points} STATUS POINTS AVAILABLE</span>
              </div>
            ` : ''}
            ${uiStats.map(s => `
              <div class="sl-stat-item">
                <span class="sl-stat-icon">${s.icon}</span>
                <div class="sl-stat-body">
                  <span class="sl-stat-key">${s.key}</span>
                  <span class="sl-stat-label">${s.label}</span>
                </div>
                <div class="sl-stat-value-container">
                    <span class="sl-stat-value">${s.value} / 100</span>
                    ${points > 0 ? `<button class="sl-stat-add-btn" onclick="assignStat('${s.key}')">+</button>` : ''}
                </div>
                <div class="sl-stat-bar-track">
                  <div class="sl-stat-bar-fill" style="width: ${s.value}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- ── Shadow Army Card ── -->
        <section class="sl-card sl-shadow-card">
          <h2 class="sl-section-title">
            <span class="sl-section-line"></span>
            THE SHADOW ARMY
            <span class="sl-section-line"></span>
          </h2>
          <div class="sl-shadow-grid">
            ${shadowArmy.length > 0 ? shadowArmy.map(s => `
              <div class="sl-shadow-item">
                <span class="sl-shadow-icon">${s.icon}</span>
                <span class="sl-shadow-name">${s.name}</span>
              </div>
            `).join('') : `
              <div class="sl-shadow-empty">NO SHADOWS EXTRACTED YET. REACH LVL 10.</div>
            `}
          </div>
        </section>

        <!-- ── Daily Quest Card ── -->
        <section class="sl-card sl-quest-card">
          <h2 class="sl-section-title">
            <span class="sl-section-line"></span>
            DAILY QUEST · DAY ${day}
            <span class="sl-section-line"></span>
          </h2>
          <p class="sl-quest-subtitle">THE ${phase.rank.toUpperCase()} ${phase.title.toUpperCase()}</p>

          <ul class="sl-quest-list">
            ${quests.map(q => {
                const done = state.checked.includes(q.id);
                return `
                    <li class="sl-quest-item ${done ? 'sl-quest-done' : ''}" onclick="toggleQuest(${q.id})">
                      <div class="sl-checkbox ${done ? 'sl-checkbox-checked' : ''}">
                        ${done ? `
                          <svg viewBox="0 0 12 12" fill="none" class="sl-check-svg">
                            <polyline points="2,6 5,9 10,3" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                          </svg>
                        ` : ''}
                      </div>
                      <div class="sl-quest-text">
                        <span class="sl-quest-label">${q.label}</span>
                        <span class="sl-quest-sub">${q.sub}</span>
                      </div>
                      ${done ? '<span class="sl-quest-complete-badge">✓ DONE</span>' : ''}
                    </li>
                `;
            }).join('')}
          </ul>

          <div class="sl-quest-progress">
            <span class="sl-qp-label">PROGRESS</span>
            <span class="sl-qp-value">${state.checked.length} / ${quests.length}</span>
          </div>

          <button
            id="claim-btn"
            class="sl-claim-btn ${allDone ? 'sl-claim-active' : 'sl-claim-inactive'} ${state.rewardData ? 'sl-claim-claimed' : ''}"
            onclick="claimRewards()"
            ${(!allDone || state.claiming || state.rewardData) ? 'disabled' : ''}
          >
            ${state.rewardData ? '✦ REWARDS CLAIMED ✦' : state.claiming ? 'PROCESSING...' : allDone ? '✦ CLAIM REWARDS ✦' : 'COMPLETE ALL QUESTS'}
          </button>

          ${state.rewardData ? `
            <div class="sl-reward-popup">
              <p class="sl-reward-title">QUEST COMPLETE — DAY ${state.rewardData.streak}</p>
              <p class="sl-reward-text">+${state.rewardData.xp_earned} XP · ${state.rewardData.streak_bonus ? state.rewardData.streak_bonus : 'Daily Reward'}</p>
              ${state.rewardData.level_up ? `<p class="sl-reward-alt">${state.rewardData.level_up}</p>` : ''}
              ${state.rewardData.phase_milestone ? `<p class="sl-reward-alt" style="color: #a78bfa;">${state.rewardData.phase_milestone}</p>` : ''}
              ${state.rewardData.phase_unlock ? `<p class="sl-reward-alt" style="color: #38bdf8;">${state.rewardData.phase_unlock}</p>` : ''}
              ${state.rewardData.final_boss ? `<p class="sl-reward-alt" style="color: #fcd34d; font-size:12px;">${state.rewardData.final_boss}</p>` : ''}
            </div>
          ` : ''}
        </section>

        <!-- ── Milestone Card ── -->
        ${day <= 100 ? `
        <section class="sl-card sl-rankup-card">
          <div class="sl-rankup-top">
            <span class="sl-rankup-tag">NEXT GATE</span>
            <span class="sl-rankup-glow-tag">DAY ${phase.levelup_day} · ${phase.next_rank.toUpperCase()}</span>
          </div>
          <h3 class="sl-rankup-title">${phase.levelup_req.toUpperCase()}</h3>
          <p class="sl-rankup-desc">
            Complete Day ${phase.levelup_day} to advance from <span class="sl-hl">${phase.current_rank}</span> to <span class="sl-hl">${phase.next_rank}</span>.
          </p>
          <div class="sl-rankup-reward">
            <span class="sl-rankup-reward-label">REWARDS</span>
            <div class="sl-rankup-reward-items">
              <span class="sl-reward-item">+50 BONUS XP</span>
              <span class="sl-reward-item">${phase.next_rank.toUpperCase()} RANK</span>
            </div>
          </div>
        </section>
        ` : ''}

        <!-- ── Active Special Quest ── -->
        ${p.special_quest && p.special_quest.accepted && !p.special_quest.completed_today ? `
        <section class="sl-card sl-special-quest-card">
            <h3 class="sl-section-title"><span>✦</span> SPECIAL QUEST ACTIVE</h3>
            <div class="sl-special-content">
                <div class="sl-special-info">
                    <p class="sl-special-title">${p.special_quest.title}</p>
                    <p class="sl-special-desc">${p.special_quest.desc}</p>
                </div>
                <button class="sl-claim-btn sl-claim-active" onclick="completeSpecialQuest()">COMPLETE QUEST</button>
            </div>
        </section>
        ` : ''}

        <!-- ── Inventory ── -->
        <section class="sl-card sl-inventory-card">
            <h3 class="sl-section-title"><span>📦</span> HUNTER'S INVENTORY</h3>
            <div class="sl-inventory-grid">
                ${p.inventory && p.inventory.length > 0 ? p.inventory.map(item => `
                    <div class="sl-item" title="${item.name}: ${item.bonus}">
                        <span class="sl-item-icon">${item.icon}</span>
                        <div class="sl-item-glow rarity-${item.rarity.toLowerCase()}"></div>
                    </div>
                `).join("") : '<p class="sl-empty-text">Inventory is empty...</p>'}
            </div>
        </section>
    `;
}

// Global exposure
window.toggleQuest = toggleQuest;
window.claimRewards = claimRewards;
window.handleAuth = handleAuth;
window.switchAuthMode = switchAuthMode;
window.logout = logout;
window.assignStat = assignStat;
window.acceptSpecialQuest = acceptSpecialQuest;
window.completeSpecialQuest = completeSpecialQuest;

init();
