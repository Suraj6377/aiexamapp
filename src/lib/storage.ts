import { AIProviderConfig, ExamTemplate, QuestionPaper } from "@/types/paper";
import { DEFAULT_TEMPLATES } from "./templates/defaultTemplates";
import { safeLogger } from "./logger";
import fs from "fs";
import path from "path";
import os from "os";

// Baseline Seed Paper
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

// Baseline AI Configurations
const DEFAULT_AI_CONFIGS: AIProviderConfig[] = [
  {
    id: "cfg_gemini",
    provider: "gemini",
    name: "Google Gemini",
    apiKey: process.env.GEMINI_API_KEY || "",
    model: "gemini-3.8-flash",
    temperature: 0.3,
    maxTokens: 8192,
    isDefault: true,
    isActive: true,
    hasKey: true,
    isEnvConfigured: true,
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

function getEnvAIConfigs(): AIProviderConfig[] {
  return DEFAULT_AI_CONFIGS.map((cfg) => {
    let key = cfg.apiKey;
    if (!key) {
      if (cfg.provider === "gemini") key = process.env.GEMINI_API_KEY || "";
      if (cfg.provider === "openai") key = process.env.OPENAI_API_KEY || "";
      if (cfg.provider === "anthropic") key = process.env.ANTHROPIC_API_KEY || "";
      if (cfg.provider === "groq") key = process.env.GROQ_API_KEY || "";
      if (cfg.provider === "openrouter") key = process.env.OPENROUTER_API_KEY || "";
    }
    return {
      ...cfg,
      apiKey: key,
      hasKey: Boolean(key && key.trim().length > 0),
      isEnvConfigured: cfg.provider === "gemini" || Boolean(process.env[`${cfg.provider.toUpperCase()}_API_KEY`]),
    };
  });
}

/**
 * Storage Driver Interface
 */
export interface IStorageDriver {
  name: string;
  getPapers(): Promise<QuestionPaper[]>;
  getPaperById(id: string): Promise<QuestionPaper | null>;
  savePaper(paper: QuestionPaper): Promise<void>;
  deletePaper(id: string): Promise<boolean>;

  getTemplates(): Promise<ExamTemplate[]>;
  saveTemplate(template: ExamTemplate): Promise<void>;
  deleteTemplate(id: string): Promise<boolean>;

  getAIConfigs(): Promise<AIProviderConfig[]>;
  saveAIConfig(config: AIProviderConfig): Promise<void>;
}

/**
 * Driver 1: Vercel KV / Upstash Redis REST
 * Uses pure HTTP REST fetch over HTTPS with zero native dependencies.
 * Activated if KV_REST_API_URL or UPSTASH_REDIS_REST_URL is configured.
 */
class UpstashKvDriver implements IStorageDriver {
  name = "Vercel KV / Upstash Redis REST";
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url.replace(/\/+$/, "");
    this.token = token;
  }

  private async command(cmd: any[]): Promise<any> {
    try {
      const res = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(cmd),
        cache: "no-store",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const json = await res.json();
      return json.result;
    } catch (err: any) {
      safeLogger.error("StorageDriver:UpstashKV", `Command [${cmd[0]}] failed: ${err.message}`);
      throw err;
    }
  }

  async getPapers(): Promise<QuestionPaper[]> {
    try {
      const result = await this.command(["HVALS", "aiexam:papers"]);
      if (Array.isArray(result) && result.length > 0) {
        const papers = result.map((item) => (typeof item === "string" ? JSON.parse(item) : item));
        return papers;
      }
    } catch (err: any) {
      safeLogger.warn("StorageDriver:UpstashKV", `getPapers error: ${err.message}`);
    }
    return SEED_PAPERS;
  }

  async getPaperById(id: string): Promise<QuestionPaper | null> {
    try {
      const result = await this.command(["HGET", "aiexam:papers", id]);
      if (result) {
        return typeof result === "string" ? JSON.parse(result) : result;
      }
    } catch (err: any) {
      safeLogger.warn("StorageDriver:UpstashKV", `getPaperById error: ${err.message}`);
    }
    return SEED_PAPERS.find((p) => p.id === id) || null;
  }

  async savePaper(paper: QuestionPaper): Promise<void> {
    const updatedPaper = { ...paper, updatedAt: new Date().toISOString() };
    await this.command(["HSET", "aiexam:papers", paper.id, JSON.stringify(updatedPaper)]);
    safeLogger.info("StorageDriver:UpstashKV", `Saved paper ${paper.id}`);
  }

  async deletePaper(id: string): Promise<boolean> {
    const count = await this.command(["HDEL", "aiexam:papers", id]);
    return Number(count) > 0;
  }

  async getTemplates(): Promise<ExamTemplate[]> {
    try {
      const raw = await this.command(["GET", "aiexam:templates"]);
      if (raw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed) && parsed.length > 0) {
          const ids = new Set(parsed.map((t: any) => t.id));
          const missingDefaults = DEFAULT_TEMPLATES.filter((dt) => !ids.has(dt.id));
          return [...parsed, ...missingDefaults];
        }
      }
    } catch (err: any) {
      safeLogger.warn("StorageDriver:UpstashKV", `getTemplates error: ${err.message}`);
    }
    return DEFAULT_TEMPLATES;
  }

  async saveTemplate(template: ExamTemplate): Promise<void> {
    const current = await this.getTemplates();
    const idx = current.findIndex((t) => t.id === template.id);
    if (idx >= 0) {
      current[idx] = template;
    } else {
      current.push(template);
    }
    await this.command(["SET", "aiexam:templates", JSON.stringify(current)]);
    safeLogger.info("StorageDriver:UpstashKV", `Saved template ${template.id}`);
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const current = await this.getTemplates();
    const filtered = current.filter((t) => t.id !== id);
    if (filtered.length < current.length) {
      await this.command(["SET", "aiexam:templates", JSON.stringify(filtered)]);
      return true;
    }
    return false;
  }

  async getAIConfigs(): Promise<AIProviderConfig[]> {
    const envDefaults = getEnvAIConfigs();
    try {
      const raw = await this.command(["GET", "aiexam:ai_configs"]);
      if (raw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c: AIProviderConfig) => {
            if (!c.apiKey) {
              const def = envDefaults.find((d) => d.id === c.id || d.provider === c.provider);
              if (def?.apiKey) return { ...c, apiKey: def.apiKey };
            }
            return c;
          });
        }
      }
    } catch (err: any) {
      safeLogger.warn("StorageDriver:UpstashKV", `getAIConfigs error: ${err.message}`);
    }
    return envDefaults;
  }

  async saveAIConfig(config: AIProviderConfig): Promise<void> {
    const current = await this.getAIConfigs();
    const idx = current.findIndex((c) => c.id === config.id);
    if (idx >= 0) {
      current[idx] = config;
    } else {
      current.push(config);
    }
    await this.command(["SET", "aiexam:ai_configs", JSON.stringify(current)]);
    safeLogger.info("StorageDriver:UpstashKV", `Saved AI config ${config.id} (${config.name})`);
  }
}

