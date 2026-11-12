# Gorillanomics — phân tích đối thủ

Cập nhật 2026-11-12 · TikTok: @gorillanomics. Biểu đồ xem trong `gorillanomics.html`.

## Nhận định

### Mẫu nội dung đáng thử
- 3 video lớn nhất đều là **"What is X?" kể bằng gorilla**: Tax Evasion (6,5 tr), Insurance (3,2 tr), Money Laundering (1,9 tr). Cả 3 đăng tháng 5–6/2025, dài 28–61 giây, sticker đổi khoảng 1 giây/lần, lời kể "caveman English" và tiền quy ra chuối. Ba video này mang về 45% tổng view của kênh.
- Đây là **đặc điểm của mẫu top** (chỉ xem khung hình và lời thoại của 3 video này). Cùng khuôn "Gorillas explain <Khái niệm>" cũng cho ra bài thấp hơn hàng chục lần trong cùng tháng: Tax Evasion 6,5 tr so với Bail 104k (cách 7 ngày, cùng 61 giây); Insurance 3,2 tr so với Buy Now Pay Later 145k. Khuôn kịch bản không phải yếu tố phân biệt; chưa xem các video thấp nên chưa biết khác ở đâu.
- Giả thuyết cần kiểm tra bằng các cặp trên: khái niệm càng quen tai và càng "cấm kỵ" (trốn thuế, rửa tiền) thì càng dễ lan.

### Loại hình nào thắng
- **Tội phạm & mặt tối tài chính** có trung vị 300k (11 video), bằng 2,1× các bài đăng cùng thời; vẫn dẫn đầu khi bỏ 1 và 3 video lớn nhất kênh, và trong quý 2/2025 đạt 659k so với 291k của Khái niệm tài chính (5 và 17 video). Với 11 video, chênh lệch này **chưa qua được kiểm tra ngẫu nhiên**, nên là tín hiệu vừa, chưa phải kết luận.
- **Tin thời sự / chính trị** có trung vị 56k (19 video) nhưng gần như chỉ đăng từ tháng 11/2025, lúc view cả kênh đã giảm. So với bài cùng thời nhóm này đạt 0,9×, tức ngang các bài khác cùng giai đoạn. Dữ liệu **không cho thấy tin thời sự kém hơn**; video "ICE explained" đạt 1,1 tr.

### Nhịp đăng
- Trung bình 1,1 video/tuần nhưng dồn vào đầu: quý 2/2025 có 23 video, trung vị 291k, 3 video từ 1,5 tr. Các quý sau: 163k → 62k → 91k → 43k, không còn video nào từ 1,5 tr.
- Chưa ghi nhận video mới trong dữ liệu thu thập từ 29/05/2026 (khoảng 166 ngày). Có hai cách đọc và dữ liệu không phân xử được: định dạng còn chỗ trống, hoặc định dạng đã bão hoà (view giảm đều suốt một năm trước khi dừng). Kênh tiếng Anh dừng đăng cũng không nói gì về thị trường Việt Nam.
- Giờ đăng: không khung nào nổi trội rõ. Thứ Bảy đạt 4,8× bài cùng thời nhưng chỉ có 7 video; không dùng làm lịch đăng.

### Độ dài
- Trong nhóm Khái niệm tài chính, video **đến 35 giây** đạt trung vị 440k và 1,0× bài cùng thời (10 video); 35–60 giây 0,7× (9 video); trên 60 giây 0,5× (12 video). Hướng "ngắn hơn thì tốt hơn" nhất quán qua ba mức, nhưng mỗi mức chỉ khoảng 10 video.
- Nhóm Tội phạm & mặt tối không theo hướng này (trên 60 giây vẫn 2,0×, 8 video; Tax Evasion dài 61 giây). Chưa đủ cơ sở để áp một mốc 25–35 giây cho mọi chủ đề.

