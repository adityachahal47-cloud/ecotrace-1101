"use client";

import { useState, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Upload, Link as LinkIcon, FileText, Image, ArrowRight,
  Loader2, Sparkles, Eye, Lock, X, CheckCircle2, ChevronDown
} from "lucide-react";

/* ── Lazy-loaded heavy components ── */
const ImageTransition = dynamic(
  () => import("@/components/landing/ImageTransition"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#0a0a1a]">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#667EEA]/20 to-[#764BA2]/20 animate-pulse" />
      </div>
    ),
  }
);

const AnimatedBackground = dynamic(
  () => import("@/components/landing/AnimatedBackground"),
  { ssr: false, loading: () => <div className="min-h-screen bg-[#0a0a1a]" /> }
);

const ImageComparison = dynamic(
  () => import("@/components/landing/ImageComparison"),
  { ssr: false }
);

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";

export default function LandingPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [textContent, setTextContent] = useState("");
  const [urlContent, setUrlContent] = useState("");
  const [inputMode, setInputMode] = useState<"upload" | "url" | "text">("upload");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

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

      setStatus("Analyzing with 3 heuristic models...");
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
      setStatus("Analysis complete! Redirecting...");
      setTimeout(() => {
        router.push(token ? `/result/${result.request_id}` : `/login?redirect=/result/${result.request_id}`);
      }, 500);
    } catch (err: any) {
      setError(
        err instanceof TypeError && err.message === "Failed to fetch"
          ? "Backend server is not reachable. Make sure it's running."
          : err.message || "Analysis failed"
      );
      setIsAnalyzing(false);
      setStatus("");
    }
  }

  const features = [
    { icon: Eye, label: "Face & Skin Analysis", desc: "Detects deformed fingers, unnatural symmetry" },
    { icon: Sparkles, label: "Frequency Analysis", desc: "FFT spectrum & edge anomaly detection" },
    { icon: Shield, label: "Watermark Detection", desc: "Scans for AI logos & missing EXIF data" },
  ];

  return (
    <AnimatedBackground showGrid={ true } intensity={ 1 }>
      {/* ════════════════════════════════════════
          NAVBAR
          ════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a1a]/60 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#667EEA] to-[#764BA2] flex items-center justify-center shadow-lg shadow-[#667EEA]/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent">
                EcoTrace
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={ () => router.push("/login") } className="px-5 py-2 text-sm text-white/60 hover:text-white transition-colors">
                Sign In
              </button>
              <button onClick={ () => router.push("/signup") } className="px-5 py-2 text-sm rounded-xl bg-gradient-to-r from-[#667EEA] to-[#764BA2] text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-[#667EEA]/20">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ════════════════════════════════════════
          HERO — Split: Image Transition left / Analyze right
          ════════════════════════════════════════ */}
      <section className="pt-16 min-h-screen flex">
        {/* LEFT — Image Transition Showcase */ }
        <div className="hidden lg:flex w-1/2 relative">
          <div className="absolute inset-0 pt-16">
            <ImageTransition />
          </div>
        </div>

        {/* RIGHT — Upload & Analyze */ }
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 lg:px-14 py-10 relative">
          <motion.div initial={ { opacity: 0, y: 30 } } animate={ { opacity: 1, y: 0 } } transition={ { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } className="w-full max-w-lg">
            {/* Mobile title */ }
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">
                <span className="bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent">EcoTrace</span>
              </h1>
              <p className="text-white/40 text-sm">AI Content Verification Engine</p>
            </div>

            {/* Analyze Card */ }
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#667EEA] to-[#764BA2] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Analyze Content</h2>
                  <p className="text-xs text-white/40">Upload an image to verify authenticity</p>
                </div>
              </div>

              {/* Tabs */ }
              <div className="flex gap-1 p-1 rounded-xl bg-white/5 mb-5">
                { ([
                  { mode: "upload" as const, icon: Upload, label: "Upload" },
                  { mode: "url" as const, icon: LinkIcon, label: "URL" },
                  { mode: "text" as const, icon: FileText, label: "Text" },
                ]).map((tab) => (
                  <button key={ tab.mode } onClick={ () => { setInputMode(tab.mode); setError(null); } }
                    className={ `flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${inputMode === tab.mode
                      ? "bg-gradient-to-r from-[#667EEA] to-[#764BA2] text-white shadow-lg"
                      : "text-white/40 hover:text-white/60"
                      }` }>
                    <tab.icon className="w-4 h-4" />{ tab.label }
                  </button>
                )) }
              </div>

              {/* Input areas */ }
              <AnimatePresence mode="wait">
                { inputMode === "upload" && (
                  <motion.div key="upload" initial={ { opacity: 0, y: 10 } } animate={ { opacity: 1, y: 0 } } exit={ { opacity: 0, y: -10 } }>
                    { selectedFile ? (
                      <div className="relative rounded-xl border border-white/10 bg-white/5 p-4">
                        <button onClick={ clearFile } className="absolute top-2 right-2 p-1 rounded-lg bg-white/10 hover:bg-white/20 transition">
                          <X className="w-4 h-4 text-white/60" />
                        </button>
                        { preview ? (
                          <img src={ preview } alt="Preview" className="w-full h-48 object-contain rounded-lg" />
                        ) : (
                          <div className="flex items-center gap-3 py-4">
                            <Image className="w-8 h-8 text-[#667EEA]" />
                            <div>
                              <p className="text-sm text-white font-medium">{ selectedFile.name }</p>
                              <p className="text-xs text-white/40">{ (selectedFile.size / 1024).toFixed(1) } KB</p>
                            </div>
                          </div>
                        ) }
                        <div className="flex items-center gap-2 mt-3">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-green-400/80">Ready to analyze</span>
                        </div>
                      </div>
                    ) : (
                      <div { ...getRootProps() } className={ `border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? "border-[#667EEA] bg-[#667EEA]/5" : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                        }` }>
                        <input { ...getInputProps() } />
                        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[#667EEA]/20 to-[#764BA2]/20 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-[#667EEA]" />
                        </div>
                        <p className="text-sm text-white/70 font-medium">{ isDragActive ? "Drop your image here" : "Drag & drop an image" }</p>
                        <p className="text-xs text-white/30 mt-1">PNG, JPG, WEBP up to 10MB</p>
                      </div>
                    ) }
                  </motion.div>
                ) }
                { inputMode === "url" && (
                  <motion.div key="url" initial={ { opacity: 0, y: 10 } } animate={ { opacity: 1, y: 0 } } exit={ { opacity: 0, y: -10 } }>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input type="url" value={ urlContent } onChange={ (e) => { setUrlContent(e.target.value); setError(null); } }
                        placeholder="https://example.com/image.jpg"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#667EEA]/50 focus:ring-1 focus:ring-[#667EEA]/20 transition" />
                    </div>
                  </motion.div>
                ) }
                { inputMode === "text" && (
                  <motion.div key="text" initial={ { opacity: 0, y: 10 } } animate={ { opacity: 1, y: 0 } } exit={ { opacity: 0, y: -10 } }>
                    <textarea value={ textContent } onChange={ (e) => { setTextContent(e.target.value); setError(null); } }
                      placeholder="Paste text to check if it's AI-generated..."
                      rows={ 5 }
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#667EEA]/50 focus:ring-1 focus:ring-[#667EEA]/20 transition resize-none" />
                  </motion.div>
                ) }
              </AnimatePresence>

              { error && (
                <motion.div initial={ { opacity: 0, y: 5 } } animate={ { opacity: 1, y: 0 } }
                  className="mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{ error }</motion.div>
              ) }
              { status && isAnalyzing && (
                <motion.div initial={ { opacity: 0 } } animate={ { opacity: 1 } } className="mt-4 flex items-center gap-2 text-sm text-[#667EEA]">
                  <Loader2 className="w-4 h-4 animate-spin" />{ status }
                </motion.div>
              ) }

              <button onClick={ handleAnalyze } disabled={ isAnalyzing }
                className="w-full mt-5 py-3.5 rounded-xl bg-gradient-to-r from-[#667EEA] to-[#764BA2] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#667EEA]/20 hover:shadow-[#667EEA]/40">
                { isAnalyzing ? (<><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</>) : (<><Sparkles className="w-4 h-4" />Analyze Content<ArrowRight className="w-4 h-4" /></>) }
              </button>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/25">
                <Lock className="w-3 h-3" /><span>Sign in required to view results</span>
              </div>
            </div>

            {/* Feature cards */ }
            <div className="grid grid-cols-3 gap-3 mt-6">
              { features.map((f, i) => (
                <motion.div key={ i } initial={ { opacity: 0, y: 20 } } animate={ { opacity: 1, y: 0 } }
                  transition={ { delay: 0.3 + i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
                  <f.icon className="w-5 h-5 mx-auto mb-2 text-[#667EEA]" />
                  <p className="text-[11px] text-white/50 font-medium leading-tight">{ f.desc }</p>
                </motion.div>
              )) }
            </div>
          </motion.div>
        </div>
      </section>

      {/* Scroll indicator */ }
      <motion.div
        initial={ { opacity: 0 } }
        animate={ { opacity: 1 } }
        transition={ { delay: 2 } }
        className="flex justify-center pb-4 -mt-16 relative z-20"
      >
        <motion.div
          animate={ { y: [0, 8, 0] } }
          transition={ { duration: 2, repeat: Infinity, ease: "easeInOut" } }
          className="flex flex-col items-center gap-1 text-white/20"
        >
          <span className="text-xs">Scroll to see more</span>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.div>

      {/* ════════════════════════════════════════
          IMAGE COMPARISON SECTION
          ════════════════════════════════════════ */}
      <section className="py-20 px-6 relative">
        {/* Subtle section divider glow */ }
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-[#667EEA]/30 to-transparent" />

        <ImageComparison
          aiImageSrc="/images/ai-sample.jpg"
          realImageSrc="/images/real-sample.jpg"
          aiConfidence={ 94 }
          realConfidence={ 97 }
        />
      </section>

      {/* ════════════════════════════════════════
          HOW IT WORKS SECTION
          ════════════════════════════════════════ */}
      <section className="py-20 px-6">
        <motion.div
          initial={ { opacity: 0, y: 40 } }
          whileInView={ { opacity: 1, y: 0 } }
          viewport={ { once: true, margin: "-100px" } }
          transition={ { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
          className="max-w-4xl mx-auto"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            How{ " " }
            <span className="bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent">
              EcoTrace
            </span>{ " " }
            Works
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            { [
              {
                step: "01",
                title: "Upload Content",
                desc: "Drop an image, paste text, or provide a URL. We accept all major formats.",
                color: "#667EEA",
              },
              {
                step: "02",
                title: "Cross-Examine",
                desc: "3 independent models analyze the content: face detection, frequency analysis, and metadata verification.",
                color: "#764BA2",
              },
              {
                step: "03",
                title: "Get Verdict",
                desc: "Receive a detailed report with confidence scores, evidence, and structural flags.",
                color: "#51CF66",
              },
            ].map((item, i) => (
              <motion.div
                key={ i }
                initial={ { opacity: 0, y: 30 } }
                whileInView={ { opacity: 1, y: 0 } }
                viewport={ { once: true } }
                transition={ {
                  delay: i * 0.15,
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                } }
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 relative overflow-hidden group hover:border-white/10 transition-colors"
              >
                {/* Step number glow */ }
                <div
                  className="absolute -top-4 -right-4 text-[80px] font-black leading-none opacity-[0.03] group-hover:opacity-[0.06] transition-opacity"
                  style={ { color: item.color } }
                >
                  { item.step }
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold mb-4"
                  style={ {
                    background: `${item.color}15`,
                    color: item.color,
                    border: `1px solid ${item.color}30`,
                  } }
                >
                  { item.step }
                </div>
                <h4 className="text-white font-semibold mb-2">{ item.title }</h4>
                <p className="text-white/40 text-sm leading-relaxed">
                  { item.desc }
                </p>
              </motion.div>
            )) }
          </div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
          ════════════════════════════════════════ */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#667EEA] to-[#764BA2] flex items-center justify-center">
              <Shield className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent">
              EcoTrace
            </span>
          </div>
          <p className="text-white/20 text-xs">
            AI Content Verification Engine
          </p>
        </div>
      </footer>
    </AnimatedBackground>
  );
}
