# Cafe Chung Cung Minh — phân tích đối thủ

Cập nhật 2026-11-16 · TikTok: @cafechungcungminh. Biểu đồ xem trong `cafe-chung-cung-minh.html`.

## Nhận định

### Bối cảnh
- Kênh rất mới: video đầu tiên đăng ngày 18/10/2026. Tới nay có 18 video và 4,4k follower. Mọi nhận định dưới đây dựa trên **chưa đầy 4 tuần dữ liệu**, nên chỉ nên đọc là tín hiệu sớm.
- View dồn vào rất ít video: 3 bài (VNM 778k, FPT 422k, mẹo NHNN 62k) mang về 93% tổng view. Trung vị toàn kênh chỉ 4,4k. Một bài hit mới đủ làm thay đổi hẳn bức tranh của kênh.

### Mẫu nội dung đáng thử
- **Đặc trưng định dạng (bài nào cũng có, nên không giải thích được vì sao bài này hơn bài kia):** motion graphics dữ liệu trên nền navy kẻ lưới, phụ đề karaoke tô vàng từ khoá, nhãn chương đánh số, số đếm chạy khớp lời đọc. Xem mục "Họ dựng video thế nào?".
- **Điểm có thể phân biệt bài tốt và bài yếu (giả thuyết):** 2 bài lớn nhất đều mở bằng **tình huống tiền của chính người xem hoặc người kể**, có con số cụ thể và kết bằng câu hỏi. Ví dụ: "5 năm trước, bạn bỏ 100 triệu vào Vinamilk… Hôm nay, bạn có bao nhiêu?" và "Có người từng khuyên tôi mua FPT ở giá 145.000 đồng…". Bài họ Vin mở thẳng bằng số liệu thị trường ("chiếm 21% vốn hóa…") chỉ đạt 12,5k. Đây mới là so sánh 2 bài với 1 bài. Chưa xem lời thoại của các bài 1–5k nên **chưa tách được** tác động của hook với tác động của chủ đề: VNM và FPT là mã quen với số đông, còn họ Vin thiên về chuyện thị trường.
- Tiêu đề: 5/18 bài chỉ có hashtag, không có câu tiêu đề. Các bài này đều đăng trong tuần đầu nên trùng với giai đoạn kênh còn mới, không tách được ảnh hưởng của việc thiếu tiêu đề.

### Loại hình nào thắng
- **Chưa đủ mẫu để gọi nhóm nào là thắng.** Báo cáo không tô màu nhóm nào.
- "Phân tích một mã cổ phiếu" (11 bài): trung vị 7,9k, 2/11 bài là hit (VNM, FPT).
- "Kiến thức / mẹo đầu tư" (3 bài, ít mẫu): trung vị 8,7k, 1/3 bài là hit. Nhóm này có tỷ lệ lưu cao nhất (trung vị khoảng 1% số view, bài mẹo NHNN là 2,2%), gợi ý người xem coi đây là nội dung để giữ lại. Tỷ lệ lưu không cho biết thời gian xem.
- "Thị trường & vĩ mô" (4 bài, ít mẫu): trung vị 1,6k, không có hit, chiếm 22% số bài nhưng chỉ mang về 0,5% tổng view. Có 2 bài trong nhóm này không có tiêu đề nên được xếp nhóm theo suy đoán.

### Nhịp đăng
- 5,2 video/tuần, cách nhau trung vị khoảng 1,9 ngày. Bài gần nhất đăng 11/11, kênh vẫn đang hoạt động.
- Phần lớn bài đăng trong khoảng 15–20h (giờ VN). Không khung giờ hay thứ nào nổi trội rõ.
- Tháng 11 chưa có hit (0/6), nhưng 3 bài còn dưới 7 ngày tuổi. **Chưa thể kết luận view đang giảm.**

### Độ dài
- Bài VNM (51s) là bài ngắn nhất kênh và cũng là bài view cao nhất. Tuy vậy, trong từng nhóm nội dung chỉ có 1–4 bài mỗi mức độ dài, nên **chưa so sánh được độ dài**.