### Áp dụng cho DSC
1. **Thử loạt "… là gì?" bằng `shorts-sticker`** (skill `dsc-shorts`). Quan sát: 3 video từ 1,5 tr đều theo khuôn này. Chưa tách được: cùng khuôn cũng cho bài 100–150k, và cả 3 video lớn đều rơi vào 2 tháng đầu của kênh. Giả thuyết: mức quen tai của khái niệm quyết định. Thử nghiệm: 10 tập, một nửa khái niệm "ai cũng nghe" (trốn thuế, rửa tiền, bảo hiểm), một nửa khái niệm chuyên hơn (CIC, vay thế chấp); đo tỷ lệ tập vượt 10× trung vị của kênh đăng sau 7 ngày.
2. **Đưa nhóm "mặt tối tài chính" vào đợt thử đầu** (lừa đảo đa cấp, app vay, link giả, thao túng chứng khoán). Quan sát: 2,1× bài cùng thời, giữ vị trí khi bỏ video lớn nhất. Chưa tách được: 11 video. Thử nghiệm: xen kẽ với tập khái niệm trung tính, so trung vị và tỷ lệ hit hai nhóm.
3. **Thử độ dài trên cùng một kịch bản.** Quan sát: khái niệm tài chính ngắn đến 35 giây đạt 1,0× so với 0,5× ở bản trên 60 giây. Chưa tách được: các video ngắn tập trung ở giai đoạn đầu. Thử nghiệm: dựng hai bản 30 giây và 60 giây cho cùng 4–5 khái niệm, đăng luân phiên.
4. **Không loại tin thời sự vì dữ liệu này.** Nếu DSC dùng `dsc-news` cho tin nóng thì đó là lựa chọn về định vị kênh; đối thủ không cung cấp bằng chứng tin thời sự bằng sticker kém hơn.
5. **Cast cố định và giọng "câu cụt"** là đặc trưng nhận diện của định dạng, đáng giữ khi Việt hoá. Dữ liệu công khai không đo được người xem quay lại, nên không coi đây là nguyên nhân tăng view.

## TikTok

### @gorillanomics

- 166k follower · 61 video phân tích (2025-05-19 → 2026-05-29) · tổng 25,7 tr view
- View trung vị 153k, trung bình 422k, cao nhất 6,5 tr · tương tác trung vị 8,8%
- 1,1 video/tuần · 0 video trong 30 ngày qua · độ dài trung vị 61s · 100,0% dùng âm thanh gốc

**Điểm chính**

- Không loại nội dung nào nổi trội rõ: chênh lệch giữa các nhóm còn trong mức ngẫu nhiên (trung vị 56k–300k)
- **Tin thời sự / chính trị** chiếm 31,1% số video nhưng chỉ mang về 12,0% tổng view
- **3/61 video** đạt từ 1,5 tr view (10× trung vị kênh) và mang về **45,1%** tổng view; top 3 chiếm 45,1%
- View tích lũy trung vị **giảm**: 289k ở 3 tháng có bài đầu → 56k ở 3 tháng có bài cuối; chưa so ở cùng tuổi bài
- Đăng 1,1 video/tuần; tháng dày nhất T6/25 có 13 video; 30 ngày qua: 0 video
- Không khung giờ nào nổi trội rõ: chênh lệch giữa các nhóm còn trong mức ngẫu nhiên (trung vị 128k–232k)
- **T7** nổi trội: gấp 4,8× các bài đăng cùng thời, nhóm kế tiếp (T3) 1,8×
- Không mức độ dài nào nổi trội rõ: chênh lệch giữa các nhóm còn trong mức ngẫu nhiên (trung vị 125k–559k)
- Hashtag đi kèm view cao hơn hẳn trung vị: **#economic**, **#fyp**; không chứng minh hashtag làm tăng view

