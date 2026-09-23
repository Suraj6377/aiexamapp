"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  QuestionPaper,
  PaperSize,
} from "@/types/paper";
import {
  FileDown,
  Printer,
  Undo2,
  Redo2,
  CheckCircle2,
  Loader2,
  Palette,
  Key,
  FileSpreadsheet,
  ArrowLeft,
  X,
  Settings2,
  LayoutTemplate,
} from "lucide-react";
import { triggerPaperPrint } from "@/lib/export/pdfExporter";
import { useToast } from "../providers/ToastProvider";
import { ApplyTemplateModal } from "./ApplyTemplateModal";

interface DesignToolbarProps {
  paper: QuestionPaper;
  onUpdatePaper: (updated: QuestionPaper) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isSaving: boolean;
  showAnswerKey: boolean;
  onToggleAnswerKey: () => void;
}

export function DesignToolbar({
  paper,
  onUpdatePaper,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isSaving,
  showAnswerKey,
  onToggleAnswerKey,
}: DesignToolbarProps) {
  const { success, error, info } = useToast();
  const [showDesignModal, setShowDesignModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  const { styling } = paper;

  const updateStyling = (updates: Partial<typeof styling>) => {
    onUpdatePaper({
      ...paper,
      styling: { ...styling, ...updates },
    });
  };

  const updateWatermark = (updates: Partial<typeof styling.watermark>) => {
    updateStyling({
      watermark: { ...styling.watermark, ...updates },
    });
  };

  const handlePrintPdf = () => {
    try {
      info("Opening print dialog. Select 'Save as PDF' in the destination to export as PDF.", "Print / PDF Export");
      triggerPaperPrint(paper);
    } catch (err: any) {
      error("Failed to generate PDF print preview");
    }
  };

  const handleExportDocx = async () => {
    setIsExportingDocx(true);
    try {
      info("Compiling Microsoft Word (.docx) document...", "DOCX Export");
      const res = await fetch(`/api/papers/${paper.id}/export?format=docx&answers=${showAnswerKey}`);
      if (!res.ok) throw new Error("Server error during DOCX compilation");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(paper.title || "Question_Paper").replace(/[^a-zA-Z0-9_\-]/g, "_")}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      success("Word document downloaded successfully!", "Export Ready");
    } catch (err: any) {
      error(err.message || "Failed to download DOCX file", "Export Error");
    } finally {
      setIsExportingDocx(false);
    }
  };

  return (
    <div className="min-h-14 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md px-3 sm:px-4 py-2 flex items-center justify-between sticky top-0 z-30 transition-colors gap-2">
      {/* Left: Back button, Undo, Redo, Save status */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <Link
          href="/papers"
          className="p-2 -ml-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          title="Back to Papers"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900/60 p-0.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 rounded-lg transition active:scale-95 min-h-[32px] min-w-[32px] flex items-center justify-center"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 rounded-lg transition active:scale-95 min-h-[32px] min-w-[32px] flex items-center justify-center"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Autosave status indicator */}
        <div className="hidden xs:flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {isSaving ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
              <span className="hidden sm:inline">Saving...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span className="hidden md:inline">Saved</span>
            </>
          )}
        </div>
      </div>

      {/* Center: Formatting Quick Options (desktop) */}
      <div className="hidden lg:flex items-center gap-2">
        {/* Font Family selector */}
        <select
          value={styling.fontFamily}
          onChange={(e) => updateStyling({ fontFamily: e.target.value as any })}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none"
        >
          <option value="Times New Roman">Times New Roman (Academic)</option>
          <option value="Inter">Inter (Modern Clean)</option>
          <option value="Georgia">Georgia (Classic Serif)</option>
          <option value="Arial">Arial (Sans Serif)</option>
          <option value="Noto Sans">Noto Sans (Bilingual/Hindi)</option>
          <option value="Noto Serif">Noto Serif (Bilingual)</option>
        </select>

        {/* Paper Size */}
        <select
          value={styling.paperSize}
          onChange={(e) => updateStyling({ paperSize: e.target.value as PaperSize })}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none"
        >
          <option value="A4">A4 Standard</option>
          <option value="A5">A5 Booklet</option>
          <option value="letter">Letter</option>
          <option value="legal">Legal</option>
        </select>

        {/* Design Modal Toggle */}
        <button
          type="button"
          onClick={() => setShowDesignModal(!showDesignModal)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
        >
          <Palette className="w-3.5 h-3.5 text-indigo-500" />
          <span>Layout & Watermark</span>
        </button>

        {/* Apply Template Button */}
        <button
          type="button"
          onClick={() => setShowTemplateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/80 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition shadow-xs"
        >
          <LayoutTemplate className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Apply Template</span>
        </button>

        {/* Answer key toggle button */}
        <button
          type="button"
          onClick={onToggleAnswerKey}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
            showAnswerKey
              ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
              : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>{showAnswerKey ? "Hide Answers" : "View Answers"}</span>
        </button>
      </div>

      {/* Right: Export buttons & mobile design button */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Mobile Apply Template button */}
        <button
          type="button"
          onClick={() => setShowTemplateModal(true)}
          className="lg:hidden p-2 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 transition"
          title="Apply Template"
        >
          <LayoutTemplate className="w-4 h-4" />
        </button>

        {/* Mobile Layout & Styling button */}
        <button
          type="button"
          onClick={() => setShowDesignModal(!showDesignModal)}
          className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition"
          title="Document Design & Watermark"
        >
          <Settings2 className="w-4 h-4 text-indigo-500" />
        </button>

        {/* Mobile Answer Key Toggle */}
        <button
          type="button"
          onClick={onToggleAnswerKey}
          className={`lg:hidden p-2 rounded-xl border transition ${
            showAnswerKey
              ? "bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-400"
              : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
          }`}
          title="Toggle Answer Key"
        >
          <Key className="w-4 h-4" />
        </button>

        {/* Export DOCX */}
        <button
          type="button"
          onClick={handleExportDocx}
          disabled={isExportingDocx}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold transition active:scale-95 min-h-[36px]"
          title="Export Microsoft Word (.docx)"
        >
          {isExportingDocx ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
          )}
          <span className="hidden sm:inline">Export DOCX</span>
          <span className="sm:hidden text-[11px]">DOCX</span>
        </button>

        {/* Export PDF / Print */}
        <button
          type="button"
          onClick={handlePrintPdf}
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition active:scale-95 min-h-[36px]"
          title="Print or Save as PDF using browser print dialog"
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Print / Save as PDF</span>
          <span className="sm:hidden text-[11px]">Print / PDF</span>
        </button>
      </div>

      {/* Floating Design & Watermark Controls Modal (Mobile responsive) */}
      {showDesignModal && (
        <div className="fixed sm:absolute top-16 sm:top-14 left-3 right-3 sm:left-auto sm:right-4 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 sm:w-80 space-y-4 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Document Design Controls
            </h4>
            <button
              onClick={() => setShowDesignModal(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick select font & paper for mobile */}
          <div className="grid grid-cols-2 gap-2 lg:hidden">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Font Family
              </label>
              <select
                value={styling.fontFamily}
                onChange={(e) => updateStyling({ fontFamily: e.target.value as any })}
                className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium"
              >
                <option value="Times New Roman">Times New Roman</option>
                <option value="Inter">Inter</option>
                <option value="Georgia">Georgia</option>
                <option value="Arial">Arial</option>
                <option value="Noto Sans">Noto Sans</option>
                <option value="Noto Serif">Noto Serif</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Paper Size
              </label>
              <select
                value={styling.paperSize}
                onChange={(e) => updateStyling({ paperSize: e.target.value as PaperSize })}
                className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium"
              >
                <option value="A4">A4</option>
                <option value="A5">A5</option>
                <option value="letter">Letter</option>
                <option value="legal">Legal</option>
              </select>
            </div>
          </div>

          {/* Font Size & Line Height */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Base Font Size</span>
                <span className="text-indigo-600 font-bold">{styling.fontSize} pt</span>
              </div>
              <input
                type="range"
                min={9}
                max={14}
                step={0.5}
                value={styling.fontSize}
                onChange={(e) => updateStyling({ fontSize: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Line Spacing</span>
                <span className="text-indigo-600 font-bold">{styling.lineHeight}x</span>
              </div>
              <input
                type="range"
                min={1.2}
                max={1.8}
                step={0.05}
                value={styling.lineHeight}
                onChange={(e) => updateStyling({ lineHeight: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Watermark Section */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Watermark</span>
              <input
                type="checkbox"
                checked={styling.watermark.enabled}
                onChange={(e) => updateWatermark({ enabled: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
              />
            </div>

            {styling.watermark.enabled && (
              <div className="space-y-2.5">
                <input
                  type="text"
                  value={styling.watermark.text}
                  onChange={(e) => updateWatermark({ text: e.target.value })}
                  placeholder="Watermark text..."
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs"
                />

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                    <span>Opacity</span>
                    <span>{Math.round(styling.watermark.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.03}
                    max={0.25}
                    step={0.01}
                    value={styling.watermark.opacity}
                    onChange={(e) => updateWatermark({ opacity: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                    <span>Rotation</span>
                    <span>{styling.watermark.rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min={-90}
                    max={90}
                    step={5}
                    value={styling.watermark.rotation}
                    onChange={(e) => updateWatermark({ rotation: parseInt(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowDesignModal(false)}
            className="w-full py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-500 transition"
          >
            Apply Changes
          </button>
        </div>
      )}

      {/* Apply Template Modal */}
      <ApplyTemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        paper={paper}
        onApplyTemplate={onUpdatePaper}
      />
    </div>
  );
}
