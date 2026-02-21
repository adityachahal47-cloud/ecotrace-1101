"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ResultView } from "@/components/analysis/ResultView";
import Navbar from "@/components/layout/Navbar";

export default function ResultPage() {
  const params = useParams();
  const id = params.id as string;
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    // Try localStorage first (from recent analysis)
    const stored = localStorage.getItem(`ecotrace_result_${id}`);
    if (stored) {
      try {
        setAnalysis(JSON.parse(stored));
        setLoading(false);
        return;
      } catch {
        // Fall through to Supabase
      }
    }

    // Try fetching from Supabase if localStorage miss
    async function fetchFromSupabase() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user) {
          setError("Result not found. Please analyze content first.");
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("analyses")
          .select("*")
          .eq("request_id", id)
          .eq("user_id", session.session.user.id)
          .single();

        if (data) {
          setAnalysis(data);
        } else {
          setError("Result not found.");
        }
      } catch {
        setError("Result not found. Please analyze content first.");
      }
      setLoading(false);
    }

    fetchFromSupabase();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] text-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#667EEA]" />
            <span className="text-white/60">Loading result...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] text-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <p className="text-white/60">{error || "Result not found."}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#667EEA] to-[#764BA2] text-white font-medium"
            >
              Analyze Content
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Back link */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Link href="/"
            className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Scanner
          </Link>
        </motion.div>

        {/* Result heading */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-8">
          <h1 className="text-2xl font-bold text-white">Forensic Analysis Report</h1>
          <p className="text-white/40 text-sm mt-1">
            Full breakdown across {analysis.model_outputs?.length || 4} AI models
          </p>
        </motion.div>

        <ResultView analysis={analysis} />
      </main>
    </div>
  );
}
