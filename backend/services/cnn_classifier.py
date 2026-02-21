"""
CNN Image Classifier — Pure NumPy inference engine for the pre-trained
ai_imageclassifier.h5 Keras model.

Since TensorFlow doesn't support Python 3.14, we implement the CNN forward
pass directly in NumPy by extracting weights from the H5 file. The model
architecture (from the notebook training) is:

    Conv2D(16, 4x4, relu) → MaxPool(2x2)
    Conv2D(32, 4x4, relu) → MaxPool(2x2)
    Conv2D(16, 4x4, relu) → MaxPool(2x2)
    Flatten → Dense(32, relu) → Dense(1, sigmoid)

Input: 32x32x3 images normalized to [0, 1]
Output: sigmoid score (0 = FAKE/AI, 1 = REAL)

This module integrates as a local analyzer in the EcoTrace pipeline.
"""

import io
import base64
from typing import Optional
from pathlib import Path

import numpy as np

try:
    import h5py
    HAS_H5PY = True
except ImportError:
    HAS_H5PY = False

try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False


# ──────────────────────────────────────────────
#  Pure NumPy CNN operations
# ──────────────────────────────────────────────

def _conv2d(x: np.ndarray, kernel: np.ndarray, bias: np.ndarray) -> np.ndarray:
    """
    2D convolution (valid padding, stride 1, channels_last).
    x: (H, W, C_in)
    kernel: (kH, kW, C_in, C_out)
    bias: (C_out,)
    Returns: (H-kH+1, W-kW+1, C_out)
    """
    kh, kw, c_in, c_out = kernel.shape
    h, w, _ = x.shape
    out_h, out_w = h - kh + 1, w - kw + 1

    output = np.zeros((out_h, out_w, c_out), dtype=np.float32)
    for i in range(out_h):
        for j in range(out_w):
            patch = x[i:i+kh, j:j+kw, :]  # (kh, kw, c_in)
            # Dot product with all filters at once
            output[i, j, :] = np.tensordot(patch, kernel, axes=((0,1,2),(0,1,2))) + bias

    return output


def _relu(x: np.ndarray) -> np.ndarray:
    """ReLU activation."""
    return np.maximum(x, 0)


def _max_pool2d(x: np.ndarray, pool_size: int = 2) -> np.ndarray:
    """
    Max pooling (valid padding, stride = pool_size, channels_last).
    x: (H, W, C)
    Returns: (H//pool_size, W//pool_size, C)
    """
    h, w, c = x.shape
    out_h, out_w = h // pool_size, w // pool_size
    output = np.zeros((out_h, out_w, c), dtype=np.float32)

    for i in range(out_h):
        for j in range(out_w):
            patch = x[i*pool_size:(i+1)*pool_size,
                      j*pool_size:(j+1)*pool_size, :]
            output[i, j, :] = patch.max(axis=(0, 1))

    return output


def _sigmoid(x: np.ndarray) -> np.ndarray:
    """Sigmoid activation (numerically stable)."""
    return np.where(
        x >= 0,
        1.0 / (1.0 + np.exp(-x)),
        np.exp(x) / (1.0 + np.exp(x))
    )


# ──────────────────────────────────────────────
#  Singleton weight loader
# ──────────────────────────────────────────────

_WEIGHTS = None
_MODEL_PATH = (
    Path(__file__).resolve().parent.parent.parent
    / "dataset" / "model" / "ai_imageclassifier.h5"
)


def _load_weights() -> Optional[dict]:
    """Load model weights from the H5 file (once, cached as singleton)."""
    global _WEIGHTS
    if _WEIGHTS is not None:
        return _WEIGHTS

    if not HAS_H5PY:
        print("[cnn-classifier] h5py not installed — skipping CNN model")
        return None

    if not _MODEL_PATH.exists():
        print(f"[cnn-classifier] Model file not found: {_MODEL_PATH}")
        return None

    try:
        with h5py.File(str(_MODEL_PATH), "r") as f:
            mw = f["model_weights"]
            _WEIGHTS = {
                # Conv2D layer 1: conv2d_13
                "conv1_kernel": np.array(mw["conv2d_13"]["conv2d_13"]["kernel:0"]),
                "conv1_bias": np.array(mw["conv2d_13"]["conv2d_13"]["bias:0"]),
                # Conv2D layer 2: conv2d_14
                "conv2_kernel": np.array(mw["conv2d_14"]["conv2d_14"]["kernel:0"]),
                "conv2_bias": np.array(mw["conv2d_14"]["conv2d_14"]["bias:0"]),
                # Conv2D layer 3: conv2d_15
                "conv3_kernel": np.array(mw["conv2d_15"]["conv2d_15"]["kernel:0"]),
                "conv3_bias": np.array(mw["conv2d_15"]["conv2d_15"]["bias:0"]),
                # Dense layer 1: dense_6
                "dense1_kernel": np.array(mw["dense_6"]["dense_6"]["kernel:0"]),
                "dense1_bias": np.array(mw["dense_6"]["dense_6"]["bias:0"]),
                # Dense layer 2 (output): dense_7
                "dense2_kernel": np.array(mw["dense_7"]["dense_7"]["kernel:0"]),
                "dense2_bias": np.array(mw["dense_7"]["dense_7"]["bias:0"]),
            }
        print(f"[cnn-classifier] Loaded weights from {_MODEL_PATH}")
        return _WEIGHTS
    except Exception as e:
        print(f"[cnn-classifier] Failed to load weights: {e}")
        return None


