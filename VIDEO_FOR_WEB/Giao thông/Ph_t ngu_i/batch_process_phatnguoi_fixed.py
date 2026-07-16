import cv2
import os
import numpy as np

def adjust_color(img, saturation_scale, value_scale, contrast, brightness):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * saturation_scale, 0, 255)
    hsv[:, :, 2] = np.clip(hsv[:, :, 2] * value_scale, 0, 255)
    img_adj = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    img_adj = cv2.convertScaleAbs(img_adj, alpha=contrast, beta=brightness)
    return img_adj

def process_image_pair(orig_path, marked_path, out_path):
    orig = cv2.imdecode(np.fromfile(orig_path, dtype=np.uint8), cv2.IMREAD_COLOR)
    marked = cv2.imdecode(np.fromfile(marked_path, dtype=np.uint8), cv2.IMREAD_COLOR)

    if orig.shape != marked.shape:
        print(f"Shape mismatch: {orig_path}")
        return False

    h, w = orig.shape[:2]
    
    # Dùng absdiff y như thuật toán cũ thành công
    diff = cv2.absdiff(orig, marked)
    gray_diff = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
    
    # Khử nhiễu JPG một chút để tránh các đốm đen vô cớ
    gray_diff = cv2.medianBlur(gray_diff, 5)
    
    # Tăng ngưỡng lên 40 thay vì 20 để bỏ qua hẳn nhiễu JPG
    _, diff_mask = cv2.threshold(gray_diff, 40, 255, cv2.THRESH_BINARY)
    
    kernel = np.ones((5,5), np.uint8)
    diff_mask = cv2.morphologyEx(diff_mask, cv2.MORPH_OPEN, kernel)
    diff_mask = cv2.dilate(diff_mask, kernel, iterations=2)

    contours, _ = cv2.findContours(diff_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # ĐÂY LÀ CHÌA KHÓA: Trở lại thuật toán BOUNDING BOX (Vẽ hình chữ nhật mờ)
    sharp_mask = np.zeros((h, w), dtype=np.uint8)
    found = False
    
    for cnt in contours:
        x, y, bw, bh = cv2.boundingRect(cnt)
        # Lọc các khung quá nhỏ (do nhiễu)
        if bw > 20 and bh > 20:
            found = True
            padding = 35 # Cho rộng rãi thêm chút
            x1 = max(0, x - padding)
            y1 = max(0, y - padding)
            x2 = min(w, x + bw + padding)
            y2 = min(h, y + bh + padding)
            # Vẽ nguyên 1 cục hình chữ nhật to đùng bao trùm toàn bộ
            cv2.rectangle(sharp_mask, (x1, y1), (x2, y2), 255, -1)

    if not found:
        print(f"No drawn lines found in {marked_path}")
        return False

    # Blur cực mạnh (151x151) để tạo hiệu ứng spotlight mượt mà
    feathered_mask = cv2.GaussianBlur(sharp_mask, (151, 151), 0)
    feathered_mask_float = feathered_mask.astype(np.float32) / 255.0
    feathered_mask_3d = np.repeat(feathered_mask_float[:, :, np.newaxis], 3, axis=2)

    # Blend y hệt code cũ
    bg_img = adjust_color(orig, saturation_scale=0.3, value_scale=0.85, contrast=0.9, brightness=-10)
    fg_img = adjust_color(orig, saturation_scale=1.4, value_scale=1.05, contrast=1.15, brightness=15)

    blended = fg_img.astype(np.float32) * feathered_mask_3d + bg_img.astype(np.float32) * (1 - feathered_mask_3d)
    blended = np.clip(blended, 0, 255).astype(np.uint8)

    is_success, buffer = cv2.imencode(".jpg", blended)
    if is_success:
        buffer.tofile(out_path)
        print(f"Saved: {out_path}")
        return True
    return False

dir_path = r"F:\CVISION\antigravity project\web\Giao thông (1)\Phạt nguọi\Giao thông_ phạt nguội"
out_dir = os.path.join(dir_path, "modify")

if not os.path.exists(out_dir):
    os.makedirs(out_dir)

print("Đang tìm và xử lý các ảnh có đuôi _m.jpg...")
for filename in os.listdir(dir_path):
    if filename.endswith("_m.jpg"):
        marked_path = os.path.join(dir_path, filename)
        orig_filename = filename.replace("_m.jpg", ".jpg")
        orig_path = os.path.join(dir_path, orig_filename)
        
        if os.path.exists(orig_path):
            out_path = os.path.join(out_dir, orig_filename)
            process_image_pair(orig_path, marked_path, out_path)

print("Hoàn tất xử lý theo phương pháp Bounding Box!")