| # | Video | View | Tương tác | Giây | Ngày | Loại |
|---|---|---|---|---|---|---|
| 1 | [Gorillas explain Tax Evasion #economic #finance #fyp ](https://www.tiktok.com/@gorillanomics/video/7514219246356942122) | 6,5 tr | 10,6% | 61 | 2025-06-10 | Tội phạm & mặt tối tài chính |
| 2 | [Gorillas explain Insurance #economic #finance #fyp ](https://www.tiktok.com/@gorillanomics/video/7511246760254180650) | 3,2 tr | 13,1% | 29 | 2025-06-02 | Khái niệm tài chính |
| 3 | [Gorillas explain Money Laundering #economic #finance #fyp ](https://www.tiktok.com/@gorillanomics/video/7507727025692495146) | 1,9 tr | 13,9% | 28 | 2025-05-24 | Tội phạm & mặt tối tài chính |
| 4 | [Gorillas explain Mortgage #economic #finance #fyp ](https://www.tiktok.com/@gorillanomics/video/7512346700695129390) | 1,5 tr | 14,1% | 60 | 2025-06-05 | Khái niệm tài chính |
| 5 | [ICE explained by Gorills #finance #economics #politics #ice ](https://www.tiktok.com/@gorillanomics/video/7598652375418686734) | 1,1 tr | 5,7% | 61 | 2026-01-24 | Tin thời sự / chính trị |
| 6 | [Gorillas explain Credit Score #economic #finance #fyp](https://www.tiktok.com/@gorillanomics/video/7508066844973223214) | 905k | 11,1% | 25 | 2025-05-25 | Khái niệm tài chính |
| 7 | [Gorillas explain Capitalism #economic #finance #fyp ](https://www.tiktok.com/@gorillanomics/video/7511981862139514158) | 713k | 11,3% | 27 | 2025-06-04 | Khái niệm tài chính |
| 8 | [Gorillas explain Fake Money #economic #finance #fyp ](https://www.tiktok.com/@gorillanomics/video/7508459051450191146) | 659k | 10,5% | 28 | 2025-05-26 | Tội phạm & mặt tối tài chính |
| 9 | [Gorillas explain Vacation Time #economic #finance #fyp ](https://www.tiktok.com/@gorillanomics/video/7512737228787830058) | 559k | 11,7% | 24 | 2025-06-06 | Khái niệm tài chính |
| 10 | [Pyramid Schemes explain by Gorillas #finance #economics #fin](https://www.tiktok.com/@gorillanomics/video/7564943939237580087) | 551k | 6,4% | 61 | 2025-10-25 | Tội phạm & mặt tối tài chính |

**Phong cách dựng (video top)**

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

| Video | View | Đổi hình | 3s đầu | Phụ đề | Từ/phút | 3 giây đầu nói |
|---|---|---|---|---|---|---|
| [Gorillas explain Tax Evasion #economic #](https://www.tiktok.com/@gorillanomics/video/7514219246356942122) | 6,5 tr | 0,6s/beat | 4 | 1,2s/cụm | 192 | What is tax evasion? Gorilla work 9 to 5. |
| [Gorillas explain Insurance #economic #fi](https://www.tiktok.com/@gorillanomics/video/7511246760254180650) | 3,2 tr | 0,5s/beat | 5 | 0,9s/cụm | 215 | What is insurance? Gorilla get new car. Gorilla very happy, |
| [Gorillas explain Money Laundering #econo](https://www.tiktok.com/@gorillanomics/video/7507727025692495146) | 1,9 tr | 0,6s/beat | 5 | 0,8s/cụm | 194 | what is money laundering big boss run guerrilla gang guerrilla |

#### Kiểm tra bằng chứng

View là số tích lũy trong cache, không phải view ở cùng tuổi bài; bài dưới 7 ngày tuổi lúc thu thập còn đang tích view và được đếm riêng. "So với bài cùng thời" = view chia cho trung vị các bài khác đăng trong ±7 ngày (nới tới ±30 ngày nếu thiếu mẫu); cách này giảm nhiễu giai đoạn nhưng không chứng minh nhân quả. Hit = bài đạt từ 10× trung vị kênh. Nhóm dưới 5 bài là ít mẫu; không chọn làm nhóm dẫn đầu. Tỷ lệ vượt chuẩn dùng dấu >. Thiếu số đo hiển thị —; cache cũ có thể đã thay dữ liệu tương tác thiếu bằng 0. Không suy ra giữ chân, người xem quay lại hoặc cơ hội thị trường từ dữ liệu này.

Đã gắn nhãn 61/61 video. P25–P75 là khoảng phân vị, không phải khoảng tin cậy.

**Độ ổn định theo loại nội dung**

| Loại | n | Trung vị | P25–P75 | Hit (≥1,5 tr) | So với bài cùng thời | Vượt bài cùng thời |
|---|---|---|---|---|---|---|
| Tội phạm & mặt tối tài chính | 11 | 300k | 132k–605k | 2/11 | 2,1× | 63,6% |
| Khái niệm tài chính | 31 | 189k | 89k–388k | 1/31 | 0,7× | 41,4% |
| Tin thời sự / chính trị | 19 | 56k | 29k–197k | 0/19 | 0,9× | 44,4% |

**Tỷ lệ hit theo quý (mọi bài)**

| Kỳ | n | Trung vị | Hit (≥1,5 tr) |
|---|---|---|---|
| 2025-Q2 | 23 | 291k | 3/23 |
| 2025-Q3 | 10 | 163k | 0/10 |
| 2025-Q4 | 6 | 62k | 0/6 |
| 2026-Q1 | 14 | 91k | 0/14 |
| 2026-Q2 | 8 | 43k | 0/8 |

**Kiểm tra khi bỏ video nhiều view nhất toàn kênh**

| Bỏ top | Loại | n còn lại | Trung vị | Dẫn đầu đủ mẫu |
|---|---|---|---|---|
| 0 | Tội phạm & mặt tối tài chính | 11 | 300k | Có (có thể đồng hạng) |
| 0 | Khái niệm tài chính | 31 | 189k | — |
| 0 | Tin thời sự / chính trị | 19 | 56k | — |
| 1 | Tội phạm & mặt tối tài chính | 10 | 291k | Có (có thể đồng hạng) |
| 1 | Khái niệm tài chính | 31 | 189k | — |
| 1 | Tin thời sự / chính trị | 19 | 56k | — |
| 3 | Tội phạm & mặt tối tài chính | 9 | 282k | Có (có thể đồng hạng) |
| 3 | Khái niệm tài chính | 30 | 180k | — |
| 3 | Tin thời sự / chính trị | 19 | 56k | — |

**So chủ đề trong cùng quý (chỉ kỳ có từ 2 loại)**

| Kỳ | Loại | n | Trung vị | Hit |
|---|---|---|---|---|
| 2025-Q2 | Tội phạm & mặt tối tài chính | 5 | 659k | 2/5 |
| 2025-Q2 | Khái niệm tài chính | 17 | 291k | 1/17 |
| 2025-Q2 | Tin thời sự / chính trị | 1 · ít mẫu | 257k | 0/1 |
| 2025-Q3 | Tội phạm & mặt tối tài chính | 4 · ít mẫu | 291k | 0/4 |
| 2025-Q3 | Tin thời sự / chính trị | 1 · ít mẫu | 153k | 0/1 |
| 2025-Q3 | Khái niệm tài chính | 5 | 133k | 0/5 |
| 2025-Q4 | Tội phạm & mặt tối tài chính | 2 · ít mẫu | 296k | 0/2 |
| 2025-Q4 | Tin thời sự / chính trị | 3 · ít mẫu | 81k | 0/3 |
| 2025-Q4 | Khái niệm tài chính | 1 · ít mẫu | 43k | 0/1 |
| 2026-Q1 | Khái niệm tài chính | 4 · ít mẫu | 143k | 0/4 |
| 2026-Q1 | Tin thời sự / chính trị | 10 | 46k | 0/10 |
| 2026-Q2 | Tin thời sự / chính trị | 4 · ít mẫu | 43k | 0/4 |
| 2026-Q2 | Khái niệm tài chính | 4 · ít mẫu | 40k | 0/4 |

**Độ dài trong cùng chủ đề (mốc chia theo phân vị của từng loại)**

| Loại | Độ dài | n | Trung vị | So với bài cùng thời | Hit | Đủ hai nhóm ≥5 bài |
|---|---|---|---|---|---|---|
| Khái niệm tài chính | ≤35s | 10 | 440k | 1,0× | 1/10 | Có; vẫn là tương quan |
| Khái niệm tài chính | 35s–60s | 9 | 145k | 0,7× | 0/9 | Có; vẫn là tương quan |
| Khái niệm tài chính | >60s | 12 | 95k | 0,5× | 0/12 | Có; vẫn là tương quan |
| Tin thời sự / chính trị | ≤60s | 2 · ít mẫu | 19k | 0,2× | 0/2 | Chưa đủ mẫu |
| Tin thời sự / chính trị | >60s | 17 | 81k | 1,4× | 0/17 | Chưa đủ mẫu |
| Tội phạm & mặt tối tài chính | ≤60s | 3 · ít mẫu | 659k | 2,5× | 1/3 | Chưa đủ mẫu |
| Tội phạm & mặt tối tài chính | >60s | 8 | 291k | 2,0× | 1/8 | Chưa đủ mẫu |

**Tương tác theo từng loại (trung vị tỷ lệ trên view)**

| Loại | Like/view | Bình luận/view | Chia sẻ/view | Lưu/view |
|---|---|---|---|---|
| Tội phạm & mặt tối tài chính | 9,4% (n=11) | 0,0% (n=11) | 0,3% (n=11) | 1,1% (n=11) |
| Khái niệm tài chính | 8,0% (n=31) | 0,0% (n=31) | 0,3% (n=31) | 0,9% (n=31) |
| Tin thời sự / chính trị | 5,3% (n=19) | 0,1% (n=19) | 0,2% (n=19) | 0,6% (n=19) |

**Cặp video để xem đối chứng thủ công**

| Loại | Video cao / ID | Video thấp / ID | Tỷ lệ view | Cách ngày |
|---|---|---|---|---|
| Tội phạm & mặt tối tài chính | Gorillas explain Tax Evasion #economic #finance #fyp  [7514219246356942122] | Gorillas explain Bail #economic #finance #fyp  [7516786739202149646] | 62.5× | 6.9 |
| Tin thời sự / chính trị | ICE explained by Gorills #finance #economics #politics #ice #currentevents  [7598652375418686734] | Greenland and Trump explained by Gorillas #currentevents #fyp #politics #economics  [7602088491501047071] | 30.7× | 9.3 |
| Tin thời sự / chính trị | Mexican Cartel Riots explained by Gorillas #mexico #cartel #currentevents #politics #news  [7610258706768432397] | TikTok Acquisition explained by Gorillas #currentevents #news #politics #economics  [7611269976183409933] | 23.6× | 2.7 |
| Khái niệm tài chính | Gorillas explain Insurance #economic #finance #fyp  [7511246760254180650] | Gorillas explain Buy Now Pay Later #finance #economic #fyp  [7521232219076119863] | 22.0× | 26.9 |
| Tội phạm & mặt tối tài chính | Gorillas explain Money Laundering #economic #finance #fyp  [7507727025692495146] | Gorillanomics explains Phishing Scams #economic #finance #fyp  [7506778499185823022] | 15.6× | 2.6 |
| Khái niệm tài chính | Gorillas explain Mortgage #economic #finance #fyp  [7512346700695129390] | Gorillas explain Trust Funds #finance #economic #fyp  [7523408709033250061] | 8.7× | 29.8 |

Cặp đối chứng: cùng loại, cách tối đa 30 ngày, độ dài chênh tối đa 15% (ít nhất 10 giây), view chênh ít nhất 2 lần, cả hai bài đã đủ 7 ngày tuổi; mỗi loại tối đa 2 cặp, không lặp video, ưu tiên chênh view lớn. Chỉ dùng để xem thủ công, chưa chứng minh nguyên nhân.

| Loại hình | Số video | View trung vị |
|---|---|---|
| Tội phạm & mặt tối tài chính | 11 | 300k |
| Khái niệm tài chính | 31 | 189k |
| Tin thời sự / chính trị | 19 | 56k |

| Tháng | Số video | View trung vị |
|---|---|---|
| 2025-05 | 10 | 334k |
| 2025-06 | 13 | 289k |
| 2025-07 | 2 | 228k |
| 2025-08 | 5 | 153k |
| 2025-09 | 3 | 142k |
| 2025-10 | 1 | 551k |
| 2025-11 | 5 | 43k |
| 2026-01 | 5 | 70k |
| 2026-02 | 4 | 197k |
| 2026-03 | 5 | 131k |
| 2026-04 | 4 | 56k |
| 2026-05 | 4 | 27k |