def _forward(x: np.ndarray, weights: dict) -> float:
    """
    Run the full CNN forward pass.
    x: (32, 32, 3) normalized to [0, 1]
    Returns: sigmoid output (float)
    """
    # Block 1: Conv2D(16, 4x4, relu) → MaxPool(2x2)
    x = _conv2d(x, weights["conv1_kernel"], weights["conv1_bias"])
    x = _relu(x)
    x = _max_pool2d(x)

    # Block 2: Conv2D(32, 4x4, relu) → MaxPool(2x2)
    x = _conv2d(x, weights["conv2_kernel"], weights["conv2_bias"])
    x = _relu(x)
    x = _max_pool2d(x)

    # Block 3: Conv2D(16, 4x4, relu) → MaxPool(2x2)
    x = _conv2d(x, weights["conv3_kernel"], weights["conv3_bias"])
    x = _relu(x)
    x = _max_pool2d(x)

    # Flatten
    x = x.flatten()

    # Dense(32, relu)
    x = x @ weights["dense1_kernel"] + weights["dense1_bias"]
    x = _relu(x)

    # Dense(1, sigmoid)
    x = x @ weights["dense2_kernel"] + weights["dense2_bias"]
    x = _sigmoid(x)

    return float(x[0])


# ──────────────────────────────────────────────
#  Image preprocessing
# ──────────────────────────────────────────────

def _preprocess_image(file_data: str) -> Optional[np.ndarray]:
    """
    Decode base64 image → resize to 32x32 → normalize to [0, 1].
    Returns a numpy array of shape (32, 32, 3).
    """
    if not HAS_CV2:
        return None

    try:
        # Strip data URI prefix if present
        if "base64," in file_data:
            b64 = file_data.split("base64,")[1]
        else:
            b64 = file_data

        raw_bytes = base64.b64decode(b64)
        arr = np.frombuffer(raw_bytes, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)

        if img is None:
            return None

        # Resize to 32x32
        img_resized = cv2.resize(img, (32, 32), interpolation=cv2.INTER_AREA)

        # Convert BGR → RGB (model trained on RGB)
        img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)

        # Normalize to [0, 1]
        return img_rgb.astype(np.float32) / 255.0

    except Exception as e:
        print(f"[cnn-classifier] Preprocessing error: {e}")
        return None


# ──────────────────────────────────────────────
#  Public API
# ──────────────────────────────────────────────

def classify_image_with_cnn(file_data: Optional[str] = None) -> dict:
    """
    Run the CNN image classifier on a base64-encoded image.

    Returns a dict in the standard EcoTrace model output format.

    The model outputs a single sigmoid value:
        - Close to 0 → FAKE (AI-generated)
        - Close to 1 → REAL

    We invert this to match the pipeline convention where
    confidence = AI likelihood (higher = more likely AI).
    """
    default_result = {
        "model": "cnn-image-classifier",
        "verdict": "real",
        "confidence": 0.0,
        "reasons": ["CNN classifier unavailable"],
        "structural_flags": [],
        "weight": 0.40,
        "success": False,
    }

    if not HAS_H5PY:
        default_result["reasons"] = [
            "h5py not installed. Run: pip install h5py"
        ]
        return default_result

    if not file_data:
        default_result["reasons"] = ["No image data provided for CNN analysis"]
        return default_result

    weights = _load_weights()
    if weights is None:
        default_result["reasons"] = ["CNN model weights could not be loaded"]
        return default_result

    # Preprocess
    img = _preprocess_image(file_data)
    if img is None:
        default_result["reasons"] = ["Failed to preprocess image for CNN"]
        return default_result

    try:
        # Run forward pass
        raw_score = _forward(img, weights)

        # Model labels: FAKE=0, REAL=1
        # Pipeline convention: confidence = AI likelihood (0=real, 1=AI)
        ai_likelihood = 1.0 - raw_score
        ai_likelihood = max(0.0, min(ai_likelihood, 1.0))

        verdict = "ai_generated" if ai_likelihood >= 0.50 else "real"

        # Build human-readable reasons
        reasons = []
        if verdict == "ai_generated":
            if ai_likelihood >= 0.85:
                reasons.append(
                    f"CNN strongly detects AI-generated patterns "
                    f"(score={ai_likelihood:.2f})"
                )
            elif ai_likelihood >= 0.65:
                reasons.append(
                    f"CNN detects likely AI-generated patterns "
                    f"(score={ai_likelihood:.2f})"
                )
            else:
                reasons.append(
                    f"CNN detects possible AI-generated patterns "
                    f"(score={ai_likelihood:.2f})"
                )
            reasons.append(
                "Trained on CIFAR-10 real images vs Stable Diffusion fakes "
                "(91.3% accuracy)"
            )
        else:
            if ai_likelihood <= 0.15:
                reasons.append(
                    f"CNN strongly indicates real photograph "
                    f"(score={ai_likelihood:.2f})"
                )
            elif ai_likelihood <= 0.35:
                reasons.append(
                    f"CNN indicates likely real photograph "
                    f"(score={ai_likelihood:.2f})"
                )
            else:
                reasons.append(
                    f"CNN leans toward real but with low confidence "
                    f"(score={ai_likelihood:.2f})"
                )
            reasons.append(
                "Image does not match patterns learned from "
                "Stable Diffusion-generated fakes"
            )

        print(
            f"  [cnn-classifier] verdict={verdict} "
            f"confidence={ai_likelihood:.3f} raw={raw_score:.3f}"
        )

        return {
            "model": "cnn-image-classifier",
            "verdict": verdict,
            "confidence": round(ai_likelihood, 3),
            "reasons": reasons,
            "structural_flags": (
                ["cnn_ai_detected"] if verdict == "ai_generated" else []
            ),
            "weight": 0.40,
            "success": True,
        }

    except Exception as e:
        print(f"[cnn-classifier] Prediction error: {e}")
        default_result["reasons"] = [
            f"CNN prediction error: {str(e)[:100]}"
        ]
        return default_result
