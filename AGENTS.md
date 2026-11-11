# competitor-intel — hướng dẫn cho mọi coding agent (Claude Code, Codex, …)

Skill chính: `.agents/skills/analyzing-competitors/SKILL.md`. Đọc file này trước khi làm bất cứ việc gì trong repo.

- Mọi việc chạm tới TikTok chạy trên GitHub Actions (`.github/workflows/analyze.yml`). **Không** chạy yt-dlp/curl tới TikTok ở máy local, vì mạng công ty có thể chặn.
- Gửi việc và chờ kết quả bằng `bash scripts/request.sh …`, hoặc trên Windows PowerShell: `powershell -ExecutionPolicy Bypass -File scripts/request.ps1 …`. Hai bản làm cùng một việc và chỉ cần `git`.
- Agent chỉ viết 3 loại file: `docs/<slug>/tiktok/<handle>/labels.json`, `docs/<slug>/tiktok/<handle>/style.md`, `docs/<slug>/insights.md`. Các file còn lại trong `docs/` do CI sinh ra, đừng sửa tay (sẽ bị ghi đè).
- Repo public: không ghi số liệu nội bộ vào `docs/`.
- Codex cloud không push thẳng lên `main`: mở PR, người dùng merge thì workflow chạy.
- ChatGPT: xem `chatgpt/README.md`.
- Sửa code thì chạy `node --check scripts/*.mjs`; kiểm tra offline: `node scripts/competitors.mjs <slug> --offline`.
- Output tiếng Việt, code comments tiếng Anh.
