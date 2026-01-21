1. Core Visual Philosophy (Triết lý hình ảnh cốt lõi)

"Content is King, Chrome is Minimize."

Immersive: Loại bỏ các đường viền (borders) không cần thiết. Sử dụng khoảng trắng (whitespace) để phân cách nội dung.

Rounded Aesthetics: Sử dụng bo góc lớn (16px - 24px) cho các thẻ (Pin) và nút bấm để tạo cảm giác thân thiện.

Visual Feedback: Mọi tương tác (hover, click, focus) đều phải có phản hồi thị giác ngay lập tức (scale nhẹ, tối màu đi, hiện nút).

2. The Masonry Layout Engine (Cơ chế hiển thị dạng lưới so le)

Đây là trái tim của Pinterest.

Fixed Width, Variable Height: Các cột (columns) có chiều rộng cố định (theo % hoặc pixel), nhưng chiều cao của mỗi thẻ (Pin) phụ thuộc vào tỷ lệ ảnh (aspect ratio) của nội dung.

No Cropping: Không bao giờ cắt (crop) ảnh trong trang chủ. Phải hiển thị toàn bộ chiều cao ảnh để tôn trọng nội dung gốc.

Dense Packing: Các item phải tự động trượt lên để lấp đầy khoảng trống (gap) theo chiều dọc. Không để lại khoảng trắng quá lớn do chênh lệch chiều cao.

3. Image Performance & Optimization (Tối ưu hiệu năng ảnh)

Dominant Color Placeholders: Trước khi ảnh tải xong, BẮT BUỘC hiển thị một khối màu (background-color) trùng với màu chủ đạo của bức ảnh đó. Giúp giảm chỉ số CLS (Cumulative Layout Shift) và dịu mắt người dùng.

Progressive Loading (Lazy Load): Chỉ tải ảnh khi người dùng cuộn tới.

Srcset Strategy: Server phải trả về ít nhất 3 sizes ảnh:

thumb: w ~ 236px (cho feed)

medium: w ~ 564px (cho modal view)

original: (cho việc tải về/zoom)

4. Interaction & Navigation (Tương tác & Điều hướng)

Modal Routing: Khi click vào một Pin từ trang chủ:

URL thay đổi sang /pin/:id.

Giao diện mở lên một Modal (Lớp phủ) đè lên trang chủ.

Nền trang chủ phía sau giữ nguyên vị trí cuộn.

Khi tắt Modal -> URL quay về /, người dùng tiếp tục cuộn tiếp từ vị trí cũ.

Hover to Reveal: Các hành động phụ (Lưu, Gửi, More) chỉ hiện ra khi Hover vào ảnh để tránh rối mắt. Trên Mobile, các nút này phải luôn hiển thị hoặc dễ tiếp cận.

5. Infinite Scroll Mechanics (Cơ chế cuộn vô tận)

Threshold Fetching: Gọi API lấy trang tiếp theo khi người dùng còn cách đáy trang khoảng 500px - 1000px.

State Preservation: Nếu người dùng F5 hoặc quay lại trang, vị trí cuộn cũ và dữ liệu đã tải phải được khôi phục (sử dụng cache như React Query hoặc Redux).

6. Typography & Icons

Font: Sans-serif, đậm, dễ đọc (như: Inter, Roboto, hoặc -apple-system).

Icons: Sử dụng icon dạng Solid (đặc) cho trạng thái Active và Outline (viền) cho trạng thái thường.

7. Accessibility (A11y)

Mọi hình ảnh phải có alt text.

Grid phải hỗ trợ điều hướng bằng phím Tab.