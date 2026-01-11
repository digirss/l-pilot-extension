// --- Configuration ---
const CONFIG = {
    typingSpeed: 30, // ms per char
    startupDelay: 800, // ms after typing
    storageKey: 'l_pilot_data_v1'
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
const STATUS_TYPES = [
    { id: 'pending', label: '[PENDING]', class: '' },
    { id: 'engaging', label: '[ENGAGING]', class: 'engaging' },
    { id: 'secured', label: '[SECURED]', class: 'secured' },
    { id: 'aborted', label: '[ABORTED]', class: 'aborted' }
];

let missions = [
    { id: 1, text: '', status: 'pending' },
    { id: 2, text: '', status: 'pending' },
    { id: 3, text: '', status: 'pending' }
];

function loadData() {
    chrome.storage.local.get([CONFIG.storageKey], (result) => {
        if (result[CONFIG.storageKey]) {
            missions = result[CONFIG.storageKey].missions || missions;
            renderMissions();
        }
    });

    // Check Orbit Status & Milestones
    chrome.storage.local.get(['l_pilot_orbit_status', 'l_pilot_milestones'], (result) => {
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
}

function saveData() {
    chrome.storage.local.set({
        [CONFIG.storageKey]: {
            missions: missions,
            lastSaved: Date.now()
        }
    });
}

function renderMissions() {
    missions.forEach(m => {
        const card = document.getElementById(`mission-${m.id}`);
        const input = document.getElementById(`input-${m.id}`);
        const btn = card.querySelector('.status-btn');

        // Update Text
        if (input.value !== m.text) {
            input.value = m.text;
        }

        // Update Status
        const statusConfig = STATUS_TYPES.find(s => s.id === m.status) || STATUS_TYPES[0];
        btn.textContent = statusConfig.label;
        card.setAttribute('data-status', m.status);

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
    });
}

// --- Actions ---

function cycleStatus(id) {
    const mIndex = missions.findIndex(m => m.id === id);
    if (mIndex === -1) return;

    const currentStatus = missions[mIndex].status;
    const currentIndex = STATUS_TYPES.findIndex(s => s.id === currentStatus);
    const nextIndex = (currentIndex + 1) % STATUS_TYPES.length;

    missions[mIndex].status = STATUS_TYPES[nextIndex].id;

    renderMissions();
    saveData();
}

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

        // Status Button handling (Fixing CSP issue)
        const btn = card.querySelector('.status-btn');
        btn.addEventListener('click', () => cycleStatus(id));
    });
});
