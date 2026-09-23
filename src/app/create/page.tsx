"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TopHeader } from "@/components/layout/TopHeader";
import { DocumentUploader } from "@/components/upload/DocumentUploader";
import { PaperConfigForm } from "@/components/config/PaperConfigForm";
import { DocumentMetadata, PaperGenerationConfig } from "@/types/paper";
import { useToast } from "@/components/providers/ToastProvider";
import { FileText, Sliders, Sparkles, CheckCircle2, ArrowLeft } from "lucide-react";

export default function CreatePaperPage() {
  const router = useRouter();
  const { error, success, info } = useToast();

  const [currentStep, setCurrentStep] = useState<"upload" | "config">("upload");
  const [documentMetadata, setDocumentMetadata] = useState<DocumentMetadata | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDocumentProcessed = (metadata: DocumentMetadata) => {
    setDocumentMetadata(metadata);
    setCurrentStep("config");
  };

  const handleGeneratePaper = async (config: PaperGenerationConfig) => {
    setIsGenerating(true);
    info("Synthesizing examination questions from grounded topics...", "AI Generation Engine");

    try {
      // Find active client-saved AI provider
      let clientAiConfig = null;
      try {
        const local = localStorage.getItem("ai_study_configs");
        if (local) {
          const parsed = JSON.parse(local);
          clientAiConfig = parsed.find((c: any) => c.isActive && c.apiKey && c.apiKey.trim().length > 0) || null;
        }
      } catch {}

      const res = await fetch("/api/papers/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          documentText: documentMetadata?.extractedText || "",
          aiConfig: clientAiConfig,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate paper");
      }

      const data = await res.json();
      if (!data.paper?.id) {
        throw new Error("Invalid response received from generation engine");
      }

      // Immediately cache generated paper to localStorage for reliable serverless access
      try {
        const localPapers = localStorage.getItem("ai_study_papers");
        const existing = localPapers ? JSON.parse(localPapers) : [];
        const updated = [data.paper, ...existing.filter((p: any) => p.id !== data.paper.id)];
        localStorage.setItem("ai_study_papers", JSON.stringify(updated));
      } catch {}

      success(`Generated successfully with ${data.providerUsed || "AI Engine"}!`, "Paper Ready");
      router.push(`/editor/${data.paper.id}`);
    } catch (err: any) {
      console.error("Generation error:", err);
      error(err.message || "Failed to generate paper", "Generation Error");
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopHeader
        title="Create Question Paper"
        subtitle="Upload source notes, select grounded topics, and generate curriculum-aligned exam papers"
      />

      <div className="flex-1 p-3 sm:p-6 max-w-5xl w-full mx-auto space-y-5">
        {/* Step Indicator Header (mobile responsive) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setCurrentStep("upload")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition shrink-0 min-h-[40px] ${
                currentStep === "upload"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
              <span>Upload Document</span>
            </button>

            <span className="text-slate-300 dark:text-slate-700 shrink-0">→</span>

            <button
              onClick={() => documentMetadata && setCurrentStep("config")}
              disabled={!documentMetadata}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition shrink-0 min-h-[40px] disabled:opacity-40 disabled:pointer-events-none ${
                currentStep === "config"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
              <span>Exam Config & Topics</span>
            </button>
          </div>

          {currentStep === "config" && (
            <button
              onClick={() => setCurrentStep("upload")}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 self-end sm:self-auto py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Upload</span>
            </button>
          )}
        </div>

        {/* STEP 1: Document Upload */}
        {currentStep === "upload" && (
          <div className="space-y-4">
            <DocumentUploader onDocumentProcessed={handleDocumentProcessed} />
          </div>
        )}

        {/* STEP 2: Paper Configuration */}
        {currentStep === "config" && (
          <div className="space-y-4">
            <PaperConfigForm
              documentMetadata={documentMetadata}
              onSubmit={handleGeneratePaper}
              isGenerating={isGenerating}
            />
          </div>
        )}
      </div>
    </div>
  );
}
