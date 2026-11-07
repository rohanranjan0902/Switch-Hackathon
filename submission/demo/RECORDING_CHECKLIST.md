# DevOps AI Command Center — Recording Checklist & Quality Gates

**Project**: DevOps AI Command Center  
**Team**: Team DAANAV  
**Hackathon**: Flip the Switch Hackathon 2026  
**Target Video**: `submission/demo/FINAL_DEMO.mp4` (1920x1080 @ 30 FPS)  

---

## 1. Technical Prerequisites Checklist

- [x] Backend running on `http://localhost:4000` with Express 5, Socket.IO, and active SQLite/Prisma instance.
- [x] Frontend running on `http://localhost:5173` with Vite, React 19, and TailwindCSS v4.
- [x] Switch Agent Protocol adapter configured (`SWITCH_ENABLED=true`, room `1eab763f-3f1c...`).
- [x] Telegram bot tokens loaded (`TELEGRAM_BOT_TOKEN`, 4 role tokens, chat `-1004337160724`).
- [x] 28/28 unit and integration tests passing in terminal (`backend`, `sample-app`, `frontend`).
- [x] Headless Chrome 1080p CDP screen recorder with 30 FPS H.264 stream.

---

## 2. Scene-by-Scene Quality Verification

| Scene # | Target File | Target Duration | Verified Evidence | Frame Count Target |
| :-: | :--- | :---: | :--- | :---: |
| **01** | `scene01_opening.mp4` | 20s | DevOps AI Command Center title card, Team DAANAV branding, Flip the Switch Hackathon 2026 badge. | ~600 |
| **02** | `scene02_problem.mp4` | 25s | Production alert storm, HTTP 500 error flood from `checkout-api`, Sentry stack trace. | ~750 |
| **03** | `scene03_cockpit.mp4` | 35s | Live browser recording of Obsidian Cockpit: MTTR 42s, pass rate 100%, incident queue. | ~1050 |
| **04** | `scene04_switch.mp4` | 35s | Switch CONNECTED status badge, room ID, 4 specialized agents squad cards. | ~1050 |
| **05** | `scene05_telegram.mp4` | 55s | Full 55s Telegram War Room: operator prompt, Incident Manager, Log Analyzer, Code Fixer diff, Testing Agent verification, inline approve button. | ~1650 |
| **06** | `scene06_codereview.mp4` | 35s | UnifiedDiffViewer with syntax-highlighted additions (+) and deletions (-), AST panel. | ~1050 |
| **07** | `scene07_testing.mp4` | 30s | Testing Agent sandbox verification, TAP test output (2/2 passed, 0 regressions). | ~900 |
| **08** | `scene08_signoff.mp4` | 30s | Human-in-the-Loop Sign-Off Gate dialog, operator approval, status transition to RESOLVED. | ~900 |
| **09** | `scene09_architecture.mp4` | 25s | Archify interactive architecture diagram, animated flow traces through Switch backbone. | ~750 |
| **10** | `scene10_closing.mp4` | 15s | Resolved dashboard view, Team DAANAV credits, closing quote, Hackathon wrap-up. | ~450 |

---

## 3. Video Composition Standards

- **Resolution**: Exactly 1920 × 1080 (1080p widescreen 16:9).
- **Frame Rate**: Exactly 30.00 FPS constant frame rate.
- **Video Codec**: `libx264` (High Profile, YUV420P).
- **Audio Codec**: `aac` Stereo 48,000 Hz, 192 kbps.
- **Total Duration**: 305 seconds (5 minutes 05 seconds), strictly within the 4:45–5:15 window.
- **Subtitles**: Synchronized `.srt` embedded and burnt into MP4.

