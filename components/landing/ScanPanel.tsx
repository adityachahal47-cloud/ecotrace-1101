"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, Camera, ShieldCheck, Scan, CheckCircle2, XCircle, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

interface ScanPanelProps {
    scanState: "idle" | "scanning" | "done";
    uploadedImage: string | null;
    result?: {
        verdict: "ai_generated" | "real";
        confidence: number;
        requestId: string;
    } | null;
    onViewAnalysis?: () => void;
}

// ── Idle auto-cycling slides ──
const SLIDES = [
    { src: "/images/ai-sample.jpg", label: "AI Generated", color: "#FF6B6B", subtitle: "Detected: Smooth texture, missing noise", icon: Sparkles, transformOrigin: "center center" },
    { src: "/images/real-sample.jpg", label: "Verified Real", color: "#51CF66", subtitle: "Authentic: Natural noise, EXIF data found", icon: Camera, transformOrigin: "top left" },
    { src: "/images/ai-sample.jpg", label: "Scanning...", color: "#667EEA", subtitle: "4 models cross-examining content", icon: Scan, transformOrigin: "bottom right" },
    { src: "/images/real-sample.jpg", label: "Verdict: Real", color: "#51CF66", subtitle: "97% confidence across all models", icon: ShieldCheck, transformOrigin: "center top" },
];
const DURATION = 4000;

// ── SVG face mesh grid lines (neon overlay) ──
function FaceMeshOverlay({ color }: { color: string }) {
    const lines = [
        // Horizontal face structure
        "M 120 80 Q 200 60 280 80",
        "M 100 110 Q 200 90 300 110",
        "M 95 145 Q 200 125 305 145",
        "M 100 185 Q 200 165 300 185",
        "M 110 225 Q 200 210 290 225",
        "M 130 265 Q 200 255 270 265",
        // Vertical lines
        "M 160 70 Q 155 200 165 300",
        "M 200 55 L 200 310",
        "M 240 70 Q 245 200 235 300",
        // Cheek lines
        "M 100 140 Q 80 200 100 260",
        "M 300 140 Q 320 200 300 260",
        // Eye markers
        "M 145 120 Q 165 115 185 120 Q 165 130 145 120",
        "M 215 120 Q 235 115 255 120 Q 235 130 215 120",
        // Nose
        "M 195 145 L 190 195 Q 200 205 210 195 L 205 145",
        // Mouth
        "M 160 245 Q 200 260 240 245",
        "M 165 255 Q 200 270 235 255",
        // Chin
        "M 155 285 Q 200 305 245 285",
        // Forehead 
        "M 140 75 Q 200 55 260 75",
        // Cross-lines
        "M 120 160 Q 200 150 280 160",
        "M 115 200 Q 200 190 285 200",
    ];

    const dots = [
        [200, 60], [145, 75], [255, 75], [120, 100], [280, 100],
        [100, 145], [300, 145], [160, 120], [185, 118], [215, 118], [240, 120],
        [200, 200], [200, 220], [165, 245], [235, 245], [200, 305],
        [130, 170], [270, 170], [140, 250], [260, 250],
    ];

    return (
        <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 400 370"
            preserveAspectRatio="xMidYMid meet"
        >
            {lines.map((d, i) => (
                <motion.path
                    key={i}
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeWidth="0.8"
                    strokeOpacity="0.6"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.6 }}
                    transition={{ duration: 1.2, delay: i * 0.04, ease: "easeOut" }}
                />
            ))}
            {dots.map(([cx, cy], i) => (
                <motion.circle
                    key={`dot-${i}`}
                    cx={cx}
                    cy={cy}
                    r="2.5"
                    fill={color}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.9 }}
                    transition={{ duration: 0.3, delay: 0.5 + i * 0.03 }}
                />
            ))}
        </svg>
    );
}

