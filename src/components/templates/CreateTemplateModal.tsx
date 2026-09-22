"use client";

import React, { useState } from "react";
import {
  ExamTemplate,
  QuestionType,
  PaperSize,
} from "@/types/paper";
import {
  X,
  Plus,
  Trash2,
  Save,
  LayoutTemplate,
  Clock,
  Award,
  Type,
  Layers,
  FileText,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateCreated: (template: ExamTemplate) => void;
}

const QUESTION_TYPES: { id: QuestionType; label: string }[] = [
  { id: "mcq", label: "Multiple Choice (MCQ)" },
  { id: "multiple_select", label: "Multiple Select" },
  { id: "true_false", label: "True / False" },
  { id: "fill_in_blanks", label: "Fill in Blanks" },
  { id: "very_short_answer", label: "Very Short Answer (VSA)" },
  { id: "short_answer", label: "Short Answer (SA)" },
  { id: "long_answer", label: "Long Answer (LA)" },
  { id: "numerical", label: "Numerical Problem" },
  { id: "case_study", label: "Case Study / Passage" },
  { id: "assertion_reason", label: "Assertion & Reason" },
  { id: "match_the_following", label: "Match the Following" },
];

export function CreateTemplateModal({
  isOpen,
  onClose,
  onTemplateCreated,
}: CreateTemplateModalProps) {
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Template Basics
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExamTemplate["category"]>("Custom");

  // Header & Rules
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [totalMarks, setTotalMarks] = useState(80);
  const [institutionName, setInstitutionName] = useState("");
  const [instructions, setInstructions] = useState<string[]>([
    "All questions are compulsory unless stated otherwise.",
    "The question paper consists of structured sections.",
    "Use of calculators or electronic devices is not permitted.",
  ]);
  const [newInstruction, setNewInstruction] = useState("");

  // Styling & Typography
  const [paperSize, setPaperSize] = useState<PaperSize>("A4");
  const [fontFamily, setFontFamily] = useState<"Inter" | "Arial" | "Times New Roman" | "Georgia" | "Noto Sans" | "Noto Serif">("Times New Roman");
  const [fontSize, setFontSize] = useState(11);

  // Section Blueprint
  const [sections, setSections] = useState<ExamTemplate["sectionStructure"]>([
    {
      title: "SECTION A (Objective Questions)",
      instructions: "Questions 1 to 20 carry 1 mark each.",
      defaultQuestionType: "mcq",
      defaultMarksPerQuestion: 1,
      questionCount: 20,
    },
    {
      title: "SECTION B (Short Answer Questions)",
      instructions: "Questions 21 to 26 carry 2 marks each.",
      defaultQuestionType: "short_answer",
      defaultMarksPerQuestion: 2,
      questionCount: 6,
    },
    {
      title: "SECTION C (Long Answer Questions)",
      instructions: "Questions 27 to 31 carry 5 marks each.",
      defaultQuestionType: "long_answer",
      defaultMarksPerQuestion: 5,
      questionCount: 5,
    },
  ]);

  if (!isOpen) return null;

  const handleAddInstruction = () => {
    if (!newInstruction.trim()) return;
    setInstructions([...instructions, newInstruction.trim()]);
    setNewInstruction("");
  };

  const handleRemoveInstruction = (idx: number) => {
    setInstructions(instructions.filter((_, i) => i !== idx));
  };

  const handleAddSection = () => {
    const nextLetter = String.fromCharCode(65 + sections.length);
    setSections([
      ...sections,
      {
        title: `SECTION ${nextLetter} (Subjective Questions)`,
        instructions: "Answer all questions in this section.",
        defaultQuestionType: "short_answer",
        defaultMarksPerQuestion: 3,
        questionCount: 5,
      },
    ]);
  };

  const handleUpdateSection = (
    index: number,
    field: keyof ExamTemplate["sectionStructure"][0],
    value: any
  ) => {
    setSections(
      sections.map((sec, i) => (i === index ? { ...sec, [field]: value } : sec))
    );
  };

  const handleRemoveSection = (index: number) => {
    if (sections.length <= 1) {
      error("A template must have at least one section.");
      return;
    }
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error("Template name is required.");
      return;
    }

    setIsSubmitting(true);
    const templateId = "tpl_custom_" + Math.random().toString(36).substring(2, 9);

    const newTemplate: ExamTemplate = {
      id: templateId,
      name: name.trim(),
      description: description.trim() || `Custom exam framework with ${sections.length} sections and ${totalMarks} total marks.`,
      category,
      header: {
        durationMinutes,
        totalMarks,
        generalInstructions: instructions,
        institutionName: institutionName.trim() || undefined,
      },
      styling: {
        paperSize,
        fontFamily,
        fontSize,
        lineHeight: 1.4,
        questionSpacing: 12,
        sectionSpacing: 18,
        margins: { top: 15, bottom: 15, left: 15, right: 15 },
        watermark: { enabled: false, text: "", opacity: 0.08, fontSize: 48, rotation: -45 },
      },
      defaultInstructions: instructions,
      sectionStructure: sections,
    };

    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTemplate),
      });

      if (!res.ok) throw new Error("Failed to save template to server");

      success(`Custom Template "${newTemplate.name}" created and saved!`);
      onTemplateCreated(newTemplate);
      onClose();
    } catch (err: any) {
      error(err.message || "Failed to save template");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>Create Custom Exam Template</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  NEW
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Design an institutional paper blueprint with custom headers, typography, and section structures
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* 1. Template Basics */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>1. Template Identification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Delhi Public School Annual Exam Framework"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[40px]"
                >
                  <option value="Custom">Custom Institutional</option>
                  <option value="School">School Level</option>
                  <option value="Board Exam">Board Exam (CBSE/ICSE)</option>
                  <option value="College/University">College / University</option>
                  <option value="Competitive Exam">Competitive Exam</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe the layout, purpose, or examination board..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[40px]"
                />
              </div>
            </div>
          </div>

          {/* 2. Header & Examination Specifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-sky-500" />
              <span>2. Header Specifications & Rules</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Duration (Minutes)
                </label>
                <input
                  type="number"
                  min={15}
                  max={360}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Total Marks
                </label>
                <input
                  type="number"
                  min={10}
                  max={300}
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(parseInt(e.target.value) || 50)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Institution Name (Optional)
                </label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="e.g. ST. XAVIER'S SENIOR SCHOOL"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[40px]"
                />
              </div>
            </div>

            {/* General Instructions */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                General Examination Instructions
              </label>
              <div className="space-y-1.5">
                {instructions.map((inst, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs"
                  >
                    <span className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-slate-700 dark:text-slate-300">{inst}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInstruction(idx)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newInstruction}
                  onChange={(e) => setNewInstruction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddInstruction();
                    }
                  }}
                  placeholder="Add another instruction and press Enter..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[38px]"
                />
                <button
                  type="button"
                  onClick={handleAddInstruction}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold transition shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Typography & Styling */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Type className="w-3.5 h-3.5 text-amber-500" />
              <span>3. Typography & Page Layout</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Font Family
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[40px]"
                >
                  <option value="Times New Roman">Times New Roman (Academic)</option>
                  <option value="Inter">Inter (Modern Clean)</option>
                  <option value="Arial">Arial (Standard Sans)</option>
                  <option value="Georgia">Georgia (Serif Editorial)</option>
                  <option value="Noto Serif">Noto Serif (Multilingual)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Base Font Size
                </label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[40px]"
                >
                  <option value={10}>10 pt (Compact)</option>
                  <option value={11}>11 pt (Standard Academic)</option>
                  <option value={12}>12 pt (Large Readable)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Paper Size
                </label>
                <select
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[40px]"
                >
                  <option value="A4">A4 (210 x 297 mm)</option>
                  <option value="A5">A5 Booklet</option>
                  <option value="letter">US Letter</option>
                  <option value="legal">Legal Sheet</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. Section Structure Blueprint */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-purple-500" />
                <span>4. Section Structure ({sections.length} Sections)</span>
              </div>
              <button
                type="button"
                onClick={handleAddSection}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Section</span>
              </button>
            </div>

            <div className="space-y-3">
              {sections.map((sec, sIdx) => (
                <div
                  key={sIdx}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) => handleUpdateSection(sIdx, "title", e.target.value)}
                      placeholder="e.g. SECTION A (Objective)"
                      className="flex-1 font-bold text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(sIdx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition"
                      title="Delete Section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                        Question Type
                      </label>
                      <select
                        value={sec.defaultQuestionType}
                        onChange={(e) => handleUpdateSection(sIdx, "defaultQuestionType", e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      >
                        {QUESTION_TYPES.map((qt) => (
                          <option key={qt.id} value={qt.id}>
                            {qt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                        Questions Count
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={sec.questionCount}
                        onChange={(e) => handleUpdateSection(sIdx, "questionCount", parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                        Marks Per Question
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={sec.defaultMarksPerQuestion}
                        onChange={(e) => handleUpdateSection(sIdx, "defaultMarksPerQuestion", parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={sec.instructions}
                      onChange={(e) => handleUpdateSection(sIdx, "instructions", e.target.value)}
                      placeholder="Section instructions (e.g. Questions 1 to 20 carry 1 mark each)..."
                      className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition min-h-[42px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition active:scale-98 disabled:opacity-50 min-h-[42px]"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "Saving Template..." : "Save Custom Template"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
