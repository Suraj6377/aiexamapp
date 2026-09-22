"use client";

import React from "react";
import {
  QuestionPaper,
  Question,
  Section,
  QuestionType,
  DifficultyLevel,
} from "@/types/paper";
import {
  Sliders,
  Trash2,
  Plus,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  FileText,
  Languages,
} from "lucide-react";
import { getQuestionTypeLabel } from "@/lib/utils";

interface ElementInspectorProps {
  paper: QuestionPaper;
  selectedQuestionId: string | null;
  selectedSectionId: string | null;
  isHeaderSelected: boolean;
  onUpdatePaper: (updated: QuestionPaper) => void;
  onDeleteQuestion: (qId: string) => void;
}

export function ElementInspector({
  paper,
  selectedQuestionId,
  selectedSectionId,
  isHeaderSelected,
  onUpdatePaper,
  onDeleteQuestion,
}: ElementInspectorProps) {
  // Find selected question or section
  let selectedQuestion: { q: Question; sec: Section } | null = null;
  for (const sec of paper.sections) {
    const q = sec.questions.find((x) => x.id === selectedQuestionId);
    if (q) {
      selectedQuestion = { q, sec };
      break;
    }
  }

  const selectedSection = paper.sections.find((s) => s.id === selectedSectionId) || null;

  // 1. Question editing handlers
  const updateCurrentQuestion = (updates: Partial<Question>) => {
    if (!selectedQuestion) return;
    const sections = paper.sections.map((sec) => {
      if (sec.id !== selectedQuestion!.sec.id) return sec;
      return {
        ...sec,
        questions: sec.questions.map((q) => (q.id === selectedQuestion!.q.id ? { ...q, ...updates } : q)),
      };
    });
    onUpdatePaper({ ...paper, sections });
  };

  const updateOptionText = (optId: string, text: string, hindiText?: string) => {
    if (!selectedQuestion?.q.options) return;
    const options = selectedQuestion.q.options.map((opt) =>
      opt.id === optId ? { ...opt, text, ...(hindiText !== undefined ? { hindiText } : {}) } : opt
    );
    updateCurrentQuestion({ options });
  };

  const setCorrectOption = (label: string) => {
    updateCurrentQuestion({ answer: label });
  };

  // 2. Section editing handlers
  const updateCurrentSection = (updates: Partial<Section>) => {
    if (!selectedSection) return;
    const sections = paper.sections.map((sec) => (sec.id === selectedSection.id ? { ...sec, ...updates } : sec));
    onUpdatePaper({ ...paper, sections });
  };

  // 3. Header editing handlers
  const updateHeader = (updates: Partial<typeof paper.header>) => {
    onUpdatePaper({
      ...paper,
      header: { ...paper.header, ...updates },
    });
  };

  const updateInstruction = (index: number, val: string) => {
    const instructions = [...paper.header.generalInstructions];
    instructions[index] = val;
    updateHeader({ generalInstructions: instructions });
  };

  const addInstruction = () => {
    const instructions = [...paper.header.generalInstructions, "New general exam instruction..."];
    updateHeader({ generalInstructions: instructions });
  };

  const removeInstruction = (index: number) => {
    const instructions = paper.header.generalInstructions.filter((_, i) => i !== index);
    updateHeader({ generalInstructions: instructions });
  };

  return (
    <aside className="w-full lg:w-84 border-l-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex flex-col shrink-0 h-full overflow-hidden select-none">
      {/* Title Bar */}
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            {selectedQuestion
              ? `Question ${selectedQuestion.q.number} Inspector`
              : selectedSection
              ? "Section Inspector"
              : isHeaderSelected
              ? "Exam Header Inspector"
              : "Properties Inspector"}
          </h4>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* CASE 1: QUESTION IS SELECTED */}
        {selectedQuestion && (
          <div className="space-y-4">
            {/* Question Text */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Question Statement
              </label>
              <textarea
                rows={4}
                value={selectedQuestion.q.question}
                onChange={(e) => updateCurrentQuestion({ question: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Hindi Question Text */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-indigo-500" />
                <span>Hindi Translation (Devanagari)</span>
              </label>
              <textarea
                rows={2}
                value={selectedQuestion.q.hindiQuestion || ""}
                onChange={(e) => updateCurrentQuestion({ hindiQuestion: e.target.value })}
                placeholder="हिंदी अनुवाद यहां दर्ज करें..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Type, Marks, Difficulty Row */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Marks
                </label>
                <input
                  type="number"
                  min={0.5}
                  max={20}
                  step={0.5}
                  value={selectedQuestion.q.marks}
                  onChange={(e) => updateCurrentQuestion({ marks: parseFloat(e.target.value) || 1 })}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Difficulty
                </label>
                <select
                  value={selectedQuestion.q.difficulty}
                  onChange={(e) => updateCurrentQuestion({ difficulty: e.target.value as DifficultyLevel })}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Type
                </label>
                <select
                  value={selectedQuestion.q.type}
                  onChange={(e) => updateCurrentQuestion({ type: e.target.value as QuestionType })}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs"
                >
                  <option value="mcq">MCQ</option>
                  <option value="true_false">True / False</option>
                  <option value="fill_in_blanks">Fill in Blanks</option>
                  <option value="short_answer">Short Answer</option>
                  <option value="long_answer">Long Answer</option>
                  <option value="numerical">Numerical</option>
                  <option value="case_study">Case Study</option>
                  <option value="assertion_reason">Assertion & Reason</option>
                </select>
              </div>
            </div>

            {/* MCQ Options Editor */}
            {selectedQuestion.q.type === "mcq" && selectedQuestion.q.options && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Multiple Choice Options
                </label>
                <div className="space-y-2">
                  {selectedQuestion.q.options.map((opt) => (
                    <div
                      key={opt.id}
                      className={`p-2 rounded-xl border transition ${
                        selectedQuestion!.q.answer === opt.label
                          ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          type="button"
                          onClick={() => setCorrectOption(opt.label)}
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition ${
                            selectedQuestion!.q.answer === opt.label
                              ? "bg-emerald-600 text-white"
                              : "border border-slate-300 dark:border-slate-700 hover:border-emerald-500"
                          }`}
                        >
                          {opt.label}
                        </button>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => updateOptionText(opt.id, e.target.value)}
                          placeholder={`Option ${opt.label} text`}
                          className="flex-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs"
                        />
                      </div>
                      <input
                        type="text"
                        value={opt.hindiText || ""}
                        onChange={(e) => updateOptionText(opt.id, opt.text, e.target.value)}
                        placeholder={`Option ${opt.label} हिंदी...`}
                        className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-[11px]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Answer / Solution Guidance */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Answer Key / Model Solution
              </label>
              <textarea
                rows={3}
                value={selectedQuestion.q.answer || ""}
                onChange={(e) => updateCurrentQuestion({ answer: e.target.value })}
                placeholder="Expected response or marking criteria..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs"
              />
            </div>

            {/* Explanation */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Explanation & Rationale
              </label>
              <textarea
                rows={2}
                value={selectedQuestion.q.explanation || ""}
                onChange={(e) => updateCurrentQuestion({ explanation: e.target.value })}
                placeholder="Why this answer is correct..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs"
              />
            </div>

            {/* Delete button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onDeleteQuestion(selectedQuestion!.q.id)}
                className="w-full py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Question</span>
              </button>
            </div>
          </div>
        )}

        {/* CASE 2: SECTION IS SELECTED */}
        {!selectedQuestion && selectedSection && (
          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Section Title
              </label>
              <input
                type="text"
                value={selectedSection.title}
                onChange={(e) => updateCurrentSection({ title: e.target.value })}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hindi Section Title
              </label>
              <input
                type="text"
                value={selectedSection.hindiTitle || ""}
                onChange={(e) => updateCurrentSection({ hindiTitle: e.target.value })}
                placeholder="खंड क..."
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Section Instructions
              </label>
              <textarea
                rows={3}
                value={selectedSection.instructions || ""}
                onChange={(e) => updateCurrentSection({ instructions: e.target.value })}
                placeholder="e.g. Questions 1 to 10 carry 1 mark each..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs"
              />
            </div>
          </div>
        )}

        {/* CASE 3: HEADER IS SELECTED */}
        {!selectedQuestion && !selectedSection && (
          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Institution Name
              </label>
              <input
                type="text"
                value={paper.header.institutionName}
                onChange={(e) => updateHeader({ institutionName: e.target.value })}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Exam Title
              </label>
              <input
                type="text"
                value={paper.header.examName}
                onChange={(e) => updateHeader({ examName: e.target.value })}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Class
                </label>
                <input
                  type="text"
                  value={paper.header.className}
                  onChange={(e) => updateHeader({ className: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Duration (Mins)
                </label>
                <input
                  type="number"
                  value={paper.header.durationMinutes}
                  onChange={(e) => updateHeader({ durationMinutes: parseInt(e.target.value) || 60 })}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs"
                />
              </div>
            </div>

            {/* General Instructions list */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  General Instructions
                </span>
                <button
                  type="button"
                  onClick={addInstruction}
                  className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Rule</span>
                </button>
              </div>

              <div className="space-y-2">
                {paper.header.generalInstructions.map((inst, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="font-bold text-[10px] text-slate-400 mt-1">{idx + 1}.</span>
                    <input
                      type="text"
                      value={inst}
                      onChange={(e) => updateInstruction(idx, e.target.value)}
                      className="flex-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => removeInstruction(idx)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