/**
 * Driver 2: Local & Ephemeral Fallback
 * Used in local development or when external database variables are not set.
 * Uses safe try-catch on disk and in-memory cache to guarantee zero crashes on Vercel.
 */
class LocalFallbackDriver implements IStorageDriver {
  name = "Local / Serverless Memory & Temp Storage";
  private papers: QuestionPaper[] = [...SEED_PAPERS];
  private templates: ExamTemplate[] = [...DEFAULT_TEMPLATES];
  private aiConfigs: AIProviderConfig[] = getEnvAIConfigs();
  private dataDir: string | null = null;

  constructor() {
    this.initDataDir();
  }

  private initDataDir() {
    if (typeof window !== "undefined") return;
    try {
      const localDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      const test = path.join(localDir, `.write_test_${Date.now()}`);
      fs.writeFileSync(test, "ok", "utf8");
      fs.unlinkSync(test);
      this.dataDir = localDir;
    } catch {
      try {
        const tmp = path.join(os.tmpdir(), "ai_study_data");
        if (!fs.existsSync(tmp)) {
          fs.mkdirSync(tmp, { recursive: true });
        }
        this.dataDir = tmp;
      } catch {
        this.dataDir = os.tmpdir();
      }
    }
  }

  private safeRead(filename: string): string | null {
    if (!this.dataDir) return null;
    try {
      const p = path.join(/*turbopackIgnore: true*/ this.dataDir, filename);
      if (fs.existsSync(p)) return fs.readFileSync(p, "utf8");
    } catch {}
    return null;
  }

  private safeWrite(filename: string, content: string): void {
    if (!this.dataDir) return;
    try {
      const p = path.join(/*turbopackIgnore: true*/ this.dataDir, filename);
      fs.writeFileSync(p, content, "utf8");
    } catch {}
  }

