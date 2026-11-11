### Hình ảnh
- **Chất liệu:** sticker pixel-art trên **nền trắng trơn**, không có bối cảnh, không camera và không chuyển cảnh. Mỗi hình là 1–3 sticker đặt giữa khung: con gorilla chính, các vai phụ được phân biệt bằng **trang phục hoặc đạo cụ** (Big Boss mặc vest đỏ cà vạt, mũ phớt và xì gà khi là trùm mafia; gorilla công nhân đội mũ xanh "M"; government gorilla; auditor).
- **Đổi hình theo từ khoá:** đo được **0,5–0,6 giây có một lần đổi** (86–112 lần/phút, 4–5 lần trong 3 giây đầu). Con số này gồm cả đổi sticker lẫn đổi chữ: phụ đề nằm ngay dưới sticker nên công cụ chưa tách riêng được. Theo grid, sticker giữ khoảng 1 giây (1–2 từ), gần như mỗi danh từ hoặc động từ chính có một sticker mới (car → nơ đỏ, crash → xe đâm tường, cliff → xe rơi vực, blow → xe cháy đen). `cuts` ≈ 0–2, đúng kiểu sticker đổi trên nền tĩnh.
- **Kiểu vào hình (đo):** **cắt cứng chiếm khoảng 86–93%** số lần đổi. Chỉ vài lần có rơi xuống, trượt hoặc vẽ dần. Không có pop, zoom hay chuyển cảnh.
- **Ẩn dụ:** tiền = **chuối** ("100 banana", "dirty banana", "clean bananas"). Khái niệm tài chính được dịch thành một câu chuyện nhân quả nhỏ giữa vài con gorilla.

### Chữ và phụ đề
- Mở đầu bằng thẻ **"what is…" + tên khái niệm in hoa, viền đen** (TAX EVASION, INSURANCE, MONEY LAUNDERING). Đây đồng thời là khung bìa.
- Phụ đề **1–2 từ mỗi lần**, chữ trắng viền đen đặt ngay dưới sticker (giữa màn hình, không phải ở đáy). Vị trí phụ đề đi theo sticker. Chữ hiện đúng theo từ đang nói: các beat đầu rơi đúng từ khoá, ví dụ 0,33s "money", 1,13s "big", 1,87s "run".

### Lời và nhịp kể
- **Câu móc:** luôn là câu hỏi định nghĩa, ví dụ "What is tax evasion?", "What is insurance?", "What is money laundering?". Ngay sau đó là nhân vật: "Gorilla work 9 to 5", "Gorilla get new car".
- **Giọng văn "caveman English":** bỏ mạo từ, chia động từ sai có chủ ý ("Gorilla very happy", "he say", "police sus"), deadpan. Chính kiểu ngôn ngữ này tạo ra cái hài, và làm khái niệm khó trở nên dễ nghe.
- **Cấu trúc:** định nghĩa bằng câu hỏi → nhân vật có nhu cầu → vấn đề → cơ chế (con số chuối cụ thể: 5 chuối/tháng so với 500 chuối) → twist hoặc hậu quả (bị IRS bắt, đi tù) → câu chốt ("Two things certain in life. Death and taxes. So now you know.").
- **Tốc độ đọc:** khoảng 190–215 từ/phút, lời phủ **100%** thời lượng, không có khoảng nghỉ. Độ to khoảng −19 LUFS.

### Áp dụng cho DSC
- Khớp trực tiếp format **`shorts-sticker`** (skill `dsc-shorts`, `scripts/build-sticker.mjs`): `beats[]` gắn với từ khoá, để `fx` mặc định là cắt cứng (đối thủ gần như không dùng pop), chung `cast.dir`. Có thể làm ngay.
- **Giữ:** nền trắng, sticker đổi khoảng 1 giây/lần theo từ khoá và chữ đổi khoảng 0,5 giây, phụ đề 1–2 từ dưới sticker, cắt cứng, vai phụ phân biệt bằng mũ/đạo cụ, câu mở "… là gì?", ẩn dụ tiền = chuối, kết bằng một câu chốt ngắn.
- **Thay khi sang tiếng Việt:** "caveman English" không dịch thẳng được. Cần một giọng tương đương như câu cụt, xưng "Vượn", bỏ hư từ ("Vượn đi làm. Sếp trả 100 chuối. Vượn vui."). Tiếng Việt đọc theo âm tiết nên nhịp sticker tính theo khoảng 4–5 âm tiết/hình.
