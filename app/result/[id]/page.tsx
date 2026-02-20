"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Shield, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { ResultView } from "@/components/analysis/ResultView";

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
      <div className="min-h-screen bg-[#0a0a1a] text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#667EEA]" />
          <span className="text-white/60">Loading result...</span>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-white/60">{ error || "Result not found." }</p>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#667EEA] to-[#764BA2] text-white font-medium"
          >
            Analyze Content
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      {/* Top Nav */ }
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#667EEA] to-[#764BA2] flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent">
                EcoTrace
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/analyze"
                className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Analyze More
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Result Content */ }
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ResultView analysis={ analysis } />
      </main>
    </div>
  );
}
