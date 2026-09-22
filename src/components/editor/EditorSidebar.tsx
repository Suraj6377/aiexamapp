"use client";

import React, { useState } from "react";
import {
  QuestionPaper,
  Question,
  Section,
  QuestionType,
} from "@/types/paper";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers,
  Copy,
  Hash,
  Award,
  ListOrdered,
  FilePlus,
  HelpCircle,
} from "lucide-react";
import { generateId, getQuestionTypeLabel } from "@/lib/utils";

interface EditorSidebarProps {
  paper: QuestionPaper;
  selectedQuestionId: string | null;
  selectedSectionId: string | null;
  onSelectQuestion: (questionId: string) => void;
  onSelectSection: (sectionId: string) => void;
  onSelectHeader: () => void;
  onUpdatePaper: (updated: QuestionPaper) => void;
}

export function EditorSidebar({
  paper,
  selectedQuestionId,
  selectedSectionId,
  onSelectQuestion,
  onSelectSection,
  onSelectHeader,
  onUpdatePaper,
}: EditorSidebarProps) {
  const [showAddMenu, setShowAddMenu] = useState<string | null>(null);

  // Total marks and question count summary
  const totalQuestions = paper.sections.reduce((acc, s) => acc + s.questions.length, 0);
  const currentTotalMarks = paper.sections.reduce(
    (acc, s) => acc + s.questions.reduce((qAcc, q) => qAcc + (q.marks || 0), 0),
    0
  );

  // Reorder questions inside a section
  const moveQuestion = (sectionId: string, qIndex: number, direction: "up" | "down") => {
    const sections = [...paper.sections];
    const secIndex = sections.findIndex((s) => s.id === sectionId);
    if (secIndex === -1) return;

    const questions = [...sections[secIndex].questions];
    const targetIndex = direction === "up" ? qIndex - 1 : qIndex + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const [moved] = questions.splice(qIndex, 1);
    questions.splice(targetIndex, 0, moved);

    sections[secIndex] = { ...sections[secIndex], questions };

    // Re-number questions sequentially
    let counter = 1;
    sections.forEach((s) => {
      s.questions.forEach((q) => {
        q.number = counter++;
      });
    });

    onUpdatePaper({ ...paper, sections });
  };

  // Add question to section
  const addQuestion = (sectionId: string, type: QuestionType) => {
    const sections = [...paper.sections];
    const secIndex = sections.findIndex((s) => s.id === sectionId);
    if (secIndex === -1) return;

    const newQ: Question = {
      id: generateId("q"),
      number: totalQuestions + 1,
      question: "Enter question statement here...",
      type,
      marks: type === "mcq" ? 1 : type === "short_answer" ? 3 : type === "long_answer" ? 5 : 2,
      difficulty: "medium",
      topic: "General",
      options:
        type === "mcq"
          ? [
              { id: "opt_1", label: "A", text: "Option A" },
              { id: "opt_2", label: "B", text: "Option B" },
              { id: "opt_3", label: "C", text: "Option C" },
              { id: "opt_4", label: "D", text: "Option D" },
            ]
          : undefined,
      answer: type === "mcq" ? "A" : "Model answer / marking scheme guidance.",
    };

    sections[secIndex] = {
      ...sections[secIndex],
      questions: [...sections[secIndex].questions, newQ],
    };

    let counter = 1;
    sections.forEach((s) => {
      s.questions.forEach((q) => {
        q.number = counter++;
      });
    });

    onUpdatePaper({ ...paper, sections });
    onSelectQuestion(newQ.id);
    setShowAddMenu(null);
  };

  // Delete question
  const deleteQuestion = (sectionId: string, questionId: string) => {
    const sections = [...paper.sections];
    const secIndex = sections.findIndex((s) => s.id === sectionId);
    if (secIndex === -1) return;

    sections[secIndex] = {
      ...sections[secIndex],
      questions: sections[secIndex].questions.filter((q) => q.id !== questionId),
    };

    let counter = 1;
    sections.forEach((s) => {
      s.questions.forEach((q) => {
        q.number = counter++;
      });
    });

    onUpdatePaper({ ...paper, sections });
  };

  // Duplicate question
  const duplicateQuestion = (sectionId: string, question: Question) => {
    const sections = [...paper.sections];
    const secIndex = sections.findIndex((s) => s.id === sectionId);
    if (secIndex === -1) return;

    const copy: Question = {
      ...question,
      id: generateId("q"),
      question: `${question.question} (Copy)`,
    };

    const qIdx = sections[secIndex].questions.findIndex((q) => q.id === question.id);
    sections[secIndex].questions.splice(qIdx + 1, 0, copy);

    let counter = 1;
    sections.forEach((s) => {
      s.questions.forEach((q) => {
        q.number = counter++;
      });
    });

    onUpdatePaper({ ...paper, sections });
    onSelectQuestion(copy.id);
  };

  // Add new section
  const addSection = () => {
    const nextChar = String.fromCharCode(65 + paper.sections.length);
    const newSec: Section = {
      id: generateId("sec"),
      title: `SECTION ${nextChar}`,
      instructions: "Answer all questions in this section.",
      questions: [
        {
          id: generateId("q"),
          number: totalQuestions + 1,
          question: "New question prompt...",
          type: "short_answer",
          marks: 3,
          difficulty: "medium",
          answer: "Expected solution.",
        },
      ],
    };

    const sections = [...paper.sections, newSec];
    let counter = 1;
    sections.forEach((s) => {
      s.questions.forEach((q) => {
        q.number = counter++;
      });
    });

    onUpdatePaper({ ...paper, sections });
    onSelectSection(newSec.id);
  };

  return (
    <aside className="w-full lg:w-80 border-r-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex flex-col shrink-0 h-full overflow-hidden select-none">
      {/* Header Item */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800/80">
        <button
          onClick={onSelectHeader}
          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-indigo-400 text-left transition"
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center justify-between mb-1">
            <span>Exam Header & Rules</span>
            <span className="text-[10px] font-medium text-slate-500">{paper.header.className}</span>
          </div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
            {paper.header.institutionName || paper.title}
          </div>
        </button>

        {/* Live marks summary */}
        <div className="mt-2.5 px-3 py-2 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-indigo-900 dark:text-indigo-200 font-semibold">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>Total Marks:</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-indigo-700 dark:text-indigo-300">{currentTotalMarks}</span>
            <span className="text-slate-400">/ {paper.header.totalMarks} M</span>
          </div>
        </div>
      </div>

      {/* Sections & Questions Outline */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {paper.sections.map((section, sIdx) => {
          const isSectionSelected = selectedSectionId === section.id;
          const sectionMarks = section.questions.reduce((acc, q) => acc + (q.marks || 0), 0);

          return (
            <div
              key={section.id}
              className={`rounded-2xl border transition-all ${
                isSectionSelected
                  ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40"
              }`}
            >
              {/* Section Bar */}
              <div
                onClick={() => onSelectSection(section.id)}
                className="p-2.5 flex items-center justify-between cursor-pointer border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-t-2xl"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                    {section.title}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium shrink-0">
                  <span>{sectionMarks} Marks</span>
                </div>
              </div>

              {/* Questions List */}
              <div className="p-1.5 space-y-1">
                {section.questions.map((q, qIdx) => {
                  const isQSelected = selectedQuestionId === q.id;

                  return (
                    <div
                      key={q.id}
                      onClick={() => onSelectQuestion(q.id)}
                      className={`group p-2 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                        isQSelected
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-100 font-semibold shadow-xs ring-1 ring-indigo-500"
                          : "border-transparent hover:border-slate-200 dark:hover:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400 shrink-0">
                          {q.number || qIdx + 1}
                        </span>
                        <span className="truncate text-[11px] leading-tight">
                          {q.question}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                          {q.marks}M
                        </span>

                        {/* Question actions on hover or selected */}
                        <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center gap-0.5 transition">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveQuestion(section.id, qIdx, "up");
                            }}
                            disabled={qIdx === 0}
                            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 active:scale-95"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveQuestion(section.id, qIdx, "down");
                            }}
                            disabled={qIdx === section.questions.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateQuestion(section.id, q);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600"
                            title="Duplicate"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteQuestion(section.id, q.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add Question Button for Section */}
                <div className="relative pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddMenu(showAddMenu === section.id ? null : section.id)}
                    className="w-full py-1.5 px-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-[11px] font-semibold flex items-center justify-center gap-1 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Question</span>
                  </button>

                  {/* Add Question Menu dropdown */}
                  {showAddMenu === section.id && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 space-y-1 animate-in fade-in duration-100">
                      {[
                        { type: "mcq" as QuestionType, label: "Multiple Choice (MCQ)" },
                        { type: "true_false" as QuestionType, label: "True / False" },
                        { type: "fill_in_blanks" as QuestionType, label: "Fill in Blanks" },
                        { type: "short_answer" as QuestionType, label: "Short Answer" },
                        { type: "long_answer" as QuestionType, label: "Long Answer" },
                        { type: "numerical" as QuestionType, label: "Numerical Problem" },
                        { type: "case_study" as QuestionType, label: "Case Study" },
                        { type: "assertion_reason" as QuestionType, label: "Assertion & Reason" },
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.type}
                          onClick={() => addQuestion(section.id, item.type)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Section Button */}
        <button
          type="button"
          onClick={addSection}
          className="w-full py-2.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold flex items-center justify-center gap-1.5 transition"
        >
          <FilePlus className="w-4 h-4" />
          <span>Add New Section</span>
        </button>
      </div>
    </aside>
  );
}
