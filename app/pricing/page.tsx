"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Shield, Check, Zap, FileText, Download, Code,
    Headphones, BarChart2, ArrowRight, Star,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";

const PLANS = [
    {
        name: "Individual",
        badge: null,
        color: "#667EEA",
        monthly: 299,
        yearly: 239,
        desc: "Perfect for influencers and everyday users who need quick AI detection.",
        features: [
            { text: "AI detection percentage score", included: true },
            { text: "Basic scan (Face + Frequency + Metadata)", included: true },
            { text: "5 scans per day", included: true },
            { text: "Result history (7 days)", included: true },
            { text: "Complaint filing", included: true },
            { text: "Full forensic report", included: false },
            { text: "PDF download", included: false },
            { text: "API access", included: false },
            { text: "Priority support", included: false },
        ],
        cta: "Start Free Trial",
        ctaStyle: "border border-[#667EEA]/40 text-[#667EEA] hover:bg-[#667EEA]/10",
    },
    {
        name: "Business",
        badge: "Most Popular",
        color: "#764BA2",
        monthly: 999,
        yearly: 799,
        desc: "For businesses, journalists, and investigation teams needing forensic-grade reports.",
        features: [
            { text: "AI detection percentage score", included: true },
            { text: "Full forensic report (4 models)", included: true },
            { text: "Unlimited scans", included: true },
            { text: "Result history (90 days)", included: true },
            { text: "Complaint filing + tracking", included: true },
            { text: "Detailed evidence breakdown", included: true },
            { text: "PDF forensic report download", included: true },
            { text: "REST API access", included: true },
            { text: "Priority support (24h)", included: true },
        ],
        cta: "Get Business Plan",
        ctaStyle: "bg-gradient-to-r from-[#667EEA] to-[#764BA2] text-white shadow-lg shadow-[#667EEA]/20",
    },
];

