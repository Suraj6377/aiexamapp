/**
 * PDF text extraction service.
 * Uses pdf-parse to extract raw text content, page counts, and metadata from PDF files.
 */
export async function parsePdfBuffer(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  try {
    // Dynamic require to prevent client bundling issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);
    return {
      text: data.text || "",
      pageCount: data.numpages || 1,
    };
  } catch (error: any) {
    console.warn("pdf-parse encountered an error, falling back to text extractor:", error);
    // Fallback: extract visible ASCII/UTF8 strings if pdf-parse fails on edge case
    const str = buffer.toString("utf8");
    const extracted = str.replace(/[^\x20-\x7E\t\n\r\u0900-\u097F]/g, " ").replace(/\s+/g, " ");
    return {
      text: extracted.length > 50 ? extracted : "Unable to extract text from this PDF file directly. Please check if it is scanned or password protected.",
      pageCount: 1,
    };
  }
}
