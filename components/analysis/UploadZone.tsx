"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Link, FileText, Image, Video, X, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ContentType = "image" | "text" | "video";
type InputMode = "upload" | "url" | "text";

interface UploadZoneProps {
  onAnalyze: (data: {
    type: ContentType;
    content?: string;
    file?: File;
    source: string;
  }) => void;
  isLoading: boolean;
}

export function UploadZone({ onAnalyze, isLoading }: UploadZoneProps) {
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [contentType, setContentType] = useState<ContentType>("image");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setSelectedFile(file);

    // Auto-detect content type
    if (file.type.startsWith("image/")) {
      setContentType("image");
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
      setContentType("video");
      setPreview(null);
    } else {
      setContentType("text");
      setPreview(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "video/*": [".mp4", ".webm", ".avi"],
      "text/*": [".txt", ".md", ".csv"],
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  const handleSubmit = () => {
    if (inputMode === "upload" && selectedFile) {
      onAnalyze({ type: contentType, file: selectedFile, source: "web" });
    } else if (inputMode === "url" && url) {
      onAnalyze({ type: contentType, content: url, source: "web" });
    } else if (inputMode === "text" && text) {
      onAnalyze({ type: "text", content: text, source: "web" });
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setUrl("");
    setText("");
  };

  const contentTypes: { id: ContentType; label: string; icon: React.ReactNode }[] = [
    { id: "image", label: "Image", icon: <Image className="w-4 h-4" /> },
    { id: "text", label: "Text", icon: <FileText className="w-4 h-4" /> },
    { id: "video", label: "Video", icon: <Video className="w-4 h-4" /> },
  ];

  const inputModes: { id: InputMode; label: string; icon: React.ReactNode }[] = [
    { id: "upload", label: "Upload", icon: <Upload className="w-4 h-4" /> },
    { id: "url", label: "URL", icon: <Link className="w-4 h-4" /> },
    { id: "text", label: "Paste Text", icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Input Mode Tabs */ }
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
        { inputModes.map((mode) => (
          <button
            key={ mode.id }
            onClick={ () => {
              setInputMode(mode.id);
              clearSelection();
            } }
            className={ `flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${inputMode === mode.id
                ? "bg-gradient-to-r from-[#667EEA] to-[#764BA2] text-white shadow-lg"
                : "text-white/50 hover:text-white hover:bg-white/5"
              }` }
          >
            { mode.icon }
            { mode.label }
          </button>
        )) }
      </div>

      {/* Content Type Selector (for URL mode) */ }
      { inputMode === "url" && (
        <div className="flex gap-2">
          { contentTypes.map((ct) => (
            <button
              key={ ct.id }
              onClick={ () => setContentType(ct.id) }
              className={ `flex items-center gap-2 py-2 px-4 rounded-lg text-sm transition-all ${contentType === ct.id
                  ? "bg-white/10 text-white border border-white/20"
                  : "text-white/40 hover:text-white/60"
                }` }
            >
              { ct.icon }
              { ct.label }
            </button>
          )) }
        </div>
      ) }

      {/* Upload Zone */ }
      <AnimatePresence mode="wait">
        { inputMode === "upload" && (
          <motion.div
            key="upload"
            initial={ { opacity: 0, y: 10 } }
            animate={ { opacity: 1, y: 0 } }
            exit={ { opacity: 0, y: -10 } }
          >
            { selectedFile ? (
              <div className="relative border border-white/10 rounded-2xl p-6 bg-white/5">
                <button
                  onClick={ clearSelection }
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
                { preview && (
                  <img
                    src={ preview }
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg mb-4 object-contain"
                  />
                ) }
                <div className="text-center">
                  <p className="text-white font-medium">{ selectedFile.name }</p>
                  <p className="text-white/40 text-sm mt-1">
                    { (selectedFile.size / 1024 / 1024).toFixed(2) } MB • { contentType }
                  </p>
                </div>
              </div>
            ) : (
              <div
                { ...getRootProps() }
                className={ `border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${isDragActive
                    ? "border-[#667EEA] bg-[#667EEA]/10"
                    : "border-white/20 hover:border-[#667EEA]/50 hover:bg-white/[0.02]"
                  }` }
              >
                <input { ...getInputProps() } />
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-white/30" />
                </div>
                <h3 className="text-lg font-medium text-white/80">
                  { isDragActive ? "Drop it here!" : "Drag & drop your file" }
                </h3>
                <p className="text-white/40 mt-2 text-sm">
                  Images, videos, or text files — up to 10MB
                </p>
              </div>
            ) }
          </motion.div>
        ) }

        { inputMode === "url" && (
          <motion.div
            key="url"
            initial={ { opacity: 0, y: 10 } }
            animate={ { opacity: 1, y: 0 } }
            exit={ { opacity: 0, y: -10 } }
          >
            <Input
              placeholder="https://example.com/image.jpg"
              value={ url }
              onChange={ (e) => setUrl(e.target.value) }
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-14 text-base px-5"
            />
          </motion.div>
        ) }

        { inputMode === "text" && (
          <motion.div
            key="text"
            initial={ { opacity: 0, y: 10 } }
            animate={ { opacity: 1, y: 0 } }
            exit={ { opacity: 0, y: -10 } }
          >
            <textarea
              placeholder="Paste the text you want to analyze..."
              value={ text }
              onChange={ (e) => setText(e.target.value) }
              rows={ 8 }
              className="w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 p-5 text-sm resize-none focus:outline-none focus:border-[#667EEA] focus:ring-1 focus:ring-[#667EEA]/20"
            />
            <p className="text-white/30 text-xs mt-2 text-right">
              { text.length } characters
            </p>
          </motion.div>
        ) }
      </AnimatePresence>

      {/* Submit Button */ }
      <Button
        onClick={ handleSubmit }
        disabled={
          isLoading ||
          (inputMode === "upload" && !selectedFile) ||
          (inputMode === "url" && !url) ||
          (inputMode === "text" && !text)
        }
        className="w-full h-12 bg-gradient-to-r from-[#667EEA] to-[#764BA2] hover:from-[#5a6fd6] hover:to-[#6a3f96] text-white font-medium shadow-lg shadow-[#667EEA]/25 transition-all text-base"
      >
        { isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Analyzing with 3 AI models...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Analyze Content
          </>
        ) }
      </Button>
    </div>
  );
}
