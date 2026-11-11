# Dùng với ChatGPT (Custom GPT)

ChatGPT không có git nên không dùng repo trực tiếp. Thay vào đó, một Custom GPT gọi GitHub API để chạy workflow và ghi file, rồi đọc kết quả từ trang Pages công khai. Cần tài khoản ChatGPT có quyền tạo GPT (Plus/Team/Enterprise).

## 1. Tạo token GitHub (một lần)
1. https://github.com/settings/personal-access-tokens/new (Fine-grained token).
2. **Repository access**: Only select repositories → `competitor-intel`.
3. **Permissions → Repository → Actions: Read and write**. Không cấp quyền nào khác (workflow tự commit, nên GPT không cần quyền Contents).
4. Đặt hạn dùng (ví dụ 90 ngày) và lưu token.

Token này chỉ chạy và xem được workflow của repo này. Nếu lộ thì thu hồi ở trang trên.

## 2. Tạo GPT
1. ChatGPT → Explore GPTs → Create → Configure.
2. **Name**: Phân tích đối thủ DSC. **Instructions**: dán toàn bộ [instructions.md](instructions.md).
3. **Capabilities**: bật Web Browsing (để mở ảnh khung hình), có thể bật Code Interpreter.
4. **Actions → Create new action**:
   - Schema: dán [github-actions.openapi.yaml](github-actions.openapi.yaml).
   - Authentication: **API Key**, Auth Type **Bearer**, dán token ở bước 1.
5. **Actions → Create new action** lần nữa:
   - Schema: dán [reports.openapi.yaml](reports.openapi.yaml). Authentication: **None**.
6. Privacy policy (bắt buộc khi share): có thể dùng `https://vilo0411.github.io/competitor-intel/`.
7. Save, chọn "Only me" hoặc chia sẻ trong workspace. **Đừng public**, vì GPT chứa token.

## 3. Dùng
Nói với GPT: "Phân tích đối thủ Gorillanomics @gorillanomics". GPT sẽ chạy workflow, chờ, gắn nhãn, viết phong cách dựng và nhận định, rồi gửi link báo cáo.

## Giới hạn so với Claude Code / Codex
- Trang Pages có thể chậm vài phút sau mỗi run do cache CDN.
- GPT xem ảnh khung hình qua Web Browsing không ổn định. Nếu không xem được, phần "Hình ảnh" trong style.md sẽ sơ sài hơn.
- Mỗi lần ghi file là một lần chạy workflow (khoảng 1 phút), nên ghi gộp, đừng ghi lắt nhắt.
