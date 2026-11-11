---
name: analyzing-competitors
description: Phân tích kênh TikTok đối thủ miễn phí, chạy trên GitHub Actions (máy local không cần Node, yt-dlp, ffmpeg hay truy cập TikTok) — lấy toàn bộ video công khai của một hoặc nhiều kênh (@handle hoặc link), tính view cao nhất, view trung vị, tỷ lệ tương tác, tần suất và giờ đăng, độ dài, hashtag, phân loại loại hình video, đo phong cách dựng của video top, rồi xuất báo cáo HTML có biểu đồ (đăng lên GitHub Pages) + Markdown kèm nhận định áp dụng cho kênh DSC. Dùng khi người dùng muốn "phân tích đối thủ", "soi kênh TikTok", "so sánh các kênh", "video nào view cao nhất", "kênh này đăng bao nhiêu lần".
argument-hint: [@kenh1 @kenh2 ...]
allowed-tools: Bash, Read, Write, Edit
---

# Phân tích đối thủ TikTok (`analyzing-competitors`)

Mọi việc chạm tới TikTok (yt-dlp, trang profile, tải video, ffmpeg, whisper) chạy trên **GitHub Actions** của repo `competitor-intel`. Máy local chỉ cần `git` (cộng `bash` hoặc PowerShell). **Không bao giờ** gọi yt-dlp, curl hay mở link TikTok từ máy local: mạng công ty có thể chặn, và cũng không cần.

- Repo: https://github.com/vilo0411/competitor-intel (public)
- Web báo cáo: https://vilo0411.github.io/competitor-intel/
- Cơ chế: commit file yêu cầu vào `requests/` rồi push → workflow `analyze` chạy → bot commit `docs/<đối-thủ>/…` về repo và deploy Pages. Push `labels.json`, `style.md` hoặc `insights.md` → workflow dựng lại báo cáo từ cache (không gọi TikTok, khoảng 1 phút).

## Bước 0: Tìm repo local và chọn lệnh theo môi trường

Dùng thư mục đầu tiên tồn tại: `$COMPETITOR_INTEL_DIR`, `E:/project/competitor-intel`, `~/competitor-intel`. Nếu chưa có thì `git clone https://github.com/vilo0411/competitor-intel ~/competitor-intel`. Mọi lệnh dưới đây chạy trong thư mục đó, nên `git pull` trước.

Skill này dùng chung cho nhiều agent. Chọn helper theo shell đang có, hai bản làm cùng một việc và chỉ cần `git`:

| Môi trường | Lệnh |
|---|---|
| Claude Code, Codex trên macOS/Linux, Git Bash | `bash scripts/request.sh <run\|push\|wait\|status> …` |
| Codex/agent trên Windows dùng PowerShell | `powershell -ExecutionPolicy Bypass -File scripts/request.ps1 <run\|push\|wait\|status> … [-Refresh] [-Style N] [-Limit N]` |
| Codex cloud (chatgpt.com/codex) | Không push thẳng được: sửa file trong `requests/` hoặc `docs/` rồi mở PR. Người dùng merge xong thì workflow tự chạy. |
| ChatGPT (Custom GPT) | Không dùng repo. Gọi workflow qua GitHub API, xem `chatgpt/README.md`. |

Để xem ảnh (bước 3), agent cần đọc được file ảnh local. Agent không xem được ảnh thì viết `style.md` từ `transcript` và số đo trong `style.json`, và ghi rõ là chưa xem khung hình.

```
docs/<ten-doi-thu>/                    (public trên GitHub Pages)
├── <ten-doi-thu>.html       báo cáo có biểu đồ
├── <ten-doi-thu>.md         báo cáo Markdown
├── insights.md              nhận định do agent viết
├── competitor.json          tên hiển thị + danh sách kênh theo nền tảng
├── summary.json             số liệu gọn cho agent đọc
├── history/<YYYY-MM-DD>.json   ảnh chụp số liệu mỗi lần chạy
└── tiktok/<handle>/         videos.json, profile.json, labels.json, labels.todo.json, covers/, style/<id>/, style.md
docs/_runs/<id>.json         kết quả từng lần chạy (status, log)
```

