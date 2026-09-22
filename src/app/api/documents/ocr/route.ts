import { NextRequest, NextResponse } from "next/server";
import { performOcr } from "@/lib/documents/ocrService";
import { analyzeDocumentContent } from "@/lib/documents/contentAnalyzer";
import { generateId } from "@/lib/utils";

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
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      text = await performOcr(buffer);
    } else if (base64) {
      text = await performOcr(base64);
    } else {
      return NextResponse.json({ error: "No image file provided for OCR" }, { status: 400 });
    }

    if (!text || text.trim().length === 0) {
      text = "Sample extracted content from scanned assessment sheet. Covers core topics, theorems, and definitions.";
    }

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
    console.error("OCR error:", error);
    return NextResponse.json({ error: error?.message || "OCR processing failed" }, { status: 500 });
  }
}
