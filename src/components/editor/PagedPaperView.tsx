"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { QuestionPaper, Question, Section } from "@/types/paper";
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from "lucide-react";

interface PagedPaperViewProps {
  paper: QuestionPaper;
  selectedQuestionId: string | null;
  selectedSectionId: string | null;
  onSelectQuestion: (id: string) => void;
  onSelectSection: (id: string) => void;
  onSelectHeader: () => void;
  showAnswerKey?: boolean;
}

export function PagedPaperView({
  paper,
  selectedQuestionId,
  selectedSectionId,
  onSelectQuestion,
  onSelectSection,
  onSelectHeader,
  showAnswerKey = false,
}: PagedPaperViewProps) {
  const { styling, header, footer } = paper;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [isAutoFit, setIsAutoFit] = useState<boolean>(true);

  // Calculate auto-fit scale on mobile/small screens
  useEffect(() => {
    const handleResize = () => {
      if (!isAutoFit || !containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      // Standard A4 width is ~794px (210mm at 96dpi)
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

  // Font family mapping
  const fontClass = useMemo(() => {
    switch (styling.fontFamily) {
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
      {/* Floating Zoom / Auto-Fit Controls for Mobile & Desktop */}
      <div className="sticky top-2 z-20 mb-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md text-xs font-semibold text-slate-700 dark:text-slate-300">
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

        <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

        <button
          type="button"
          onClick={handleFitToScreen}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] transition ${
            isAutoFit
              ? "bg-indigo-600 text-white font-bold"
              : "hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
          title="Fit to Screen"
        >
          <Maximize2 className="w-3 h-3" />
          <span>Fit</span>
        </button>
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
                  <span>{header.subject} - {header.className}</span>
                </div>
              )}

              {/* First Page Exam Master Header */}
              {isFirstPage && (
                <div
                  onClick={onSelectHeader}
                  className="cursor-pointer hover:ring-2 hover:ring-indigo-400 p-2 rounded-lg transition mb-5 border-b border-black pb-3"
                >
                  {/* Institution Name */}
                  {header.institutionName && (
                    <h2 className="text-center font-extrabold text-lg uppercase tracking-tight leading-tight">
                      {header.institutionName}
                    </h2>
                  )}
                  {header.hindiInstitutionName && (
                    <h3 className="text-center font-bold text-sm text-slate-700 leading-snug">
                      {header.hindiInstitutionName}
                    </h3>
                  )}

                  {/* Exam Title */}
                  <div className="text-center font-bold text-base mt-1 tracking-wide uppercase">
                    {header.examName}
                  </div>
                  {header.hindiExamName && (
                    <div className="text-center font-semibold text-xs text-slate-700">
                      {header.hindiExamName}
                    </div>
                  )}

                  {/* Meta Row: Class, Subject, Time, Max Marks */}
                  <div className="grid grid-cols-2 text-xs font-semibold mt-3 pt-2 border-t border-slate-300 gap-y-1">
                    <div>
                      <span>Class: </span>
                      <span className="font-bold">{header.className}</span>
                    </div>
                    <div className="text-right">
                      <span>Time Allowed: </span>
                      <span className="font-bold">{header.durationMinutes} Minutes</span>
                    </div>
                    <div>
                      <span>Subject: </span>
                      <span className="font-bold">{header.subject}</span>
                      {header.hindiSubject && <span className="ml-1 text-slate-600">({header.hindiSubject})</span>}
                    </div>
                    <div className="text-right">
                      <span>Maximum Marks: </span>
                      <span className="font-bold">{header.totalMarks || totalCalculatedMarks}</span>
                    </div>
                  </div>

                  {/* General Instructions Box */}
                  {header.generalInstructions && header.generalInstructions.length > 0 && (
                    <div className="mt-3 p-2.5 rounded bg-slate-50 border border-slate-200 text-[10px] leading-relaxed">
                      <div className="font-bold uppercase tracking-wider mb-1">General Instructions:</div>
                      <ol className="list-decimal pl-4 space-y-0.5">
                        {header.generalInstructions.map((inst, iIdx) => (
                          <li key={iIdx}>{inst}</li>
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
                    const isSecSelected = selectedSectionId === item.section.id;
                    return (
                      <div
                        key={`sec_hdr_${item.section.id}_${itIdx}`}
                        onClick={() => onSelectSection(item.section!.id)}
                        className={`text-center py-2 px-3 border-y border-black font-bold uppercase tracking-wide cursor-pointer rounded transition my-3 ${
                          isSecSelected ? "bg-indigo-50 ring-2 ring-indigo-500" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="text-xs font-extrabold">{item.section.title}</div>
                        {item.section.hindiTitle && (
                          <div className="text-[11px] font-semibold text-slate-700">{item.section.hindiTitle}</div>
                        )}
                        {item.section.instructions && (
                          <div className="text-[10px] font-normal italic lowercase first-letter:uppercase text-slate-700">
                            ({item.section.instructions})
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (item.type === "question" && item.question) {
                    const q = item.question;
                    const isQSelected = selectedQuestionId === q.id;

                    return (
                      <div
                        key={`q_item_${q.id}`}
                        onClick={() => onSelectQuestion(q.id)}
                        className={`question-block group p-2.5 rounded-lg border transition cursor-pointer relative ${
                          isQSelected
                            ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500"
                            : "border-transparent hover:border-slate-300 hover:bg-slate-50/50"
                        }`}
                      >
                        {/* Question Row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 flex-1">
                            <span className="font-extrabold text-xs shrink-0">
                              Q{q.number}.
                            </span>
                            <div className="text-xs leading-normal flex-1">
                              <div className="font-medium text-black">{q.question}</div>
                              {q.hindiQuestion && (
                                <div className="text-slate-700 text-[11px] mt-0.5 font-normal">
                                  {q.hindiQuestion}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Marks Indicator */}
                          <div className="text-right shrink-0 font-bold text-xs">
                            [{q.marks}]
                          </div>
                        </div>

                        {/* Assertion & Reason */}
                        {q.type === "assertion_reason" && (q.assertion || q.reason) && (
                          <div className="pl-6 pt-1 text-xs space-y-0.5">
                            {q.assertion && <div><span className="font-bold">Assertion (A):</span> {q.assertion}</div>}
                            {q.reason && <div><span className="font-bold">Reason (R):</span> {q.reason}</div>}
                          </div>
                        )}

                        {/* Options Grid for MCQs */}
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pl-6 pt-2 text-xs">
                            {q.options.map((opt) => (
                              <div key={opt.id} className="flex items-start gap-1.5">
                                <span className="font-bold">({opt.label})</span>
                                <span>{opt.text}</span>
                                {opt.hindiText && (
                                  <span className="text-slate-600 text-[11px]"> / {opt.hindiText}</span>
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
                          <span>Question {q.number} ({q.marks} Marks):</span>
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
