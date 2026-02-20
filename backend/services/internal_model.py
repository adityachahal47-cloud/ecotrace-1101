"""
Internal Model — Metadata/EXIF analysis and basic heuristics.

Provides a behavioral score and scam risk assessment
independent of the OpenRouter AI models.
"""

import io
import re
import base64
from typing import Optional

try:
    from PIL import Image
    from PIL.ExifTags import TAGS
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


def analyze_image_metadata(file_data: Optional[str] = None) -> dict:
    """
    Analyze image metadata/EXIF data for AI indicators.

    Returns:
        {
            "behavioral_score": float (0-1, higher = more likely AI),
            "scam_risk_score": float (0-1),
            "flags": list[str]
        }
    """
    result = {
        "behavioral_score": 0.0,
        "scam_risk_score": 0.0,
        "flags": [],
    }

    if not file_data or not HAS_PIL:
        return result

    try:
        # Decode base64 image
        if "base64," in file_data:
            img_data = file_data.split("base64,")[1]
        else:
            img_data = file_data

        image_bytes = base64.b64decode(img_data)
        img = Image.open(io.BytesIO(image_bytes))

        # Check for EXIF data — AI images typically lack it
        exif = img.getexif()
        if not exif:
            result["flags"].append("No EXIF metadata found (common in AI-generated images)")
            result["behavioral_score"] += 0.2
        else:
            exif_tags = {TAGS.get(k, k): v for k, v in exif.items()}

            # Check for camera info
            if "Make" not in exif_tags and "Model" not in exif_tags:
                result["flags"].append("No camera information in metadata")
                result["behavioral_score"] += 0.15

            # Check for software tags
            software = exif_tags.get("Software", "")
            if isinstance(software, str):
                ai_software = ["stable diffusion", "midjourney", "dall-e", "comfyui", "automatic1111"]
                for ai_sw in ai_software:
                    if ai_sw in software.lower():
                        result["flags"].append(f"AI generation software detected: {software}")
                        result["behavioral_score"] += 0.4
                        break

        # Check resolution — AI images often have specific resolutions
        width, height = img.size
        ai_resolutions = [(512, 512), (768, 768), (1024, 1024), (1024, 768), (768, 1024)]
        if (width, height) in ai_resolutions:
            result["flags"].append(f"Resolution {width}x{height} is common for AI-generated images")
            result["behavioral_score"] += 0.1

        # Check color profile
        if img.mode == "RGB" and not exif:
            result["flags"].append("RGB without color profile (typical of AI output)")
            result["behavioral_score"] += 0.05

        # Cap at 1.0
        result["behavioral_score"] = min(result["behavioral_score"], 1.0)

    except Exception as e:
        result["flags"].append(f"Metadata analysis error: {str(e)[:80]}")

    return result


def analyze_text_heuristics(text: str) -> dict:
    """
    Basic heuristic analysis for AI-generated text.

    Returns:
        {
            "behavioral_score": float (0-1, higher = more likely AI),
            "scam_risk_score": float (0-1),
            "flags": list[str]
        }
    """
    result = {
        "behavioral_score": 0.0,
        "scam_risk_score": 0.0,
        "flags": [],
    }

    if not text or len(text) < 20:
        return result

    words = text.split()
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]

    # Check for common AI patterns
    ai_phrases = [
        "as an ai", "i cannot", "it's important to note",
        "it is worth noting", "in conclusion", "furthermore",
        "delve into", "it's crucial", "landscape",
        "tapestry", "multifaceted", "comprehensive",
        "leverage", "foster", "paradigm",
        "in the realm of", "navigating the",
    ]

    phrase_count = 0
    for phrase in ai_phrases:
        if phrase in text.lower():
            phrase_count += 1
            if phrase_count <= 3:
                result["flags"].append(f'Common AI phrase detected: "{phrase}"')

    if phrase_count > 0:
        result["behavioral_score"] += min(phrase_count * 0.1, 0.4)

    # Check for very uniform sentence length
    if len(sentences) > 3:
        lengths = [len(s.split()) for s in sentences if len(s.split()) > 2]
        if lengths:
            avg_len = sum(lengths) / len(lengths)
            variance = sum((l - avg_len) ** 2 for l in lengths) / len(lengths)
            if variance < 5:
                result["flags"].append("Very uniform sentence length (AI indicator)")
                result["behavioral_score"] += 0.15

    # Check for excessive bullet points or structured formatting
    bullet_count = text.count("•") + text.count("- ") + text.count("* ")
    if bullet_count > 5:
        result["flags"].append("Heavy use of bullet points/lists")
        result["behavioral_score"] += 0.1

    # Scam risk indicators
    scam_phrases = [
        "act now", "limited time", "click here", "urgent",
        "congratulations", "you've won", "wire transfer",
        "social security", "password", "verify your account",
    ]

    scam_count = 0
    for phrase in scam_phrases:
        if phrase in text.lower():
            scam_count += 1
            if scam_count <= 3:
                result["flags"].append(f'Scam indicator: "{phrase}"')

    if scam_count > 0:
        result["scam_risk_score"] = min(scam_count * 0.2, 1.0)

    result["behavioral_score"] = min(result["behavioral_score"], 1.0)

    return result


def analyze_content(content: str, content_type: str, file_data: Optional[str] = None) -> dict:
    """
    Run internal analysis based on content type.
    """
    if content_type == "image":
        return analyze_image_metadata(file_data)
    elif content_type == "text":
        return analyze_text_heuristics(content)
    elif content_type == "video":
        # Video analysis is limited without actual video processing
        return {
            "behavioral_score": 0.0,
            "scam_risk_score": 0.1,
            "flags": ["Video metadata analysis requires specialized tools"],
        }
    return {"behavioral_score": 0.0, "scam_risk_score": 0.0, "flags": []}
