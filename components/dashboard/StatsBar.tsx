"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, BarChart3, Activity } from "lucide-react";

interface StatsBarProps {
  total: number;
  aiCount: number;
  realCount: number;
}

export function StatsBar({ total, aiCount, realCount }: StatsBarProps) {
  const aiPercent = total > 0 ? Math.round((aiCount / total) * 100) : 0;
  const realPercent = total > 0 ? Math.round((realCount / total) * 100) : 0;

  const stats = [
    {
      label: "Total Scans",
      value: total,
      icon: BarChart3,
      color: "#667EEA",
    },
    {
      label: "AI Detected",
      value: aiCount,
      icon: ShieldAlert,
      color: "#FF6B6B",
      subtext: `${aiPercent}%`,
    },
    {
      label: "Verified Real",
      value: realCount,
      icon: ShieldCheck,
      color: "#51CF66",
      subtext: `${realPercent}%`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      { stats.map((stat, i) => (
        <motion.div
          key={ stat.label }
          initial={ { opacity: 0, y: 10 } }
          animate={ { opacity: 1, y: 0 } }
          transition={ { delay: i * 0.1 } }
          className="bg-white/[0.03] border border-white/10 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <stat.icon className="w-5 h-5" style={ { color: stat.color } } />
            { stat.subtext && (
              <span className="text-xs text-white/30">{ stat.subtext }</span>
            ) }
          </div>
          <p className="text-2xl font-bold text-white">{ stat.value }</p>
          <p className="text-xs text-white/40 mt-0.5">{ stat.label }</p>
        </motion.div>
      )) }
    </div>
  );
}
