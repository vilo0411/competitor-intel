# Kinh Tế Đơn Giản — phân tích đối thủ

Cập nhật 2026-11-11 · TikTok: @kinhtedongian.official. Biểu đồ xem trong `kinh-te-don-gian.html`.

## Nhận định

### Bối cảnh: đây là một kênh vừa đổi format
- Từ 23/05 đến 08/2026, kênh gần như chỉ **đăng lại clip phát biểu của lãnh đạo và tin nhanh** (15–90 giây). Trung vị chỉ 740–1.300 view mỗi tháng, dù có tháng đăng tới 129 video.
- Từ **15/10/2026** kênh chuyển hẳn sang **video giải thích kinh tế dài 3–10 phút, dựng đồ hoạ phẳng có giọng đọc**. Đến 11/11 đã có 76 video loại này (khoảng 19 video/tuần). Toàn bộ 9 video top của kênh đều thuộc đợt này.
- Báo cáo chỉ lấy 300 video gần nhất (hồ sơ có 914 video, 262k follower). Phần lớn follower có thể đến từ giai đoạn trước, nằm ngoài dữ liệu.

### Công thức thắng
- Video top đều là **"giải mã nghịch lý quen mắt"**: một thứ ai cũng thấy ngoài đường nhưng không giải thích được. Ví dụ: Nón Sơn luôn vắng khách nhưng vẫn mở trăm chi nhánh (**1,2 tr view**), tiệm kính vắng khách vẫn sống khỏe (**713k**), có 1.000 tỷ tiền mặt thì làm gì (**469k**), con sóng làm giàu tiếp theo (**388k**), giám đốc mua xe 5 tỷ đứng tên công ty (**331k**).
- Mẫu tiêu đề: **"[Thứ quen thuộc] + [nghịch lý] + ?"**, như "TIỆM KÍNH VẮNG KHÁCH VẪN SỐNG KHỎE", "Tại sao… luôn… chứ không bao giờ…?", "NẾU MỘT NGÀY BẠN CÓ…?". Tiêu đề in hoa và ngắn.
- Vì sao thắng (dựa vào khung hình và lời thoại): mở bằng một nghịch lý cụ thể → "Khoan…" → hứa có cú lật ở cuối → bóc tách bằng số liệu → kết bằng câu hỏi để kéo bình luận. Video top có lượt **lưu và chia sẻ rất cao**: Nón Sơn có 7,8k lưu và 18,7k chia sẻ, tương tác 11%. Tỷ lệ tương tác trung vị của nhóm video giải thích là 4,1%, so với 2,8% ở clip tin.

### Loại hình nào thắng
- **Khái niệm tài chính** (thuế, nợ, chu kỳ tài sản) có trung vị cao nhất: **4,9k** view (18 video).
- **Giải mã mô hình kinh doanh** (tiệm vắng khách, "vua của mọi nghề", "1 vốn 10 lời", nhượng quyền) có trung vị **2,3k** (46 video). Nhóm này mang về nhiều view nhất, khoảng 2,7 tr trong tổng 5,6 tr.
- **Tội phạm & mặt tối tài chính** (bẫy đất, vi bằng, rửa tiền) có trung vị **2,2k** (17 video).
- **Tin thời sự / chính trị** chỉ đạt **910** (219 video). Nhóm này chiếm 73% số video nhưng chỉ khoảng 18% tổng view.
- Lưu ý: 3 nhóm giải thích đều chỉ có trong giai đoạn sau 15/10, còn tin thời sự gần như thuộc trọn giai đoạn trước. Vì vậy **chưa tách được** phần chênh lệch nào do chủ đề, phần nào do format dài, đồ hoạ và giọng đọc.

### Nhịp đăng và độ "bền"
- Tuần đầu ra format mới (15–21/10) có 22 video, trung vị **47,9k**. Sang các tuần sau, trung vị **rơi về 2,2k → 1,8k → 1,4k** dù vẫn đăng 16–27 video/tuần.
- Như vậy cú nổ ban đầu không giữ được. Có thể do hiệu ứng mới lạ, do đăng quá dày (nhiều chủ đề "tiệm X vắng khách" lặp lại), hoặc do video mới chưa kịp tích view. Hiện chưa đủ dữ liệu để phân biệt; cần theo dõi thêm qua `history/` hằng tuần.
- Kênh vẫn đang hoạt động (video cuối là hôm nay). Giờ đăng rải từ 9h đến 0h. Với video giải thích, khung sáng (5–11h, 12 video) và tối (18–24h, 26 video) có trung vị khoảng 3,8–3,9k, cao hơn khung trưa và chiều (2,0–2,2k). Đây là tín hiệu yếu.

