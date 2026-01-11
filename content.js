// L-PILOT Scout Script
// Deployed to: 1pxai.1pa.uk/l-orbit

console.log('L-PILOT SCOUT: Active and monitoring.');

function scanOrbitStatus() {
    // --- Orbit Percentage ---
    const bodyText = document.body.innerText;
    const match = bodyText.match(/(\d+\.?\d*)%/);
    const percent = match ? match[0] : 'STANDBY';

    // --- Milestones (DOM Strategy) ---
    // Content Script runs in isolated world, so we scrape DOM instead of localStorage.
    const milestonesFromDOM = [];
    const listItems = document.querySelectorAll('#milestoneList li');

    listItems.forEach(li => {
        // L-ORBIT renders: <span class="ms-date">YYYY-MM-DD</span> <span class="ms-event">Event Name</span> <span class="ms-tday">T-XX</span>
        // Let's try to extract from the structure.
        const dateSpan = li.querySelector('.ms-date');
        const eventSpan = li.querySelector('.ms-event') || li.querySelector('.ms-name'); // Fallback
        const tdaySpan = li.querySelector('.ms-tday');

        // Fallback: Parse from text if structured spans don't exist
        const text = li.textContent;

        // Try structured approach first
        let dateVal = dateSpan ? dateSpan.textContent.trim() : '';
        let eventVal = eventSpan ? eventSpan.textContent.trim() : '';
        let tdayVal = tdaySpan ? tdaySpan.textContent.trim() : '';

        // If structured fails, try regex parsing on li text
        // Expected format from L-ORBIT: "2026-01-15 Event Name T-5"
        if (!dateVal || !eventVal) {
            const dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
            const tdayMatch = text.match(/T[+-]\d+/);
            if (dateMatch) dateVal = dateMatch[0];
            if (tdayMatch) tdayVal = tdayMatch[0];
            // Event is the rest
            eventVal = text.replace(dateVal, '').replace(tdayVal, '').trim();
            // Clean up delete/edit buttons text if any
            eventVal = eventVal.replace(/編輯|刪除|Edit|Delete/gi, '').trim();
        }

        // Calculate T-Days if not available
        if (!tdayVal && dateVal) {
            const eventDate = new Date(dateVal);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diff = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
            tdayVal = diff >= 0 ? `T-${diff}` : `T+${Math.abs(diff)}`;
        }

        if (eventVal) {
            milestonesFromDOM.push({
                date: dateVal,
                event: eventVal,
                t_day: tdayVal
            });
        }
    });

    console.log(`L-PILOT SCOUT: Orbit ${percent}, Milestones: ${milestonesFromDOM.length}`);

    chrome.runtime.sendMessage({
        type: 'UPDATE_ORBIT',
        value: percent,
        milestones: milestonesFromDOM
    });
}

// Initial Scan (Wait for page JS to render)
setTimeout(scanOrbitStatus, 2500);

// Watch for changes
const observer = new MutationObserver(() => {
    scanOrbitStatus();
});

observer.observe(document.body, { childList: true, subtree: true });