### Áp dụng cho DSC
1. **Thử hook kiểu "tiền của bạn" cho bài về mã cổ phiếu.** Quan sát: 2 bài hit lớn nhất đều mở bằng giả định "nếu bạn/tôi đã bỏ X vào mã Y" (n = 2, chưa có đối chứng). Thử nghiệm: làm 4 bài `shorts-kinetic` về 4 mã quen thuộc, 2 bài mở bằng tình huống tiền cá nhân, 2 bài mở bằng số liệu thị trường, giữ nguyên khuôn dựng. Chỉ số đánh giá: view sau 7 ngày so với trung vị kênh DSC, và tỷ lệ xem 3 giây đầu trong TikTok Studio.
2. **Làm lại khuôn đồ hoạ "số đếm + nhãn chương + karaoke vàng" bằng `dsc-shorts`.** Dùng các cue `big_counter`, `ab_compare`, `question`, `list`, thêm biểu đồ nến hoặc thanh từ `dataviz`. Đây là khuôn có thể đăng 5 bài/tuần, nhưng cần đo tỷ lệ xem hết trên kênh DSC, vì dữ liệu công khai của đối thủ không cho biết thời gian xem.
3. **Thử bài "mẹo đọc vĩ mô" có công thức dễ nhớ** (ví dụ "lãi suất giảm + tỷ giá ổn định = chứng khoán là vua"). Bài này có tỷ lệ lưu và chia sẻ cao nhất kênh, nhưng mới là 1 bài. Chỉ số đánh giá: tỷ lệ lưu/view so với các bài phân tích mã.
4. **Theo dõi tiếp kênh này.** Workflow tự refresh mỗi thứ Hai. Kênh mới và đăng dày nên sau 4–6 tuần nữa mới đủ mẫu để so sánh loại hình.

## TikTok

### @cafechungcungminh

- 4,8k follower · 18 video phân tích (2026-10-18 → 2026-11-11) · tổng 1,4 tr view
- View trung vị 4,5k, trung bình 77k, cao nhất 784k · tương tác trung vị 2,4%
- 5,2 video/tuần · 18 video trong 30 ngày qua · độ dài trung vị 77s · 77,8% dùng âm thanh gốc

**Điểm chính**

- Chưa đủ mẫu để so sánh loại nội dung
- **Thị trường & vĩ mô** chiếm 22,2% số video nhưng chỉ mang về 0,6% tổng view
- **3/18 video** đạt từ 45k view (10× trung vị kênh) và mang về **92,5%** tổng view; top 3 chiếm 92,5%
- Số hit (từ 45k view) theo tháng gần nhất: **3/12 → 0/6** (kỳ cuối có 1 bài dưới 7 ngày tuổi, còn tích view)
- Đăng 5,2 video/tuần; tháng dày nhất T10/26 có 12 video; 30 ngày qua: 18 video
- Không khung giờ nào nổi trội rõ: chênh lệch giữa các nhóm còn trong mức ngẫu nhiên (trung vị 4,1k–9,9k)
- Không thứ nào nổi trội rõ: chênh lệch giữa các nhóm còn trong mức ngẫu nhiên (trung vị 2,1k–8,1k)
- Không mức độ dài nào nổi trội rõ: chênh lệch giữa các nhóm còn trong mức ngẫu nhiên (trung vị 4,3k–4,7k)
- Hashtag đi kèm view cao hơn hẳn trung vị: **#cổphiếu**; không chứng minh hashtag làm tăng view

