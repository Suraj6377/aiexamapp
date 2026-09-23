import { AIProviderConfig, ExamTemplate, QuestionPaper } from "@/types/paper";
import { DEFAULT_TEMPLATES } from "./templates/defaultTemplates";
import fs from "fs";
import path from "path";
import os from "os";

// Determine a safe writable storage directory:
// 1. Try local `./data` (standard local development)
// 2. If `./data` cannot be written to or is read-only (e.g. Vercel, Netlify, AWS Lambda), fallback to `os.tmpdir()/ai_study_data`
function getSafeDataDir(): string {
  if (typeof window !== "undefined") return "";

  // 1. Try local ./data first
  try {
    const localDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const testFile = path.join(localDir, `.write_test_${Date.now()}`);
    fs.writeFileSync(testFile, "ok", "utf8");
    fs.unlinkSync(testFile);
    return localDir;
  } catch {
    // Read-only filesystem (Vercel, Netlify, Lambda)
    try {
      const tmpDir = path.join(os.tmpdir(), "ai_study_data");
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      return tmpDir;
    } catch {
      return os.tmpdir();
    }
  }
}

let activeDataDir: string | null = null;
function getDataDir(): string {
  if (!activeDataDir) {
    activeDataDir = getSafeDataDir();
  }
  return activeDataDir;
}

function getFilePath(filename: string): string {
  const dir = getDataDir();
  return dir ? path.join(/*turbopackIgnore: true*/ dir, filename) : "";
}

function safeReadFile(filename: string): string | null {
  try {
    const p = getFilePath(filename);
    if (p && fs.existsSync(p)) {
      return fs.readFileSync(p, "utf8");
    }
  } catch {}
  return null;
}

function safeWriteFile(filename: string, content: string): boolean {
  try {
    const p = getFilePath(filename);
    if (p) {
      fs.writeFileSync(p, content, "utf8");
      return true;
    }
  } catch {
    try {
      const fallbackPath = path.join(os.tmpdir(), filename);
      fs.writeFileSync(fallbackPath, content, "utf8");
      return true;
    } catch {}
  }
  return false;
}

