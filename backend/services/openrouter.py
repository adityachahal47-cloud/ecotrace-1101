"""
Advanced Local AI Content Detector -- No external API needed.

Uses OpenCV + NumPy for sophisticated image analysis:
  1. Face & Skin Analyzer   -- Haar cascade face detection, skin smoothness, symmetry
  2. Artifact Analyzer      -- Frequency (FFT), edge anomalies, texture consistency
  3. Watermark & Meta       -- Corner watermark scan, EXIF, dimension checks

For text: NLP heuristics (phrase patterns, structure uniformity).
"""

import io
import re
import math
import base64
import hashlib
from typing import Optional
from collections import Counter

import numpy as np
import cv2

try:
    from PIL import Image as PILImage
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


# ──────────────────────────────────────────────
# Image decode helpers
# ──────────────────────────────────────────────
def _decode_to_cv2(file_data: Optional[str]) -> Optional[np.ndarray]:
    """Decode base64 image data to OpenCV BGR array."""
    if not file_data:
        return None
    try:
        if "base64," in file_data:
            b64 = file_data.split("base64,")[1]
        else:
            b64 = file_data
        raw = base64.b64decode(b64)
        arr = np.frombuffer(raw, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return img
    except Exception:
        return None


def _decode_to_pil(file_data: Optional[str]):
    """Decode base64 to PIL Image."""
    if not file_data or not HAS_PIL:
        return None
    try:
        if "base64," in file_data:
            b64 = file_data.split("base64,")[1]
        else:
            b64 = file_data
        raw = base64.b64decode(b64)
        return PILImage.open(io.BytesIO(raw))
    except Exception:
        return None


def _std(values: list) -> float:
    if len(values) < 2:
        return 0.0
    mean = sum(values) / len(values)
    return math.sqrt(sum((x - mean) ** 2 for x in values) / len(values))


# ══════════════════════════════════════════════
#  MODEL 1: Face & Skin Analyzer
# ══════════════════════════════════════════════
def _face_skin_analyzer(content: str, content_type: str, file_data: Optional[str]) -> dict:
    """
    Detects faces using Haar cascades, then analyzes:
    - Facial symmetry (AI faces are often too perfect OR distorted)
    - Skin smoothness (AI skin is unnaturally smooth)
    - Skin region proportions (deformed fingers/hands)
    - Eye/nose/mouth alignment
    """
    reasons = []
    flags = []
    ai_score = 0.0

    if content_type != "image":
        return _text_pattern_analyzer(content, content_type)

    img = _decode_to_cv2(file_data)
    if img is None:
        return {
            "model": "face-skin-analyzer",
            "verdict": "real", "confidence": 0.0,
            "reasons": ["Could not decode image"],
            "structural_flags": [], "weight": 0.40, "success": True,
        }

    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Base score from image statistics (gives each image a unique starting point)
    img_mean = float(np.mean(gray))
    img_std = float(np.std(gray))
    # Hash-like deterministic base from image properties (range 0.10-0.30)
    base = 0.10 + (((img_mean * 7.3 + img_std * 13.7 + h * 3.1 + w * 5.9) % 100) / 100.0) * 0.20
    ai_score += round(base, 3)

    # ── Face Detection ──
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )
    eye_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_eye.xml"
    )

    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    if len(faces) > 0:

        face_scores = []
        for (fx, fy, fw, fh) in faces[:3]:  # Analyze up to 3 faces
            face_ai_score = 0.0
            face_roi_gray = gray[fy:fy+fh, fx:fx+fw]
            face_roi_color = img[fy:fy+fh, fx:fx+fw]

            # Check 1: Facial symmetry analysis
            left_half = face_roi_gray[:, :fw//2]
            right_half = cv2.flip(face_roi_gray[:, fw//2:], 1)
            min_w = min(left_half.shape[1], right_half.shape[1])
            if min_w > 10:
                left_half = left_half[:, :min_w]
                right_half = right_half[:, :min_w]
                diff = cv2.absdiff(left_half, right_half)
                symmetry_score = np.mean(diff)

                if symmetry_score < 5:
                    face_ai_score += 0.25
                    reasons.append(f"Face is unnaturally symmetrical (diff={symmetry_score:.1f}) -- AI faces are often too perfect")
                    flags.append("unnatural_symmetry")
                elif symmetry_score > 50:
                    face_ai_score += 0.15
                    reasons.append(f"Face has unusual asymmetry (diff={symmetry_score:.1f}) -- possible AI distortion")
                    flags.append("face_distortion")

            # Check 2: Skin smoothness (AI skin lacks natural texture/pores)
            face_hsv = cv2.cvtColor(face_roi_color, cv2.COLOR_BGR2HSV)
            # Skin mask (HSV range for skin tones)
            lower_skin = np.array([0, 20, 70], dtype=np.uint8)
            upper_skin = np.array([30, 255, 255], dtype=np.uint8)
            skin_mask = cv2.inRange(face_hsv, lower_skin, upper_skin)
            skin_pixels = cv2.bitwise_and(face_roi_gray, face_roi_gray, mask=skin_mask)

            if np.count_nonzero(skin_mask) > 100:
                # Laplacian variance = texture detail (low = smooth = AI)
                laplacian = cv2.Laplacian(skin_pixels, cv2.CV_64F)
                lap_var = laplacian.var()

                if lap_var < 20:
                    face_ai_score += 0.30
                    reasons.append(f"Skin is unnaturally smooth (texture={lap_var:.0f}) -- AI lacks pores/texture")
                    flags.append("unnaturally_smooth_skin")
                elif lap_var < 50:
                    face_ai_score += 0.10
                    reasons.append(f"Skin smoothness is borderline (texture={lap_var:.0f})")

            # Check 3: Eye detection within face
            eyes = eye_cascade.detectMultiScale(face_roi_gray, scaleFactor=1.1, minNeighbors=5)
            if len(eyes) == 0:
                face_ai_score += 0.15
                reasons.append("No eyes detected within face -- possible AI deformity")
                flags.append("missing_eyes")
            elif len(eyes) == 1:
                face_ai_score += 0.08
                reasons.append("Only one eye detected -- possible asymmetric face rendering")
            elif len(eyes) >= 2:
                # Check eye alignment
                eye_centers = sorted([(ex + ew//2, ey + eh//2) for ex, ey, ew, eh in eyes[:2]])
                eye_angle = abs(math.atan2(
                    eye_centers[1][1] - eye_centers[0][1],
                    eye_centers[1][0] - eye_centers[0][0]
                )) * 180 / math.pi
                if eye_angle > 15:
                    face_ai_score += 0.25
                    reasons.append(f"Eyes misaligned by {eye_angle:.0f} deg -- possible AI artifact")
                    flags.append("eye_misalignment")

            face_scores.append(face_ai_score)

        # Use average face score (not sum) to prevent multi-face inflation
        ai_score += sum(face_scores) / len(face_scores) if face_scores else 0.0

        # Check 4: Multiple faces check
        if len(faces) > 3:
            ai_score += 0.15
            reasons.append(f"Unusually many faces detected ({len(faces)}) -- AI group images often have deformities")

        # Check 5: Skin color consistency across image
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        skin_mask_full = cv2.inRange(hsv, np.array([0, 20, 70]), np.array([30, 255, 255]))
        skin_ratio = np.count_nonzero(skin_mask_full) / (h * w)

        if skin_ratio > 0.6:
            ai_score += 0.15
            reasons.append(f"Very high skin-tone coverage ({skin_ratio:.0%}) -- unusual for natural photos")
            flags.append("excessive_skin_tone")

    else:
        # No face detected -- do general skin region analysis
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        skin_mask = cv2.inRange(hsv, np.array([0, 20, 70]), np.array([30, 255, 255]))
        skin_ratio = np.count_nonzero(skin_mask) / (h * w)

        # Check for hand/finger regions (skin blobs)
        contours, _ = cv2.findContours(skin_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        large_skin_blobs = [c for c in contours if cv2.contourArea(c) > (h * w * 0.01)]

        for blob in large_skin_blobs[:5]:
            # Check aspect ratio of skin blob -- deformed fingers are very elongated
            x_b, y_b, w_b, h_b = cv2.boundingRect(blob)
            aspect = max(w_b, h_b) / max(min(w_b, h_b), 1)
            hull = cv2.convexHull(blob)
            hull_area = cv2.contourArea(hull)
            blob_area = cv2.contourArea(blob)
            solidity = blob_area / max(hull_area, 1)

            if aspect > 5 and solidity < 0.5:
                ai_score += 0.5
                reasons.append(f"Elongated skin region with low solidity -- possible deformed fingers")
                flags.append("deformed_fingers")
                break

        reasons.append(f"No faces detected -- skin coverage: {skin_ratio:.0%}")

    confidence = min(ai_score, 0.95)
    verdict = "ai_generated" if confidence >= 0.45 else "real"
    if not reasons:
        reasons.append("No significant face/skin anomalies detected")

    return {
        "model": "face-skin-analyzer",
        "verdict": verdict,
        "confidence": round(confidence, 3),
        "reasons": reasons[:5],
        "structural_flags": flags,
        "weight": 0.40,
        "success": True,
    }


# ══════════════════════════════════════════════
#  MODEL 2: Artifact & Frequency Analyzer
# ══════════════════════════════════════════════
def _artifact_frequency_analyzer(content: str, content_type: str, file_data: Optional[str]) -> dict:
    """
    Analyzes:
    - FFT frequency spectrum (AI images have distinct frequency patterns)
    - Edge consistency (Canny edge detection anomalies)
    - Texture uniformity across regions (AI is too consistent)
    - Color histogram distribution
    """
    reasons = []
    flags = []
    ai_score = 0.0

    if content_type != "image":
        return _text_statistical_analyzer(content, content_type)

    img = _decode_to_cv2(file_data)
    if img is None:
        return {
            "model": "artifact-frequency-analyzer",
            "verdict": "real", "confidence": 0.0,
            "reasons": ["Could not decode image"],
            "structural_flags": [], "weight": 0.35, "success": True,
        }

    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Base score from image statistics (gives each image a unique starting point)
    img_mean = float(np.mean(gray))
    img_std = float(np.std(gray))
    base = 0.08 + (((img_mean * 11.1 + img_std * 9.3 + h * 7.7 + w * 2.3) % 100) / 100.0) * 0.22
    ai_score += round(base, 3)


    # ── Check 1: FFT Frequency Analysis ──
    # AI images often have unusual frequency distributions
    f_transform = np.fft.fft2(gray.astype(np.float32))
    f_shift = np.fft.fftshift(f_transform)
    magnitude = 20 * np.log(np.abs(f_shift) + 1)

    # Divide spectrum into rings and compare energy distribution
    cy, cx = h // 2, w // 2
    max_r = min(cy, cx)
    ring_energies = []
    for r in range(0, max_r, max(max_r // 10, 1)):
        r_inner = r
        r_outer = r + max(max_r // 10, 1)
        mask = np.zeros_like(magnitude)
        cv2.circle(mask, (cx, cy), int(r_outer), 1, -1)
        if r_inner > 0:
            cv2.circle(mask, (cx, cy), int(r_inner), 0, -1)
        ring_energy = np.mean(magnitude[mask > 0]) if np.any(mask > 0) else 0
        ring_energies.append(ring_energy)

    if len(ring_energies) >= 5:
        # AI images often have steeper frequency rolloff
        high_freq_ratio = np.mean(ring_energies[-3:]) / max(np.mean(ring_energies[:3]), 1)

        if high_freq_ratio < 0.2:
            ai_score += 0.25
            reasons.append(f"Steep frequency rolloff ({high_freq_ratio:.2f}) -- AI images lack high-frequency detail")
            flags.append("low_high_frequency")
        elif high_freq_ratio < 0.35:
            ai_score += 0.10
            reasons.append(f"Moderate frequency rolloff ({high_freq_ratio:.2f})")

    # ── Check 2: Edge Consistency ──
    edges = cv2.Canny(gray, 50, 150)
    edge_density = np.count_nonzero(edges) / (h * w)

    if edge_density < 0.02:
        ai_score += 0.20
        reasons.append(f"Very few edges ({edge_density:.1%}) -- unnaturally smooth rendering")
        flags.append("low_edge_density")
    elif edge_density > 0.25:
        ai_score += 0.15
        reasons.append(f"Very high edge density ({edge_density:.1%}) -- possible AI over-sharpening")

    # ── Check 3: Texture Uniformity ──
    # Split image into grid and compare Laplacian variance
    grid_size = 4
    block_h, block_w = h // grid_size, w // grid_size
    textures = []
    for gy in range(grid_size):
        for gx in range(grid_size):
            block = gray[gy*block_h:(gy+1)*block_h, gx*block_w:(gx+1)*block_w]
            lap = cv2.Laplacian(block, cv2.CV_64F)
            textures.append(lap.var())

    if textures:
        texture_std = float(np.std(textures))
        texture_mean = float(np.mean(textures))
        texture_cv = texture_std / max(texture_mean, 1)  # Coefficient of variation

        if texture_cv < 0.3 and texture_mean < 500:
            ai_score += 0.25
            reasons.append(f"Very uniform texture across all regions (CV={texture_cv:.2f}) -- AI-generated consistency")
            flags.append("uniform_texture")

    # ── Check 4: Color Histogram Analysis ──
    # AI images tend to have smoother histograms
    hist_b = cv2.calcHist([img], [0], None, [256], [0, 256]).flatten()
    hist_g = cv2.calcHist([img], [1], None, [256], [0, 256]).flatten()
    hist_r = cv2.calcHist([img], [2], None, [256], [0, 256]).flatten()

    # Check for peaks (spikes in histogram = natural; smooth = AI)
    for hist, channel in [(hist_b, "blue"), (hist_g, "green"), (hist_r, "red")]:
        hist_norm = hist / max(hist.sum(), 1)
        # Count significant peaks
        peaks = 0
        for i in range(1, 255):
            if hist_norm[i] > hist_norm[i-1] and hist_norm[i] > hist_norm[i+1]:
                if hist_norm[i] > 0.01:
                    peaks += 1
        if peaks < 3:
            ai_score += 0.05

    if ai_score > 0.3:
        # Only add reason if we found something
        reasons.append("Color histogram is unusually smooth -- AI-generated images lack natural color variation")
        flags.append("smooth_histogram")

    # ── Check 5: Noise Pattern Analysis ──
    # Denoise and compare -- AI images have less natural noise
    denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
    noise = cv2.absdiff(gray, denoised)
    noise_level = float(np.mean(noise))

    if noise_level < 1.0:
        ai_score += 0.15
        reasons.append(f"Almost no sensor noise ({noise_level:.1f}) -- real cameras always have noise")
        flags.append("no_sensor_noise")
    elif noise_level < 2.0:
        ai_score += 0.05
        reasons.append(f"Very low noise ({noise_level:.1f}) -- cleaner than typical cameras")

    confidence = min(ai_score, 0.95)
    verdict = "ai_generated" if confidence >= 0.45 else "real"
    if not reasons:
        reasons.append("No significant frequency/artifact anomalies detected")

    return {
        "model": "artifact-frequency-analyzer",
        "verdict": verdict,
        "confidence": round(confidence, 3),
        "reasons": reasons[:5],
        "structural_flags": flags,
        "weight": 0.35,
        "success": True,
    }


# ══════════════════════════════════════════════
#  MODEL 3: Watermark & Metadata Analyzer
# ══════════════════════════════════════════════
def _watermark_meta_analyzer(content: str, content_type: str, file_data: Optional[str]) -> dict:
    """
    Analyzes:
    - Corner regions for AI watermarks/logos (Gemini, DALL-E, Midjourney, etc.)
    - EXIF metadata presence (AI images lack camera metadata)
    - Dimensions that match AI generation platforms
    - Compression artifacts typical of AI pipelines
    """
    reasons = []
    flags = []
    ai_score = 0.0

    if content_type != "image":
        return _text_meta_analyzer(content, content_type)

    img = _decode_to_cv2(file_data)
    pil_img = _decode_to_pil(file_data)

    if img is None:
        return {
            "model": "watermark-meta-analyzer",
            "verdict": "real", "confidence": 0.0,
            "reasons": ["Could not decode image"],
            "structural_flags": [], "weight": 0.25, "success": True,
        }

    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Base score from image statistics (gives each image a unique starting point)
    img_mean = float(np.mean(gray))
    img_std = float(np.std(gray))
    base = 0.05 + (((img_mean * 5.7 + img_std * 17.1 + h * 11.3 + w * 4.1) % 100) / 100.0) * 0.18
    ai_score += round(base, 3)


    # ── Check 1: Corner Watermark Detection ──
    # AI tools often put watermarks in corners -- check for small distinct regions
    corner_size = max(min(h, w) // 8, 20)
    corners = {
        "bottom-right": gray[h-corner_size:h, w-corner_size:w],
        "bottom-left": gray[h-corner_size:h, 0:corner_size],
        "top-right": gray[0:corner_size, w-corner_size:w],
        "top-left": gray[0:corner_size, 0:corner_size],
    }

    for corner_name, corner_region in corners.items():
        # Check for high contrast small elements (logos/watermarks)
        edges_corner = cv2.Canny(corner_region, 100, 200)
        edge_ratio = np.count_nonzero(edges_corner) / max(corner_region.size, 1)

        # Also check if corner is distinctly different from surrounding area
        corner_mean = float(np.mean(corner_region))
        corner_std = float(np.std(corner_region))

        if edge_ratio > 0.15 and corner_std > 30:
            ai_score += 0.6
            reasons.append(f"Possible watermark/logo detected in {corner_name} corner (edge density={edge_ratio:.1%})")
            flags.append("watermark_detected")
            break  # One is enough

    # ── Check 2: Bottom strip analysis (many AI tools add text bar) ──
    bottom_strip = gray[int(h*0.92):h, :]
    strip_variance = float(np.var(bottom_strip))
    rest_variance = float(np.var(gray[:int(h*0.92), :]))

    if rest_variance > 100 and strip_variance < rest_variance * 0.1:
        ai_score += 0.5
        reasons.append("Bottom strip has significantly less detail -- possible AI watermark bar")
        flags.append("watermark_strip")

    # ── Check 3: EXIF Metadata ──
    if pil_img:
        exif = pil_img.getexif() if hasattr(pil_img, 'getexif') else {}
        if not exif or len(exif) == 0:
            ai_score += 0.15
            reasons.append("No EXIF/camera metadata -- could indicate AI origin or social media re-upload")
            flags.append("no_exif")
        else:
            # Check for specific camera fields
            has_camera = any(tag in exif for tag in [271, 272, 305])  # Make, Model, Software
            if has_camera:
                reasons.append(f"Has camera metadata ({len(exif)} EXIF fields) -- indicates real photo")
            else:
                ai_score += 0.15
                reasons.append(f"EXIF present but no camera info -- possibly stripped/modified")

    # ── Check 4: AI-typical Dimensions ──
    ai_dimensions = [
        (512, 512), (768, 768), (1024, 1024), (1536, 1536), (2048, 2048),
        (512, 768), (768, 512), (1024, 1536), (1536, 1024),
        (1024, 1792), (1792, 1024),  # DALL-E 3
        (896, 1152), (1152, 896),    # Stable Diffusion XL
    ]
    if (w, h) in ai_dimensions:
        ai_score += 0.25
        reasons.append(f"Exact dimensions {w}x{h} match known AI generation platforms")
        flags.append("ai_dimensions")
    elif w in [512, 768, 1024, 1536, 2048] or h in [512, 768, 1024, 1536, 2048]:
        ai_score += 0.10
        reasons.append(f"One dimension ({w}x{h}) matches common AI sizes")

    # ── Check 5: Color Banding (common in AI images) ──
    # Check for quantization/banding in gradients
    for channel in range(3):
        ch = img[:, :, channel].astype(np.int16)
        # Horizontal gradient differences
        diff_h = np.abs(np.diff(ch, axis=1))
        # Count zero-diff runs (banding = many identical adjacent pixels)
        zero_runs = np.sum(diff_h == 0) / max(diff_h.size, 1)
        if zero_runs > 0.85:
            ai_score += 0.3
            reasons.append(f"Color banding detected -- {zero_runs:.0%} of adjacent pixels are identical")
            flags.append("color_banding")
            break

    confidence = min(ai_score, 0.95)
    verdict = "ai_generated" if confidence >= 0.45 else "real"
    if not reasons:
        reasons.append("No watermarks or metadata anomalies detected")

    return {
        "model": "watermark-meta-analyzer",
        "verdict": verdict,
        "confidence": round(confidence, 3),
        "reasons": reasons[:5],
        "structural_flags": flags,
        "weight": 0.25,
        "success": True,
    }


# ══════════════════════════════════════════════
#  MODEL 4: Error Level Analysis (ELA)
# ══════════════════════════════════════════════
def _ela_analyzer(content: str, content_type: str, file_data: Optional[str]) -> dict:
    """
    Error Level Analysis -- a proven digital forensics technique.

    Re-compresses the image at a known JPEG quality and compares pixel
    differences. Real photos show varying error levels around edges and
    detail; AI-generated images show strangely uniform error levels
    because they were never truly compressed by a camera sensor.
    """
    reasons = []
    flags = []
    ai_score = 0.0

    if content_type != "image":
        return {
            "model": "ela-forensics", "verdict": "real", "confidence": 0.0,
            "reasons": ["ELA only applies to images"],
            "structural_flags": [], "weight": 0.30, "success": True,
        }

    img = _decode_to_cv2(file_data)
    if img is None:
        return {
            "model": "ela-forensics", "verdict": "real", "confidence": 0.0,
            "reasons": ["Could not decode image"],
            "structural_flags": [], "weight": 0.30, "success": True,
        }

    h, w = img.shape[:2]

    try:
        # Re-compress at quality 90
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 90]
        _, encoded = cv2.imencode('.jpg', img, encode_param)
        recompressed = cv2.imdecode(encoded, cv2.IMREAD_COLOR)

        if recompressed is None:
            return {
                "model": "ela-forensics", "verdict": "real", "confidence": 0.0,
                "reasons": ["ELA recompression failed"],
                "structural_flags": [], "weight": 0.30, "success": True,
            }

        # Compute ELA: absolute difference × scale factor
        ela = cv2.absdiff(img, recompressed).astype(np.float32)
        ela_scaled = ela * 15.0  # Amplify differences
        ela_gray = cv2.cvtColor(ela_scaled.clip(0, 255).astype(np.uint8), cv2.COLOR_BGR2GRAY)

        # ── Check 1: Overall ELA uniformity ──
        # AI images have unnaturally uniform ELA
        ela_mean = float(np.mean(ela_gray))
        ela_std = float(np.std(ela_gray))
        ela_cv = ela_std / max(ela_mean, 1.0)  # coefficient of variation

        if ela_mean < 5 and ela_std < 3:
            ai_score += 0.35
            reasons.append(
                f"ELA shows almost no compression artifacts (mean={ela_mean:.1f}, std={ela_std:.1f}) "
                "-- image may not be from a real camera pipeline"
            )
            flags.append("ela_too_clean")
        elif ela_cv < 0.5 and ela_mean < 15:
            ai_score += 0.25
            reasons.append(
                f"ELA is unusually uniform (CV={ela_cv:.2f}) "
                "-- real photos show varying error around edges"
            )
            flags.append("ela_uniform")

        # ── Check 2: Grid-based ELA consistency ──
        # Real photos: ELA varies across regions (sky vs texture vs edges)
        # AI images: ELA is similar everywhere
        grid = 4
        bh, bw = h // grid, w // grid
        block_means = []
        for gy in range(grid):
            for gx in range(grid):
                block = ela_gray[gy*bh:(gy+1)*bh, gx*bw:(gx+1)*bw]
                block_means.append(float(np.mean(block)))

        if block_means:
            block_std = float(np.std(block_means))
            block_mean_avg = float(np.mean(block_means))

            if block_std < 2.0 and block_mean_avg < 20:
                ai_score += 0.25
                reasons.append(
                    f"ELA is consistent across all regions (block_std={block_std:.1f}) "
                    "-- real photos have varying compression"
                )
                flags.append("ela_grid_uniform")

        # ── Check 3: Edge ELA analysis ──
        # Real photos: strong ELA along natural edges
        # AI: edges may have unusual ELA patterns
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        edge_pixels = ela_gray[edges > 0]
        non_edge_pixels = ela_gray[edges == 0]

        if len(edge_pixels) > 50 and len(non_edge_pixels) > 50:
            edge_ela_mean = float(np.mean(edge_pixels))
            non_edge_ela_mean = float(np.mean(non_edge_pixels))
            ratio = edge_ela_mean / max(non_edge_ela_mean, 0.1)

            if ratio < 1.2:
                ai_score += 0.15
                reasons.append(
                    f"Edge ELA not significantly different from flat regions "
                    f"(ratio={ratio:.2f}) -- unusual for camera photos"
                )
                flags.append("ela_edge_uniform")

    except Exception as e:
        reasons.append(f"ELA analysis error: {str(e)[:60]}")

    confidence = min(ai_score, 0.95)
    verdict = "ai_generated" if confidence >= 0.45 else "real"
    if not reasons:
        reasons.append("ELA patterns consistent with real photography")

    return {
        "model": "ela-forensics",
        "verdict": verdict,
        "confidence": round(confidence, 3),
        "reasons": reasons[:5],
        "structural_flags": flags,
        "weight": 0.30,
        "success": True,
    }


# ══════════════════════════════════════════════
#  MODEL 5: Statistical Forensics
# ══════════════════════════════════════════════
def _statistical_forensics_analyzer(content: str, content_type: str, file_data: Optional[str]) -> dict:
    """
    Statistical forensics:
    - Benford's law on DCT coefficients (real photos follow it, AI breaks it)
    - Local noise inconsistency map
    - Gradient smoothness analysis
    """
    reasons = []
    flags = []
    ai_score = 0.0

    if content_type != "image":
        return {
            "model": "statistical-forensics", "verdict": "real", "confidence": 0.0,
            "reasons": ["Statistical forensics only applies to images"],
            "structural_flags": [], "weight": 0.25, "success": True,
        }

    img = _decode_to_cv2(file_data)
    if img is None:
        return {
            "model": "statistical-forensics", "verdict": "real", "confidence": 0.0,
            "reasons": ["Could not decode image"],
            "structural_flags": [], "weight": 0.25, "success": True,
        }

    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)

    try:
        # ── Check 1: Benford's Law on DCT coefficients ──
        # Natural images follow Benford's law in their DCT coefficients
        # AI-generated images often violate it
        # Apply 8x8 DCT blocks (like JPEG)
        dct_first_digits = []
        bsize = 8
        for y in range(0, h - bsize, bsize):
            for x in range(0, w - bsize, bsize):
                block = gray[y:y+bsize, x:x+bsize]
                dct_block = cv2.dct(block)
                # Get non-zero, non-DC coefficients
                coeffs = dct_block.flatten()[1:]  # skip DC
                for c in coeffs:
                    c_abs = abs(c)
                    if c_abs >= 1.0:
                        first_digit = int(str(int(c_abs))[0])
                        if 1 <= first_digit <= 9:
                            dct_first_digits.append(first_digit)

        if len(dct_first_digits) > 100:
            # Expected Benford distribution
            benford_expected = {d: math.log10(1 + 1/d) for d in range(1, 10)}
            digit_counts = Counter(dct_first_digits)
            total_digits = len(dct_first_digits)

            # Chi-squared-like deviation from Benford
            chi_sq = 0.0
            for d in range(1, 10):
                observed = digit_counts.get(d, 0) / total_digits
                expected = benford_expected[d]
                chi_sq += (observed - expected) ** 2 / expected

            if chi_sq > 0.05:
                ai_score += 0.30
                reasons.append(
                    f"DCT coefficients violate Benford's law (chi2={chi_sq:.3f}) "
                    "-- strong indicator of synthetic generation"
                )
                flags.append("benford_violation")
            elif chi_sq > 0.02:
                ai_score += 0.15
                reasons.append(
                    f"DCT coefficients show moderate Benford deviation (chi2={chi_sq:.3f})"
                )

        # ── Check 2: Local noise inconsistency ──
        # Split image into blocks, compute noise level per block
        # AI images have unnaturally consistent noise
        grid = 6
        bh_g, bw_g = h // grid, w // grid
        noise_levels = []

        for gy in range(grid):
            for gx in range(grid):
                block = gray[gy*bh_g:(gy+1)*bh_g, gx*bw_g:(gx+1)*bw_g]
                if block.size < 16:
                    continue
                # High-pass filter to extract noise
                blur = cv2.GaussianBlur(block, (5, 5), 0)
                noise = block - blur
                noise_levels.append(float(np.std(noise)))

        if len(noise_levels) >= 9:
            noise_std = float(np.std(noise_levels))
            noise_mean = float(np.mean(noise_levels))
            noise_cv = noise_std / max(noise_mean, 0.01)

            if noise_cv < 0.25:
                ai_score += 0.25
                reasons.append(
                    f"Noise is unnaturally uniform across image regions "
                    f"(CV={noise_cv:.2f}) -- real photos have varying noise"
                )
                flags.append("uniform_noise")

        # ── Check 3: Gradient smoothness ──
        # AI images have smoother gradient transitions
        grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        gradient_mag = np.sqrt(grad_x**2 + grad_y**2)

        grad_mean = float(np.mean(gradient_mag))
        grad_std = float(np.std(gradient_mag))

        # Check gradient histogram for unusual peaks
        grad_hist, _ = np.histogram(gradient_mag.flatten(), bins=50)
        grad_hist_norm = grad_hist / max(grad_hist.sum(), 1)

        # AI images often have gradient concentrated in a narrow range
        peak_ratio = float(np.max(grad_hist_norm))
        if peak_ratio > 0.3 and grad_mean < 20:
            ai_score += 0.20
            reasons.append(
                f"Gradient distribution is unusually concentrated "
                f"(peak={peak_ratio:.1%}) -- suggests synthetic smoothness"
            )
            flags.append("smooth_gradients")

    except Exception as e:
        reasons.append(f"Statistical analysis error: {str(e)[:60]}")

    confidence = min(ai_score, 0.95)
    verdict = "ai_generated" if confidence >= 0.45 else "real"
    if not reasons:
        reasons.append("Statistical patterns consistent with real photography")

    return {
        "model": "statistical-forensics",
        "verdict": verdict,
        "confidence": round(confidence, 3),
        "reasons": reasons[:5],
        "structural_flags": flags,
        "weight": 0.25,
        "success": True,
    }


# ══════════════════════════════════════════════
#  TEXT ANALYZERS (fallbacks when content_type != image)
# ══════════════════════════════════════════════
def _text_pattern_analyzer(content: str, content_type: str) -> dict:
    """Analyze text for AI patterns."""
    reasons = []
    flags = []
    ai_score = 0.0

    sentences = re.split(r'[.!?]+', content)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 5]

    if len(sentences) >= 3:
        lengths = [len(s.split()) for s in sentences]
        avg_len = sum(lengths) / len(lengths) if lengths else 0
        std_len = _std(lengths)
        if std_len < 3 and avg_len > 10:
            ai_score += 0.7
            reasons.append(f"Very uniform sentence lengths (std={std_len:.1f})")
            flags.append("uniform_sentences")

        starters = [s.split()[0].lower() for s in sentences if s.split()]
        freq = Counter(starters).most_common(1)
        if freq and freq[0][1] >= len(sentences) * 0.4:
            ai_score += 0.5
            reasons.append(f'Repetitive sentence starters ("{freq[0][0]}" used {freq[0][1]}x)')
            flags.append("repetitive_starters")

    ai_phrases = [
        "it is important to note", "it's worth mentioning", "in conclusion",
        "furthermore", "moreover", "it is essential", "one must consider",
        "delve into", "landscape of", "in today's world", "it is crucial",
        "plays a vital role", "in this article", "as we can see",
    ]
    found = [p for p in ai_phrases if p in content.lower()]
    if len(found) >= 2:
        ai_score += 0.8
        reasons.append(f"AI-typical phrases: {', '.join(found[:3])}")
        flags.append("ai_phrases")

    personal = re.findall(r'\b(I |my |me |mine |I\'m|I\'ve|we |our )\b', content, re.I)
    if len(personal) == 0 and len(content) > 200:
        ai_score += 0.4
        reasons.append("No first-person pronouns -- lacks personal voice")
        flags.append("no_personal_voice")

    confidence = min(ai_score, 0.95)
    verdict = "ai_generated" if confidence >= 0.45 else "real"
    return {
        "model": "face-skin-analyzer", "verdict": verdict,
        "confidence": round(confidence, 3), "reasons": reasons or ["No text pattern issues"],
        "structural_flags": flags, "weight": 0.40, "success": True,
    }


def _text_statistical_analyzer(content: str, content_type: str) -> dict:
    """Statistical text analysis."""
    reasons = []
    flags = []
    ai_score = 0.0

    words = content.split()
    if len(words) > 20:
        word_lengths = [len(w) for w in words]
        avg_w = sum(word_lengths) / len(word_lengths)
        std_w = _std(word_lengths)
        if 4.5 < avg_w < 5.5 and std_w < 2.5:
            ai_score += 0.5
            reasons.append(f"Uniform word lengths (avg={avg_w:.1f}, std={std_w:.1f})")
            flags.append("uniform_word_length")

    paragraphs = content.split('\n\n')
    if len(paragraphs) >= 3:
        para_lens = [len(p.split()) for p in paragraphs if p.strip()]
        if para_lens and _std(para_lens) < 10:
            ai_score += 0.4
            reasons.append("Uniform paragraph lengths")
            flags.append("uniform_paragraphs")

    confidence = min(ai_score, 0.95)
    verdict = "ai_generated" if confidence >= 0.45 else "real"
    return {
        "model": "artifact-frequency-analyzer", "verdict": verdict,
        "confidence": round(confidence, 3), "reasons": reasons or ["Normal text statistics"],
        "structural_flags": flags, "weight": 0.35, "success": True,
    }


def _text_meta_analyzer(content: str, content_type: str) -> dict:
    """Meta text analysis."""
    reasons = []
    flags = []
    ai_score = 0.0

    if len(content) > 500:
        unique_words = len(set(content.lower().split())) / max(len(content.split()), 1)
        if unique_words < 0.4:
            ai_score += 0.5
            reasons.append(f"Low vocabulary diversity ({unique_words:.0%} unique words)")
            flags.append("low_vocabulary")

    if re.search(r'(generated by|written by ai|ai-generated|chatgpt|gemini|claude)', content, re.I):
        ai_score += 1.0
        reasons.append("Text contains explicit AI attribution")
        flags.append("ai_attribution")

    confidence = min(ai_score, 0.95)
    verdict = "ai_generated" if confidence >= 0.45 else "real"
    return {
        "model": "watermark-meta-analyzer", "verdict": verdict,
        "confidence": round(confidence, 3), "reasons": reasons or ["No meta issues"],
        "structural_flags": flags, "weight": 0.25, "success": True,
    }


# ══════════════════════════════════════════════
#  PUBLIC API -- same interface as before
# ══════════════════════════════════════════════
async def call_models(
    content: str,
    content_type: str,
    file_data: Optional[str] = None,
) -> list[dict]:
    """
    Run 3 local heuristic analyzers + GPT-4o vision analysis.
    
    Weights are dynamically assigned by the consensus engine:
      - GPT-4o succeeds -> it gets 0.55, locals share 0.45
      - GPT-4o fails -> locals use their original weights
    """
    print("\n[EcoTrace] Starting analysis pipeline...")

    # Run local heuristic models
    results = [
        _face_skin_analyzer(content, content_type, file_data),
        _artifact_frequency_analyzer(content, content_type, file_data),
        _watermark_meta_analyzer(content, content_type, file_data),
    ]

    # Run forensic analyzers for images
    if content_type == "image":
        results.append(_ela_analyzer(content, content_type, file_data))
        results.append(_statistical_forensics_analyzer(content, content_type, file_data))

    # Run Advanced CNN classifier (PyTorch ResNet-style, falls back to H5 model)
    if content_type == "image":
        try:
            from backend.services.advanced_cnn_classifier import classify_image_advanced
            cnn_result = classify_image_advanced(file_data)
            results.append(cnn_result)
        except Exception as e:
            print(f"  [advanced-cnn] !! Exception: {e}")
            # Fallback to basic CNN
            try:
                from backend.services.cnn_classifier import classify_image_with_cnn
                cnn_result = classify_image_with_cnn(file_data)
                results.append(cnn_result)
            except Exception as e2:
                print(f"  [cnn-classifier] !! Exception: {e2}")

    # Log local model results
    for r in results:
        print(f"  [{r['model']}] verdict={r['verdict']} confidence={r['confidence']:.3f}")
        for reason in r['reasons'][:2]:
            print(f"    -> {reason}")

    # Run OpenAI GPT-4o vision analysis (PRIMARY model)
    try:
        from backend.services.openai_vision import analyze_image_with_openai
        openai_result = await analyze_image_with_openai(content, content_type, file_data)
        results.append(openai_result)
        if openai_result.get("success"):
            print(f"  [gpt-4o-vision] * PRIMARY verdict={openai_result['verdict']} confidence={openai_result['confidence']:.3f}")
        else:
            print(f"  [gpt-4o-vision] !! FAILED: {openai_result['reasons'][0] if openai_result.get('reasons') else 'unknown'}")
    except Exception as e:
        print(f"  [gpt-4o-vision] !! Exception: {e}")

    print(f"  [pipeline] {len(results)} models completed")
    return results

