// L-PILOT Background Comms

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle Orbit Status Update
    if (message.type === 'UPDATE_ORBIT') {
        console.log('L-PILOT HQ: Received Orbit Update ->', message.value);

        chrome.storage.local.set({
            'l_pilot_orbit_status': message.value,
            'l_pilot_milestones': message.milestones
        }, () => {
            console.log('L-PILOT HQ: Data secured in storage (Status + Milestones).');
        });
    }

    // Handle Task Completion from L-FOCUS
    if (message.type === 'TASK_COMPLETE') {
        console.log('L-PILOT HQ: Task Complete Report ->', message.taskName, 'ID:', message.missionId);

        // Get current missions and update the matching one
        chrome.storage.local.get(['l_pilot_data_v1'], (result) => {
            const data = result.l_pilot_data_v1;
            if (data && data.missions) {
                const missions = data.missions;

                // Priority 1: Match by ID (most accurate)
                let missionIndex = -1;
                if (message.missionId) {
                    missionIndex = missions.findIndex(m => m.id === parseInt(message.missionId));
                }

                // Priority 2: Fallback to name match
                if (missionIndex === -1) {
                    missionIndex = missions.findIndex(m =>
                        m.text && m.text.trim().toLowerCase() === message.taskName.trim().toLowerCase()
                    );
                }

                if (missionIndex !== -1) {
                    missions[missionIndex].status = 'secured';

                    chrome.storage.local.set({
                        'l_pilot_data_v1': {
                            missions: missions,
                            lastSaved: Date.now()
                        }
                    }, () => {
                        console.log(`L-PILOT HQ: Mission #${missions[missionIndex].id} "${missions[missionIndex].text}" marked as SECURED!`);
                    });
                } else {
                    console.log('L-PILOT HQ: No matching mission found for:', message.taskName);
                }
            }
        });
    }
});
