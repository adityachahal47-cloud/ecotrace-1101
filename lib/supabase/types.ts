export type ContentType = "image" | "text" | "video";
export type Verdict = "ai_generated" | "real";
export type AgreementLevel = "high" | "medium" | "low";
export type Source = "web" | "extension";

export interface ModelOutput {
  model: string;
  verdict: Verdict;
  confidence: number;
  reasons: string[];
  structural_flags: string[];
  weight: number;
  normalized_score: number;
}

export interface EvidenceItem {
  type: string;
  description: string;
  severity: "high" | "medium" | "low";
}

export interface Analysis {
  id: string;
  user_id: string;
  request_id: string;
  content_type: ContentType;
  final_verdict: Verdict;
  ai_likelihood: number;
  agreement_level: AgreementLevel;
  scam_risk_score: number;
  behavioral_score: number;
  model_outputs: ModelOutput[];
  evidence: EvidenceItem[];
  source: Source;
  created_at: string;
}
