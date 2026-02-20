"use client";

import { motion } from "framer-motion";

interface ModelOutput {
  model: string;
  verdict: string;
  confidence: number;
  weight: number;
  normalized_score: number;
  reasons: string[];
}

interface ConsensusBarProps {
  modelOutputs: ModelOutput[];
  aiLikelihood: number;
}

export function ConsensusBar({ modelOutputs, aiLikelihood }: ConsensusBarProps) {
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Consensus Breakdown</h3>

      {/* Overall bar */ }
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[#51CF66]">Real</span>
          <span className="text-white/50">{ Math.round(aiLikelihood * 100) }% AI likelihood</span>
          <span className="text-[#FF6B6B]">AI-Generated</span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={ {
              background: `linear-gradient(90deg, #51CF66, #FFC107, #FF6B6B)`,
            } }
            initial={ { width: 0 } }
            animate={ { width: `${aiLikelihood * 100}%` } }
            transition={ { duration: 0.8, delay: 0.2 } }
          />
        </div>
      </div>

      {/* Per-model bars */ }
      <div className="space-y-4">
        { modelOutputs.map((output, index) => {
          const modelName = output.model.split("/").pop() || output.model;
          const isAI = output.verdict === "ai_generated";
          const score = output.normalized_score;

          return (
            <motion.div
              key={ output.model }
              initial={ { opacity: 0, x: -20 } }
              animate={ { opacity: 1, x: 0 } }
              transition={ { delay: 0.3 + index * 0.1 } }
            >
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-white/80 font-medium">{ modelName }</span>
                <div className="flex items-center gap-3">
                  <span className="text-white/40 text-xs">
                    weight: { Math.round(output.weight * 100) }%
                  </span>
                  <span
                    className={ `text-xs px-2 py-0.5 rounded-full ${isAI
                        ? "bg-[#FF6B6B]/20 text-[#FF6B6B]"
                        : "bg-[#51CF66]/20 text-[#51CF66]"
                      }` }
                  >
                    { isAI ? "AI" : "Real" } { Math.round(output.confidence * 100) }%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={ {
                    backgroundColor: isAI ? "#FF6B6B" : "#51CF66",
                    opacity: 0.8,
                  } }
                  initial={ { width: 0 } }
                  animate={ { width: `${score * 100}%` } }
                  transition={ { duration: 0.6, delay: 0.4 + index * 0.1 } }
                />
              </div>
            </motion.div>
          );
        }) }
      </div>
    </div>
  );
}
