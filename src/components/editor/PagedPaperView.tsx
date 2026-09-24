"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { QuestionPaper, Question, Section, QuestionType } from "@/types/paper";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Trash2,
  Copy,
  Plus,
  Edit3,
  Check,
  X,
  Type,
  Move,
  Layers,
  Sparkles,
} from "lucide-react";
import { unicodeToKrutiDev, krutiDevToUnicode } from "@/lib/utils/krutiDevConverter";
import { generateId } from "@/lib/utils";
import { useToast } from "../providers/ToastProvider";

interface PagedPaperViewProps {
  paper: QuestionPaper;
  selectedQuestionId: string | null;
  selectedSectionId: string | null;
  onSelectQuestion: (id: string) => void;
  onSelectSection: (id: string) => void;
  onSelectHeader: () => void;
  showAnswerKey?: boolean;
  isFullEditMode?: boolean;
  onUpdatePaper?: (updated: QuestionPaper) => void;
  onToggleFullEditMode?: () => void;
}

export function PagedPaperView({
  paper,
  selectedQuestionId,
  selectedSectionId,
  onSelectQuestion,
  onSelectSection,
  onSelectHeader,
  showAnswerKey = false,
  isFullEditMode = false,
  onUpdatePaper,
  onToggleFullEditMode,
}: PagedPaperViewProps) {
  const { styling, header, footer } = paper;
  const { success, info } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [isAutoFit, setIsAutoFit] = useState<boolean>(true);

  // Drag and Drop reordering state
  const [draggingQId, setDraggingQId] = useState<string | null>(null);
  const [dropTargetQId, setDropTargetQId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"before" | "after">("before");

  // Calculate auto-fit scale on mobile/small screens
  useEffect(() => {
    const handleResize = () => {
      if (!isAutoFit || !containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const baseSheetWidth = styling.paperSize === "A5" ? 560 : 794;
      if (containerWidth < baseSheetWidth + 32) {
        const computedScale = Math.max(0.38, Math.min(1, (containerWidth - 24) / baseSheetWidth));
        setScale(Number(computedScale.toFixed(2)));
      } else {
        setScale(1);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isAutoFit, styling.paperSize]);

  const handleZoomIn = () => {
    setIsAutoFit(false);
    setScale((prev) => Math.min(1.5, Number((prev + 0.1).toFixed(2))));
  };

  const handleZoomOut = () => {
    setIsAutoFit(false);
    setScale((prev) => Math.max(0.4, Number((prev - 0.1).toFixed(2))));
  };

  const handleFitToScreen = () => {
    setIsAutoFit(true);
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const baseSheetWidth = styling.paperSize === "A5" ? 560 : 794;
      if (containerWidth < baseSheetWidth + 32) {
        const computedScale = Math.max(0.38, Math.min(1, (containerWidth - 24) / baseSheetWidth));
        setScale(Number(computedScale.toFixed(2)));
      } else {
        setScale(1);
      }
    }
  };

  // Font family mapping including Kruti Dev 010
  const fontClass = useMemo(() => {
    switch (styling.fontFamily) {
      case "Kruti Dev 010":
        return "font-kruti";
      case "Times New Roman":
      case "Georgia":
      case "Noto Serif":
        return "font-serif";
      case "Noto Sans":
      case "Arial":
      default:
        return "font-sans";
    }
  }, [styling.fontFamily]);

  // Page width/min-height styling for standard A4 ratio
  const pageStyle: React.CSSProperties = {
    width: styling.paperSize === "A5" ? "148mm" : "210mm",
    minHeight: styling.paperSize === "A5" ? "210mm" : "297mm",
    paddingTop: `${styling.margins.top}mm`,
    paddingBottom: `${styling.margins.bottom}mm`,
    paddingLeft: `${styling.margins.left}mm`,
    paddingRight: `${styling.margins.right}mm`,
    fontSize: `${styling.fontSize}pt`,
    lineHeight: styling.lineHeight,
    fontFamily: styling.fontFamily === "Kruti Dev 010" ? "'Kruti Dev 010', 'KrutiDev010', sans-serif" : undefined,
  };

  // --- REORDERING & DRAG-AND-DROP LOGIC ---
  const moveQuestionTo = (sourceQId: string, targetQId: string, position: "before" | "after" = "before") => {
    if (!onUpdatePaper || sourceQId === targetQId) return;

    let draggedQ: Question | null = null;
    const clonedSections = paper.sections.map((sec) => {
      const qIndex = sec.questions.findIndex((q) => q.id === sourceQId);
      if (qIndex >= 0) {
        draggedQ = { ...sec.questions[qIndex] };
        return {
          ...sec,
          questions: sec.questions.filter((q) => q.id !== sourceQId),
        };
      }
      return { ...sec, questions: [...sec.questions] };
    });

    if (!draggedQ) return;

    let placed = false;
    for (const sec of clonedSections) {
      const targetIndex = sec.questions.findIndex((q) => q.id === targetQId);
      if (targetIndex >= 0) {
        const insertIndex = position === "before" ? targetIndex : targetIndex + 1;
        sec.questions.splice(insertIndex, 0, draggedQ);
        placed = true;
        break;
      }
    }

    if (!placed) return;

    // Renumber sequentially
    let counter = 1;
    clonedSections.forEach((s) => {
      s.questions.forEach((q) => {
        q.number = counter++;
      });
    });

    onUpdatePaper({ ...paper, sections: clonedSections });
    success("Question repositioned successfully!", "Reordered");
  };

  const stepMoveQuestion = (qId: string, direction: "up" | "down") => {
    for (let sIdx = 0; sIdx < paper.sections.length; sIdx++) {
      const sec = paper.sections[sIdx];
      const qIdx = sec.questions.findIndex((q) => q.id === qId);
      if (qIdx >= 0) {
        const targetQIdx = direction === "up" ? qIdx - 1 : qIdx + 1;
        if (targetQIdx >= 0 && targetQIdx < sec.questions.length) {
          const targetQId = sec.questions[targetQIdx].id;
          moveQuestionTo(qId, targetQId, direction === "up" ? "before" : "after");
        }
        return;
      }
    }
  };

  const duplicateQuestion = (qId: string) => {
    if (!onUpdatePaper) return;
    const clonedSections = paper.sections.map((sec) => {
      const qIdx = sec.questions.findIndex((q) => q.id === qId);
      if (qIdx >= 0) {
        const orig = sec.questions[qIdx];
        const clone: Question = {
          ...JSON.parse(JSON.stringify(orig)),
          id: generateId("q"),
          question: `${orig.question} (Duplicate)`,
        };
        const qs = [...sec.questions];
        qs.splice(qIdx + 1, 0, clone);
        return { ...sec, questions: qs };
      }
      return { ...sec, questions: [...sec.questions] };
    });

    let counter = 1;
    clonedSections.forEach((s) => {
      s.questions.forEach((q) => {
        q.number = counter++;
      });
    });

    onUpdatePaper({ ...paper, sections: clonedSections });
    success("Question duplicated.");
  };

  const deleteQuestion = (qId: string) => {
    if (!onUpdatePaper) return;
    const clonedSections = paper.sections.map((sec) => ({
      ...sec,
      questions: sec.questions.filter((q) => q.id !== qId),
    }));

    let counter = 1;
    clonedSections.forEach((s) => {
      s.questions.forEach((q) => {
        q.number = counter++;
      });
    });

    onUpdatePaper({ ...paper, sections: clonedSections });
    success("Question removed.");
  };

  const addQuestionToSection = (secId: string) => {
    if (!onUpdatePaper) return;
    const totalQ = paper.sections.reduce((acc, s) => acc + s.questions.length, 0);
    const clonedSections = paper.sections.map((sec) => {
      if (sec.id === secId) {
        const newQ: Question = {
          id: generateId("q"),
          number: totalQ + 1,
          question: "Click here to write your new question statement...",
          type: "mcq",
          marks: sec.marksPerQuestion || 1,
          difficulty: "medium",
          options: [
            { id: generateId("opt"), label: "A", text: "Option A" },
            { id: generateId("opt"), label: "B", text: "Option B" },
            { id: generateId("opt"), label: "C", text: "Option C" },
            { id: generateId("opt"), label: "D", text: "Option D" },
          ],
          answer: "A",
          explanation: "Answer explanation and marking points",
        };
        return { ...sec, questions: [...sec.questions, newQ] };
      }
      return sec;
    });

    let counter = 1;
    clonedSections.forEach((s) => {
      s.questions.forEach((q) => {
        q.number = counter++;
      });
    });

    onUpdatePaper({ ...paper, sections: clonedSections });
    success("New question added to section.");
  };

  const toggleKrutiDevForQuestion = (qId: string) => {
    if (!onUpdatePaper) return;
    const clonedSections = paper.sections.map((sec) => ({
      ...sec,
      questions: sec.questions.map((q) => {
        if (q.id === qId) {
          const isKruti = q.hindiQuestion && /^[a-zA-Z0-9\s;,.~_+/\\'"!@#$%^&*()=-]+$/.test(q.hindiQuestion);
          const convertedHindi = isKruti ? krutiDevToUnicode(q.hindiQuestion || "") : unicodeToKrutiDev(q.hindiQuestion || "");
          const convertedOptions = q.options?.map((opt) => ({
            ...opt,
            hindiText: opt.hindiText
              ? (isKruti ? krutiDevToUnicode(opt.hindiText) : unicodeToKrutiDev(opt.hindiText))
              : undefined,
          }));
          return {
            ...q,
            hindiQuestion: convertedHindi,
            options: convertedOptions,
          };
        }
        return q;
      }),
    }));
    onUpdatePaper({ ...paper, sections: clonedSections });
    info("Hindi text toggled between Unicode & Kruti Dev 010.", "Kruti Dev 010");
  };

  // --- INLINE EDITING HELPERS ---
  const updateQuestionInline = (qId: string, updates: Partial<Question>) => {
    if (!onUpdatePaper) return;
    const clonedSections = paper.sections.map((sec) => ({
      ...sec,
      questions: sec.questions.map((q) => (q.id === qId ? { ...q, ...updates } : q)),
    }));
    onUpdatePaper({ ...paper, sections: clonedSections });
  };

  const updateOptionInline = (qId: string, optId: string, text: string, hindiText?: string) => {
    if (!onUpdatePaper) return;
    const clonedSections = paper.sections.map((sec) => ({
      ...sec,
      questions: sec.questions.map((q) => {
        if (q.id === qId && q.options) {
          return {
            ...q,
            options: q.options.map((opt) =>
              opt.id === optId ? { ...opt, text, ...(hindiText !== undefined ? { hindiText } : {}) } : opt
            ),
          };
        }
        return q;
      }),
    }));
    onUpdatePaper({ ...paper, sections: clonedSections });
  };

  const updateHeader = (updates: Partial<typeof paper.header>) => {
    if (!onUpdatePaper) return;
    onUpdatePaper({
      ...paper,
      header: { ...paper.header, ...updates },
    });
  };

  const updateSectionInline = (secId: string, updates: Partial<Section>) => {
    if (!onUpdatePaper) return;
    const clonedSections = paper.sections.map((sec) => (sec.id === secId ? { ...sec, ...updates } : sec));
    onUpdatePaper({ ...paper, sections: clonedSections });
  };

  // Realistic dynamic pagination logic
  const pages = useMemo(() => {
    const generatedPages: {
      pageNumber: number;
      isFirstPage: boolean;
      items: {
        type: "section_header" | "question";
        section?: Section;
        question?: Question;
      }[];
    }[] = [];

    let currentPageItems: any[] = [];
    let currentHeightUnits = 0;
    const MAX_PAGE_UNITS = 85;
    const FIRST_PAGE_HEADER_COST = 35;

    let pageNum = 1;
    let maxAllowed = MAX_PAGE_UNITS - FIRST_PAGE_HEADER_COST;

    paper.sections.forEach((sec) => {
      const secCost = 8;
      if (currentHeightUnits + secCost > maxAllowed && currentPageItems.length > 0) {
        generatedPages.push({
          pageNumber: pageNum++,
          isFirstPage: pageNum === 2,
          items: currentPageItems,
        });
        currentPageItems = [];
        currentHeightUnits = 0;
        maxAllowed = MAX_PAGE_UNITS;
      }

      currentPageItems.push({ type: "section_header", section: sec });
      currentHeightUnits += secCost;

      sec.questions.forEach((q) => {
        let qCost = 10;
        if (q.type === "mcq") qCost = 14;
        else if (q.type === "case_study" || q.type === "long_answer") qCost = 20;
        else if (q.hindiQuestion) qCost += 6;

        if (currentHeightUnits + qCost > maxAllowed && currentPageItems.length > 0) {
          generatedPages.push({
            pageNumber: pageNum++,
            isFirstPage: false,
            items: currentPageItems,
          });
          currentPageItems = [];
          currentHeightUnits = 0;
          maxAllowed = MAX_PAGE_UNITS;
        }

        currentPageItems.push({ type: "question", question: q, section: sec });
        currentHeightUnits += qCost;
      });
    });

    if (currentPageItems.length > 0) {
      generatedPages.push({
        pageNumber: pageNum,
        isFirstPage: pageNum === 1,
        items: currentPageItems,
      });
    }

    return generatedPages;
  }, [paper.sections]);

  const totalCalculatedMarks = paper.sections.reduce(
    (acc, s) => acc + s.questions.reduce((qAcc, q) => qAcc + (q.marks || 0), 0),
    0
  );

  return (
    <div
      ref={containerRef}
      className="paper-viewport-container flex flex-col items-center w-full select-text pb-16 overflow-x-auto relative"
    >
      {/* Floating Zoom & Mode Banner */}
      <div className="sticky top-2 z-30 mb-4 flex flex-wrap items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md text-xs font-semibold text-slate-700 dark:text-slate-300">
        {/* Full Edit Mode Pill */}
        <button
          type="button"
          onClick={onToggleFullEditMode}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition shadow-xs ${
            isFullEditMode
              ? "bg-emerald-600 text-white shadow-emerald-500/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600"
          }`}
          title="Click to toggle inline full page editing mode"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isFullEditMode ? "Full Edit Active (On-Page)" : "Enable Full Page Edit"}</span>
        </button>

        <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-1" />

        <button
          type="button"
          onClick={handleZoomOut}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <span className="min-w-[42px] text-center text-[11px] font-mono font-bold">
          {Math.round(scale * 100)}%
        </span>

        <button
          type="button"
          onClick={handleZoomIn}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleFitToScreen}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] transition ${
            isAutoFit ? "bg-indigo-600 text-white font-bold" : "hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
          title="Fit to Screen"
        >
          <Maximize2 className="w-3 h-3" />
          <span>Fit</span>
        </button>

        {styling.fontFamily === "Kruti Dev 010" && (
          <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold">
            Kruti Dev 010 Active
          </span>
        )}
      </div>

      {/* Pages Container with Scale Transform */}
      <div
        id="paper-printable-area"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          marginBottom: scale < 1 ? `-${Math.round((1 - scale) * 1150 * pages.length)}px` : undefined,
        }}
        className="flex flex-col items-center gap-8 transition-transform duration-200"
      >
        {pages.map((page, pIdx) => {
          const isFirstPage = pIdx === 0;

          return (
            <div
              key={page.pageNumber}
              style={pageStyle}
              className={`paper-page relative bg-white text-black shadow-2xl rounded-sm border border-slate-200 transition-all ${fontClass}`}
            >
              {/* Watermark Overlay */}
              {styling.watermark.enabled && styling.watermark.text && (
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0"
                  style={{
                    opacity: styling.watermark.opacity,
                    transform: `rotate(${styling.watermark.rotation}deg)`,
                  }}
                >
                  <span
                    style={{ fontSize: `${styling.watermark.fontSize}pt` }}
                    className="font-bold tracking-widest text-slate-700 whitespace-nowrap"
                  >
                    {styling.watermark.text}
                  </span>
                </div>
              )}

              {/* Page Header (On page 2 onwards) */}
              {!isFirstPage && (
                <div className="flex items-center justify-between text-[10px] text-slate-600 border-b border-slate-300 pb-2 mb-4">
                  <span>{header.institutionName || header.examName}</span>
                  <span>
                    {header.subject} - {header.className}
                  </span>
                </div>
              )}

              {/* First Page Exam Master Header */}
              {isFirstPage && (
                <div
                  onClick={onSelectHeader}
                  className={`p-2 rounded-lg transition mb-5 border-b border-black pb-3 cursor-pointer ${
                    isFullEditMode ? "bg-amber-50/30 ring-1 ring-amber-300/60" : "hover:ring-2 hover:ring-indigo-400"
                  }`}
                >
                  {/* Institution Name */}
                  {isFullEditMode ? (
                    <input
                      value={header.institutionName || ""}
                      onChange={(e) => updateHeader({ institutionName: e.target.value })}
                      placeholder="ENTER INSTITUTION / SCHOOL NAME"
                      className="w-full text-center font-extrabold text-lg uppercase tracking-tight leading-tight bg-transparent border-b border-dashed border-amber-400 focus:outline-none focus:bg-amber-100/50"
                    />
                  ) : (
                    header.institutionName && (
                      <h2 className="text-center font-extrabold text-lg uppercase tracking-tight leading-tight">
                        {header.institutionName}
                      </h2>
                    )
                  )}

                  {header.hindiInstitutionName && (
                    <h3 className="text-center font-bold text-sm text-slate-700 leading-snug">
                      {header.hindiInstitutionName}
                    </h3>
                  )}

                  {/* Exam Title */}
                  {isFullEditMode ? (
                    <input
                      value={header.examName || ""}
                      onChange={(e) => updateHeader({ examName: e.target.value })}
                      placeholder="ENTER EXAMINATION TITLE"
                      className="w-full text-center font-bold text-base mt-1 tracking-wide uppercase bg-transparent border-b border-dashed border-amber-400 focus:outline-none focus:bg-amber-100/50"
                    />
                  ) : (
                    <div className="text-center font-bold text-base mt-1 tracking-wide uppercase">
                      {header.examName}
                    </div>
                  )}

                  {header.hindiExamName && (
                    <div className="text-center font-semibold text-xs text-slate-700">
                      {header.hindiExamName}
                    </div>
                  )}

                  {/* Meta Row: Class, Subject, Time, Max Marks */}
                  <div className="grid grid-cols-2 text-xs font-semibold mt-3 pt-2 border-t border-slate-300 gap-y-1">
                    <div>
                      <span>Class: </span>
                      {isFullEditMode ? (
                        <input
                          value={header.className}
                          onChange={(e) => updateHeader({ className: e.target.value })}
                          className="font-bold border-b border-slate-300 px-1 w-24 bg-transparent"
                        />
                      ) : (
                        <span className="font-bold">{header.className}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span>Time Allowed: </span>
                      {isFullEditMode ? (
                        <input
                          type="number"
                          value={header.durationMinutes}
                          onChange={(e) => updateHeader({ durationMinutes: Number(e.target.value) || 60 })}
                          className="font-bold border-b border-slate-300 px-1 w-16 text-right bg-transparent"
                        />
                      ) : (
                        <span className="font-bold">{header.durationMinutes} Minutes</span>
                      )}
                    </div>
                    <div>
                      <span>Subject: </span>
                      {isFullEditMode ? (
                        <input
                          value={header.subject}
                          onChange={(e) => updateHeader({ subject: e.target.value })}
                          className="font-bold border-b border-slate-300 px-1 w-32 bg-transparent"
                        />
                      ) : (
                        <span className="font-bold">{header.subject}</span>
                      )}
                      {header.hindiSubject && <span className="ml-1 text-slate-600">({header.hindiSubject})</span>}
                    </div>
                    <div className="text-right">
                      <span>Maximum Marks: </span>
                      {isFullEditMode ? (
                        <input
                          type="number"
                          value={header.totalMarks || totalCalculatedMarks}
                          onChange={(e) => updateHeader({ totalMarks: Number(e.target.value) || 0 })}
                          className="font-bold border-b border-slate-300 px-1 w-16 text-right bg-transparent"
                        />
                      ) : (
                        <span className="font-bold">{header.totalMarks || totalCalculatedMarks}</span>
                      )}
                    </div>
                  </div>

                  {/* General Instructions Box */}
                  {header.generalInstructions && header.generalInstructions.length > 0 && (
                    <div className="mt-3 p-2.5 rounded bg-slate-50 border border-slate-200 text-[10px] leading-relaxed">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold uppercase tracking-wider">General Instructions:</span>
                        {isFullEditMode && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateHeader({ generalInstructions: [...header.generalInstructions, "New instruction..."] });
                            }}
                            className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Rule</span>
                          </button>
                        )}
                      </div>
                      <ol className="list-decimal pl-4 space-y-0.5">
                        {header.generalInstructions.map((inst, iIdx) => (
                          <li key={iIdx} className="group/inst">
                            {isFullEditMode ? (
                              <div className="flex items-center gap-1">
                                <input
                                  value={inst}
                                  onChange={(e) => {
                                    const next = [...header.generalInstructions];
                                    next[iIdx] = e.target.value;
                                    updateHeader({ generalInstructions: next });
                                  }}
                                  className="flex-1 bg-transparent border-b border-dashed border-slate-300 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const next = header.generalInstructions.filter((_, idx) => idx !== iIdx);
                                    updateHeader({ generalInstructions: next });
                                  }}
                                  className="text-slate-400 hover:text-rose-600 p-0.5 opacity-0 group-hover/inst:opacity-100 transition"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span>{inst}</span>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* Page Content Items */}
              <div className="relative z-10 space-y-4">
                {page.items.map((item, itIdx) => {
                  if (item.type === "section_header" && item.section) {
                    const sec = item.section;
                    const isSecSelected = selectedSectionId === sec.id;
                    return (
                      <div
                        key={`sec_hdr_${sec.id}_${itIdx}`}
                        onClick={() => onSelectSection(sec.id)}
                        className={`text-center py-2 px-3 border-y border-black font-bold uppercase tracking-wide cursor-pointer rounded transition my-3 relative group/sec ${
                          isSecSelected ? "bg-indigo-50 ring-2 ring-indigo-500" : "hover:bg-slate-50"
                        }`}
                      >
                        {isFullEditMode ? (
                          <div className="space-y-1">
                            <input
                              value={sec.title}
                              onChange={(e) => updateSectionInline(sec.id, { title: e.target.value })}
                              placeholder="SECTION TITLE (e.g. SECTION A)"
                              className="text-xs font-extrabold text-center w-full bg-transparent border-b border-dashed border-indigo-300 focus:outline-none"
                            />
                            <input
                              value={sec.instructions || ""}
                              onChange={(e) => updateSectionInline(sec.id, { instructions: e.target.value })}
                              placeholder="Instructions (e.g. Questions 1 to 5 carry 1 mark each)"
                              className="text-[10px] font-normal italic text-center w-full bg-transparent border-b border-dashed border-indigo-200 focus:outline-none"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="text-xs font-extrabold">{sec.title}</div>
                            {sec.hindiTitle && (
                              <div className="text-[11px] font-semibold text-slate-700">{sec.hindiTitle}</div>
                            )}
                            {sec.instructions && (
                              <div className="text-[10px] font-normal italic lowercase first-letter:uppercase text-slate-700">
                                ({sec.instructions})
                              </div>
                            )}
                          </>
                        )}

                        {/* Section Add Question Trigger */}
                        {isFullEditMode && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/sec:opacity-100 transition">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addQuestionToSection(sec.id);
                              }}
                              className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Add Q</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (item.type === "question" && item.question && item.section) {
                    const q = item.question;
                    const sec = item.section;
                    const isQSelected = selectedQuestionId === q.id;
                    const isDragging = draggingQId === q.id;
                    const isDropTarget = dropTargetQId === q.id;

                    return (
                      <div
                        key={`q_item_${q.id}`}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", JSON.stringify({ qId: q.id, fromSectionId: sec.id }));
                          e.dataTransfer.effectAllowed = "move";
                          setDraggingQId(q.id);
                        }}
                        onDragEnd={() => {
                          setDraggingQId(null);
                          setDropTargetQId(null);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          if (draggingQId && draggingQId !== q.id) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const midY = rect.top + rect.height / 2;
                            setDropPosition(e.clientY < midY ? "before" : "after");
                            setDropTargetQId(q.id);
                          }
                        }}
                        onDragLeave={() => {
                          if (dropTargetQId === q.id) {
                            setDropTargetQId(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const raw = e.dataTransfer.getData("text/plain");
                          if (raw) {
                            try {
                              const parsed = JSON.parse(raw);
                              if (parsed?.qId && parsed.qId !== q.id) {
                                moveQuestionTo(parsed.qId, q.id, dropPosition);
                              }
                            } catch {}
                          }
                          setDraggingQId(null);
                          setDropTargetQId(null);
                        }}
                        onClick={() => onSelectQuestion(q.id)}
                        className={`question-block group p-2.5 rounded-lg border transition cursor-pointer relative ${
                          isQSelected
                            ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500"
                            : "border-transparent hover:border-slate-300 hover:bg-slate-50/50"
                        } ${isDragging ? "opacity-30 border-dashed border-indigo-400 scale-[0.99]" : ""} ${
                          isDropTarget
                            ? dropPosition === "before"
                              ? "border-t-4 border-t-indigo-600 bg-indigo-50/50"
                              : "border-b-4 border-b-indigo-600 bg-indigo-50/50"
                            : ""
                        }`}
                      >
                        {/* Floating Question Action Bar on Hover/Selection */}
                        <div className="drag-handle absolute -top-3 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-md rounded-md p-0.5 z-20">
                          <div
                            className="p-1 text-slate-400 hover:text-indigo-600 cursor-grab active:cursor-grabbing flex items-center"
                            title="Drag with mouse to reposition anywhere on the paper"
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              stepMoveQuestion(q.id, "up");
                            }}
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            title="Move Question Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              stepMoveQuestion(q.id, "down");
                            }}
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            title="Move Question Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateQuestion(q.id);
                            }}
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            title="Duplicate Question"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {q.hindiQuestion && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleKrutiDevForQuestion(q.id);
                              }}
                              className="px-1 py-0.5 text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded font-bold text-[9px] border border-slate-200"
                              title="Toggle Hindi text between Unicode and Kruti Dev 010"
                            >
                              KD
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteQuestion(q.id);
                            }}
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete Question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Question Row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 flex-1">
                            <span className="font-extrabold text-xs shrink-0 select-none">
                              Q{q.number}.
                            </span>

                            <div className="text-xs leading-normal flex-1">
                              {isFullEditMode ? (
                                <div className="space-y-1.5">
                                  <textarea
                                    rows={2}
                                    value={q.question}
                                    onChange={(e) => updateQuestionInline(q.id, { question: e.target.value })}
                                    className="w-full font-medium text-black text-xs p-1 rounded bg-amber-50/50 border border-amber-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Write English question..."
                                  />
                                  <textarea
                                    rows={2}
                                    value={q.hindiQuestion || ""}
                                    onChange={(e) => updateQuestionInline(q.id, { hindiQuestion: e.target.value })}
                                    placeholder="हिंदी अनुवाद लिखें (या कृति देव 010 में लिखें)..."
                                    className="w-full text-slate-800 text-[11px] p-1 rounded bg-amber-50/30 border border-amber-200 focus:outline-none"
                                  />
                                </div>
                              ) : (
                                <>
                                  <div className="font-medium text-black">{q.question}</div>
                                  {q.hindiQuestion && (
                                    <div className="text-slate-700 text-[11px] mt-0.5 font-normal">
                                      {q.hindiQuestion}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Marks Indicator / Inline Edit */}
                          <div className="shrink-0">
                            {isFullEditMode ? (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 font-semibold">[</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={20}
                                  value={q.marks}
                                  onChange={(e) =>
                                    updateQuestionInline(q.id, { marks: Number(e.target.value) || 1 })
                                  }
                                  className="w-8 text-center font-bold text-xs p-0.5 rounded bg-amber-100 border border-amber-300 focus:outline-none"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">]</span>
                              </div>
                            ) : (
                              <div className="text-right font-bold text-xs">[{q.marks}]</div>
                            )}
                          </div>
                        </div>

                        {/* Assertion & Reason */}
                        {q.type === "assertion_reason" && (q.assertion || q.reason) && (
                          <div className="pl-6 pt-1 text-xs space-y-0.5">
                            {q.assertion && (
                              <div>
                                <span className="font-bold">Assertion (A):</span> {q.assertion}
                              </div>
                            )}
                            {q.reason && (
                              <div>
                                <span className="font-bold">Reason (R):</span> {q.reason}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Options Grid for MCQs */}
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pl-6 pt-2 text-xs">
                            {q.options.map((opt) => (
                              <div key={opt.id} className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    if (isFullEditMode) {
                                      e.stopPropagation();
                                      updateQuestionInline(q.id, { answer: opt.label });
                                    }
                                  }}
                                  className={`w-5 h-5 rounded font-bold text-xs flex items-center justify-center shrink-0 transition ${
                                    q.answer === opt.label
                                      ? "bg-emerald-600 text-white"
                                      : "text-slate-800 hover:bg-slate-200"
                                  }`}
                                  title={isFullEditMode ? `Click to mark (${opt.label}) as correct answer` : undefined}
                                >
                                  ({opt.label})
                                </button>

                                {isFullEditMode ? (
                                  <div className="flex-1 flex items-center gap-1">
                                    <input
                                      value={opt.text}
                                      onChange={(e) =>
                                        updateOptionInline(q.id, opt.id, e.target.value, opt.hindiText)
                                      }
                                      className="flex-1 p-0.5 rounded border border-slate-200 bg-white text-xs"
                                    />
                                    {opt.hindiText !== undefined && (
                                      <input
                                        value={opt.hindiText}
                                        onChange={(e) =>
                                          updateOptionInline(q.id, opt.id, opt.text, e.target.value)
                                        }
                                        placeholder="हिंदी"
                                        className="w-20 p-0.5 rounded border border-slate-200 bg-white text-[11px]"
                                      />
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <span>{opt.text}</span>
                                    {opt.hindiText && (
                                      <span className="text-slate-600 text-[11px]"> / {opt.hindiText}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>

              {/* Page Footer */}
              <div className="absolute bottom-4 left-0 right-0 px-8 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200 pt-2">
                <span>{footer.text || "Examination Question Paper"}</span>
                <span className="font-bold">
                  Page {page.pageNumber} of {pages.length + (showAnswerKey ? 1 : 0)}
                </span>
              </div>
            </div>
          );
        })}

        {/* Answer Key Page (if toggled) */}
        {showAnswerKey && (
          <div
            style={pageStyle}
            className={`paper-page relative bg-white text-black shadow-2xl rounded-sm border border-slate-200 transition-all ${fontClass}`}
          >
            <div className="text-center pb-3 border-b-2 border-indigo-900 mb-6">
              <h2 className="text-lg font-extrabold text-indigo-950 uppercase tracking-wide">
                Answer Key & Marking Scheme
              </h2>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                {header.subject} • {header.className} • {header.examName}
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {paper.sections.map((sec) => (
                <div key={`ak_${sec.id}`} className="space-y-2">
                  <div className="font-bold text-xs text-indigo-900 uppercase border-b border-slate-300 pb-1">
                    {sec.title}
                  </div>
                  <div className="space-y-2 pl-2">
                    {sec.questions.map((q) => (
                      <div key={`ak_q_${q.id}`} className="p-2 rounded bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between font-bold mb-1">
                          <span>
                            Question {q.number} ({q.marks} Marks):
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                            Expected Answer
                          </span>
                        </div>
                        <div className="text-slate-800 leading-relaxed font-medium">
                          {q.answer || "Answer as per syllabus criteria."}
                        </div>
                        {q.explanation && (
                          <div className="mt-1 text-[11px] text-slate-600 italic">
                            <span className="font-semibold">Note / Guidance:</span> {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Answer key footer */}
            <div className="absolute bottom-4 left-0 right-0 px-8 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200 pt-2">
              <span>Official Solution Key</span>
              <span className="font-bold">Page {pages.length + 1} of {pages.length + 1}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
