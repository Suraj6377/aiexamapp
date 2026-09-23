import { safeLogger } from "../logger";

interface TesseractWorker {
  recognize: (img: Buffer | string) => Promise<{ data: { text: string } }>;
  terminate: () => Promise<unknown>;
}

/**
 * OCR extraction service using Tesseract.js.
 * Extracts text from PNG, JPG, and scanned image documents.
 * Supports English and Hindi character recognition.
 * Does NOT return mock or fake text on failure.
 */
export async function performOcr(
  imageBufferOrBase64: Buffer | string,
  onProgress?: (progress: number, status: string) => void
): Promise<string> {
  const { createWorker } = await import("tesseract.js");

  let worker: TesseractWorker | null = null;
  try {
    // 1. Attempt dual English + Hindi character recognition
    worker = (await createWorker(["eng", "hin"], 1, {
      logger: (m) => {
        if (m.status === "recognizing text" && onProgress) {
          onProgress(Math.round((m.progress || 0) * 100), "Performing optical character recognition...");
        }
      },
    })) as unknown as TesseractWorker;

    const ret = await worker.recognize(imageBufferOrBase64);
    await worker.terminate();
    worker = null;

    const extracted = ret.data.text ? ret.data.text.trim() : "";
    return extracted;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    safeLogger.warn("OCR", `Dual eng+hin OCR failed: ${errorMsg}. Retrying with English model...`);
    if (worker) {
      try {
        await worker.terminate();
      } catch {}
      worker = null;
    }

    // 2. Fallback to English model if multi-language traineddata download timed out
    try {
      worker = (await createWorker("eng", 1)) as unknown as TesseractWorker;
      const ret = await worker.recognize(imageBufferOrBase64);
      await worker.terminate();
      worker = null;

      const extracted = ret.data.text ? ret.data.text.trim() : "";
      return extracted;
    } catch (fallbackErr: unknown) {
      if (worker) {
        try {
          await worker.terminate();
        } catch {}
      }
      const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      safeLogger.error("OCR", `OCR processing completely failed: ${fallbackMsg}`, fallbackErr);
      throw new Error(`Optical Character Recognition failed: ${fallbackMsg || "Unable to extract text from this image"}`);
    }
  }
}
