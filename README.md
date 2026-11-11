# competitor-intel

Phân tích kênh TikTok đối thủ, chạy hoàn toàn trên GitHub Actions. Máy dùng không cần cài Node, yt-dlp, ffmpeg và không cần truy cập TikTok.

**Báo cáo:** https://vilo0411.github.io/competitor-intel/

## Dùng từ web
Tab **Actions → analyze → Run workflow** → điền tên đối thủ + kênh (`@kenh1 @kenh2`) → Run. Khoảng 3–8 phút sau báo cáo xuất hiện trên trang web.

## Dùng với agent

| Agent | Cách cài / dùng |
|---|---|
| **Claude Code** | `/plugin marketplace add vilo0411/competitor-intel` rồi `/plugin install competitor-intel@competitor-intel`. Sau đó nói "phân tích đối thủ @kenh". |
| **Codex CLI** | Clone repo rồi mở Codex trong thư mục repo: Codex tự đọc `AGENTS.md` và skill trong `.agents/skills/`. Muốn dùng từ project khác thì chép thư mục `.agents/skills/analyzing-competitors` sang `.agents/skills/` của project đó. |
| **Codex cloud** | Kết nối repo này trên chatgpt.com/codex. Codex mở PR (thêm `requests/*.json` hoặc labels/insights), merge là workflow chạy. |
| **ChatGPT** | Tạo Custom GPT theo [chatgpt/README.md](chatgpt/README.md) (cần token GitHub chỉ có quyền Actions). |

Bản gốc của skill nằm ở `.agents/skills/analyzing-competitors/`, dùng chung cho mọi agent. Plugin Claude Code trỏ vào đây qua `.claude-plugin/plugin.json`.

## Cách hoạt động
| Sự kiện | Workflow làm gì |
|---|---|
| Push `requests/*.json` hoặc bấm Run | Lấy dữ liệu TikTok (yt-dlp), đo phong cách dựng video top (ffmpeg + whisper.cpp), dựng báo cáo |
| Push `labels.json` / `style.md` / `insights.md` | Dựng lại báo cáo từ cache, không gọi TikTok |
| Thứ Hai 8h (giờ VN) | Cập nhật view mọi đối thủ đã lưu |

Mỗi lần chạy: commit `docs/` → deploy GitHub Pages. Kết quả từng yêu cầu ở `docs/_runs/`.
