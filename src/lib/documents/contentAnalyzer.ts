import { ChapterItem, DocumentMetadata, TopicItem } from "@/types/paper";
import { generateId } from "../utils";

export interface AnalysisResult {
  language: string;
  detectedSubject: string;
  detectedClass?: string;
  chapters: ChapterItem[];
  keyConcepts: string[];
  pageCount: number;
}

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  "Physics": ["velocity", "acceleration", "force", "gravity", "thermodynamics", "optics", "quantum", "electromagnetism", "current", "voltage", "wave", "newton", "energy", "momentum"],
  "Chemistry": ["reaction", "molecule", "atom", "periodic", "bond", "acid", "base", "solution", "organic", "polymer", "equilibrium", "enthalpy", "compound", "catalyst"],
  "Mathematics": ["equation", "polynomial", "integral", "derivative", "matrix", "geometry", "trigonometry", "probability", "theorem", "logarithm", "function", "vector", "calculus"],
  "Biology": ["cell", "dna", "genetics", "organism", "ecosystem", "respiration", "photosynthesis", "enzyme", "tissue", "evolution", "species", "nervous", "circulation"],
  "Computer Science": ["algorithm", "data structure", "function", "variable", "binary", "database", "sql", "network", "object", "class", "compiler", "recursion", "array"],
  "History": ["empire", "revolution", "dynasty", "treaty", "colonial", "monarchy", "civilization", "independence", "war", "medieval", "ancient", "constitution"],
  "Geography": ["climate", "plateau", "river", "agriculture", "monsoon", "crust", "latitude", "longitude", "atmosphere", "topography", "ecosystem", "glacier"],
  "Economics": ["inflation", "gdp", "demand", "supply", "market", "monetary", "fiscal", "elasticity", "capital", "revenue", "trade", "banking", "microeconomics"],
};

export function analyzeDocumentContent(text: string, fileName?: string): AnalysisResult {
  const normalized = text.toLowerCase();

  // 1. Detect Language
  let language = "English";
  const hindiMatches = text.match(/[\u0900-\u097F]/g);
  const totalLetters = text.match(/[a-zA-Z]/g);

  if (hindiMatches && hindiMatches.length > 50) {
    if (totalLetters && totalLetters.length > 50) {
      language = "Bilingual (English / Hindi)";
    } else {
      language = "Hindi";
    }
  }

  // 2. Detect Subject
  let detectedSubject = "General Studies";
  let maxScore = 0;

  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, "gi");
      const matches = text.match(regex);
      if (matches) score += matches.length;
    }
    if (score > maxScore) {
      maxScore = score;
      detectedSubject = subject;
    }
  }

  // Fallback check from fileName
  if (fileName) {
    const fnLower = fileName.toLowerCase();
    for (const subject of Object.keys(SUBJECT_KEYWORDS)) {
      if (fnLower.includes(subject.toLowerCase())) {
        detectedSubject = subject;
        break;
      }
    }
  }

  // 3. Detect Class / Grade
  let detectedClass = "Class 12";
  const classMatch = text.match(/(?:class|grade|standard|std)\s*[:\-]?\s*(\d{1,2}|undergraduate|postgraduate)/i);
  if (classMatch && classMatch[1]) {
    detectedClass = `Class ${classMatch[1]}`;
  }

  // 4. Detect Chapters and Topics
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const chapters: ChapterItem[] = [];
  let currentChapter: ChapterItem | null = null;

  const chapterHeadingRegex = /^(?:chapter|unit|module|lesson|section|part)\s*(\d+|[ivxlcdm]+|[a-z])\s*[:\-.]?\s*(.*)$/i;

  for (const line of lines) {
    const chapMatch = chapterHeadingRegex.exec(line);
    if (chapMatch) {
      const name = line.length < 80 ? line : `Chapter ${chapMatch[1]}: ${chapMatch[2].slice(0, 50)}`;
      currentChapter = {
        id: generateId("chap"),
        name,
        selected: true,
        topics: [],
      };
      chapters.push(currentChapter);
      continue;
    }

    // Detect Subtopics
    const topicHeadingRegex = /^(?:\d+\.\d+|\([a-z]\)|[•\-\*])\s+([A-Za-z0-9\s,\-]{4,60})$/;
    const topicMatch = topicHeadingRegex.exec(line);
    if (topicMatch && currentChapter && currentChapter.topics.length < 8) {
      const topicName = topicMatch[1].trim();
      if (!currentChapter.topics.some((t) => t.name.toLowerCase() === topicName.toLowerCase())) {
        currentChapter.topics.push({
          id: generateId("top"),
          name: topicName,
          selected: true,
        });
      }
    }
  }

  // If no explicit chapters found via regex, construct smart logical chapters
  if (chapters.length === 0) {
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 50);
    const numChapters = Math.max(1, Math.min(4, Math.ceil(paragraphs.length / 3)));

    for (let i = 0; i < numChapters; i++) {
      const sampleText = paragraphs[i * 2] || "";
      const firstLine = sampleText.split("\n")[0]?.replace(/[^a-zA-Z0-9\s]/g, "").slice(0, 40).trim() || `Core Principles Part ${i + 1}`;

      const generatedTopics: TopicItem[] = [];
      const keywordsInChunk = (paragraphs[i * 2] || "").split(/\s+/).filter((w) => w.length > 5).slice(0, 3);

      keywordsInChunk.forEach((kw) => {
        const cleanKw = kw.replace(/[^a-zA-Z]/g, "");
        if (cleanKw.length > 4) {
          generatedTopics.push({
            id: generateId("top"),
            name: `${cleanKw.charAt(0).toUpperCase() + cleanKw.slice(1)} Analysis`,
            selected: true,
          });
        }
      });

      if (generatedTopics.length === 0) {
        generatedTopics.push(
          { id: generateId("top"), name: "Definitions and Axioms", selected: true },
          { id: generateId("top"), name: "Applications & Properties", selected: true }
        );
      }

      chapters.push({
        id: generateId("chap"),
        name: `Chapter ${i + 1}: ${firstLine}`,
        selected: true,
        topics: generatedTopics,
      });
    }
  }

  // 5. Extract Key Concepts
  const words = text
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 5 && !/^(the|this|that|these|those|which|where|when|their|about|could|should|would|between)$/i.test(w));

  const frequencyMap: Record<string, number> = {};
  for (const w of words) {
    const lower = w.toLowerCase();
    frequencyMap[lower] = (frequencyMap[lower] || 0) + 1;
  }

  const keyConcepts = Object.entries(frequencyMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

  // Estimate page count (roughly 300 words per page)
  const totalWords = text.trim().split(/\s+/).length;
  const pageCount = Math.max(1, Math.ceil(totalWords / 280));

  return {
    language,
    detectedSubject,
    detectedClass,
    chapters,
    keyConcepts,
    pageCount,
  };
}
