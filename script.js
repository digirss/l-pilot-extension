// --- Configuration ---
const CONFIG = {
    typingSpeed: 30, // ms per char
    startupDelay: 800, // ms after typing
    storageKey: 'l_pilot_data_v1',
    historyKey: 'l_pilot_history_'
};

// --- Storage Helper (chrome.storage with localStorage fallback) ---
const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

const storage = {
    get: (keys, callback) => {
        if (isExtension) {
            chrome.storage.local.get(keys, callback);
        } else {
            // localStorage fallback
            const result = {};
            keys.forEach(key => {
                const data = localStorage.getItem(key);
                if (data) result[key] = JSON.parse(data);
            });
            callback(result);
        }
    },
    set: (data, callback) => {
        if (isExtension) {
            chrome.storage.local.set(data, callback);
        } else {
            // localStorage fallback
            Object.keys(data).forEach(key => {
                localStorage.setItem(key, JSON.stringify(data[key]));
            });
            if (callback) callback();
        }
    }
};

// --- Boot Sequence ---
const bootText = [
    "SYSTEM INITIALIZING...",
    "LOADING CORE MODULES...",
    "CONNECTING TO ORBIT NETWORK...",
    "VANGUARD PROTOCOLS: ACTIVE",
    "WELCOME BACK, COMMANDER."
];

async function runBootSequence() {
    const textEl = document.getElementById('boot-text');
    const overlay = document.getElementById('startup-overlay');
    const container = document.getElementById('main-interface');

    // Check if we should skip boot (e.g. if opened recently)
    const lastBoot = sessionStorage.getItem('l_pilot_boot');
    if (lastBoot && (Date.now() - parseInt(lastBoot)) < 60000) {
        // Skip animation if opened within last minute
        overlay.style.display = 'none';
        container.classList.add('active');
        return;
    }

    sessionStorage.setItem('l_pilot_boot', Date.now().toString());

    // Typing Effect
    for (const line of bootText) {
        textEl.textContent = line;
        await new Promise(r => setTimeout(r, line.length * CONFIG.typingSpeed + 100));
    }

    // Finale
    textEl.style.color = '#fff'; // Flash white
    await new Promise(r => setTimeout(r, 200));

    // Transition
    overlay.classList.add('hidden');
    setTimeout(() => {
        overlay.style.display = 'none';
        container.classList.add('active');
    }, 800);
}

// --- Status Manager ---
const STATUS_TYPES = ['standby', 'engaging', 'secured', 'aborted'];

let missions = [
    { id: 1, text: '', status: 'standby' },
    { id: 2, text: '', status: 'standby' },
    { id: 3, text: '', status: 'standby' }
];

// --- History Helpers ---
function getMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

// --- Data Management ---
function loadData() {
    storage.get([CONFIG.storageKey], (result) => {
        if (result[CONFIG.storageKey]) {
            missions = result[CONFIG.storageKey].missions || missions;
        }
        renderMissions();
    });

    // Check Orbit Status & Milestones
    storage.get(['l_pilot_orbit_status', 'l_pilot_milestones'], (result) => {
        // Orbit Status
        if (result.l_pilot_orbit_status) {
            const orbitDisplay = document.getElementById('orbit-display');
            orbitDisplay.textContent = result.l_pilot_orbit_status;
            orbitDisplay.style.color = 'var(--primary)';
        }

        // Milestones
        const msContainer = document.getElementById('milestones-container');
        if (result.l_pilot_milestones && result.l_pilot_milestones.length > 0) {
            msContainer.innerHTML = ''; // Clear default
            result.l_pilot_milestones.forEach(ms => {
                const el = document.createElement('div');
                el.className = 'milestone-card';
                el.innerHTML = `
                    <div class="ms-date">${ms.date}</div>
                    <div class="ms-title">${ms.event}</div>
                    <div class="ms-badge">${ms.t_day}</div>
                `;
                msContainer.appendChild(el);
            });
        }
    });

    loadHistory();
}

function saveData() {
    storage.set({
        [CONFIG.storageKey]: {
            missions: missions,
            lastSaved: Date.now()
        }
    });
}

// --- History Management ---
function loadHistory() {
    const monthKey = getMonthKey();
    const todayKey = getTodayKey();

    storage.get([CONFIG.historyKey + monthKey], (result) => {
        const allHistory = result[CONFIG.historyKey + monthKey] || {};
        const todayHistory = allHistory[todayKey] || [];
        renderHistory(todayHistory);
        renderArchive(allHistory);
    });
}

