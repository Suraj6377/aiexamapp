import { AIProviderConfig, DocumentMetadata, ExamTemplate, QuestionPaper } from "@/types/paper";
import { DEFAULT_TEMPLATES } from "./templates/defaultTemplates";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const PAPERS_FILE = path.join(DATA_DIR, "papers.json");
const TEMPLATES_FILE = path.join(DATA_DIR, "templates.json");
const AI_CONFIG_FILE = path.join(DATA_DIR, "ai_config.json");
const DOCUMENTS_FILE = path.join(DATA_DIR, "documents.json");

function ensureDataDir() {
  if (typeof window === "undefined") {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }
}

// 1. Initial Sample Papers for immediate out-of-the-box exploration
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

// In-memory cache for fast local responses
let cachedPapers: QuestionPaper[] | null = null;
let cachedTemplates: ExamTemplate[] | null = null;
let cachedConfigs: AIProviderConfig[] | null = null;

export const StorageService = {
  // Papers
  getPapers(): QuestionPaper[] {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("ai_study_papers");
        if (local) return JSON.parse(local);
      } catch {}
      return SEED_PAPERS;
    }

    ensureDataDir();
    if (cachedPapers) return cachedPapers;
    try {
      if (fs.existsSync(PAPERS_FILE)) {
        const raw = fs.readFileSync(PAPERS_FILE, "utf8");
        cachedPapers = JSON.parse(raw);
        return cachedPapers || [];
      }
    } catch {}
    cachedPapers = SEED_PAPERS;
    try {
      fs.writeFileSync(PAPERS_FILE, JSON.stringify(SEED_PAPERS, null, 2), "utf8");
    } catch {}
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

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ai_study_papers", JSON.stringify(papers));
      } catch {}
    } else {
      ensureDataDir();
      cachedPapers = papers;
      try {
        fs.writeFileSync(PAPERS_FILE, JSON.stringify(papers, null, 2), "utf8");
      } catch {}
    }
  },

  deletePaper(id: string): boolean {
    let papers = this.getPapers();
    const initialLen = papers.length;
    papers = papers.filter((p) => p.id !== id);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ai_study_papers", JSON.stringify(papers));
      } catch {}
    } else {
      ensureDataDir();
      cachedPapers = papers;
      try {
        fs.writeFileSync(PAPERS_FILE, JSON.stringify(papers, null, 2), "utf8");
      } catch {}
    }
    return papers.length < initialLen;
  },

  // Templates
  getTemplates(): ExamTemplate[] {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("ai_study_templates");
        if (local) return JSON.parse(local);
      } catch {}
      return DEFAULT_TEMPLATES;
    }

    ensureDataDir();
    if (cachedTemplates) return cachedTemplates;
    try {
      if (fs.existsSync(TEMPLATES_FILE)) {
        const raw = fs.readFileSync(TEMPLATES_FILE, "utf8");
        cachedTemplates = JSON.parse(raw);
        return cachedTemplates || [];
      }
    } catch {}
    cachedTemplates = DEFAULT_TEMPLATES;
    try {
      fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(DEFAULT_TEMPLATES, null, 2), "utf8");
    } catch {}
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
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ai_study_templates", JSON.stringify(templates));
      } catch {}
    } else {
      ensureDataDir();
      cachedTemplates = templates;
    }
  },

  deleteTemplate(id: string): boolean {
    let templates = this.getTemplates();
    const initialLen = templates.length;
    templates = templates.filter((t) => t.id !== id);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ai_study_templates", JSON.stringify(templates));
      } catch {}
    } else {
      ensureDataDir();
      cachedTemplates = templates;
      try {
        fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2), "utf8");
      } catch {}
    }
    return templates.length < initialLen;
  },

  // AI Configurations
  getAIConfigs(): AIProviderConfig[] {
    const defaults: AIProviderConfig[] = [
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

    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("ai_study_configs");
        if (local) {
          const parsed: AIProviderConfig[] = JSON.parse(local);
          // Ensure OpenRouter is present if older local storage didn't have it
          if (!parsed.some((c) => c.provider === "openrouter")) {
            parsed.push(defaults.find((d) => d.provider === "openrouter")!);
          }
          const geminiCfg = parsed.find((c) => c.provider === "gemini");
          if (geminiCfg && geminiCfg.model === "gemini-1.5-flash") {
            geminiCfg.model = "gemini-2.0-flash";
          }
          return parsed;
        }
      } catch {}
      return defaults;
    }

    ensureDataDir();
    if (cachedConfigs) return cachedConfigs;
    try {
      if (fs.existsSync(AI_CONFIG_FILE)) {
        const raw = fs.readFileSync(AI_CONFIG_FILE, "utf8");
        cachedConfigs = JSON.parse(raw);
        if (cachedConfigs && !cachedConfigs.some((c) => c.provider === "openrouter")) {
          cachedConfigs.push(defaults.find((d) => d.provider === "openrouter")!);
        }
        const geminiCfg = cachedConfigs?.find((c: any) => c.provider === "gemini");
        if (geminiCfg && geminiCfg.model === "gemini-1.5-flash") {
          geminiCfg.model = "gemini-2.0-flash";
        }
        return cachedConfigs || [];
      }
    } catch {}
    cachedConfigs = defaults;
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
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ai_study_configs", JSON.stringify(configs));
      } catch {}
    } else {
      ensureDataDir();
      cachedConfigs = configs;
      try {
        fs.writeFileSync(AI_CONFIG_FILE, JSON.stringify(configs, null, 2), "utf8");
      } catch {}
    }
  },
};
