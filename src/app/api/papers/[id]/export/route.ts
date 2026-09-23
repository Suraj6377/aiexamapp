import { NextRequest, NextResponse } from "next/server";
import { StorageService } from "@/lib/storage";
import { generateDocxBlob } from "@/lib/export/docxExporter";
import { QuestionPaper } from "@/types/paper";
import { safeLogger } from "@/lib/logger";

export const dynamic = "force-dynamic";

async function createDocxResponse(paper: QuestionPaper, includeAnswerKey: boolean): Promise<NextResponse> {
  const blob = await generateDocxBlob(paper, includeAnswerKey);
  const buffer = Buffer.from(await blob.arrayBuffer());
  const cleanTitle = (paper.title || "Question_Paper").replace(/[^a-zA-Z0-9_\-]/g, "_");

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${cleanTitle}.docx"`,
    },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const searchParams = req.nextUrl.searchParams;
    const format = searchParams.get("format") || "docx";
    const includeAnswerKey = searchParams.get("answers") === "true";

    const paper = await StorageService.getPaperById(id);
    if (!paper) {
      safeLogger.warn("API:Export:GET", `Export requested for non-existent paper ${id}`);
      return NextResponse.json({ error: `Paper with ID "${id}" was not found.` }, { status: 404 });
    }

    if (format === "docx") {
      safeLogger.info("API:Export:GET", `Exporting DOCX for paper ${id} (answerKey=${includeAnswerKey})`);
      return createDocxResponse(paper, includeAnswerKey);
    }

    return NextResponse.json({ error: "Unsupported export format" }, { status: 400 });
  } catch (error: any) {
    safeLogger.error("API:Export:GET", error.message, error);
    return NextResponse.json({ error: error?.message || "DOCX generation failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const paper: QuestionPaper = body.paper;
    const includeAnswerKey = Boolean(body.answers);

    if (!paper) {
      // Fallback to storage lookup if not in body
      const loaded = await StorageService.getPaperById(id);
      if (!loaded) {
        return NextResponse.json({ error: `Paper with ID "${id}" was not found.` }, { status: 404 });
      }
      return createDocxResponse(loaded, includeAnswerKey);
    }

    safeLogger.info("API:Export:POST", `Direct DOCX compilation for paper ${paper.id || id}`);
    return createDocxResponse(paper, includeAnswerKey);
  } catch (error: any) {
    safeLogger.error("API:Export:POST", error.message, error);
    return NextResponse.json({ error: error?.message || "DOCX compilation failed" }, { status: 500 });
  }
}
