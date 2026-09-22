import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans, Noto_Serif } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { MobileNavProvider } from "@/components/providers/MobileNavProvider";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
});

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "AI Study - Production AI Question Paper Generator",
  description: "Generate grounded, curriculum-aligned academic question papers with live paginated editor and PDF/DOCX export.",
  applicationName: "AI Study",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI Study",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${notoSans.variable} ${notoSerif.variable}`}>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors antialiased">
        <ThemeProvider>
          <ToastProvider>
            <MobileNavProvider>
              <div className="flex min-h-screen w-full relative">
                <AppSidebar />
                <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-16 lg:pb-0">
                  {children}
                </div>
                <MobileNav />
              </div>
            </MobileNavProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
