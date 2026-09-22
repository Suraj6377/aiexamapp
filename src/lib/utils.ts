import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { QuestionPaper, Section } from "@/types/paper";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

export function formatDuration(minutes: number): string {
  if (!minutes) return "0 mins";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs} hr ${mins} mins`;
  if (hrs > 0) return `${hrs} hr${hrs > 1 ? "s" : ""}`;
  return `${mins} mins`;
}

export function calculateTotalMarks(sections: Section[]): number {
  return sections.reduce((secTotal, section) => {
    const questionsSum = section.questions.reduce((qTotal, q) => qTotal + (q.marks || 0), 0);
    return secTotal + questionsSum;
  }, 0);
}

export function calculateTotalQuestions(sections: Section[]): number {
  return sections.reduce((acc, sec) => acc + (sec.questions?.length || 0), 0);
}

export function getDifficultyBadgeColor(diff: string): string {
  switch (diff?.toLowerCase()) {
    case "easy":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    case "medium":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "hard":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    default:
      return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20";
  }
}

export function getQuestionTypeLabel(type: string): string {
  const map: Record<string, string> = {
    mcq: "Multiple Choice (MCQ)",
    multiple_select: "Multiple Select",
    true_false: "True / False",
    fill_in_blanks: "Fill in the Blanks",
    very_short_answer: "Very Short Answer (VSA)",
    short_answer: "Short Answer (SA)",
    long_answer: "Long Answer (LA)",
    numerical: "Numerical Problem",
    case_study: "Case Study / Passage",
    assertion_reason: "Assertion & Reason",
    match_the_following: "Match the Following",
    custom: "Custom Question",
  };
  return map[type] || type.toUpperCase();
}
