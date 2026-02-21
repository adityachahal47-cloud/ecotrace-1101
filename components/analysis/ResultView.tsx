"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Image as ImageIcon, FileText } from "lucide-react";
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
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // Try to load cached image from localStorage
  useEffect(() => {
    try {
      // Try all localStorage keys containing the requestId to find image data
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.includes("preview_") && key?.includes(analysis.request_id)) {
          setPreviewSrc(localStorage.getItem(key));
          break;
        }
      }
      // Also try the generic pattern used in page.tsx
      const imgKey = `ecotrace_preview_${analysis.request_id}`;
      const cached = localStorage.getItem(imgKey);
      if (cached) setPreviewSrc(cached);
    } catch {
      // no localStorage
    }
  }, [analysis.request_id]);

  const isAI = analysis.final_verdict === "ai_generated";
  const pct = Math.round(analysis.ai_likelihood * 100);

  return (
    <div className="space-y-5">
      {/* ── Meta header ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap items-center gap-3 text-xs text-white/30">
        <span className="uppercase tracking-wider font-medium text-white/50">
          {analysis.content_type}
        </span>
        <span>•</span>
        <span>{formattedDate}</span>
        <span>•</span>
        <span>Source: {analysis.source}</span>
        <span>•</span>
        <span className="font-mono text-white/20 text-[10px]">{analysis.request_id}</span>
      </motion.div>

      {/* ── Two-column grid on large screens ── */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        {/* LEFT column — main verdict + evidence */}
        <div className="space-y-5">
          {/* Verdict */}
          <FinalVerdictCard
            verdict={analysis.final_verdict}
            aiLikelihood={analysis.ai_likelihood}
            agreementLevel={analysis.agreement_level}
            contentType={analysis.content_type}
          />

          {/* Evidence */}
          <EvidenceList evidence={analysis.evidence || []} />

          {/* Consensus */}
          <ConsensusBar
            modelOutputs={analysis.model_outputs || []}
            aiLikelihood={analysis.ai_likelihood}
          />

          {/* Model Details */}
          <ModelPanel modelOutputs={analysis.model_outputs || []} />

          {/* Scam Risk */}
          <ScamRiskIndicator score={analysis.scam_risk_score} />

          {/* Transparency */}
          <TransparencyPanel
            modelOutputs={analysis.model_outputs || []}
            agreementLevel={analysis.agreement_level}
            aiLikelihood={analysis.ai_likelihood}
          />
        </div>

        {/* RIGHT column — image preview + quick stats */}
        <div className="space-y-5 lg:sticky lg:top-24">
          {/* Image preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
          >
            <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-white/40" />
              <span className="text-xs text-white/40 font-medium uppercase tracking-wider">Scanned Image</span>
            </div>
            {previewSrc ? (
              <div className="relative">
                <img
                  src={previewSrc}
                  alt="Analyzed content"
                  className="w-full object-cover max-h-72"
                />
                {/* Verdict overlay badge */}
                <div className={`absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-2 rounded-xl backdrop-blur-xl border ${isAI
                    ? "bg-red-500/20 border-red-500/30"
                    : "bg-green-500/20 border-green-500/30"
                  }`}>
                  <span className={`text-sm font-bold ${isAI ? "text-red-400" : "text-green-400"}`}>
                    {isAI ? "AI GENERATED" : "REAL IMAGE"}
                  </span>
                  <span className={`text-sm font-bold ${isAI ? "text-red-400" : "text-green-400"}`}>
                    {pct}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-white/30 text-sm">
                  {analysis.content_type === "text" ? "Text content analyzed" : "Image preview not available"}
                </p>
              </div>
            )}
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3"
          >
            <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-3">Quick Stats</p>
            {[
              {
                label: "AI Likelihood",
                value: `${pct}%`,
                color: isAI ? "#FF6B6B" : "#51CF66",
              },
              {
                label: "Model Agreement",
                value: analysis.agreement_level,
                color: analysis.agreement_level === "high" ? "#51CF66" : analysis.agreement_level === "medium" ? "#FFC107" : "#FF6B6B",
              },
              {
                label: "Models Used",
                value: `${analysis.model_outputs?.length || 0}`,
                color: "#667EEA",
              },
              {
                label: "Evidence Points",
                value: `${analysis.evidence?.length || 0}`,
                color: "#764BA2",
              },
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-sm text-white/50">{stat.label}</span>
                <span className="text-sm font-semibold capitalize" style={{ color: stat.color }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
