# Đọc bằng chứng trước khi đề xuất

Script xuất cùng bộ kiểm tra vào HTML, Markdown và `summary.json` → `tiktok[].evidence`. Code ở `scripts/evidence.mjs`, test ở `scripts/evidence.test.mjs`.

## Ba khái niệm dùng xuyên suốt

- **So với bài cùng thời (`relMedian`, `aboveLocal`)**: view của bài chia cho trung vị các bài *khác* đăng trong ±7 ngày (nới ±14, ±30 ngày nếu chưa đủ 5 bài). 1× là ngang bài cùng thời. Số này loại được việc một nhóm "thắng" chỉ vì rơi vào tuần kênh đang viral, nhưng vẫn là tương quan.
- **Hit (`hits`, `hitRate`, `hitThreshold`)**: bài đạt từ 10× trung vị kênh. View phân bố lệch nặng (đa số bài nằm ở sàn, vài bài gấp trăm lần), nên luôn đọc trung vị **cùng với** tỷ lệ hit; hai số có thể cho hai nhóm dẫn đầu khác nhau.
- **Bài non (`young`, `youngCount`)**: bài dưới 7 ngày tuổi lúc thu thập, view còn đang tích. Bảng ghi rõ số bài non của từng ô. Không kết luận "view rơi" từ một kỳ mà phần lớn là bài non.

## Các bảng

- `categories`: n, trung vị, P25–P75, hit, so với bài cùng thời. P25–P75 là khoảng phân vị, không phải khoảng tin cậy. Luôn báo độ phủ nhãn.
- `timeline`: n, trung vị và số hit theo kỳ (mọi bài). Dùng để trả lời "hit còn tiếp tục không", thay cho việc nhìn trung vị từng tháng.
- `periodUnit`: script tự chọn tuần / tháng / quý, lấy mức mịn nhất mà ít nhất nửa số bài nằm trong kỳ có từ 8 bài. Kênh đăng hằng ngày được so theo tuần; kênh đăng thưa so theo quý.
- `sensitivity`: bỏ 0/1/3 video có view lớn nhất **toàn kênh** rồi tính lại. Nhóm dưới 5 bài không được chọn dẫn đầu; có thể đồng hạng. Thứ hạng đổi sau khi bỏ top thì giảm độ chắc chắn.
- `periods`: so chủ đề trong cùng kỳ, chỉ liệt kê kỳ có từ 2 loại. Chỉ đối chiếu các ô có ít nhất 5 bài.
- `durationStrata`: trong từng loại, chia độ dài theo phân vị 1/3 và 2/3 **của chính loại đó** (kênh video dài không còn bị dồn hết vào ">60s"). Đọc cột "so với bài cùng thời" và hit, không chỉ trung vị thô. Chỉ so được khi có ít nhất hai mức đủ 5 bài; thiếu thì viết "chưa xác định ảnh hưởng độ dài".
- `interactions`: trung vị like, bình luận, chia sẻ, lưu trên view, kèm n hợp lệ. Thiếu là —. Không xem bình luận nhiều là phản hồi tích cực, hay lưu nhiều là chuyển đổi. Cache cũ đã thay thiếu bằng 0 không phục hồi được.
- `pairs`: mỗi loại tối đa 2 cặp, cùng loại, cách ≤30 ngày, độ dài chênh ≤15% (ít nhất 10 giây), view chênh ≥2 lần, cả hai bài đã đủ 7 ngày tuổi, không lặp video. Ưu tiên chênh view lớn nên có thiên lệch chọn; chỉ dùng tìm giả thuyết để xem thủ công. Chưa xem ảnh/lời của cả hai bài thì không kết luận khác biệt phong cách. `--style N` hiện chỉ lấy top N, chưa tự lấy bài thấp của cặp.

## Kênh đổi format (`era`, `scope`)

Script tìm ngày mà độ dài trung vị hai phía chênh từ 2,5 lần (mỗi phía ít nhất 20 bài). Khi có `era`:

- `timeBuckets`, `weekdays`, `durations`, `tags`, `scope.categories` và các biểu đồ so sánh nhóm **chỉ tính bài của format hiện tại**. `categories`, top video, dòng thời gian và phân bố view vẫn tính toàn bộ.
- Không so trung vị toàn kênh với trung vị format mới như thể cùng một kênh. Follower có thể đến từ format cũ.
- Ngày `era.start` là điểm cắt thống kê theo độ dài, có thể lệch vài ngày so với ngày đăng bài đầu của format mới. Xem bảng dữ liệu để nêu ngày chính xác.

## Biểu đồ so sánh nhóm và chữ "nổi trội"

Biểu đồ loại nội dung, giờ, thứ, độ dài vẽ dải P25–P75 và trung vị trên trục "gấp mấy lần bài cùng thời". Một nhóm chỉ được tô màu và gọi là "nổi trội" khi: đủ 5 bài, trung vị gấp từ 1,3 lần nhóm kế tiếp, **và** qua kiểm tra hoán vị (nhóm ngẫu nhiên cùng cỡ hiếm khi đạt mức đó; ngưỡng 5% chia cho số nhóm). Không có nhóm tô màu nghĩa là chưa đủ dữ liệu để nói nhóm nào hơn; viết đúng như vậy trong `insights.md`, không tự chọn nhóm có trung vị thô cao nhất. Nhóm "nổi trội" vẫn chỉ là tương quan.

## Phong cách và kịch bản

Ghi rõ số video thực sự đã xem và cách chọn. Chỉ xem top thì mô tả là "đặc điểm của mẫu top", chưa gọi là công thức thắng: cùng một khuôn kịch bản thường có ở cả bài sàn. Khi có đối chứng, so hook, mức quen thuộc của khái niệm, cấu trúc tình huống → cơ chế → hậu quả, độ rõ hình minh họa, nhịp và câu chốt. Dùng cùng tiêu chí cho bài tốt/trung bình/yếu; khi gắn nhãn kịch bản nên ẩn view. Giữ `labels.json` là map ID → nhóm chủ đề, không đổi schema để nhét nhãn kịch bản.

Beat có thể lẫn phụ đề đi theo sticker; đoạn transcript phủ 100% không chứng minh không có khoảng nghỉ. Không biến các số này thành thông số sản xuất tối ưu khi chưa thử nghiệm.

## Thử nghiệm và dữ liệu còn thiếu

Ưu tiên thử một yếu tố mỗi đợt: hook trước, rồi độ dài; ghép chủ đề tương đương và luân phiên điều kiện. Ghi trước chỉ số và thời điểm đo; dùng trung vị và tỷ lệ hit của nhiều bài, không lấy một bài viral làm kết luận. View 7 ngày và giữ chân chỉ dùng khi có dữ liệu kênh sở hữu ở cùng tuổi bài, không suy ra từ cache đối thủ.

Mỗi lần thật sự lấy lại danh sách video (lần đầu hoặc `--refresh`), script ghi `tiktok/<handle>/snapshots/<ngày>.json` gồm `fetchedAt` và view từng video. Khi đã có từ hai snapshot, có thể so view ở cùng tuổi bài; trước đó chưa tính tăng trưởng từng bài. `history/` chỉ lưu summary, và ngày dựng offline không phải ngày lấy dữ liệu mới. Không lấy tổng view chia tuổi bài làm tốc độ tăng trưởng.

Chỉ có thể nói "chưa ghi nhận bài mới trong dữ liệu thu thập", không khẳng định kênh đã ngừng hoạt động. Không ghi số liệu nội bộ DSC vào repo public.