// Initial Sample Papers for immediate out-of-the-box exploration
const SEED_PAPERS: QuestionPaper[] = [
  {
    id: "paper_cbse_phy_2026",
    title: "Class 12 Physics Final Board Examination",
    subject: "Physics",
    className: "Class 12",
    examType: "Board Exam",
    language: "bilingual",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: "published",
    includeAnswerKey: true,
    header: {
      institutionName: "DELHI PUBLIC SCHOOL, R.K. PURAM",
      hindiInstitutionName: "दिल्ली पब्लिक स्कूल, आर.के. पुरम",
      examName: "ALL INDIA SENIOR SECONDARY PRE-BOARD EXAMINATION",
      hindiExamName: "अखिल भारतीय उच्चतर माध्यमिक प्री-बोर्ड परीक्षा",
      subject: "PHYSICS (THEORY)",
      hindiSubject: "भौतिक विज्ञान (सैद्धांतिक)",
      className: "Class XII",
      durationMinutes: 180,
      totalMarks: 70,
      paperCode: "PH-XII-2026/A",
      generalInstructions: [
        "All questions are compulsory. There are 18 questions in all.",
        "This question paper has four sections: Section A, Section B, Section C and Section D.",
        "Section A contains 8 multiple choice questions of 1 mark each.",
        "Section B contains 5 short answer questions of 2 marks each.",
        "Section C contains 3 short answer questions of 3 marks each.",
        "Section D contains 2 long answer questions of 5 marks each.",
        "You may use physical constants: c = 3 x 10^8 m/s, h = 6.63 x 10^-34 J s, e = 1.6 x 10^-19 C.",
      ],
    },
    footer: {
      text: "Page 1 of 3 | Examination Paper",
      pageNumberPosition: "bottom-center",
      showDate: true,
    },
    styling: {
      paperSize: "A4",
      fontFamily: "Times New Roman",
      fontSize: 11,
      lineHeight: 1.4,
      questionSpacing: 10,
      sectionSpacing: 16,
      margins: { top: 15, bottom: 15, left: 16, right: 16 },
      watermark: { enabled: true, text: "SAMPLE PAPER", opacity: 0.08, fontSize: 48, rotation: -40 },
    },
    sections: [
      {
        id: "sec_a",
        title: "SECTION A (Objective Type)",
        hindiTitle: "खंड क (वस्तुनिष्ठ प्रश्न)",
        instructions: "Questions 1 to 8 carry 1 mark each. Choose the single correct option.",
        hindiInstructions: "प्रश्न 1 से 8 तक प्रत्येक 1 अंक का है। सही विकल्प का चयन करें।",
        marksPerQuestion: 1,
        questions: [
          {
            id: "q1",
            number: 1,
            question: "A parallel plate capacitor is charged and then isolated from the battery. If a dielectric slab is inserted between the plates, what happens to the electric field between the plates?",
            hindiQuestion: "एक समांतर पट्टिका संधारित्र को आवेशित किया जाता है और फिर बैटरी से अलग कर दिया जाता है। यदि प्लेटों के बीच एक परावैद्युत पट्टिका डाली जाती है, तो प्लेटों के बीच विद्युत क्षेत्र का क्या होता है?",
            type: "mcq",
            marks: 1,
            difficulty: "easy",
            topic: "Electrostatics",
            chapter: "Electrostatic Potential and Capacitance",
            options: [
              { id: "opt_1", label: "A", text: "Increases by factor K", hindiText: "K के कारक से बढ़ता है" },
              { id: "opt_2", label: "B", text: "Decreases by factor K", hindiText: "K के कारक से घटता है" },
              { id: "opt_3", label: "C", text: "Remains unchanged", hindiText: "अपरिवर्तित रहता है" },
              { id: "opt_4", label: "D", text: "Becomes zero", hindiText: "शून्य हो जाता है" },
            ],
            answer: "B",
            explanation: "Since the capacitor is isolated, charge Q remains constant. The dielectric reduces the net electric field: E = E0 / K.",
          },
          {
            id: "q2",
            number: 2,
            question: "An alternating voltage V = 200 sin(100π t) is applied to a resistor of 50 Ω. The root mean square (rms) current in the circuit is:",
            hindiQuestion: "50 Ω के प्रतिरोधक पर एक प्रत्यावर्ती वोल्टता V = 200 sin(100π t) लागू की जाती है। परिपथ में वर्ग माध्य मूल (rms) धारा है:",
            type: "mcq",
            marks: 1,
            difficulty: "medium",
            topic: "Alternating Current",
            chapter: "Electromagnetic Induction and AC",
            options: [
              { id: "opt_1", label: "A", text: "4 A", hindiText: "4 A" },
              { id: "opt_2", label: "B", text: "2.83 A", hindiText: "2.83 A" },
              { id: "opt_3", label: "C", text: "2 A", hindiText: "2 A" },
              { id: "opt_4", label: "D", text: "5.66 A", hindiText: "5.66 A" },
            ],
            answer: "B",
            explanation: "V_rms = V0 / sqrt(2) = 200 / 1.414 = 141.4 V. Then I_rms = V_rms / R = 141.4 / 50 = 2.83 A.",
          },
        ],
      },
      {
        id: "sec_b",
        title: "SECTION B (Short Answer Type I)",
        hindiTitle: "खंड ख (लघु उत्तरीय प्रश्न प्रकार I)",
        instructions: "Questions 3 to 5 carry 2 marks each.",
        hindiInstructions: "प्रश्न 3 से 5 तक प्रत्येक 2 अंक का है।",
        marksPerQuestion: 2,
        questions: [
          {
            id: "q3",
            number: 3,
            question: "State Gauss's Law in electrostatics. Write its mathematical expression and mention any one practical application.",
            hindiQuestion: "स्थिरवैद्युतिकी में गॉस के नियम का उल्लेख कीजिए। इसका गणितीय व्यंजक लिखिए और कोई एक व्यावहारिक अनुप्रयोग बताइए।",
            type: "short_answer",
            marks: 2,
            difficulty: "easy",
            topic: "Gauss Law",
            chapter: "Electric Charges and Fields",
            answer: "Gauss's law states that total electric flux through a closed surface is equal to 1/ε0 times the net charge enclosed: ∮ E·dA = q_enc / ε0. Application: Calculating field of an infinite line charge.",
            explanation: "1 mark for statement and equation, 1 mark for correct application.",
          },
          {
            id: "q4",
            number: 4,
            question: "Two thin lenses of focal lengths +20 cm and -40 cm are placed in contact. Find the power and nature of the combination.",
            hindiQuestion: "फोकस दूरी +20 सेमी और -40 सेमी के दो पतले लेंस संपर्क में रखे गए हैं। संयोजन की क्षमता और प्रकृति ज्ञात कीजिए।",
            type: "numerical",
            marks: 2,
            difficulty: "medium",
            topic: "Ray Optics",
            chapter: "Ray Optics and Optical Instruments",
            answer: "1/F = 1/f1 + 1/f2 = 1/20 - 1/40 = 1/40 cm. F = +40 cm = 0.4 m. Power P = 1/0.4 = +2.5 Diopters. Nature: Converging (Convex).",
            explanation: "1 mark for focal length calculation, 1 mark for power in diopters with sign and converging nature.",
          },
        ],
      },
    ],
  },
];

