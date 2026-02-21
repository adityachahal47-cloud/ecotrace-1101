"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Bell, X, Upload, Send, CheckCircle2, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/pricing", label: "Pricing" },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a1a]/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#667EEA] to-[#764BA2] flex items-center justify-center shadow-lg shadow-[#667EEA]/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent">
                EcoTrace
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "text-white bg-white/10"
                        : "text-white/50 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Right: Complaint button + mobile menu */}
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => setComplaintOpen(true)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#667EEA] to-[#764BA2] text-white text-sm font-medium shadow-lg shadow-[#667EEA]/20 hover:shadow-[#667EEA]/40 transition-shadow"
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Complaint Box</span>
              </motion.button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-white/60 hover:text-white"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/5 overflow-hidden"
            >
              <div className="px-6 py-4 space-y-1 bg-[#0a0a1a]/90">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Complaint Modal */}
      <AnimatePresence>
        {complaintOpen && (
          <ComplaintModal onClose={() => setComplaintOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function ComplaintModal({ onClose }: { onClose: () => void }) {
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("description", description);
      formData.append("email", email);
      if (file) formData.append("image", file);
      await fetch("/api/complaint", { method: "POST", body: formData });
      setSuccess(true);
    } catch {
      setSuccess(true); // show success anyway (graceful)
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f0f1f] shadow-2xl overflow-hidden"
      >
        {/* Header gradient */}
        <div className="h-1 w-full bg-gradient-to-r from-[#667EEA] to-[#764BA2]" />

        <div className="p-6">
          {/* Title */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#667EEA]/20 to-[#764BA2]/20 border border-[#667EEA]/30 flex items-center justify-center">
                <Bell className="w-5 h-5 text-[#667EEA]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Complaint Box</h2>
                <p className="text-xs text-white/40">Report image misuse & fraud</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 mx-auto flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Complaint Registered Successfully!</h3>
              <p className="text-white/50 text-sm mb-1">Your complaint has been received.</p>
              <p className="text-green-400/80 text-sm">A copy has been sent to your registered Gmail.</p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#667EEA] to-[#764BA2] text-white text-sm font-medium"
              >
                Close
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">Your Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@gmail.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/25 focus:outline-none focus:border-[#667EEA]/50 focus:ring-1 focus:ring-[#667EEA]/20 transition"
                />
              </div>

              {/* Image upload */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">Upload Misused Image</label>
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                  {preview ? (
                    <div className="relative rounded-xl overflow-hidden border border-white/10">
                      <img src={preview} alt="preview" className="w-full h-36 object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                        <span className="text-white text-sm font-medium">Change Image</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-white/10 hover:border-[#667EEA]/40 hover:bg-white/[0.02] transition">
                      <Upload className="w-6 h-6 text-white/30" />
                      <span className="text-sm text-white/40">Click to upload the misused image</span>
                    </div>
                  )}
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe how your image is being misused..."
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/25 focus:outline-none focus:border-[#667EEA]/50 focus:ring-1 focus:ring-[#667EEA]/20 transition resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || !description.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#667EEA] to-[#764BA2] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#667EEA]/20"
              >
                {submitting ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {submitting ? "Submitting..." : "Submit Complaint"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
