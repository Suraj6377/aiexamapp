import { NextRequest, NextResponse } from "next/server";
import { PaperGenerationConfig, QuestionPaper } from "@/types/paper";
import { StorageService } from "@/lib/storage";
import { AIProviderRegistry } from "@/lib/ai/providers";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/promptBuilder";
import { extractAndRepairJSON } from "@/lib/ai/jsonRepair";
import { GeneratedPaperOutput, GeneratedPaperOutputSchema } from "@/lib/ai/schemas";
import { generateGroundedPaperFromDocument } from "@/lib/ai/providers/mockGrounded";
import { generateId } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const config: PaperGenerationConfig = body.config;
    const documentText: string = body.documentText || "";

    if (!config) {
      return NextResponse.json({ error: "Missing paper generation configuration" }, { status: 400 });
    }

    // Check for configured AI Provider
    const configs = StorageService.getAIConfigs();
    const activeConfig = configs.find((c) => c.isActive && c.apiKey.trim().length > 0) || null;

    let generatedOutput: GeneratedPaperOutput | null = null;
    let providerUsed = "Local Grounded Engine";

    if (activeConfig && activeConfig.apiKey) {
      try {
        providerUsed = activeConfig.name || activeConfig.provider;
        const systemPrompt = buildSystemPrompt(config);
        const userPrompt = buildUserPrompt(config, documentText);

        const rawAiResponse = await AIProviderRegistry.generate(activeConfig, userPrompt, systemPrompt);
        const repaired = extractAndRepairJSON<any>(rawAiResponse);
        const validated = GeneratedPaperOutputSchema.safeParse(repaired);

        if (validated.success) {
          generatedOutput = validated.data;
        } else {
          console.warn("AI output failed strict schema validation, falling back to grounded repair:", validated.error);
        }
      } catch (aiErr: any) {
        console.warn(`External AI generation failed (${activeConfig.provider}): ${aiErr.message}. Falling back to grounded generator.`);
      }
    }

    // Fallback to high-quality local grounded generator if no API key or if provider failed
    if (!generatedOutput) {
      generatedOutput = generateGroundedPaperFromDocument(config, documentText);
    }

    // Construct full QuestionPaper model
    const now = new Date().toISOString();
    const paperId = generateId("paper");

    // Assign sequential numbering to questions across sections
    let qCounter = 1;
    const structuredSections = generatedOutput.sections.map((sec, sIdx) => ({
      id: sec.id || `sec_${sIdx + 1}`,
      title: sec.title,
      hindiTitle: sec.hindiTitle,
      instructions: sec.instructions,
      hindiInstructions: sec.hindiInstructions,
      marksPerQuestion: sec.marksPerQuestion,
      questions: sec.questions.map((q) => ({
        ...q,
        id: q.id || `q_${qCounter}`,
        number: qCounter++,
      })),
    }));

    const calculatedTotalMarks = structuredSections.reduce(
      (acc, s) => acc + s.questions.reduce((qAcc, q) => qAcc + (q.marks || 0), 0),
      0
    );

    const questionPaper: QuestionPaper = {
      id: paperId,
      title: generatedOutput.paperTitle || `${config.subject} ${config.examType}`,
      subject: config.subject,
      className: config.className,
      examType: config.examType,
      language: config.language,
      createdAt: now,
      updatedAt: now,
      status: "generated",
      includeAnswerKey: config.advancedOptions.generateAnswerKey ?? true,
      header: {
        institutionName: "DELHI PUBLIC ACADEMY / EXAMINATION BOARD",
        hindiInstitutionName: "केंद्रीय माध्यमिक शिक्षा बोर्ड / परीक्षा परिषद",
        examName: config.examType.toUpperCase() + " EXAMINATION",
        hindiExamName: config.examType + " परीक्षा",
        subject: config.subject.toUpperCase(),
        hindiSubject: config.language === "hindi" || config.language === "bilingual" ? config.subject : undefined,
        className: config.className,
        durationMinutes: config.durationMinutes,
        totalMarks: config.totalMarks || calculatedTotalMarks,
        paperCode: `QP-${Math.floor(1000 + Math.random() * 9000)}/${new Date().getFullYear()}`,
        generalInstructions: generatedOutput.generalInstructions || [
          "All questions are compulsory.",
          "Read each question carefully before attempting.",
          "Write answers clearly with proper question numbering.",
        ],
      },
      footer: {
        text: `Examination Paper | ${config.subject}`,
        pageNumberPosition: "bottom-center",
        showDate: true,
      },
      styling: {
        paperSize: "A4",
        fontFamily: config.language === "hindi" ? "Noto Sans" : "Times New Roman",
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
    StorageService.savePaper(questionPaper);

    return NextResponse.json({
      success: true,
      paper: questionPaper,
      providerUsed,
    });
  } catch (error: any) {
    console.error("Paper generation failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate question paper" },
      { status: 500 }
    );
  }
}
