"""
Consensus Engine — Weighted scoring and agreement calculation.

Formula:
  - Normalize: if verdict=real, numeric = 1 - confidence
  - final_score = Σ(model_numeric × model_weight)
  - Agreement: variance < 0.15 = high, < 0.35 = medium, else low
"""


def _normalize_score(verdict: str, confidence: float) -> float:
    """
    Normalize to a single 0–1 scale where:
      0.0 = definitely real
      1.0 = definitely AI-generated
    """
    if verdict == "ai_generated":
        return confidence
    else:
        return 1.0 - confidence


def calculate_consensus(model_outputs: list[dict]) -> dict:
    """
    Calculate the consensus verdict from all model outputs.

    Returns:
        {
            "final_verdict": "ai_generated" | "real",
            "ai_likelihood": float (0–1),
            "agreement_level": "high" | "medium" | "low",
            "model_outputs": list with normalized_score added
        }
    """
    if not model_outputs:
        return {
            "final_verdict": "real",
            "ai_likelihood": 0.0,
            "agreement_level": "low",
            "model_outputs": [],
        }

    # Normalize scores and add to outputs
    for output in model_outputs:
        output["normalized_score"] = _normalize_score(
            output["verdict"], output["confidence"]
        )

    # Weighted final score
    total_weight = sum(o["weight"] for o in model_outputs)
    if total_weight == 0:
        total_weight = 1.0

    final_score = sum(
        o["normalized_score"] * o["weight"] for o in model_outputs
    ) / total_weight

    # Agreement level based on variance
    mean_score = sum(o["normalized_score"] for o in model_outputs) / len(model_outputs)
    variance = sum(
        (o["normalized_score"] - mean_score) ** 2 for o in model_outputs
    ) / len(model_outputs)

    if variance < 0.15:
        agreement_level = "high"
    elif variance < 0.35:
        agreement_level = "medium"
    else:
        agreement_level = "low"

    # Check if all models failed
    all_failed = all(not o.get("success", True) for o in model_outputs)
    if all_failed:
        agreement_level = "low"

    # Final verdict
    final_verdict = "ai_generated" if final_score >= 0.5 else "real"

    return {
        "final_verdict": final_verdict,
        "ai_likelihood": round(final_score, 4),
        "agreement_level": agreement_level,
        "model_outputs": model_outputs,
    }
