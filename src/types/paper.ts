export type QuestionType =
  | "mcq"
  | "multiple_select"
  | "true_false"
  | "fill_in_blanks"
  | "very_short_answer"
  | "short_answer"
  | "long_answer"
  | "numerical"
  | "case_study"
  | "assertion_reason"
  | "match_the_following"
  | "custom";

export type DifficultyLevel = "easy" | "medium" | "hard" | "mixed";

export type LanguageOption = "english" | "hindi" | "bilingual";

export type PaperSize = "A4" | "A5" | "letter" | "legal";

export type PageNumberPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right" | "none";

export interface QuestionOption {
  id: string;
  label: string; // e.g. "A", "B", "C", "D"
  text: string;
  hindiText?: string;
}

export interface MatchPair {
  left: string;
  right: string;
}

export interface Question {
  id: string;
  number?: number;
  question: string;
  hindiQuestion?: string;
  hindiText?: string;
  type: QuestionType;
  marks: number;
  difficulty: DifficultyLevel;
  topic?: string;
  chapter?: string;
  options?: QuestionOption[];
  answer?: string; // Correct option or subjective answer key
  explanation?: string;
  assertion?: string;
  reason?: string;
  matchPairs?: MatchPair[];
  caseText?: string;
  customTypeLabel?: string;
}

export interface Section {
  id: string;
  title: string;
  hindiTitle?: string;
  instructions?: string;
  hindiInstructions?: string;
  marksPerQuestion?: number;
  totalMarks?: number;
  questions: Question[];
}

export interface HeaderConfig {
  institutionName: string;
  hindiInstitutionName?: string;
  examName: string;
  hindiExamName?: string;
  subject: string;
  hindiSubject?: string;
  className: string;
  durationMinutes: number;
  totalMarks: number;
  logoUrl?: string;
  academicYear?: string;
  paperCode?: string;
  generalInstructions: string[];
}

export interface FooterConfig {
  text?: string;
  pageNumberPosition: PageNumberPosition;
  showDate?: boolean;
}

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  opacity: number; // 0.05 to 0.3
  fontSize: number; // in pt/px
  rotation: number; // degrees, e.g. -45
}

export interface MarginsConfig {
  top: number; // in mm
  bottom: number;
  left: number;
  right: number;
}

export type PaperFontFamily = "Inter" | "Arial" | "Times New Roman" | "Georgia" | "Noto Sans" | "Noto Serif" | "Kruti Dev 010" | string;

export interface StylingConfig {
  paperSize: PaperSize;
  fontFamily: PaperFontFamily;
  fontSize: number; // base font size in pt, e.g. 11
  lineHeight: number; // e.g. 1.4
  questionSpacing: number; // in mm/pt
  sectionSpacing: number; // in mm/pt
  margins: MarginsConfig;
  watermark: WatermarkConfig;
}

export interface QuestionPaper {
  id: string;
  title: string;
  subject: string;
  className: string;
  examType: string;
  language: LanguageOption;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "generated" | "published";
  header: HeaderConfig;
  footer: FooterConfig;
  styling: StylingConfig;
  sections: Section[];
  includeAnswerKey: boolean;
  sourceDocumentIds?: string[];
}

export interface TopicItem {
  id: string;
  name: string;
  selected: boolean;
  concepts?: string[];
}

export interface ChapterItem {
  id: string;
  name: string;
  selected: boolean;
  topics: TopicItem[];
}

export interface DocumentMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  pageCount: number;
  language: string;
  detectedSubject: string;
  detectedClass?: string;
  chapters: ChapterItem[];
  keyConcepts: string[];
  extractedText: string;
  uploadedAt: string;
}

export interface PaperGenerationConfig {
  documentId?: string;
  extractedContentSummary?: string;
  subject: string;
  className: string;
  examType: string;
  language: LanguageOption;
  durationMinutes: number;
  totalMarks: number;
  questionCount: number;
  difficulty: DifficultyLevel;
  questionTypes: QuestionType[];
  selectedChapters: {
    chapterName: string;
    topics: string[];
  }[];
  customInstructions?: string;
  advancedOptions: {
    avoidDuplicates: boolean;
    balanceChapterCoverage: boolean;
    balanceDifficulty: boolean;
    preferImportantConcepts: boolean;
    generateAnswerKey: boolean;
    generateExplanations: boolean;
    allowExternalKnowledge: boolean;
    strictSourceOnly: boolean;
  };
}

export type AIProviderName = "gemini" | "openai" | "anthropic" | "groq" | "openrouter" | "custom";

export interface AIProviderConfig {
  id: string;
  provider: AIProviderName;
  name: string;
  apiKey: string;
  baseUrl?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface ExamTemplate {
  id: string;
  name: string;
  description: string;
  category: "School" | "Board Exam" | "College/University" | "Competitive Exam" | "Entrance Exam" | "Custom";
  header: Partial<HeaderConfig>;
  styling: Partial<StylingConfig>;
  defaultInstructions: string[];
  sectionStructure: {
    title: string;
    instructions: string;
    defaultQuestionType: QuestionType;
    defaultMarksPerQuestion: number;
    questionCount: number;
  }[];
}
