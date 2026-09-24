import { NextRequest, NextResponse } from "next/server";
import { AIProviderConfig, PaperGenerationConfig, QuestionPaper } from "@/types/paper";
import { StorageService } from "@/lib/storage";
import { AIProviderRegistry } from "@/lib/ai/providers";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/promptBuilder";
import { extractAndRepairJSON } from "@/lib/ai/jsonRepair";
import { GeneratedPaperOutput, GeneratedPaperOutputSchema } from "@/lib/ai/schemas";
import { generateGroundedPaperFromDocument } from "@/lib/ai/providers/mockGrounded";
import { generateId } from "@/lib/utils";
import { safeLogger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const config: PaperGenerationConfig = body.config;
    const documentText: string = body.documentText || "";

    if (!config) {
      return NextResponse.json({ error: "Missing paper generation configuration" }, { status: 400 });
    }

    // Resolve AI configuration from client request or persistent storage
    const serverConfigs = await StorageService.getAIConfigs();

    let activeConfig: AIProviderConfig | null = null;

    if (body.aiConfig && body.aiConfig.provider) {
      activeConfig = body.aiConfig;
    } else {
      activeConfig = serverConfigs.find((c) => c.isActive && c.apiKey && c.apiKey.trim().length > 0) || null;
    }

    // Resolve unmasked API key
    if (activeConfig) {
      let realKey = activeConfig.apiKey;
      if (!realKey || realKey.includes("••••")) {
        const matched = serverConfigs.find(
          (c) => c.id === activeConfig!.id || c.provider === activeConfig!.provider
        );
        if (matched?.apiKey && !matched.apiKey.includes("••••")) {
          realKey = matched.apiKey;
        }
      }

      // Check environment variables as fallback
      if (!realKey) {
        if (activeConfig.provider === "gemini") realKey = process.env.GEMINI_API_KEY || "";
        if (activeConfig.provider === "openai") realKey = process.env.OPENAI_API_KEY || "";
        if (activeConfig.provider === "anthropic") realKey = process.env.ANTHROPIC_API_KEY || "";
        if (activeConfig.provider === "groq") realKey = process.env.GROQ_API_KEY || "";
        if (activeConfig.provider === "openrouter") realKey = process.env.OPENROUTER_API_KEY || "";
      }

      activeConfig = { ...activeConfig, apiKey: realKey };
    }

    let generatedOutput: GeneratedPaperOutput | null = null;
    let providerUsed = "Local Grounded Engine";

    const hasExternalKey = Boolean(activeConfig?.apiKey && activeConfig.apiKey.trim().length > 0);

    if (activeConfig && hasExternalKey) {
      providerUsed = activeConfig.name || activeConfig.provider;
      safeLogger.info("PaperGeneration", `Invoking AI provider ${providerUsed} (model: ${activeConfig.model})`);

      try {
        const systemPrompt = buildSystemPrompt(config);
        const userPrompt = buildUserPrompt(config, documentText);

        const rawAiResponse = await AIProviderRegistry.generate(activeConfig, userPrompt, systemPrompt);
        const repaired = extractAndRepairJSON<any>(rawAiResponse);
        const validated = GeneratedPaperOutputSchema.safeParse(repaired);

        if (validated.success) {
          generatedOutput = validated.data;
          safeLogger.info("PaperGeneration", `Successfully received structured response from ${providerUsed}`);
        } else {
          safeLogger.warn("PaperGeneration", `AI output schema mismatch from ${providerUsed}: ${validated.error.message}`);
          throw new Error(`AI model returned output that could not be parsed into a valid paper structure. Detail: ${validated.error.issues[0]?.message || "Format error"}`);
        }
      } catch (aiErr: any) {
        safeLogger.warn("PaperGeneration", `AI provider ${providerUsed} temporarily unavailable (${aiErr.message}). Automatically falling back to high-fidelity Grounded Engine.`);
        try {
          generatedOutput = generateGroundedPaperFromDocument(config, documentText);
          providerUsed = `${providerUsed} (Grounded Fallback)`;
          safeLogger.info("PaperGeneration", `Successfully synthesized grounded paper questions via fallback engine.`);
        } catch (groundedErr: any) {
          safeLogger.error("PaperGeneration", `Both AI and Grounded Engine failed: ${groundedErr.message}`, groundedErr);
          return NextResponse.json(
            {
              error: `${providerUsed} failed: ${aiErr.message}. Please check your API key, model selection, or network settings in Settings > AI Providers.`,
            },
            { status: 502 }
          );
        }
      }
    } else {
      // Grounded engine when no external key is configured
      safeLogger.info("PaperGeneration", "No external AI key configured; synthesizing grounded paper from document text");
      generatedOutput = generateGroundedPaperFromDocument(config, documentText);
    }

    if (!generatedOutput) {
      return NextResponse.json(
        { error: "Generation engine was unable to synthesize examination paper questions." },
        { status: 500 }
      );
    }

    // Construct full QuestionPaper model
    const now = new Date().toISOString();
    const paperId = generateId("paper");

    // Assign sequential numbering to questions across sections
    let qCounter = 1;
    const structuredSections = generatedOutput.sections.map((sec, secIdx) => ({
      id: `sec_${secIdx + 1}`,
      title: sec.title,
      hindiTitle: sec.hindiTitle,
      instructions: sec.instructions,
      hindiInstructions: sec.hindiInstructions,
      marksPerQuestion: sec.marksPerQuestion || 1,
      questions: sec.questions.map((q, qIdx) => ({
        id: `q_${secIdx + 1}_${qIdx + 1}`,
        number: qCounter++,
        question: q.question,
        hindiQuestion: q.hindiQuestion,
        type: q.type,
        marks: q.marks,
        difficulty: q.difficulty || "medium",
        topic: q.topic || "Core Syllabus",
        chapter: q.chapter || "Unit Assessment",
        options: q.options?.map((opt, optIdx) => ({
          id: `opt_${optIdx + 1}`,
          label: opt.label,
          text: opt.text,
          hindiText: opt.hindiText,
        })),
        answer: q.answer,
        explanation: q.explanation,
        assertion: q.assertion,
        reason: q.reason,
        matchPairs: q.matchPairs,
        caseText: q.caseText,
      })),
    }));

    const questionPaper: QuestionPaper = {
      id: paperId,
      title: generatedOutput.paperTitle || `${config.subject} Examination Paper`,
      subject: config.subject,
      className: config.className,
      examType: config.examType,
      language: config.language,
      status: "draft",
      includeAnswerKey: config.advancedOptions?.generateAnswerKey ?? true,
      createdAt: now,
      updatedAt: now,
      header: {
        institutionName: "CENTRAL BOARD OF EDUCATION",
        examName: generatedOutput.paperTitle || `${config.examType} - ${config.subject}`,
        subject: config.subject,
        className: config.className,
        durationMinutes: generatedOutput.durationMinutes || config.durationMinutes,
        totalMarks: generatedOutput.totalMarks || config.totalMarks,
        paperCode: `EX-${new Date().getFullYear()}`,
        generalInstructions: generatedOutput.generalInstructions || [
          "All questions are compulsory.",
          "Read each question carefully before answering.",
          "Marks for each question are indicated against it.",
        ],
      },
      footer: {
        text: `${config.subject} • ${config.className} • Examination Paper`,
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
        watermark: {
          enabled: false,
          text: "CONFIDENTIAL",
          opacity: 0.08,
          fontSize: 48,
          rotation: -45,
        },
      },
      sections: structuredSections,
    };

    // Save to persistent storage
    await StorageService.savePaper(questionPaper);
    safeLogger.info("PaperGeneration", `Saved newly generated paper ${questionPaper.id} to storage`);

    return NextResponse.json({
      success: true,
      paper: questionPaper,
      providerUsed,
    });
  } catch (error: any) {
    safeLogger.error("PaperGeneration", `Paper generation fatal error: ${error?.message}`, error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate question paper" },
      { status: 500 }
    );
  }
}
