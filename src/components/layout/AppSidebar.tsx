"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  PlusCircle,
  FolderOpen,
  LayoutTemplate,
  Cpu,
  Settings,
  Sparkles,
  BookOpen,
  Sun,
  Moon,
  Palette,
  X,
} from "lucide-react";
import { useTheme } from "../providers/ThemeProvider";
import { useMobileNav } from "../providers/MobileNavProvider";

export function AppSidebar() {
  const pathname = usePathname();
  const { theme, setTheme, toggleTheme } = useTheme();
  const { isSidebarOpen, closeSidebar } = useMobileNav();

  const navigation = [
    { name: "Dashboard", href: "/", icon: FileText },
    { name: "Create Paper", href: "/create", icon: PlusCircle, badge: "AI" },
    { name: "My Papers", href: "/papers", icon: FolderOpen },
    { name: "Templates", href: "/templates", icon: LayoutTemplate },
    { name: "AI Providers", href: "/settings/ai", icon: Cpu },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 select-none">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
        <Link
          href="/"
          onClick={closeSidebar}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-base leading-tight tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              AI Study
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Exam Paper Generator</p>
          </div>
        </Link>

        {/* Close button on mobile */}
        <button
          type="button"
          onClick={closeSidebar}
          aria-label="Close navigation"
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Core Platform
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={closeSidebar}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-900/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-4 h-4 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow-xs">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Workflow Guide */}
        <div className="pt-4 px-1 sm:px-3">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-sky-500/5 to-purple-500/5 dark:from-indigo-950/20 dark:to-slate-900/40 border border-indigo-100/80 dark:border-indigo-900/30">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Pipeline Flow</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Upload & OCR PDF/Docs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                <span>Select Grounded Topics</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Generate Structured JSON</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>Edit Live & Export DOCX/PDF</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer & Mode Switcher */}
      <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800/60 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="w-full space-y-1.5">
          <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-slate-400">
            <span>Theme</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {theme === "artistic" ? "Artistic Study" : theme}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setTheme("light")}
              title="Light Theme"
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                theme === "light"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              title="Dark Theme"
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                theme === "dark"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-200"
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dark</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme("artistic")}
              title="Artistic Study Theme (Parchment & Antique Amber)"
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                theme === "artistic"
                  ? "bg-amber-100 text-amber-900 font-bold shadow-xs border border-amber-300"
                  : "text-slate-500 hover:text-amber-800"
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-amber-600" />
              <span>Study</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar (lg screens and up) */}
      <aside className="hidden lg:flex w-64 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex-col shrink-0 min-h-screen select-none transition-colors">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (visible when isSidebarOpen is true on < lg screens) */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          onClick={closeSidebar}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        />

        {/* Sliding Panel */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-[280px] max-w-[85vw] shadow-2xl z-10 transform transition-transform duration-300 ease-out ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  );
}
