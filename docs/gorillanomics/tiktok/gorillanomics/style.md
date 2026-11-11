### Hình ảnh
- **Chất liệu:** sticker pixel-art trên **nền trắng trơn**, không có bối cảnh, không camera và không chuyển cảnh. Mỗi hình là 1–3 sticker đặt giữa khung: con gorilla chính, các vai phụ được phân biệt bằng **trang phục hoặc đạo cụ** (Big Boss mặc vest đỏ cà vạt, mũ phớt và xì gà khi là trùm mafia; gorilla công nhân đội mũ xanh "M"; government gorilla; auditor).
- **Đổi hình theo từ khoá:** khoảng **0,75–0,95 giây** đổi một lần, gần như mỗi danh từ hoặc động từ chính có một sticker mới (car → nơ đỏ, crash → xe đâm tường, cliff → xe rơi vực, blow → xe cháy đen). `cuts` ≈ 0–2 nhưng `changes` 29–67 đúng kiểu sticker đổi trên nền tĩnh. Cảnh nối tiếp nhau bằng **cắt cứng**, không có hiệu ứng.
- **Ẩn dụ:** tiền = **chuối** ("100 banana", "dirty banana", "clean bananas"). Khái niệm tài chính được dịch thành một câu chuyện nhân quả nhỏ giữa vài con gorilla.

### Chữ và phụ đề
- Mở đầu bằng thẻ **"what is…" + tên khái niệm in hoa, viền đen** (TAX EVASION, INSURANCE, MONEY LAUNDERING). Đây đồng thời là khung bìa.
- Phụ đề **1–2 từ mỗi lần**, chữ trắng viền đen đặt ngay dưới sticker (giữa màn hình, không phải ở đáy). Chữ hiện đúng theo từ đang nói.

### Lời và nhịp kể
- **Câu móc:** luôn là câu hỏi định nghĩa, ví dụ "What is tax evasion?", "What is insurance?", "What is money laundering?". Ngay sau đó là nhân vật: "Gorilla work 9 to 5", "Gorilla get new car".
- **Giọng văn "caveman English":** bỏ mạo từ, chia động từ sai có chủ ý ("Gorilla very happy", "he say", "police sus"), deadpan. Chính kiểu ngôn ngữ này tạo ra cái hài, và làm khái niệm khó trở nên dễ nghe.
- **Cấu trúc:** định nghĩa bằng câu hỏi → nhân vật có nhu cầu → vấn đề → cơ chế (con số chuối cụ thể: 5 chuối/tháng so với 500 chuối) → twist hoặc hậu quả (bị IRS bắt, đi tù) → câu chốt ("Two things certain in life. Death and taxes. So now you know.").
- **Tốc độ đọc:** khoảng 190–215 từ/phút, lời phủ **100%** thời lượng, không có khoảng nghỉ. Độ to khoảng −19 LUFS.

### Áp dụng cho DSC
- Khớp trực tiếp format **`shorts-sticker`** (skill `dsc-shorts`, `scripts/build-sticker.mjs`): `beats[]` gắn với từ khoá, `fx: pop`, chung `cast.dir`. Có thể làm ngay.
- **Giữ:** nền trắng, sticker đổi khoảng 1 giây/lần theo từ khoá, phụ đề 1–2 từ dưới sticker, cắt cứng, vai phụ phân biệt bằng mũ/đạo cụ, câu mở "… là gì?", ẩn dụ tiền = chuối, kết bằng một câu chốt ngắn.
- **Thay khi sang tiếng Việt:** "caveman English" không dịch thẳng được. Cần một giọng tương đương như câu cụt, xưng "Vượn", bỏ hư từ ("Vượn đi làm. Sếp trả 100 chuối. Vượn vui."). Tiếng Việt đọc theo âm tiết nên nhịp sticker tính theo khoảng 4–5 âm tiết/hình.
