"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  PlusCircle,
  FolderOpen,
  LayoutTemplate,
  Menu,
} from "lucide-react";
import { useMobileNav } from "../providers/MobileNavProvider";

export function MobileNav() {
  const pathname = usePathname();
  const { toggleSidebar, isSidebarOpen } = useMobileNav();

  // Hide mobile bottom nav inside full screen editor to maximize editing space
  if (pathname.startsWith("/editor/")) {
    return null;
  }

  const navItems = [
    { name: "Home", href: "/", icon: FileText },
    { name: "Papers", href: "/papers", icon: FolderOpen },
    { name: "Create", href: "/create", icon: PlusCircle, isPrimary: true },
    { name: "Templates", href: "/templates", icon: LayoutTemplate },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 px-3 shadow-lg"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          if (item.isPrimary) {
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center -mt-5 group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 active:scale-95 transition-transform">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                  {item.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors min-w-[56px] ${
                isActive
                  ? "text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-1">{item.name}</span>
            </Link>
          );
        })}

        {/* More Menu Drawer Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle full menu"
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors min-w-[56px] ${
            isSidebarOpen
              ? "text-indigo-600 dark:text-indigo-400 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Menu</span>
        </button>
      </div>
    </nav>
  );
}