export default function PricingPage() {
    const [yearly, setYearly] = useState(false);

    return (
        <div className="min-h-screen bg-[#0a0a1a] text-white">
            <Navbar />

            <main className="pt-16">
                {/* ══ HERO ══ */}
                <section className="relative py-24 px-6 overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full bg-[#667EEA]/8 blur-3xl" />
                        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 rounded-full bg-[#764BA2]/8 blur-3xl" />
                    </div>

                    <div className="max-w-3xl mx-auto text-center relative z-10">
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#667EEA]/10 border border-[#667EEA]/20 text-sm text-[#667EEA] font-medium mb-6"
                        >
                            <Star className="w-4 h-4" /> Simple, Transparent Pricing
                        </motion.div>
                        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="text-5xl font-bold leading-tight mb-4"
                        >
                            Choose Your{" "}
                            <span className="bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent">
                                Protection Plan
                            </span>
                        </motion.h1>
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                            className="text-white/50 mb-10 text-base"
                        >
                            Start with a free trial. Upgrade anytime for forensic-grade reports and API access.
                        </motion.p>

                        {/* Monthly / Yearly toggle */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                            className="inline-flex items-center gap-3 p-1 rounded-xl bg-white/5 border border-white/10"
                        >
                            <button onClick={() => setYearly(false)}
                                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${!yearly ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}
                            >
                                Monthly
                            </button>
                            <button onClick={() => setYearly(true)}
                                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${yearly ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}
                            >
                                Yearly
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-semibold">
                                    Save 20%
                                </span>
                            </button>
                        </motion.div>
                    </div>
                </section>

                {/* ══ PRICING CARDS ══ */}
                <section className="pb-24 px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-6 items-start">
                            {PLANS.map((plan, i) => {
                                const price = yearly ? plan.yearly : plan.monthly;
                                const isPopular = !!plan.badge;

                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + i * 0.15 }}
                                        className={`relative rounded-2xl border p-8 transition-all ${isPopular
                                                ? "border-[#764BA2]/50 shadow-2xl shadow-[#764BA2]/20"
                                                : "border-white/10"
                                            }`}
                                        style={{
                                            background: isPopular
                                                ? "linear-gradient(135deg, rgba(102,126,234,0.08) 0%, rgba(118,75,162,0.12) 100%)"
                                                : "rgba(255,255,255,0.02)",
                                        }}
                                    >
                                        {/* Glow for popular */}
                                        {isPopular && (
                                            <div className="absolute inset-0 rounded-2xl pointer-events-none"
                                                style={{ boxShadow: "inset 0 0 60px rgba(118,75,162,0.1)" }}
                                            />
                                        )}

                                        {/* Badge */}
                                        {plan.badge && (
                                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#667EEA] to-[#764BA2] text-white text-xs font-bold shadow-lg shadow-[#667EEA]/30">
                                                    <Star className="w-3 h-3" /> {plan.badge}
                                                </div>
                                            </div>
                                        )}

                                        {/* Plan name */}
                                        <div className="mb-6">
                                            <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                                            <p className="text-white/40 text-sm">{plan.desc}</p>
                                        </div>

                                        {/* Price */}
                                        <div className="flex items-end gap-2 mb-8">
                                            <span className="text-white/40 text-lg">₹</span>
                                            <motion.span key={`${plan.name}-${yearly}`}
                                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                                className="text-5xl font-bold text-white"
                                            >
                                                {price}
                                            </motion.span>
                                            <span className="text-white/40 mb-1.5">/mo</span>
                                            {yearly && (
                                                <span className="mb-1.5 ml-1 text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25 font-medium">
                                                    billed yearly
                                                </span>
                                            )}
                                        </div>

                                        {/* CTA */}
                                        <Link href="/"
                                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm mb-8 transition-all ${plan.ctaStyle}`}
                                        >
                                            <Zap className="w-4 h-4" /> {plan.cta} <ArrowRight className="w-4 h-4" />
                                        </Link>

                                        {/* Features */}
                                        <div className="space-y-3">
                                            {plan.features.map((f, fi) => (
                                                <div key={fi} className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${f.included ? "bg-green-500/20" : "bg-white/5"
                                                        }`}>
                                                        {f.included ? (
                                                            <Check className="w-3 h-3 text-green-400" />
                                                        ) : (
                                                            <div className="w-2 h-0.5 rounded-full bg-white/20" />
                                                        )}
                                                    </div>
                                                    <span className={`text-sm ${f.included ? "text-white/80" : "text-white/25 line-through"}`}>
                                                        {f.text}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Feature comparison callouts */}
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="mt-16 grid md:grid-cols-4 gap-4"
                        >
                            {[
                                { icon: BarChart2, label: "Detection Accuracy", value: "98%" },
                                { icon: FileText, label: "Evidence Factors", value: "12+" },
                                { icon: Download, label: "PDF Reports", value: "Business" },
                                { icon: Code, label: "API Access", value: "Business" },
                            ].map((item, i) => (
                                <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-5 text-center">
                                    <item.icon className="w-5 h-5 text-[#667EEA] mx-auto mb-2" />
                                    <p className="text-white font-bold">{item.value}</p>
                                    <p className="text-white/40 text-xs mt-0.5">{item.label}</p>
                                </div>
                            ))}
                        </motion.div>

                        {/* FAQ note */}
                        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                            className="mt-12 text-center"
                        >
                            <div className="inline-flex items-center gap-2 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                                <Headphones className="w-4 h-4 text-[#667EEA]" />
                                <span className="text-sm text-white/50">
                                    Have questions? Contact us at{" "}
                                    <a href="mailto:support@ecotrace.app" className="text-[#667EEA] hover:underline">support@ecotrace.app</a>
                                </span>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 py-8 px-6">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#667EEA] to-[#764BA2] flex items-center justify-center">
                            <Shield className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-sm font-semibold bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent">EcoTrace</span>
                    </div>
                    <p className="text-white/20 text-xs">AI Content Verification Engine</p>
                </div>
            </footer>
        </div>
    );
}
