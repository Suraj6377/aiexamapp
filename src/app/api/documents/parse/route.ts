import { NextRequest, NextResponse } from "next/server";
import { parsePdfBuffer } from "@/lib/documents/pdfParser";
import { analyzeDocumentContent } from "@/lib/documents/contentAnalyzer";
import { generateId } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const manualText = formData.get("text") as string | null;

    let extractedText = "";
    let fileName = "Uploaded Document";
    let fileSize = 0;
    let fileType = "text/plain";
    let pageCount = 1;

    if (file) {
      fileName = file.name;
      fileSize = file.size;
      fileType = file.type || "application/octet-stream";

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (file.name.toLowerCase().endsWith(".pdf") || fileType.includes("pdf")) {
        const parsed = await parsePdfBuffer(buffer);
        extractedText = parsed.text;
        pageCount = parsed.pageCount;
      } else if (fileType.startsWith("image/")) {
        // Return image info for OCR step
        return NextResponse.json({
          requiresOcr: true,
          fileName,
          fileSize,
          fileType,
          message: "Image document detected. Please run OCR to extract text.",
        });
      } else {
        // Plain text, markdown, or code
        extractedText = buffer.toString("utf8");
      }
    } else if (manualText) {
      extractedText = manualText;
    } else {
      return NextResponse.json({ error: "No file or text provided" }, { status: 400 });
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: "Document appears empty or text could not be extracted directly." },
        { status: 422 }
      );
    }

    // Run semantic content analysis
    const analysis = analyzeDocumentContent(extractedText, fileName);

    const documentData = {
      id: generateId("doc"),
      name: fileName,
      size: fileSize,
      type: fileType,
      pageCount: Math.max(pageCount, analysis.pageCount),
      language: analysis.language,
      detectedSubject: analysis.detectedSubject,
      detectedClass: analysis.detectedClass,
      chapters: analysis.chapters,
      keyConcepts: analysis.keyConcepts,
      extractedText,
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, document: documentData });
  } catch (error: any) {
    console.error("Error parsing document:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process document" },
      { status: 500 }
    );
  }
}