const DEFAULT_AI_CONFIGS: AIProviderConfig[] = [
  {
    id: "cfg_gemini",
    provider: "gemini",
    name: "Google Gemini",
    apiKey: process.env.GEMINI_API_KEY || "",
    model: "gemini-2.0-flash",
    temperature: 0.3,
    maxTokens: 8192,
    isDefault: true,
    isActive: true,
  },
  {
    id: "cfg_openai",
    provider: "openai",
    name: "OpenAI",
    apiKey: process.env.OPENAI_API_KEY || "",
    model: "gpt-4o-mini",
    temperature: 0.3,
    maxTokens: 4096,
    isDefault: false,
    isActive: false,
  },
  {
    id: "cfg_anthropic",
    provider: "anthropic",
    name: "Anthropic Claude",
    apiKey: process.env.ANTHROPIC_API_KEY || "",
    model: "claude-3-5-sonnet-20241022",
    temperature: 0.3,
    maxTokens: 4096,
    isDefault: false,
    isActive: false,
  },
  {
    id: "cfg_groq",
    provider: "groq",
    name: "Groq (Fast Inference)",
    apiKey: process.env.GROQ_API_KEY || "",
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    maxTokens: 4096,
    isDefault: false,
    isActive: false,
  },
  {
    id: "cfg_openrouter",
    provider: "openrouter",
    name: "OpenRouter",
    apiKey: process.env.OPENROUTER_API_KEY || "",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "anthropic/claude-3.5-sonnet",
    temperature: 0.3,
    maxTokens: 4096,
    isDefault: false,
    isActive: false,
  },
];

// In-memory cache for fast local responses and serverless resilience
let cachedPapers: QuestionPaper[] | null = null;
let cachedTemplates: ExamTemplate[] | null = null;
let cachedConfigs: AIProviderConfig[] | null = null;

