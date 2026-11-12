### Hình ảnh
- **Một khuôn duy nhất cho mọi video:** biểu đồ đường "chạy theo thời gian" trên nền xám nhạt, khung dọc 9:16 có hai dải đen trên/dưới. Đã xem grid của Vinamilk (1,5 tr), Petrolimex (385k) và Vàng 2010 (163k): cùng bố cục, chỉ đổi màu đường và icon.
- Hai đường so sánh: **"Tổng vốn bỏ ra" / "Số tiền đã đầu tư" / "Gửi tiết kiệm (giả định 7%/năm)"** màu đen, đối với **tài sản được chọn** (xanh cho cổ phiếu, vàng cho vàng, trắng cho PLX). Đầu mỗi đường có icon (túi tiền, logo công ty, thỏi vàng) kèm **con số triệu đồng nhảy liên tục**.
- Trục thời gian tự giãn: lúc đầu chỉ có vài tháng, càng chạy càng thu nhỏ để chứa cả giai đoạn 10–15 năm. Ngay dưới biểu đồ là **bộ đếm tháng/năm cỡ lớn** (01-2010 → 07-2025), nhảy khoảng 2 tháng mỗi 0,5 giây.
- Không có người thật, không cắt cảnh, không chèn footage. Logo kênh nhỏ ở dải đen dưới. `cuts` = 0, còn `medianBeat` 1,4–16 giây chỉ đo được lúc trục co hoặc đường nhảy vọt; về thực chất video là **một cảnh liên tục 60 giây**.

### Chữ và phụ đề
- Tiêu đề cố định ở dải đen trên, 2 dòng chữ trắng đậm viền đen, **tên tài sản tô màu** ("Nếu bạn đầu tư 5 triệu mỗi tháng vào cổ phiếu **Vinamilk** từ năm 2010"). Câu này trùng tiêu đề video và đứng yên suốt video.
- Không có phụ đề, không có thẻ kết luận. Ghi chú "ĐVT: Triệu đồng" và chú thích hai đường ở góc trên.
- Khung đầu (hook.jpg) đã là câu hỏi + biểu đồ ở mốc 0 nên người lướt thấy ngay đề bài; đáp án chỉ lộ ra khi xem tới cuối.

### Lời và nhịp kể
- **Không có giọng đọc.** Whisper chỉ nghe ra lời nhạc tiếng Anh ("Lose Control", "Money Talks"…); câu "Hãy subscribe cho kênh Ghiền Mì Gõ" trong video Vàng là ảo giác của whisper trên đoạn chỉ có nhạc, không phải lời trong video. Kênh dùng nhạc trend, chỉ 20% video dùng âm thanh gốc.
- Cấu trúc kịch bản nằm hết trong dữ liệu: **đề bài (số tiền, mã, năm bắt đầu) → đồng hồ chạy → khoảng cách giữa hai đường mở rộng hoặc đảo chiều → con số cuối**. Sức hút đến từ việc chờ xem đường tài sản có vượt hay rơi dưới đường vốn không (PLX lên 770 rồi về quanh 500, Vinamilk lên 2.000 rồi đi ngang 1.500).
- Nhiều tiêu đề mở bằng "Trả lời @…": kênh nhận **mã cổ phiếu khán giả đặt** trong bình luận rồi làm video, và cuối caption kêu gọi "muốn mình làm mã nào thì comment".
- Độ dài gần như cố định 60–62 giây (trung vị 62 giây), tức kênh kéo trục thời gian cho vừa giới hạn này chứ không theo độ dài câu chuyện.

### Áp dụng cho DSC
- Khớp với format **`dataviz`** (`video-producer`, `visual.type: line` + `counter`): đường so sánh hai kịch bản, bộ đếm ngày lớn, số liệu nhảy ở đầu đường. Có thể dựng ngay từ CSV giá điều chỉnh.
- **Giữ:** đề bài cụ thể trong 1 câu (số tiền + mã + năm), hai đường đối chứng (cổ phiếu và tiết kiệm/vàng), không lộ kết quả trước, nhận mã từ bình luận.
- **Thay hoặc thêm:** ghi nguồn giá và cách tính (có tính cổ tức, chia tách không; lãi tiết kiệm giả định bao nhiêu) ở góc màn hình, vì đối thủ không ghi; thêm 1 thẻ kết luận 3 giây cuối (lãi bao nhiêu %, so với tiết kiệm) để người xem có thứ để lưu/chia sẻ; cân nhắc giọng đọc ngắn ở 3 giây đầu để thử so với bản chỉ có nhạc.
