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
  const verdictColor = isAI ? "#FF6B6B" : "#51CF66";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-2xl p-8 border ${isAI ? "bg-[#FF6B6B]/8 border-[#FF6B6B]/25" : "bg-[#51CF66]/8 border-[#51CF66]/25"
        }`}
    >
      {/* Glow blobs */}
      <div
        className={`absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-15 ${isAI ? "bg-[#FF6B6B]" : "bg-[#51CF66]"
          }`}
      />
      <div
        className={`absolute bottom-0 left-0 w-40 h-40 rounded-full blur-2xl opacity-10 ${isAI ? "bg-[#FF6B6B]" : "bg-[#51CF66]"
          }`}
      />


      <div className="relative flex flex-col sm:flex-row items-center gap-6">
        {/* Icon */}
        <motion.div
          initial={{ rotate: -10, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 ${isAI ? "bg-[#FF6B6B]/20" : "bg-[#51CF66]/20"
            }`}
        >
          {isAI ? (
            <ShieldAlert className="w-10 h-10 text-[#FF6B6B]" />
          ) : (
            <ShieldCheck className="w-10 h-10 text-[#51CF66]" />
          )}
        </motion.div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <p className="text-white/50 text-sm uppercase tracking-wider mb-1">
            {contentType} Analysis Result
          </p>
          <h2
            className={`text-3xl font-bold ${isAI ? "text-[#FF6B6B]" : "text-[#51CF66]"
              }`}
          >
            {isAI ? "AI-Generated" : "Likely Real"}
          </h2>
          <p className="text-white/60 mt-1">
            {percentage}% AI likelihood •{" "}
            <span
              className={`font-medium ${agreementLevel === "high"
                ? "text-[#51CF66]"
                : agreementLevel === "medium"
                  ? "text-[#FFC107]"
                  : "text-[#FF6B6B]"
                }`}
            >
              {agreementLevel} model agreement
            </span>
          </p>
        </div>

        {/* Percentage circle with pulsing glow */}
        <div className="shrink-0">
          <div className="relative w-28 h-28">
            {/* Pulsing outer ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: `0 0 30px ${isAI ? "#FF6B6B" : "#51CF66"}40` }}
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              {/* Track */}
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
              {/* Animated fill */}
              <motion.circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke={isAI ? "#FF6B6B" : "#51CF66"}
                strokeWidth="7"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 264" }}
                animate={{ strokeDasharray: `${percentage * 2.64} ${264 - percentage * 2.64}` }}
                transition={{ duration: 1.2, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, type: "spring" }}
                className={`text-2xl font-bold leading-none ${isAI ? "text-[#FF6B6B]" : "text-[#51CF66]"}`}
              >
                {percentage}%
              </motion.span>
              <span className="text-white/30 text-[9px] uppercase tracking-widest mt-0.5">AI prob.</span>
            </div>
          </div>
        </div>

      </div>

      {/* Low agreement warning */}
      {agreementLevel === "low" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-[#FFC107]/10 border border-[#FFC107]/20"
        >
          <AlertTriangle className="w-4 h-4 text-[#FFC107] shrink-0" />
          <p className="text-[#FFC107] text-sm">
            Models disagree significantly. Result may be less reliable.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
