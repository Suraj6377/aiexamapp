"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { QuestionPaper } from "@/types/paper";
import { EditorSidebar } from "@/components/editor/EditorSidebar";
import { PagedPaperView } from "@/components/editor/PagedPaperView";
import { ElementInspector } from "@/components/editor/ElementInspector";
import { DesignToolbar } from "@/components/editor/DesignToolbar";
import { Loader2, ArrowLeft, AlertCircle, FileText, ListOrdered, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/providers/ToastProvider";

export default function PaperEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { error, success } = useToast();

  const paperId = params.id as string;

  const [paper, setPaper] = useState<QuestionPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [isFullEditMode, setIsFullEditMode] = useState(false);

  // Mobile navigation tab state: "canvas" | "outline" | "inspector"
  const [activeMobileTab, setActiveMobileTab] = useState<"canvas" | "outline" | "inspector">("canvas");

  // Selection states
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isHeaderSelected, setIsHeaderSelected] = useState<boolean>(false);

  // Undo / Redo history stack
  const [history, setHistory] = useState<QuestionPaper[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

  // Fetch paper
  useEffect(() => {
    async function loadPaper() {
      // 1. Check local storage first
      let foundLocal: QuestionPaper | null = null;
      try {
        const local = localStorage.getItem("ai_study_papers");
        if (local) {
          const list: QuestionPaper[] = JSON.parse(local);
          foundLocal = list.find((p) => p.id === paperId) || null;
          if (foundLocal) {
            setPaper(foundLocal);
            setHistory([foundLocal]);
            setHistoryIndex(0);
            if (foundLocal.sections?.[0]?.questions?.[0]) {
              setSelectedQuestionId(foundLocal.sections[0].questions[0].id);
            }
          }
        }
      } catch {}

      // 2. Fetch from server API
      try {
        const res = await fetch(`/api/papers/${paperId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.paper) {
            setPaper(data.paper);
            setHistory([data.paper]);
            setHistoryIndex(0);

            // Update localStorage
            try {
              const local = localStorage.getItem("ai_study_papers");
              const list: QuestionPaper[] = local ? JSON.parse(local) : [];
              const updated = [data.paper, ...list.filter((p) => p.id !== data.paper.id)];
              localStorage.setItem("ai_study_papers", JSON.stringify(updated));
            } catch {}

            // Pre-select first question
            if (data.paper.sections?.[0]?.questions?.[0]) {
              setSelectedQuestionId(data.paper.sections[0].questions[0].id);
            }
            return;
          }
        }
        if (!foundLocal) {
          throw new Error("Paper not found");
        }
      } catch (err: any) {
        if (!foundLocal) {
          error(err.message || "Failed to load paper");
        }
      } finally {
        setLoading(false);
      }
    }
    if (paperId) loadPaper();
  }, [paperId]);

  // Debounced Autosave to API & localStorage
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savePaperToServer = useCallback(
    async (updatedPaper: QuestionPaper) => {
      setIsSaving(true);
      // Immediately persist to localStorage
      try {
        const local = localStorage.getItem("ai_study_papers");
        const list: QuestionPaper[] = local ? JSON.parse(local) : [];
        const idx = list.findIndex((p) => p.id === updatedPaper.id);
        if (idx >= 0) {
          list[idx] = updatedPaper;
        } else {
          list.unshift(updatedPaper);
        }
        localStorage.setItem("ai_study_papers", JSON.stringify(list));
      } catch {}

      try {
        await fetch(`/api/papers/${updatedPaper.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedPaper),
        });
      } catch (err) {
        console.warn("Server autosave skipped, saved locally:", err);
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const handleUpdatePaper = useCallback(
    (updated: QuestionPaper) => {
      setPaper(updated);

      if (!isUndoRedoAction.current) {
        // Push to history
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(updated);
        if (newHistory.length > 30) newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
      isUndoRedoAction.current = false;

      // Debounce autosave
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        savePaperToServer(updated);
      }, 800);
    },
    [history, historyIndex, savePaperToServer]
  );

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setPaper(prev);
      savePaperToServer(prev);
    }
  }, [history, historyIndex, savePaperToServer]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setPaper(next);
      savePaperToServer(next);
    }
  }, [history, historyIndex, savePaperToServer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Selection handlers
  const handleSelectQuestion = (qId: string) => {
    setSelectedQuestionId(qId);
    setSelectedSectionId(null);
    setIsHeaderSelected(false);
  };

  const handleSelectSection = (sId: string) => {
    setSelectedSectionId(sId);
    setSelectedQuestionId(null);
    setIsHeaderSelected(false);
  };

  const handleSelectHeader = () => {
    setIsHeaderSelected(true);
    setSelectedQuestionId(null);
    setSelectedSectionId(null);
  };

  const handleDeleteQuestion = (qId: string) => {
    if (!paper) return;
    const sections = paper.sections.map((sec) => ({
      ...sec,
      questions: sec.questions.filter((q) => q.id !== qId),
    }));

    let counter = 1;
    sections.forEach((s) => {
      s.questions.forEach((q) => {
        q.number = counter++;
      });
    });

    handleUpdatePaper({ ...paper, sections });
    setSelectedQuestionId(null);
    success("Question removed from paper.");
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-xs font-semibold text-slate-500">Loading paper editor...</p>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Paper Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            The requested question paper does not exist or may have been deleted.
          </p>
          <Link
            href="/papers"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to My Papers</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden bg-slate-100 dark:bg-slate-900 transition-colors">
      {/* Top Design & Export Toolbar */}
      <DesignToolbar
        paper={paper}
        onUpdatePaper={handleUpdatePaper}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        isSaving={isSaving}
        showAnswerKey={showAnswerKey}
        onToggleAnswerKey={() => setShowAnswerKey(!showAnswerKey)}
        isFullEditMode={isFullEditMode}
        onToggleFullEditMode={() => setIsFullEditMode(!isFullEditMode)}
      />

      {/* Mobile Tab Switcher (< lg screens) */}
      <div className="lg:hidden flex items-center justify-around border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md px-2 py-1.5 z-20 shrink-0">
        <button
          type="button"
          onClick={() => setActiveMobileTab("canvas")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[38px] ${
            activeMobileTab === "canvas"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Paper View</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMobileTab("outline")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[38px] ${
            activeMobileTab === "outline"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Outline</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMobileTab("inspector")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[38px] ${
            activeMobileTab === "inspector"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Inspector</span>
          {selectedQuestionId && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Editor Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Pane: Outline (desktop: always visible, mobile: when outline tab active) */}
        <div
          className={`${
            activeMobileTab === "outline" ? "flex" : "hidden"
          } lg:flex w-full lg:w-80 h-full overflow-hidden shrink-0 z-10`}
        >
          <EditorSidebar
            paper={paper}
            selectedQuestionId={selectedQuestionId}
            selectedSectionId={selectedSectionId}
            onSelectQuestion={(qId) => {
              handleSelectQuestion(qId);
              // On mobile, keep in outline or allow quick inspection
            }}
            onSelectSection={handleSelectSection}
            onSelectHeader={handleSelectHeader}
            onUpdatePaper={handleUpdatePaper}
          />
        </div>

        {/* Center Pane: Realistic Paginated Canvas (desktop: always visible, mobile: when canvas tab active) */}
        <main
          className={`${
            activeMobileTab === "canvas" ? "flex" : "hidden"
          } lg:flex flex-1 overflow-y-auto p-2 sm:p-6 justify-center bg-slate-200/60 dark:bg-slate-950/40 w-full`}
        >
          <PagedPaperView
            paper={paper}
            selectedQuestionId={selectedQuestionId}
            selectedSectionId={selectedSectionId}
            onSelectQuestion={(qId) => {
              handleSelectQuestion(qId);
            }}
            onSelectSection={handleSelectSection}
            onSelectHeader={handleSelectHeader}
            showAnswerKey={showAnswerKey}
            isFullEditMode={isFullEditMode}
            onToggleFullEditMode={() => setIsFullEditMode(!isFullEditMode)}
            onUpdatePaper={handleUpdatePaper}
          />
        </main>

        {/* Right Pane: Element Inspector (desktop: always visible, mobile: when inspector tab active) */}
        <div
          className={`${
            activeMobileTab === "inspector" ? "flex" : "hidden"
          } lg:flex w-full lg:w-84 h-full overflow-hidden shrink-0 z-10`}
        >
          <ElementInspector
            paper={paper}
            selectedQuestionId={selectedQuestionId}
            selectedSectionId={selectedSectionId}
            isHeaderSelected={isHeaderSelected}
            onUpdatePaper={handleUpdatePaper}
            onDeleteQuestion={handleDeleteQuestion}
          />
        </div>
      </div>
    </div>
  );
}
