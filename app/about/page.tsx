"use client";

import { motion } from "framer-motion";
import {
    Shield, Eye, AlertTriangle, Users, Lock, Zap,
    ShieldCheck, Brain, Scale, ArrowRight, Star,
    Fingerprint, Globe, Bell,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";

export default function AboutPage() {
    const features = [
        {
            icon: Eye,
            title: "Multi-Model Detection",
            desc: "We run every image through 4 independent models simultaneously — AI vision analysis, face mesh detection, FFT frequency scanning, and metadata verification.",
            color: "#667EEA",
        },
        {
            icon: Brain,
            title: "Explainable AI",
            desc: "We don't just give you a verdict. We show exactly what each model detected — symmetry scores, noise levels, EXIF anomalies, and visual flags.",
            color: "#764BA2",
        },
        {
            icon: Scale,
            title: "Transparent Scoring",
            desc: "Each model has a weighted confidence score. The final verdict is a consensus — not a black box. You see how we reached every conclusion.",
            color: "#51CF66",
        },
        {
            icon: Shield,
            title: "Complaint System",
            desc: "If your image is being misused, file a complaint directly from our platform. We log each report and notify you via email.",
            color: "#FF6B6B",
        },
    ];

    const protections = [
        {
            icon: Star, title: "Social Media Influencers",
            desc: "Your audience trusts your face. Deepfakes and AI-manipulated images can be weaponized to spread misinformation. EcoTrace lets you instantly verify any image claiming to be you.",
            stat: "3.2B", statLabel: "images shared daily across social media",
        },
        {
            icon: Users, title: "Elderly Users",
            desc: "Scammers use AI-generated images of doctors, officials or family members to trick elderly people into wire transfers and fake schemes. EcoTrace's simple scanner exposes these fakes in seconds.",
            stat: "₹6,000Cr", statLabel: "lost to digital fraud in India annually",
        },
        {
            icon: Globe, title: "Journalists & Fact-Checkers",
            desc: "Fake news spreads through AI-generated imagery. EcoTrace provides forensic-grade analysis with downloadable reports as evidence for editorial decisions.",
            stat: "60%", statLabel: "of viral misinformation involves manipulated images",
        },
    ];

    const timeline = [
        { title: "AI Image Generation Explodes", year: "2022", desc: "DALL-E, Midjourney, Stable Diffusion go public. Anyone can generate photorealistic fake images in seconds." },
        { title: "Deepfake Fraud Rises", year: "2023", desc: "Fraudsters use AI images to impersonate celebrities, family members and officials to extract money and information." },
        { title: "EcoTrace Founded", year: "2024", desc: "A team of AI researchers and cybersecurity experts build EcoTrace to give everyone the tools to fight back." },
        { title: "AI Vision Added", year: "2025", desc: "Advanced vision model joins our detection pipeline, pushing accuracy above 98% for photorealistic AI images." },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a1a] text-white">
            <Navbar />

            <main className="pt-16">
                {/* ══ HERO ══ */}
                <section className="relative py-24 px-6 overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#667EEA]/10 blur-3xl" />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#764BA2]/10 blur-3xl" />
                    </div>

                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#667EEA]/10 border border-[#667EEA]/20 text-sm text-[#667EEA] font-medium mb-6"
                        >
                            <Shield className="w-4 h-4" /> AI Content Verification Engine
                        </motion.div>
                        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="text-5xl md:text-6xl font-bold leading-tight mb-6"
                        >
                            Protecting Real People<br />
                            <span className="bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent">
                                from AI Fraud
                            </span>
                        </motion.h1>
                        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="text-lg text-white/50 max-w-2xl mx-auto mb-8"
                        >
                            EcoTrace is a forensic AI verification platform built for a world where anyone can generate a fake image of anyone. We cross-examine every image using 4 independent AI models to deliver transparent, explainable verdicts.
                        </motion.p>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="flex items-center justify-center gap-4"
                        >
                            <Link href="/"
                                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#667EEA] to-[#764BA2] text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-[#667EEA]/20 hover:opacity-90 transition"
                            >
                                <Zap className="w-4 h-4" /> Start Verifying Now <ArrowRight className="w-4 h-4" />
                            </Link>
                        </motion.div>
                    </div>
                </section>

                {/* ══ FEATURES ══ */}
                <section className="py-20 px-6">
                    <div className="max-w-5xl mx-auto">
                        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
                            <h2 className="text-3xl font-bold text-white mb-3">What EcoTrace Does</h2>
                            <p className="text-white/40 max-w-xl mx-auto text-sm">A four-layer verification system that leaves no pixel unchecked.</p>
                        </motion.div>
                        <div className="grid md:grid-cols-2 gap-5">
                            {features.map((f, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="rounded-2xl border p-6 group hover:border-opacity-60 transition-all"
                                    style={{ borderColor: `${f.color}25`, background: `${f.color}06` }}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                                            style={{ background: `${f.color}15`, border: `1px solid ${f.color}30` }}>
                                            <f.icon className="w-5 h-5" style={{ color: f.color }} />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                                            <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ HOW AI FRAUD WORKS ══ */}
                <section className="py-20 px-6 border-t border-white/5">
                    <div className="max-w-4xl mx-auto">
                        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium mb-4">
                                <AlertTriangle className="w-3.5 h-3.5" /> Cyber Awareness
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-3">How AI Image Fraud Works</h2>
                            <p className="text-white/40 max-w-xl mx-auto text-sm">Understanding the threat is the first step to fighting it.</p>
                        </motion.div>

                        <div className="relative">
                            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[#667EEA] via-[#764BA2] to-transparent hidden md:block" />
                            <div className="space-y-8">
                                {timeline.map((item, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                                        transition={{ delay: i * 0.12 }}
                                        className="relative flex gap-6 md:pl-20"
                                    >
                                        <div className="hidden md:flex absolute left-5 w-7 h-7 rounded-full bg-[#667EEA]/20 border border-[#667EEA]/40 items-center justify-center shrink-0 mt-1">
                                            <div className="w-2 h-2 rounded-full bg-[#667EEA]" />
                                        </div>
                                        <div className="flex-1 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-xs font-mono text-[#667EEA] bg-[#667EEA]/10 px-2 py-0.5 rounded">{item.year}</span>
                                                <h3 className="text-white font-semibold">{item.title}</h3>
                                            </div>
                                            <p className="text-white/45 text-sm leading-relaxed">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══ WHO WE PROTECT ══ */}
                <section className="py-20 px-6 border-t border-white/5">
                    <div className="max-w-5xl mx-auto">
                        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
                            <h2 className="text-3xl font-bold text-white mb-3">Who We Protect</h2>
                            <p className="text-white/40 max-w-xl mx-auto text-sm">AI fraud doesn't discriminate — but it disproportionately targets certain groups.</p>
                        </motion.div>
                        <div className="grid md:grid-cols-3 gap-5">
                            {protections.map((p, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="rounded-2xl border border-white/5 bg-white/[0.02] p-6"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-[#667EEA]/10 border border-[#667EEA]/20 flex items-center justify-center mb-4">
                                        <p.icon className="w-5 h-5 text-[#667EEA]" />
                                    </div>
                                    <h3 className="text-white font-semibold mb-2">{p.title}</h3>
                                    <p className="text-white/45 text-sm leading-relaxed mb-4">{p.desc}</p>
                                    <div className="pt-4 border-t border-white/5">
                                        <p className="text-2xl font-bold bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent">{p.stat}</p>
                                        <p className="text-xs text-white/30 mt-0.5">{p.statLabel}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ WHY EXPLAINABLE AI ══ */}
                <section className="py-20 px-6 border-t border-white/5">
                    <div className="max-w-4xl mx-auto">
                        <div className="rounded-2xl border border-[#667EEA]/20 bg-gradient-to-br from-[#667EEA]/5 to-[#764BA2]/5 p-10">
                            <div className="grid md:grid-cols-2 gap-10 items-center">
                                <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#667EEA]/10 border border-[#667EEA]/20 text-xs text-[#667EEA] font-medium mb-4">
                                        <Fingerprint className="w-3.5 h-3.5" /> Our Philosophy
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-4">Why Transparency Matters in AI</h2>
                                    <p className="text-white/50 text-sm leading-relaxed mb-4">
                                        Black-box AI systems that just say "fake" or "real" without explanation can be manipulated, gamed, and misused. We believe every verdict should be backed by evidence you can understand and share.
                                    </p>
                                    <p className="text-white/50 text-sm leading-relaxed">
                                        That's why EcoTrace shows you every factor — from facial mesh anomalies to noise patterns — with confidence scores for each model. Explainable AI isn't optional; it's the foundation of trust.
                                    </p>
                                </motion.div>
                                <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-3">
                                    {[
                                        { icon: Lock, text: "No black-box verdicts — every factor is explained" },
                                        { icon: ShieldCheck, text: "4 independent models cross-check each other" },
                                        { icon: Scale, text: "Weighted consensus prevents single-model bias" },
                                        { icon: Bell, text: "Built-in complaint system for misuse reporting" },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                            <item.icon className="w-4 h-4 text-[#667EEA] shrink-0" />
                                            <span className="text-sm text-white/70">{item.text}</span>
                                        </div>
                                    ))}
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══ CTA ══ */}
                <section className="py-20 px-6 border-t border-white/5">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="max-w-2xl mx-auto text-center"
                    >
                        <h2 className="text-3xl font-bold text-white mb-4">Start Verifying Now</h2>
                        <p className="text-white/40 mb-8 text-sm">Free for individuals. No account required for basic analysis.</p>
                        <Link href="/"
                            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#667EEA] to-[#764BA2] text-white font-bold text-sm shadow-2xl shadow-[#667EEA]/30 hover:opacity-90 hover:shadow-[#667EEA]/50 transition-all"
                        >
                            <Zap className="w-4 h-4" /> Go to Scanner <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
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
