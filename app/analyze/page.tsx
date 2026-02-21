"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { UploadZone } from "@/components/analysis/UploadZone";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/layout/Navbar";

type ContentType = "image" | "text" | "video";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";

export default function AnalyzePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const autoTriggered = useRef(false);

  // Auto-trigger from extension right-click (query params)
  useEffect(() => {
    if (autoTriggered.current) return;
    const type = searchParams.get("type") as ContentType | null;
    const content = searchParams.get("content");
    const url = searchParams.get("url");

    if (type && (content || url)) {
      autoTriggered.current = true;
      handleAnalyze({
        type,
        content: content || url || "",
        source: "extension",
      });
    }
  }, [searchParams]);

  async function handleAnalyze(data: {
    type: ContentType;
    content?: string;
    file?: File;
    source: string;
  }) {
    setIsLoading(true);
    setError(null);

    try {
      let token: string | null = null;
      try {
        const supabase = createClient();
        const { data: session } = await supabase.auth.getSession();
        token = session?.session?.access_token || null;
      } catch {
        // Auth not available, proceed without it
      }

      setStatus("Preparing content...");

      const formData = new FormData();
      formData.append("type", data.type);
      formData.append("source", data.source);

      if (data.file) {
        formData.append("file", data.file);
      }
      if (data.content) {
        formData.append("content", data.content);
      }

      setStatus("Analyzing with 4 AI models...");

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Analysis failed (${response.status})`);
      }

      const result = await response.json();
      localStorage.setItem(`ecotrace_result_${result.request_id}`, JSON.stringify(result));
      setStatus("Analysis complete! Redirecting...");

      setTimeout(() => {
        router.push(`/result/${result.request_id}`);
      }, 500);
    } catch (err: any) {
      const message =
        err instanceof TypeError && err.message === "Failed to fetch"
          ? "Backend server is not reachable. Make sure it's running on " + BACKEND_URL
          : err.message || "An unexpected error occurred.";
      setError(message);
      setIsLoading(false);
      setStatus("");
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white">Analyze Content</h1>
            <p className="text-white/50 mt-2 text-sm">
              Upload an image, paste text, or provide a URL to verify authenticity
            </p>
          </div>

          <UploadZone onAnalyze={handleAnalyze} isLoading={isLoading} />

          <AnimatePresence>
            {isLoading && status && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 flex items-center gap-3 justify-center text-white/60"
              >
                <Loader2 className="w-5 h-5 animate-spin text-[#667EEA]" />
                <span>{status}</span>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-10 grid grid-cols-4 gap-3 text-center">
            {[
              { label: "4 Models", desc: "Cross-examined" },
              { label: "Parallel", desc: "Simultaneous" },
              { label: "Vision AI", desc: "Advanced" },
              { label: "Consensus", desc: "Weighted score" },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <p className="text-white/80 font-semibold text-sm">{item.label}</p>
                <p className="text-white/30 text-xs mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
