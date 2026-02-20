"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ShieldCheck, ShieldAlert, Trash2, ExternalLink } from "lucide-react";

interface HistoryCardProps {
  analysis: {
    id: string;
    request_id: string;
    content_type: string;
    final_verdict: "ai_generated" | "real";
    ai_likelihood: number;
    agreement_level: "high" | "medium" | "low";
    source: string;
    created_at: string;
  };
  index: number;
  onDelete: (id: string) => void;
}

export function HistoryCard({ analysis, index, onDelete }: HistoryCardProps) {
  const isAI = analysis.final_verdict === "ai_generated";
  const percentage = Math.round(analysis.ai_likelihood * 100);
  const date = new Date(analysis.created_at);
  const timeAgo = getTimeAgo(date);

  return (
    <motion.div
      initial={ { opacity: 0, y: 15 } }
      animate={ { opacity: 1, y: 0 } }
      transition={ { delay: index * 0.05 } }
      className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl p-5 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Verdict icon + info */ }
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div
            className={ `w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isAI ? "bg-[#FF6B6B]/15" : "bg-[#51CF66]/15"
              }` }
          >
            { isAI ? (
              <ShieldAlert className="w-6 h-6 text-[#FF6B6B]" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-[#51CF66]" />
            ) }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={ `text-sm font-semibold ${isAI ? "text-[#FF6B6B]" : "text-[#51CF66]"
                  }` }
              >
                { isAI ? "AI-Generated" : "Likely Real" }
              </span>
              <span
                className={ `text-xs px-2 py-0.5 rounded-full border ${isAI
                  ? "bg-[#FF6B6B]/10 border-[#FF6B6B]/20 text-[#FF6B6B]"
                  : "bg-[#51CF66]/10 border-[#51CF66]/20 text-[#51CF66]"
                  }` }
              >
                { percentage }%
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1.5 text-xs text-white/40">
              <span className="capitalize">{ analysis.content_type }</span>
              <span>·</span>
              <span
                className={ `${analysis.agreement_level === "high"
                  ? "text-[#51CF66]"
                  : analysis.agreement_level === "medium"
                    ? "text-[#FFC107]"
                    : "text-[#FF6B6B]"
                  }` }
              >
                { analysis.agreement_level } agreement
              </span>
              <span>·</span>
              <span>{ timeAgo }</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */ }
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={ `/result/${analysis.request_id}` }
            className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
            title="View details"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          <button
            onClick={ (e) => {
              e.preventDefault();
              onDelete(analysis.id);
            } }
            className="p-2 rounded-lg hover:bg-[#FF6B6B]/10 text-white/40 hover:text-[#FF6B6B] transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom: Mini consensus bar */ }
      <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={ {
            backgroundColor: isAI ? "#FF6B6B" : "#51CF66",
            opacity: 0.6,
          } }
          initial={ { width: 0 } }
          animate={ { width: `${percentage}%` } }
          transition={ { duration: 0.6, delay: index * 0.05 + 0.2 } }
        />
      </div>
    </motion.div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
