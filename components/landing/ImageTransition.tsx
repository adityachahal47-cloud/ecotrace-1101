"use client";

/**
 * ImageTransition — Auto-cycling image showcase with smooth
 * crossfade, scale, and parallax transitions.
 *
 * Shows a series of images that transition automatically with:
 * - Smooth crossfade between images
 * - Ken Burns zoom/pan effect
 * - Gradient overlays for depth
 * - Floating label tags for context
 * - Progress indicators
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, Camera, ShieldCheck, Scan } from "lucide-react";

interface SlideData {
  /** Image source URL */
  src: string;
  /** Label text */
  label: string;
  /** Badge color */
  color: string;
  /** Sub-text */
  subtitle: string;
  /** Icon component */
  icon: React.ElementType;
  /** Ken Burns transform origin */
  transformOrigin: string;
}

const SLIDES: SlideData[] = [
  {
    src: "/images/ai-sample.jpg",
    label: "AI Generated",
    color: "#FF6B6B",
    subtitle: "Detected: Smooth texture, missing noise",
    icon: Sparkles,
    transformOrigin: "center center",
  },
  {
    src: "/images/real-sample.jpg",
    label: "Verified Real",
    color: "#51CF66",
    subtitle: "Authentic: Natural noise, EXIF data found",
    icon: Camera,
    transformOrigin: "top left",
  },
  {
    src: "/images/ai-sample.jpg",
    label: "Scanning...",
    color: "#667EEA",
    subtitle: "3 models cross-examining content",
    icon: Scan,
    transformOrigin: "bottom right",
  },
  {
    src: "/images/real-sample.jpg",
    label: "Verdict: Real",
    color: "#51CF66",
    subtitle: "97% confidence across all models",
    icon: ShieldCheck,
    transformOrigin: "center top",
  },
];

const DURATION = 4000; // ms per slide

/* ── Variants for crossfade + scale ── */
const imageVariants = {
  enter: { opacity: 0, scale: 1.1 },
  center: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

const labelVariants = {
  enter: { opacity: 0, y: 20, filter: "blur(8px)" },
  center: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -15, filter: "blur(8px)" },
};

export default function ImageTransition() {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const prefersReduced = useReducedMotion();

  /* ── Auto-advance slides ── */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
      setProgress(0);
    }, DURATION);
    return () => clearInterval(interval);
  }, []);

  /* ── Progress bar animation ── */
  useEffect(() => {
    const step = 16; // ~60fps
    const inc = (step / DURATION) * 100;
    const timer = setInterval(() => {
      setProgress((prev) => Math.min(prev + inc, 100));
    }, step);
    return () => clearInterval(timer);
  }, [current]);

  const slide = SLIDES[current];
  const Icon = slide.icon;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* ── Image layer with Ken Burns ── */ }
      <AnimatePresence mode="wait">
        <motion.div
          key={ current }
          className="absolute inset-0"
          variants={ imageVariants }
          initial="enter"
          animate="center"
          exit="exit"
          transition={ { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
        >
          <motion.img
            src={ slide.src }
            alt={ slide.label }
            className="w-full h-full object-cover"
            draggable={ false }
            /* Ken Burns zoom effect */
            initial={ { scale: 1 } }
            animate={ prefersReduced ? {} : { scale: 1.08 } }
            transition={ { duration: DURATION / 1000, ease: "linear" } }
            style={ { transformOrigin: slide.transformOrigin } }
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Gradient overlays ── */ }
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Bottom gradient for text readability */ }
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0a0a1a] via-[#0a0a1a]/60 to-transparent" />
        {/* Top subtle gradient */ }
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0a0a1a]/40 to-transparent" />
        {/* Right edge blend */ }
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0a0a1a] to-transparent" />
        {/* Colored tint per slide */ }
        <div
          className="absolute inset-0 opacity-10 transition-colors duration-1000"
          style={ { backgroundColor: slide.color } }
        />
      </div>

      {/* ── Scan line effect ── */ }
      <motion.div
        className="absolute inset-x-0 h-[1px] z-20 pointer-events-none"
        style={ {
          background: `linear-gradient(90deg, transparent, ${slide.color}60, transparent)`,
          boxShadow: `0 0 20px ${slide.color}40`,
        } }
        animate={ { top: ["0%", "100%"] } }
        transition={ {
          duration: DURATION / 1000,
          ease: "linear",
          repeat: Infinity,
        } }
      />

      {/* ── Content overlay ── */ }
      <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 pointer-events-none">
        {/* Badge + label */ }
        <AnimatePresence mode="wait">
          <motion.div
            key={ `label-${current}` }
            variants={ labelVariants }
            initial="enter"
            animate="center"
            exit="exit"
            transition={ { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
          >
            {/* Status badge */ }
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl mb-4"
              style={ {
                backgroundColor: `${slide.color}20`,
                border: `1px solid ${slide.color}40`,
              } }
            >
              <Icon className="w-4 h-4" style={ { color: slide.color } } />
              <span
                className="text-sm font-semibold"
                style={ { color: slide.color } }
              >
                { slide.label }
              </span>
            </div>

            {/* Subtitle */ }
            <p className="text-white/50 text-sm max-w-xs">{ slide.subtitle }</p>
          </motion.div>
        </AnimatePresence>

        {/* Progress indicators */ }
        <div className="flex gap-2 mt-6">
          { SLIDES.map((_, i) => (
            <div
              key={ i }
              className="h-[3px] rounded-full overflow-hidden flex-1"
              style={ { backgroundColor: "rgba(255,255,255,0.1)" } }
            >
              <motion.div
                className="h-full rounded-full"
                style={ {
                  backgroundColor:
                    i === current ? slide.color : "transparent",
                  width: i === current ? `${progress}%` : i < current ? "100%" : "0%",
                } }
                transition={ { duration: 0.1 } }
              />
            </div>
          )) }
        </div>
      </div>

      {/* ── Corner decoration ── */ }
      <div className="absolute top-6 left-6 z-20">
        <div className="w-8 h-8 border-l-2 border-t-2 rounded-tl-lg opacity-30" style={ { borderColor: slide.color } } />
      </div>
      <div className="absolute top-6 right-6 z-20">
        <div className="w-8 h-8 border-r-2 border-t-2 rounded-tr-lg opacity-30" style={ { borderColor: slide.color } } />
      </div>
      <div className="absolute bottom-6 left-6 z-20">
        <div className="w-8 h-8 border-l-2 border-b-2 rounded-bl-lg opacity-30" style={ { borderColor: slide.color } } />
      </div>
    </div>
  );
}
