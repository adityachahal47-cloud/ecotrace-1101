"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";

interface FinalVerdictCardProps {
  verdict: "ai_generated" | "real";
  aiLikelihood: number;
  agreementLevel: "high" | "medium" | "low";
  contentType: string;
}

export function FinalVerdictCard({
  verdict,
  aiLikelihood,
  agreementLevel,
  contentType,
}: FinalVerdictCardProps) {
  const isAI = verdict === "ai_generated";
  const percentage = Math.round(aiLikelihood * 100);

  return (
    <motion.div
      initial={ { opacity: 0, scale: 0.95 } }
      animate={ { opacity: 1, scale: 1 } }
      transition={ { duration: 0.5 } }
      className={ `relative overflow-hidden rounded-2xl p-8 border ${isAI
          ? "bg-[#FF6B6B]/10 border-[#FF6B6B]/30"
          : "bg-[#51CF66]/10 border-[#51CF66]/30"
        }` }
    >
      {/* Glow effect */ }
      <div
        className={ `absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 ${isAI ? "bg-[#FF6B6B]" : "bg-[#51CF66]"
          }` }
      />

      <div className="relative flex flex-col sm:flex-row items-center gap-6">
        {/* Icon */ }
        <motion.div
          initial={ { rotate: -10, scale: 0 } }
          animate={ { rotate: 0, scale: 1 } }
          transition={ { type: "spring", stiffness: 200, delay: 0.2 } }
          className={ `w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 ${isAI ? "bg-[#FF6B6B]/20" : "bg-[#51CF66]/20"
            }` }
        >
          { isAI ? (
            <ShieldAlert className="w-10 h-10 text-[#FF6B6B]" />
          ) : (
            <ShieldCheck className="w-10 h-10 text-[#51CF66]" />
          ) }
        </motion.div>

        {/* Info */ }
        <div className="flex-1 text-center sm:text-left">
          <p className="text-white/50 text-sm uppercase tracking-wider mb-1">
            { contentType } Analysis Result
          </p>
          <h2
            className={ `text-3xl font-bold ${isAI ? "text-[#FF6B6B]" : "text-[#51CF66]"
              }` }
          >
            { isAI ? "AI-Generated" : "Likely Real" }
          </h2>
          <p className="text-white/60 mt-1">
            { percentage }% AI likelihood •{ " " }
            <span
              className={ `font-medium ${agreementLevel === "high"
                  ? "text-[#51CF66]"
                  : agreementLevel === "medium"
                    ? "text-[#FFC107]"
                    : "text-[#FF6B6B]"
                }` }
            >
              { agreementLevel } model agreement
            </span>
          </p>
        </div>

        {/* Percentage circle */ }
        <div className="shrink-0">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="42"
                fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8"
              />
              <motion.circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke={ isAI ? "#FF6B6B" : "#51CF66" }
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={ `${percentage * 2.64} ${264 - percentage * 2.64}` }
                initial={ { strokeDasharray: "0 264" } }
                animate={ { strokeDasharray: `${percentage * 2.64} ${264 - percentage * 2.64}` } }
                transition={ { duration: 1, delay: 0.3 } }
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={ `text-xl font-bold ${isAI ? "text-[#FF6B6B]" : "text-[#51CF66]"}` }>
                { percentage }%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Low agreement warning */ }
      { agreementLevel === "low" && (
        <motion.div
          initial={ { opacity: 0 } }
          animate={ { opacity: 1 } }
          transition={ { delay: 0.6 } }
          className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-[#FFC107]/10 border border-[#FFC107]/20"
        >
          <AlertTriangle className="w-4 h-4 text-[#FFC107] shrink-0" />
          <p className="text-[#FFC107] text-sm">
            Models disagree significantly. Result may be less reliable.
          </p>
        </motion.div>
      ) }
    </motion.div>
  );
}
