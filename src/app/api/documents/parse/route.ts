import { NextRequest, NextResponse } from "next/server";
import { parsePdfBuffer } from "@/lib/documents/pdfParser";
import { analyzeDocumentContent } from "@/lib/documents/contentAnalyzer";
import { generateId } from "@/lib/utils";
import { safeLogger } from "@/lib/logger";

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

      if (fileSize > 4.5 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File size (${(fileSize / (1024 * 1024)).toFixed(1)} MB) exceeds Vercel 4.5 MB serverless limit.` },
          { status: 413 }
        );
      }

      safeLogger.info("DocumentParse:API", `Parsing file: ${fileName} (${fileSize} bytes, type: ${fileType})`);
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
      fileSize = manualText.length;
      safeLogger.info("DocumentParse:API", `Parsing manual text (${manualText.length} characters)`);
    } else {
      return NextResponse.json({ error: "No file or text provided for analysis" }, { status: 400 });
    }

    const trimmed = (extractedText || "").trim();
    if (!trimmed || trimmed.length < 20) {
      return NextResponse.json(
        { error: "The document appears to be empty or contains insufficient text (minimum 20 characters required)." },
        { status: 422 }
      );
    }

    // Run semantic content analysis
    const analysis = analyzeDocumentContent(trimmed, fileName);
    safeLogger.info("DocumentParse:API", `Analysis completed for ${fileName}: detected ${analysis.chapters.length} chapters, ${analysis.keyConcepts.length} topics`);

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
      extractedText: trimmed,
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, document: documentData });
  } catch (error: any) {
    safeLogger.error("DocumentParse:API", `Parse error: ${error?.message}`, error);
    return NextResponse.json(
      { error: error?.message || "Failed to process document" },
      { status: 500 }
    );
  }
}
