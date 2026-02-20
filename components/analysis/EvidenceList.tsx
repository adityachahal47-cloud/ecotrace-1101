"use client";

import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface EvidenceItem {
  type: string;
  description: string;
  severity: "high" | "medium" | "low";
}

interface EvidenceListProps {
  evidence: EvidenceItem[];
}

export function EvidenceList({ evidence }: EvidenceListProps) {
  if (!evidence || evidence.length === 0) return null;

  const severityConfig = {
    high: {
      icon: AlertCircle,
      color: "text-[#FF6B6B]",
      bg: "bg-[#FF6B6B]/10",
      border: "border-[#FF6B6B]/20",
    },
    medium: {
      icon: AlertTriangle,
      color: "text-[#FFC107]",
      bg: "bg-[#FFC107]/10",
      border: "border-[#FFC107]/20",
    },
    low: {
      icon: Info,
      color: "text-[#667EEA]",
      bg: "bg-[#667EEA]/10",
      border: "border-[#667EEA]/20",
    },
  };

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Evidence</h3>

      <div className="space-y-2">
        { evidence.map((item, index) => {
          const config = severityConfig[item.severity] || severityConfig.low;
          const Icon = config.icon;

          return (
            <motion.div
              key={ index }
              initial={ { opacity: 0, x: -10 } }
              animate={ { opacity: 1, x: 0 } }
              transition={ { delay: index * 0.05 } }
              className={ `flex items-start gap-3 p-3 rounded-lg ${config.bg} border ${config.border}` }
            >
              <Icon className={ `w-4 h-4 mt-0.5 shrink-0 ${config.color}` } />
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-sm">{ item.description }</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={ `text-xs ${config.color}` }>
                    { item.severity } severity
                  </span>
                  <span className="text-white/20 text-xs">•</span>
                  <span className="text-white/30 text-xs">{ item.type }</span>
                </div>
              </div>
            </motion.div>
          );
        }) }
      </div>
    </div>
  );
}
