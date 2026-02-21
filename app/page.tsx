"use client";

import { useState, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Upload, Link as LinkIcon, FileText,
  Loader2, Sparkles, ArrowRight, X, CheckCircle2, ChevronDown,
  Eye, Lock, Scan, Users, AlertTriangle, Star,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ScanPanel from "@/components/landing/ScanPanel";

const AnimatedBackground = dynamic(
  () => import("@/components/landing/AnimatedBackground"),
  { ssr: false, loading: () => <div className="min-h-screen bg-[#0a0a1a]" /> }
);
const ImageComparison = dynamic(
  () => import("@/components/landing/ImageComparison"),
  { ssr: false }
);

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";

type ScanState = "idle" | "scanning" | "done";

export default function LandingPage() {
  const router = useRouter();

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [textContent, setTextContent] = useState("");
  const [urlContent, setUrlContent] = useState("");
  const [inputMode, setInputMode] = useState<"upload" | "url" | "text">("upload");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Scan panel state
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{
    verdict: "ai_generated" | "real";
    confidence: number;
    requestId: string;
  } | null>(null);

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) {
      setSelectedFile(files[0]);
      setError(null);
      if (files[0].type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(files[0]);
      } else {
        setPreview(null);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  function clearFile() {
    setSelectedFile(null);
    setPreview(null);
    if (scanState !== "idle") setScanState("idle");
  }

  async function handleAnalyze() {
    const hasContent =
      (inputMode === "upload" && selectedFile) ||
      (inputMode === "url" && urlContent.trim()) ||
      (inputMode === "text" && textContent.trim());

    if (!hasContent) { setError("Please provide content to analyze."); return; }

    setIsAnalyzing(true);
    setError(null);
    setStatus("Preparing content...");

    // Move image to scan panel
    if (inputMode === "upload" && preview) {
      setScanImage(preview);
    }
    setScanState("scanning");

    try {
      let token: string | null = null;
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: session } = await supabase.auth.getSession();
        token = session?.session?.access_token || null;
      } catch { /* no auth */ }

      const formData = new FormData();
      formData.append("source", "web");
      if (inputMode === "upload" && selectedFile) {
        formData.append("type", selectedFile.type.startsWith("image/") ? "image" : "text");
        formData.append("file", selectedFile);
      } else if (inputMode === "url") {
        formData.append("type", "image");
        formData.append("content", urlContent.trim());
      } else {
        formData.append("type", "text");
        formData.append("content", textContent.trim());
      }

      setStatus("Analyzing with 4 AI models...");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: "POST", headers, body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Analysis failed (${response.status})`);
      }

      const result = await response.json();
      localStorage.setItem(`ecotrace_result_${result.request_id}`, JSON.stringify(result));
      // Cache image preview so result page can display it
      if (preview) {
        try {
          localStorage.setItem(`ecotrace_preview_${result.request_id}`, preview);
        } catch { /* storage full — skip */ }
      }


      setScanResult({
        verdict: result.final_verdict,
        confidence: result.ai_likelihood,
        requestId: result.request_id,
      });
      setScanState("done");
      setStatus("Analysis complete!");
    } catch (err: any) {
      setScanState("idle");
      setError(
        err instanceof TypeError && err.message === "Failed to fetch"
          ? "Backend server is not reachable. Make sure it's running."
          : err.message || "Analysis failed"
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleViewAnalysis() {
    if (scanResult) {
      router.push(`/result/${scanResult.requestId}`);
    }
  }

  const features = [
    { icon: Eye, label: "Face Mesh Analysis", desc: "Detects symmetry anomalies, deformed fingers, unnatural skin" },
    { icon: Sparkles, label: "Frequency Analysis", desc: "FFT spectrum & edge anomaly detection" },
    { icon: Shield, label: "Watermark Detection", desc: "Scans for AI logos & missing EXIF data" },
    { icon: Users, label: "AI Vision Check", desc: "Advanced vision model cross-checks results" },
  ];

  const stats = [
    { value: "98%", label: "Detection Accuracy" },
    { value: "4", label: "AI Models Used" },
    { value: "< 10s", label: "Avg. Scan Time" },
    { value: "Free", label: "Basic Tier" },
  ];

  return (
    <AnimatedBackground showGrid intensity={1}>
      <Navbar />

      {/* ══ HERO ══ */}
      <section className="pt-16 min-h-screen flex">
        {/* LEFT — Scan Panel */}
        <div className="hidden lg:flex w-1/2 items-center justify-center relative">
          <div className="w-[85%] max-w-[480px] aspect-[4/5] relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
            <ScanPanel
              scanState={scanState}
              uploadedImage={scanImage}
              result={scanResult}
              onViewAnalysis={handleViewAnalysis}
            />
          </div>
        </div>

        {/* RIGHT — Upload & Analyze */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 lg:px-14 py-10 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg"
          >
            {/* Mobile title */}
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">
                <span className="bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent">EcoTrace</span>
              </h1>
              <p className="text-white/40 text-sm">AI Content Verification Engine</p>
            </div>

            {/* Desktop headline above card */}
            <div className="hidden lg:block mb-6">


              <h1 className="text-4xl font-bold text-white leading-tight mb-2">
                Is this image <span className="bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent">real or AI?</span>
              </h1>
              <p className="text-white/40 text-sm">Upload any image for instant forensic verification</p>
            </div>

            {/* Analyze Card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 lg:p-7 shadow-2xl shadow-black/40">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#667EEA] to-[#764BA2] flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Analyze Content</h2>
                  <p className="text-xs text-white/40">Upload an image to verify authenticity</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 rounded-xl bg-white/5 mb-5">
                {([
                  { mode: "upload" as const, icon: Upload, label: "Upload" },
                  { mode: "url" as const, icon: LinkIcon, label: "URL" },
                  { mode: "text" as const, icon: FileText, label: "Text" },
                ]).map((tab) => (
                  <button key={tab.mode} onClick={() => { setInputMode(tab.mode); setError(null); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${inputMode === tab.mode
                      ? "bg-gradient-to-r from-[#667EEA] to-[#764BA2] text-white shadow-lg"
                      : "text-white/40 hover:text-white/60"
                      }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />{tab.label}
                  </button>
                ))}
              </div>

              {/* Input areas */}
              <AnimatePresence mode="wait">
                {inputMode === "upload" && (
                  <motion.div key="upload" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    {selectedFile ? (
                      <div className="relative rounded-xl border border-white/10 bg-white/5 p-4">
                        <button onClick={clearFile} className="absolute top-2 right-2 p-1 rounded-lg bg-white/10 hover:bg-white/20 transition">
                          <X className="w-4 h-4 text-white/60" />
                        </button>
                        {preview ? (
                          <img src={preview} alt="Preview" className="w-full h-44 object-contain rounded-lg" />
                        ) : (
                          <div className="flex items-center gap-3 py-4">
                            <FileText className="w-8 h-8 text-[#667EEA]" />
                            <div>
                              <p className="text-sm text-white font-medium">{selectedFile.name}</p>
                              <p className="text-xs text-white/40">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-green-400/80">Ready to analyze</span>
                        </div>
                      </div>
                    ) : (
                      <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? "border-[#667EEA] bg-[#667EEA]/5" : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                        }`}>
                        <input {...getInputProps()} />
                        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#667EEA]/20 to-[#764BA2]/20 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-[#667EEA]" />
                        </div>
                        <p className="text-sm text-white/70 font-medium">{isDragActive ? "Drop your image here" : "Drag & drop an image"}</p>
                        <p className="text-xs text-white/30 mt-1">PNG, JPG, WEBP up to 10MB</p>
                      </div>
                    )}
                  </motion.div>
                )}
                {inputMode === "url" && (
                  <motion.div key="url" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input type="url" value={urlContent} onChange={(e) => { setUrlContent(e.target.value); setError(null); }}
                        placeholder="https://example.com/image.jpg"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#667EEA]/50 focus:ring-1 focus:ring-[#667EEA]/20 transition" />
                    </div>
                  </motion.div>
                )}
                {inputMode === "text" && (
                  <motion.div key="text" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <textarea value={textContent} onChange={(e) => { setTextContent(e.target.value); setError(null); }}
                      placeholder="Paste text to check if it's AI-generated..." rows={5}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#667EEA]/50 focus:ring-1 focus:ring-[#667EEA]/20 transition resize-none" />
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >{error}</motion.div>
              )}
              {status && isAnalyzing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex items-center gap-2 text-sm text-[#667EEA]">
                  <Loader2 className="w-4 h-4 animate-spin" />{status}
                </motion.div>
              )}
              {scanState === "done" && scanResult && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 px-4 py-3 rounded-xl flex items-center justify-between ${scanResult.verdict === "ai_generated"
                    ? "bg-red-500/10 border border-red-500/20"
                    : "bg-green-500/10 border border-green-500/20"
                    }`}
                >
                  <span className={`text-sm font-semibold ${scanResult.verdict === "ai_generated" ? "text-red-400" : "text-green-400"}`}>
                    {scanResult.verdict === "ai_generated" ? "AI GENERATED" : "REAL IMAGE"} — {Math.round(scanResult.confidence * 100)}%
                  </span>
                  <button onClick={handleViewAnalysis}
                    className="text-xs text-[#667EEA] hover:text-[#9BB2FF] flex items-center gap-1 transition">
                    Full Report <ArrowRight className="w-3 h-3" />
                  </button>
                </motion.div>
              )}

              <button onClick={handleAnalyze} disabled={isAnalyzing}
                className="w-full mt-5 py-3.5 rounded-xl bg-gradient-to-r from-[#667EEA] to-[#764BA2] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#667EEA]/20 hover:shadow-[#667EEA]/40"
              >
                {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</> : <><Sparkles className="w-4 h-4" />Analyze Content<ArrowRight className="w-4 h-4" /></>}
              </button>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/25">
                <Lock className="w-3 h-3" /><span>Sign in required to save results</span>
              </div>
            </div>

            {/* Feature pills */}
            <div className="grid grid-cols-2 gap-2.5 mt-5">
              {features.map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-3 flex items-start gap-2.5"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#667EEA]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <f.icon className="w-3.5 h-3.5 text-[#667EEA]" />
                  </div>
                  <div>
                    <p className="text-[11px] text-white/70 font-semibold leading-tight">{f.label}</p>
                    <p className="text-[10px] text-white/30 leading-tight mt-0.5">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Scroll indicator */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
        className="flex justify-center pb-4 -mt-12 relative z-20">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-1 text-white/20">
          <span className="text-xs">Scroll to learn more</span>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.div>

      {/* ══ STATS SECTION ══ */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 rounded-2xl border border-white/5 bg-white/[0.02]"
              >
                <p className="text-3xl font-bold bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent">{s.value}</p>
                <p className="text-white/40 text-sm mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ IMAGE COMPARISON ══ */}
      <section className="py-16 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-[#667EEA]/30 to-transparent" />
        <ImageComparison
          aiImageSrc="/images/ai-sample.jpg"
          realImageSrc="/images/real-sample.jpg"
          aiConfidence={94}
          realConfidence={97}
        />
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="py-20 px-6">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.8 }} className="max-w-4xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            How{" "}
            <span className="bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent">EcoTrace</span>{" "}
            Works
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Upload Content", desc: "Drop an image, paste text, or provide a URL.", color: "#667EEA" },
              { step: "02", title: "Multi-Model Scan", desc: "4 AI models analyze facial mesh, frequency anomalies & metadata.", color: "#764BA2" },
              { step: "03", title: "Get Verdict", desc: "Receive a forensic report with confidence scores, evidence & highlighted regions.", color: "#51CF66" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 relative overflow-hidden group hover:border-white/10 transition-colors"
              >
                <div className="absolute -top-4 -right-4 text-[80px] font-black leading-none opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" style={{ color: item.color }}>{item.step}</div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold mb-4"
                  style={{ background: `${item.color}15`, color: item.color, border: `1px solid ${item.color}30` }}>
                  {item.step}
                </div>
                <h4 className="text-white font-semibold mb-2">{item.title}</h4>
                <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══ WHO WE PROTECT ══ */}
      <section className="py-16 px-6">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-white text-center mb-10">Who We Protect</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Star, title: "Influencers & Creators", color: "#667EEA",
                desc: "Deepfake images damage reputations overnight. EcoTrace lets you verify any image before it goes viral and file a complaint if your likeness is misused.",
                tags: ["Face Verification", "Reputation Protection", "Complaint Filing"],
              },
              {
                icon: Users, title: "Elderly Users", color: "#51CF66",
                desc: "AI-generated images are used in scams targeting elderly people. EcoTrace provides a simple, one-click verification to expose fake images used in fraud.",
                tags: ["Scam Detection", "Simple Interface", "Fraud Prevention"],
              },
            ].map((card, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: i === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                className="rounded-2xl border p-6" style={{ borderColor: `${card.color}30`, background: `${card.color}08` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${card.color}20` }}>
                    <card.icon className="w-5 h-5" style={{ color: card.color }} />
                  </div>
                  <h4 className="text-white font-semibold text-lg">{card.title}</h4>
                </div>
                <p className="text-white/50 text-sm leading-relaxed mb-4">{card.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {card.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{ background: `${card.color}15`, color: card.color, border: `1px solid ${card.color}30` }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══ PRICING CTA ══ */}
      <section className="py-20 px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="rounded-2xl border border-[#667EEA]/20 bg-gradient-to-br from-[#667EEA]/10 to-[#764BA2]/10 p-10">
            <AlertTriangle className="w-8 h-8 text-[#FFD700] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">Ready to Fight AI Fraud?</h3>
            <p className="text-white/50 mb-6 text-sm">Start for free. Upgrade for forensic-grade reports, PDF downloads, and API access.</p>
            <div className="flex items-center justify-center gap-3">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#667EEA] to-[#764BA2] text-white font-semibold text-sm shadow-lg shadow-[#667EEA]/20 hover:shadow-[#667EEA]/40 transition-shadow"
              >
                Start Verifying Free
              </motion.button>
              <motion.a href="/pricing" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 font-medium text-sm transition"
              >
                View Plans →
              </motion.a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#667EEA] to-[#764BA2] flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent">EcoTrace</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/30">
            <a href="/about" className="hover:text-white/60 transition">About</a>
            <a href="/pricing" className="hover:text-white/60 transition">Pricing</a>
            <span>© 2026 EcoTrace. AI Content Verification Engine.</span>
          </div>
        </div>
      </footer>
    </AnimatedBackground>
  );
}
