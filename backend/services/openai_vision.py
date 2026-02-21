"""
OpenAI Vision Analyzer — Uses GPT-4o to analyze images for AI-generated content.

This is the PRIMARY model in the EcoTrace pipeline. Its verdict gets the
highest weight (0.55) in the consensus calculation.
"""

import os
import json
import base64
from typing import Optional

try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

SYSTEM_PROMPT = """You are a world-class forensic analyst specializing in detecting AI-generated images (from DALL-E, Midjourney, Stable Diffusion, Flux, etc.) vs real photographs.

You MUST analyze the image methodically through these lenses:

1. **HANDS & FINGERS**: Count fingers on every visible hand. Look for fused, extra, missing, or oddly bent fingers. AI consistently fails here.

2. **FACE & SKIN**: Check for:
   - Plastic/waxy skin with no visible pores
   - Asymmetric ears, nostrils, or eyes
   - Teeth that blur together or have wrong count
   - Hair that merges into background or skin

3. **TEXT & WRITING**: Any text in the image? AI generates gibberish or misspelled text. Real photos have legible text.

4. **LIGHTING & SHADOWS**: Do shadows match light sources? AI often has inconsistent shadow directions or missing shadows.

5. **BACKGROUND**: Look for:
   - Objects that fade, merge, or make no physical sense
   - Repeating patterns (AI tiling artifacts)
   - Impossible geometry (stairs to nowhere, extra limbs on background people)

6. **TEXTURE & DETAIL**: 
   - Zoom into fabric, hair, jewelry — AI smooths these unnaturally
   - Natural photos have sensor noise/grain; AI images are too clean
   - Real photos have depth-of-field blur that's optically correct

7. **COMPOSITION**: AI images are often "too perfect" — perfectly centered subjects, impossibly beautiful lighting, stock-photo-like composition.

8. **KNOWN AI STYLES**: Some images have the distinctive "Midjourney look" (hyper-detailed fantasy), "DALL-E look" (slightly dreamy), or "Stable Diffusion look" (sometimes has subtle color banding).

IMPORTANT RULES:
- A professionally shot photo CAN look very polished — that alone does NOT make it AI.
- Social media filters/editing do NOT make a photo AI-generated.
- If you are uncertain, lean toward the more likely classification but reflect that in a lower confidence score (0.4-0.6).
- Your confidence should be HIGH (>0.8) only when you see clear, specific evidence.

Respond ONLY with valid JSON:
{
  "verdict": "ai_generated" or "real",
  "confidence": 0.0 to 1.0,
  "reasons": ["specific observation 1", "specific observation 2", "specific observation 3"],
  "structural_flags": ["flag_name_1", "flag_name_2"]
}

Give 3-5 SPECIFIC reasons based on what you actually observe. Do not give generic reasons."""


