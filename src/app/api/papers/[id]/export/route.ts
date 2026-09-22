import { NextRequest, NextResponse } from "next/server";
import { StorageService } from "@/lib/storage";
import { generateDocxBlob } from "@/lib/export/docxExporter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const searchParams = req.nextUrl.searchParams;
    const format = searchParams.get("format") || "docx";
    const includeAnswerKey = searchParams.get("answers") === "true";

    const paper = StorageService.getPaperById(id);
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    if (format === "docx") {
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

    return NextResponse.json({ error: "Unsupported export format" }, { status: 400 });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
