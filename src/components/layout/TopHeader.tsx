"use client";

import React from "react";
import Link from "next/link";
import { Plus, ShieldCheck, Menu } from "lucide-react";
import { useMobileNav } from "../providers/MobileNavProvider";

interface TopHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function TopHeader({ title = "Dashboard", subtitle, actions }: TopHeaderProps) {
  const { toggleSidebar } = useMobileNav();

  return (
    <header className="min-h-16 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger Menu Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate hidden xs:block sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
        {actions || (
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Grounded Engine</span>
            </div>
            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all active:scale-95 min-h-[38px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xxs:inline">Create Paper</span>
              <span className="xxs:hidden">Create</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