  async getPapers(): Promise<QuestionPaper[]> {
    const raw = this.safeRead("papers.json");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.papers = parsed;
          return this.papers;
        }
      } catch {}
    }
    return this.papers;
  }

  async getPaperById(id: string): Promise<QuestionPaper | null> {
    const papers = await this.getPapers();
    return papers.find((p) => p.id === id) || null;
  }

  async savePaper(paper: QuestionPaper): Promise<void> {
    const papers = await this.getPapers();
    const idx = papers.findIndex((p) => p.id === paper.id);
    const updated = { ...paper, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      papers[idx] = updated;
    } else {
      papers.unshift(updated);
    }
    this.papers = papers;
    this.safeWrite("papers.json", JSON.stringify(papers, null, 2));
  }

  async deletePaper(id: string): Promise<boolean> {
    const papers = await this.getPapers();
    const initialLen = papers.length;
    this.papers = papers.filter((p) => p.id !== id);
    this.safeWrite("papers.json", JSON.stringify(this.papers, null, 2));
    return this.papers.length < initialLen;
  }

  async getTemplates(): Promise<ExamTemplate[]> {
    const raw = this.safeRead("templates.json");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const ids = new Set(parsed.map((t: any) => t.id));
          const missingDefaults = DEFAULT_TEMPLATES.filter((dt) => !ids.has(dt.id));
          this.templates = [...parsed, ...missingDefaults];
          return this.templates;
        }
      } catch {}
    }
    return this.templates;
  }

  async saveTemplate(template: ExamTemplate): Promise<void> {
    const templates = await this.getTemplates();
    const idx = templates.findIndex((t) => t.id === template.id);
    if (idx >= 0) {
      templates[idx] = template;
    } else {
      templates.push(template);
    }
    this.templates = templates;
    this.safeWrite("templates.json", JSON.stringify(templates, null, 2));
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const templates = await this.getTemplates();
    const initialLen = templates.length;
    this.templates = templates.filter((t) => t.id !== id);
    this.safeWrite("templates.json", JSON.stringify(this.templates, null, 2));
    return this.templates.length < initialLen;
  }

  async getAIConfigs(): Promise<AIProviderConfig[]> {
    const envDefaults = getEnvAIConfigs();
    const raw = this.safeRead("ai_config.json");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.aiConfigs = parsed.map((c: AIProviderConfig) => {
            if (!c.apiKey) {
              const def = envDefaults.find((d) => d.id === c.id || d.provider === c.provider);
              if (def?.apiKey) return { ...c, apiKey: def.apiKey };
            }
            return c;
          });
          return this.aiConfigs;
        }
      } catch {}
    }
    this.aiConfigs = envDefaults;
    return this.aiConfigs;
  }

  async saveAIConfig(config: AIProviderConfig): Promise<void> {
    const configs = await this.getAIConfigs();
    const idx = configs.findIndex((c) => c.id === config.id);
    if (idx >= 0) {
      configs[idx] = config;
    } else {
      configs.push(config);
    }
    this.aiConfigs = configs;
    this.safeWrite("ai_config.json", JSON.stringify(configs, null, 2));
  }
}

/**
 * Storage Service Factory
 * Selects the optimal production driver dynamically based on environment variables:
 * 1. Upstash Redis / Vercel KV REST (KV_REST_API_URL or UPSTASH_REDIS_REST_URL)
 * 2. Local Fallback Driver (with safe /tmp fallback on Vercel)
 */
let activeDriverInstance: IStorageDriver | null = null;

function getStorageDriver(): IStorageDriver {
  if (activeDriverInstance) return activeDriverInstance;

  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (kvUrl && kvToken) {
    safeLogger.info("StorageService", "Active storage driver: Vercel KV / Upstash Redis REST");
    activeDriverInstance = new UpstashKvDriver(kvUrl, kvToken);
    return activeDriverInstance;
  }

  safeLogger.warn(
    "StorageService",
    "Active storage driver: Local / Serverless Memory Fallback. For full multi-instance persistence in Vercel production, configure KV_REST_API_URL and KV_REST_API_TOKEN."
  );
  activeDriverInstance = new LocalFallbackDriver();
  return activeDriverInstance;
}

/**
 * Public Storage API
 */
export const StorageService = {
  async getPapers(): Promise<QuestionPaper[]> {
    return getStorageDriver().getPapers();
  },

  async getPaperById(id: string): Promise<QuestionPaper | null> {
    return getStorageDriver().getPaperById(id);
  },

  async savePaper(paper: QuestionPaper): Promise<void> {
    return getStorageDriver().savePaper(paper);
  },

  async deletePaper(id: string): Promise<boolean> {
    return getStorageDriver().deletePaper(id);
  },

  async getTemplates(): Promise<ExamTemplate[]> {
    return getStorageDriver().getTemplates();
  },

  async saveTemplate(template: ExamTemplate): Promise<void> {
    return getStorageDriver().saveTemplate(template);
  },

  async deleteTemplate(id: string): Promise<boolean> {
    return getStorageDriver().deleteTemplate(id);
  },

  async getAIConfigs(): Promise<AIProviderConfig[]> {
    return getStorageDriver().getAIConfigs();
  },

  async saveAIConfig(config: AIProviderConfig): Promise<void> {
    return getStorageDriver().saveAIConfig(config);
  },
};
