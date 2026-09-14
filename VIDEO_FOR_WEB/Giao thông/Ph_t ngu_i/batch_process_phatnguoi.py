import cv2
import os
import numpy as np

def adjust_color(img, saturation_scale, value_scale, contrast, brightness):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * saturation_scale, 0, 255)
    hsv[:, :, 2] = np.clip(hsv[:, :, 2] * value_scale, 0, 255)
    img_adjusted = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    
    img_adjusted = img_adjusted.astype(np.float32)
    img_adjusted = img_adjusted * contrast + brightness
    img_adjusted = np.clip(img_adjusted, 0, 255).astype(np.uint8)
    return img_adjusted

base_dir = r"F:\CVISION\antigravity project\web\Giao thông (1)\Phạt nguọi\Giao thông_ phạt nguội"
out_dir = os.path.join(base_dir, "modify")
os.makedirs(out_dir, exist_ok=True)

for filename in os.listdir(base_dir):
    if filename.endswith("_m.jpg"):
        base_name = filename.replace("_m.jpg", "")
        original_filename = base_name + ".jpg"
        
        original_path = os.path.join(base_dir, original_filename)
        marked_path = os.path.join(base_dir, filename)
        
        if os.path.exists(original_path):
            print(f"Processing {original_filename}...")
            # Use imdecode to handle Vietnamese characters in path
            original = cv2.imdecode(np.fromfile(original_path, dtype=np.uint8), cv2.IMREAD_COLOR)
            marked = cv2.imdecode(np.fromfile(marked_path, dtype=np.uint8), cv2.IMREAD_COLOR)
            
            # Find difference
            diff = cv2.absdiff(original, marked)
            gray_diff = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
            
            # Threshold to get the mask of the pen strokes
            _, thresh = cv2.threshold(gray_diff, 10, 255, cv2.THRESH_BINARY)
            
            # Morphological operations to group strokes into solid regions
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
            dilated = cv2.dilate(thresh, kernel, iterations=3)
            mask = cv2.morphologyEx(dilated, cv2.MORPH_CLOSE, kernel, iterations=5)
            
            # Blur the mask to create a feathered effect (spotlight edge)
            feathered_mask = cv2.GaussianBlur(mask, (101, 101), 0)
            
            # Normalize mask to 0-1 for blending
            mask_3d = np.stack([feathered_mask/255.0]*3, axis=-1)
            
            # Create Foreground (High Saturation, High Contrast)
            # Make the highlighted area very vibrant and clear
            fg = adjust_color(original, saturation_scale=1.5, value_scale=1.2, contrast=1.2, brightness=20)
            
            # Create Background (Desaturated, Darkened)
            # Make the surrounding area dark so the highlight pops
            bg = adjust_color(original, saturation_scale=0.5, value_scale=0.3, contrast=0.8, brightness=-50)
            
            # Blend
            final = fg * mask_3d + bg * (1 - mask_3d)
            final = final.astype(np.uint8)
            
            out_filename = base_name + ".jpg"
            out_path = os.path.join(out_dir, out_filename)
            
            # Use imencode to handle Vietnamese characters in path
            success, encoded_image = cv2.imencode('.jpg', final)
            if success:
                encoded_image.tofile(out_path)
                print(f"Saved: {out_filename}")
            else:
                print(f"Failed to encode: {out_filename}")
        else:
            print(f"Warning: Original file {original_filename} not found.")

print("Hoàn thành xử lý hàng loạt!")