async def analyze_image_with_openai(
    content: str,
    content_type: str,
    file_data: Optional[str] = None,
) -> dict:
    """
    Use GPT-4o vision to analyze an image for AI-generated content.
    """
    default_result = {
        "model": "gpt-4o-vision",
        "verdict": "real",
        "confidence": 0.0,
        "reasons": ["OpenAI analysis unavailable"],
        "structural_flags": [],
        "weight": 0.55,
        "success": False,
    }

    if not HAS_OPENAI:
        default_result["reasons"] = ["OpenAI package not installed. Run: pip install openai"]
        return default_result

    api_key = OPENAI_API_KEY
    if not api_key:
        default_result["reasons"] = ["No OPENAI_API_KEY in environment. Set it in backend/.env"]
        return default_result

    if content_type != "image":
        return await _analyze_text_with_openai(content, content_type)

    if not file_data:
        default_result["reasons"] = ["No image data provided for OpenAI analysis"]
        return default_result

    try:
        client = OpenAI(api_key=api_key)

        # Build the image content
        if file_data.startswith("data:"):
            image_url = file_data
        else:
            image_url = f"data:image/jpeg;base64,{file_data}"

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Analyze this image carefully. Is it AI-generated or a real photograph? "
                                "Check hands/fingers, face details, text, lighting, background, and textures. "
                                "Respond with JSON only."
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_url,
                                "detail": "high",
                            },
                        },
                    ],
                },
            ],
            max_tokens=600,
            temperature=0.15,
        )

        raw = response.choices[0].message.content.strip()

        # Strip markdown code fences if present
        if raw.startswith("```"):
            lines = raw.split("\n")
            # Remove first line (```json) and last line (```)
            lines = [l for l in lines if not l.strip().startswith("```")]
            raw = "\n".join(lines).strip()

        parsed = json.loads(raw)

        verdict = parsed.get("verdict", "real")
        if verdict not in ("ai_generated", "real"):
            verdict = "real"

        confidence = float(parsed.get("confidence", 0.5))
        confidence = max(0.0, min(confidence, 1.0))

        reasons = parsed.get("reasons", [])
        if not isinstance(reasons, list):
            reasons = [str(reasons)]

        structural_flags = parsed.get("structural_flags", [])
        if not isinstance(structural_flags, list):
            structural_flags = [str(structural_flags)]

        print(f"  [gpt-4o] verdict={verdict} confidence={confidence:.3f}")
        for r in reasons[:3]:
            print(f"    -> {r}")

        return {
            "model": "gpt-4o-vision",
            "verdict": verdict,
            "confidence": round(confidence, 3),
            "reasons": reasons[:5],
            "structural_flags": structural_flags,
            "weight": 0.55,
            "success": True,
        }

    except json.JSONDecodeError as e:
        print(f"[gpt-4o-vision] JSON parse error: {e}")
        print(f"[gpt-4o-vision] Raw response: {raw[:200]}")
        return {
            "model": "gpt-4o-vision",
            "verdict": "real",
            "confidence": 0.0,
            "reasons": ["Failed to parse OpenAI response — model returned non-JSON"],
            "structural_flags": [],
            "weight": 0.55,
            "success": False,
        }
    except Exception as e:
        print(f"[gpt-4o-vision] Error: {e}")
        return {
            "model": "gpt-4o-vision",
            "verdict": "real",
            "confidence": 0.0,
            "reasons": [f"OpenAI analysis error: {str(e)[:100]}"],
            "structural_flags": [],
            "weight": 0.55,
            "success": False,
        }


async def _analyze_text_with_openai(content: str, content_type: str) -> dict:
    """Use GPT-4o to analyze text for AI-generated content."""
    api_key = OPENAI_API_KEY
    if not api_key or not HAS_OPENAI:
        return {
            "model": "gpt-4o-vision",
            "verdict": "real",
            "confidence": 0.0,
            "reasons": ["OpenAI text analysis unavailable"],
            "structural_flags": [],
            "weight": 0.55,
            "success": False,
        }

    try:
        client = OpenAI(api_key=api_key)

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert at detecting AI-generated text vs human-written text. "
                        "Look for: overly uniform sentence structure, lack of personal voice, "
                        "AI-typical phrases ('it is important to note', 'delve into', 'landscape'), "
                        "perfect grammar with no contractions, formulaic paragraph structure, "
                        "and excessive hedging language. "
                        "Respond ONLY with valid JSON: "
                        '{"verdict": "ai_generated" or "real", "confidence": 0.0-1.0, '
                        '"reasons": ["reason1", "reason2"], "structural_flags": ["flag1"]}'
                    ),
                },
                {
                    "role": "user",
                    "content": f"Is this text AI-generated or human-written? Analyze carefully:\n\n{content[:4000]}",
                },
            ],
            max_tokens=500,
            temperature=0.15,
        )

        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            lines = raw.split("\n")
            lines = [l for l in lines if not l.strip().startswith("```")]
            raw = "\n".join(lines).strip()

        parsed = json.loads(raw)

        verdict = parsed.get("verdict", "real")
        if verdict not in ("ai_generated", "real"):
            verdict = "real"

        return {
            "model": "gpt-4o-vision",
            "verdict": verdict,
            "confidence": round(max(0.0, min(float(parsed.get("confidence", 0.5)), 1.0)), 3),
            "reasons": parsed.get("reasons", [])[:5],
            "structural_flags": parsed.get("structural_flags", []),
            "weight": 0.55,
            "success": True,
        }
    except Exception as e:
        print(f"[gpt-4o-vision] Text analysis error: {e}")
        return {
            "model": "gpt-4o-vision",
            "verdict": "real",
            "confidence": 0.0,
            "reasons": [f"OpenAI text analysis error: {str(e)[:100]}"],
            "structural_flags": [],
            "weight": 0.55,
            "success": False,
        }
