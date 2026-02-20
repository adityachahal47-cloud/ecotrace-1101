"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface ScamRiskIndicatorProps {
  score: number; // 0-1
}

export function ScamRiskIndicator({ score }: ScamRiskIndicatorProps) {
  if (score <= 0) return null;

  const percentage = Math.round(score * 100);
  const getColor = () => {
    if (score >= 0.7) return "#FF6B6B";
    if (score >= 0.4) return "#FF8C42";
    return "#FFC107";
  };

  const getLabel = () => {
    if (score >= 0.7) return "High Risk";
    if (score >= 0.4) return "Moderate Risk";
    return "Low Risk";
  };

  const color = getColor();

  return (
    <motion.div
      initial={ { opacity: 0, y: 10 } }
      animate={ { opacity: 1, y: 0 } }
      className="bg-white/5 rounded-2xl border border-white/10 p-6"
    >
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" style={ { color } } />
        Scam Risk Assessment
      </h3>

      <div className="flex items-center gap-6">
        {/* Gauge */ }
        <div className="relative w-28 h-28 shrink-0">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="42"
              fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8"
            />
            <motion.circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke={ color }
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={ `${percentage * 2.64} ${264 - percentage * 2.64}` }
              initial={ { strokeDasharray: "0 264" } }
              animate={ {
                strokeDasharray: `${percentage * 2.64} ${264 - percentage * 2.64}`,
              } }
              transition={ { duration: 1, delay: 0.3 } }
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={ { color } }>
              { percentage }%
            </span>
          </div>
        </div>

        <div>
          <p className="text-xl font-semibold" style={ { color } }>
            { getLabel() }
          </p>
          <p className="text-white/50 text-sm mt-1">
            { score >= 0.4
              ? "This content contains patterns commonly associated with scam or misleading material."
              : "Some minor risk indicators detected, but likely not a scam." }
          </p>
        </div>
      </div>
    </motion.div>
  );
}