function saveHistory(missionText, status = 'secured') {
    const monthKey = getMonthKey();
    const todayKey = getTodayKey();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    storage.get([CONFIG.historyKey + monthKey], (result) => {
        let allHistory = result[CONFIG.historyKey + monthKey] || {};
        if (!allHistory[todayKey]) allHistory[todayKey] = [];

        allHistory[todayKey].unshift({ task: missionText, time: nowTime, status: status });

        storage.set({
            [CONFIG.historyKey + monthKey]: allHistory
        }, () => {
            renderHistory(allHistory[todayKey]);
            renderArchive(allHistory);
        });
    });
}

function renderHistory(list) {
    const container = document.getElementById('historyList');
    const countEl = document.getElementById('todayCount');
    countEl.textContent = list.length;

    if (list.length === 0) {
        container.innerHTML = '<div class="history-empty">NO MISSIONS LOGGED YET</div>';
        return;
    }

    container.innerHTML = list.map(item => {
        const status = item.status || 'secured';
        const icon = status === 'secured' ? '✓' : '✗';
        return `
            <div class="history-item" data-status="${status}">
                <span class="history-task">
                    <span class="history-status ${status}">${icon}</span>
                    ${item.task}
                </span>
                <span class="history-time">${item.time}</span>
            </div>
        `;
    }).join('');
}

function renderArchive(allHistory) {
    const container = document.getElementById('archiveContent');
    const days = Object.keys(allHistory).sort().reverse();

    if (days.length === 0) {
        container.innerHTML = '<div class="archive-empty">NO ARCHIVED RECORDS</div>';
        return;
    }

    container.innerHTML = days.map(day => {
        const items = allHistory[day];
        const secured = items.filter(i => i.status !== 'aborted').length;
        const aborted = items.filter(i => i.status === 'aborted').length;
        return `
            <div class="archive-day">
                <div class="archive-day-title">${day} (✓${secured} ✗${aborted})</div>
                ${items.map(i => {
            const status = i.status || 'secured';
            const icon = status === 'secured' ? '✓' : '✗';
            return `<div class="archive-item"><span class="history-status ${status}">${icon}</span> ${i.task} @ ${i.time}</div>`;
        }).join('')}
            </div>
        `;
    }).join('');
}

