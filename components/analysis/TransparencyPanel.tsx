"use client";

import { motion } from "framer-motion";
import { Eye, Scale, Cpu } from "lucide-react";

interface TransparencyPanelProps {
  modelOutputs: {
    model: string;
    weight: number;
    confidence: number;
    verdict: string;
  }[];
  agreementLevel: string;
  aiLikelihood: number;
}

export function TransparencyPanel({
  modelOutputs,
  agreementLevel,
  aiLikelihood,
}: TransparencyPanelProps) {
  return (
    <motion.div
      initial={ { opacity: 0 } }
      animate={ { opacity: 1 } }
      transition={ { delay: 0.4 } }
      className="bg-white/5 rounded-2xl border border-white/10 p-6"
    >
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Eye className="w-5 h-5 text-[#667EEA]" />
        Transparency Report
      </h3>

      <div className="space-y-4 text-sm">
        {/* Methodology */ }
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-4 h-4 text-[#764BA2]" />
            <p className="text-white/80 font-medium">Methodology</p>
          </div>
          <p className="text-white/50 leading-relaxed">
            This analysis was performed by sending the content to{ " " }
            <span className="text-white/70">{ modelOutputs.length } independent AI models</span> in
            parallel. Each model independently assessed whether the content is
            AI-generated, providing a verdict, confidence score, and reasoning.
            Results were combined using weighted consensus scoring.
          </p>
        </div>

        {/* Model weights */ }
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4 text-[#764BA2]" />
            <p className="text-white/80 font-medium">Model Weights</p>
          </div>
          <div className="space-y-2">
            { modelOutputs.map((output) => {
              const modelName = output.model.split("/").pop() || output.model;
              return (
                <div key={ output.model } className="flex items-center justify-between">
                  <span className="text-white/60">{ modelName }</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#667EEA] to-[#764BA2]"
                        style={ { width: `${output.weight * 100}%` } }
                      />
                    </div>
                    <span className="text-white/40 text-xs w-10 text-right">
                      { Math.round(output.weight * 100) }%
                    </span>
                  </div>
                </div>
              );
            }) }
          </div>
        </div>

        {/* Scoring formula */ }
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <p className="text-white/50 leading-relaxed">
            <span className="text-white/70 font-medium">Final Score:</span>{ " " }
            { Math.round(aiLikelihood * 100) }% — calculated as the weighted sum of
            each model&apos;s normalized score. Agreement level is{ " " }
            <span
              className={ `font-medium ${agreementLevel === "high"
                  ? "text-[#51CF66]"
                  : agreementLevel === "medium"
                    ? "text-[#FFC107]"
                    : "text-[#FF6B6B]"
                }` }
            >
              { agreementLevel }
            </span>{ " " }
            (based on score variance across models).
          </p>
        </div>
      </div>
    </motion.div>
  );
}
