import { z } from "zod";

export const QuestionOptionSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 7)),
  label: z.string(),
  text: z.string(),
  hindiText: z.string().optional(),
});

export const MatchPairSchema = z.object({
  left: z.string(),
  right: z.string(),
});

export const GeneratedQuestionSchema = z.object({
  id: z.string().default(() => "q_" + Math.random().toString(36).substring(2, 8)),
  number: z.number().optional(),
  question: z.string().min(1, "Question text cannot be empty"),
  hindiQuestion: z.string().optional(),
  type: z.enum([
    "mcq",
    "multiple_select",
    "true_false",
    "fill_in_blanks",
    "very_short_answer",
    "short_answer",
    "long_answer",
    "numerical",
    "case_study",
    "assertion_reason",
    "match_the_following",
    "custom",
  ]).default("mcq"),
  marks: z.number().min(0.5).default(1),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]).default("medium"),
  topic: z.string().optional(),
  chapter: z.string().optional(),
  options: z.array(QuestionOptionSchema).optional(),
  answer: z.string().optional().default(""),
  explanation: z.string().optional(),
  assertion: z.string().optional(),
  reason: z.string().optional(),
  matchPairs: z.array(MatchPairSchema).optional(),
  caseText: z.string().optional(),
});

export const GeneratedSectionSchema = z.object({
  id: z.string().default(() => "sec_" + Math.random().toString(36).substring(2, 8)),
  title: z.string().min(1, "Section title is required"),
  hindiTitle: z.string().optional(),
  instructions: z.string().optional(),
  hindiInstructions: z.string().optional(),
  marksPerQuestion: z.number().optional(),
  questions: z.array(GeneratedQuestionSchema).min(1, "Section must contain at least one question"),
});

export const GeneratedPaperOutputSchema = z.object({
  paperTitle: z.string().default("Question Paper"),
  subject: z.string().default("General"),
  class: z.string().default("General"),
  durationMinutes: z.number().default(180),
  totalMarks: z.number().default(100),
  generalInstructions: z.array(z.string()).default([
    "All questions are compulsory.",
    "Read each question carefully before answering.",
    "Marks for each question are indicated against it."
  ]),
  sections: z.array(GeneratedSectionSchema).min(1, "At least one section must be generated"),
});

export type GeneratedPaperOutput = z.infer<typeof GeneratedPaperOutputSchema>;
