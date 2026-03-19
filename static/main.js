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

const ICONS = {
    str: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"></path><path d="M13 19l6-6"></path><path d="M16 16l4 4"></path><path d="M19 21l2-2"></path></svg>`,
    agi: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
    vit: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
    int: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
    wil: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>`,
    ring: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="4" r="2"></circle></svg>`,
    key: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>`,
    potion: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2v7.31"></path><path d="M14 9.3V1.99"></path><path d="M8.5 2h7"></path><path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path><path d="M5.52 16h12.96"></path></svg>`,
    crystal: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`,
    scroll: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>`,
    knight: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M12 8v4"></path></svg>`,
    beast: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>`,
    shield: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
    dragon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
    ant: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><circle cx="12" cy="5" r="2"></circle><circle cx="12" cy="19" r="4"></circle><path d="M12 15v-1"></path><path d="M12 9v-2"></path><path d="M9 12H5"></path><path d="M19 12h-4"></path><path d="M10.5 14L8 16"></path><path d="M13.5 14l2.5 2"></path><path d="M10.5 10L8 8"></path><path d="M13.5 10l2.5-2"></path></svg>`,
    mage: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"></circle><path d="M3 21v-2a7 7 0 0 1 14 0v2"></path><path d="M12 13v8"></path><path d="M8 17l8-4"></path></svg>`,
    king: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    box: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
    id_card: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect><circle cx="9" cy="10" r="2"></circle><line x1="15" y1="8" x2="19" y2="8"></line><line x1="15" y1="12" x2="19" y2="12"></line><line x1="5" y1="16" x2="19" y2="16"></line></svg>`,
    swords: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="14.5" y1="17.5" x2="3" y2="6"></line><line x1="14.5" y1="6.5" x2="3" y2="18"></line></svg>`
};

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
            <div class="sl-auth-logo">${ICONS.swords}</div>
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
        { key: "STR", label: "STRENGTH", value: p.stats.STR, icon: ICONS.str },
        { key: "INT", label: "INTELLIGENCE", value: p.stats.INT, icon: ICONS.int },
        { key: "AGI", label: "AGILITY", value: p.stats.AGI, icon: ICONS.agi },
        { key: "VIT", label: "VITALITY", value: p.stats.VIT, icon: ICONS.vit },
        { key: "WIL", label: "WILLPOWER", value: p.stats.WIL, icon: ICONS.wil },
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
            <div class="sl-nav-btn" onclick="window.location.href='/leaderboard'">${ICONS.swords} LEADERBOARD</div>
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
              <h1 class="sl-name sl-glitch" data-text="${p.hunter_name.toUpperCase()}">
                  <span class="sl-title-badge" onclick="showTitleModal()">${p.active_title_display.toUpperCase()}</span>
                  ${p.hunter_name.toUpperCase()}
              </h1>
              <div class="sl-badges">
                <span class="sl-badge sl-badge-rank">[ ${phase.rank.toUpperCase()} ]</span>
                <span class="sl-badge sl-badge-level">LVL ${p.level}</span>
                <span class="sl-badge sl-badge-phase">PHASE ${phase.phase_id}</span>
                <span class="sl-badge sl-badge-id" onclick="showIdCard()">${ICONS.id_card} LICENSE</span>
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
            <span class="sl-levelup-label">>>> LEVEL-UP REQUIREMENT (Day ${phase.levelup_day})</span>
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
                 <span class="sl-points-glow">${ICONS.crystal} ${points} STATUS POINTS AVAILABLE</span>
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
                <span class="sl-shadow-icon">${ICONS[s.icon] || ICONS.knight}</span>
                <span class="sl-shadow-name">${s.name}</span>
              </div>
            `).join('') : `
              <div class="sl-shadow-empty">NO SHADOWS EXTRACTED YET. REACH LVL 10.</div>
            `}
          </div>
        </section>

        <!-- ── Red Gate Raid ── -->
        ${p.red_gate_active ? `
        <section class="sl-card sl-red-gate-card sl-glitch">
            <h2 class="sl-section-title" style="color: #ef4444; border-bottom-color: #ef4444;">
              <span class="sl-section-line" style="background: #ef4444;"></span>
              RED GATE DETECTED
              <span class="sl-section-line" style="background: #ef4444;"></span>
            </h2>
            <p class="sl-quest-subtitle" style="color: #fca5a5;">WEEKLY RAID · MASSIVE THREAT</p>
            <div class="sl-special-content" style="border-color: #7f1d1d; background: rgba(153, 27, 27, 0.1);">
                <div class="sl-special-info">
                    <p class="sl-special-title" style="color: #ef4444;">SURVIVE THE DUNGEON</p>
                    <p class="sl-special-desc">Complete a massive personal objective today to clear the Red Gate and claim epic loot.</p>
                </div>
                <button class="sl-claim-btn" style="background: #991b1b; color: white;" onclick="completeRedGate()">RAID CLEARED</button>
            </div>
        </section>
        ` : ''}

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
            ${state.rewardData ? '[ REWARDS CLAIMED ]' : state.claiming ? 'PROCESSING...' : allDone ? '[ CLAIM REWARDS ]' : 'COMPLETE ALL QUESTS'}
          </button>

          ${state.rewardData ? `
            <div class="sl-reward-popup sl-glitch">
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
        <section class="sl-card sl-special-quest-card sl-glitch">
            <h3 class="sl-section-title"><span>${ICONS.swords}</span> SPECIAL QUEST ACTIVE</h3>
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
            <h3 class="sl-section-title"><span>${ICONS.box}</span> HUNTER'S INVENTORY</h3>
            <div class="sl-inventory-grid">
                ${p.inventory && p.inventory.length > 0 ? p.inventory.map(item => `
                    <div class="sl-item" title="${item.name}: ${item.bonus}">
                        <span class="sl-item-icon">${ICONS[item.icon] || ICONS.scroll}</span>
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
window.showTitleModal = showTitleModal;
window.selectTitle = selectTitle;
window.showIdCard = showIdCard;
window.completeRedGate = completeRedGate;

function showTitleModal() {
    const existing = document.getElementById('title-popup');
    if (existing) existing.remove();

    const p = state.profile;
    const resolvedTitles = p.resolved_titles || [];

    const popup = document.createElement('div');
    popup.id = 'title-popup';
    popup.className = 'sl-special-popup-overlay';
    
    const titlesHtml = resolvedTitles.map(t => `
        <div class="sl-title-option ${p.active_title === t.id ? 'active' : ''}" onclick="selectTitle('${t.id}')">
            <h4>${t.name} <span style="font-size:10px; color:#a1a1aa;">[${t.rarity}]</span></h4>
            <p>${t.desc}</p>
        </div>
    `).join('');

    popup.innerHTML = `
        <div class="sl-special-popup" style="border-color: #3b82f6; box-shadow: 0 0 30px rgba(59,130,246,0.2);">
            <h2 class="sl-popup-title" style="color: #60a5fa;">SELECT DESIGNATION</h2>
            <div class="sl-title-list">
                ${titlesHtml}
            </div>
            <div class="sl-popup-footer">
                <button class="sl-popup-btn sl-btn-ignore" onclick="this.parentElement.parentElement.parentElement.remove()">CLOSE</button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
    playSFX('click');
}

async function selectTitle(titleId) {
    try {
        playSFX('click');
        const res = await fetch(`${API_BASE}/api/change-title`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title_id: titleId })
        });
        const data = await res.json();
        if (data.success) {
            const popup = document.getElementById('title-popup');
            if (popup) popup.remove();
            await fetchProfile();
            render();
        }
    } catch (err) {
        console.error("Failed to change title:", err);
    }
}

