"use client";

/**
 * Auth Layout — Split design with Three.js 3D scene on the left
 * and login/signup form on the right, using the shared AnimatedBackground.
 */

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

const AnimatedBackground = dynamic(
  () => import("@/components/landing/AnimatedBackground"),
  { ssr: false }
);

const HeroScene = dynamic(() => import("@/components/landing/HeroScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#667EEA]/20 to-[#764BA2]/20 animate-pulse" />
    </div>
  ),
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AnimatedBackground intensity={ 0.5 } showGrid={ true }>
      <div className="min-h-screen flex">
        {/* LEFT — Three.js 3D Scene (desktop only) */ }
        <div className="hidden lg:flex w-1/2 relative">
          {/* Edge gradients for clean blending */ }
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#0a0a1a] to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a1a] to-transparent" />
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#0a0a1a]/40 to-transparent" />
          </div>

          {/* 3D Scene */ }
          <div className="absolute inset-0">
            <Suspense fallback={ null }>
              <HeroScene />
            </Suspense>
          </div>

          {/* Bottom overlay text */ }
          <div className="absolute bottom-16 left-10 z-20 max-w-md">
            <motion.h2
              initial={ { opacity: 0, y: 20 } }
              animate={ { opacity: 1, y: 0 } }
              transition={ { delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
              className="text-3xl font-bold mb-3"
            >
              <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                AI Content
              </span>
              <br />
              <span className="bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent">
                Verification Engine
              </span>
            </motion.h2>
            <motion.p
              initial={ { opacity: 0, y: 20 } }
              animate={ { opacity: 1, y: 0 } }
              transition={ { delay: 0.7, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
              className="text-white/40 text-sm leading-relaxed"
            >
              3 independent heuristic models cross-examine every pixel.
              Face deformities, frequency anomalies, and watermarks -- nothing escapes.
            </motion.p>
          </div>
        </div>

        {/* RIGHT — Auth Form */ }
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Logo / Brand */ }
            <motion.div
              initial={ { opacity: 0, y: -20 } }
              animate={ { opacity: 1, y: 0 } }
              transition={ { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
              className="text-center mb-8"
            >
              <motion.div
                initial={ { scale: 0 } }
                animate={ { scale: 1 } }
                transition={ { type: "spring", stiffness: 200, delay: 0.15 } }
                className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[#667EEA] to-[#764BA2] items-center justify-center shadow-lg shadow-[#667EEA]/20 mb-4"
              >
                <Shield className="w-7 h-7 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent">
                EcoTrace
              </h1>
              <p className="text-white/40 text-sm mt-1">
                We don&apos;t just detect AI -- we cross-examine it.
              </p>
            </motion.div>

            {/* Form */ }
            <motion.div
              initial={ { opacity: 0, y: 30 } }
              animate={ { opacity: 1, y: 0 } }
              transition={ { duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] } }
              className="flex justify-center"
            >
              { children }
            </motion.div>
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
}
