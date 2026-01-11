# L-PILOT | L.EGION Command Center

> **Your Daily Command Center.** A Chrome extension that unifies your productivity tools into a single, powerful dashboard.

![L-PILOT Screenshot](preview.png)

---

## ✨ Features

L-PILOT transforms your browser's new tab into a personal mission control:

- **🎯 Mission Tracking**: Define up to 3 daily objectives and track their status (STANDBY → ENGAGING → SECURED/ABORTED).
- **⏱️ Focus Integration**: Seamlessly connects with [L-FOCUS](https://1pxai.1pa.uk/l-focus/) timer. When you complete a focus session, your mission is automatically marked as SECURED.
- **🪐 Orbit Sync**: Pulls your annual progress and milestones from [L-ORBIT](https://1pxai.1pa.uk/l-orbit/) and displays them in your command center.
- **🗺️ Quick Map Access**: Launch [L-MAP](https://1pxai.1pa.uk/l-map/) to expand your ideas into structured mind maps.
- **📜 Mission Log**: Automatically archives completed missions with timestamps. Export to Markdown anytime.

---

## 🚀 Installation

### Method 1: Load Unpacked (Developer Mode)

1. Download or clone this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the `l-pilot` folder.
5. Open a new tab — welcome to your command center!

---

## 🔗 Connected Services

L-PILOT works best with the L.EGION productivity suite:

| Service | URL | Description |
| :--- | :--- | :--- |
| **L-FOCUS** | [1pxai.1pa.uk/l-focus](https://1pxai.1pa.uk/l-focus/) | Pomodoro-style focus timer with ambient noise. |
| **L-ORBIT** | [1pxai.1pa.uk/l-orbit](https://1pxai.1pa.uk/l-orbit/) | Annual goal tracker with milestone visualization. |
| **L-MAP** | [1pxai.1pa.uk/l-map](https://1pxai.1pa.uk/l-map/) | Instant mind mapping from text outlines. |

---

## 🛡️ Privacy & Security

**Your data stays with you.**

- ✅ All data is stored locally in your browser (`chrome.storage.local`).
- ✅ No external servers. No analytics. No tracking.
- ✅ The extension only reads publicly visible HTML elements from L.EGION pages — it cannot modify or access any private data.
- ✅ Open source: You can audit every line of code in this repository.

### Permissions Explained

| Permission | Why It's Needed |
| :--- | :--- |
| `storage` | To save your missions, history, and synced milestones locally. |
| `host_permissions` | To run content scripts on L.EGION pages for data synchronization. |

---

## 📁 Project Structure

```
l-pilot/
├── manifest.json       # Extension configuration
├── newtab.html         # New tab dashboard UI
├── styles.css          # Dashboard styling
├── script.js           # Core logic (missions, history, sync)
├── background.js       # Service worker for message handling
├── content.js          # Scrapes data from L-ORBIT pages
├── content-focus.js    # Listens for task completion from L-FOCUS
└── src/
    └── icons/          # Extension icons (16, 48, 128px)
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

## 📄 License

MIT License © 2026 [1PxAi](https://1pxai.1pa.uk/)

---

<p align="center">
  <b>Forging paths where none exist.</b><br>
  <a href="https://1pxai.1pa.uk/">1PxAi HQ</a>
</p>
