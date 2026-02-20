"use client";

import { Image, FileText, Video, Filter } from "lucide-react";

interface HistoryFiltersProps {
  contentType: string | null;
  verdict: string | null;
  onContentTypeChange: (type: string | null) => void;
  onVerdictChange: (verdict: string | null) => void;
}

export function HistoryFilters({
  contentType,
  verdict,
  onContentTypeChange,
  onVerdictChange,
}: HistoryFiltersProps) {
  const types = [
    { id: null, label: "All", icon: Filter },
    { id: "image", label: "Images", icon: Image },
    { id: "text", label: "Text", icon: FileText },
    { id: "video", label: "Video", icon: Video },
  ];

  const verdicts = [
    { id: null, label: "All" },
    { id: "ai_generated", label: "AI-Generated", color: "#FF6B6B" },
    { id: "real", label: "Real", color: "#51CF66" },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Content Type Filter */ }
      <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
        { types.map((t) => (
          <button
            key={ t.label }
            onClick={ () => onContentTypeChange(t.id) }
            className={ `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${contentType === t.id
              ? "bg-white/10 text-white"
              : "text-white/40 hover:text-white/60"
              }` }
          >
            <t.icon className="w-3.5 h-3.5" />
            { t.label }
          </button>
        )) }
      </div>

      {/* Verdict Filter */ }
      <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
        { verdicts.map((v) => (
          <button
            key={ v.label }
            onClick={ () => onVerdictChange(v.id) }
            className={ `px-3 py-1.5 rounded-md text-xs font-medium transition-all ${verdict === v.id
              ? "bg-white/10 text-white"
              : "text-white/40 hover:text-white/60"
              }` }
            style={ verdict === v.id && v.color ? { color: v.color } : undefined }
          >
            { v.label }
          </button>
        )) }
      </div>
    </div>
  );
}
