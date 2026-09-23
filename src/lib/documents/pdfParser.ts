import { safeLogger } from "../logger";

/**
 * PDF text extraction service.
 * Uses pdf-parse to extract raw text content, page counts, and metadata from PDF files.
 * Does NOT return mock or placeholder strings as actual document content.
 */
export async function parsePdfBuffer(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  try {
    // Dynamic require to prevent client bundling issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);

    const extractedText = (data.text || "").trim();
    if (!extractedText || extractedText.length < 20) {
      // Check if visible unicode/ASCII characters exist
      const str = buffer.toString("utf8");
      const fallbackExtracted = str.replace(/[^\x20-\x7E\t\n\r\u0900-\u097F]/g, " ").replace(/\s+/g, " ").trim();
      if (fallbackExtracted.length > 100) {
        return {
          text: fallbackExtracted,
          pageCount: data.numpages || 1,
        };
      }

      throw new Error(
        "No digital text found in this PDF. It appears to be a scanned document or image-only PDF. Please upload pages as image files (PNG/JPG) to perform Optical Character Recognition (OCR)."
      );
    }

    return {
      text: extractedText,
      pageCount: data.numpages || 1,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    safeLogger.warn("PDFParser", `PDF extraction error: ${msg}`);
    throw error;
  }
}
