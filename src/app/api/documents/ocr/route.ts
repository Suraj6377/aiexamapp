import { NextRequest, NextResponse } from "next/server";
import { performOcr } from "@/lib/documents/ocrService";
import { analyzeDocumentContent } from "@/lib/documents/contentAnalyzer";
import { generateId } from "@/lib/utils";
import { safeLogger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const base64 = formData.get("base64") as string | null;

    let text = "";
    let fileName = "Scanned Image";

    if (file) {
      fileName = file.name;
      safeLogger.info("OCR:API", `Processing OCR for file: ${fileName} (${file.size} bytes)`);
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      text = await performOcr(buffer);
    } else if (base64) {
      safeLogger.info("OCR:API", `Processing OCR for base64 payload`);
      text = await performOcr(base64);
    } else {
      return NextResponse.json({ error: "No image file provided for OCR" }, { status: 400 });
    }

    if (!text || text.trim().length === 0) {
      safeLogger.warn("OCR:API", `OCR produced zero readable characters for ${fileName}`);
      return NextResponse.json(
        {
          error: "No readable text could be recognized from the uploaded image. Please ensure the image is clear, upright, and contains legible text.",
        },
        { status: 422 }
      );
    }

    safeLogger.info("OCR:API", `Extracted ${text.length} characters from ${fileName}`);
    const analysis = analyzeDocumentContent(text, fileName);

    const documentData = {
      id: generateId("doc"),
      name: fileName,
      size: file ? file.size : text.length,
      type: file ? file.type : "image/png",
      pageCount: 1,
      language: analysis.language,
      detectedSubject: analysis.detectedSubject,
      detectedClass: analysis.detectedClass,
      chapters: analysis.chapters,
      keyConcepts: analysis.keyConcepts,
      extractedText: text,
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, document: documentData });
  } catch (error: any) {
    safeLogger.error("OCR:API", `OCR endpoint failure: ${error?.message}`, error);
    return NextResponse.json({ error: error?.message || "OCR processing failed" }, { status: 500 });
  }
}