## Quy trình

```
- [ ] Bước 1: Gửi yêu cầu, chờ Actions lấy dữ liệu và tạo báo cáo nháp
- [ ] Bước 2: Gắn nhãn loại hình cho từng video (labels.json)
- [ ] Bước 3: Xem khung hình + lời thoại video top, viết style.md (phong cách dựng)
- [ ] Bước 4: Viết insights.md (nhận định + áp dụng cho DSC)
- [ ] Bước 5: Push, chờ dựng lại, kiểm tra báo cáo
- [ ] Bước 6: Báo cho người dùng các con số chính + link web
```

### Bước 1: Gửi yêu cầu

```bash
bash scripts/request.sh run "Gorillanomics" @gorillanomics https://www.tiktok.com/@kenh-phu [--limit 300] [--style 5] [--refresh]
bash scripts/request.sh run gorillanomics --refresh     # chạy lại đối thủ đã lưu, lấy view mới
```

Lệnh tự commit `requests/<id>.json`, push, chờ bot commit (thường 3–8 phút; lần đầu thêm khoảng 5 phút để build whisper, sau đó có cache), rồi pull và in `status`. Nếu lỗi, lệnh in log từ `docs/_runs/<id>.json`. Hết thời gian chờ thì chạy `bash scripts/request.sh wait` hoặc xem tab Actions. Chạy dài (nhiều kênh, `--style` lớn) thì chạy lệnh ở chế độ nền.

- Tham số không phải @handle hay link TikTok là **tên đối thủ**. Thư mục đặt theo tên đã bỏ dấu, viết thường, nối gạch ngang. Không có tên thì lấy handle đầu tiên.
- Tên hiển thị được lưu lần đầu trong `competitor.json`. Kênh mới truyền vào được cộng thêm vào danh sách đã lưu.
- Mỗi đối thủ một lệnh riêng, một báo cáo riêng.
- Dữ liệu được cache trong repo. Không có `--refresh` thì không tải lại danh sách video. Workflow cũng tự `--refresh` mọi đối thủ mỗi thứ Hai 8h sáng (giờ VN), mỗi lần ghi `history/<ngày>.json` để so xu hướng.
- `--style N` (mặc định 5, `0` để bỏ qua): số video top được tải về trên Actions để đo nhịp đổi hình, số lần đổi hình trong 3 giây đầu, tốc độ đọc, độ to và câu nói trong 3 giây đầu (ffmpeg + whisper large-v3-turbo). Kết quả ở `tiktok/<handle>/style/<id>/`: `style.json`, `hook.jpg`, `frames/grid_*.jpg`, `audio/audio.txt`. Video gốc không lưu.
- Người dùng cũng có thể tự chạy từ web GitHub: tab **Actions → analyze → Run workflow** (điền tên, kênh).
- Đọc `docs/<ten-doi-thu>/summary.json` để lấy số liệu cho các bước sau.

### Bước 2: Gắn nhãn loại hình

TikTok không có trường "loại hình", agent tự phân loại. Đọc `tiktok/<handle>/labels.todo.json` (id, tiêu đề, view, độ dài) rồi ghi `tiktok/<handle>/labels.json` dạng `{ "<id>": "<loại>" }`. Ghi đè cả file, giữ nhãn cũ cho video đã có nhãn.

- Dùng **2–4 nhóm** theo nội dung, tên tiếng Việt cụ thể. Ví dụ: "Khái niệm tài chính", "Tin thời sự / chính trị", "Tội phạm & mặt tối tài chính", "Review sản phẩm", "Phỏng vấn đường phố".
- Biểu đồ chỉ tô màu cho 3 nhóm mang về nhiều view nhất, còn lại gộp thành "Khác", vì vậy đừng chia vụn.
- Khi so nhiều kênh hoặc nhiều đối thủ cùng ngách, dùng chung bộ tên nhóm.
- Máy local có thể không có Node/Python: phân loại bằng cách đọc tiêu đề rồi tự viết JSON bằng Write. Danh sách dài thì làm theo từng đợt, nhưng phải đọc lại để sửa video bị xếp sai.