| # | Video | View | Tương tác | Giây | Ngày | Loại |
|---|---|---|---|---|---|---|
| 1 | [Giải thích về VNM trong 1 phút #creatorsearchinsights #cổphi](https://www.tiktok.com/@cafechungcungminh/video/7700155703234678017) | 784k | 2,4% | 51 | 2026-10-24 | Phân tích một mã cổ phiếu |
| 2 | [Phượng hoàng tái sinh FPT #creatorsearchinsights #cổphiếu #c](https://www.tiktok.com/@cafechungcungminh/video/7702380012628020500) | 433k | 3,3% | 122 | 2026-10-30 | Phân tích một mã cổ phiếu |
| 3 | [Các bạn đánh giá sao về mẹo này #creatorsearchinsights #cổph](https://www.tiktok.com/@cafechungcungminh/video/7701680816157445396) | 74k | 9,0% | 77 | 2026-10-28 | Kiến thức / mẹo đầu tư |
| 4 | [Liệu còn chuyến tàu thứ 2 cho VSC? #creatorsearchinsights #c](https://www.tiktok.com/@cafechungcungminh/video/7703123815131368724) | 31k | 3,8% | 96 | 2026-11-01 | Phân tích một mã cổ phiếu |
| 5 | [Kiếm tiền từ cổ phiếu như thế nào? #creatorsearchinsights #c](https://www.tiktok.com/@cafechungcungminh/video/7706090045530246452) | 13k | 6,6% | 72 | 2026-11-09 | Kiến thức / mẹo đầu tư |
| 6 | [#creatorsearchinsights #cổphiếu #cafechung #vin ](https://www.tiktok.com/@cafechungcungminh/video/7697987952848145685) | 13k | 2,0% | 82 | 2026-10-18 | Phân tích một mã cổ phiếu |
| 7 | [Lãi suất tăng cứ tăng, VHM vẫn bán được nhà #creatorsearchin](https://www.tiktok.com/@cafechungcungminh/video/7698344579770240262) | 9,9k | 1,9% | 77 | 2026-10-19 | Phân tích một mã cổ phiếu |
| 8 | [Gánh cả Vn-index có khác #creatorsearchinsights #cổphiếu #ca](https://www.tiktok.com/@cafechungcungminh/video/7700928215514205441) | 8,1k | 2,1% | 74 | 2026-10-26 | Phân tích một mã cổ phiếu |
| 9 | [#creatorsearchinsights #cổphiếuchứngkhoán #cafechung #VHM ](https://www.tiktok.com/@cafechungcungminh/video/7699090033105521941) | 4,7k | 1,8% | 77 | 2026-10-21 | Phân tích một mã cổ phiếu |
| 10 | [Vin thì cứ vài cây trần là đẹp #creatorsearchinsights #cổphi](https://www.tiktok.com/@cafechungcungminh/video/7699451700351995156) | 4,3k | 1,9% | 76 | 2026-10-22 | Phân tích một mã cổ phiếu |

**Phong cách dựng (video top)**

Đã xem grid khung hình và lời thoại của 5 video top: VNM 778k, FPT 422k, mẹo NHNN 62k, VSC 29,5k, họ Vin 12,5k. Cả 5 video dùng **cùng một khuôn đồ hoạ**. Mẫu chỉ gồm video top, chưa có video view thấp để đối chứng.

### Hình ảnh
- **Motion graphics dữ liệu 100%, không có người thật.** Nền xanh navy đậm có lưới ô vuông mờ, giữa khung có vầng sáng vàng. Màu nhấn là vàng gold, xanh lá cho số tăng, đỏ cho số giảm.
- **Khung cố định:** góc trên trái có badge mã cổ phiếu ("VNM · HOSE", "FPT · HOSE"; bài vĩ mô thì ghi "MẸO · Vĩ mô"), góc trên phải có logo "Cafe Chứng". Bên dưới badge là **nhãn chương đánh số** ("01 Mở đầu", "02 Câu hỏi", "06 Templeton", "08 Công bằng", "09 Lưu ý"). Mỗi video được chia thành khoảng 8–10 chương ngắn.
- **Chất liệu:** số đếm cỡ lớn chạy từ 0 lên giá trị thật (100 triệu, 145.000đ, 21%), thanh tiến độ, nến Nhật tự vẽ dần từng cây, đồng hồ kim (gauge), thẻ so sánh "5 năm trước → Hôm nay ?", cái cân, icon 3D (túi tiền, hộp sữa VNM, toà nhà Ngân hàng Nhà nước, con tàu VSC). Ảnh thật chỉ xuất hiện ở bài họ Vin (chân dung kèm logo các công ty).
- **Ẩn dụ hình ảnh bám theo câu chữ:** "con tàu VSC quay về điểm xuất phát… kéo còi" thì vẽ con tàu và chữ "TÚUT!". "Thị trường giá lên sinh ra trong bi quan…" thì vẽ đường cong có 4 điểm Bi quan → Hoài nghi → Lạc quan → Hưng phấn.
- **Nhịp đổi hình:** không có cắt cảnh (`cuts` = 0). Hình liên tục được dựng thêm: số chạy, nến mọc, thẻ trượt vào. Cứ khoảng 0,5–1 giây lại có một phần tử mới. Các phần tử chồng dần lên nhau trong một chương, sang chương mới thì khung được xoá trắng. Bộ đo beat chỉ bắt được 5,6–12,8 beat/phút (`medianBeat` 0,4–1,7s). Con số này thấp hơn nhịp thực tế vì các chuyển động liên tục (đếm số, vẽ nến) không được tính thành beat riêng.

### Chữ và phụ đề
- **Phụ đề karaoke** ở 1/3 dưới khung, căn giữa, chữ trắng đậm 2–3 dòng. Từ đang đọc được tô trắng, từ chưa đọc để xám, **từ khoá chuyển sang vàng** (con số, tên mã, "quốc dân", "bất ngờ"). Mỗi lần hiện nguyên một cụm câu. Bộ đo không nhận ra dải phụ đề (`caption` = null) vì chữ được tô dần từng từ chứ không đổi cả cụm cùng lúc. Grid xác nhận dải này nằm cố định một chỗ.
- Tiêu đề phụ nhỏ trên hình chính lặp lại ý của câu ("Giá mua được khuyên", "Tỷ trọng vốn hóa thị trường"), giúp người xem tắt tiếng vẫn hiểu.
- **Khung đầu** (hook.jpg) chỉ có một chữ/số rất lớn màu vàng ("FPT", "VSC", "100 triệu đồng", toà nhà NHNN), không đặt tiêu đề dài.

### Lời và nhịp kể
- **Câu mở đầu dạng giả định hoặc tình huống cá nhân, có một con số cụ thể:**
  - "5 năm trước, bạn bỏ 100 triệu vào Vinamilk, cổ phiếu quốc dân của người Việt. Hôm nay, bạn có bao nhiêu?" (778k)
  - "Có người từng khuyên tôi mua FPT ở giá 145.000 đồng. Nếu khi ấy tôi nghe theo, tài khoản của tôi bây giờ sẽ ra sao?" (422k)
  - "Có một cổ phiếu từng khiến rất nhiều người tiếc nuối vì không mua, nhưng giờ đây lại chẳng mấy ai muốn nhắc đến." (29,5k)
  - Bài mẹo (62k) mở bằng lời hứa: "Mẹo nhìn động thái của Ngân hàng Nhà nước để dự đoán hướng đi của thị trường chứng khoán".
  - Bài họ Vin (12,5k) mở thẳng bằng số liệu "Năm 2025, VIC, VHM và VRE chỉ chiếm 21% vốn hóa…", không có câu hỏi hay tình huống. Đây là bài view thấp nhất trong 5 bài, nhưng mới là 1 bài nên chưa đủ để kết luận.
- **Hình khớp với lời:** con số trên màn hình đếm lên đúng lúc giọng đọc tới số đó (0 → 91 → 100 khi đọc "100 triệu"). Thẻ "AI", "Chip bán dẫn", "Chuyển đổi số" bật ra theo từng từ được đọc.
- **Kịch bản:** câu hỏi mở → bối cảnh và số liệu → khúc ngoặt ("Nhưng…", "Và đây là hiện tại") → bài học được đánh số (Thứ nhất, Thứ hai, Cuối cùng) → câu hỏi kéo bình luận ("Bạn chọn khoản lãi đều hay chấp nhận biến động…?", "Comment kể mình nghe với") → câu miễn trừ "không phải khuyến nghị đầu tư".
- **Giọng:** giọng đọc thuyết minh (chưa nghe trực tiếp nên chưa xác định là người thật hay TTS), kể theo ngôi "tôi/mình" như chuyện cá nhân. Tốc độ 207–257 âm tiết/phút (khoảng 3,5–4,3 âm tiết/giây). Âm lượng -15 đến -17 LUFS. 78% video dùng "âm thanh gốc".
- Độ dài 51–122s. Bài 778k là bài ngắn nhất (51s).

### Áp dụng cho DSC
- **Format dùng được ngay:** `shorts-kinetic` (skill `dsc-shorts`). Các cue `big_counter`, `ab_compare`, `question`, `list`, `outro_cta` khớp gần như 1:1 với thẻ "100 triệu → ?", gauge và bài học đánh số. Biểu đồ nến hoặc thanh tỷ trọng thì ghép từ `dataviz` (`line`, `counter`, `bar`).
- **Nên giữ:** nhãn chương đánh số ở góc trên (giúp người xem biết mình đang ở đâu trong video dài 60–120s), badge mã cổ phiếu cố định, số đếm chạy khớp với lời đọc, phụ đề karaoke tô vàng từ khoá.
- **Nên thay hoặc thêm:** Câu miễn trừ nên đặt ở cuối giống họ, không làm chậm hook.

| Video | View | Đổi hình | 3s đầu | Phụ đề | Âm tiết/phút | 3 giây đầu nói |
|---|---|---|---|---|---|---|
| [Giải thích về VNM trong 1 phút #creators](https://www.tiktok.com/@cafechungcungminh/video/7700155703234678017) | 784k | 0,8s/beat | 0 | — | 236 | 5 năm trước, bạn bỏ 100 triệu vào Vinamil, cổ phiếu |
| [Phượng hoàng tái sinh FPT #creatorsearch](https://www.tiktok.com/@cafechungcungminh/video/7702380012628020500) | 433k | 0,6s/beat | 0 | — | 220 | Có người từng khuyên tôi mua FPT ở giá 145.000 |
| [Các bạn đánh giá sao về mẹo này #creator](https://www.tiktok.com/@cafechungcungminh/video/7701680816157445396) | 74k | 0,4s/beat | 0 | — | 251 | Mẹo nhìn động thái của Ngân hàng Nhà nước để dự đoán hướng đi của thị trường chứng |
| [Liệu còn chuyến tàu thứ 2 cho VSC? #crea](https://www.tiktok.com/@cafechungcungminh/video/7703123815131368724) | 31k | 0,5s/beat | 2 | — | 257 | Có một cổ phiếu từng khiến rất nhiều người tiếc nuối vì không mua, |
| [Kiếm tiền từ cổ phiếu như thế nào? #crea](https://www.tiktok.com/@cafechungcungminh/video/7706090045530246452) | 13k | 3,9s/beat | 0 | — | 246 | Bạn nghĩ rằng đầu tư chứng khoán chỉ đơn giản là mua cổ phiếu khi giá |

#### Kiểm tra bằng chứng

View là số tích lũy trong cache, không phải view ở cùng tuổi bài; bài dưới 7 ngày tuổi lúc thu thập còn đang tích view và được đếm riêng. "So với bài cùng thời" = view chia cho trung vị các bài khác đăng trong ±7 ngày (nới tới ±30 ngày nếu thiếu mẫu); cách này giảm nhiễu giai đoạn nhưng không chứng minh nhân quả. Hit = bài đạt từ 10× trung vị kênh. Nhóm dưới 5 bài là ít mẫu; không chọn làm nhóm dẫn đầu. Tỷ lệ vượt chuẩn dùng dấu >. Thiếu số đo hiển thị —; cache cũ có thể đã thay dữ liệu tương tác thiếu bằng 0. Không suy ra giữ chân, người xem quay lại hoặc cơ hội thị trường từ dữ liệu này.

Đã gắn nhãn 18/18 video. P25–P75 là khoảng phân vị, không phải khoảng tin cậy.

**Độ ổn định theo loại nội dung**

| Loại | n | Trung vị | P25–P75 | Hit (≥45k) | So với bài cùng thời | Vượt bài cùng thời |
|---|---|---|---|---|---|---|
| Kiến thức / mẹo đầu tư | 3 · ít mẫu | 13k | 8,7k–43k | 1/3 | 2,1× | 66,7% |
| Phân tích một mã cổ phiếu | 11 · 1 bài <7 ngày | 8,1k | 4,1k–22k | 2/11 | 1,1× | 54,5% |
| Thị trường & vĩ mô | 4 · ít mẫu | 1,9k | 1,7k–2,2k | 0/4 | 0,4× | 0,0% |

**Tỷ lệ hit theo tháng (mọi bài)**

| Kỳ | n | Trung vị | Hit (≥45k) |
|---|---|---|---|
| T10/2026 | 12 | 6,4k | 3/12 |
| T11/2026 | 6 · 1 bài <7 ngày | 3,2k | 0/6 |

**Kiểm tra khi bỏ video nhiều view nhất toàn kênh**

| Bỏ top | Loại | n còn lại | Trung vị | Dẫn đầu đủ mẫu |
|---|---|---|---|---|
| 0 | Kiến thức / mẹo đầu tư | 3 · ít mẫu | 13k | — |
| 0 | Phân tích một mã cổ phiếu | 11 · 1 bài <7 ngày | 8,1k | Có (có thể đồng hạng) |
| 0 | Thị trường & vĩ mô | 4 · ít mẫu | 1,9k | — |
| 1 | Kiến thức / mẹo đầu tư | 3 · ít mẫu | 13k | — |
| 1 | Phân tích một mã cổ phiếu | 10 · 1 bài <7 ngày | 6,4k | Có (có thể đồng hạng) |
| 1 | Thị trường & vĩ mô | 4 · ít mẫu | 1,9k | — |
| 3 | Kiến thức / mẹo đầu tư | 2 · ít mẫu | 8,7k | — |
| 3 | Phân tích một mã cổ phiếu | 9 · 1 bài <7 ngày | 4,7k | Có (có thể đồng hạng) |
| 3 | Thị trường & vĩ mô | 4 · ít mẫu | 1,9k | — |

**So chủ đề trong cùng tháng (chỉ kỳ có từ 2 loại)**

| Kỳ | Loại | n | Trung vị | Hit |
|---|---|---|---|---|
| T10/2026 | Kiến thức / mẹo đầu tư | 1 · ít mẫu | 74k | 1/1 |
| T10/2026 | Phân tích một mã cổ phiếu | 9 | 8,1k | 2/9 |
| T10/2026 | Thị trường & vĩ mô | 2 · ít mẫu | 2,4k | 0/2 |
| T11/2026 | Phân tích một mã cổ phiếu | 2 · ít mẫu · 1 bài <7 ngày | 17k | 0/2 |
| T11/2026 | Kiến thức / mẹo đầu tư | 2 · ít mẫu | 8,7k | 0/2 |
| T11/2026 | Thị trường & vĩ mô | 2 · ít mẫu | 1,7k | 0/2 |

**Độ dài trong cùng chủ đề (mốc chia theo phân vị của từng loại)**

| Loại | Độ dài | n | Trung vị | So với bài cùng thời | Hit | Đủ hai nhóm ≥5 bài |
|---|---|---|---|---|---|---|
| Kiến thức / mẹo đầu tư | ≤75s | 1 · ít mẫu | 13k | 2,1× | 0/1 | Chưa đủ mẫu |
| Kiến thức / mẹo đầu tư | 75s–1:30 | 1 · ít mẫu | 74k | 11× | 1/1 | Chưa đủ mẫu |
| Kiến thức / mẹo đầu tư | >1:30 | 1 · ít mẫu | 4,3k | 0,3× | 0/1 | Chưa đủ mẫu |
| Phân tích một mã cổ phiếu | ≤75s | 4 · ít mẫu · 1 bài <7 ngày | 5,1k | 0,7× | 1/4 | Chưa đủ mẫu |
| Phân tích một mã cổ phiếu | 75s–80s | 3 · ít mẫu | 4,7k | 0,8× | 0/3 | Chưa đủ mẫu |
| Phân tích một mã cổ phiếu | >80s | 4 · ít mẫu | 22k | 4,0× | 1/4 | Chưa đủ mẫu |
| Thị trường & vĩ mô | ≤70s | 1 · ít mẫu | 1,8k | 0,4× | 0/1 | Chưa đủ mẫu |
| Thị trường & vĩ mô | 70s–85s | 2 · ít mẫu | 2,2k | 0,4× | 0/2 | Chưa đủ mẫu |
| Thị trường & vĩ mô | >85s | 1 · ít mẫu | 1,9k | 0,4× | 0/1 | Chưa đủ mẫu |

**Tương tác theo từng loại (trung vị tỷ lệ trên view)**

| Loại | Like/view | Bình luận/view | Chia sẻ/view | Lưu/view |
|---|---|---|---|---|
| Kiến thức / mẹo đầu tư | 5,1% (n=3) | 0,0% (n=3) | 0,6% (n=3) | 1,1% (n=3) |
| Phân tích một mã cổ phiếu | 1,7% (n=11) | 0,1% (n=11) | 0,1% (n=11) | 0,2% (n=11) |
| Thị trường & vĩ mô | 1,6% (n=4) | 0,1% (n=4) | 0,2% (n=4) | 0,2% (n=4) |

**Cặp video để xem đối chứng thủ công**

| Loại | Video cao / ID | Video thấp / ID | Tỷ lệ view | Cách ngày |
|---|---|---|---|---|
| Phân tích một mã cổ phiếu | Liệu còn chuyến tàu thứ 2 cho VSC? #creatorsearchinsights #cổphiếu #cafechung  [7703123815131368724] | #creatorsearchinsights #cổphiếu #cafechung #fpt  [7698293889710542086] | 7.9× | 13.0 |
| Kiến thức / mẹo đầu tư | Các bạn đánh giá sao về mẹo này #creatorsearchinsights #cổphiếu #cafechung  [7701680816157445396] | Kiếm tiền từ cổ phiếu như thế nào? #creatorsearchinsights #cổphiếu #cafechung  [7706090045530246452] | 5.7× | 11.9 |
| Phân tích một mã cổ phiếu | Gánh cả Vn-index có khác #creatorsearchinsights #cổphiếu #cafechung  [7700928215514205441] | Ai bắt đáy PNJ chắc khóc thét #pnj #cafechung #chungkhoan  [7697877464361536789] | 5.2× | 8.2 |

Cặp đối chứng: cùng loại, cách tối đa 30 ngày, độ dài chênh tối đa 15% (ít nhất 10 giây), view chênh ít nhất 2 lần, cả hai bài đã đủ 7 ngày tuổi; mỗi loại tối đa 2 cặp, không lặp video, ưu tiên chênh view lớn. Chỉ dùng để xem thủ công, chưa chứng minh nguyên nhân.

| Loại hình | Số video | View trung vị |
|---|---|---|
| Kiến thức / mẹo đầu tư | 3 | 13k |
| Phân tích một mã cổ phiếu | 11 | 8,1k |
| Thị trường & vĩ mô | 4 | 1,9k |

| Tháng | Số video | View trung vị |
|---|---|---|
| 2026-10 | 12 | 6,4k |
| 2026-11 | 6 | 3,2k |
