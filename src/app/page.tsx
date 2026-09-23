"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { TopHeader } from "@/components/layout/TopHeader";
import { QuestionPaper } from "@/types/paper";
import {
  FileText,
  PlusCircle,
  FolderOpen,
  LayoutTemplate,
  Sparkles,
  ArrowRight,
  Award,
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  FileSpreadsheet,
  Cpu,
  BookOpen,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { formatDate, calculateTotalMarks, calculateTotalQuestions } from "@/lib/utils";

export default function DashboardPage() {
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      // 1. Initial hydration from localStorage
      try {
        const local = localStorage.getItem("ai_study_papers");
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPapers(parsed);
          }
        }
      } catch {}

      // 2. Fetch from server API
      try {
        const res = await fetch("/api/papers");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.papers) && data.papers.length > 0) {
            setPapers(data.papers);
            try {
              localStorage.setItem("ai_study_papers", JSON.stringify(data.papers));
            } catch {}
          }
        }
      } catch (err) {
        console.warn("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const totalQuestions = papers.reduce(
    (acc, p) => acc + calculateTotalQuestions(p.sections),
    0
  );

  const totalMarks = papers.reduce(
    (acc, p) => acc + calculateTotalMarks(p.sections),
    0
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopHeader
        title="AI Exam Studio Dashboard"
        subtitle="Production-grade AI Question Paper Generator grounded in your curriculum notes and syllabus"
      />

      <div className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8">
        {/* Hero Banner with Pipeline Flow */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-5 sm:p-8 shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Grounded Academic Engine 2.0</span>
            </div>

            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              Create curriculum-accurate question papers in seconds.
            </h2>

            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
              Upload PDF syllabus or scanned notes. Our AI analyzes chapters, detects topics, and constructs structured examination papers ready for live paginated editing and PDF/Word export.
            </p>

            <div className="pt-2 flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              <Link
                href="/create"
                className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-2xl bg-white text-indigo-950 font-bold text-xs shadow-lg hover:bg-indigo-50 transition active:scale-98 min-h-[44px]"
              >
                <PlusCircle className="w-4 h-4 text-indigo-600" />
                <span>Generate New Paper</span>
              </Link>

              <Link
                href="/templates"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition min-h-[44px]"
              >
                <LayoutTemplate className="w-4 h-4" />
                <span>Browse Board Templates</span>
              </Link>
            </div>
          </div>

          {/* Decorative Background Glows */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
          <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-indigo-500/30 blur-3xl pointer-events-none" />
        </div>

        {/* Pipeline Stepper Visualization */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Intelligent Creation Pipeline
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { num: "01", title: "Upload", desc: "PDF, Images, OCR" },
              { num: "02", title: "Analyze", desc: "Detect chapters & topics" },
              { num: "03", title: "Configure", desc: "Exam type, marks, duration" },
              { num: "04", title: "Generate", desc: "Strict grounded JSON" },
              { num: "05", title: "Edit", desc: "Live paginated A4 canvas" },
              { num: "06", title: "Export", desc: "Print PDF & Word DOCX" },
            ].map((step, idx) => (
              <div
                key={step.num}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col justify-between"
              >
                <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">
                  STEP {step.num}
                </span>
                <div className="mt-2">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {step.title}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {step.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>Total Papers</span>
              <FileText className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {papers.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Ready in library</p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>Questions Authored</span>
              <Layers className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {totalQuestions}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">MCQs, Short & Long questions</p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>Total Marks Evaluated</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {totalMarks}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Across all assessments</p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>AI Provider Status</span>
              <Cpu className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Grounded Ready</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Zero hallucination mode</p>
          </div>
        </div>

        {/* Recent Papers Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Question Papers</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Continue editing or export existing papers</p>
            </div>
            <Link
              href="/papers"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View All Papers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {papers.slice(0, 3).map((paper) => (
              <div
                key={paper.id}
                className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-indigo-400 transition flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40">
                      {paper.subject}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {paper.className}
                    </span>
                  </div>

                  <Link href={`/editor/${paper.id}`}>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition line-clamp-1">
                      {paper.title}
                    </h4>
                  </Link>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{calculateTotalQuestions(paper.sections)} Questions</span>
                    <span>•</span>
                    <span>{calculateTotalMarks(paper.sections)} Marks</span>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {formatDate(paper.updatedAt)}
                  </span>

                  <Link
                    href={`/editor/${paper.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <span>Open Editor</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
