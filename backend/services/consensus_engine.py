"""
Consensus Engine -- Weighted scoring, agreement, and smart fallback.

Key design:
  - GPT-4o is the PRIMARY signal (highest weight when it succeeds)
  - Advanced CNN classifier is the SECONDARY signal (trained model)
  - Local heuristic + forensic models provide SUPPORTING evidence
  - Failed models are excluded from consensus calculation
  - Agreement is measured only among successful models
"""


# Model priority tiers for weight assignment
_CNN_MODELS = {"advanced-cnn-classifier", "cnn-image-classifier"}
_GPT_MODELS = {"gpt-4o-vision"}


def _normalize_score(verdict: str, confidence: float) -> float:
    """
    Normalize to a single 0-1 scale where:
      0.0 = definitely real
      1.0 = definitely AI-generated

    confidence IS the AI likelihood score directly (0=real, 1=AI).
    """
    return confidence


def calculate_consensus(model_outputs: list[dict]) -> dict:
    """
    Calculate the consensus verdict from all model outputs.

    Weight tiers (when GPT-4o succeeds):
      - GPT-4o:  0.45
      - CNN:     0.30
      - Others share remaining 0.25

    Weight tiers (GPT-4o fails):
      - CNN:     0.45  (promoted to primary)
      - Others share remaining 0.55
    """
    if not model_outputs:
        return {
            "final_verdict": "real",
            "ai_likelihood": 0.0,
            "agreement_level": "low",
            "model_outputs": [],
        }

    # Separate successful vs failed
    successful = [o for o in model_outputs if o.get("success", True)]
    failed = [o for o in model_outputs if not o.get("success", True)]

    # Normalize scores for successful models
    for output in successful:
        output["normalized_score"] = _normalize_score(
            output["verdict"], output["confidence"]
        )

    # Set failed models to 0 score for display
    for output in failed:
        output["normalized_score"] = 0.0

    if not successful:
        return {
            "final_verdict": "real",
            "ai_likelihood": 0.0,
            "agreement_level": "low",
            "model_outputs": model_outputs,
        }

    # Categorize successful models
    gpt_model = next(
        (o for o in successful if o.get("model", "").lower() in _GPT_MODELS
         or "gpt" in o.get("model", "").lower()),
        None
    )
    cnn_model = next(
        (o for o in successful if o.get("model", "").lower() in _CNN_MODELS
         or "cnn" in o.get("model", "").lower()),
        None
    )
    other_models = [
        o for o in successful
        if o is not gpt_model and o is not cnn_model
    ]

    # -- Assign weights based on available models --
    if gpt_model and cnn_model:
        # Both GPT-4o and CNN available
        gpt_model["weight"] = 0.40
        cnn_model["weight"] = 0.30
        if other_models:
            share = 0.30 / len(other_models)
            for m in other_models:
                m["weight"] = round(share, 4)
        active = [gpt_model, cnn_model] + other_models

    elif gpt_model:
        # GPT-4o only (no CNN)
        gpt_model["weight"] = 0.55
        if other_models:
            share = 0.45 / len(other_models)
            for m in other_models:
                m["weight"] = round(share, 4)
        active = [gpt_model] + other_models

    elif cnn_model:
        # CNN only (no GPT-4o) -- CNN becomes primary
        cnn_model["weight"] = 0.45
        if other_models:
            share = 0.55 / len(other_models)
            for m in other_models:
                m["weight"] = round(share, 4)
        active = [cnn_model] + other_models

    else:
        # Only heuristic / forensic models
        if other_models:
            share = 1.0 / len(other_models)
            for m in other_models:
                m["weight"] = round(share, 4)
        active = other_models

    # -- Weighted final score --
    total_weight = sum(o["weight"] for o in active)
    if total_weight == 0:
        total_weight = 1.0

    final_score = sum(
        o["normalized_score"] * o["weight"] for o in active
    ) / total_weight

    # -- Agreement level --
    if len(active) >= 2:
        mean_score = sum(o["normalized_score"] for o in active) / len(active)
        variance = sum(
            (o["normalized_score"] - mean_score) ** 2 for o in active
        ) / len(active)

        if variance < 0.05:
            agreement_level = "high"
        elif variance < 0.15:
            agreement_level = "medium"
        else:
            agreement_level = "low"
    else:
        agreement_level = "medium"

    final_verdict = "ai_generated" if final_score >= 0.50 else "real"

    return {
        "final_verdict": final_verdict,
        "ai_likelihood": round(final_score, 4),
        "agreement_level": agreement_level,
        "model_outputs": model_outputs,
    }
