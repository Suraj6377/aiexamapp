"use client";

import React, { useState } from "react";
import {
  DocumentMetadata,
  LanguageOption,
  PaperGenerationConfig,
  QuestionType,
  DifficultyLevel,
  ExamTemplate,
} from "@/types/paper";
import { DEFAULT_TEMPLATES } from "@/lib/templates/defaultTemplates";
import {
  Sparkles,
  Sliders,
  Layers,
  BookOpen,
  Check,
  CheckSquare,
  Square,
  HelpCircle,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  LayoutTemplate,
} from "lucide-react";

interface PaperConfigFormProps {
  documentMetadata?: DocumentMetadata | null;
  onSubmit: (config: PaperGenerationConfig) => void;
  isGenerating?: boolean;
}

const QUESTION_TYPE_OPTIONS: { id: QuestionType; label: string; desc: string }[] = [
  { id: "mcq", label: "MCQ", desc: "4 options, 1 correct" },
  { id: "multiple_select", label: "Multiple Select", desc: "Multiple correct answers" },
  { id: "true_false", label: "True / False", desc: "Binary truth evaluations" },
  { id: "fill_in_blanks", label: "Fill in Blanks", desc: "Missing keyword blanks" },
  { id: "very_short_answer", label: "Very Short (VSA)", desc: "1-2 lines (1 mark)" },
  { id: "short_answer", label: "Short Answer (SA)", desc: "30-50 words (2-3 marks)" },
  { id: "long_answer", label: "Long Answer (LA)", desc: "Descriptive (5 marks)" },
  { id: "numerical", label: "Numerical Problem", desc: "Calculations with formulas" },
  { id: "case_study", label: "Case Study / Passage", desc: "Source text analysis" },
  { id: "assertion_reason", label: "Assertion & Reason", desc: "A/R paired logic" },
  { id: "match_the_following", label: "Match Columns", desc: "Column A & Column B" },
];

const EXAM_TYPE_OPTIONS = [
  "Unit Test",
  "Class Test",
  "Mid Term",
  "Half Yearly",
  "Final Exam",
  "Board Exam",
  "Practice Test",
  "Mock Test",
  "College Exam",
  "Competitive Exam",
  "Custom",
];

const CLASS_OPTIONS = [
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
  "Undergraduate",
  "Postgraduate",
  "Custom",
];

