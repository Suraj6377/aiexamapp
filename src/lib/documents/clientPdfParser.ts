"use client";

export interface PdfParseResult {
  text: string;
  pageCount: number;
  isScanned?: boolean;
  firstPageBlob?: Blob;
}

// Global cache promise for PDF.js script loading
let pdfjsLoadingPromise: Promise<any> | null = null;

function loadPdfJsScript(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("PDF.js can only be loaded in browser environment"));
  }

  if ((window as any).pdfjsLib) {
    return Promise.resolve((window as any).pdfjsLib);
  }

  if (pdfjsLoadingPromise) {
    return pdfjsLoadingPromise;
  }

  pdfjsLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;

    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      if (lib) {
        lib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(lib);
      } else {
        reject(new Error("pdfjsLib not found on window after script load"));
      }
    };

    script.onerror = () => {
      pdfjsLoadingPromise = null;
      reject(new Error("Could not load PDF extraction engine from CDN"));
    };

    document.head.appendChild(script);
  });

  return pdfjsLoadingPromise;
}

/**
 * Extracts plain text from a PDF file directly in the browser.
 * Works with files up to 25+ MB without hitting Vercel's 4.5 MB serverless limit.
 */
export async function extractTextFromPdfInBrowser(
  file: File,
  onProgress?: (progressPercent: number, stageMessage: string) => void
): Promise<PdfParseResult> {
  const arrayBuffer = await file.arrayBuffer();

  try {
    const pdfjsLib = await loadPdfJsScript();

    onProgress?.(30, "Opening PDF document...");

    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
      cMapPacked: true,
      standardFontDataUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/",
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages || 1;
    const extractedPages: string[] = [];

    // Extract text page by page with progress updates
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item: any) => (item.str ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (pageText) {
        extractedPages.push(pageText);
      }

      // Calculate progress between 30% and 85%
      const percent = Math.round(30 + ((pageNum / numPages) * 55));
      onProgress?.(percent, `Extracting text from page ${pageNum} of ${numPages}...`);
    }

    const fullText = extractedPages.join("\n\n").trim();

    // If PDF contains little to no text, check if it's a scanned/image PDF
    if (!fullText || fullText.length < 30) {
      try {
        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (ctx) {
          await firstPage.render({ canvasContext: ctx, viewport }).promise;
          const blob = await new Promise<Blob | null>((res) =>
            canvas.toBlob(res, "image/jpeg", 0.85)
          );

          return {
            text: fullText,
            pageCount: numPages,
            isScanned: true,
            firstPageBlob: blob || undefined,
          };
        }
      } catch (e) {
        console.warn("Could not render page preview for scanned PDF:", e);
      }
    }

    return {
      text: fullText,
      pageCount: numPages,
      isScanned: false,
    };
  } catch (error) {
    console.warn("PDF.js extraction failed or unavailable, attempting binary stream fallback:", error);

    // Fallback: parse raw buffer streams
    const fallbackText = extractTextFromPdfBufferFallback(arrayBuffer);
    if (fallbackText && fallbackText.length >= 30) {
      return {
        text: fallbackText,
        pageCount: 1,
        isScanned: false,
      };
    }

    throw error;
  }
}

/**
 * Lightweight fallback for extracting raw text from uncompressed PDF streams or ASCII blocks
 */
function extractTextFromPdfBufferFallback(buffer: ArrayBuffer): string {
  try {
    const bytes = new Uint8Array(buffer);
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const content = decoder.decode(bytes);

    // Extract text between BT (Begin Text) and ET (End Text) blocks or parenthesized text (string) Tj / TJ
    const textPieces: string[] = [];
    const tjRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
    let match: RegExpExecArray | null;

    while ((match = tjRegex.exec(content)) !== null) {
      const clean = match[1]
        .replace(/\\([()\\])/g, "$1")
        .replace(/\\[nrtbf]/g, " ")
        .trim();
      if (clean && clean.length > 1) {
        textPieces.push(clean);
      }
    }

    if (textPieces.length > 10) {
      return textPieces.join(" ");
    }

    // Secondary fallback: Extract visible unicode or readable ASCII runs of 4+ chars
    const readable = content
      .replace(/[^\x20-\x7E\t\n\r\u0900-\u097F]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return readable.length > 50 ? readable : "";
  } catch {
    return "";
  }
}
