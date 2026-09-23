"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  Sparkles,
  ArrowRight,
  FileCode,
  X,
  Languages,
} from "lucide-react";
import { DocumentMetadata } from "@/types/paper";
import { useToast } from "../providers/ToastProvider";

interface DocumentUploaderProps {
  onDocumentProcessed: (metadata: DocumentMetadata) => void;
}

type StepStatus = "idle" | "uploading" | "reading" | "ocr" | "extracting" | "chapters" | "topics" | "ready";

export function DocumentUploader({ onDocumentProcessed }: DocumentUploaderProps) {
  const { success, error, info } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState<StepStatus>("idle");
  const [progressPercent, setProgressPercent] = useState(0);
  const [documentMetadata, setDocumentMetadata] = useState<DocumentMetadata | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [showPasteModal, setShowPasteModal] = useState(false);

  const steps = [
    { key: "uploading", label: "Uploading" },
    { key: "reading", label: "Reading" },
    { key: "ocr", label: "OCR" },
    { key: "extracting", label: "Extracting Content" },
    { key: "chapters", label: "Detecting Chapters" },
    { key: "topics", label: "Detecting Topics" },
    { key: "ready", label: "Ready" },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (file: File) => {
    const validExtensions = [".pdf", ".txt", ".png", ".jpg", ".jpeg"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!validExtensions.includes(ext)) {
      error("Unsupported file type. Please upload PDF, TXT, PNG, or JPG files.", "Invalid File");
      return;
    }

    if (file.size > 4.5 * 1024 * 1024) {
      error("File size exceeds 4.5 MB limit for serverless direct upload. Please upload a smaller file or paste text directly.", "File Too Large");
      return;
    }

    setSelectedFile(file);
    processFile(file);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setCurrentStep("uploading");
    setProgressPercent(20);

    const isImage = file.type.startsWith("image/");
    const endpoint = isImage ? "/api/documents/ocr" : "/api/documents/parse";

    const timeouts: NodeJS.Timeout[] = [];
    timeouts.push(setTimeout(() => { setCurrentStep("reading"); setProgressPercent(40); }, 600));
    if (isImage) {
      timeouts.push(setTimeout(() => { setCurrentStep("ocr"); setProgressPercent(65); }, 1200));
    } else {
      timeouts.push(setTimeout(() => { setCurrentStep("extracting"); setProgressPercent(60); }, 1000));
      timeouts.push(setTimeout(() => { setCurrentStep("chapters"); setProgressPercent(80); }, 1800));
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      // Clear all speculative step timeouts
      timeouts.forEach(clearTimeout);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Processing failed with status ${res.status}`);
      }

      const data = await res.json();
      if (!data.document) {
        throw new Error("Invalid document metadata received from server");
      }

      setCurrentStep("ready");
      setProgressPercent(100);
      setDocumentMetadata(data.document);
      success("Document analyzed and grounded topics detected!", "Analysis Complete");
    } catch (err: any) {
      timeouts.forEach(clearTimeout);
      console.error("Document processing error:", err);
      setCurrentStep("idle");
      setProgressPercent(0);
      setSelectedFile(null);
      setDocumentMetadata(null);
      error(err.message || "Failed to process document", "Processing Error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pastedText.trim() || pastedText.trim().length < 50) {
      error("Please enter at least 50 characters of source material text.", "Text too short");
      return;
    }

    setIsProcessing(true);
    setCurrentStep("extracting");
    setShowPasteModal(false);

    try {
      const formData = new FormData();
      formData.append("text", pastedText);

      const res = await fetch("/api/documents/parse", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to analyze pasted text");
      }

      const data = await res.json();
      setCurrentStep("ready");
      setProgressPercent(100);
      setDocumentMetadata(data.document);
      success("Source text analyzed successfully!");
    } catch (err: any) {
      error(err.message || "Failed to parse text");
      setCurrentStep("idle");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setDocumentMetadata(null);
    setCurrentStep("idle");
    setProgressPercent(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Upload Box if no document processed yet */}
      {!documentMetadata && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-5 sm:p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[260px] sm:min-h-[300px] ${
            dragActive
              ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.01]"
              : "border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white/70 dark:bg-slate-900/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="hidden"
            disabled={isProcessing}
          />

          <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 sm:mb-4 shadow-sm group-hover:scale-105 transition">
            {isProcessing ? (
              <Loader2 className="w-7 sm:w-8 h-7 sm:h-8 animate-spin" />
            ) : (
              <UploadCloud className="w-7 sm:w-8 h-7 sm:h-8" />
            )}
          </div>

          <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
            {isProcessing ? "Processing Document..." : "Drag & drop syllabus, notes, or test files"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-4 px-2">
            Supports PDF, Scanned Images (PNG, JPG) with OCR, or Text documents up to 25 MB.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[11px] sm:text-xs">
              PDF Documents
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[11px] sm:text-xs">
              OCR for Scans
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[11px] sm:text-xs">
              Hindi & Bilingual
            </span>
          </div>

          <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPasteModal(true);
              }}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 p-1 min-h-[36px]"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Or paste raw text / syllabus</span>
            </button>
          </div>
        </div>
      )}

      {/* Progress Stepper */}
      {isProcessing && (
        <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Analyzing Document Content</span>
            </div>
            <span className="text-indigo-600 font-bold">{progressPercent}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-600 to-sky-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Responsive Steps */}
          <div className="flex items-center gap-2 sm:grid sm:grid-cols-7 overflow-x-auto pb-2 sm:pb-0 pt-2">
            {steps.map((st, idx) => {
              const currentIdx = steps.findIndex((s) => s.key === currentStep);
              const isPast = currentIdx > idx;
              const isCurrent = currentStep === st.key;

              return (
                <div key={st.key} className="flex flex-col items-center text-center min-w-[64px] sm:min-w-0 shrink-0 sm:shrink">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 transition-all ${
                      isPast
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/40"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[10px] leading-tight font-medium ${
                      isCurrent
                        ? "text-indigo-600 dark:text-indigo-400 font-bold"
                        : isPast
                        ? "text-slate-700 dark:text-slate-300"
                        : "text-slate-400 dark:text-slate-600"
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Document Analysis Result Card */}
      {documentMetadata && (
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <FileText className="w-5 sm:w-6 h-5 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="truncate max-w-[200px] sm:max-w-md">{documentMetadata.name}</span>
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                    Ready
                  </span>
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {(documentMetadata.size / 1024).toFixed(1)} KB • {documentMetadata.pageCount} page(s) • Grounded
                </p>
              </div>
            </div>

            <button
              onClick={resetUpload}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:border-rose-200 transition self-start sm:self-auto shrink-0 min-h-[36px]"
            >
              Upload Different File
            </button>
          </div>

          {/* Detected Attributes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 sm:mb-1">
                Detected Subject
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {documentMetadata.detectedSubject}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 sm:mb-1">
                Target Level
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {documentMetadata.detectedClass || "Class 12"}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 sm:mb-1">
                Language
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1 truncate">
                <Languages className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{documentMetadata.language}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 sm:mb-1">
                Structure Found
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {documentMetadata.chapters.length} Ch • {documentMetadata.chapters.reduce((acc, c) => acc + c.topics.length, 0)} Topics
              </div>
            </div>
          </div>

          {/* Key Concepts */}
          {documentMetadata.keyConcepts && documentMetadata.keyConcepts.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Extracted Key Concepts:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {documentMetadata.keyConcepts.map((concept, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] sm:text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action to proceed */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => onDocumentProcessed(documentMetadata)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all active:scale-98 min-h-[46px]"
            >
              <span>Configure Question Paper</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Paste Text Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Paste Syllabus or Notes</h3>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paste textbook paragraphs, lecture notes, or chapter outlines. The system will extract chapters, topics, and ground questions in this text.
            </p>

            <textarea
              rows={8}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste chapter text, laws, formulas, questions or concepts here..."
              className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePasteSubmit}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20"
              >
                Analyze Text
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
