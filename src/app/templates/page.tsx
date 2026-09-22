"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopHeader } from "@/components/layout/TopHeader";
import { ExamTemplate } from "@/types/paper";
import {
  LayoutTemplate,
  CheckCircle2,
  Clock,
  Award,
  Layers,
  Sparkles,
  ArrowRight,
  Plus,
  Loader2,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { CreateTemplateModal } from "@/components/templates/CreateTemplateModal";

export default function TemplatesPage() {
  const router = useRouter();
  const { success, error, info } = useToast();

  const [templates, setTemplates] = useState<ExamTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err) {
      error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const categories = ["all", "Board Exam", "College/University", "School", "Competitive Exam", "Custom"];

  const filtered = templates.filter(
    (t) => selectedCategory === "all" || t.category === selectedCategory
  );

  const handleUseTemplate = (tpl: ExamTemplate) => {
    success(`Selected "${tpl.name}" framework!`);
    router.push(`/create`);
  };

  const handleDeleteTemplate = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete custom template "${name}"?`)) return;

    setDeletingId(id);
    try {
      const res = await fetch("/api/templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete template");
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      success(`Template "${name}" deleted.`);
    } catch (err: any) {
      error(err.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTemplateCreated = (newTpl: ExamTemplate) => {
    setTemplates((prev) => [newTpl, ...prev]);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopHeader
        title="Examination Templates"
        subtitle="Standardized institutional frameworks for CBSE, University, School, and Custom paper blueprints"
      />

      <div className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto space-y-5 sm:space-y-6">
        {/* Actions Bar: Categories + Create Custom Template Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-bold capitalize transition shrink-0 min-h-[40px] ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {cat === "all" ? "All Templates" : cat}
              </button>
            ))}
          </div>

          {/* Create Custom Template CTA */}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition active:scale-98 shrink-0 min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Template</span>
          </button>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs font-semibold text-slate-500">Loading templates...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {filtered.map((tpl) => {
              const isCustom = tpl.id.startsWith("tpl_custom") || tpl.category === "Custom";
              const isDeleting = deletingId === tpl.id;

              return (
                <div
                  key={tpl.id}
                  className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-600 transition"
                >
                  <div className="space-y-4">
                    {/* Category and Name */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 uppercase tracking-wider">
                            {tpl.category}
                          </span>
                          {isCustom && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                              CUSTOM
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5 text-sky-500" />
                          <span>{tpl.header.durationMinutes || 180} Mins</span>
                          <Award className="w-3.5 h-3.5 text-amber-500 ml-1" />
                          <span>{tpl.header.totalMarks || 100} Marks</span>
                        </div>
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {tpl.name}
                        </h3>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTemplate(e, tpl.id, tpl.name)}
                            disabled={isDeleting}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
                            title="Delete Custom Template"
                          >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-rose-500" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>

                    {/* Section structure preview */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Standard Section Layout ({tpl.sectionStructure?.length || 0} Sections)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {tpl.sectionStructure.map((sec, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                          >
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {sec.title}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              {sec.questionCount} Questions • {sec.defaultMarksPerQuestion}M each
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* General rules preview */}
                    {tpl.header.generalInstructions && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                        Includes {tpl.header.generalInstructions.length} standardized instructions.
                      </div>
                    )}
                  </div>

                  {/* Apply button */}
                  <div className="pt-4 sm:pt-6 mt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      onClick={() => handleUseTemplate(tpl)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all active:scale-98 min-h-[44px]"
                    >
                      <span>Use This Template</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Custom Template Modal */}
      <CreateTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTemplateCreated={handleTemplateCreated}
      />
    </div>
  );
}
