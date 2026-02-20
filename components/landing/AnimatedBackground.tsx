"use client";

/**
 * AnimatedBackground — Reusable animated background with:
 * - Animated gradient mesh (GPU-accelerated)
 * - Floating glass particles with parallax
 * - Subtle grid overlay
 * - Reduced motion support
 *
 * Used on: Homepage, Login, Signup pages
 */

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface AnimatedBackgroundProps {
  /** Show grid overlay */
  showGrid?: boolean;
  /** Intensity of glow (0-1) */
  intensity?: number;
  /** Additional className for the container */
  className?: string;
  children?: React.ReactNode;
}

/* ── Floating glass particle ── */
function Particle({
  delay,
  size,
  x,
  y,
  duration,
  color,
}: {
  delay: number;
  size: number;
  x: string;
  y: string;
  duration: number;
  color: string;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={ {
        width: size,
        height: size,
        left: x,
        top: y,
        background: `radial-gradient(circle, ${color}40 0%, ${color}00 70%)`,
        willChange: "transform, opacity",
      } }
      initial={ { opacity: 0, scale: 0.3 } }
      animate={
        prefersReduced
          ? { opacity: 0.3 }
          : {
            opacity: [0, 0.6, 0.3, 0.6, 0],
            scale: [0.3, 1, 0.8, 1, 0.3],
            y: [0, -30, -10, -40, 0],
            x: [0, 15, -10, 20, 0],
          }
      }
      transition={ {
        duration: duration,
        delay: delay,
        repeat: Infinity,
        ease: "easeInOut",
      } }
    />
  );
}

/* ── Primary gradient orbs ── */
function GradientOrbs({ intensity }: { intensity: number }) {
  const prefersReduced = useReducedMotion();
  const opacity = 0.3 * intensity;

  return (
    <>
      {/* Top-left primary orb */ }
      <motion.div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={ {
          background: "radial-gradient(circle, #667EEA 0%, transparent 70%)",
          opacity,
          filter: "blur(80px)",
          willChange: "transform",
        } }
        animate={
          prefersReduced
            ? {}
            : { x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.1, 1] }
        }
        transition={ { duration: 12, repeat: Infinity, ease: "easeInOut" } }
      />

      {/* Top-right secondary orb */ }
      <motion.div
        className="absolute -top-20 -right-20 w-[450px] h-[450px] rounded-full pointer-events-none"
        style={ {
          background: "radial-gradient(circle, #764BA2 0%, transparent 70%)",
          opacity: opacity * 0.8,
          filter: "blur(80px)",
          willChange: "transform",
        } }
        animate={
          prefersReduced
            ? {}
            : { x: [0, -50, 0], y: [0, 60, 0], scale: [1, 1.15, 1] }
        }
        transition={ {
          duration: 15,
          delay: 2,
          repeat: Infinity,
          ease: "easeInOut",
        } }
      />

      {/* Bottom-center accent orb */ }
      <motion.div
        className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={ {
          background: "radial-gradient(circle, #51CF66 0%, transparent 70%)",
          opacity: opacity * 0.4,
          filter: "blur(100px)",
          willChange: "transform",
        } }
        animate={
          prefersReduced
            ? {}
            : { x: [0, 40, -30, 0], y: [0, -30, 0], scale: [1, 1.05, 1] }
        }
        transition={ {
          duration: 18,
          delay: 4,
          repeat: Infinity,
          ease: "easeInOut",
        } }
      />

      {/* Center subtle glow */ }
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={ {
          background:
            "radial-gradient(circle, #667EEA10 0%, transparent 60%)",
          willChange: "transform",
        } }
        animate={
          prefersReduced ? {} : { scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }
        }
        transition={ { duration: 8, repeat: Infinity, ease: "easeInOut" } }
      />
    </>
  );
}

/* ── Particle configuration ── */
const PARTICLES = [
  { delay: 0, size: 6, x: "15%", y: "20%", duration: 8, color: "#667EEA" },
  { delay: 1.5, size: 4, x: "75%", y: "15%", duration: 10, color: "#764BA2" },
  { delay: 3, size: 8, x: "45%", y: "70%", duration: 9, color: "#667EEA" },
  { delay: 0.5, size: 5, x: "85%", y: "55%", duration: 11, color: "#51CF66" },
  { delay: 2, size: 3, x: "25%", y: "85%", duration: 7, color: "#764BA2" },
  { delay: 4, size: 7, x: "60%", y: "35%", duration: 12, color: "#667EEA" },
  { delay: 1, size: 4, x: "10%", y: "50%", duration: 9, color: "#764BA2" },
  { delay: 3.5, size: 6, x: "90%", y: "80%", duration: 10, color: "#51CF66" },
  { delay: 2.5, size: 5, x: "35%", y: "10%", duration: 8, color: "#667EEA" },
  { delay: 5, size: 3, x: "55%", y: "90%", duration: 11, color: "#764BA2" },
  { delay: 0.8, size: 4, x: "70%", y: "45%", duration: 13, color: "#667EEA" },
  { delay: 3.2, size: 6, x: "20%", y: "65%", duration: 9, color: "#51CF66" },
];

/* ══════════════════════════════════════════════
   AnimatedBackground — main export
   ══════════════════════════════════════════════ */
export default function AnimatedBackground({
  showGrid = true,
  intensity = 1,
  className = "",
  children,
}: AnimatedBackgroundProps) {
  return (
    <div
      className={ `relative min-h-screen overflow-hidden bg-[#0a0a1a] ${className}` }
    >
      {/* Gradient orbs layer */ }
      <div className="absolute inset-0 overflow-hidden">
        <GradientOrbs intensity={ intensity } />
      </div>

      {/* Floating particles layer */ }
      <div className="absolute inset-0 overflow-hidden">
        { PARTICLES.map((p, i) => (
          <Particle key={ i } { ...p } />
        )) }
      </div>

      {/* Grid overlay */ }
      { showGrid && (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={ {
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          } }
        />
      ) }

      {/* Vignette overlay for depth */ }
      <div
        className="absolute inset-0 pointer-events-none"
        style={ {
          background:
            "radial-gradient(ellipse at center, transparent 50%, #0a0a1a 100%)",
        } }
      />

      {/* Content layer */ }
      <div className="relative z-10">{ children }</div>
    </div>
  );
}
