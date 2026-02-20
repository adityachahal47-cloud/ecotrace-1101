"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, Search, Loader2, Inbox } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { HistoryCard } from "@/components/dashboard/HistoryCard";
import { HistoryFilters } from "@/components/dashboard/HistoryFilters";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface Analysis {
  id: string;
  request_id: string;
  content_type: string;
  final_verdict: "ai_generated" | "real";
  ai_likelihood: number;
  agreement_level: "high" | "medium" | "low";
  source: string;
  created_at: string;
}

export default function DashboardPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [contentType, setContentType] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<string | null>(null);

  const supabase = createClient();

  // Get user info
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email || null);
    });
  }, []);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) {
        // Not authenticated — show empty state without errors
        setAnalyses([]);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (contentType) params.set("type", contentType);
      if (verdict) params.set("verdict", verdict);
      params.set("limit", "50");

      try {
        const response = await fetch(
          `${BACKEND_URL}/api/history?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setAnalyses(data.items || []);
        } else {
          setAnalyses([]);
        }
      } catch {
        // Backend unreachable — silently show empty state
        setAnalyses([]);
      }
    } catch {
      // Auth error — show empty state
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  }, [contentType, verdict]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Delete handler
  const handleDelete = async (id: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) return;

      await fetch(`${BACKEND_URL}/api/history/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setAnalyses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  // Stats
  const total = analyses.length;
  const aiCount = analyses.filter((a) => a.final_verdict === "ai_generated").length;
  const realCount = analyses.filter((a) => a.final_verdict === "real").length;

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      <Navbar email={ email } />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */ }
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-white/40 text-sm mt-1">
              Your content verification history
            </p>
          </div>
          <Link href="/analyze">
            <Button className="bg-gradient-to-r from-[#667EEA] to-[#764BA2] hover:from-[#5a6fd6] hover:to-[#6a3f96] text-white shadow-lg shadow-[#667EEA]/20">
              <PlusCircle className="w-4 h-4" />
              New Analysis
            </Button>
          </Link>
        </div>

        {/* Stats */ }
        { !loading && total > 0 && (
          <div className="mb-6">
            <StatsBar total={ total } aiCount={ aiCount } realCount={ realCount } />
          </div>
        ) }

        {/* Filters */ }
        <div className="mb-6">
          <HistoryFilters
            contentType={ contentType }
            verdict={ verdict }
            onContentTypeChange={ setContentType }
            onVerdictChange={ setVerdict }
          />
        </div>

        {/* History List */ }
        { loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#667EEA] mb-4" />
            <p className="text-white/40 text-sm">Loading history...</p>
          </div>
        ) : analyses.length === 0 ? (
          <motion.div
            initial={ { opacity: 0 } }
            animate={ { opacity: 1 } }
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
              <Inbox className="w-10 h-10 text-white/20" />
            </div>
            <h3 className="text-lg font-medium text-white/60 mb-2">
              No analyses yet
            </h3>
            <p className="text-white/30 text-sm max-w-sm mb-6">
              Start by analyzing your first piece of content. Upload an image,
              paste text, or provide a URL.
            </p>
            <Link href="/analyze">
              <Button className="bg-gradient-to-r from-[#667EEA] to-[#764BA2] text-white">
                <PlusCircle className="w-4 h-4" />
                Analyze Content
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              { analyses.map((analysis, index) => (
                <HistoryCard
                  key={ analysis.id }
                  analysis={ analysis }
                  index={ index }
                  onDelete={ handleDelete }
                />
              )) }
            </AnimatePresence>
          </div>
        ) }
      </main>
    </div>
  );
}