### Bước 3: Phong cách dựng (`style.md`)

Đây là phần trả lời câu hỏi **"họ làm video thế nào"**. Với từng video trong `tiktok/<handle>/style/<id>/`:
- dùng Read xem `frames/grid_*.jpg` (mỗi ô có đóng dấu thời gian) và `hook.jpg`,
- đọc lời thoại trong `style.json` → `transcript`, cùng các số đo `secPerChange`, `changesFirst3s`, `wpm`, `lufs`,
- đọc `style.json` → `motion` (đo bằng `scripts/video/motion-timeline.mjs`): `medianBeat` (số giây mỗi lần đổi hình, **không tính phụ đề**), `beatsPerMin`, `beatsFirst3s`, `entrances` (số beat theo kiểu vào hình: cut/pop/drop/slide-*/draw-*/fade), `caption` (dải phụ đề: `medianInterval` giây/cụm, `box` vị trí), `firstBeats` (các beat đầu kèm từ đang đọc). Chi tiết từng phần tử nằm ở `motion/motion.md`.

Sau đó viết `tiktok/<handle>/style.md`. Phần này được nhúng vào mục "Họ dựng video thế nào?" của báo cáo. Gồm:

1. **Hình ảnh:** chất liệu (người thật, hoạt hình, sticker, footage, thẻ chữ), nhân vật, bối cảnh, bố cục, cách đổi hình (cắt theo từ, theo câu hay cắt cảnh), chuyển cảnh, ẩn dụ hình ảnh.
2. **Chữ và phụ đề:** số từ mỗi lần hiện, vị trí, màu, viền; ảnh bìa/khung đầu.
3. **Lời và nhịp kể:** câu móc mở đầu (trích nguyên văn), giọng văn, cấu trúc kịch bản, câu chốt, tốc độ đọc, nhạc và tiếng động.
4. **Áp dụng cho DSC:** đối chiếu với format có sẵn qua [references/dsc-format-mapping.md](references/dsc-format-mapping.md), nêu format/skill dùng được ngay và những điểm cần giữ hoặc thay khi chuyển sang tiếng Việt.

Lưu ý khi đọc số đo:
- `cuts` (ngưỡng 0.3) chỉ đếm cắt cảnh hẳn. `changes` (ngưỡng 0.06) đếm cả việc đổi sticker hay hình minh hoạ trên nền tĩnh. Video hoạt hình, sticker thường có `cuts` gần 0 nhưng `changes` rất cao.
- Khi có `motion`, dùng `medianBeat` thay cho `secPerChange`. Dải `caption` được nhận ra vì là vùng thấp đổi lặp lại **ở cùng chỗ**. Phải xem grid để xác nhận đó đúng là phụ đề chứ không phải nhãn hay số đếm.
- **Phụ đề đi theo sticker** (như Gorillanomics: chữ nằm ngay dưới hình, đổi chỗ theo hình) thì không thành dải cố định. Khi đó beat **gồm cả đổi chữ** và `caption` chỉ bắt được một phần. Phải nói rõ điều này, rồi ước lượng nhịp sticker riêng bằng grid (đếm số ô liền nhau dùng chung một sticker).
- `firstBeats` + `hook` cho biết hình có đổi đúng nhịp lời không (ví dụ beat rơi đúng từ khoá). Ghi điều này vào mục "Lời và nhịp kể".
- Mô tả phải dựa vào khung hình và lời thoại đã xem, không đoán. Muốn mổ xẻ sâu một video thì dùng skill `analyzing-video` (nếu project hiện tại có).

### Bước 4: Nhận định

Ghi `docs/<ten-doi-thu>/insights.md` bằng Markdown đơn giản (`###`, gạch đầu dòng, `**đậm**`). Phần này được nhúng lên đầu báo cáo. Gồm:

1. **Công thức thắng**: loại hình, phong cách và mẫu tiêu đề của các video top.
2. **Loại hình nào thắng**: view trung vị theo nhóm (`summary.json` → `categories`).
3. **Nhịp đăng**: video/tuần, xu hướng theo tháng, kênh còn hoạt động không (`daysSinceLast`), giờ và thứ đăng.
4. **Độ dài**: so view trung vị giữa các mức độ dài.
5. **Áp dụng cho DSC**: 3–4 việc cụ thể, gắn với format có sẵn (toon, news, shorts) và kênh đích.

Quy tắc:
- Dùng **trung vị** khi so sánh, vì vài video viral kéo lệch trung bình.
- Nhóm dưới khoảng 5 video chỉ là tín hiệu yếu, phải nói rõ.
- Hai yếu tố trùng giai đoạn thì nêu rõ là chưa tách được nguyên nhân, không kết luận nhân quả.
- Repo **public**: không ghi số liệu nội bộ của DSC (doanh thu, chi phí, KPI chưa công bố) vào `insights.md` hay `style.md`.

### Bước 5: Push và kiểm tra

```bash
bash scripts/request.sh push "agent: labels + style + insights cho <ten-doi-thu>"
```

Lệnh commit `docs/`, push, chờ workflow dựng lại (khoảng 1–2 phút) rồi pull. Kiểm tra bằng cách đọc `docs/<ten-doi-thu>/<ten-doi-thu>.md` (nhãn đã vào bảng loại hình, có phần Nhận định và Phong cách dựng). Trang web cập nhật sau khi job `deploy` xong.

### Bước 6: Báo cáo cho người dùng

Gửi các con số chính (follower, view trung vị, top 3 video, loại hình thắng, nhịp đăng) cùng link `https://vilo0411.github.io/competitor-intel/<ten-doi-thu>/<ten-doi-thu>.html`.

## Nội dung báo cáo

Mỗi biểu đồ trả lời **một câu hỏi**; tiêu đề biểu đồ là câu trả lời script tính từ dữ liệu. Thanh của nhóm thắng tô màu, nhóm khác xám, vạch đứt là trung vị kênh. Nhóm dưới 5 video (tháng dưới 3 video) bị làm nhạt, gắn nhãn "ít mẫu", không bao giờ được chọn là nhóm thắng.

Mỗi kênh có: số liệu chính (follower, view trung vị, tương tác, video/tuần, cảnh báo nếu ngừng đăng quá 30 ngày); điểm chính tự động (`summary.json` → `takeaways`); top 10 video; phong cách dựng; loại nội dung thắng; % số video so với % tổng view theo nhóm; xu hướng theo tháng; mức phụ thuộc viral; giờ/thứ đăng, độ dài, hashtag; bảng dữ liệu đầy đủ. Từ 2 kênh trở lên có thêm phần "So sánh các kênh".

Phần **Nhận định** do agent viết, nên đi xa hơn các câu tự động: giải thích **vì sao** video thắng (dựa vào khung hình và tiêu đề) và đề xuất việc cụ thể cho DSC. Đừng chép lại phần "Điểm chính".

Tỷ lệ tương tác = (like + bình luận + chia sẻ + lưu) / view.

## Giới hạn và lỗi thường gặp

- **Không có**: thời gian xem, tỷ lệ xem hết, nguồn traffic, chân dung khán giả, view theo ngày trong quá khứ. Xu hướng view xem qua `history/` (cập nhật hằng tuần).
- **Thiếu follower**: WAF của TikTok đôi khi chặn trang profile. Chạy lại sau (không cần `--refresh`, follower tự được lấy lại).
- **`status: error` / 0 video**: đọc `log` trong `docs/_runs/<id>.json`. Kiểm tra kênh có bị riêng tư không. IP của GitHub runner thay đổi mỗi lần nên thường chỉ cần chạy lại. Workflow luôn cài yt-dlp mới nhất.
- Không kéo quá nhiều kênh mỗi lần (TikTok có thể chặn tạm thời). Dữ liệu chỉ để nghiên cứu nội bộ, không bán lại.