### Độ dài
- Chỉ xét video giải thích: dài **4–6 phút** có trung vị cao nhất, **9,5k** (21 video). Trên 6 phút đạt 5,0k (17 video), 3–4 phút 2,2k (24 video), dưới 3 phút 1,7k (19 video). Mẫu mỗi nhóm khoảng 20 video và các video top đều rơi vào tuần đầu, nên đây chỉ là tín hiệu vừa phải.
- Video dài không bị phạt view: video top dài 7,7 phút và cả 5 video top đều dài 4–10 phút.

### Áp dụng cho DSC
1. **Làm loạt "Giải mã nghịch lý quen mắt"** dạng dọc 4–6 phút bằng `series` 9x16 (`dsc-toon`), có host cố định và khung minh hoạ 16:9 ở giữa. Mỗi tập nên cắt thêm một bản `shorts-kinetic` 45–60 giây làm mồi. Các chủ đề còn trống: vì sao app vay tiêu dùng lãi cao vẫn đông khách, vì sao tiệm vàng không sợ giá vàng giảm, vì sao chuỗi cà phê lỗ vẫn mở thêm.
2. **Ưu tiên nhóm khái niệm tài chính có góc thuế/pháp lý** (kiểu "xe 5 tỷ đứng tên công ty"). Đây là nhóm có trung vị cao nhất ở đối thủ và cũng là thế mạnh chuyên môn của DSC. Mọi con số nên ghi nguồn trên màn hình để khác biệt với đối thủ, vốn hay dùng số ước tính không trích nguồn.
3. **Không đăng dồn dập**: đối thủ đăng khoảng 19 video/tuần và view rơi nhanh sau tuần đầu. DSC nên đăng 2–3 video dài mỗi tuần, chọn chủ đề thật khác nhau, thay vì lặp mẫu "tiệm X vắng khách".
4. **Học nhịp kịch bản nhưng tăng nhịp hình**: giữ cấu trúc nghịch lý → "Khoan…" → hứa cú lật ở cuối → câu hỏi kéo bình luận, và xin lưu video sớm. Nhưng nên đổi hình khoảng 1–1,5 giây/lần thay vì khoảng 3 giây như đối thủ.

## TikTok

### @kinhtedongian.official

- 262k follower · 300 video phân tích (2026-05-23 → 2026-11-11) · tổng 5,6 tr view
- View trung vị 1k, trung bình 19k, cao nhất 1,2 tr · tương tác trung vị 3,2%
- 12,2 video/tuần · 86 video trong 30 ngày qua · độ dài trung vị 58.5s · 80,7% dùng âm thanh gốc

**Điểm chính**

- **Khái niệm tài chính** thắng: trung vị 5k view/video, gấp 5,4× nhóm thấp nhất (Tin thời sự / chính trị)
- **Tin thời sự / chính trị** chiếm 73,0% số video nhưng chỉ mang về 17,8% tổng view
- Top 3 video chiếm **42,6%** tổng view: kênh sống nhờ vài cú viral, video thường chỉ quanh 1k
- View trung vị **tăng**: 831 ở 3 tháng đầu → 3k ở 3 tháng gần nhất
- Đăng 12,2 video/tuần; tháng dày nhất T6/26 có 129 video; 30 ngày qua: 86 video
- Đăng **sáng (5–11h)** (giờ VN) có view trung vị cao nhất: 2k; thứ tốt nhất là T6 (1k)
- Độ dài **>90s** có view trung vị cao nhất: 2k (103 video)
- Hashtag đi kèm view cao hơn trung vị kênh: **#tintuc24h**, **#tintuc**, **#kinhtegithe**

