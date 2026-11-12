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
