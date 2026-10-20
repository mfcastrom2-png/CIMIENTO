#!/usr/bin/env python3
import struct
import zlib
import os
import math

def create_png(width, height, draw_fn, output_path):
    raw_rows = []
    for y in range(height):
        row = bytearray([0]) # filter type 0 (None)
        for x in range(width):
            r, g, b, a = draw_fn(x, y, width, height)
            row.extend([r, g, b, a])
        raw_rows.append(bytes(row))
    
    raw_data = b"".join(raw_rows)
    compressed = zlib.compress(raw_data, level=9)
    
    def chunk(tag, data):
        length = struct.pack(">I", len(data))
        crc = struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)
        return length + tag + data + crc

    png_header = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    
    with open(output_path, "wb") as f:
        f.write(png_header)
        f.write(chunk(b"IHDR", ihdr))
        f.write(chunk(b"IDAT", compressed))
        f.write(chunk(b"IEND", b""))
    print(f"Generated {output_path} ({width}x{height})")

def bgroup_brand_color(x, y, w, h, is_maskable=False):
    # Base background: Deep corporate Navy gradient (#18235C -> #0A0E29)
    t = (x + y) / (w + h)
    bg_r = int(24 * (1 - t) + 10 * t)
    bg_g = int(35 * (1 - t) + 14 * t)
    bg_b = int(92 * (1 - t) + 41 * t)

    # If maskable, fill full canvas. Otherwise, rounded corners
    if not is_maskable:
        # Round corner radius: ~22%
        rx = w * 0.22
        # Check distance from corners
        in_corner = False
        cx, cy = 0, 0
        if x < rx and y < rx:
            cx, cy = rx, rx
            in_corner = True
        elif x > (w - rx) and y < rx:
            cx, cy = w - rx, rx
            in_corner = True
        elif x < rx and y > (h - rx):
            cx, cy = rx, h - rx
            in_corner = True
        elif x > (w - rx) and y > (h - rx):
            cx, cy = w - rx, h - rx
            in_corner = True

        if in_corner:
            dist = math.hypot(x - cx, y - cy)
            if dist > rx:
                return (0, 0, 0, 0) # Transparent

    # Normalized coords [0, 1]
    nx = x / w
    ny = y / h

    # Subtle tech circle ring
    dx_c = nx - 0.5
    dy_c = ny - 0.5
    dist_c = math.sqrt(dx_c*dx_c + dy_c*dy_c)
    if 0.40 <= dist_c <= 0.42:
        return (56, 189, 248, 180) # Cyan accent ring

    # Draw Corporate "B" in center
    # B bounding box: nx in [0.30, 0.70], ny in [0.24, 0.74]
    if 0.30 <= nx <= 0.70 and 0.24 <= ny <= 0.74:
        # Check vertical spine
        if 0.30 <= nx <= 0.40:
            return (255, 255, 255, 255)
        # Top bar
        if 0.24 <= ny <= 0.33 and nx <= 0.62:
            return (255, 255, 255, 255)
        # Middle bar
        if 0.45 <= ny <= 0.53 and nx <= 0.60:
            return (255, 255, 255, 255)
        # Bottom bar
        if 0.65 <= ny <= 0.74 and nx <= 0.62:
            return (255, 255, 255, 255)
        # Upper loop curve
        if 0.24 <= ny <= 0.53:
            loop_dx = (nx - 0.50) / 0.18
            loop_dy = (ny - 0.38) / 0.14
            d_loop = loop_dx*loop_dx + loop_dy*loop_dy
            if 0.60 <= d_loop <= 1.05 and nx >= 0.40:
                return (255, 255, 255, 255)
        # Lower loop curve
        if 0.45 <= ny <= 0.74:
            loop_dx = (nx - 0.50) / 0.19
            loop_dy = (ny - 0.60) / 0.14
            d_loop = loop_dx*loop_dx + loop_dy*loop_dy
            if 0.60 <= d_loop <= 1.05 and nx >= 0.40:
                return (255, 255, 255, 255)

    # Gold human capital / talent emblem center-dot
    d_dot = math.hypot(nx - 0.50, ny - 0.49)
    if d_dot <= 0.055:
        return (245, 158, 11, 255) # Gold #F59E0B

    # Gold top right indicator badge
    d_badge = math.hypot(nx - 0.68, ny - 0.31)
    if d_badge <= 0.035:
        return (251, 191, 36, 255) # Amber #FBBF24

    # Bottom pill / label bar for "GH"
    if 0.78 <= ny <= 0.83 and 0.36 <= nx <= 0.64:
        return (245, 158, 11, 255) # Gold bar

    return (bg_r, bg_g, bg_b, 255)

def main():
    os.makedirs("public", exist_ok=True)
    
    # 1. 192x192 PNG (standard)
    create_png(192, 192, lambda x, y, w, h: bgroup_brand_color(x, y, w, h, False), "public/pwa-192x192.png")
    
    # 2. 512x512 PNG (standard)
    create_png(512, 512, lambda x, y, w, h: bgroup_brand_color(x, y, w, h, False), "public/pwa-512x512.png")
    
    # 3. 512x512 Maskable PNG (full bleed background for Android adaptive icon)
    create_png(512, 512, lambda x, y, w, h: bgroup_brand_color(x, y, w, h, True), "public/pwa-maskable-512x512.png")
    
    # 4. Apple Touch Icon 180x180 PNG (iOS Safari)
    create_png(180, 180, lambda x, y, w, h: bgroup_brand_color(x, y, w, h, False), "public/apple-touch-icon.png")
    
    # 5. Favicon 48x48 PNG (copied also as standard favicon)
    create_png(48, 48, lambda x, y, w, h: bgroup_brand_color(x, y, w, h, False), "public/favicon-48x48.png")
    
    print("All PWA icons generated successfully!")

if __name__ == "__main__":
    main()
