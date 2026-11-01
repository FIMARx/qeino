from PIL import Image
import numpy as np

def inpaint_plane(arr, dst_ymin, dst_ymax, dst_xmin, dst_xmax, src_ymin, src_xmin):
    dh = dst_ymax - dst_ymin
    dw = dst_xmax - dst_xmin
    
    pad = 8
    border_pts = []
    border_vals = []
    
    for y in range(max(0, dst_ymin - pad), min(arr.shape[0], dst_ymax + pad)):
        for x in range(max(0, dst_xmin - pad), min(arr.shape[1], dst_xmax + pad)):
            if not (dst_ymin <= y < dst_ymax and dst_xmin <= x < dst_xmax):
                if np.mean(arr[y, x]) < 130:
                    border_pts.append([y, x, 1.0])
                    border_vals.append(arr[y, x])
                    
    A = np.array(border_pts)
    b = np.array(border_vals)
    coeffs, _, _, _ = np.linalg.lstsq(A, b, rcond=None)
    
    yy, xx = np.mgrid[dst_ymin:dst_ymax, dst_xmin:dst_xmax]
    grid_pts = np.stack([yy, xx, np.ones_like(yy)], axis=-1)
    plane = np.einsum('ijk,kl->ijl', grid_pts, coeffs)
    
    src = arr[src_ymin:src_ymin+dh, src_xmin:src_xmin+dw].copy()
    src_mean = np.mean(src, axis=(0,1))
    noise = src - src_mean
    
    result = plane + noise * 0.7
    
    dist_y = np.minimum(yy - dst_ymin, dst_ymax - 1 - yy)
    dist_x = np.minimum(xx - dst_xmin, dst_xmax - 1 - xx)
    dist = np.minimum(dist_y, dist_x).astype(float)
    mask = np.clip(dist / 5.0, 0.0, 1.0)
    mask = mask[:, :, np.newaxis]
    
    arr[dst_ymin:dst_ymax, dst_xmin:dst_xmax] = arr[dst_ymin:dst_ymax, dst_xmin:dst_xmax] * (1.0 - mask) + result * mask

def process_full_image(raw_path, out_webp_path, out_jpg_path):
    im = Image.open(raw_path).convert('RGB')
    arr = np.array(im).astype(float)
    
    # In full image coordinates:
    # crop was (2200, 400, 2800, 1400)
    # x_offset = 2200, y_offset = 400
    xo = 2200
    yo = 400
    
    # qeino.com (y: 65 to 330, x: 275 to 350)
    # src: (520, 50)
    inpaint_plane(arr, yo + 65, yo + 330, xo + 275, xo + 350, yo + 520, xo + 50)
    
    # Serial no: 21 (y: 605 to 925, x: 265 to 350)
    # src: (500, 60)
    inpaint_plane(arr, yo + 605, yo + 925, xo + 265, xo + 350, yo + 500, xo + 60)
    
    cleaned = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    
    # Crop to center product nicely
    # Product bounding area roughly (1000, 300, 3100, 2900)
    # Let's save full resolution and webp with quality 90
    cleaned.save(out_jpg_path, quality=95)
    cleaned.save(out_webp_path, 'WEBP', quality=90)
    print(f'Processed and saved: {out_webp_path}')

# Process LidAid2 -> lidaid-device
def process_lidaid2():
    im = Image.open('Aineistoja/Tuotekuvia/LidAid2.jpg').convert('RGB')
    arr = np.array(im).astype(float)
    xo, yo = 2200, 400
    inpaint_plane(arr, yo + 65, yo + 330, xo + 275, xo + 350, yo + 520, xo + 50)
    inpaint_plane(arr, yo + 605, yo + 925, xo + 265, xo + 350, yo + 500, xo + 60)
    cleaned = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    cleaned.save('assets/img/lidaid-device.jpg', quality=95)
    cleaned.save('assets/img/lidaid-device.webp', 'WEBP', quality=90)
    print('Processed lidaid-device.webp')

# Process LidAid4 -> lidaid-angle
def process_lidaid4():
    im = Image.open('Aineistoja/Tuotekuvia/LidAid4.jpg').convert('RGB')
    arr = np.array(im).astype(float)
    xo, yo = 2200, 400
    # In LidAid4, x is shifted ~45px left: 225-320, y extends to 338 to cover 'q'
    inpaint_plane(arr, yo + 55, yo + 338, xo + 225, xo + 320, yo + 520, xo + 40)
    inpaint_plane(arr, yo + 605, yo + 915, xo + 215, xo + 315, yo + 500, xo + 40)
    cleaned = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    cleaned.save('assets/img/lidaid-angle.jpg', quality=95)
    cleaned.save('assets/img/lidaid-angle.webp', 'WEBP', quality=90)
    print('Processed lidaid-angle.webp')

process_lidaid2()
process_lidaid4()

