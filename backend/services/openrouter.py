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
    checks = 0

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

    # ── Face Detection ──
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )
    eye_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_eye.xml"
    )

    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    if len(faces) > 0:
        checks += 5

        for (fx, fy, fw, fh) in faces[:3]:  # Analyze up to 3 faces
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

                if symmetry_score < 8:
                    ai_score += 1.0
                    reasons.append(f"Face is unnaturally symmetrical (diff={symmetry_score:.1f}) -- AI faces are often too perfect")
                    flags.append("unnatural_symmetry")
                elif symmetry_score > 45:
                    ai_score += 0.6
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

                if lap_var < 50:
                    ai_score += 1.0
                    reasons.append(f"Skin is unnaturally smooth (texture={lap_var:.0f}) -- AI lacks pores/texture")
                    flags.append("unnaturally_smooth_skin")
                elif lap_var < 150:
                    ai_score += 0.4
                    reasons.append(f"Skin smoothness is borderline (texture={lap_var:.0f})")

            # Check 3: Eye detection within face
            eyes = eye_cascade.detectMultiScale(face_roi_gray, scaleFactor=1.1, minNeighbors=5)
            if len(eyes) == 0:
                ai_score += 0.5
                reasons.append("No eyes detected within face -- possible AI deformity")
                flags.append("missing_eyes")
            elif len(eyes) == 1:
                ai_score += 0.3
                reasons.append("Only one eye detected -- possible asymmetric face rendering")
            elif len(eyes) >= 2:
                # Check eye alignment
                eye_centers = sorted([(ex + ew//2, ey + eh//2) for ex, ey, ew, eh in eyes[:2]])
                eye_angle = abs(math.atan2(
                    eye_centers[1][1] - eye_centers[0][1],
                    eye_centers[1][0] - eye_centers[0][0]
                )) * 180 / math.pi
                if eye_angle > 15:
                    ai_score += 0.5
                    reasons.append(f"Eyes misaligned by {eye_angle:.0f}° -- possible AI artifact")
                    flags.append("eye_misalignment")

        # Check 4: Multiple faces check
        if len(faces) > 3:
            ai_score += 0.3
            reasons.append(f"Unusually many faces detected ({len(faces)}) -- AI group images often have deformities")

        # Check 5: Skin color consistency across image
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        skin_mask_full = cv2.inRange(hsv, np.array([0, 20, 70]), np.array([30, 255, 255]))
        skin_ratio = np.count_nonzero(skin_mask_full) / (h * w)

        if skin_ratio > 0.6:
            ai_score += 0.4
            reasons.append(f"Very high skin-tone coverage ({skin_ratio:.0%}) -- unusual for natural photos")
            flags.append("excessive_skin_tone")

    else:
        checks += 2
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
                ai_score += 0.8
                reasons.append(f"Elongated skin region with low solidity -- possible deformed fingers")
                flags.append("deformed_fingers")
                break

        reasons.append(f"No faces detected -- skin coverage: {skin_ratio:.0%}")

    confidence = min(ai_score / max(checks, 1), 0.95)
    verdict = "ai_generated" if confidence > 0.35 else "real"
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
    checks = 0

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
    checks += 5

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

        if high_freq_ratio < 0.3:
            ai_score += 0.8
            reasons.append(f"Steep frequency rolloff ({high_freq_ratio:.2f}) -- AI images lack high-frequency detail")
            flags.append("low_high_frequency")
        elif high_freq_ratio < 0.5:
            ai_score += 0.4
            reasons.append(f"Moderate frequency rolloff ({high_freq_ratio:.2f})")

    # ── Check 2: Edge Consistency ──
    edges = cv2.Canny(gray, 50, 150)
    edge_density = np.count_nonzero(edges) / (h * w)

    if edge_density < 0.02:
        ai_score += 0.7
        reasons.append(f"Very few edges ({edge_density:.1%}) -- unnaturally smooth rendering")
        flags.append("low_edge_density")
    elif edge_density > 0.25:
        ai_score += 0.3
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
            ai_score += 0.7
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
            ai_score += 0.15

    if ai_score > 0.3:
        # Only add reason if we found something
        reasons.append("Color histogram is unusually smooth -- AI-generated images lack natural color variation")
        flags.append("smooth_histogram")

    # ── Check 5: Noise Pattern Analysis ──
    # Denoise and compare -- AI images have less natural noise
    denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
    noise = cv2.absdiff(gray, denoised)
    noise_level = float(np.mean(noise))

    if noise_level < 1.5:
        ai_score += 0.6
        reasons.append(f"Almost no sensor noise ({noise_level:.1f}) -- real cameras always have noise")
        flags.append("no_sensor_noise")
    elif noise_level < 3:
        ai_score += 0.3
        reasons.append(f"Very low noise ({noise_level:.1f}) -- cleaner than typical cameras")

    confidence = min(ai_score / max(checks, 1), 0.95)
    verdict = "ai_generated" if confidence > 0.35 else "real"
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
    checks = 0

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
    checks += 5

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
            ai_score += 0.7
            reasons.append("No EXIF/camera metadata -- AI-generated images never have camera data")
            flags.append("no_exif")
        else:
            # Check for specific camera fields
            has_camera = any(tag in exif for tag in [271, 272, 305])  # Make, Model, Software
            if has_camera:
                reasons.append(f"Has camera metadata ({len(exif)} EXIF fields) -- indicates real photo")
            else:
                ai_score += 0.3
                reasons.append(f"EXIF present but no camera info -- possibly stripped/modified")

    # ── Check 4: AI-typical Dimensions ──
    ai_dimensions = [
        (512, 512), (768, 768), (1024, 1024), (1536, 1536), (2048, 2048),
        (512, 768), (768, 512), (1024, 1536), (1536, 1024),
        (1024, 1792), (1792, 1024),  # DALL-E 3
        (896, 1152), (1152, 896),    # Stable Diffusion XL
    ]
    if (w, h) in ai_dimensions:
        ai_score += 0.8
        reasons.append(f"Exact dimensions {w}x{h} match known AI generation platforms")
        flags.append("ai_dimensions")
    elif w in [512, 768, 1024, 1536, 2048] or h in [512, 768, 1024, 1536, 2048]:
        ai_score += 0.3
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

    confidence = min(ai_score / max(checks, 1), 0.95)
    verdict = "ai_generated" if confidence > 0.35 else "real"
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
#  TEXT ANALYZERS (fallbacks when content_type != image)
# ══════════════════════════════════════════════
def _text_pattern_analyzer(content: str, content_type: str) -> dict:
    """Analyze text for AI patterns."""
    reasons = []
    flags = []
    ai_score = 0.0
    checks = 4

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

    confidence = min(ai_score / max(checks, 1), 0.95)
    verdict = "ai_generated" if confidence > 0.4 else "real"
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
    checks = 3

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

    confidence = min(ai_score / max(checks, 1), 0.95)
    verdict = "ai_generated" if confidence > 0.4 else "real"
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
    checks = 2

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

    confidence = min(ai_score / max(checks, 1), 0.95)
    verdict = "ai_generated" if confidence > 0.4 else "real"
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
    Run 3 local analyzers. Same interface as the old OpenRouter service.
    """
    results = [
        _face_skin_analyzer(content, content_type, file_data),
        _artifact_frequency_analyzer(content, content_type, file_data),
        _watermark_meta_analyzer(content, content_type, file_data),
    ]

    # Log results
    for r in results:
        print(f"  [{r['model']}] verdict={r['verdict']} confidence={r['confidence']}")
        for reason in r['reasons']:
            print(f"    -> {reason}")

    return results
