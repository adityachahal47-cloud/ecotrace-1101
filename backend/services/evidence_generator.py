"""
Evidence Generator — Aggregates model reasoning into structured evidence items.
"""


def _severity_from_confidence(confidence: float) -> str:
    """Map confidence to severity level."""
    if confidence >= 0.8:
        return "high"
    elif confidence >= 0.5:
        return "medium"
    return "low"


def generate_evidence(model_outputs: list[dict], content_type: str) -> list[dict]:
    """
    Aggregate model reasons into a unified evidence list.

    Returns a list of evidence items:
    [
        {
            "type": "model_analysis" | "structural" | "behavioral",
            "description": str,
            "severity": "high" | "medium" | "low"
        }
    ]
    """
    evidence = []
    seen_reasons = set()

    # Collect reasons from all models
    for output in model_outputs:
        if not output.get("success", True):
            continue

        confidence = output.get("confidence", 0.5)
        model_name = output.get("model", "unknown").split("/")[-1]

        # Add unique reasons as evidence
        for reason in output.get("reasons", []):
            reason_lower = reason.lower().strip()
            if reason_lower not in seen_reasons and len(reason) > 5:
                seen_reasons.add(reason_lower)
                evidence.append({
                    "type": "model_analysis",
                    "description": f"[{model_name}] {reason}",
                    "severity": _severity_from_confidence(confidence),
                })

        # Add structural flags
        for flag in output.get("structural_flags", []):
            flag_lower = flag.lower().strip()
            if flag_lower not in seen_reasons and len(flag) > 3:
                seen_reasons.add(flag_lower)
                evidence.append({
                    "type": "structural",
                    "description": f"[{model_name}] {flag}",
                    "severity": _severity_from_confidence(confidence),
                })

    # Sort by severity (high first)
    severity_order = {"high": 0, "medium": 1, "low": 2}
    evidence.sort(key=lambda x: severity_order.get(x["severity"], 3))

    return evidence
