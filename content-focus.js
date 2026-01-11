// L-PILOT Content Script for L-FOCUS
// Listens for task completion events and syncs back to Extension

console.log('L-PILOT SYNC: Monitoring L-FOCUS for task completion.');

// Listen for custom events from the L-FOCUS page
window.addEventListener('l-focus-task-complete', (event) => {
    const { taskName, missionId, duration } = event.detail;

    console.log(`L-PILOT SYNC: Task "${taskName}" completed! Reporting to HQ.`);

    chrome.runtime.sendMessage({
        type: 'TASK_COMPLETE',
        taskName: taskName,
        missionId: missionId,
        duration: duration
    });
});

// Also listen for postMessage (alternative method)
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'L_FOCUS_COMPLETE') {
        console.log('L-PILOT SYNC: Received postMessage for task completion.');

        chrome.runtime.sendMessage({
            type: 'TASK_COMPLETE',
            taskName: event.data.taskName,
            missionId: event.data.missionId,
            duration: event.data.duration
        });
    }
});
