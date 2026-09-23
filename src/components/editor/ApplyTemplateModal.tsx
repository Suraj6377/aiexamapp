"use client";

import React, { useEffect, useState } from "react";
import { QuestionPaper, ExamTemplate } from "@/types/paper";
import {
  X,
  LayoutTemplate,
  CheckCircle2,
  Clock,
  Award,
  Type,
  Layers,
  ArrowRight,
  Sparkles,
  Loader2,
  Check,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { DEFAULT_TEMPLATES } from "@/lib/templates/defaultTemplates";

interface ApplyTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: QuestionPaper;
  onApplyTemplate: (updatedPaper: QuestionPaper) => void;
}

export function ApplyTemplateModal({
  isOpen,
  onClose,
  paper,
  onApplyTemplate,
}: ApplyTemplateModalProps) {
  const { success, error } = useToast();
  const [templates, setTemplates] = useState<ExamTemplate[]>(DEFAULT_TEMPLATES);
  const [loading, setLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    DEFAULT_TEMPLATES[0]?.id || null
  );
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [updateSectionTitles, setUpdateSectionTitles] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    async function loadTemplates() {
      // 1. Check local storage
      try {
        const local = localStorage.getItem("ai_study_templates");
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTemplates(parsed);
            if (!selectedTemplateId) setSelectedTemplateId(parsed[0].id);
          }
        }
      } catch {}

      // 2. Fetch server API
      try {
        const res = await fetch("/api/templates");
        if (res.ok) {
          const data = await res.json();
          const tpls: ExamTemplate[] = data.templates || [];
          if (tpls.length > 0) {
            setTemplates(tpls);
            if (!selectedTemplateId) {
              setSelectedTemplateId(tpls[0].id);
            }
          }
        }
      } catch (err) {
        console.warn("Could not reach /api/templates, utilizing cached templates", err);
      } finally {
        setLoading(false);
      }
    }
    loadTemplates();
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ["all", "Board Exam", "College/University", "School", "Competitive Exam", "Custom"];

  const filtered = templates.filter(
    (t) => selectedCategory === "all" || t.category === selectedCategory
  );

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const handleApply = () => {
    if (!selectedTemplate) return;

    // 1. Merge styling
    const newStyling = {
      ...paper.styling,
      ...(selectedTemplate.styling || {}),
      paperSize: selectedTemplate.styling?.paperSize || paper.styling.paperSize,
      fontFamily: selectedTemplate.styling?.fontFamily || paper.styling.fontFamily,
      fontSize: selectedTemplate.styling?.fontSize || paper.styling.fontSize,
      margins: selectedTemplate.styling?.margins || paper.styling.margins,
    };

    // 2. Merge header
    const newHeader = {
      ...paper.header,
      generalInstructions:
        selectedTemplate.defaultInstructions && selectedTemplate.defaultInstructions.length > 0
          ? selectedTemplate.defaultInstructions
          : selectedTemplate.header?.generalInstructions || paper.header.generalInstructions,
      durationMinutes: selectedTemplate.header?.durationMinutes || paper.header.durationMinutes,
      totalMarks: selectedTemplate.header?.totalMarks || paper.header.totalMarks,
      institutionName: selectedTemplate.header?.institutionName || paper.header.institutionName,
    };

    // 3. Optionally harmonize section titles
    let newSections = [...paper.sections];
    if (updateSectionTitles && selectedTemplate.sectionStructure) {
      newSections = newSections.map((sec, idx) => {
        const templateSec = selectedTemplate.sectionStructure[idx];
        if (templateSec) {
          return {
            ...sec,
            title: templateSec.title,
            instructions: templateSec.instructions || sec.instructions,
          };
        }
        return sec;
      });
    }

    const updatedPaper: QuestionPaper = {
      ...paper,
      styling: newStyling,
      header: newHeader,
      sections: newSections,
      updatedAt: new Date().toISOString(),
    };

    onApplyTemplate(updatedPaper);
    success(`Applied "${selectedTemplate.name}" template layout to paper!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>Choose & Apply Template</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  LIVE REFORMAT
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instantly restyle this generated paper with institutional typography, board rules, and headers
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Categories + Split View (Templates List & Active Preview) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Categories Tab */}
          <div className="px-5 pt-3 pb-2 flex items-center gap-2 overflow-x-auto border-b border-slate-100 dark:border-slate-800 shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition shrink-0 ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                {cat === "all" ? "All Formats" : cat}
              </button>
            ))}
          </div>

          {/* Main Area */}
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
              <p className="text-xs text-slate-500 font-semibold">Loading templates...</p>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 overflow-hidden">
              {/* Left Column: Template Cards List */}
              <div className="overflow-y-auto p-4 space-y-2.5">
                {filtered.map((tpl) => {
                  const isSelected = (selectedTemplate?.id === tpl.id);
                  const isCustom = tpl.id.startsWith("tpl_custom") || tpl.category === "Custom";

                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 shadow-sm ring-1 ring-indigo-500/30"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                            {tpl.category}
                          </span>
                          {isCustom && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300">
                              CUSTOM
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                      </div>

                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mt-1.5">
                        {tpl.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {tpl.description}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2 font-medium">
                        <span>{tpl.styling?.fontFamily || "Academic Serif"}</span>
                        <span>•</span>
                        <span>{tpl.sectionStructure?.length || 0} Sections</span>
                        <span>•</span>
                        <span>{tpl.header?.durationMinutes || 180}m</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Selected Template Deep Preview */}
              {selectedTemplate ? (
                <div className="overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/30 dark:bg-slate-900/30">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        {selectedTemplate.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {selectedTemplate.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {selectedTemplate.description}
                    </p>
                  </div>

                  {/* Formatting Specs */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] font-semibold text-slate-400">Typography</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {selectedTemplate.styling?.fontFamily || "Times New Roman"} ({selectedTemplate.styling?.fontSize || 11}pt)
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] font-semibold text-slate-400">Paper Size</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {selectedTemplate.styling?.paperSize || "A4"} Sheet
                      </div>
                    </div>
                  </div>

                  {/* Section Blueprint */}
                  {selectedTemplate.sectionStructure && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Template Section Framework
                      </div>
                      <div className="space-y-1.5">
                        {selectedTemplate.sectionStructure.map((sec, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs"
                          >
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {sec.title}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {sec.questionCount} Questions • {sec.defaultMarksPerQuestion} Marks each
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Instructions Preview */}
                  {selectedTemplate.defaultInstructions && selectedTemplate.defaultInstructions.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Board Rules ({selectedTemplate.defaultInstructions.length})
                      </div>
                      <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc pl-4">
                        {selectedTemplate.defaultInstructions.slice(0, 4).map((inst, i) => (
                          <li key={i}>{inst}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Restructure Option Checkbox */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={updateSectionTitles}
                        onChange={(e) => setUpdateSectionTitles(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                      />
                      <span>Harmonize section titles with template names</span>
                    </label>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div className="text-xs text-slate-500">
            Selected: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedTemplate?.name}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition min-h-[40px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!selectedTemplate}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition active:scale-98 disabled:opacity-50 min-h-[40px]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply to This Paper</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
