"use client";

import { FinalVerdictCard } from "./FinalVerdictCard";
import { ConsensusBar } from "./ConsensusBar";
import { ModelPanel } from "./ModelPanel";
import { EvidenceList } from "./EvidenceList";
import { ScamRiskIndicator } from "./ScamRiskIndicator";
import { TransparencyPanel } from "./TransparencyPanel";

interface Analysis {
  id: string;
  request_id: string;
  content_type: string;
  final_verdict: "ai_generated" | "real";
  ai_likelihood: number;
  agreement_level: "high" | "medium" | "low";
  scam_risk_score: number;
  behavioral_score: number;
  model_outputs: any[];
  evidence: any[];
  source: string;
  created_at: string;
}

interface ResultViewProps {
  analysis: Analysis;
}

export function ResultView({ analysis }: ResultViewProps) {
  const formattedDate = new Date(analysis.created_at).toLocaleString();

  return (
    <div className="space-y-6">
      {/* Meta info */ }
      <div className="flex flex-wrap items-center gap-4 text-sm text-white/40">
        <span>{ analysis.content_type.toUpperCase() }</span>
        <span>•</span>
        <span>{ formattedDate }</span>
        <span>•</span>
        <span>Source: { analysis.source }</span>
        <span>•</span>
        <span className="text-white/30 text-xs font-mono">
          { analysis.request_id }
        </span>
      </div>

      {/* Verdict */ }
      <FinalVerdictCard
        verdict={ analysis.final_verdict }
        aiLikelihood={ analysis.ai_likelihood }
        agreementLevel={ analysis.agreement_level }
        contentType={ analysis.content_type }
      />

      {/* Consensus */ }
      <ConsensusBar
        modelOutputs={ analysis.model_outputs || [] }
        aiLikelihood={ analysis.ai_likelihood }
      />

      {/* Scam Risk (if applicable) */ }
      <ScamRiskIndicator score={ analysis.scam_risk_score } />

      {/* Evidence */ }
      <EvidenceList evidence={ analysis.evidence || [] } />

      {/* Model Details */ }
      <ModelPanel modelOutputs={ analysis.model_outputs || [] } />

      {/* Transparency */ }
      <TransparencyPanel
        modelOutputs={ analysis.model_outputs || [] }
        agreementLevel={ analysis.agreement_level }
        aiLikelihood={ analysis.ai_likelihood }
      />
    </div>
  );
}
