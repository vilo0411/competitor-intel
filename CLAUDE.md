# competitor-intel

Skill chính: `skills/analyzing-competitors/SKILL.md` — đọc trước khi làm bất cứ việc gì trong repo này.

- Mọi việc chạm TikTok chạy trên GitHub Actions (`.github/workflows/analyze.yml`). Không chạy yt-dlp/curl tới TikTok ở máy local.
- Gửi việc: `bash scripts/request.sh run "<Tên>" @kenh …`; đẩy labels/style/insights: `bash scripts/request.sh push`.
- Repo public: không ghi số liệu nội bộ vào `docs/`.
- Output tiếng Việt, code comments tiếng Anh.
