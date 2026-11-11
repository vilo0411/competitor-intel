# competitor-intel

Phân tích kênh TikTok đối thủ, chạy hoàn toàn trên GitHub Actions. Máy dùng không cần cài Node, yt-dlp, ffmpeg và không cần truy cập TikTok.

**Báo cáo:** https://vilo0411.github.io/competitor-intel/

## Dùng từ web
Tab **Actions → analyze → Run workflow** → điền tên đối thủ + kênh (`@kenh1 @kenh2`) → Run. Khoảng 3–8 phút sau báo cáo xuất hiện trên trang web.

## Dùng với Claude Code
```
/plugin marketplace add vilo0411/competitor-intel
/plugin install competitor-intel@competitor-intel
```
Rồi nói "phân tích đối thủ @kenh". Skill sẽ gửi yêu cầu qua git push, chờ Actions, gắn nhãn, viết nhận định và push lại.

## Cách hoạt động
| Sự kiện | Workflow làm gì |
|---|---|
| Push `requests/*.json` hoặc bấm Run | Lấy dữ liệu TikTok (yt-dlp), đo phong cách dựng video top (ffmpeg + whisper.cpp), dựng báo cáo |
| Push `labels.json` / `style.md` / `insights.md` | Dựng lại báo cáo từ cache, không gọi TikTok |
| Thứ Hai 8h (giờ VN) | Cập nhật view mọi đối thủ đã lưu |

Mỗi lần chạy: commit `docs/` → deploy GitHub Pages. Kết quả từng yêu cầu ở `docs/_runs/`.