| # | Video | View | Tương tác | Giây | Ngày | Loại |
|---|---|---|---|---|---|---|
| 1 | [ĐẶC VỤ NON SON #nonson #kinhtedongian #kinhtegithe #tintuc](https://www.tiktok.com/@kinhtedongian.official/video/7697093977106926868) | 1,2 tr | 11,1% | 462 | 2026-10-16 | Giải mã mô hình kinh doanh |
| 2 | [TIỆM KÍNH VẮNG KHÁCH VẪN SỐNG KHỎE  #kinhtedongian #kinhtegi](https://www.tiktok.com/@kinhtedongian.official/video/7697963191405432084) | 713k | 6,6% | 355 | 2026-10-18 | Giải mã mô hình kinh doanh |
| 3 | [NẾU MỘT NGÀY BẠN CÓ 1000 TỶ TIỀN MẶT TRÊN TRỜI RƠI XUỐNG ? #](https://www.tiktok.com/@kinhtedongian.official/video/7698381666473315604) | 469k | 8,7% | 586 | 2026-10-19 | Tội phạm & mặt tối tài chính |
| 4 | [CƠN SÓNG LÀM GIÀU TIẾP THEO MỌI NGƯỜI NGHỈ LÀ GÌ AD ĐI LÀM T](https://www.tiktok.com/@kinhtedongian.official/video/7699120393377828116) | 388k | 8,5% | 339 | 2026-10-21 | Khái niệm tài chính |
| 5 | [Tại sao các Giám đốc mua xe sang 5 tỷ luôn đứng tên Công ty ](https://www.tiktok.com/@kinhtedongian.official/video/7702123229443280148) | 331k | 4,5% | 245 | 2026-10-29 | Khái niệm tài chính |
| 6 | [Chuỗi nhà thuốc quá quen với mọi gia đình #kinhtedongian #ki](https://www.tiktok.com/@kinhtedongian.official/video/7697594989961809172) | 213k | 5,4% | 278 | 2026-10-17 | Giải mã mô hình kinh doanh |
| 7 | [tại sao nhiều quán vắng khai doanh thu 10 tỷ ? #kinhtedongia](https://www.tiktok.com/@kinhtedongian.official/video/7702387339212999937) | 183k | 3,8% | 184 | 2026-10-30 | Tội phạm & mặt tối tài chính |
| 8 | [Tiền bẩn từ cb được rửa như thế nào ? #kinhtedongian #kinhte](https://www.tiktok.com/@kinhtedongian.official/video/7698328391631654165) | 153k | 7,2% | 544 | 2026-10-19 | Tội phạm & mặt tối tài chính |
| 9 | [BUÔN VE CHAI ĐỒNG NÁT VUA CỦA MỌI NGHỀ #kinhtedongian #kinht](https://www.tiktok.com/@kinhtedongian.official/video/7699863674399247636) | 152k | 8,2% | 267 | 2026-10-23 | Giải mã mô hình kinh doanh |
| 10 | [Đại tá Phạm Thanh Tùng - Phó Giám đốc Công an tỉnh Vĩnh Long](https://www.tiktok.com/@kinhtedongian.official/video/7654930194410523924) | 130k | 0,7% | 59 | 2026-06-24 | Tin thời sự / chính trị |

**Phong cách dựng (video top)**

Đã xem khung hình (grid + hook) và lời thoại (`audio/audio_raw.txt`) của 5 video top: Đặc vụ Nón Sơn (1,2 tr), Tiệm kính vắng khách (713k), 1.000 tỷ rơi xuống (469k), Cơn sóng làm giàu (388k), Giám đốc mua xe 5 tỷ (331k). Cả 5 là video dọc **dài 4–10 phút**, khác hẳn dạng clip tin 15–60 giây kênh đăng trước tháng 10/2026.

> Ghi chú số đo: `style.json` bị trống `transcript`/`wpm` (lỗi bước hậu xử lý), nhưng whisper vẫn ra lời đầy đủ trong `audio/audio_raw.txt`. Tốc độ đọc dưới đây tính tay từ file đó.

### Hình ảnh
- **Hai bộ khung hình, cùng một hệ thống đồ hoạ phẳng, không có người thật hay footage:**
  - *Kiểu "hồ sơ bí ẩn"* (Nón Sơn, Tiệm kính, 1.000 tỷ): nền giấy nhám **xám đen hoặc xám sáng**, hoặc nền lưới xanh lá kiểu bản vẽ kỹ thuật. Ở giữa là icon phẳng viền đen (mặt tiền cửa hàng Nón Sơn, đôi mắt kính, túi tiền, còng tay, người que), ghép thành thẻ so sánh như "KIẾM TIỀN BẨN – đã khó" và "TIÊU NGOÀI ÁNH SÁNG – khó gấp chục lần".
  - *Kiểu "mascot + bảng minh hoạ"* (Cơn sóng làm giàu, Xe 5 tỷ): nền lưới tối, giữa màn hình là một **khung 16:9 bo góc** chứa hình minh hoạ (thành phố + xe sang, các "ngọn núi" 7X đất / 9X chứng khoán / 2K coin / "?"). Xen kẽ là nhân vật mascot cố định: anh chàng đeo kính, ngồi sau laptop có logo "KINH TẾ ĐƠN GIẢN", cạnh cốc mì. Mascot liên tục đổi biểu cảm (giơ tay, dấu "?", "!!"). Cảnh mở đầu đặt mascot trong phòng trọ, có bong bóng thoại "Mẹo thuế của giám đốc – XE 5 TỶ".
- **Nhịp đổi hình chậm và dồn dần**: `medianBeat` 1,6–3,6 giây (Xe 5 tỷ nhanh nhất 1,6 giây; Nón Sơn 2,8 giây; 1.000 tỷ 3,6 giây), chỉ khoảng 12–26 beat/phút. Trên grid, một cảnh thường giữ nguyên 10–20 giây rồi mới **thêm dần từng lớp** (nhãn → icon → dòng chữ → số lớn). Đó là kiểu "xây bảng" chứ không phải thay hình. Ví dụ ở Nón Sơn: hơn 5 giây đầu chỉ có nền tối và nhãn "TRUYỀN THUYẾT ĐÔ THỊ", sau đó mới hiện "Cửa hàng Nón Sơn thực chất là" rồi đến "trạm liên lạc điệp viên ngầm?".
- **Chuyển cảnh**: phần lớn là cắt thẳng (`cut` 27–98 beat mỗi video). Phần còn lại là **trượt ngang** (slide-left/right 16–32 beat), cùng một ít fade và drop. Chuyển cảnh lớn thường đi kèm đổi nền (tối ↔ xám sáng ↔ lưới) để báo sang "chương" mới.
- Watermark chữ "KINHTEDONGIAN" mờ, cố định giữa khung.

### Chữ và phụ đề
- Mỗi chương có **nhãn tiêu đề** in hoa giãn chữ, kèm một vạch đỏ bên trái: "| TRUYỀN THUYẾT ĐÔ THỊ", "| GIẢI MÃ TIỆM MẮT KÍNH", "| NGHỊCH LÝ LỚN NHẤT CỦA TỘI PHẠM TÀI CHÍNH".
- Chữ không chạy theo kiểu karaoke mà là **câu khoá ngắn hiện thành khối ở giữa màn hình**, giữ nguyên trong lúc giọng đọc đi tiếp (dải `caption` đổi chậm, 4–84 giây/lần). Từ khoá được tô màu: tên thương hiệu màu đỏ, kết luận màu vàng cam hoặc xanh chanh, và các **nhãn viên thuốc** vàng/hồng ("vị trí đắc địa", "vắng khách quanh năm").
- **Số liệu chữ lớn kiểu condensed**: "2012", "10–15 lượt", "30 KHÁCH" (đỏ), "3–5 TỶ" (tem đỏ).
- Ở kiểu mascot, chữ là **một dòng dưới khung minh hoạ** có chấm xanh đầu dòng, chạy theo cụm 5–10 từ của lời đọc.

### Lời và nhịp kể
- **Câu móc mở đầu** luôn là một nghịch lý gắn với thứ người xem thấy hằng ngày:
  - "Có một truyền thuyết đô thị mà bất kỳ ai sống ở Việt Nam cũng từng một lần thắc mắc… phải chăng các cửa hàng Nón Sơn thực chất là trạm liên lạc của một tổ chức điệp viên ngầm?"
  - "Giải mã bí ẩn các cửa hàng mắt kính ở vị trí đắc địa, vắng khách quanh năm sao vẫn sống khỏe hàng thập kỷ."
  - "Giả sử sáng mai thức dậy… bạn thấy trước mặt mình là một núi tiền mặt trị giá đúng 1.000 tỷ đồng."
  - "7x giàu nhờ đất, 9x giàu nhờ chứng khoán, 2k giàu nhờ coin. Vậy con sóng đổi đời tiếp theo nằm ở đâu?"
- **Cấu trúc kịch bản lặp lại**: nghịch lý → mô tả cảnh quen thuộc ("Anh em cứ để ý mà xem…") → câu bẻ lái **"Khoan…"** ("Khoan, gọi cho cục tình báo vội.") → **hứa hẹn có "cú lật kèo" ở cuối** và xin theo dõi, lưu video, "xem hết tới giây cuối cùng" ngay trong khoảng 30 giây đầu → bóc tách bằng số (giá thuê mặt bằng, số khách, biên lợi nhuận, thuế suất) → câu chốt mang tính bài học → **câu hỏi mở để kéo bình luận** ("Anh em đi cắt kính cận thường tốn bao nhiêu tiền…?").
- Giọng văn xưng **"anh em"**, đời thường, nhiều hình ảnh ("cỗ máy in tiền êm ái", "hai cỗ máy in tiền ngầm"). Lời kể dài 975–2.226 từ mỗi video.
- **Tốc độ đọc khoảng 220–240 từ/phút** (khoảng 3,7–4 âm tiết/giây), nhanh và đều. Độ to khoảng −18 LUFS, gần như không có khoảng lặng dài.
- Hình **minh hoạ đúng câu đang đọc**, nhưng beat chỉ rơi vào đầu câu hoặc đầu ý, không rơi theo từng từ khoá. 3 giây đầu chỉ có 1–4 beat.
- Một số video cuối còn **chào bán gói hội viên 70.000đ/tháng** ("không lạm dụng AI").

### Áp dụng cho DSC
- **Kiểu "mascot + bảng minh hoạ"** khớp với format `series` dọc 9x16 (skill `dsc-toon`). Có thể dựng một host cố định ngồi bàn, khung 16:9 bo góc nằm giữa màn hình dọc, và preset biểu đồ (núi, cột, so sánh A/B).
- **Kiểu "hồ sơ bí ẩn"** khớp với `faceless` 9x16 (`video-producer`): nền giấy, icon phẳng, `statement` + `compare`. Nếu chỉ cần bản ngắn 45–60 giây cắt từ video dài thì dùng `shorts-kinetic` (`hook_2tier`, `big_counter`, `ab_compare`).
- **Giữ**: mở bằng nghịch lý từ cảnh quen thuộc, câu "Khoan…", hứa có cú lật ở cuối, xin lưu video sớm, kết bằng câu hỏi để kéo bình luận.
- **Thay**: DSC nên tăng nhịp hình (khoảng 1–1,5 giây/beat thay vì 3 giây), vì phần lớn thời lượng của đối thủ là màn hình gần như tĩnh. Số liệu nên ghi nguồn trên màn hình, vì đối thủ đưa nhiều con số ước tính (biên lợi nhuận, số khách) mà không trích nguồn.

| Video | View | Đổi hình | 3s đầu | Phụ đề | Từ/phút | 3 giây đầu nói |
|---|---|---|---|---|---|---|
| [ĐẶC VỤ NON SON #nonson #kinhtedongian #k](https://www.tiktok.com/@kinhtedongian.official/video/7697093977106926868) | 1,2 tr | 2,8s/beat | 1 | 30,0s/cụm | 0 |  |
| [TIỆM KÍNH VẮNG KHÁCH VẪN SỐNG KHỎE  #kin](https://www.tiktok.com/@kinhtedongian.official/video/7697963191405432084) | 713k | 3,6s/beat | 1 | 10,1s/cụm | 0 |  |
| [NẾU MỘT NGÀY BẠN CÓ 1000 TỶ TIỀN MẶT TRÊ](https://www.tiktok.com/@kinhtedongian.official/video/7698381666473315604) | 469k | 3,6s/beat | 2 | 17,3s/cụm | 0 |  |
| [CƠN SÓNG LÀM GIÀU TIẾP THEO MỌI NGƯỜI NG](https://www.tiktok.com/@kinhtedongian.official/video/7699120393377828116) | 388k | 2,7s/beat | 3 | 84,1s/cụm | 0 |  |
| [Tại sao các Giám đốc mua xe sang 5 tỷ lu](https://www.tiktok.com/@kinhtedongian.official/video/7702123229443280148) | 331k | 1,6s/beat | 4 | 4,4s/cụm | 0 |  |

| Loại hình | Số video | View trung vị |
|---|---|---|
| Khái niệm tài chính | 18 | 5k |
| Giải mã mô hình kinh doanh | 46 | 2k |
| Tội phạm & mặt tối tài chính | 17 | 2k |
| Tin thời sự / chính trị | 219 | 910 |

| Tháng | Số video | View trung vị |
|---|---|---|
| 2026-05 | 42 | 715 |
| 2026-06 | 129 | 880 |
| 2026-07 | 17 | 782 |
| 2026-08 | 21 | 1k |
| 2026-09 | 2 | 7k |
| 2026-10 | 64 | 4k |
| 2026-11 | 25 | 2k |
