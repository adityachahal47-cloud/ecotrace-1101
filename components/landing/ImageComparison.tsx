"use client";

/**
 * ImageComparison — Draggable before/after image comparison slider
 *
 * Features:
 * - Horizontal draggable divider with clip-path reveal
 * - Touch support for mobile
 * - Animated labels ("AI Generated" / "Real Image")
 * - Subtle hover glow and zoom on drag
 * - Scroll-triggered entrance animation
 * - Animated confidence percentage counter
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Sparkles, Camera, GripVertical } from "lucide-react";

interface ImageComparisonProps {
  /** Left image (AI side) */
  aiImageSrc: string;
  /** Right image (Real side) */
  realImageSrc: string;
  /** AI confidence percentage (0-100) */
  aiConfidence?: number;
  /** Real confidence percentage (0-100) */
  realConfidence?: number;
}

/* ── Animated counter ── */
function AnimatedCounter({
  target,
  suffix = "%",
  duration = 2,
}: {
  target: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = target / (duration * 60); // ~60fps
    const interval = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(interval);
  }, [isInView, target, duration]);

  return (
    <span ref={ ref } className="tabular-nums">
      { count }
      { suffix }
    </span>
  );
}

export default function ImageComparison({
  aiImageSrc,
  realImageSrc,
  aiConfidence = 94,
  realConfidence = 97,
}: ImageComparisonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const prefersReduced = useReducedMotion();

  /* ── Calculate slider position from pointer event ── */
  const updatePosition = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
      setSliderPos(pct);
    },
    []
  );

  /* ── Mouse handlers ── */
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => updatePosition(e.clientX);
    const onMouseUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, updatePosition]);

  /* ── Touch handlers ── */
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(true);
      updatePosition(e.touches[0].clientX);
    },
    [updatePosition]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isDragging) updatePosition(e.touches[0].clientX);
    },
    [isDragging, updatePosition]
  );

  const onTouchEnd = useCallback(() => setIsDragging(false), []);

  return (
    <motion.section
      ref={ containerRef }
      initial={ { opacity: 0, y: 60 } }
      animate={ isInView ? { opacity: 1, y: 0 } : {} }
      transition={ { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
      className="w-full max-w-3xl mx-auto"
    >
      {/* Section header */ }
      <motion.div
        initial={ { opacity: 0, y: 20 } }
        animate={ isInView ? { opacity: 1, y: 0 } : {} }
        transition={ { duration: 0.6, delay: 0.2 } }
        className="text-center mb-8"
      >
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
          AI Generated{ " " }
          <span className="bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent">
            vs
          </span>{ " " }
          Real
        </h3>
        <p className="text-white/40 text-sm max-w-md mx-auto">
          Drag the slider to see the difference. Our engine detects subtle
          anomalies invisible to the human eye.
        </p>
      </motion.div>

      {/* Comparison container */ }
      <div
        className={ `relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40 select-none cursor-col-resize group ${isDragging ? "cursor-grabbing" : ""
          }` }
        style={ { aspectRatio: "16/10" } }
        onMouseDown={ onMouseDown }
        onTouchStart={ onTouchStart }
        onTouchMove={ onTouchMove }
        onTouchEnd={ onTouchEnd }
      >
        {/* Hover glow effect */ }
        <div
          className="absolute inset-0 z-30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={ {
            boxShadow: "inset 0 0 60px rgba(102,126,234,0.1)",
          } }
        />

        {/* ── Right image (Real) — full background ── */ }
        <div className="absolute inset-0">
          <img
            src={ realImageSrc }
            alt="Real image"
            className="w-full h-full object-cover"
            draggable={ false }
          />
          {/* Real label */ }
          <motion.div
            initial={ { opacity: 0, x: 20 } }
            animate={ isInView ? { opacity: 1, x: 0 } : {} }
            transition={ { delay: 0.8, duration: 0.5 } }
            className="absolute top-4 right-4 z-20"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#51CF66]/20 border border-[#51CF66]/30 backdrop-blur-md">
              <Camera className="w-3.5 h-3.5 text-[#51CF66]" />
              <span className="text-xs font-semibold text-[#51CF66]">
                Real Image
              </span>
            </div>
          </motion.div>

          {/* Real confidence */ }
          <motion.div
            initial={ { opacity: 0, y: 10 } }
            animate={ isInView ? { opacity: 1, y: 0 } : {} }
            transition={ { delay: 1.2, duration: 0.5 } }
            className="absolute bottom-4 right-4 z-20"
          >
            <div className="px-3 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">
                Confidence
              </p>
              <p className="text-lg font-bold text-[#51CF66]">
                <AnimatedCounter target={ realConfidence } />
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── Left image (AI) — clipped by slider ── */ }
        <div
          className="absolute inset-0 z-10"
          style={ { clipPath: `inset(0 ${100 - sliderPos}% 0 0)` } }
        >
          <img
            src={ aiImageSrc }
            alt="AI generated image"
            className="w-full h-full object-cover"
            draggable={ false }
          />
          {/* AI label */ }
          <motion.div
            initial={ { opacity: 0, x: -20 } }
            animate={ isInView ? { opacity: 1, x: 0 } : {} }
            transition={ { delay: 0.8, duration: 0.5 } }
            className="absolute top-4 left-4 z-20"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF6B6B]/20 border border-[#FF6B6B]/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6B6B]" />
              <span className="text-xs font-semibold text-[#FF6B6B]">
                AI Generated
              </span>
            </div>
          </motion.div>

          {/* AI confidence */ }
          <motion.div
            initial={ { opacity: 0, y: 10 } }
            animate={ isInView ? { opacity: 1, y: 0 } : {} }
            transition={ { delay: 1.2, duration: 0.5 } }
            className="absolute bottom-4 left-4 z-20"
          >
            <div className="px-3 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">
                AI Likelihood
              </p>
              <p className="text-lg font-bold text-[#FF6B6B]">
                <AnimatedCounter target={ aiConfidence } />
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── Slider divider line ── */ }
        <div
          className="absolute top-0 bottom-0 z-20 flex items-center"
          style={ { left: `${sliderPos}%`, transform: "translateX(-50%)" } }
        >
          {/* Vertical line */ }
          <div className="absolute top-0 bottom-0 w-[2px] bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.4)]" />

          {/* Drag handle */ }
          <div
            className={ `relative w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/30 transition-transform ${isDragging ? "scale-110" : "hover:scale-105"
              }` }
          >
            <GripVertical className="w-4 h-4 text-[#0a0a1a]" />
          </div>
        </div>
      </div>

      {/* Bottom hint */ }
      <motion.p
        initial={ { opacity: 0 } }
        animate={ isInView ? { opacity: 1 } : {} }
        transition={ { delay: 1.5 } }
        className="text-center text-white/20 text-xs mt-4"
      >
        Drag the slider to compare
      </motion.p>
    </motion.section>
  );
}