export const StorageService = {
  // Papers
  getPapers(): QuestionPaper[] {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("ai_study_papers");
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
      return SEED_PAPERS;
    }

    if (cachedPapers && cachedPapers.length > 0) return cachedPapers;

    const raw = safeReadFile("papers.json");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedPapers = parsed;
          return cachedPapers;
        }
      } catch {}
    }

    cachedPapers = [...SEED_PAPERS];
    safeWriteFile("papers.json", JSON.stringify(cachedPapers, null, 2));
    return cachedPapers;
  },

  getPaperById(id: string): QuestionPaper | null {
    const papers = this.getPapers();
    return papers.find((p) => p.id === id) || null;
  },

  savePaper(paper: QuestionPaper): void {
    const papers = this.getPapers();
    const index = papers.findIndex((p) => p.id === paper.id);
    if (index >= 0) {
      papers[index] = { ...paper, updatedAt: new Date().toISOString() };
    } else {
      papers.unshift({ ...paper, updatedAt: new Date().toISOString() });
    }

    cachedPapers = papers;

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ai_study_papers", JSON.stringify(papers));
      } catch {}
    } else {
      safeWriteFile("papers.json", JSON.stringify(papers, null, 2));
    }
  },

  deletePaper(id: string): boolean {
    let papers = this.getPapers();
    const initialLen = papers.length;
    papers = papers.filter((p) => p.id !== id);
    cachedPapers = papers;

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ai_study_papers", JSON.stringify(papers));
      } catch {}
    } else {
      safeWriteFile("papers.json", JSON.stringify(papers, null, 2));
    }
    return papers.length < initialLen;
  },

  // Templates
  getTemplates(): ExamTemplate[] {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("ai_study_templates");
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
      return DEFAULT_TEMPLATES;
    }

    if (cachedTemplates && cachedTemplates.length > 0) return cachedTemplates;

    const raw = safeReadFile("templates.json");
    if (raw) {
      try {
        const parsed: ExamTemplate[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with DEFAULT_TEMPLATES so built-in templates are never missing
          const existingIds = new Set(parsed.map((t) => t.id));
          const missingDefaults = DEFAULT_TEMPLATES.filter((dt) => !existingIds.has(dt.id));
          cachedTemplates = [...parsed, ...missingDefaults];
          return cachedTemplates;
        }
      } catch {}
    }

    cachedTemplates = [...DEFAULT_TEMPLATES];
    safeWriteFile("templates.json", JSON.stringify(DEFAULT_TEMPLATES, null, 2));
    return cachedTemplates;
  },

  saveTemplate(template: ExamTemplate): void {
    const templates = this.getTemplates();
    const idx = templates.findIndex((t) => t.id === template.id);
    if (idx >= 0) {
      templates[idx] = template;
    } else {
      templates.push(template);
    }

    cachedTemplates = templates;

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ai_study_templates", JSON.stringify(templates));
      } catch {}
    } else {
      safeWriteFile("templates.json", JSON.stringify(templates, null, 2));
    }
  },

  deleteTemplate(id: string): boolean {
    let templates = this.getTemplates();
    const initialLen = templates.length;
    templates = templates.filter((t) => t.id !== id);
    cachedTemplates = templates;

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ai_study_templates", JSON.stringify(templates));
      } catch {}
    } else {
      safeWriteFile("templates.json", JSON.stringify(templates, null, 2));
    }
    return templates.length < initialLen;
  },

  // AI Configurations
  getAIConfigs(): AIProviderConfig[] {
    const envDefaults = DEFAULT_AI_CONFIGS.map((cfg) => {
      let key = cfg.apiKey;
      if (!key) {
        if (cfg.provider === "gemini") key = process.env.GEMINI_API_KEY || "";
        if (cfg.provider === "openai") key = process.env.OPENAI_API_KEY || "";
        if (cfg.provider === "anthropic") key = process.env.ANTHROPIC_API_KEY || "";
        if (cfg.provider === "groq") key = process.env.GROQ_API_KEY || "";
        if (cfg.provider === "openrouter") key = process.env.OPENROUTER_API_KEY || "";
      }
      return { ...cfg, apiKey: key };
    });

    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("ai_study_configs");
        if (local) {
          const parsed: AIProviderConfig[] = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Ensure OpenRouter is present
            if (!parsed.some((c) => c.provider === "openrouter")) {
              const def = envDefaults.find((d) => d.provider === "openrouter");
              if (def) parsed.push(def);
            }
            return parsed;
          }
        }
      } catch {}
      return envDefaults;
    }

    if (cachedConfigs && cachedConfigs.length > 0) {
      // Augment with env variables if any config lacks a key
      return cachedConfigs.map((c) => {
        if (!c.apiKey) {
          const matchingDef = envDefaults.find((d) => d.id === c.id || d.provider === c.provider);
          if (matchingDef && matchingDef.apiKey) {
            return { ...c, apiKey: matchingDef.apiKey };
          }
        }
        return c;
      });
    }

    const raw = safeReadFile("ai_config.json");
    if (raw) {
      try {
        const parsed: AIProviderConfig[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (!parsed.some((c) => c.provider === "openrouter")) {
            const def = envDefaults.find((d) => d.provider === "openrouter");
            if (def) parsed.push(def);
          }
          cachedConfigs = parsed.map((c) => {
            if (!c.apiKey) {
              const matchingDef = envDefaults.find((d) => d.id === c.id || d.provider === c.provider);
              if (matchingDef && matchingDef.apiKey) {
                return { ...c, apiKey: matchingDef.apiKey };
              }
            }
            return c;
          });
          return cachedConfigs;
        }
      } catch {}
    }

    cachedConfigs = [...envDefaults];
    safeWriteFile("ai_config.json", JSON.stringify(envDefaults, null, 2));
    return cachedConfigs;
  },

  saveAIConfig(config: AIProviderConfig): void {
    const configs = this.getAIConfigs();
    const idx = configs.findIndex((c) => c.id === config.id);
    if (idx >= 0) {
      configs[idx] = config;
    } else {
      configs.push(config);
    }

    cachedConfigs = configs;

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ai_study_configs", JSON.stringify(configs));
      } catch {}
    } else {
      safeWriteFile("ai_config.json", JSON.stringify(configs, null, 2));
    }
  },
};
