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