export function PaperConfigForm({ documentMetadata, onSubmit, isGenerating = false }: PaperConfigFormProps) {
  // Exam metadata
  const [className, setClassName] = useState<string>(documentMetadata?.detectedClass || "Class 12");
  const [subject, setSubject] = useState<string>(documentMetadata?.detectedSubject || "Physics");
  const [examType, setExamType] = useState<string>("Final Exam");
  const [language, setLanguage] = useState<LanguageOption>(
    documentMetadata?.language?.toLowerCase().includes("bilingual")
      ? "bilingual"
      : documentMetadata?.language?.toLowerCase().includes("hindi")
      ? "hindi"
      : "english"
  );

  // Templates Preset
  const [availableTemplates, setAvailableTemplates] = useState<ExamTemplate[]>(DEFAULT_TEMPLATES);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string>("");

  React.useEffect(() => {
    // 1. LocalStorage
    try {
      const local = localStorage.getItem("ai_study_templates");
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAvailableTemplates(parsed);
        }
      }
    } catch {}

    // 2. Fetch server templates
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.templates) && d.templates.length > 0) {
          setAvailableTemplates(d.templates);
          try {
            localStorage.setItem("ai_study_templates", JSON.stringify(d.templates));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectTemplate = (tplId: string) => {
    setAppliedTemplateId(tplId);
    const tpl = availableTemplates.find((t) => t.id === tplId);
    if (!tpl) return;
    if (tpl.header?.durationMinutes) setDurationMinutes(tpl.header.durationMinutes);
    if (tpl.header?.totalMarks) setTotalMarks(tpl.header.totalMarks);
    if (tpl.sectionStructure && tpl.sectionStructure.length > 0) {
      const allTypes = Array.from(new Set(tpl.sectionStructure.map((s) => s.defaultQuestionType)));
      if (allTypes.length > 0) setSelectedTypes(allTypes);
      const totalQ = tpl.sectionStructure.reduce((acc, s) => acc + s.questionCount, 0);
      if (totalQ > 0) setQuestionCount(totalQ);
    }
  };

  // Quantitative parameters
  const [questionCount, setQuestionCount] = useState<number>(15);
  const [totalMarks, setTotalMarks] = useState<number>(50);
  const [durationMinutes, setDurationMinutes] = useState<number>(120);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("mixed");

  // Selected question types
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    "mcq",
    "short_answer",
    "long_answer",
    "numerical",
  ]);

  // Topic tree selection state
  const initialChapters = (documentMetadata?.chapters || []).map((c) => ({
    id: c.id,
    chapterName: c.name,
    selected: true,
    topics: c.topics.map((t) => ({ id: t.id, name: t.name, selected: true })),
  }));

  const [chapterSelection, setChapterSelection] = useState(
    initialChapters.length > 0
      ? initialChapters
      : [
          {
            id: "c1",
            chapterName: subject + " Unit 1",
            selected: true,
            topics: [
              { id: "t1", name: "Core Principles", selected: true },
              { id: "t2", name: "Analytical Applications", selected: true },
              { id: "t3", name: "Problem Solving", selected: true },
            ],
          },
        ]
  );

  // Advanced AI controls
  const [customInstructions, setCustomInstructions] = useState<string>("");
  const [avoidDuplicates, setAvoidDuplicates] = useState<boolean>(true);
  const [balanceChapterCoverage, setBalanceChapterCoverage] = useState<boolean>(true);
  const [balanceDifficulty, setBalanceDifficulty] = useState<boolean>(true);
  const [preferImportantConcepts, setPreferImportantConcepts] = useState<boolean>(true);
  const [generateAnswerKey, setGenerateAnswerKey] = useState<boolean>(true);
  const [generateExplanations, setGenerateExplanations] = useState<boolean>(true);
  const [allowExternalKnowledge, setAllowExternalKnowledge] = useState<boolean>(false);
  const [strictSourceOnly, setStrictSourceOnly] = useState<boolean>(true);

  // Expanded chapter accordions
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>(() => {
    const acc: Record<string, boolean> = {};
    chapterSelection.forEach((c) => (acc[c.id] = true));
    return acc;
  });

  const toggleType = (t: QuestionType) => {
    if (selectedTypes.includes(t)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter((x) => x !== t));
      }
    } else {
      setSelectedTypes([...selectedTypes, t]);
    }
  };

  const toggleChapterSelection = (chapterId: string) => {
    setChapterSelection((prev) =>
      prev.map((c) => {
        if (c.id === chapterId) {
          const newSelected = !c.selected;
          return {
            ...c,
            selected: newSelected,
            topics: c.topics.map((t) => ({ ...t, selected: newSelected })),
          };
        }
        return c;
      })
    );
  };

  const toggleTopicSelection = (chapterId: string, topicId: string) => {
    setChapterSelection((prev) =>
      prev.map((c) => {
        if (c.id === chapterId) {
          const updatedTopics = c.topics.map((t) => (t.id === topicId ? { ...t, selected: !t.selected } : t));
          const anySelected = updatedTopics.some((t) => t.selected);
          return {
            ...c,
            topics: updatedTopics,
            selected: anySelected,
          };
        }
        return c;
      })
    );
  };

  const selectAllTopics = (select: boolean) => {
    setChapterSelection((prev) =>
      prev.map((c) => ({
        ...c,
        selected: select,
        topics: c.topics.map((t) => ({ ...t, selected: select })),
      }))
    );
  };

  const toggleAccordion = (chapterId: string) => {
    setExpandedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const appendInstruction = (text: string) => {
    setCustomInstructions((prev) => (prev ? `${prev}\n${text}` : text));
  };

  const handleGenerateClick = (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare active chapters and topics
    const selectedChapters = chapterSelection
      .filter((c) => c.selected)
      .map((c) => ({
        chapterName: c.chapterName,
        topics: c.topics.filter((t) => t.selected).map((t) => t.name),
      }))
      .filter((c) => c.topics.length > 0);

    const config: PaperGenerationConfig = {
      documentId: documentMetadata?.id,
      extractedContentSummary: documentMetadata?.extractedText?.slice(0, 500),
      className,
      subject,
      examType,
      language,
      durationMinutes,
      totalMarks,
      questionCount,
      difficulty,
      questionTypes: selectedTypes,
      selectedChapters:
        selectedChapters.length > 0
          ? selectedChapters
          : [
              {
                chapterName: subject + " Key Chapters",
                topics: ["Core Concepts", "Standard Formulations"],
              },
            ],
      customInstructions,
      advancedOptions: {
        avoidDuplicates,
        balanceChapterCoverage,
        balanceDifficulty,
        preferImportantConcepts,
        generateAnswerKey,
        generateExplanations,
        allowExternalKnowledge,
        strictSourceOnly,
      },
    };

    onSubmit(config);
  };

  return (
    <form onSubmit={handleGenerateClick} className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* 1. Exam Basics */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Exam Specifications</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Core parameters for paper structure and header</p>
            </div>
          </div>

          {/* Quick Template Preset Selector */}
          {availableTemplates.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-xs font-semibold text-slate-400 flex items-center gap-1">
                <LayoutTemplate className="w-3.5 h-3.5 text-indigo-500" />
                <span>Load Template:</span>
              </span>
              <select
                value={appliedTemplateId}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 text-xs font-bold focus:outline-none"
              >
                <option value="">Choose Template Framework...</option>
                {availableTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.header?.totalMarks || 100}M / {t.header?.durationMinutes || 180}m)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Class */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Class / Grade
            </label>
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {CLASS_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Physics, Mathematics"
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Exam Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Exam Type
            </label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {EXAM_TYPE_OPTIONS.map((et) => (
                <option key={et} value={et}>{et}</option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Language Format
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageOption)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="english">English Only</option>
              <option value="hindi">Hindi Only (हिंदी)</option>
              <option value="bilingual">Bilingual (English + Hindi)</option>
            </select>
          </div>
        </div>

        {/* Quant parameters: Marks, Count, Duration, Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>Total Questions</span>
              <span className="font-bold text-indigo-600">{questionCount}</span>
            </div>
            <input
              type="range"
              min={5}
              max={60}
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>5</span>
              <span>30</span>
              <span>60</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Total Marks</span>
            </label>
            <input
              type="number"
              min={10}
              max={300}
              value={totalMarks}
              onChange={(e) => setTotalMarks(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-sky-500" />
              <span>Duration</span>
            </label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value={45}>45 Minutes (Unit Test)</option>
              <option value={60}>1 Hour</option>
              <option value={90}>1.5 Hours</option>
              <option value={120}>2 Hours</option>
              <option value={180}>3 Hours (Standard Board/University)</option>
              <option value={240}>4 Hours</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Difficulty Mix
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="mixed">Mixed (Balanced 30% Easy, 50% Med, 20% Hard)</option>
              <option value="easy">Easy (Foundational & Definitions)</option>
              <option value="medium">Medium (Standard Exam Standard)</option>
              <option value="hard">Hard (Advanced & Analytical)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Question Types Multi-select */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Included Question Types</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Select one or more question styles to generate</p>
            </div>
          </div>

          <div className="text-xs font-medium text-slate-500">
            {selectedTypes.length} type(s) selected
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {QUESTION_TYPE_OPTIONS.map((item) => {
            const isChecked = selectedTypes.includes(item.id);
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => toggleType(item.id)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isChecked
                    ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 shadow-xs ring-1 ring-indigo-500"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">{item.label}</span>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center ${
                      isChecked ? "bg-indigo-600 text-white" : "border border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3" />}
                  </div>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {item.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Topic & Chapter Grounded Selection */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/40 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Grounded Topic Selection</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI will restrict questions strictly to your selected chapters and topics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => selectAllTopics(true)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => selectAllTopics(false)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 transition"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Tree of chapters & topics */}
        <div className="space-y-3">
          {chapterSelection.map((chap) => {
            const isExpanded = expandedChapters[chap.id] ?? true;
            return (
              <div
                key={chap.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-950/30"
              >
                {/* Chapter header */}
                <div className="p-3.5 flex items-center justify-between bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900 transition">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleChapterSelection(chap.id)}
                      className="text-indigo-600 dark:text-indigo-400"
                    >
                      {chap.selected ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {chap.chapterName}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                      {chap.topics.filter((t) => t.selected).length}/{chap.topics.length} topics
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleAccordion(chap.id)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Topics chips container */}
                {isExpanded && (
                  <div className="p-3.5 flex flex-wrap gap-2 border-t border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20">
                    {chap.topics.map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => toggleTopicSelection(chap.id, t.id)}
                        className={`text-xs px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                          t.selected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs font-semibold"
                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        {t.selected && <Check className="w-3 h-3" />}
                        <span>{t.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Advanced AI Controls */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 sm:space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Advanced AI Controls & Grounding</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Fine-tune hallucination controls and exam quality parameters</p>
          </div>
        </div>

        {/* Custom Instructions */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Custom Prompts & Instructions
          </label>
          <textarea
            rows={3}
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="e.g. Focus on derivations, make question 5 a tricky numerical, include diagram guidance..."
            className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[
              "Create conceptual questions",
              "Focus more on numerical problems",
              "Make questions suitable for board examination",
              "Do not repeat similar questions",
            ].map((preset) => (
              <button
                type="button"
                key={preset}
                onClick={() => appendInstruction(preset)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition"
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Grounding and Quality Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {/* Strict Source-only */}
          <label className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={strictSourceOnly}
              onChange={(e) => setStrictSourceOnly(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-indigo-600 accent-indigo-600"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Strict Source-Only Mode</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Zero AI hallucination outside uploaded notes</span>
            </div>
          </label>

          {/* Avoid Duplicates */}
          <label className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={avoidDuplicates}
              onChange={(e) => setAvoidDuplicates(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-indigo-600 accent-indigo-600"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Avoid Duplicate Questions</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Enforce distinct phrasing across sections</span>
            </div>
          </label>

          {/* Balance Chapter Coverage */}
          <label className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={balanceChapterCoverage}
              onChange={(e) => setBalanceChapterCoverage(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-indigo-600 accent-indigo-600"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Balance Chapter Coverage</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Distribute weightage evenly across chapters</span>
            </div>
          </label>

          {/* Generate Answer Key */}
          <label className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={generateAnswerKey}
              onChange={(e) => setGenerateAnswerKey(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-indigo-600 accent-indigo-600"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Generate Answer Key</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Include solutions & marking scheme</span>
            </div>
          </label>

          {/* Generate Explanations */}
          <label className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={generateExplanations}
              onChange={(e) => setGenerateExplanations(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-indigo-600 accent-indigo-600"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Generate Explanations</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Add conceptual reasoning for answers</span>
            </div>
          </label>

          {/* Allow External Knowledge */}
          <label className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allowExternalKnowledge}
              onChange={(e) => setAllowExternalKnowledge(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-indigo-600 accent-indigo-600"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Allow External Knowledge</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Permit standard syllabus questions</span>
            </div>
          </label>
        </div>
      </div>

      {/* Prominent CTA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-xl gap-4">
        <div>
          <h4 className="text-sm sm:text-base font-bold">Ready to Generate Examination Paper</h4>
          <p className="text-xs text-indigo-200 mt-0.5">
            {questionCount} Questions • {totalMarks} Marks • {subject} ({className})
          </p>
        </div>

        <button
          type="submit"
          disabled={isGenerating}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-white hover:bg-indigo-50 text-indigo-900 font-extrabold text-sm shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none min-h-[48px]"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin" />
              <span>Generating Paper...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Generate Question Paper</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
