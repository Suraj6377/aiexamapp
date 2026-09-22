"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopHeader } from "@/components/layout/TopHeader";
import { QuestionPaper } from "@/types/paper";
import {
  FileText,
  Search,
  Plus,
  Calendar,
  Award,
  Layers,
  MoreVertical,
  Edit3,
  Copy,
  Trash2,
  Printer,
  FileSpreadsheet,
  Download,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { formatDate, calculateTotalMarks, calculateTotalQuestions } from "@/lib/utils";
import { useToast } from "@/components/providers/ToastProvider";
import { triggerPaperPrint } from "@/lib/export/pdfExporter";

export default function MyPapersPage() {
  const router = useRouter();
  const { success, error, info } = useToast();

  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedExamType, setSelectedExamType] = useState("all");

  const [renamePaperId, setRenamePaperId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const loadPapers = async () => {
    try {
      const res = await fetch("/api/papers");
      const data = await res.json();
      setPapers(data.papers || []);
    } catch (err: any) {
      error("Failed to load papers library");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPapers();
  }, []);

  // Filter papers
  const filteredPapers = papers.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.className.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject = selectedSubject === "all" || p.subject.toLowerCase() === selectedSubject.toLowerCase();
    const matchesType = selectedExamType === "all" || p.examType.toLowerCase() === selectedExamType.toLowerCase();

    return matchesSearch && matchesSubject && matchesType;
  });

  const subjects = Array.from(new Set(papers.map((p) => p.subject).filter(Boolean)));
  const examTypes = Array.from(new Set(papers.map((p) => p.examType).filter(Boolean)));

  const handleDuplicate = async (paper: QuestionPaper) => {
    try {
      const duplicated: QuestionPaper = {
        ...paper,
        id: "paper_" + Math.random().toString(36).substring(2, 9),
        title: `${paper.title} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = await fetch("/api/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicated),
      });

      if (!res.ok) throw new Error("Failed to duplicate paper");
      success("Paper duplicated successfully!");
      loadPapers();
    } catch (err: any) {
      error(err.message || "Failed to duplicate");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this paper?")) return;
    try {
      const res = await fetch(`/api/papers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete paper");
      success("Paper deleted.");
      setPapers((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      error(err.message || "Failed to delete");
    }
  };

  const handleSaveRename = async (paper: QuestionPaper) => {
    if (!renameValue.trim()) return;
    try {
      const updated = { ...paper, title: renameValue.trim() };
      const res = await fetch(`/api/papers/${paper.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("Failed to rename paper");
      success("Paper renamed!");
      setRenamePaperId(null);
      loadPapers();
    } catch (err: any) {
      error(err.message || "Failed to rename");
    }
  };

  const handleDownloadDocx = async (paper: QuestionPaper) => {
    try {
      info("Downloading Word (.docx) document...", "Export");
      const res = await fetch(`/api/papers/${paper.id}/export?format=docx`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(paper.title || "paper").replace(/[^a-zA-Z0-9_\-]/g, "_")}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      success("DOCX downloaded!");
    } catch (err: any) {
      error(err.message || "Download failed");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopHeader
        title="My Question Papers"
        subtitle="Manage, duplicate, edit and export generated examination papers"
      />

      <div className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto space-y-5 sm:space-y-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, subject, or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[40px]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Subject filter */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none min-h-[40px]"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Exam Type filter */}
            <select
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none min-h-[40px]"
            >
              <option value="all">All Types</option>
              {examTypes.map((et) => (
                <option key={et} value={et}>{et}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Papers Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs font-medium text-slate-500">Loading your paper library...</p>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">No question papers found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              {searchQuery ? "No papers matched your search criteria." : "Start by creating your first AI-generated question paper."}
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20 hover:bg-indigo-500 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Question Paper</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPapers.map((paper) => {
              const qCount = calculateTotalQuestions(paper.sections);
              const marks = calculateTotalMarks(paper.sections);

              return (
                <div
                  key={paper.id}
                  className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-5 space-y-3">
                    {/* Header badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40">
                        {paper.subject}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {paper.className}
                      </span>
                    </div>

                    {/* Title or Rename input */}
                    {renamePaperId === paper.id ? (
                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg border border-indigo-500 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRename(paper)}
                          className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setRenamePaperId(null)}
                          className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 text-[10px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <Link href={`/editor/${paper.id}`}>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition leading-snug line-clamp-2">
                          {paper.title}
                        </h4>
                      </Link>
                    )}

                    {/* Stats pills */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <div className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{qCount} Questions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>{marks} Marks</span>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span>Updated {formatDate(paper.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
                    <Link
                      href={`/editor/${paper.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Paper</span>
                    </Link>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDownloadDocx(paper)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition"
                        title="Download DOCX"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRenamePaperId(paper.id);
                          setRenameValue(paper.title);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                        title="Rename"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(paper)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(paper.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
