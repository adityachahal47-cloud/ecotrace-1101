"use client";

import { motion } from "framer-motion";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface ModelOutput {
  model: string;
  verdict: string;
  confidence: number;
  weight: number;
  reasons: string[];
  structural_flags: string[];
  normalized_score: number;
}

interface ModelPanelProps {
  modelOutputs: ModelOutput[];
}

export function ModelPanel({ modelOutputs }: ModelPanelProps) {
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Brain className="w-5 h-5 text-[#667EEA]" />
        Model Analysis Details
      </h3>

      <div className="space-y-3">
        { modelOutputs.map((output, index) => {
          const modelName = output.model.split("/").pop() || output.model;
          const isExpanded = expandedModel === output.model;
          const isAI = output.verdict === "ai_generated";

          return (
            <motion.div
              key={ output.model }
              initial={ { opacity: 0, y: 10 } }
              animate={ { opacity: 1, y: 0 } }
              transition={ { delay: index * 0.1 } }
              className="border border-white/10 rounded-xl overflow-hidden"
            >
              <button
                onClick={ () =>
                  setExpandedModel(isExpanded ? null : output.model)
                }
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={ `w-3 h-3 rounded-full ${isAI ? "bg-[#FF6B6B]" : "bg-[#51CF66]"
                      }` }
                  />
                  <span className="text-white font-medium">{ modelName }</span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={ `text-sm ${isAI ? "text-[#FF6B6B]" : "text-[#51CF66]"
                      }` }
                  >
                    { isAI ? "AI" : "Real" } ({ Math.round(output.confidence * 100) }%)
                  </span>
                  { isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-white/40" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  ) }
                </div>
              </button>

              { isExpanded && (
                <motion.div
                  initial={ { height: 0, opacity: 0 } }
                  animate={ { height: "auto", opacity: 1 } }
                  exit={ { height: 0, opacity: 0 } }
                  className="border-t border-white/10 p-4 space-y-3"
                >
                  {/* Reasons */ }
                  { output.reasons.length > 0 && (
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wider mb-2">
                        Reasons
                      </p>
                      <ul className="space-y-1.5">
                        { output.reasons.map((reason, i) => (
                          <li
                            key={ i }
                            className="text-white/70 text-sm flex items-start gap-2"
                          >
                            <span className="text-[#667EEA] mt-1 shrink-0">•</span>
                            { reason }
                          </li>
                        )) }
                      </ul>
                    </div>
                  ) }

                  {/* Structural Flags */ }
                  { output.structural_flags.length > 0 && (
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wider mb-2">
                        Structural Flags
                      </p>
                      <div className="flex flex-wrap gap-2">
                        { output.structural_flags.map((flag, i) => (
                          <span
                            key={ i }
                            className="text-xs px-2.5 py-1 rounded-full bg-[#FFC107]/10 text-[#FFC107] border border-[#FFC107]/20"
                          >
                            { flag }
                          </span>
                        )) }
                      </div>
                    </div>
                  ) }

                  {/* Meta */ }
                  <div className="flex items-center gap-4 text-xs text-white/30 pt-2 border-t border-white/5">
                    <span>Weight: { Math.round(output.weight * 100) }%</span>
                    <span>Normalized: { Math.round(output.normalized_score * 100) }%</span>
                  </div>
                </motion.div>
              ) }
            </motion.div>
          );
        }) }
      </div>
    </div>
  );
}
