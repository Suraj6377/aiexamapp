"use client";

import React, { useState } from "react";
import { TopHeader } from "@/components/layout/TopHeader";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useToast } from "@/components/providers/ToastProvider";
import {
  School,
  Sun,
  Moon,
  Palette,
  Save,
  CheckCircle2,
  Database,
  ShieldAlert,
} from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { success } = useToast();

  const [institutionName, setInstitutionName] = useState("DELHI PUBLIC ACADEMY");
  const [defaultClass, setDefaultClass] = useState("Class 12");
  const [defaultDuration, setDefaultDuration] = useState(180);
  const [defaultPaperSize, setDefaultPaperSize] = useState("A4");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    success("Institution defaults saved successfully!");
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TopHeader
        title="Settings & Preferences"
        subtitle="Manage default exam branding, storage connections, and user interface preferences"
      />

      <div className="flex-1 p-3 sm:p-6 max-w-4xl w-full mx-auto space-y-5 sm:space-y-6">
        <form onSubmit={handleSave} className="space-y-5 sm:space-y-6">
          {/* Institution Defaults */}
          <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 sm:space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <School className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Institution Profile</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Default header branding for newly generated question papers</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Institution / School Name
                </label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Grade / Standard
                </label>
                <input
                  type="text"
                  value={defaultClass}
                  onChange={(e) => setDefaultClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={defaultDuration}
                  onChange={(e) => setDefaultDuration(parseInt(e.target.value) || 60)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Paper Format
                </label>
                <select
                  value={defaultPaperSize}
                  onChange={(e) => setDefaultPaperSize(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="A4">A4 (210 x 297 mm)</option>
                  <option value="A5">A5 Booklet</option>
                  <option value="letter">US Letter</option>
                  <option value="legal">Legal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Theme Settings */}
          <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Interface Theme</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Choose your preferred workspace aesthetic for drafting and reviewing exam papers</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition min-h-[44px] ${
                  theme === "light"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light Theme</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition min-h-[44px] ${
                  theme === "dark"
                    ? "border-indigo-500 bg-indigo-950/60 text-white ring-2 ring-indigo-500 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Dark Theme</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("artistic")}
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition min-h-[44px] ${
                  theme === "artistic"
                    ? "border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-50/40"
                }`}
              >
                <Palette className="w-4 h-4 text-amber-600" />
                <span>Artistic Study</span>
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition active:scale-98 min-h-[44px]"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