export default function ScanPanel({ scanState, uploadedImage, result, onViewAnalysis }: ScanPanelProps) {
    const [current, setCurrent] = useState(0);
    const [progress, setProgress] = useState(0);
    const [scanProgress, setScanProgress] = useState(0);
    const prefersReduced = useReducedMotion();
    const router = useRouter();

    // Idle: auto-advance slides
    useEffect(() => {
        if (scanState !== "idle") return;
        const iv = setInterval(() => {
            setCurrent((p) => (p + 1) % SLIDES.length);
            setProgress(0);
        }, DURATION);
        return () => clearInterval(iv);
    }, [scanState]);

    // Idle: progress bar
    useEffect(() => {
        if (scanState !== "idle") return;
        const step = 16;
        const inc = (step / DURATION) * 100;
        const t = setInterval(() => setProgress((p) => Math.min(p + inc, 100)), step);
        return () => clearInterval(t);
    }, [current, scanState]);

    // Scanning: 0→100% counter
    useEffect(() => {
        if (scanState !== "scanning") { setScanProgress(0); return; }
        setScanProgress(0);
        const t = setInterval(() => {
            setScanProgress((p) => {
                if (p >= 100) { clearInterval(t); return 100; }
                // Slow near end for drama
                const speed = p < 80 ? 1.2 : p < 95 ? 0.5 : 0.2;
                return Math.min(p + speed, 100);
            });
        }, 60);
        return () => clearInterval(t);
    }, [scanState]);

    const slide = SLIDES[current];
    const Icon = slide.icon;
    const isAI = result?.verdict === "ai_generated";
    const pct = result ? Math.round(result.confidence * 100) : 0;

    // ── Corner brackets ──
    const corners = [
        "absolute top-5 left-5 w-7 h-7 border-l-2 border-t-2 rounded-tl-md",
        "absolute top-5 right-5 w-7 h-7 border-r-2 border-t-2 rounded-tr-md",
        "absolute bottom-5 left-5 w-7 h-7 border-l-2 border-b-2 rounded-bl-md",
        "absolute bottom-5 right-5 w-7 h-7 border-r-2 border-b-2 rounded-br-md",
    ];

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">

            {/* ── STATE: IDLE ── */}
            <AnimatePresence mode="wait">
                {scanState === "idle" && (
                    <motion.div key="idle" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {/* Image */}
                        <AnimatePresence mode="wait">
                            <motion.div key={current} className="absolute inset-0"
                                initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <motion.img src={slide.src} alt={slide.label} className="w-full h-full object-cover" draggable={false}
                                    initial={{ scale: 1 }} animate={prefersReduced ? {} : { scale: 1.06 }}
                                    transition={{ duration: DURATION / 1000, ease: "linear" }}
                                    style={{ transformOrigin: slide.transformOrigin }}
                                />
                            </motion.div>
                        </AnimatePresence>

                        {/* Gradients */}
                        <div className="absolute inset-0 z-10 pointer-events-none">
                            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0a0a1a] via-[#0a0a1a]/60 to-transparent" />
                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0a0a1a]/40 to-transparent" />
                            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#0a0a1a] to-transparent" />
                            <div className="absolute inset-0 opacity-10 transition-colors duration-1000" style={{ backgroundColor: slide.color }} />
                        </div>

                        {/* Scan line */}
                        <motion.div className="absolute inset-x-0 h-[1px] z-20 pointer-events-none"
                            style={{ background: `linear-gradient(90deg, transparent, ${slide.color}60, transparent)`, boxShadow: `0 0 20px ${slide.color}40` }}
                            animate={{ top: ["0%", "100%"] }}
                            transition={{ duration: DURATION / 1000, ease: "linear", repeat: Infinity }}
                        />

                        {/* Content */}
                        <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 pointer-events-none">
                            <AnimatePresence mode="wait">
                                <motion.div key={`label-${current}`}
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl mb-3"
                                        style={{ backgroundColor: `${slide.color}20`, border: `1px solid ${slide.color}40` }}
                                    >
                                        <Icon className="w-4 h-4" style={{ color: slide.color }} />
                                        <span className="text-sm font-semibold" style={{ color: slide.color }}>{slide.label}</span>
                                    </div>
                                    <p className="text-white/50 text-sm">{slide.subtitle}</p>
                                </motion.div>
                            </AnimatePresence>

                            {/* Progress dots */}
                            <div className="flex gap-2 mt-5">
                                {SLIDES.map((_, i) => (
                                    <div key={i} className="h-[3px] rounded-full overflow-hidden flex-1" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                                        <div className="h-full rounded-full transition-all" style={{
                                            backgroundColor: i === current ? slide.color : "transparent",
                                            width: i === current ? `${progress}%` : i < current ? "100%" : "0%",
                                        }} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Corner brackets */}
                        {corners.map((cls, i) => (
                            <div key={i} className={`${cls} z-20 opacity-30`} style={{ borderColor: slide.color }} />
                        ))}
                    </motion.div>
                )}

                {/* ── STATE: SCANNING ── */}
                {(scanState === "scanning" || scanState === "done") && uploadedImage && (
                    <motion.div key="scanning" className="absolute inset-0"
                        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* Uploaded image */}
                        <img src={uploadedImage} alt="Scanning" className="w-full h-full object-cover" />

                        {/* Dark overlay */}
                        <div className="absolute inset-0 bg-[#0a0a1a]/50" />

                        {/* Gradients */}
                        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#0a0a1a]/90 to-transparent" />

                        {/* Face mesh */}
                        {scanState === "scanning" && (
                            <FaceMeshOverlay color="#FFD700" />
                        )}

                        {/* Scan line (only while scanning) */}
                        {scanState === "scanning" && (
                            <motion.div
                                className="absolute inset-x-0 h-[2px] z-20 pointer-events-none"
                                style={{
                                    background: "linear-gradient(90deg, transparent, #FFD700, #FFF700, #FFD700, transparent)",
                                    boxShadow: "0 0 30px #FFD70080, 0 0 60px #FFD70040",
                                }}
                                animate={{ top: ["5%", "95%", "5%"] }}
                                transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity }}
                            />
                        )}

                        {/* Neon grid overlay */}
                        {scanState === "scanning" && (
                            <div className="absolute inset-0 z-10 pointer-events-none"
                                style={{
                                    backgroundImage: `linear-gradient(rgba(102,126,234,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(102,126,234,0.05) 1px, transparent 1px)`,
                                    backgroundSize: "40px 40px",
                                }}
                            />
                        )}

                        {/* Corner brackets */}
                        {corners.map((cls, i) => (
                            <div key={i} className={`${cls} z-30 border-[#667EEA] opacity-70`} />
                        ))}

                        {/* Bottom HUD */}
                        <div className="absolute bottom-0 left-0 right-0 z-30 p-5">
                            {scanState === "scanning" ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                    {/* Scanning status */}
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-[#667EEA] font-medium flex items-center gap-2">
                                            <motion.div className="w-2 h-2 rounded-full bg-[#667EEA]"
                                                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                                            Analyzing with GPT-4o + 3 models...
                                        </span>
                                        <span className="text-white font-bold text-lg">{Math.round(scanProgress)}%</span>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                        <motion.div className="h-full rounded-full bg-gradient-to-r from-[#667EEA] to-[#FFD700]"
                                            style={{ width: `${scanProgress}%` }} transition={{ duration: 0.1 }} />
                                    </div>
                                    <div className="flex gap-4 text-xs text-white/40">
                                        {["Face mesh", "Frequency analysis", "EXIF metadata", "GPT-4o vision"].map((s, i) => (
                                            <span key={i} className={scanProgress > (i + 1) * 22 ? "text-[#51CF66]" : "text-white/30"}>✓ {s}</span>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                /* Done result badge */
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ type: "spring", duration: 0.5 }}
                                    className="space-y-3"
                                >
                                    {/* Verdict badge */}
                                    <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-xl ${isAI
                                        ? "bg-red-500/20 border-red-500/40"
                                        : "bg-green-500/20 border-green-500/40"
                                        }`}>
                                        {isAI
                                            ? <XCircle className="w-5 h-5 text-red-400" />
                                            : <CheckCircle2 className="w-5 h-5 text-green-400" />
                                        }
                                        <div>
                                            <p className={`font-bold text-base ${isAI ? "text-red-400" : "text-green-400"}`}>
                                                {isAI ? "AI GENERATED" : "REAL IMAGE"} — {pct}%
                                            </p>
                                            <p className="text-white/50 text-xs">
                                                {isAI ? "This image shows AI generation indicators" : "This image appears to be authentic"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* View full analysis button */}
                                    {onViewAnalysis && (
                                        <motion.button
                                            onClick={onViewAnalysis}
                                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#667EEA] to-[#764BA2] text-white text-sm font-semibold shadow-lg shadow-[#667EEA]/30 hover:shadow-[#667EEA]/50 transition-shadow"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View Full Analysis →
                                        </motion.button>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