function exportToMarkdown() {
    const monthKey = getMonthKey();

    storage.get([CONFIG.historyKey + monthKey], (result) => {
        const allHistory = result[CONFIG.historyKey + monthKey] || {};
        const days = Object.keys(allHistory).sort();

        if (days.length === 0) {
            alert('NO RECORDS TO EXPORT');
            return;
        }

        let md = `# L-PILOT MISSION LOG\n\n`;
        md += `**PERIOD**: ${monthKey}\n\n`;
        md += `---\n\n`;

        days.forEach(day => {
            const items = allHistory[day];
            const secured = items.filter(i => i.status !== 'aborted');
            const aborted = items.filter(i => i.status === 'aborted');

            md += `## ${day}\n\n`;

            if (secured.length > 0) {
                md += `### SECURED (${secured.length})\n\n`;
                secured.forEach(item => {
                    md += `- ✓ **${item.task}** @ ${item.time}\n`;
                });
                md += `\n`;
            }

            if (aborted.length > 0) {
                md += `### ABORTED (${aborted.length})\n\n`;
                aborted.forEach(item => {
                    md += `- ✗ **${item.task}** @ ${item.time}\n`;
                });
                md += `\n`;
            }
        });

        md += `---\n\n`;
        md += `*EXPORTED FROM L-PILOT | ${new Date().toLocaleString()}*\n`;

        // Download
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `L-PILOT_${monthKey}.md`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

// --- Render Missions ---
function renderMissions() {
    missions.forEach(m => {
        const card = document.getElementById(`mission-${m.id}`);
        const input = document.getElementById(`input-${m.id}`);
        const statusIcons = card.querySelector('.status-icons');
        const confirmBtn = card.querySelector('.confirm-log-btn');
        const abortBtn = card.querySelector('.abort-log-btn');

        // Update Text
        if (input.value !== m.text) {
            input.value = m.text;
        }

        // Update Status - highlight active icon button
        card.setAttribute('data-status', m.status);
        statusIcons.querySelectorAll('.status-icon-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.status === m.status);
        });

        // Show CONFIRM & LOG button when SECURED
        if (m.status === 'secured' && m.text.trim()) {
            confirmBtn.style.display = 'block';
            abortBtn.style.display = 'none';
        }
        // Show ABORT & LOG button when ABORTED
        else if (m.status === 'aborted' && m.text.trim()) {
            confirmBtn.style.display = 'none';
            abortBtn.style.display = 'block';
        } else {
            confirmBtn.style.display = 'none';
            abortBtn.style.display = 'none';
        }

        // Launch to Focus Button (ENGAGING only)
        let launchBtn = card.querySelector('.launch-focus-btn');
        if (m.status === 'engaging' && m.text.trim()) {
            if (!launchBtn) {
                launchBtn = document.createElement('button');
                launchBtn.className = 'launch-focus-btn';
                launchBtn.innerHTML = '▶ FOCUS';
                launchBtn.title = 'Launch to L-FOCUS';
                launchBtn.addEventListener('click', () => {
                    const taskText = encodeURIComponent(m.text);
                    window.open(`https://1pxai.1pa.uk/l-focus/?task=${taskText}&id=${m.id}`, '_blank');
                });
                card.appendChild(launchBtn);
            }
        } else {
            if (launchBtn) launchBtn.remove();
        }

        // Launch to Map Button (always show when has text)
        let mapBtn = card.querySelector('.launch-map-btn');
        if (m.text.trim()) {
            if (!mapBtn) {
                mapBtn = document.createElement('button');
                mapBtn.className = 'launch-map-btn';
                mapBtn.innerHTML = '◇ MAP';
                mapBtn.title = 'Expand in L-MAP';
                mapBtn.addEventListener('click', () => {
                    const taskText = encodeURIComponent(m.text);
                    window.open(`https://1pxai.1pa.uk/l-map/?topic=${taskText}`, '_blank');
                });
                card.appendChild(mapBtn);
            }
        } else {
            if (mapBtn) mapBtn.remove();
        }
    });

    // Check for all secured - celebration!
    checkAllSecured();
}

// --- Set Status ---
function setStatus(missionId, newStatus) {
    const mIndex = missions.findIndex(m => m.id === missionId);
    if (mIndex === -1) return;

    missions[mIndex].status = newStatus;
    renderMissions();
    saveData();
}

// --- Confirm & Log Mission ---
function confirmAndLog(missionId) {
    const mIndex = missions.findIndex(m => m.id === missionId);
    if (mIndex === -1) return;

    const mission = missions[mIndex];
    if (!mission.text.trim()) return;

    // Save to history as secured
    saveHistory(mission.text, 'secured');

    // Clear mission
    missions[mIndex].text = '';
    missions[mIndex].status = 'standby';

    // Update UI
    document.getElementById(`input-${missionId}`).value = '';
    renderMissions();
    saveData();
}

// --- Abort & Log Mission ---
function abortAndLog(missionId) {
    const mIndex = missions.findIndex(m => m.id === missionId);
    if (mIndex === -1) return;

    const mission = missions[mIndex];
    if (!mission.text.trim()) return;

    // Save to history as aborted
    saveHistory(mission.text, 'aborted');

    // Clear mission
    missions[mIndex].text = '';
    missions[mIndex].status = 'standby';

    // Update UI
    document.getElementById(`input-${missionId}`).value = '';
    renderMissions();
    saveData();
}

// --- Check All Secured ---
function checkAllSecured() {
    const allSecured = missions.every(m => m.status === 'secured' && m.text.trim());

    if (allSecured) {
        showCelebration();
    }
}

// --- Celebration ---
function showCelebration() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'celebration-overlay';
    overlay.innerHTML = `
        <div class="celebration-text">MISSION COMPLETE</div>
        <div class="celebration-sub">ALL SECTORS SECURED</div>
        <button class="celebration-btn">DISMISS</button>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('.celebration-btn').addEventListener('click', () => {
        overlay.remove();
    });
}

// --- Input Handler ---
function handleInput(id, value) {
    const mIndex = missions.findIndex(m => m.id === id);
    if (mIndex === -1) return;

    missions[mIndex].text = value;
    saveData();
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    runBootSequence();
    loadData();

    // Bind Inputs
    [1, 2, 3].forEach(id => {
        const input = document.getElementById(`input-${id}`);
        input.addEventListener('input', (e) => handleInput(id, e.target.value));

        // Focus effects
        const card = document.getElementById(`mission-${id}`);
        input.addEventListener('focus', () => card.style.borderColor = 'var(--primary)');
        input.addEventListener('blur', () => card.style.borderColor = '');

        // Status Icon Buttons
        const statusIcons = card.querySelector('.status-icons');
        statusIcons.querySelectorAll('.status-icon-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                setStatus(id, btn.dataset.status);
            });
        });

        // CONFIRM & LOG Button
        const confirmBtn = card.querySelector('.confirm-log-btn');
        confirmBtn.addEventListener('click', () => {
            confirmAndLog(id);
        });

        // ABORT & LOG Button
        const abortBtn = card.querySelector('.abort-log-btn');
        abortBtn.addEventListener('click', () => {
            abortAndLog(id);
        });
    });

    // Export MD Button
    document.getElementById('exportMdBtn').addEventListener('click', exportToMarkdown);
});