async function completeRedGate() {
    try {
        const res = await fetch(`${API_BASE}/api/complete-red-gate`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            playSFX('level_up');
            alert(`RED GATE CLEARED!\nOBTAINED: ${data.item.name}\n${data.level > state.profile.level ? 'LEVEL UP!' : ''}`);
            await fetchProfile();
            render();
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error("Failed red gate:", err);
    }
}

function showIdCard() {
    const existing = document.getElementById('id-popup');
    if (existing) existing.remove();
    
    const p = state.profile;
    const stats = p.stats;
    let maxStat = 'STR';
    let maxVal = stats['STR'];
    for(let k in stats) {
        if(stats[k] > maxVal) { maxVal = stats[k]; maxStat = k; }
    }
    const classMap = { 'STR': 'FIGHTER', 'AGI': 'ASSASSIN', 'INT': 'MAGE', 'VIT': 'TANK', 'WIL': 'HEALER' };
    const pClass = classMap[maxStat] || 'FIGHTER';

    const popup = document.createElement('div');
    popup.id = 'id-popup';
    popup.className = 'sl-special-popup-overlay sl-id-overlay';
    
    popup.innerHTML = `
        <div class="sl-id-card-container">
            <div class="sl-id-card sl-glitch">
                <div class="sl-id-header">
                    <div class="sl-id-logo">${ICONS.swords}</div>
                    <div class="sl-id-title">HUNTER ASSOCIATION</div>
                </div>
                <div class="sl-id-body">
                    <div class="sl-id-photo-placeholder">
                        ${ICONS.id_card}
                    </div>
                    <div class="sl-id-details">
                        <div class="sl-id-row"><span class="sl-id-label">NAME</span> <span class="sl-id-val">${p.hunter_name.toUpperCase()}</span></div>
                        <div class="sl-id-row"><span class="sl-id-label">RANK</span> <span class="sl-id-val" style="color:#60a5fa">${p.rank.toUpperCase()}</span></div>
                        <div class="sl-id-row"><span class="sl-id-label">CLASS</span> <span class="sl-id-val">${pClass}</span></div>
                        <div class="sl-id-row"><span class="sl-id-label">LEVEL</span> <span class="sl-id-val">${p.level}</span></div>
                        <div class="sl-id-row"><span class="sl-id-label">GUILD</span> <span class="sl-id-val">SOLO</span></div>
                    </div>
                </div>
                <div class="sl-id-footer">
                    <div class="sl-id-barcode" style="font-family: monospace; font-size: 14px; letter-spacing: 2px;">|||| |||||| || | |||| |||||| | || |||||</div>
                    <div class="sl-id-issuance">ISSUED: KOREA H.A.</div>
                </div>
            </div>
            <button class="sl-popup-btn sl-btn-ignore" style="margin-top: 20px; width: 100%; max-width: 350px;" onclick="this.parentElement.parentElement.remove()">CLOSE</button>
        </div>
    `;
    document.body.appendChild(popup);
    playSFX('stat_up');
}

init();
