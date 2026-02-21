"""
Advanced CNN Image Classifier — PyTorch inference for the trained model.

Loads advanced_classifier.pth and runs inference on uploaded images.
Falls back to the old H5-based CNN if PyTorch model isn't available.
"""

import base64
from typing import Optional
from pathlib import Path

import numpy as np

try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

try:
    import torch
    import torch.nn as nn
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False


# ──────────────────────────────────────────────
#  Model Architecture (must match training)
# ──────────────────────────────────────────────

if HAS_TORCH:
    class ResBlock(nn.Module):
        def __init__(self, ch):
            super().__init__()
            self.net = nn.Sequential(
                nn.Conv2d(ch, ch, 3, 1, 1, bias=False),
                nn.BatchNorm2d(ch),
                nn.ReLU(inplace=True),
                nn.Conv2d(ch, ch, 3, 1, 1, bias=False),
                nn.BatchNorm2d(ch),
            )
            self.relu = nn.ReLU(inplace=True)

        def forward(self, x):
            return self.relu(self.net(x) + x)

    class Classifier(nn.Module):
        def __init__(self):
            super().__init__()
            self.features = nn.Sequential(
                nn.Conv2d(3, 32, 3, 1, 1, bias=False),
                nn.BatchNorm2d(32),
                nn.ReLU(inplace=True),
                ResBlock(32),
                nn.MaxPool2d(2),
                nn.Dropout2d(0.1),

                nn.Conv2d(32, 64, 3, 1, 1, bias=False),
                nn.BatchNorm2d(64),
                nn.ReLU(inplace=True),
                ResBlock(64),
                nn.MaxPool2d(2),
                nn.Dropout2d(0.1),

                nn.Conv2d(64, 128, 3, 1, 1, bias=False),
                nn.BatchNorm2d(128),
                nn.ReLU(inplace=True),
                ResBlock(128),
                nn.MaxPool2d(2),
                nn.Dropout2d(0.15),

                nn.AdaptiveAvgPool2d(1),
            )
            self.classifier = nn.Sequential(
                nn.Flatten(),
                nn.Dropout(0.3),
                nn.Linear(128, 64),
                nn.ReLU(inplace=True),
                nn.Dropout(0.2),
                nn.Linear(64, 1),
            )

        def forward(self, x):
            return self.classifier(self.features(x))


# ──────────────────────────────────────────────
#  Singleton model loader
# ──────────────────────────────────────────────

_MODEL = None
_NORMALIZE = None
_MODEL_PATH = (
    Path(__file__).resolve().parent.parent.parent
    / "dataset" / "model" / "advanced_classifier.pth"
)


def _load_model():
    global _MODEL, _NORMALIZE
    if _MODEL is not None:
        return _MODEL
    if not HAS_TORCH:
        return None
    if not _MODEL_PATH.exists():
        print(f"[advanced-cnn] Model not found: {_MODEL_PATH}")
        return None

    try:
        checkpoint = torch.load(str(_MODEL_PATH), map_location="cpu", weights_only=True)
        model = Classifier()
        model.load_state_dict(checkpoint["model_state_dict"])
        model.eval()
        _MODEL = model
        _NORMALIZE = {
            "mean": checkpoint.get("normalize_mean", [0.485, 0.456, 0.406]),
            "std": checkpoint.get("normalize_std", [0.229, 0.224, 0.225]),
        }
        acc = checkpoint.get("val_accuracy", "?")
        print(f"[advanced-cnn] Loaded model (val_acc={acc})")
        return _MODEL
    except Exception as e:
        print(f"[advanced-cnn] Load error: {e}")
        return None


def _preprocess(file_data: str):
    if not HAS_CV2 or not HAS_TORCH:
        return None
    try:
        b64 = file_data.split("base64,")[1] if "base64," in file_data else file_data
        raw = base64.b64decode(b64)
        arr = np.frombuffer(raw, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            return None
        img = cv2.resize(img, (32, 32), interpolation=cv2.INTER_AREA)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
        mean = np.array(_NORMALIZE["mean"] if _NORMALIZE else [0.485, 0.456, 0.406])
        std = np.array(_NORMALIZE["std"] if _NORMALIZE else [0.229, 0.224, 0.225])
        img = (img - mean) / std
        return torch.from_numpy(img.transpose(2, 0, 1)).float().unsqueeze(0)
    except Exception as e:
        print(f"[advanced-cnn] Preprocess error: {e}")
        return None


# ──────────────────────────────────────────────
#  Public API
# ──────────────────────────────────────────────

def classify_image_advanced(file_data: Optional[str] = None) -> dict:
    """Run advanced CNN classifier. Falls back to H5 model if unavailable."""
    default = {
        "model": "advanced-cnn-classifier",
        "verdict": "real", "confidence": 0.0,
        "reasons": ["Advanced CNN unavailable"],
        "structural_flags": [], "weight": 0.45, "success": False,
    }

    if not HAS_TORCH:
        default["reasons"] = ["PyTorch not installed"]
        return default
    if not file_data:
        default["reasons"] = ["No image data provided"]
        return default

    model = _load_model()
    if model is None:
        try:
            from backend.services.cnn_classifier import classify_image_with_cnn
            return classify_image_with_cnn(file_data)
        except Exception:
            default["reasons"] = ["No CNN model available"]
            return default

    tensor = _preprocess(file_data)
    if tensor is None:
        default["reasons"] = ["Failed to preprocess image"]
        return default

    try:
        with torch.no_grad():
            raw_score = torch.sigmoid(model(tensor).squeeze()).item()

        ai_likelihood = max(0.0, min(1.0 - raw_score, 1.0))
        verdict = "ai_generated" if ai_likelihood >= 0.50 else "real"

        if verdict == "ai_generated":
            strength = "strongly" if ai_likelihood >= 0.85 else "likely" if ai_likelihood >= 0.65 else "possibly"
            reasons = [
                f"Advanced CNN {strength} detects AI patterns (score={ai_likelihood:.2f})",
                "Deep residual network trained on real vs Stable Diffusion images",
            ]
        else:
            strength = "strongly" if ai_likelihood <= 0.15 else "likely" if ai_likelihood <= 0.35 else "moderately"
            reasons = [
                f"Advanced CNN {strength} indicates real photograph (score={ai_likelihood:.2f})",
                "Image patterns consistent with real camera captures",
            ]

        print(f"  [advanced-cnn] verdict={verdict} confidence={ai_likelihood:.3f} raw={raw_score:.3f}")

        return {
            "model": "advanced-cnn-classifier",
            "verdict": verdict,
            "confidence": round(ai_likelihood, 3),
            "reasons": reasons,
            "structural_flags": ["cnn_ai_detected"] if verdict == "ai_generated" else [],
            "weight": 0.45,
            "success": True,
        }
    except Exception as e:
        print(f"[advanced-cnn] Error: {e}")
        default["reasons"] = [f"CNN error: {str(e)[:100]}"]
        return default
